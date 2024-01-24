import { existsSync } from 'node:fs'
import { readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { updateTSFile } from '../tools'

const fileInfo = `import '@biuxiu/template'

declare module '@biuxiu/template' {
	interface TemplateMap {}
}
`

const findBtpl = async (path: string) => {
	const sourcesPath = join(path, 'sources')
	const files = await readdir(sourcesPath)
	const result: string[] = []
	for (const file of files) {
		if (/\.btpl$/.test(file)) {
			result.push(file.split('.')[0])
		}
	}
	return result
}

const initProject = async () => {
	const path = cwd()
	const modules = await findBtpl(path)
	if (modules.length === 0) {
		return
	}
	const tsFile = join(path, 'btpl-env.d.ts')

	if (!existsSync(tsFile)) {
		await writeFile(tsFile, fileInfo, 'utf-8')
	}
	for (const module of modules) {
		await updateTSFile(tsFile, module)
	}
}

initProject()
