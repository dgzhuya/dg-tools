import { cwd } from 'process'
import { Kind, Config, RenderFn, RenderPlugin } from './types'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { existsSync } from 'node:fs'
import { readFileSync } from 'fs'
import { RenderParser } from './template/render'

export class XiuTemplate {
	#basePath: string
	#plugins: Record<string, RenderFn>

	constructor(basePath = cwd(), plugins = {}) {
		this.#basePath = basePath
		this.#plugins = plugins
	}

	setPath(basePath: string) {
		this.#basePath = basePath
	}

	install<T extends string>(...plugins: RenderPlugin<T>[]) {
		plugins.forEach(([name, fn]) => {
			this.#plugins[name] = fn
		})
	}

	#checkFile<T extends Kind>(name: T) {
		const filePath = join(this.#basePath, 'sources', `${name}.btpl`)
		if (!existsSync(filePath)) {
			throw new Error('文件不存在')
		}
		return filePath
	}

	async render<T extends Kind>(name: T, config: Config<T>) {
		const filePath = this.#checkFile(name)
		const source = await readFile(filePath, 'utf-8')
		return this.#writeFile(source, config)
	}

	renderSync<T extends Kind>(name: T, config: Config<T>) {
		const filePath = this.#checkFile(name)
		const source = readFileSync(filePath, 'utf-8')
		return this.#writeFile(source, config)
	}

	#writeFile<T extends Kind>(source: string, config: Config<T>) {
		return new RenderParser(source, config, this.#plugins).render()
	}
}
