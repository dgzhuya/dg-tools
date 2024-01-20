import { XiuError } from '../error/xiu-error'
import { XiuContext, XiuFn } from '../option'
import { logger } from '../utils'

export const loggerHandler = async (_: XiuContext, next: XiuFn) => {
	try {
		await next()
	} catch (error) {
		if (error instanceof XiuError) {
			logger(error, 'fail')
		}
	}
}
