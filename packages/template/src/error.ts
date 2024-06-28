import { BtplToken } from './template/types'

export class XiuError extends Error {
	msg: string
	key: string
	funcKey: string

	constructor(msg: string, key: string, funcKey: string) {
		super()
		this.msg = msg
		this.key = key
		this.funcKey = funcKey
	}

	show() {
		return `key:${this.key};func=${this.funcKey};\nmsg=${this.msg}`
	}
}

export class XiuParserError extends Error {
	msg: string
	start: number
	end: number

	constructor(msg: string, token: BtplToken) {
		super()
		this.msg = msg.replace('$1', token[0])
		this.start = token[1]
		this.end = token[2]
	}
}
