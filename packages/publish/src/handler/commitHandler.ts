import { input } from '@inquirer/prompts'
import { checkGit, checkProjectGit, gitCommit } from '../utils'
import { PackageInfo } from '../option'

export const commitHandler = async (pkg: PackageInfo, commit?: boolean) => {
	if (commit) {
		try {
			await checkGit()
			await checkProjectGit()
			const commitInfo = await input({
				message: '请输入提交信息: ',
				default: `🔧 build: 发布版本${pkg.v}`
			})
			gitCommit(commitInfo, [pkg.path])
		} catch (error) {
			throw error
		}
	}
}
