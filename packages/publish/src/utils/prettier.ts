import { writeFileSync } from 'node:fs'
import { format, Options, resolveConfig, resolveConfigFile } from 'prettier'
import { XiuError } from '../error/xiu-error'

export const formatPkg = async (
	text: string,
	path: string,
	config: Options = {}
) => {
	try {
		const file = await resolveConfigFile(path)
		const options = file ? await resolveConfig(file) : {}

		const formatted = await format(text, {
			...config,
			...options,
			parser: 'json-stringify'
		})
		writeFileSync(path, formatted)
	} catch (error) {
		throw new XiuError('20000')
	}
}
