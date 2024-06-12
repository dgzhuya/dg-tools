import { cwd } from 'process'
import { Kind, Config, RenderFn, RenderPlugin } from './types'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { Template } from './template'
import { existsSync } from 'node:fs'
import { readFileSync } from 'fs'

export class XiuTemplate<T extends Kind> {
	#basePath: string
	#plugins: Record<string, RenderFn>

	constructor(basePath = cwd(), plugins = {}) {
		this.#basePath = basePath
		this.#plugins = plugins
	}

	setPath(basePath: string) {
		this.#basePath = basePath
	}

	install(plugin: () => RenderPlugin) {
		const { name, fn } = plugin()
		this.#plugins[name] = fn
	}

	#checkFile(name: T) {
		const filePath = join(this.#basePath, 'sources', `${name}.btpl`)
		if (!existsSync(filePath)) {
			throw new Error('文件不存在')
		}
		return filePath
	}

	async render(name: T, config: Config<T>) {
		const filePath = this.#checkFile(name)
		const source = await readFile(filePath, 'utf-8')
		return this.#writeFile(source, config)
	}

	renderSync(name: T, config: Config<T>) {
		const filePath = this.#checkFile(name)
		const source = readFileSync(filePath, 'utf-8')
		return this.#writeFile(source, config)
	}

	#writeFile(source: string, config: Config<T>) {
		return new Template(source).render(config, this.#plugins)
	}
}
