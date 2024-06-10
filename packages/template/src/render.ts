import { cwd } from 'process'
import { Kind, Config } from './types'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { Template } from './template'
import { existsSync } from 'node:fs'
import { readFileSync } from 'fs'

const RenderConfig = {
	path: cwd()
}

export function setBasePath(path: string) {
	RenderConfig.path = path
}

export async function renderTemplate<T extends Kind>(
	name: T,
	config: Config<T>
) {
	const filePath = join(RenderConfig.path, 'sources', `${name}.btpl`)
	if (!existsSync(filePath)) {
		throw new Error('文件不存在')
	}
	const templateStr = await readFile(filePath, 'utf-8')
	return new Template(templateStr).render(config)
}

export function renderTemplateSync<T extends Kind>(name: T, config: Config<T>) {
	const filePath = join(RenderConfig.path, 'sources', `${name}.btpl`)
	if (!existsSync(filePath)) {
		throw new Error('文件不存在')
	}
	const templateStr = readFileSync(filePath, 'utf-8')
	return new Template(templateStr).render(config)
}
