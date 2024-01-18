import { Command } from 'commander'
import { version, name, description } from '../package.json'
import { PublishOption } from './option'
import { publishHandler } from './publish'

const program = new Command()

program
    .name(name)
    .version(version)
    .description(description)
    .option('-o, --otp', 'use npm publish otp')
    .option('-c, --commit', 'commit this time publish')
    .option('-w, --work <dir>', 'use workspeace')
    .action((option: PublishOption) => publishHandler(option))

program.parse()
