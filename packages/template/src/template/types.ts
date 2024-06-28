export type BlockType = 'if' | 'for' | 'and' | 'or'

export type BtplToken = [string, number, number]

export type LiteralType = 'string' | 'boolean' | 'number' | 'object' | 'none'

export type LiteralValue = {
	token: BtplToken
	negation?: boolean
	upper?: number
	prefix?: BtplToken[]
}

export type StatHookKey =
	| 'simple'
	| 'if'
	| 'for'
	| 'and'
	| 'or'
	| 'end'
	| 'func'
