export interface JSONRPCErrorData {
  message: string
  code: number
  data?: unknown
}

export class JSONRPCError extends Error {
  code: number
  data: unknown
  override name: string

  constructor ({ message, code, data }: JSONRPCErrorData) {
    super(message)
    this.code = code
    if (data) this.data = data
    this.name = this.constructor.name
  }
}
