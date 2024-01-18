import { cwd } from 'node:process'
import { PackageInfo } from '../option'
import { join } from 'node:path'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { select } from '@inquirer/prompts'

export const pkgInfoHandler = async (workPath?: string) => {
    let path = cwd()
    let pkgs: PackageInfo[] = []

    if (workPath) {
        path = join(path, workPath)
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
        return pkg
    }
    try {
        return findCurrentPackage(path)
    } catch (error) {
        throw error
    }
}

const findCurrentPackage = (path: string) => {
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
            throw new Error(`解析${jsonPath}失败`)
        }
    }
    throw new Error(`${path}不存在package.json`)
}

const findPackages = (path: string) => {
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
                throw new Error(`解析${jsonPath}失败`)
            }
        }
    }
    if (entrys.length === 0) {
        throw new Error('工作目录下没有包')
    }
    return entrys
}
