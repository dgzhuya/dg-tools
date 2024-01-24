import { join } from 'path'
import { cwd } from 'process'
import { Project } from 'ts-morph'
import { Template } from './template'
import { readFile, writeFile } from 'fs/promises'
import { resolveConfigFile, format, resolveConfig } from 'prettier'
import { existsSync } from 'fs'

export const findTemplateKeys = async (name: string) => {
	const filePath = join(cwd(), 'sources', `${name}.btpl`)
	if (!existsSync(filePath)) {
		throw new Error('文件不存在')
	}
	const templateStr = await readFile(filePath, 'utf-8')
	return new Template(templateStr).findKeys()
}

export const updateTSFile = async (tsFile: string, name: string) => {
	const keys = await findTemplateKeys(name)
	const project = new Project()
	const sourceFile = project.addSourceFileAtPath(tsFile)
	const templateMap = sourceFile
		.getModuleOrThrow("'@biuxiu/template'")
		.getInterfaceOrThrow('TemplateMap')

	const property = templateMap.getProperty(name)

	if (property) {
		property.remove()
	}
	templateMap.addProperty({
		name: `\'${name}\'`,
		type: `{
			${keys.map(k => `\'${k}\': string`).join(',')}
		}`
	})

	await sourceFile.save()
	await formatFile(tsFile)
}

const formatFile = async (path: string) => {
	const text = await readFile(path, 'utf-8')
	const file = await resolveConfigFile(path)
	const options = file ? await resolveConfig(file) : {}
	const formatted = await format(text, {
		...options,
		parser: 'typescript'
	})
	writeFile(path, formatted)
}
