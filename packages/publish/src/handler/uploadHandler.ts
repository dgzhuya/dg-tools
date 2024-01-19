import { input } from '@inquirer/prompts'
import { execAsync } from '../utils'

export const uploadHandler = async (opt?: boolean) => {
	let command = 'npm publish --access=public --registry=registry.npmjs.org '
	try {
		if (opt) {
			const otpCode = await input({ message: '请输入单次验证码: ' })
			command += `--otp=${otpCode}`
		}
		await execAsync(command)
	} catch (error) {
		throw error
	}
}
