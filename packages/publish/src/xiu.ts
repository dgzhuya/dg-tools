import { XiuOption, XiuContext, XiuHandler, XiuFn } from './option'
import { cwd } from 'process'

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

export const createXiu = (option: XiuOption = {}) => {
	return new Xiu({ cwdPath: cwd(), ...option })
}
