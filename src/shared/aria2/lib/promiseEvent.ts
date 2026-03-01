import EventEmitter from 'eventemitter3'

export default function promiseEvent (target: EventEmitter, event: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    function cleanup (): void {
      target.removeListener(event, onEvent)
      target.removeListener('error', onError)
    }
    function onEvent (data: unknown): void {
      resolve(data)
      cleanup()
    }
    function onError (err: unknown): void {
      reject(err)
      cleanup()
    }
    target.addListener(event, onEvent)
    target.addListener('error', onError)
  })
}
