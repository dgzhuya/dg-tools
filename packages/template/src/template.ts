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

	#getKey() {
		let key = ''
		while (this.#hasNext()) {
			const char = this.#next()
			if (char === '%' && this.#peek() === '}') {
				this.#next()
				return key.trim()
			}
			if (char === '@') {
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
		let keys: string[] = []
		while (this.#hasNext()) {
			const char = this.#next()
			if (char === '{' && this.#peek() === '%') {
				this.#next()
				const key = this.#getKey()
				if (!keys.includes(key)) {
					keys.push(key)
				}
			}
		}
		return keys
	}

	render(config: Config<Kind>, plugins: Record<string, RenderFn>) {
		let result = ''
		while (this.#hasNext()) {
			const char = this.#next()
			if (char === '{' && this.#peek() === '%') {
				this.#next()
				const [key, fnKey] = this.#getKeyAndFn()
				const val = config[key]
				if (typeof val !== 'string') {
					throw new Error('传入配置信息错误')
				}
				const fn = plugins[fnKey]
				result += fn ? fn(val) : val
			} else {
				result += char
			}
		}
		return result
	}
}
