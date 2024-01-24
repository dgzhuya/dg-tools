import { Kind, Config } from './types'

export const renderTemplate = async (name: Kind, config: Config<Kind>) => {
	console.log(name)
	console.log(config)
}
