import { PackageInfo, XiuContext } from '../option'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { select } from '@inquirer/prompts'
import { findCurrentPackage, findPackages } from '../utils'

export const pkgInfoHandler = async (ctx: XiuContext) => {
	if (!ctx.space) {
		try {
			ctx.pkg = await findCurrentPackage(ctx.cwdPath)
		} catch (error) {
			throw error
		}
		return
	}

	let pkgs: PackageInfo[] = []
	const path = join(ctx.cwdPath, ctx.space)
	if (!existsSync(path)) {
		throw new Error('包路径不存在')
	}
	try {
		pkgs = findPackages(path)
	} catch (error) {
		throw error
	}
	const result = await select({
		message: '请选择要发布的包',
		choices: pkgs.map(p => ({
			name: p.name,
			value: p.name,
			description: p.description
		}))
	})
	const pkg = pkgs.find(p => p.name === result)
	if (!pkg) {
		throw new Error(`${result}不存在`)
	}
	ctx.pkg = pkg
}
