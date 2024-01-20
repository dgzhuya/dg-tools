import { XiuError } from '../error/xiu-error'
import { XiuContext, XiuFn } from '../option'
import { gitCheckoutFile, logError } from '../utils'

export const loggerHandler = async (ctx: XiuContext, next: XiuFn) => {
	try {
		await next()
	} catch (error) {
		if (error instanceof XiuError) {
			if (ctx.runTier) gitCheckoutFile(...ctx.pkgJson)
			if (ctx.runTier > 4) logError(error)
		}
	}
}
