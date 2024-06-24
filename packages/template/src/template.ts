import { XiuError } from './error'
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

	#getKeyAndFn(isFind = false) {
		let key = ''
		let fnKey = ''
		let fnScope = 1
		while (this.#hasNext()) {
			const char = this.#next()
			if (char === '%' && this.#peek() === '}') {
				this.#next()
				let curKey = key.trim()
				const curFnKey = fnKey.trim()
				if (curKey === 'i' && curFnKey === 'in') {
					return [isFind ? '' : `index&${fnScope}`, 'in']
				}
				return [
					curFnKey === 'in' ? `${curKey}&${fnScope}` : curKey,
					curFnKey
				]
			}
			if (char === '@') {
				fnKey = key
				key = ''
				continue
			}

			if (char === '$') {
				if (fnKey === 'in') {
					fnScope++
				}
				fnKey = 'in'
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

	checkError() {
		const blockStack: { key: string; pos: number }[] = []
		while (this.#hasNext()) {
			const char = this.#next()
			if (char === '{' && this.#peek() === '%') {
				this.#next()
				const [_, fnKey] = this.#getKeyAndFn()
				if (fnKey === 'if') {
					blockStack.push({ key: 'if', pos: this.#index })
				} else if (fnKey === 'for') {
					blockStack.push({ key: 'for', pos: this.#index })
				} else if (fnKey === 'end') {
					blockStack.pop()
				}
			}
		}
		if (blockStack.length > 0) {
			return blockStack[blockStack.length - 1]
		}
		return
	}

	findKeys() {
		let keys: Record<string, string> = {}
		let scope = 0
		const forScopeRecord: Record<number, string> = {}
		const forStack: string[][] = []
		while (this.#hasNext()) {
			const char = this.#next()
			if (char === '{' && this.#peek() === '%') {
				this.#next()
				const [key, fnKey] = this.#getKeyAndFn(true)
				if (fnKey === 'end') {
					if (forScopeRecord[scope]) {
						const _key = forScopeRecord[scope]
						const curFor = forStack.pop()
						if (curFor) {
							const types = curFor.map(c => `${c}:string`)
							keys[_key] = types.length
								? `{${types.join(';')}}[]`
								: 'unknown[]'
						} else {
							throw new XiuError('for栈长度错误')
						}
					}
					scope--
				}

				if (['for', 'if'].includes(fnKey)) {
					if (key === '') {
						throw new XiuError('for/if后面需要跟一个变量')
					}
					scope++
				}
				if (key.length > 0) {
					if (fnKey === 'for') {
						forScopeRecord[scope] = key
						forStack.push([])
					} else if (fnKey === 'in') {
						if (forStack.length === 0) {
							throw new XiuError('栈长度错误')
						}
						const [_key, _scope] = key.split('&')
						const scopeIndex = parseInt(_scope) || 1
						const curStack = forStack[forStack.length - scopeIndex]
						if (!curStack) {
							throw new XiuError('栈不存在')
						}
						if (!curStack.includes(_key)) {
							curStack.push(_key)
						}
					} else {
						if (!keys[key]) {
							keys[key] = fnKey === 'if' ? 'boolean' : 'string'
						}
					}
				}
			}
		}
		if (scope !== 0) {
			throw new XiuError(`块语句错误,层级${scope}`)
		}
		return keys
	}

	render(config: Config<Kind>, plugins: Record<string, RenderFn>) {
		let renderScope = 0
		const forScopeRecord: Record<number, boolean> = {}
		const forValStack: any[] = []

		const isKey = (char: string) => {
			return char === '{' && this.#peek() === '%'
		}

		const skipStat = () => {
			let scope = 0
			while (this.#hasNext()) {
				if (isKey(this.#next())) {
					this.#next()
					const [_, fnKey] = this.#getKeyAndFn()
					if (['if', 'for'].includes(fnKey)) {
						scope++
						continue
					}
					if (fnKey === 'end') {
						if (scope === 1) {
							return ''
						}
						scope--
					}
				}
			}
			throw new Error('缺少end')
		}

		const parseForStat = (list: any[]) => {
			const pos = this.#index
			let forStatRes = ''
			let curIndex = forValStack.length
			for (let i = 0; i < list.length; i++) {
				let val = list[i]
				if (typeof val === 'object') {
					val['index'] = i
				}
				forValStack[curIndex] = val
				forStatRes += parseBlock()
				if (i < list.length - 1) {
					this.#index = pos
					renderScope++
				}
			}
			return forStatRes
		}

		const parseIfStat = (val: boolean) => {
			return val ? parseBlock() : skipStat()
		}

		const parseBlock = () => {
			let blockRes = ''
			while (this.#hasNext()) {
				const char = this.#next()
				if (isKey(char)) {
					this.#next()
					const [key, fnKey] = this.#getKeyAndFn()

					if (fnKey === 'end') {
						if (forScopeRecord[renderScope]) {
							forValStack.pop()
						}
						renderScope--
						return blockRes
					}

					const val = config[key]
					if (fnKey === 'if') {
						if (typeof val !== 'boolean') {
							throw new Error(`${key}值类型错误,应该为布尔值`)
						}
						renderScope++
						blockRes += parseIfStat(val)
					} else if (fnKey === 'for') {
						if (!Array.isArray(val)) {
							throw new Error(`${key}值类型错误,应该为数组`)
						}
						renderScope++
						forScopeRecord[renderScope] = true
						blockRes += parseForStat(val)
					} else if (fnKey === 'in') {
						const [_key, _scope] = key.split('&')
						const scope = parseInt(_scope)
						const upval = forValStack[forValStack.length - scope]
						if (!upval) {
							throw new XiuError('for循环层级解析错误')
						}
						const upvalStr = upval[_key]
						if (upvalStr === undefined) {
							throw new Error(`传入${_key}值${upvalStr}错误`)
						}
						blockRes += upvalStr
					} else {
						if (typeof val !== 'string') {
							throw new Error(`传入${key}值${val}错误`)
						}
						const fn = plugins[fnKey]
						blockRes += fn ? fn(val) : val
					}
				} else {
					blockRes += char
				}
			}
			if (renderScope !== 0) {
				throw new Error(`缺少结束语句${renderScope}`)
			}
			return blockRes
		}

		let renderResult = ''
		while (this.#hasNext()) {
			const pos = this.#index
			const char = this.#next()
			if (isKey(char)) {
				this.#next()
				const [key, fnKey] = this.#getKeyAndFn()
				if (['for', 'if'].includes(fnKey)) {
					this.#index = pos
					renderResult += parseBlock()
				} else {
					const val = config[key]
					if (typeof val !== 'string') {
						throw new Error(`传入${key}值${val}错误`)
					}
					const fn = plugins[fnKey]
					renderResult += fn ? fn(val) : val
				}
			} else {
				renderResult += char
			}
		}
		return renderResult
	}
}
