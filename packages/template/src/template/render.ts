import { Parser } from '.'
import { XiuParserError } from '../error'
import type { Config, Kind } from '../types'
import type { BtplToken, LiteralType, LiteralValue } from './types'
import { SetStatHook, concatToken } from './utils'

type LiteralValueResult<T extends LiteralType> = T extends 'string'
	? string
	: T extends 'boolean'
		? boolean
		: T extends 'number'
			? number
			: T extends 'object'
				? any[]
				: void

export class RenderParser extends Parser<string> {
	#plugins: Record<string, Function>
	#config: Config<Kind>
	#forStack: any[] = []
	#curLine = ''
	#isEmptyLine = true
	#renderList: string[][] = []
	#prevIsBlock = false

	constructor(
		source: string,
		config: Config<Kind>,
		plugins: Record<string, Function>
	) {
		super(source)
		this.#config = config
		this.#plugins = plugins
		this.#renderList.push([''])
	}

	render() {
		return this.parseBlock()
	}

	#pushLine(notNext = false) {
		this.#lastRenderList.push(this.#curLine)
		this.#curLine = ''
		this.#isEmptyLine = true
		if (notNext) {
			this.#lastRenderList[0] += `$${this.#lastRenderList.length}`
		}
	}

	#listToStr(list: string[]) {
		const pos = list[0]
			.split('$')
			.filter(i => i)
			.map(s => parseInt(s))
		let result = list[1] || ''
		for (let i = 2; i < list.length; i++) {
			if (!pos.includes(i)) {
				result += '\n'
			}
			result += list[i]
		}
		return result
	}

	get #lastRenderList() {
		const index = this.#renderList.length ? this.#renderList.length - 1 : 0
		return this.#renderList[index]
	}

	#clearLine() {
		if (this.#isEmptyLine) {
			this.#curLine = ''
			if (!this.#prevIsBlock) {
				this.#lastRenderList[0] += `$${this.#lastRenderList.length}`
			}
		}
		const pos = this.pos
		while ([' ', '\t'].includes(this.peek())) {
			this.goNext()
		}
		const char = this.peek()
		if (char === '\n') {
			this.goNext()
		} else if (char === '\r') {
			this.goNext()
			if (this.peek() === '\n') this.goNext()
		} else {
			this.jump(pos)
		}
		this.#prevIsBlock = true
	}

	protected parseBlock(isNest = false): string {
		if (isNest) this.#renderList.push([''])
		while (this.hasNext()) {
			const char = this.next()
			if (this.isStat(char)) {
				if (!isNest || !this.#isEmptyLine) {
					this.#prevIsBlock = false
				}
				const [isEnd, stat] = this.parseStat()
				if (isEnd) {
					this.#pushLine()
					const top = this.#renderList.pop()
					const res = top ? this.#listToStr(top) : ''
					return res
				}
				this.#curLine += stat
				this.#pushLine(true)
			} else if (char === '\n') {
				if (!this.#isEmptyLine) {
					this.#prevIsBlock = false
				}
				this.#pushLine()
			} else if (char === '\r') {
				if (!this.#isEmptyLine) {
					this.#prevIsBlock = false
				}
				if (this.peek() === '\n') {
					this.#pushLine()
					this.goNext()
				}
			} else {
				if (this.#isEmptyLine && ![' ', '\t'].includes(char)) {
					this.#isEmptyLine = false
				}
				this.#curLine += char
			}
		}
		if (!this.#isEmptyLine) {
			this.#pushLine()
		}
		this.checkStack()
		return this.#listToStr(this.#lastRenderList)
	}

	protected skipBlock(token: BtplToken): string {
		let scope = 0
		while (this.hasNext()) {
			const char = this.next()
			if (this.isStat(char)) {
				const tokenKey = this.codeSkip()
				if (tokenKey === 'end') {
					if (scope === 0) {
						this.stack.pop()
						const pos = this.pos
						while ([' ', '\t'].includes(this.peek())) {
							this.goNext()
						}
						const char = this.peek()
						if (char === '\n') {
							this.goNext()
						} else if (char === '\r') {
							this.goNext()
							if (this.peek() === '\n') this.goNext()
						} else {
							this.jump(pos)
						}
						return ''
					}
					scope--
				}
				if (['for', 'and', 'if', 'or'].includes(tokenKey)) {
					scope++
				}
			}
		}
		throw new XiuParserError(
			`$1条件缺少结束符,跳过失败`,
			concatToken(token, ['', 0, this.pos])
		)
	}

	@SetStatHook('simple')
	protected simpleHook(_: BtplToken[], value: LiteralValue) {
		return this.#getValueByConfig(value, 'string')
	}

	@SetStatHook('func')
	protected funcHook([_, token]: BtplToken[], ...params: LiteralValue[]) {
		let fn = this.#plugins[token[0]]
		if (fn === undefined) {
			throw new XiuParserError('$1函数不存在', token)
		}
		const funcType = token[0].endsWith('Int') ? 'number' : 'string'
		const list = params.map(p => this.#getValueByConfig(p, funcType))
		return fn(...list)
	}

	@SetStatHook('and')
	@SetStatHook('or')
	protected andOrHook(tokens: BtplToken[], ...params: LiteralValue[]) {
		this.#clearLine()
		const isAnd = tokens[1][0] === 'and'
		const stackToken = tokens[tokens.length - 1]
		const val = params
			.map(p => this.#getValueByConfig(p, 'boolean'))
			.reduce((p, c) => (isAnd ? p && c : p || c))
		return val ? this.parseBlock(true) : this.skipBlock(stackToken)
	}

	@SetStatHook('if')
	protected ifStatHook(tokens: BtplToken[], cond: LiteralValue) {
		this.#clearLine()
		const stackToken = tokens[tokens.length - 1]
		const val = this.#getValueByConfig(cond, 'boolean')
		const res = val ? this.parseBlock(true) : this.skipBlock(stackToken)
		return res
	}

	@SetStatHook('for')
	protected forStatHook(tokens: BtplToken[], list: LiteralValue) {
		this.#clearLine()
		let result = ''
		const stackToken = tokens[tokens.length - 1]
		const val = this.#getValueByConfig(list, 'object')
		const curForIndex = this.#forStack.length
		if (val.length === 0) {
			return this.skipBlock(stackToken)
		}
		const startPos = this.pos
		this.#forStack.push('')
		for (let i = 0; i < val.length; i++) {
			let item = val[i]
			if (item && typeof item === 'object') {
				item['i'] = i
			} else {
				item = { i }
			}
			this.#forStack[curForIndex] = item
			const res = this.parseBlock(true)
			result += res
			if (i < val.length - 1) {
				this.jump(startPos)
				this.forNext(stackToken)
			}
		}
		return result
	}

	@SetStatHook('end')
	protected endStatHook(_: BtplToken[], { token }: LiteralValue) {
		this.#clearLine()
		if (token[0].startsWith('for')) {
			if (this.#forStack.length === 0) {
				throw new XiuParserError('$1循环错误', token)
			}
			this.#forStack.pop()
		}
	}

	#getValueByConfig<T extends LiteralType>(
		value: LiteralValue,
		type: T
	): LiteralValueResult<T> {
		const { token, upper, negation } = value
		const source = upper
			? this.#forStack[this.#forStack.length - upper]
			: this.#config
		const renderVal = source[token[0]]
		if (
			type === 'string' &&
			typeof renderVal === 'number' &&
			upper &&
			token[0] === 'i'
		) {
			return `${renderVal}` as LiteralValueResult<T>
		}
		if (renderVal === undefined) {
			throw new XiuParserError('$1的值不存在', token)
		}
		if (typeof renderVal !== type) {
			const msg = `$1的类型与获取的值${renderVal}类型不匹配`
			throw new XiuParserError(msg, token)
		}

		if (type === 'object' && !Array.isArray(renderVal)) {
			const msg = `$1的类型应该为数组`
			throw new XiuParserError(msg, token)
		}
		if (negation && type === 'boolean') {
			return !(renderVal as boolean) as LiteralValueResult<T>
		}
		return renderVal as LiteralValueResult<T>
	}
}
