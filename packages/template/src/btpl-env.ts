import { Template } from './template'
import { readFile, writeFile } from 'fs/promises'
import { existsSync, writeFileSync } from 'node:fs'
import { resolveConfigFile, format, resolveConfig } from 'prettier'
import {
	InterfaceDeclaration,
	Project,
	ModuleDeclaration,
	SourceFile,
	PropertySignature
} from 'ts-morph'

const fileInfo = `import '@biuxiu/template'

declare module '@biuxiu/template' {
	interface TemplateMap {}
}
`

export class BtplEnv {
	#path: string
	#source: SourceFile
	#module: ModuleDeclaration
	#template: InterfaceDeclaration
	constructor(path: string) {
		this.#path = path
		this.#initFile(path)
		this.#source = new Project().addSourceFileAtPath(path)
		const res = this.#source.getModule("'@biuxiu/template'")
		if (res) {
			this.#module = res
		} else {
			this.#module = this.#source.getModuleOrThrow('"@biuxiu/template"')
		}
		this.#template = this.#module.getInterfaceOrThrow('TemplateMap')
	}

	#initFile(path: string) {
		if (!existsSync(path)) {
			writeFileSync(path, fileInfo, 'utf-8')
		}
	}

	clear(names: string[]) {
		const keyNames = names.map(this.#formatKey)
		const interfaceNames = names
			.map(this.#formatName)
			.concat(['TemplateMap'])
		this.#template.getProperties().forEach(e => {
			if (!keyNames.includes(this.#getPropKeyText(e))) {
				e.remove()
			}
		})

		this.#module.getInterfaces().forEach(e => {
			if (!interfaceNames.includes(this.#getKeyText(e))) {
				e.remove()
			}
		})
	}

	rename(oldName: string, newName: string) {
		const newKeyName = this.#formatKey(newName)
		const newInterfaceName = this.#formatName(newName)

		const property = this.#template.getProperty(this.#formatKey(oldName))
		if (property) property.remove()
		this.#template.addProperty({ name: newKeyName, type: newInterfaceName })

		const node = this.#module.getInterfaceOrThrow(this.#formatName(oldName))
		node.rename(newInterfaceName)
	}

	remove(name: string) {
		try {
			const keyName = this.#formatKey(name)
			const prop = this.#template.getPropertyOrThrow(keyName)
			prop.remove()
			const node = this.#module.getInterfaceOrThrow(
				this.#formatName(name)
			)
			node.remove()
		} catch (error) {
			throw error
		}
	}

	async update(name: string, source: string) {
		try {
			const keyName = this.#formatKey(name)
			const interfaceName = this.#formatName(name)
			const property = this.#template.getProperty(keyName)
			if (property) {
				property.remove()
			}
			this.#template.addProperty({
				name: keyName,
				type: interfaceName
			})
			let node = this.#module.getInterface(interfaceName)
			if (!node) {
				node = this.#module.addInterface({ name: interfaceName })
			}

			this.#updateInterfaceProp(source, node)
		} catch (error) {
			throw error
		}
	}

	async save() {
		await this.#source.save()
		const text = await readFile(this.#path, 'utf-8')
		const file = await resolveConfigFile(this.#path)
		const options = file ? await resolveConfig(file) : {}
		const formatted = await format(text, {
			...options,
			parser: 'typescript'
		})
		await writeFile(this.#path, formatted)
	}

	#formatName = (name: string) => {
		const _upperCase = (name: string) =>
			name[0].toUpperCase() + name.slice(1)

		if (!/[a-zA-Z0-9_-]+/.test(name)) {
			throw new Error('模板文件名只能设置为字符串数字和下划线')
		}
		if (!/[a-zA-Z]/.test(name[0])) {
			throw new Error('模板文件名只能以字母开头')
		}
		let result = _upperCase(name)
		if (result.includes('-')) {
			result = result
				.split('-')
				.map((n, i) => (i === 0 ? n : _upperCase(n)))
				.join('')
		}
		if (result.includes('_')) {
			result = result
				.split('_')
				.map((n, i) => (i === 0 ? n : _upperCase(n)))
				.join('')
		}
		return result
	}

	#formatKey(name: string) {
		return name.includes('-') ? `\'${name}\'` : name
	}

	#getPropKeyText(node: PropertySignature) {
		return node.getChildAtIndex(0).getText()
	}

	#getKeyText(node: InterfaceDeclaration) {
		return node.getChildAtIndex(1).getText()
	}

	#updateInterfaceProp(source: string, node: InterfaceDeclaration) {
		const keys = new Template(source).findKeys().map(this.#formatKey)
		const props = node
			.getProperties()
			.map(p => p.getChildAtIndex(0).getText())
		keys.forEach(k => {
			if (!props.includes(k)) {
				node.addProperty({ name: k, type: 'string' })
			}
		})
		node.getProperties().forEach(k => {
			if (!keys.includes(this.#getPropKeyText(k))) {
				k.remove()
			}
		})
	}
}
