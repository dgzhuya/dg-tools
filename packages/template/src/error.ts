export class XiuError extends Error {
	message: string

	constructor(msg: string) {
		super()
		this.message = msg
	}
}
