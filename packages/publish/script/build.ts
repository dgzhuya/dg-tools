import { readdirSync, statSync } from 'fs'
import { join } from 'path'
import { cwd } from 'process'
import { build } from 'esbuild'

const tsFileRegx = /\^*.ts$/

const getTSFile = (path = join(cwd(), 'src')) => {
    const entrys: string[] = []
    const fileList = readdirSync(path)
    for (const file of fileList) {
        const fullPath = join(path, file)
        if (statSync(fullPath).isDirectory()) {
            entrys.push(...getTSFile(fullPath))
        } else {
            if (tsFileRegx.test(file)) {
                entrys.push(fullPath)
            }
        }
    }
    return entrys
}

const buildFile = async (rootPath = cwd()) => {
    console.log('rootPath: ', rootPath)
    try {
        await build({
            bundle: true,
            entryPoints: getTSFile(),
            tsconfig: join(rootPath, 'tsconfig.json'),
            outdir: join(rootPath, 'dist'),
            platform: 'node',
            external: ['shelljs', '@types/shelljs', 'chalk']
        })
    } catch (error) {}
}

buildFile()
