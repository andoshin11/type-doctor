import { prompt } from 'enquirer'
import { Doctor } from '../../../doctor'
import { CodeFixAction } from '../../../types'

type OperationType = 'autoFixAll' | 'autoFix'

const selectOperation = async (doctor: Doctor, codeFixes: CodeFixAction[]) => {
  const { reporter } = doctor

  const { fixType } = await prompt<{ fixType: 'auto' | 'manual' }>({
    type: 'select',
    name: 'fixType',
    message: 'Pick operation',
    choices: [
      {
        name: 'fixAll',
        message: 'Fix all auto fixable items'
      },
      {
        name: 'fixAll',
        message: 'Fix all auto fixable items'
      }
    ]
  })
}

export default selectOperation
