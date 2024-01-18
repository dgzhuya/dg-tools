import { checkGit, checkProjectGit, gitCommit } from '../src/utils'
import { describe, it, expect } from 'vitest'

describe('git tests', () => {
    it('check git exist', async () => {
        const result = await checkGit()
        const match = expect.stringMatching(/^git*/)
        expect(result).toEqual(match)
    })

    it('check this project git', async () => {
        const result = await checkProjectGit()
        const match = expect.stringMatching(/^On\sbranch*/)
        expect(result).toEqual(match)
    })

    it('git commit', async () => {
        const result = await gitCommit('✨ feat: 添加ts规范', [
            'packages/publish/tsconfig.json'
        ])
        const match = expect.stringMatching(/^\[main*/)
        expect(result).toEqual(match)
    })
})
