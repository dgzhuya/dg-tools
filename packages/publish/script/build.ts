import { join } from 'path'
import { cwd } from 'process'
import { build } from 'esbuild'

const buildFile = async (rootPath = cwd()) => {
	try {
		await build({
			bundle: true,
			minify: true,
			banner: {
				js: '#!/usr/bin/env node'
			},
			entryPoints: [join(rootPath, 'src/index.ts')],
			tsconfig: join(rootPath, 'tsconfig.json'),
			outfile: join(rootPath, 'dist/index.js'),
			platform: 'node',
			external: ['shelljs', '@types/shelljs', 'chalk', 'esbuild', 'tsx']
		})
	} catch (error) {}
}

buildFile()
