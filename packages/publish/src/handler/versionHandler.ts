import { select } from '@inquirer/prompts'
import { XiuContext } from '../option'
import { readFileSync } from 'fs'
import { join } from 'path'
import { formatPkg } from '../utils'

const luoName = ['特大', '大', '中']

export const versionHandler = async (ctx: XiuContext) => {
	const version = ctx.pkg?.v
	if (version) {
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
			tierVersion[result] += 1
			const jsonPath = join(ctx.pkg?.path || ctx.cwdPath, 'package.json')
			const newVersion = tierVersion.join('.')
			const text = readFileSync(jsonPath, 'utf-8')
			const data = JSON.parse(text)
			data.version = newVersion
			await formatPkg(JSON.stringify(data, null, 2), jsonPath)
			if (ctx.pkg) ctx.pkg.v = newVersion
		} catch (error) {
			throw error
		}
	}
	throw new Error(`${ctx.pkg?.name}缺少版本信息`)
}

const updateVersion = (list: number[], index = 0, step = 1) => {
	const newList = [...list]
	newList[index] += step
	for (let i = index + 1; i < newList.length; i++) {
		newList[i] = 0
	}
	return newList.join('.')
}
