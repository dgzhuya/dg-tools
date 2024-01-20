import { MessageKey, XiuError } from '../error/xiu-error'
import { logError, logger } from './log'

type Status = 1 | 2 | 3 | 4

const change: Record<Status, Status> = {
	1: 2,
	2: 3,
	3: 4,
	4: 1
}

export const loading = (msg: string, time: number, errorCode: MessageKey) => {
	let status: Status = 1
	let curIndex = 0
	const realTimes = time * 2
	const id = setInterval(() => {
		console.clear()
		if (realTimes <= curIndex) {
			logError(new XiuError(errorCode))
			clearInterval(id)
			process.exit(1)
		}
		curIndex++
		logger(`${msg}${'.'.repeat(status)}`)
		status = change[status]
	}, 500)
	return () => clearInterval(id)
}
