import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { cwd } from 'node:process'
import BtplEnv from '../btpl-env'

const findBtpl = async (path: string) => {
	const sourcesPath = join(path, 'sources')
	const files = await readdir(sourcesPath)
	const result: { name: string; source: string }[] = []
	for (const file of files) {
		if (/\.btpl$/.test(file)) {
			result.push({
				name: file.split('.')[0],
				source: await readFile(join(sourcesPath, file), 'utf-8')
			})
		}
	}
	return result
}

const initProject = async () => {
	try {
		const path = cwd()
		const modules = await findBtpl(path)

		const tsFile = join(path, 'btpl-env.d.ts')

		const btpl = new BtplEnv(tsFile)
		for (const { name, source } of modules) {
			await btpl.update(name, source)
		}
		btpl.clear(modules.map(m => m.name))
		await btpl.save()
	} catch (error) {
		console.log('\x1b[31m', (error as Error).message)
	}
}

initProject()
