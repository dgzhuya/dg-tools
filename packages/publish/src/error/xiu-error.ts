import CodeMsg from './code-msg.json'
import { Template, formatErrorMsg } from './fomart-msg'

export class XiuError extends Error {
	#code: string

	constructor(code: keyof typeof CodeMsg, msgs?: string[]) {
		super()
		this.#code = code
		const codeMsg = CodeMsg[code]
		if (codeMsg.includes('%s') && msgs) {
			this.message = formatErrorMsg(codeMsg as Template<'%s'>, msgs)
		} else {
			this.message = codeMsg
		}
	}

	toString() {
		return `Caught a error code: ${this.#code},message=${this.message}`
	}
}
