export const logger = (
	msg: string | unknown,
	status: 'success' | 'fail' = 'success'
) => {
	if (status === 'success') {
		console.log('\x1b[32m', msg)
	} else {
		console.log('\x1b[31m', msg)
	}
}
logger('1111')

logger('2222', 'fail')
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
