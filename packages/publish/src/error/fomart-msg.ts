import { XiuError } from './xiu-error'

export type Template<T extends string> = `${string}${T}${string}`

export const formatErrorMsg = (template: Template<'%s'>, msgs: string[]) => {
	let i = 0
	let result = ''
	while (i < template.length) {
		const char = template[i]
		if (char === '%' && template[i + 1] === 's') {
			if (msgs.length === 0) throw new XiuError('51000', '1')
			result += msgs.shift()
			i++
		} else {
			result += char
		}
		i++
	}
	return result
}
