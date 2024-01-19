import { writeFileSync } from 'node:fs'
import { format, Options, resolveConfig, resolveConfigFile } from 'prettier'

const defaultConfig: Options = {
	useTabs: true,
	tabWidth: 4,
	printWidth: 80,
	semi: false,
	singleQuote: true,
	trailingComma: 'none',
	arrowParens: 'avoid',
	bracketSpacing: true,
	endOfLine: 'crlf',
	vueIndentScriptAndStyle: true
}

export const formatPkg = async (
	text: string,
	path: string,
	config: Options = {}
) => {
	const file = await resolveConfigFile(path)
	const options = file ? await resolveConfig(file) : {}

	const formatted = await format(text, {
		...defaultConfig,
		...config,
		...options,
		parser: 'json'
	})
	writeFileSync(path, formatted)
}
