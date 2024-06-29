import { Parser } from '.'
import { XiuParserError } from '../error'
import type { Config, Kind } from '../types'
import type { BtplToken, LiteralType, LiteralValue } from './types'
import { SetStatHook } from './utils'

type LiteralValueResult<T extends LiteralType> = T extends 'string'
	? string
	: T extends 'boolean'
		? boolean
		: T extends 'number'
			? number
			: T extends 'object'
				? any[]
				: void

type CondType = 'for' | 'and' | 'if' | 'or'

export class RenderParser extends Parser<string> {
	#plugins: Record<string, Function>
	#config: Config<Kind>
	#forStack: any[] = []

	constructor(
		source: string,
		config: Config<Kind>,
		plugins: Record<string, Function>
	) {
		super(source)
		this.#config = config
		this.#plugins = plugins
	}

	parseBlock(): string {
		let result = ''
		while (this.hasNext()) {
			const char = this.next()
			if (this.isStat(char)) {
				const [isEnd, stat] = this.parseStat()
				if (stat) result += stat
				if (isEnd) return result
			} else {
				result += char
			}
		}

		if (this.blockStack.length !== 0) {
			const token = this.blockStack[this.blockStack.length - 1]
			throw new XiuParserError('$1语句缺少end', token)
		}
		return result
	}

	skipBlock(type: CondType): string {
		let scope = 0
		const start = this.pos
		while (this.hasNext()) {
			const char = this.next()
			if (this.isStat(char)) {
				const tokenKey = this.codeSkip()
				if (tokenKey === 'end') {
					if (scope === 0) {
						this.blockStack.pop()
						return ''
					}
					scope--
				}
				if (['for', 'and', 'if', 'or'].includes(tokenKey)) {
					scope++
				}
			}
		}
		const token: BtplToken = [type, start, this.pos]
		throw new XiuParserError(`$1条件缺少结束符,跳过失败`, token)
	}

	render() {
		return this.parseBlock()
	}

	@SetStatHook('simple')
	simpleHook(_: BtplToken[], value: LiteralValue) {
		return this.#getValueByConfig(value, 'string')
	}

	@SetStatHook('func')
	funcHook([_, token]: BtplToken[], ...params: LiteralValue[]) {
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
	andOrHook([_, [tokenKey]]: BtplToken[], ...params: LiteralValue[]) {
		const isAnd = tokenKey === 'and'
		const val = params
			.map(p => this.#getValueByConfig(p, 'boolean'))
			.reduce((p, c) => (isAnd ? p && c : p || c))
		return val ? this.parseBlock() : this.skipBlock(isAnd ? 'and' : 'or')
	}

	@SetStatHook('if')
	ifStatHook(_: BtplToken[], cond: LiteralValue) {
		const val = this.#getValueByConfig(cond, 'boolean')
		return val ? this.parseBlock() : this.skipBlock('if')
	}

	@SetStatHook('for')
	forStatHook(_: BtplToken[], list: LiteralValue) {
		let result = ''
		const val = this.#getValueByConfig(list, 'object')
		const curForIndex = this.#forStack.length
		if (val.length === 0) {
			return this.skipBlock('for')
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
			result += this.parseBlock()
			if (i < val.length - 1) {
				this.jump(startPos)
				this.forNext()
			}
		}
		return result
	}

	@SetStatHook('end')
	endStatHook(_: BtplToken[], { token }: LiteralValue) {
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
			console.log(renderVal, source)
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
