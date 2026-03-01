import { isEmpty } from 'lodash'
import axios from 'axios'
import { MAX_BT_TRACKER_LENGTH, ONE_SECOND, PROXY_SCOPES } from '@shared/constants'

interface AxiosProxyAuth {
  username: string
  password: string
}

interface AxiosProxy {
  protocol: string
  host: string
  port: string
  auth?: AxiosProxyAuth
}

interface ProxyConfig {
  enable?: boolean
  server?: string
  scope?: string[]
}

export const convertToAxiosProxy = (proxyServer = ''): AxiosProxy | undefined => {
  if (!proxyServer) {
    return
  }

  const url = new URL(proxyServer)
  const { username, password, protocol = 'http:', hostname, port } = url

  let result: AxiosProxy = {
    protocol: protocol.replace(':', ''),
    host: hostname,
    port
  }

  const auth = username || password
    ? {
      username,
      password
    }
    : undefined

  if (auth) {
    result = {
      ...result,
      auth
    }
  }

  return result
}

export const fetchBtTrackerFromSource = async (source: string[], proxyConfig: ProxyConfig = {}): Promise<string[]> => {
  if (isEmpty(source)) {
    return []
  }

  const now = Date.now()
  const { enable, server, scope = [] } = proxyConfig
  const proxy = enable && server && scope.includes(PROXY_SCOPES.UPDATE_TRACKERS)
    ? convertToAxiosProxy(server)
    : undefined

  // Axios's config.proxy is Node.js only
  const promises = source.map(async (url: string) => {
    return axios.get(`${url}?t=${now}`, {
      timeout: 30 * ONE_SECOND,
      proxy: proxy as false | undefined
    }).then((value) => value.data as string)
  })

  const results = await Promise.allSettled(promises)
  const values = results.map((item) => (item as PromiseFulfilledResult<string>).value)
  const result = [...new Set(values)]
  return result
}

export const convertTrackerDataToLine = (arr: string[] = []): string => {
  const result = arr.join('\r\n').replace(/^\s*[\r\n]/gm, '').trim()
  return result
}

export const convertTrackerDataToComma = (arr: string[] = []): string => {
  const result = convertTrackerDataToLine(arr).replace(/(?:\r\n|\r|\n)/g, ',').trim()
  return result
}

export const reduceTrackerString = (str = ''): string => {
  if (str.length <= MAX_BT_TRACKER_LENGTH) {
    return str
  }

  const subStr = str.substring(0, MAX_BT_TRACKER_LENGTH)
  const index = subStr.lastIndexOf(',')
  if (index === -1) {
    return subStr
  }

  const result = subStr.substring(0, index)
  return result
}
