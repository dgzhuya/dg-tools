import { Parser } from '.'
import { XiuParserError } from '../error'
import type { BtplToken, LiteralType, LiteralValue } from './types'
import { concatValue, SetStatHook } from './utils'

export class TypeKeyParser extends Parser {
	#keymaps: Record<string, string> = {}
	#forStack: Record<string, string>[] = []

	parseKeys() {
		this.parseBlock()
		return this.#keymaps
	}

	checkError() {
		try {
			this.parseBlock()
		} catch (error) {
			if (error instanceof XiuParserError) {
				const { msg, start, end } = error
				return { msg, start, end }
			}
		}
	}

	parseBlock() {
		while (this.hasNext()) {
			const char = this.next()
			if (this.isStat(char)) {
				this.parseStat()
			}
		}
		this.checkStack()
	}

	@SetStatHook('simple')
	simpleHook(_: BtplToken[], value: LiteralValue) {
		this.#setValueType(value)
	}

	@SetStatHook('func')
	funcHook([_, [key]]: BtplToken[], ...params: LiteralValue[]) {
		params.forEach(p => {
			this.#setValueType(p, key.endsWith('Int') ? 'number' : 'string')
		})
	}

	@SetStatHook('or')
	@SetStatHook('and')
	andOrStatHook(_: BtplToken, ...params: LiteralValue[]) {
		params.forEach(p => this.#setValueType(p, 'boolean'))
	}

	@SetStatHook('for')
	forStatHook(_: BtplToken[], { token }: LiteralValue) {
		if (this.#forStack.length > 0) {
			const forKeys = this.#forStack.map(i => i['__main'])
			if (forKeys.includes(token[0])) {
				throw new XiuParserError('循环$1不能嵌套自身', token)
			}
		}
		const forTypeRecord: Record<string, string> = {
			__main: token[0]
		}
		forTypeRecord['i'] = 'number'
		const oldForType = this.#keymaps[token[0]]
		if (oldForType) {
			if (['string', 'boolean', 'number'].includes(oldForType)) {
				const msg = `常量$1类型已确定为${oldForType},不能设置为数组类型`
				throw new XiuParserError(msg, token)
			}
			if (oldForType !== 'unknown[]') {
				const oldTpList = oldForType
					.replace('{', '')
					.replace('}[]', '')
					.split(';')
					.map(s => s.split(':'))
				oldTpList.forEach(([key, val]) => {
					forTypeRecord[key] = val
				})
			}
		}
		this.#forStack.push(forTypeRecord)
	}

	@SetStatHook('if')
	ifStatHook(_: BtplToken[], cond: LiteralValue) {
		this.#setValueType(cond, 'boolean')
	}

	@SetStatHook('end')
	endStatHook(_: BtplToken[], { token }: LiteralValue) {
		if (token[0].startsWith('for')) {
			const forTp = this.#forStack.pop()
			if (!forTp) throw new XiuParserError('$1循环错误', token)
			const key = forTp['__main']
			const list = Object.entries(forTp)
				.filter(([key, _]) => !['__main', 'i'].includes(key))
				.map(([k, v]) => `${k}:${v}`)
			const listType = list.length ? `{${list.join(';')}}[]` : 'unknown[]'
			this.#keymaps[key] = listType
		}
	}

	#setValueType(value: LiteralValue, valTp: LiteralType = 'string') {
		const { token, upper } = value
		const setMap = upper
			? this.#forStack[this.#forStack.length - upper]
			: this.#keymaps
		const savedType = setMap[token[0]]
		if (upper && token[0] === 'i') {
			return
		}
		if (savedType && savedType !== valTp) {
			const upperKey = upper ? '变' : '常'
			const msg = `${upperKey}量$1类型已确定为${savedType},不能设置为${valTp}类型`
			throw new XiuParserError(msg, concatValue(value))
		}
		setMap[token[0]] = valTp
	}
}
