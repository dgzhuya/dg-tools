import { format, Options } from 'prettier'
import { writeFileSync } from 'node:fs'

const defaultConfig: Options = {
	tabWidth: 4,
	useTabs: false
}

export const formatPkg = async (
	text: string,
	path: string,
	config: Options = {}
) => {
	const formatted = await format(text, {
		...defaultConfig,
		...config,
		parser: 'json'
	})
	writeFileSync(path, formatted)
}
