import CodeMsg from './code-msg.json'

export class XiuError extends Error {
	#code: number

	constructor(code: keyof typeof CodeMsg) {
		super()
		this.message = CodeMsg[code]
		this.#code = code
	}

	toString() {
		return `Caught a error code: ${this.#code},message=${this.message}`
	}
}
