import { join } from 'path'
import { cwd } from 'process'
import { build } from 'esbuild'
import { dtsPlugin } from 'esbuild-plugin-d.ts'
import { readdirSync, statSync } from 'node:fs'
import { dependencies } from '../package.json'

const rootPath = cwd()

const tsFileRegx = /\^*.ts$/

const getTSFile = (path = join(rootPath, 'src')) => {
	const entrys: string[] = []
	const fileList = readdirSync(path)
	for (const file of fileList) {
		const fullPath = join(path, file)
		if (statSync(fullPath).isDirectory()) {
			if (file !== 'bin') entrys.push(...getTSFile(fullPath))
		} else {
			if (tsFileRegx.test(file)) {
				entrys.push(fullPath)
			}
		}
	}
	return entrys
}

build({
	bundle: false,
	entryPoints: getTSFile(),
	outdir: join(rootPath, 'dist'),
	tsconfig: join(rootPath, 'tsconfig.json'),
	plugins: [dtsPlugin()],
	platform: 'node'
})

build({
	bundle: true,
	minify: true,
	banner: {
		js: '#!/usr/bin/env node'
	},
	entryPoints: [join(rootPath, 'src/bin/index.ts')],
	tsconfig: join(rootPath, 'tsconfig.json'),
	outfile: join(rootPath, 'dist/bin/index.js'),
	platform: 'node',
	external: Object.keys(dependencies)
})
