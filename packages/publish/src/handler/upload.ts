import { input } from '@inquirer/prompts'
import { execAsync, printLoading } from '../utils'
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
	try {
		close = printLoading('上传中')
		await execAsync(command, ctx.pkg?.path)
		close()
	} catch (error) {
		if (close) close()
		throw new XiuError('41000', `${ctx.pkg?.name}@${ctx.pkg?.v}`)
	}
}
