import chalk from 'chalk'
import { exec } from 'shelljs'

const logger = (msg: string, status: 'success' | 'fail' = 'success') => {
    if (status === 'success') {
        console.log(chalk.green(msg))
    } else {
        console.log(chalk.red(msg))
    }
}

const execAsync = (cmd: string, silent = true) => {
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

export { logger, execAsync }
