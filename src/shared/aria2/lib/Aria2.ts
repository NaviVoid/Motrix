import { JSONRPCClient, JSONRPCClientOptions, JSONRPCNotification } from './JSONRPCClient'

export class Aria2 extends JSONRPCClient {
  override defaultOptions: JSONRPCClientOptions = {
    ...JSONRPCClient.defaultOptions,
    secure: false,
    host: 'localhost',
    port: 16800,
    secret: '',
    path: '/jsonrpc'
  }

  constructor (options?: JSONRPCClientOptions) {
    super({ ...Aria2.prototype.defaultOptions, ...options })
  }

  prefix (str: string): string {
    if (!str.startsWith('system.') && !str.startsWith('aria2.')) {
      str = 'aria2.' + str
    }
    return str
  }

  unprefix (str: string): string {
    const suffix = str.split('aria2.')[1]
    return suffix || str
  }

  addSecret (parameters: unknown[]): unknown[] {
    let params: unknown[] = this.secret ? ['token:' + this.secret] : []
    if (Array.isArray(parameters)) {
      params = params.concat(parameters)
    }
    return params
  }

  override _onnotification (notification: JSONRPCNotification): void {
    const { method, params } = notification
    const event = this.unprefix(method)
    if (event !== method) this.emit(event, params)
    return super._onnotification(notification)
  }

  override async call (method: string, ...params: unknown[]): Promise<unknown> {
    return super.call(this.prefix(method), this.addSecret(params))
  }

  async multicall (calls: [string, ...unknown[]][]): Promise<unknown> {
    const multi = [
      calls.map(([method, ...params]) => {
        return { methodName: this.prefix(method as string), params: this.addSecret(params) }
      })
    ]
    return super.call('system.multicall', multi)
  }

  override async batch (calls: [string, ...unknown[]][]): Promise<Promise<unknown>[]> {
    return super.batch(
      calls.map(([method, ...params]) => [
        this.prefix(method as string),
        this.addSecret(params)
      ])
    )
  }

  async listNotifications (): Promise<string[]> {
    const events = await this.call('system.listNotifications') as string[]
    return events.map((event: string) => this.unprefix(event))
  }

  async listMethods (): Promise<string[]> {
    const methods = await this.call('system.listMethods') as string[]
    return methods.map((method: string) => this.unprefix(method))
  }
}
