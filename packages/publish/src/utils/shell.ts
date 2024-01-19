import { cwd } from 'process'
import { exec } from 'shelljs'

export const execAsync = (cmd: string, dir?: string, silent = true) => {
	return new Promise<string>((resolve, reject) => {
		exec(cmd, { silent, cwd: dir || cwd() }, (code, out, err) => {
			if (code) {
				reject(err)
			} else {
				resolve(out.trim())
			}
		})
	})
}
