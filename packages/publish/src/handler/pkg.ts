import { PackageInfo, XiuContext } from '../option'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { select } from '@inquirer/prompts'
import { findCurrentPackage, findPackages } from '../utils'
import { XiuError } from '../error/xiu-error'

export const pkgInfoHandler = async (ctx: XiuContext) => {
	if (!ctx.space) {
		ctx.pkg = findCurrentPackage(ctx.cwdPath)
		return
	}

	let pkgs: PackageInfo[] = []
	const path = join(ctx.cwdPath, ctx.space)
	if (!existsSync(path)) throw new XiuError('10000')

	pkgs = findPackages(path)
	try {
		const result = await select({
			message: '请选择要发布的包',
			choices: pkgs.map(p => ({
				name: p.name,
				value: p.name,
				description: p.description
			}))
		})
		const pkg = pkgs.find(p => p.name === result)

		if (!pkg) throw new XiuError('22000', 'inquirer', result)

		ctx.pkg = pkg
	} catch (error) {
		throw new XiuError('21000', 'inquirer')
	}
}
