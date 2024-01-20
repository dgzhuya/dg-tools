import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { PackageInfo } from '../option'
import { XiuError } from '../error/xiu-error'

export const findCurrentPackage = (path: string) => {
	const jsonPath = join(path, 'package.json')
	if (existsSync(jsonPath)) {
		const data = readFileSync(jsonPath, 'utf-8')
		try {
			const pkg = JSON.parse(data)
			const result: PackageInfo = {
				path,
				name: pkg.name,
				v: pkg.version,
				description: pkg.description
			}
			if (pkg.luo) {
				result.luo = true
			}
			return result
		} catch (error) {
			throw new XiuError('11001', jsonPath)
		}
	}
	throw new XiuError('11002', path)
}

export const findPackages = (path: string) => {
	const entrys: PackageInfo[] = []
	const dirs = readdirSync(path)
		.map(f => join(path, f))
		.filter(f => statSync(f).isDirectory)
	for (const dir of dirs) {
		const jsonPath = join(dir, 'package.json')
		if (existsSync(jsonPath)) {
			const data = readFileSync(jsonPath, 'utf-8')
			try {
				const pkg = JSON.parse(data)
				const result: PackageInfo = {
					path: dir,
					name: pkg.name,
					v: pkg.version,
					description: pkg.description
				}
				if (pkg.luo) {
					result.luo = true
				}
				entrys.push(result)
			} catch (error) {
				throw new XiuError('11001', jsonPath)
			}
		}
	}
	if (entrys.length === 0) {
		throw new XiuError('11003', path)
	}
	return entrys
}
