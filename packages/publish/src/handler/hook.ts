import { XiuError } from '../error/xiu-error'
import { XiuContext } from '../option'
import { execAsync } from '../utils'

export const hookHandler = async (ctx: XiuContext) => {
	try {
		if (ctx.build) await execAsync('npm run build', ctx.pkg?.path)
	} catch (error) {
		throw new XiuError('30004')
	}
	try {
		if (ctx.hook) await execAsync(ctx.hook, ctx.pkg?.path)
	} catch (error) {
		throw new XiuError('30005')
	}
}
