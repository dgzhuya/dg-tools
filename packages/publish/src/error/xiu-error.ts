import CodeMsg from './code-msg.json'
import { Template, formatErrorMsg } from './fomart-msg'

export type MessageKey = keyof typeof CodeMsg

type ErrorType = 1 | 2 | 3 | 4 | 5
type Params = '0' | '1' | '2' | '3'
type BuildString<
	Length extends Params,
	Arr extends string[] = []
> = `${Arr['length']}` extends Length
	? Arr
	: BuildString<Length, [...Arr, string]>

type BuildMsg<T extends string> = T extends `${ErrorType}${infer Num}${string}`
	? Num extends Params
		? BuildString<Num>
		: never
	: never

export class XiuError<T extends MessageKey = MessageKey> extends Error {
	#code: T

	constructor(code: T, ...msgs: BuildMsg<T>) {
		super()
		this.#code = code
		const codeMsg = CodeMsg[code]
		if (codeMsg.includes('%s') && msgs.length > 0) {
			this.message = formatErrorMsg(codeMsg as Template<'%s'>, msgs)
		} else {
			this.message = codeMsg
		}
	}

	toString() {
		return `Caught a error code: ${this.#code},${this.message}`
	}
}
