import { inspect } from 'util'
import { Aria2 } from './Aria2'

export default (aria2: Aria2): void => {
  aria2.on('open', () => {
    console.log('aria2', 'OPEN')
  })

  aria2.on('close', () => {
    console.log('aria2', 'CLOSE')
  })

  aria2.on('input', (m: unknown) => {
    console.log('aria2', 'IN')
    console.log(inspect(m, { depth: null, colors: true }))
  })

  aria2.on('output', (m: unknown) => {
    console.log('aria2', 'OUT')
    console.log(inspect(m, { depth: null, colors: true }))
  })
}
