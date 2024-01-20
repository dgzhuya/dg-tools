import { XiuError } from '../error/xiu-error'
import { execAsync } from './shell'

export const checkGit = async () => {
	try {
		return await execAsync('git version')
	} catch (error) {
		throw new XiuError('30001')
	}
}

export const checkProjectGit = async () => {
	try {
		return await execAsync('git status')
	} catch (error) {
		throw new XiuError('30002')
	}
}

export const gitCommit = async (message: string, files: string[]) => {
	try {
		return await execAsync(`git commit ${files.join(' ')} -m '${message}'`)
	} catch (error) {
		throw new XiuError('30003')
	}
}
