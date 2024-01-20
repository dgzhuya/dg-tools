import { join } from 'path'
import { cwd } from 'process'
import { build } from 'esbuild'
import { dependencies } from '../package.json'

const rootPath = cwd()

build({
	bundle: true,
	minify: true,
	banner: {
		js: '#!/usr/bin/env node'
	},
	entryPoints: [join(rootPath, 'src/index.ts')],
	tsconfig: join(rootPath, 'tsconfig.json'),
	outfile: join(rootPath, 'dist/index.js'),
	platform: 'node',
	external: Object.keys(dependencies)
})
