import { Parser } from '.'
import { BtplToken, LiteralValue } from './types'
import { SetStatHook } from './utils'

enum Syntax {
	Inc = 'macro',
	Func = 'function',
	Var = 'parameter',
	Const = 'number',
	Event = 'keyword',
	Ctrl = 'keyword',
	Op = 'keyword'
}

enum Modifier {
	Global = 'global',
	Local = 'local',
	Static = 'static'
}

export const TokenTypes = Object.entries(Syntax).map(([_, v]) => v)
export const TokenModifiers = Object.entries(Modifier).map(([_, v]) => v)

interface SyntaxToken {
	start: number
	end: number
	type: Syntax
	modifier?: Modifier[]
}

export class SyntaxParser extends Parser {
	#syntaxes: SyntaxToken[] = []

	getSyntaxes() {
		this.parseBlock()
		return this.#syntaxes
	}

	protected parseBlock(): void {
		while (this.hasNext()) {
			const char = this.next()
			if (this.isStat(char)) {
				this.parseStat()
			}
		}
		this.checkStack()
	}

	#pushSyntaxToken(token: BtplToken, type: Syntax, modifier?: Modifier[]) {
		this.#syntaxes.push({
			start: token[1],
			end: token[2],
			type,
			modifier
		})
	}

	#pushSyntaxVal(value: LiteralValue) {
		this.#pushSyntaxToken(
			value.token,
			value.upper ? Syntax.Var : Syntax.Const,
			value.upper ? [Modifier.Local] : [Modifier.Global, Modifier.Static]
		)
		if (value.negation) {
			if (value.prefix && value.prefix.length > 0) {
				this.#pushSyntaxToken(value.prefix[0], Syntax.Op)
			}
			if (value.upper && value.prefix && value.prefix.length > 1) {
				this.#pushSyntaxToken(value.prefix[1], Syntax.Var)
			}
		} else {
			if (value.prefix && value.prefix.length > 0) {
				this.#pushSyntaxToken(value.prefix[0], Syntax.Var)
			}
		}
	}

	@SetStatHook('simple')
	protected simpleStatHook(tokens: BtplToken[], value: LiteralValue) {
		tokens.forEach(t => {
			this.#pushSyntaxToken(t, Syntax.Inc)
		})
		this.#pushSyntaxVal(value)
	}

	@SetStatHook('or')
	@SetStatHook('and')
	@SetStatHook('func')
	protected andOrStatHook(tokens: BtplToken[], ...values: LiteralValue[]) {
		const isAndOr = ['and', 'or'].includes(tokens[1][0])
		const funcType = isAndOr ? Syntax.Ctrl : Syntax.Func
		this.#pushSyntaxToken(tokens[0], Syntax.Inc)
		this.#pushSyntaxToken(tokens[1], funcType)
		this.#pushSyntaxToken(tokens[2], Syntax.Event)
		this.#pushSyntaxToken(tokens[3], Syntax.Op)
		this.#pushSyntaxToken(tokens[4], Syntax.Inc)
		const endPos = tokens.length - 1
		const commas = isAndOr ? tokens.slice(5, endPos) : tokens.slice(5)
		commas.forEach(t => this.#pushSyntaxToken(t, Syntax.Op))
		values.forEach(v => {
			this.#pushSyntaxVal(v)
		})
	}

	@SetStatHook('if')
	@SetStatHook('for')
	@SetStatHook('end')
	protected ifStatHook(tokens: BtplToken[], value: LiteralValue) {
		this.#pushSyntaxToken(tokens[0], Syntax.Inc)
		this.#pushSyntaxToken(tokens[1], Syntax.Ctrl)
		this.#pushSyntaxToken(tokens[2], Syntax.Op)
		this.#pushSyntaxToken(tokens[3], Syntax.Inc)
		if (tokens[1][0] !== 'end') {
			this.#pushSyntaxVal(value)
		}
	}
}
