import type { App } from 'vue'

interface MsgTask {
  run: () => void
}

interface MsgOptions {
  message?: string
  onClose?: (...data: unknown[]) => void
  [key: string]: unknown
}

const queue: MsgTask[] = []
const maxLength = 5

export default {
  install: function (app: App, Message: Record<string, (options: MsgOptions) => void>, defaultOption: MsgOptions = {}) {
    app.config.globalProperties.$msg = new Proxy(Message, {
      get (obj, prop: string) {
        return (arg: string | MsgOptions) => {
          if (!(arg instanceof Object)) {
            arg = { message: arg }
          }
          const task: MsgTask = {
            run () {
              obj[prop]({
                ...defaultOption,
                ...arg as MsgOptions,
                onClose (...data: unknown[]) {
                  const currentTask = queue.pop()
                  if (currentTask) {
                    currentTask.run()
                  }
                  if ((arg as MsgOptions).onClose) {
                    (arg as MsgOptions).onClose!(...data)
                  }
                }
              })
            }
          }

          if (queue.length >= maxLength) {
            queue.pop()
          }
          queue.unshift(task)

          if (queue.length === 1) {
            queue.pop()!.run()
          }
        }
      }
    })
  }
}
