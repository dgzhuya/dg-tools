import { Parser } from '.'
import { BtplToken, LiteralValue } from './types'
import { SetStatHook } from './utils'

type SyntaxType =
	| 'keyword'
	| 'keyword.other'
	| 'keyword.operator'
	| 'keyword.control'
	| 'variable'
	| 'function'
	| 'constant'
type ModifierType = 'global' | 'local'

interface SyntaxToken {
	start: number
	end: number
	type: SyntaxType
	modifiers?: ModifierType[]
}

export class SyntaxParser extends Parser {
	#syntaxes: SyntaxToken[] = []

	getSyntaxes() {
		return this.#syntaxes
	}

	#pushSyntaxToken(
		token: BtplToken,
		type: SyntaxType,
		modifiers?: ModifierType[]
	) {
		this.#syntaxes.push({
			start: token[1],
			end: token[2],
			type,
			modifiers
		})
	}

	#pushSyntaxVal(value: LiteralValue) {
		this.#pushSyntaxToken(
			value.token,
			value.upper ? 'variable' : 'constant',
			value.upper ? ['local'] : ['global']
		)
		if (value.negation) {
			if (value.prefix && value.prefix.length > 0) {
				this.#pushSyntaxToken(value.prefix[0], 'keyword.operator')
			}
			if (value.upper && value.prefix && value.prefix.length > 1) {
				this.#pushSyntaxToken(value.prefix[1], 'variable', ['local'])
			}
		} else {
			if (value.prefix && value.prefix.length > 0) {
				this.#pushSyntaxToken(value.prefix[0], 'variable', ['local'])
			}
		}
	}

	@SetStatHook('simple')
	simpleStatHook(tokens: BtplToken[], value: LiteralValue) {
		tokens.forEach(t => {
			this.#pushSyntaxToken(t, 'keyword.other')
		})
		this.#pushSyntaxVal(value)
	}

	@SetStatHook('or')
	@SetStatHook('and')
	@SetStatHook('func')
	andOrStatHook(tokens: BtplToken[], ...values: LiteralValue[]) {
		const isAndOr = ['and', 'or'].includes(tokens[1][0])
		const funcType = isAndOr ? 'function' : 'keyword.control'
		this.#pushSyntaxToken(tokens[0], 'keyword.other')
		this.#pushSyntaxToken(tokens[1], funcType, isAndOr ? ['global'] : [])
		this.#pushSyntaxToken(tokens[2], 'keyword.operator')
		this.#pushSyntaxToken(tokens[3], 'keyword.operator')
		this.#pushSyntaxToken(tokens[4], 'keyword.other')
		const endPos = tokens.length - 1
		const commas = isAndOr ? tokens.slice(5) : tokens.slice(5, endPos)
		commas.forEach(t => this.#pushSyntaxToken(t, 'keyword.operator'))
		values.forEach(v => this.#pushSyntaxVal(v))
	}

	@SetStatHook('if')
	@SetStatHook('for')
	@SetStatHook('end')
	ifStatHook(tokens: BtplToken[], value: LiteralValue) {
		this.#pushSyntaxToken(tokens[0], 'keyword.other')
		this.#pushSyntaxToken(tokens[1], 'keyword.control')
		this.#pushSyntaxToken(tokens[2], 'keyword.operator')
		this.#pushSyntaxToken(tokens[3], 'keyword.other')
		if (tokens[1][0] !== 'end') {
			this.#pushSyntaxVal(value)
		}
	}

	protected parseBlock(): void {
		throw new Error('Method not implemented.')
	}
}
