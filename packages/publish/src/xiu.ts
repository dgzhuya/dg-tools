import { cwd } from 'process'
import { XiuError } from './error/xiu-error'
import { gitCheckoutFile, logger } from './utils'
import { CmdOptions, XiuContext, XiuHandler, XiuFn } from './option'

class Xiu {
	#context: XiuContext
	#handlers: XiuHandler[] = []

	constructor(context: XiuContext) {
		this.#context = context
	}

	use(fn: XiuHandler) {
		this.#handlers.push(fn)
		return this
	}

	#buidRunStack() {
		const stack: XiuFn[] = []
		for (let i = this.#handlers.length - 1; i >= 0; i--) {
			stack.push(async () => {
				const next = stack.pop() || (async () => {})
				let isCalled = false
				await this.#handlers[i](this.#context, async () => {
					isCalled = true
					await next()
				})
				if (!isCalled) await next()
			})
		}
		return stack.pop()
	}

	run() {
		const fn = this.#buidRunStack()
		if (fn) fn()
	}
}

export const createXiu = (options?: CmdOptions) => {
	return new Xiu({
		registry: 'https://registry.npmjs.org',
		updatedVersion: false,
		networkSuccess: false,
		pkgJson: '',
		printError(error) {
			if (this.updatedVersion) {
				gitCheckoutFile(this.pkgJson).catch(err => {
					this.updatedVersion = false
					this.printError(err)
				})
			}
			logger(error.toString(), 'fail')
		},
		loading(msg, time, code) {
			let status: 1 | 2 | 3 | 4 = 1
			let curIndex = 1
			const realTimes = time * 2
			const { stdout } = process
			const id = setInterval(() => {
				stdout.clearLine(0)
				stdout.cursorTo(0)
				if (realTimes <= curIndex) {
					this.printError(new XiuError(code))
					clearInterval(id)
					process.exit(1)
				}
				curIndex++
				stdout.write(
					`\x1b[32m当前耗时: ${(curIndex / 2) | 0}s,${msg}${'.'.repeat(status)}\x1b[0m`
				)
				status = (status % 5) + 1
			}, 500)
			return () => {
				stdout.write('\n')
				clearInterval(id)
			}
		},
		cwdPath: cwd(),
		...options
	})
}
