import { input } from '@inquirer/prompts'
import { checkGit, checkProjectGit, gitCommit } from '../utils'
import { XiuContext } from '../option'

export const commitHandler = async (ctx: XiuContext) => {
	if (ctx.commit) {
		try {
			await checkGit()
			await checkProjectGit()
			const commitInfo = await input({
				message: '请输入提交信息: ',
				default: `🔧 build: 发布版本${ctx.pkg?.v}`
			})
			gitCommit(commitInfo, [ctx.pkg?.path || ''])
		} catch (error) {
			throw error
		}
	}
}
