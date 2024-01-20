import { XiuError } from '../error/xiu-error'

export const logger = (
	msg: string | unknown,
	status: 'success' | 'fail' = 'success'
) => {
	if (status === 'success') {
		console.log('\x1b[32m', msg)
	} else {
		console.log('\x1b[31m', msg)
	}
}

export const logError = (error: XiuError) => logger(error.toString(), 'fail')
