import { select } from '@inquirer/prompts'
import { XiuContext } from '../option'
import { readFileSync } from 'fs'
import { formatPkg } from '../utils'
import { XiuError } from '../error/xiu-error'

const luoName = ['特大', '大', '中']

export const versionHandler = async (ctx: XiuContext) => {
	const version = ctx.pkg?.v
	if (!version) throw new XiuError('11004', `${ctx.pkg?.name}`)

	try {
		const tierVersion = version.split('.').map(i => parseInt(i))
		const result = await select({
			message: '请选择更新的版本号',
			choices: ['大', '中', '小'].map((i, index) => ({
				name: ctx.pkg?.luo ? `${luoName[index]}杯` : `${i}版本`,
				value: index,
				description: `版本号更新为: ${tierVersion.join('.')}->${updateVersion(tierVersion, index)}`
			}))
		})
		if (ctx.pkg) ctx.pkg.v = updateVersion(tierVersion, result)
		console.log('ctx.pkg: ', ctx.pkg)
	} catch (error) {
		throw new XiuError('21003', 'inquirer-select')
	}

	try {
		const text = readFileSync(ctx.pkgJson, 'utf-8')
		const data = JSON.parse(text)
		data.version = ctx.pkg?.v
		await formatPkg(JSON.stringify(data), ctx.pkgJson)
	} catch (error) {
		throw error
	}
}

const updateVersion = (list: number[], index = 0, step = 1) => {
	const newList = [...list]
	newList[index] += step
	for (let i = index + 1; i < newList.length; i++) {
		newList[i] = 0
	}
	return newList.join('.')
}
