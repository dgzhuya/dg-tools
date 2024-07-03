import { Parser } from '.'
import { BtplToken, LiteralValue } from './types'
import { SetStatHook, concatToken, concatValue } from './utils'

export class FormatParser extends Parser<string> {
	#formatList: string[] = []

	format() {
		this.parseBlock()
		return this.#formatList.join('\n')
	}

	protected parseBlock() {
		let curLine = ''
		let isEmpty = true
		while (this.hasNext()) {
			let char = this.next()
			if (this.isStat(char)) {
				const [key, stat] = this.parseStat()
				if (['if', 'for', 'and', 'or', 'end'].includes(key)) {
					if (!isEmpty) {
						this.#formatList.push(curLine)
					}
					curLine = ''
					this.#formatList.push(stat || '')
					continue
				}
				curLine += stat
				continue
			}
			if (['\n', '\r'].includes(char)) {
				this.#formatList.push(curLine)
				curLine = ''
				isEmpty = true
				if (char === '\r' && this.peek() === '\n') {
					this.goNext()
				}
				continue
			}
			if (isEmpty && !['\t', ' '].includes(char)) {
				isEmpty = false
			}
			curLine += char
		}
		if (curLine) {
			this.#formatList.push(curLine)
		}
		this.checkStack()
	}

	@SetStatHook('simple')
	protected simpleHook(_: BtplToken[], value: LiteralValue) {
		return this.#addBrace(concatValue(value)[0], true)
	}

	@SetStatHook('or')
	@SetStatHook('and')
	@SetStatHook('func')
	protected funcAndOrHook(
		[_, token, op]: BtplToken[],
		...params: LiteralValue[]
	) {
		const name = concatToken(token, op)[0]
		const args = params.map(p => concatValue(p)[0]).join(', ')
		const isSimple = !['and', 'or'].includes(token[0])
		return this.#addBrace(name + args + ']', isSimple)
	}

	@SetStatHook('for')
	protected forStatHook([_, [key]]: BtplToken[], { token }: LiteralValue) {
		return this.#addBrace(`${key}@${token[0]}`)
	}

	@SetStatHook('if')
	protected ifStatHook(_: BtplToken[], cond: LiteralValue) {
		return this.#addBrace(`if@${concatValue(cond)[0]}`)
	}

	@SetStatHook('end')
	protected endStatHook() {
		return this.#addBrace('end@', false, 0)
	}

	#addBrace(content: string, isSimple = false, startPos = 1) {
		if (isSimple) {
			return `{% ${content} %}`
		}

		const tabChar = '\t'.repeat(this.stack.length - startPos)
		const pos = this.pos
		while ([' ', '\t'].includes(this.peek())) {
			this.goNext()
		}
		const char = this.peek()
		if (['\n', '\r'].includes(char)) {
			this.goNext()
			if (char === '\r' && this.peek() === '\n') {
				this.goNext()
			}
		} else {
			this.jump(pos)
		}
		return tabChar + `{% ${content} %}`
	}
}
