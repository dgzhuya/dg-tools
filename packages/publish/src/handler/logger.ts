import { XiuError } from '../error/xiu-error'
import { XiuContext, XiuFn } from '../option'

export const loggerHandler = async (ctx: XiuContext, next: XiuFn) => {
	try {
		await next()
	} catch (error) {
		if (error instanceof XiuError) {
			ctx.printError(error)
		}
	}
}
