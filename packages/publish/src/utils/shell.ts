import { exec } from 'shelljs'

export const execAsync = (cmd: string, silent = true) => {
    return new Promise<string>((resolve, reject) => {
        exec(cmd, { silent }, (code, out, err) => {
            if (code) {
                reject(err)
            } else {
                resolve(out.trim())
            }
        })
    })
}
