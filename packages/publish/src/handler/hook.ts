import { XiuContext } from '../option'
import { execAsync } from '../utils'

export const hookHandler = async (ctx: XiuContext) => {
	if (ctx.build) {
		await execAsync('npm run build', ctx.cwdPath)
	}
	if (ctx.hook) {
		await execAsync(ctx.hook, ctx.cwdPath)
	}
}
