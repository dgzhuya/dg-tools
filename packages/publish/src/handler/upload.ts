import { input } from '@inquirer/prompts'
import { execAsync, logger, printLoading } from '../utils'
import { XiuContext } from '../option'
import { XiuError } from '../error/xiu-error'

export const uploadHandler = async (ctx: XiuContext) => {
	let command =
		'npm publish --access=public --registry=https://registry.npmjs.org '
	try {
		if (ctx.otp) {
			const otpCode = await input({ message: '请输入单次验证码: ' })
			command += `--otp=${otpCode}`
		}
	} catch (error) {
		throw new XiuError('21000', 'inquirer-input')
	}

	let close: Function | undefined
	let timer: NodeJS.Timeout | undefined
	try {
		close = printLoading('上传中')
		timer = setTimeout(() => {
			logger('发布超时,请检查网络设置', 'fail')
			process.exit(1)
		}, 20000)
		await execAsync(command, ctx.pkg?.path)
		close()
		clearTimeout(timer)
	} catch (error) {
		if (close) close()
		if (timer) clearTimeout(timer)
		throw new XiuError('41000', `${ctx.pkg?.name}@${ctx.pkg?.v}`)
	}
}
