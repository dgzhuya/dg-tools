import { describe, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { formatPkg } from '../src/utils'

describe('prettier tests', () => {
	it('package json', async () => {
		const path = resolve(__dirname, '../../template/package.json')
		const text = await readFile(path, 'utf8')
		await formatPkg(text, path)
	})

	it('change version', async () => {
		const path = resolve(__dirname, '../package.json')
		const text = await readFile(path, 'utf8')
		const data = JSON.parse(text)
		data.version = '2.0.1'
		await formatPkg(JSON.stringify(data), path)
	})
})
