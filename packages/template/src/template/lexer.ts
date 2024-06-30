import { XiuParserError } from '../error'
import { BtplToken } from './types'

const startChar = /[a-zA-Z]/
const contentChar = /[a-zA-Z0-9_-]/

export class TemplateLexer {
	#source: string
	#pos = 0

	constructor(source: string) {
		this.#source = source
	}

	peek(len?: number) {
		return len
			? this.#source.slice(this.#pos, this.#pos + len)
			: this.#source[this.#pos]
	}

	peekAt(index: number) {
		return this.#source[this.#pos + index]
	}

	checkToken(token: string) {
		this.skipEmpty()
		if (token.length === 1) {
			return this.#source[this.#pos] === token
		}
		return this.#source.slice(this.#pos, this.#pos + token.length) === token
	}

	get pc() {
		return this.#pos
	}

	next() {
		const char = this.peek()
		this.#pos++
		return char
	}

	jump(pos: number) {
		this.#pos = pos
	}

	goNext() {
		this.#pos++
	}

	hasNext() {
		return this.peek() !== undefined
	}

	nextToken(): BtplToken {
		let key = ''
		this.skipEmpty()
		const start = this.#pos
		while (this.hasNext()) {
			const char = this.#source[this.#pos]
			const regx = key ? contentChar : startChar
			if (regx.test(char)) {
				key += char
				this.#pos++
				continue
			}
			if (key === '') {
				const fakeToken: BtplToken = [char, start, this.#pos + 1]
				throw new XiuParserError('字符`$1`不能解析为token', fakeToken)
			}
			return [key, start, this.#pos]
		}
		throw new XiuParserError('NextToken解析错误', ['', start, this.#pos])
	}

	checkBlockStart(char: string) {
		if (char !== '{') return false
		const key = `${char}${this.peek()}`
		if (key === '{%') {
			this.#pos--
			return true
		}
		return false
	}

	skipEmpty() {
		const start = this.#pos
		while (this.hasNext()) {
			const char = this.#source[this.#pos]
			if (![' ', '\t'].includes(char)) return
			this.#pos++
		}
		throw new XiuParserError('解析错误', ['', start, this.#pos])
	}

	verifyNextToken(char: string, token?: BtplToken): BtplToken {
		this.skipEmpty()
		const posStr =
			char.length === 1
				? this.#source[this.#pos]
				: this.#source.slice(this.#pos, this.#pos + char.length)
		if (posStr !== char) {
			throw new XiuParserError(
				`$1后缺少\`${char}\``,
				token || [
					this.#source[this.#pos - 1],
					this.#pos - 1,
					this.#pos + char.length - 1
				]
			)
		}
		const start = this.#pos
		this.#pos += char.length
		return [char, start, this.#pos]
	}

	verifyBlockEnd(token: BtplToken) {
		return this.verifyNextToken('%}', token)
	}
}
