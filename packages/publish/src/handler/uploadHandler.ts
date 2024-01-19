import { input } from '@inquirer/prompts'
import { execAsync, printLoading } from '../utils'
import { PackageInfo } from '../option'

export const uploadHandler = async (pkg: PackageInfo, opt?: boolean) => {
	let command =
		'npm publish --access=public --registry=https://registry.npmjs.org '
	let close: Function | undefined
	try {
		if (opt) {
			const otpCode = await input({ message: '请输入单次验证码: ' })
			command += `--otp=${otpCode}`
		}
		close = printLoading('上传中')
		await execAsync(command, pkg.path)
		close()
	} catch (error) {
		if (close) close()

		throw error
	}
}
