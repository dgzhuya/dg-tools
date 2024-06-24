import { Config, Kind, RenderFn } from './types'

const charRegx = /[a-zA-Z0-9_-\s]/
export class Template {
	#source: string
	#index: number = 0

	constructor(source: string) {
		this.#source = source
	}

	#peek() {
		return this.#source[this.#index]
	}

	#next() {
		const char = this.#peek()
		this.#index++
		return char
	}

	#hasNext() {
		return this.#peek() !== undefined
	}

	#getKeyAndFn() {
		let key = ''
		let fnKey = ''
		while (this.#hasNext()) {
			const char = this.#next()
			if (char === '%' && this.#peek() === '}') {
				this.#next()
				return [key.trim(), fnKey.trim()]
			}
			if (char === '@') {
				fnKey = key
				key = ''
				continue
			}
			if (charRegx.test(char)) {
				key += char
				continue
			}
			throw new Error('key类型错误')
		}
		throw new Error('未匹配到结尾符号')
	}

	findKeys() {
		let keys: Record<string, 'string' | 'boolean'> = {}
		while (this.#hasNext()) {
			const char = this.#next()
			if (char === '{' && this.#peek() === '%') {
				this.#next()
				const [key, fnKey] = this.#getKeyAndFn()
				if (key.length > 0 && !keys[key]) {
					keys[key] = fnKey === 'if' ? 'boolean' : 'string'
				}
			}
		}
		return keys
	}

	#parseIfStat(
		config: Config<Kind>,
		plugins: Record<string, RenderFn>,
		noSkip: boolean
	) {
		let result = ''
		while (this.#hasNext()) {
			const char = this.#next()
			if (noSkip) {
				if (char === '{' && this.#peek() === '%') {
					this.#next()
					const [key, fnKey] = this.#getKeyAndFn()
					if (fnKey === 'end') {
						return result
					}
					const val = config[key]
					if (typeof val !== 'string') {
						throw new Error(`传入${key}配置信息错误`)
					}

					const fn = plugins[fnKey]
					result += fn ? fn(val) : val
				} else {
					result += char
				}
			} else {
				if (char === '{' && this.#peek() === '%') {
					this.#next()
					const [_, fnKey] = this.#getKeyAndFn()
					if (fnKey === 'end') {
						return result
					}
				}
			}
		}
		throw Error('缺少end@')
	}

	render(config: Config<Kind>, plugins: Record<string, RenderFn>) {
		let result = ''
		while (this.#hasNext()) {
			const char = this.#next()
			if (char === '{' && this.#peek() === '%') {
				this.#next()
				const [key, fnKey] = this.#getKeyAndFn()
				const val = config[key]
				if (fnKey === 'if') {
					if (typeof val !== 'boolean') {
						throw new Error(`传入${key}配置信息错误`)
					}
					result += this.#parseIfStat(config, plugins, val)
				} else {
					if (typeof val !== 'string') {
						throw new Error(`传入${key}配置信息错误`)
					}
					const fn = plugins[fnKey]
					result += fn ? fn(val) : val
				}
			} else {
				result += char
			}
		}
		return result
	}
}
