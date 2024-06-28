import type { BtplToken, LiteralValue, StatHookKey } from './types'

export function SetStatHook(name: StatHookKey) {
	return (target: any, _: string, descriptor: PropertyDescriptor) => {
		if (!target.constructor.__list) {
			target.constructor.__list = {}
		}
		target.constructor.__list[name] = descriptor.value
	}
}

export const concatToken = (...list: BtplToken[]): BtplToken => {
	let key = list.map(([i]) => i).join('')
	let start = list[0][1]
	let end = list[list.length - 1][2]
	return [key, start, end]
}

export const concatValue = (...values: LiteralValue[]): BtplToken => {
	const list = values.map(({ prefix, token }) =>
		prefix ? concatToken(...prefix, token) : token
	)
	return concatToken(...list)
}
