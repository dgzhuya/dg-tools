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

let isEatEnd = false
export class RenderParser extends Parser<string> {
	#plugins: Record<string, Function>
	#config: Config<Kind>
	#forStack: any[] = []
	#renderCache: string[][] = []

	constructor(
		source: string,
		config: Config<Kind>,
		plugins: Record<string, Function>
	) {
		super(source)
		this.#config = config
		this.#plugins = plugins
		this.#renderCache.push([])
	}

	render() {
		return this.parseBlock()
	}

	#pushLine(content: string, append = false) {
		if (append && this.#cache.length) {
			this.#cache[this.#cache.length - 1] += content
			return
		}
		this.#cache.push(content)
	}

	get #cache() {
		return this.#renderCache[this.#renderCache.length - 1]
	}

	#clearStatEnd() {
		const pos = this.pos
		while ([' ', '\t'].includes(this.peek())) {
			this.goNext()
		}
		const char = this.peek()
		if (['\n', '\r'].includes(char)) {
			this.goNext()
			if (char === '\r' && this.peek() === '\n') {
				this.goNext()
			}
			isEatEnd = true
		} else {
			this.jump(pos)
		}
	}

	protected parseBlock(isNest = false): string {
		if (isNest) {
			this.#renderCache.push([])
		}
		let curLine = ''
		let isEmpty = true
		let isAppend = false
		let insertLine = false

		const resetLine = () => {
			curLine = ''
			isEmpty = true
			isAppend = false
		}
		while (this.hasNext()) {
			const char = this.next()
			if (this.isStat(char)) {
				const [key, stat] = this.parseStat()
				if (!key) {
					isEatEnd = false
					insertLine = false
				}

				if (['if', 'for', 'and', 'or', 'end'].includes(key)) {
					if (insertLine && isEmpty) {
						this.#cache.push('')
						insertLine = false
					}
					isAppend = true
					if (isEmpty) curLine = ''
					curLine += stat || ''
					this.#pushLine(curLine, true)
					isEmpty = true
					curLine = ''
					if (key === 'end') {
						const res = this.#cache.join('\n')
						this.#renderCache.pop()
						return res
					}
					continue
				}
				curLine += stat || ''
				isEmpty = false
				continue
			}
			if (['\r', '\n'].includes(char)) {
				if (isEatEnd) {
					insertLine = true
					isEatEnd = false
				}
				this.#pushLine(curLine, isAppend)
				resetLine()
				if (char === '\r' && this.peek() === '\n') {
					this.goNext()
				}
				continue
			}
			isEatEnd = false
			if (isEmpty && !['\t', ' '].includes(char)) {
				isEmpty = false
			}
			curLine += char
		}
		if (!isEmpty && curLine) {
			this.#pushLine(curLine, isAppend)
		}
		this.checkStack()
		return this.#cache.join('\n')
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
						this.#clearStatEnd()
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
		this.#clearStatEnd()
		const isAnd = tokens[1][0] === 'and'
		const stackToken = tokens[tokens.length - 1]
		const val = params
			.map(p => this.#getValueByConfig(p, 'boolean'))
			.reduce((p, c) => (isAnd ? p && c : p || c))
		return val ? this.parseBlock(true) : this.skipBlock(stackToken)
	}

	@SetStatHook('if')
	protected ifStatHook(tokens: BtplToken[], cond: LiteralValue) {
		this.#clearStatEnd()
		const stackToken = tokens[tokens.length - 1]
		const val = this.#getValueByConfig(cond, 'boolean')
		return val ? this.parseBlock(true) : this.skipBlock(stackToken)
	}

	@SetStatHook('for')
	protected forStatHook(tokens: BtplToken[], list: LiteralValue) {
		this.#clearStatEnd()
		const stackToken = tokens[tokens.length - 1]
		const val = this.#getValueByConfig(list, 'object')
		const curForIndex = this.#forStack.length
		if (val.length === 0) {
			return this.skipBlock(stackToken)
		}
		const startPos = this.pos
		let result = ''
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
		this.#clearStatEnd()
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
