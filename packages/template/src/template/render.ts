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
				? unknown[]
				: void

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

	andHook() {}

	#getValueByConfig<T extends LiteralType>(
		value: LiteralValue,
		type: T
	): LiteralValueResult<T> {
		const { token, upper, negation } = value
		const source = upper
			? this.#forStack[this.#forStack.length - upper]
			: this.#config
		const renderVal = source[token[0]]
		if (!renderVal) {
			throw new XiuParserError('$1的值不存在', token)
		}
		if (typeof renderVal !== type) {
			const msg = `$1的类型与获取的值${renderVal}类型不匹配`
			throw new XiuParserError(msg, token)
		}
		if (negation && type === 'boolean') {
			return !(renderVal as boolean) as LiteralValueResult<T>
		}
		return renderVal as LiteralValueResult<T>
	}
}
