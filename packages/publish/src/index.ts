import { Command } from 'commander'
import pkg from '../package.json'
import { XiuOption } from './option'
import { createXiu } from './xiu'
import { pkgInfoHandler } from './handler/pkgHandler'
import { versionHandler } from './handler/versionHandler'
import { hookHandler } from './handler/hookHandler'
import { uploadHandler } from './handler/uploadHandler'
import { commitHandler } from './handler/commitHandler'
import { loggerHandler } from './handler/loggerHandler'

const program = new Command()

program
	.name(pkg.name)
	.version(pkg.version)
	.description(pkg.description)
	.option('-o, --otp', 'use npm publish otp')
	.option('-s, --space <dir>', 'use workspeace')
	.option('-c, --commit', 'git commit this time publish')
	.option('-h, --hook', 'run build command before publish')
	.option('-b, --build <command>', 'run your command before publish')
	.action((option: XiuOption) => {
		const app = createXiu(option)
		app.use(loggerHandler)
			.use(pkgInfoHandler)
			.use(versionHandler)
			.use(hookHandler)
			.use(uploadHandler)
			.use(commitHandler)
		app.run()
	})

program.parse()
