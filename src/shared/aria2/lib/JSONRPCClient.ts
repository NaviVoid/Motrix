import EventEmitter from 'eventemitter3'
import _WebSocket from 'ws'
import { JSONRPCError } from './JSONRPCError'

import Deferred from './Deferred'
import promiseEvent from './promiseEvent'

const WebSocket = globalThis.WebSocket || _WebSocket

export interface JSONRPCClientOptions {
  secure?: boolean
  host?: string
  port?: number
  secret?: string
  path?: string
}

export interface JSONRPCMessage {
  method: string
  'json-rpc': string
  id: number
  params?: unknown[]
}

export interface JSONRPCResponse {
  id: number
  error?: { message: string; code: number; data?: unknown }
  result?: unknown
}

export interface JSONRPCRequest {
  method: string
  params?: unknown[]
  id: number
}

export interface JSONRPCNotification {
  method: string
  params?: unknown[]
}

export class JSONRPCClient extends EventEmitter {
  deferreds: Record<number, Deferred<unknown>>
  lastId: number
  socket!: InstanceType<typeof _WebSocket> | WebSocket
  secure: boolean
  host: string
  port: number
  secret: string
  path: string

  static defaultOptions: JSONRPCClientOptions = {
    secure: false,
    host: 'localhost',
    port: 80,
    secret: '',
    path: '/jsonrpc'
  }

  defaultOptions: JSONRPCClientOptions = {
    secure: false,
    host: 'localhost',
    port: 80,
    secret: '',
    path: '/jsonrpc'
  }

  constructor (options?: JSONRPCClientOptions) {
    super()
    this.deferreds = Object.create(null) as Record<number, Deferred<unknown>>
    this.lastId = 0

    const merged = { ...this.defaultOptions, ...options }
    this.secure = merged.secure ?? false
    this.host = merged.host ?? 'localhost'
    this.port = merged.port ?? 80
    this.secret = merged.secret ?? ''
    this.path = merged.path ?? '/jsonrpc'
  }

  id (): number {
    return this.lastId++
  }

  url (protocol: string): string {
    return (
      protocol +
      (this.secure ? 's' : '') +
      '://' +
      this.host +
      ':' +
      this.port +
      this.path
    )
  }

  websocket (message: JSONRPCMessage | JSONRPCMessage[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const cb = (err?: Error): void => {
        if (err) reject(err)
        else resolve()
      }
      this.socket.send(JSON.stringify(message), cb)
      if (globalThis.WebSocket && this.socket instanceof globalThis.WebSocket) cb()
    })
  }

  async http (message: JSONRPCMessage | JSONRPCMessage[]): Promise<Response> {
    const response = await fetch(this.url('http'), {
      method: 'POST',
      body: JSON.stringify(message),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })

    ;(response as any)
      .json()
      .then(this._onmessage)
      .catch((err: unknown) => {
        this.emit('error', err)
      })

    return response as any
  }

  _buildMessage (method: string, params?: unknown[]): JSONRPCMessage {
    if (typeof method !== 'string') {
      throw new TypeError(method + ' is not a string')
    }

    const message: JSONRPCMessage = {
      method,
      'json-rpc': '2.0',
      id: this.id()
    }

    if (params) Object.assign(message, { params })
    return message
  }

  async batch (calls: [string, unknown[]?][]): Promise<Promise<unknown>[]> {
    const message = calls.map(([method, params]) => {
      return this._buildMessage(method, params)
    })

    await this._send(message)

    return message.map(({ id }) => {
      const deferred = new Deferred<unknown>()
      this.deferreds[id] = deferred
      return deferred.promise
    })
  }

  async call (method: string, parameters?: unknown[]): Promise<unknown> {
    const message = this._buildMessage(method, parameters)
    await this._send(message)

    const deferred = new Deferred<unknown>()
    this.deferreds[message.id] = deferred

    return deferred.promise
  }

  async _send (message: JSONRPCMessage | JSONRPCMessage[]): Promise<void | Response> {
    this.emit('output', message)

    const { socket } = this
    return socket && (socket as any).readyState === 1
      ? this.websocket(message as JSONRPCMessage | JSONRPCMessage[])
      : this.http(message as JSONRPCMessage | JSONRPCMessage[])
  }

  _onresponse ({ id, error, result }: JSONRPCResponse): void {
    const deferred = this.deferreds[id]
    if (!deferred) return
    if (error) deferred.reject(new JSONRPCError(error))
    else deferred.resolve(result)
    delete this.deferreds[id]
  }

  _onrequest ({ method, params }: JSONRPCRequest): unknown {
    return this.onrequest(method, params)
  }

  onrequest (method: string, params?: unknown[]): unknown {
    return undefined
  }

  _onnotification ({ method, params }: JSONRPCNotification): void {
    this.emit(method, params)
  }

  _onmessage = (message: JSONRPCResponse | JSONRPCResponse[]): void => {
    this.emit('input', message)

    if (Array.isArray(message)) {
      for (const object of message) {
        this._onobject(object)
      }
    } else {
      this._onobject(message)
    }
  }

  _onobject (message: JSONRPCResponse & Partial<JSONRPCNotification>): void {
    if (message.method === undefined) this._onresponse(message as JSONRPCResponse)
    else if ((message as any).id === undefined) this._onnotification(message as JSONRPCNotification)
    else this._onrequest(message as unknown as JSONRPCRequest)
  }

  async open (): Promise<unknown> {
    const socket = (this.socket = new WebSocket(this.url('ws')) as any)

    socket.onclose = (...args: unknown[]): void => {
      this.emit('close', ...args)
    }
    socket.onmessage = (event: { data: string }): void => {
      let message: JSONRPCResponse | JSONRPCResponse[]
      try {
        message = JSON.parse(event.data)
      } catch (err) {
        this.emit('error', err)
        return
      }
      this._onmessage(message)
    }
    socket.onopen = (...args: unknown[]): void => {
      this.emit('open', ...args)
    }
    socket.onerror = (...args: unknown[]): void => {
      this.emit('error', ...args)
    }

    return promiseEvent(this, 'open')
  }

  async close (): Promise<unknown> {
    const { socket } = this
    socket.close()
    return promiseEvent(this, 'close')
  }
}
