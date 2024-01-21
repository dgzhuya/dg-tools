import { Command } from 'commander'
import pkg from '../package.json'
import { CmdOptions } from './option'
import { createXiu } from './xiu'
import { pkgInfoHandler } from './handler/pkg'
import { versionHandler } from './handler/version'
import { hookHandler } from './handler/hook'
import { uploadHandler } from './handler/upload'
import { commitHandler } from './handler/commit'
import { loggerHandler } from './handler/logger'
import { networkCheck } from './handler/network'

const program = new Command()

program
	.name(pkg.name)
	.version(pkg.version)
	.description(pkg.description)
	.option('-o, --otp', 'use npm publish otp')
	.option('-s, --space <dir>', 'use workspeace')
	.option('-c, --commit', 'git commit this time publish')
	.option('-b, --build', 'run build command before publish')
	.option('-r, --registry <url>', 'choose your npm registry')
	.option('-n, --network', 'check current registry url')
	.option('-h, --hook <command>', 'run your command before publish')
	.action((option: CmdOptions) => {
		const app = createXiu(option)
		app.use(loggerHandler)
			.use(networkCheck)
			.use(pkgInfoHandler)
			.use(versionHandler)
			.use(hookHandler)
			.use(uploadHandler)
			.use(commitHandler)
		app.run()
	})

program.parse()
