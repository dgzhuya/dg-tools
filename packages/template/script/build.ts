import { join } from 'path'
import { cwd } from 'process'
import { build } from 'esbuild'
import { dtsPlugin } from 'esbuild-plugin-d.ts'
import { dependencies } from '../package.json'
import { getTSFile } from './utils'

const rootPath = cwd()

Promise.all([
	build({
		bundle: false,
		entryPoints: getTSFile(join(rootPath, 'src')),
		outdir: join(rootPath, 'dist'),
		format: 'cjs',
		tsconfig: join(rootPath, 'tsconfig.json'),
		plugins: [dtsPlugin()],
		platform: 'node'
	}),
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
])
