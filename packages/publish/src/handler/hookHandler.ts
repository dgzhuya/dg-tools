import { XiuContext } from '../option'
import { execAsync } from '../utils'

export const hookHandler = async (ctx: XiuContext) => {
	if (ctx.hook) {
		await execAsync('npm run build')
	}
}
