import { XiuError } from '../error/xiu-error'
import { XiuContext } from '../option'
import { loading, logger } from '../utils'

export const networkCheck = async (ctx: XiuContext) => {
	if (ctx.network) {
		let close: Function | undefined
		try {
			close = loading('检查中', 8, '40000')
			await fetch(ctx.registry, { method: 'GET' })
			close()
			logger('检查成功,ok')
		} catch (error) {
			if (close) close()
			throw new XiuError('40000')
		}
	}
}
