import { input } from '@inquirer/prompts'
import { execAsync } from '../utils'
import { PackageInfo } from '../option'

export const uploadHandler = async (pkg: PackageInfo, opt?: boolean) => {
	let command =
		'npm publish --access=public --registry=https://registry.npmjs.org '
	try {
		if (opt) {
			const otpCode = await input({ message: '请输入单次验证码: ' })
			command += `--otp=${otpCode}`
		}
		await execAsync(command, pkg.path)
	} catch (error) {
		throw error
	}
}
