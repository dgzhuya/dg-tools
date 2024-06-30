import { BtplEnv } from '..'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { readFile, readdir } from 'node:fs/promises'
import { FormatParser } from '../template/format'
import { writeFileSync } from 'node:fs'

const path = cwd()
const sourcesPath = join(path, 'sources')

const findBtpl = async () => {
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

const [type] = process.argv.slice(2)

const initProject = async () => {
	try {
		const modules = await findBtpl()
		if (['--format', '-f'].includes(type)) {
			for (const { name, source } of modules) {
				const content = new FormatParser(source).format()
				writeFileSync(`${join(sourcesPath, name)}.btpl`, content)
			}
		}
		if (['--key', 'k'].includes(type)) {
			const tsFile = join(path, 'btpl-env.d.ts')

			const btpl = new BtplEnv(tsFile)
			for (const { name, source } of modules) {
				await btpl.update(name, source)
			}
			btpl.clear(modules.map(m => m.name))
			await btpl.save()
		}
	} catch (error) {
		console.log('\x1b[31m', (error as Error).message)
	}
}

initProject()
