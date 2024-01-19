import { PublishOption } from './option'
import { logger } from './utils'
import { pkgInfoHandler } from './handler/pkgHandler'
import { versionHandler } from './handler/versionHandler'
import { uploadHandler } from './handler/uploadHandler'
import { commitHandler } from './handler/commitHandler'

export const publishHandler = async (option: PublishOption) => {
	try {
		const pkg = await pkgInfoHandler(option.work)
		await versionHandler(pkg)
		await uploadHandler(pkg, option.otp)
		await commitHandler(pkg, option.commit)
	} catch (error) {
		logger(error, 'fail')
		return
	}
}
