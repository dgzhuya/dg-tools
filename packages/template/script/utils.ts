import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const tsFileRegx = /\^*.ts$/

export const getTSFile = (path: string) => {
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
