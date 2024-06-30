import { Parser } from '.'
import { BtplToken, LiteralValue } from './types'
import { SetStatHook, concatToken, concatValue } from './utils'

export class FormatParser extends Parser {
	#curLine = ''
	#isEmptyLine = true
	#formatList: string[] = []

	#pushLine() {
		this.#formatList.push(this.#curLine)
		this.#curLine = ''
		this.#isEmptyLine = true
	}

	format() {
		this.parseBlock()
		return this.#formatList.join('\n')
	}

	parseBlock() {
		while (this.hasNext()) {
			let char = this.next()
			if (this.isStat(char)) {
				this.parseStat()
			} else if (char === '\n') {
				this.#pushLine()
			} else if (char === '\r') {
				this.#pushLine()
				if (this.peek() === '\n') {
					this.goNext()
				}
			} else {
				if (this.#isEmptyLine && ![' ', '\t'].includes(char)) {
					this.#isEmptyLine = false
				}
				this.#curLine += char
			}
		}
		this.checkStack()
	}

	@SetStatHook('simple')
	simpleHook(_: BtplToken[], value: LiteralValue) {
		this.addBrace(concatValue(value)[0], true)
	}

	@SetStatHook('or')
	@SetStatHook('and')
	@SetStatHook('func')
	funcAndOrHook([_, token, op]: BtplToken[], ...params: LiteralValue[]) {
		const name = concatToken(token, op)[0]
		const args = params.map(p => concatValue(p)[0]).join(', ')
		const isSimple = !['and', 'or'].includes(token[0])
		this.addBrace(name + args + ']', isSimple)
	}

	@SetStatHook('for')
	forStatHook(_: BtplToken[], list: LiteralValue) {
		this.addBrace(`for@${list.token[0]}`)
	}

	@SetStatHook('if')
	ifStatHook(_: BtplToken[], cond: LiteralValue) {
		this.addBrace(`if@${concatValue(cond)[0]}`)
	}

	@SetStatHook('end')
	endStatHook() {
		this.addBrace('end@', false, 0)
	}

	addBrace(content: string, isSimple = false, startPos = 1) {
		if (isSimple) {
			this.#curLine += `{% ${content} %}`
			return
		}
		if (this.#isEmptyLine) {
			this.#curLine = ''
		} else {
			this.#pushLine()
		}
		const tabChar = '\t'.repeat(this.stack.length - startPos)
		this.#curLine += tabChar
		this.#curLine += `{% ${content} %}`
		while ([' ', '\t'].includes(this.peek())) {
			this.goNext()
		}
		if (this.peek() === '\n') {
			this.goNext()
		}
		if (this.peek() === '\r') {
			this.goNext()
			if (this.peek() === '\n') {
				this.goNext()
			}
		}
		this.#pushLine()
	}
}
