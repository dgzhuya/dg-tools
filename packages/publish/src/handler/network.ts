import { XiuError } from '../error/xiu-error'
import { XiuContext } from '../option'
import { logger } from '../utils'

export const networkCheck = async (ctx: XiuContext) => {
	if (ctx.network) {
		let close: Function | undefined
		try {
			close = ctx.loading('检查中', 20, '40000')
			await fetch(ctx.registry, {
				method: 'GET'
			})
			close()
			logger('网络正常,ok')
			ctx.networkSuccess = true
		} catch (error) {
			if (close) close()
			throw new XiuError('40000')
		}
	}
}
