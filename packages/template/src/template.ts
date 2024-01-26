import { Config, Kind } from './types'

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
			if (charRegx.test(char)) {
				key += char
			} else {
				throw new Error('key类型错误')
			}
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

	render(config: Config<Kind>) {
		let result = ''
		while (this.#hasNext()) {
			const char = this.#next()

			if (char === '%') {
				console.log(this.#peek())
			}
			if (char === '{' && this.#peek() === '%') {
				this.#next()
				const val = config[this.#getKey()]
				if (!val) {
					throw new Error('传入配置信息错误')
				}
				result += val
			} else {
				result += char
			}
		}
		return result
	}
}
