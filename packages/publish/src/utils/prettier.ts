import { format, Options } from 'prettier'
import { writeFileSync } from 'node:fs'

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
	const formatted = await format(text, {
		...defaultConfig,
		...config,
		parser: 'json'
	})
	writeFileSync(path, formatted)
}
