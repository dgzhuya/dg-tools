import { XiuParserError } from '../error'
import { TemplateLexer } from './lexer'
import { concatToken, concatValue } from './utils'
import type { BtplToken, LiteralValue, StatHookKey } from './types'

type ParserFuncType<T> = (prefix: BtplToken, token: BtplToken) => void | T

type HookFunc<T> = (tokens: BtplToken[], ...args: LiteralValue[]) => void | T

export abstract class Parser<T = void> {
	protected stack: BtplToken[] = []

	#lexer: TemplateLexer
	#statHooks: Record<string, HookFunc<T>> = {}
	#forScope = 0

	#keywords: Record<string, ParserFuncType<T>> = {
		if: (p, t) => this.#parseIfStat(p, t),
		end: (p, t) => this.#parseEndStat(p, t),
		for: (p, t) => this.#parseForStat(p, t),
		and: (p, t) => this.#parseAndOrStat(p, t),
		or: (p, t) => this.#parseAndOrStat(p, t)
	}

	protected get pos() {
		return this.#lexer.pc
	}

	protected peek() {
		return this.#lexer.peek()
	}

	protected goNext() {
		this.#lexer.goNext()
	}

	protected hasNext() {
		return this.#lexer.hasNext()
	}

	protected next() {
		return this.#lexer.next()
	}

	protected isStat(char: string) {
		return this.#lexer.checkBlockStart(char)
	}

	protected jump(pos: number) {
		return this.#lexer.jump(pos)
	}

	protected forNext() {
		this.#forScope++
	}

	#runHook(name: StatHookKey, tokens: BtplToken[], ...args: LiteralValue[]) {
		const hook = this.#statHooks[name]
		if (hook) return hook(tokens, ...args)
	}

	constructor(source: string) {
		this.#lexer = new TemplateLexer(source)
		const prototypeList = (this.constructor as any).__list
		if (prototypeList) {
			for (const key in prototypeList) {
				if (prototypeList.hasOwnProperty(key)) {
					this.#statHooks[key] = prototypeList[key].bind(this)
				}
			}
		}
	}

	#parseLiteral(allowNegation = false): LiteralValue {
		let negation = false
		const prefix: BtplToken[] = []
		if (allowNegation && this.#lexer.checkToken('!')) {
			prefix.push(['!', this.#lexer.pc, this.#lexer.pc + 1])
			negation = true
			this.#lexer.goNext()
		}
		if (this.#lexer.checkToken('$')) {
			let upper = 0
			const upperToken: BtplToken = ['', this.#lexer.pc, 0]
			while (this.#lexer.hasNext()) {
				if (this.#lexer.checkToken('$')) {
					this.#lexer.goNext()
					upperToken[0] += '$'
					upper++
					continue
				}
				break
			}
			upperToken[2] = this.#lexer.pc
			prefix.push(upperToken)
			const token = this.#lexer.nextToken()
			if (upper > this.#forScope) {
				throw new XiuParserError(`变量$1超出作用域`, token)
			}
			return negation
				? { token, prefix, upper, negation }
				: { token, prefix, upper }
		}
		const token = this.#lexer.nextToken()
		return negation ? { token, prefix, negation } : { token }
	}

	#parseLiteralList(allowNegation = false): [LiteralValue[], BtplToken[]] {
		const list: LiteralValue[] = []
		const symbols: BtplToken[] = []
		if (this.#lexer.checkToken(']')) {
			return [list, symbols]
		}
		while (this.#lexer.hasNext()) {
			const item = this.#parseLiteral(allowNegation)
			list.push(item)
			if (this.#lexer.checkToken(']')) {
				symbols.unshift(this.#lexer.verifyNextToken(']'))
				return [list, symbols]
			}
			symbols.push(this.#lexer.verifyNextToken(',', item.token))
		}
		throw new XiuParserError('未解析到结束符', list[list.length - 1].token)
	}

	#parseSimpleStat(prefix: BtplToken, token?: BtplToken) {
		const value = token ? { token } : this.#parseLiteral()
		const suffix = this.#lexer.verifyBlockEnd(value.token)
		return this.#runHook('simple', [prefix, suffix], value)
	}

	#parseFuncStat(prefix: BtplToken, token: BtplToken) {
		this.#lexer.skipEmpty()
		if (!['@', '$'].includes(this.#lexer.peek())) {
			throw new XiuParserError('$1函数缺少参数', token)
		}
		const opToken = this.#lexer.verifyNextToken('@[', token)
		const [params, commas] = this.#parseLiteralList()
		if (params.length === 0) {
			throw new XiuParserError('函数$1缺少参数', token)
		}
		const suffix = this.#lexer.verifyBlockEnd(
			params[params.length - 1].token
		)
		return this.#runHook(
			'func',
			[prefix, token, opToken, suffix, ...commas],
			...params
		)
	}

	#parseAndOrStat(prefix: BtplToken, token: BtplToken) {
		const opToken = this.#lexer.verifyNextToken('@[', token)
		const [params, commas] = this.#parseLiteralList(true)
		if (params.length === 0) {
			throw new XiuParserError('$1参数不能为空', token)
		}
		const stackToken = concatToken(token, opToken, concatValue(...params))
		this.stack.push(stackToken)
		const suffix = this.#lexer.verifyBlockEnd(stackToken)
		return this.#runHook(
			token[0] === 'and' ? 'and' : 'or',
			[prefix, token, opToken, suffix, ...commas],
			...params
		)
	}

	#parseForStat(prefix: BtplToken, token: BtplToken) {
		const opToken = this.#lexer.verifyNextToken('@', token)
		this.#forScope++
		const list = this.#parseLiteral()
		const forToken = concatToken(token, opToken, concatValue(list))
		this.stack.push(forToken)
		const suffix = this.#lexer.verifyBlockEnd(token)
		return this.#runHook('for', [prefix, token, opToken, suffix], list)
	}

	#parseIfStat(prefix: BtplToken, token: BtplToken) {
		const opToken = this.#lexer.verifyNextToken('@', token)
		const cond = this.#parseLiteral(true)
		const ifToken = concatToken(token, opToken, concatValue(cond))
		this.stack.push(ifToken)
		const suffix = this.#lexer.verifyBlockEnd(token)
		return this.#runHook('if', [prefix, token, opToken, suffix], cond)
	}

	#parseEndStat(prefix: BtplToken, token: BtplToken) {
		const opToken = this.#lexer.verifyNextToken('@', token)
		const stackType = this.stack.pop()
		if (!stackType) throw new XiuParserError('end语句不在范围内', token)

		if (stackType[0].startsWith('for')) {
			this.#forScope--
			if (this.#forScope < 0) {
				throw new XiuParserError('end超出for范围', token)
			}
		}
		const suffix = this.#lexer.verifyBlockEnd(token)
		return this.#runHook('end', [prefix, token, opToken, suffix], {
			token: stackType
		})
	}

	protected parseStat(): [boolean, T | void] {
		const prefix = this.#lexer.verifyNextToken('{%')
		this.#lexer.skipEmpty()
		if (this.#lexer.checkToken('$')) {
			return [false, this.#parseSimpleStat(prefix)]
		}
		const token = this.#lexer.nextToken()
		const parseFunc = this.#keywords[token[0]]
		if (parseFunc) return [token[0] === 'end', parseFunc(prefix, token)]

		if (this.#lexer.checkToken('@')) {
			return [false, this.#parseFuncStat(prefix, token)]
		}
		return [false, this.#parseSimpleStat(prefix, token)]
	}

	protected codeSkip() {
		this.#lexer.verifyNextToken('{%')
		this.#lexer.skipEmpty()
		if (this.#lexer.checkToken('$')) {
			this.#lexer.goNext()
		}
		const token = this.#lexer.nextToken()
		while (this.#lexer.hasNext()) {
			const char = this.#lexer.next()
			if (char === '%' && this.#lexer.peek() === '}') {
				this.#lexer.goNext()
				return token[0]
			}
		}
		throw new XiuParserError('$1缺少结束符', token)
	}

	protected checkStack() {
		if (this.stack.length !== 0) {
			const token = this.stack[this.stack.length - 1]
			throw new XiuParserError('$1语句缺少end', token)
		}
	}

	protected abstract parseBlock(): void
}
