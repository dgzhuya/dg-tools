export class XiuError extends Error {
	message: string
	key: string
	funcKey: string

	constructor(msg: string, key: string, funcKey: string) {
		super()
		this.message = msg
		this.key = key
		this.funcKey = funcKey
	}

	show() {
		return `key:${this.key};func=${this.funcKey};\nmsg=${this.message}`
	}
}
