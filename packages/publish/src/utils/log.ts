import chalk from 'chalk'

export const logger = (
    msg: string | unknown,
    status: 'success' | 'fail' = 'success'
) => {
    if (status === 'success') {
        console.log(chalk.green(msg))
    } else {
        console.log(chalk.red(msg))
    }
}
