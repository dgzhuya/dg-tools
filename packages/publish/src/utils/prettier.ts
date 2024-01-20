import { writeFileSync } from 'node:fs'
import { format, Options, resolveConfig, resolveConfigFile } from 'prettier'

export const formatPkg = async (
	text: string,
	path: string,
	config: Options = {}
) => {
	const file = await resolveConfigFile(path)
	const options = file ? await resolveConfig(file) : {}

	const formatted = await format(text, {
		...config,
		...options,
		parser: 'json-stringify'
	})
	writeFileSync(path, formatted)
}
