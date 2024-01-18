import { execAsync } from './shell'

export const checkGit = async () => {
    try {
        return await execAsync('git version')
    } catch (error) {
        throw new Error('请安装git')
    }
}

export const checkProjectGit = async () => {
    try {
        return await execAsync('git status')
    } catch (error) {
        throw new Error('项目未使用git')
    }
}

export const gitCommit = async (message: string, files: string[]) => {
    try {
        return await execAsync(`git commit ${files.join(' ')} -m '${message}'`)
    } catch (error) {
        console.log('error: ', error)
        throw new Error('提交失败')
    }
}
