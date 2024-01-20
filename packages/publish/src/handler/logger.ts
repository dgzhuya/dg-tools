import { XiuError } from '../error/xiu-error'
import { XiuContext, XiuFn } from '../option'
import { gitCheckoutFile, logError } from '../utils'

export const loggerHandler = async (ctx: XiuContext, next: XiuFn) => {
	try {
		await next()
	} catch (error) {
		if (ctx.runTier >= 5) {
			gitCheckoutFile(ctx.pkgJson).catch(err => logError(err))
		}
		if (error instanceof XiuError) {
			logError(error)
		}
	}
}
