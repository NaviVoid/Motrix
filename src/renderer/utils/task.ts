import { isEmpty } from 'lodash'

import {
  ADD_TASK_TYPE,
  NONE_SELECTED_FILES,
  SELECTED_ALL_FILES
} from '@shared/constants'
import { splitTaskLinks } from '@shared/utils'
import { buildOuts } from '@shared/utils/rename'

import {
  buildUrisFromCurl,
  buildHeadersFromCurl,
  buildDefaultOptionsFromCurl
} from '@shared/utils/curl'

interface TaskForm {
  allProxy: string
  cookie: string
  dir: string
  engineMaxConnectionPerServer: number
  followMetalink: string
  followTorrent: string
  maxConnectionPerServer: number
  newTaskShowDownloading: boolean
  out: string
  referer: string
  selectFile: string
  split: number
  torrent: string
  uris: string
  userAgent: string
  authorization: string
  [key: string]: any
}

interface InitTaskFormParams {
  appStore: {
    addTaskUrl: string
    addTaskOptions: Record<string, any>
  }
  preferenceStore: {
    config: Record<string, any>
  }
}

interface TaskOption {
  allProxy?: string
  dir?: string
  out?: string
  split?: number
  selectFile?: string
  header?: string[]
  [key: string]: any
}

interface UriPayload {
  uris: string[]
  outs: string[]
  options: TaskOption
}

interface TorrentPayload {
  torrent: string
  options: TaskOption
}

export const initTaskForm = ({ appStore, preferenceStore }: InitTaskFormParams): TaskForm => {
  const { addTaskUrl, addTaskOptions } = appStore
  const {
    allProxy,
    dir,
    engineMaxConnectionPerServer,
    followMetalink,
    followTorrent,
    maxConnectionPerServer,
    newTaskShowDownloading,
    split
  } = preferenceStore.config
  const result: TaskForm = {
    allProxy,
    cookie: '',
    dir,
    engineMaxConnectionPerServer,
    followMetalink,
    followTorrent,
    maxConnectionPerServer,
    newTaskShowDownloading,
    out: '',
    referer: '',
    selectFile: NONE_SELECTED_FILES,
    split,
    torrent: '',
    uris: addTaskUrl,
    userAgent: '',
    authorization: '',
    ...addTaskOptions
  }
  return result
}

export const buildHeader = (form: TaskForm): string[] => {
  const { userAgent, referer, cookie, authorization } = form
  const result: string[] = []

  if (!isEmpty(userAgent)) {
    result.push(`User-Agent: ${userAgent}`)
  }
  if (!isEmpty(referer)) {
    result.push(`Referer: ${referer}`)
  }
  if (!isEmpty(cookie)) {
    result.push(`Cookie: ${cookie}`)
  }
  if (!isEmpty(authorization)) {
    result.push(`Authorization: ${authorization}`)
  }

  return result
}

export const buildOption = (type: string, form: TaskForm): TaskOption => {
  const {
    allProxy,
    dir,
    out,
    selectFile,
    split
  } = form
  const result: TaskOption = {}

  if (!isEmpty(allProxy)) {
    result.allProxy = allProxy
  }

  if (!isEmpty(dir)) {
    result.dir = dir
  }

  if (!isEmpty(out)) {
    result.out = out
  }

  if (split > 0) {
    result.split = split
  }

  if (type === ADD_TASK_TYPE.TORRENT) {
    if (
      selectFile !== SELECTED_ALL_FILES &&
      selectFile !== NONE_SELECTED_FILES
    ) {
      result.selectFile = selectFile
    }
  }

  const header = buildHeader(form)
  if (!isEmpty(header)) {
    result.header = header
  }

  return result
}

export const buildUriPayload = (form: TaskForm): UriPayload => {
  let { uris, out } = form
  if (isEmpty(uris)) {
    throw new Error('task.new-task-uris-required')
  }

  const uriList: string[] = splitTaskLinks(uris)
  const curlHeaders = buildHeadersFromCurl(uriList)
  const cleanUris: string[] = buildUrisFromCurl(uriList)
  const outs: string[] = buildOuts(cleanUris, out)

  form = buildDefaultOptionsFromCurl(form, curlHeaders)

  const options = buildOption(ADD_TASK_TYPE.URI, form)
  const result: UriPayload = {
    uris: cleanUris,
    outs,
    options
  }
  return result
}

export const buildTorrentPayload = (form: TaskForm): TorrentPayload => {
  const { torrent } = form
  if (isEmpty(torrent)) {
    throw new Error('task.new-task-torrent-required')
  }

  const options = buildOption(ADD_TASK_TYPE.TORRENT, form)
  const result: TorrentPayload = {
    torrent,
    options
  }
  return result
}
