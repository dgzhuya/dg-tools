export const logger = (
	msg: string | unknown,
	status: 'success' | 'fail' = 'success'
) => {
	const chalk = require('chalk')
	if (status === 'success') {
		console.log(chalk.green(msg))
	} else {
		console.log(chalk.red(msg))
	}
}

export const printLoading = (msg: string) => {
	let status: 1 | 2 | 3 | 4 = 1
	const id = setInterval(() => {
		console.clear()
		switch (status) {
			case 1:
				logger(`${msg}.`)
				status = 2
				break
			case 2:
				logger(`${msg}..`)
				status = 3
				break
			case 3:
				logger(`${msg}...`)
				status = 4
				break
			case 4:
				logger(`${msg}....`)
				status = 1
				break
		}
	}, 400)
	return () => clearInterval(id)
}
