import { PublishOption } from './option'
import { checkGit, checkProjectGit, logger } from './utils'
import { pkgInfoHandler } from './handler/pkgHandler'
import { versionHandler } from './handler/versionHandler'

export const publishHandler = async (option: PublishOption) => {
    let command = 'npm publish --access=public --registry=registry.npmjs.org '
    try {
        const pkg = await pkgInfoHandler(option.work)
        await versionHandler(pkg)
        console.log('pkg: ', pkg)
    } catch (error) {
        logger(error, 'fail')
        return
    }

    if (option.commit) {
        try {
            await checkGit()
            await checkProjectGit()
        } catch (error) {
            logger(error, 'fail')
            return
        }
    }

    if (option.otp) {
        // const otpCode = await input({ message: '请输入二次验证码' })
        command += `--otp=${111}`
    }
}
