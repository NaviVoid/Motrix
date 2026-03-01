import EventEmitter from 'eventemitter3'

type CommandFn = (...args: unknown[]) => unknown

export default class CommandManager extends EventEmitter {
  commands: Record<string, CommandFn>

  constructor () {
    super()

    this.commands = {}
  }

  register (id: string, fn: CommandFn): void | null {
    if (this.commands[id]) {
      console.log('[Motrix] Attempting to register an already-registered command: ' + id)
      return null
    }
    if (!id || !fn) {
      console.error('[Motrix] Attempting to register a command with a missing id, or command function.')
      return null
    }
    this.commands[id] = fn

    this.emit('commandRegistered', id)
  }

  unregister (id: string): void {
    if (this.commands[id]) {
      delete this.commands[id]

      this.emit('commandUnregistered', id)
    }
  }

  execute (id: string, ...args: unknown[]): unknown {
    const fn = this.commands[id]
    if (fn) {
      try {
        this.emit('beforeExecuteCommand', id)
      } catch (err) {
        console.error(err)
      }
      const result = fn(...args)
      return result
    } else {
      return false
    }
  }
}
