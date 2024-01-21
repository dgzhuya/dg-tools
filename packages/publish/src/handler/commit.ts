import { input } from '@inquirer/prompts'
import { checkGit, checkProjectGit, gitCommit } from '../utils'
import { XiuContext } from '../option'
import { XiuError } from '../error/xiu-error'

export const commitHandler = async (ctx: XiuContext) => {
	if (ctx.commit) {
		await checkGit()
		await checkProjectGit()
		try {
			const commitInfo = await input({
				message: '请输入提交信息: ',
				default: `🔧 build: 发布版本${ctx.pkg?.v}`
			})
			await gitCommit(commitInfo, ctx.pkgJson)
		} catch (error) {
			if (error instanceof XiuError) {
				throw error
			} else {
				throw new XiuError('21000', 'inquirer')
			}
		}
	}
}
