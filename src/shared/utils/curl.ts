import curlParser from '@bany/curl-to-json'

interface ParsedCurl {
  url: string
  params?: Record<string, string>
  header?: Record<string, string>
  cookie?: string
  'user-agent'?: string
  referer?: string
}

interface CurlHeader {
  cookie?: string
  'user-agent'?: string
  referer?: string
  authorization?: string
  [key: string]: string | undefined
}

interface FormWithDefaults {
  cookie?: string
  referer?: string
  userAgent?: string
  authorization?: string
  [key: string]: unknown
}

export const buildUrisFromCurl = (uris: string[] = []): string[] => {
  return uris.map((uri) => {
    if (uri.startsWith('curl')) {
      const parsedUri = curlParser(uri) as ParsedCurl
      uri = parsedUri.url
      if (parsedUri.params && Object.keys(parsedUri.params).length > 0) {
        const paramsStr = Object.keys(parsedUri.params)
          .map((k) => `${k}=${parsedUri.params![k]}`)
          .join('&')
        uri = `${uri}?${paramsStr}`
      }
      return uri
    } else {
      return uri
    }
  })
}

export const buildHeadersFromCurl = (uris: string[] = []): (CurlHeader | undefined)[] => {
  return uris.map((uri) => {
    if (uri.startsWith('curl')) {
      const parsed = curlParser(uri) as ParsedCurl
      const header: CurlHeader = parsed.header ?? {}
      if (parsed.cookie) {
        header.cookie = parsed.cookie
      }
      if (parsed['user-agent']) {
        header['user-agent'] = parsed['user-agent']
      }
      if (parsed.referer) {
        header.referer = parsed.referer
      }
      return header
    } else {
      return undefined
    }
  })
}

export const buildDefaultOptionsFromCurl = (form: FormWithDefaults, headers: (CurlHeader | undefined)[] = []): FormWithDefaults => {
  const firstNonNullHeader = headers.find((elem) => elem)
  if (firstNonNullHeader) {
    form.cookie = !form.cookie && firstNonNullHeader.cookie ? firstNonNullHeader.cookie : form.cookie
    form.referer = !form.referer && firstNonNullHeader.referer ? firstNonNullHeader.referer : form.referer
    form.userAgent = !form.userAgent && firstNonNullHeader['user-agent'] ? firstNonNullHeader['user-agent'] : form.userAgent
    form.authorization = !form.authorization && firstNonNullHeader.authorization ? firstNonNullHeader.authorization : form.authorization
  }
  return form
}
