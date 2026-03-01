<template>
  <el-upload
    class="upload-torrent"
    drag
    action="/"
    v-if="isTorrentsEmpty"
    :limit="1"
    :multiple="false"
    accept=".torrent"
    :on-change="handleChange"
    :on-exceed="handleExceed"
    :auto-upload="false"
    :show-file-list="false">
    <i class="upload-inbox-icon"><mo-icon name="inbox" width="24" height="24" /></i>
    <div class="el-upload__text">
      {{ $t('task.select-torrent') }}
      <div class="torrent-name" v-if="name">{{ name }}</div>
    </div>
  </el-upload>
  <div
    class="selective-torrent"
    v-else
  >
    <el-row class="torrent-info" :gutter="12">
      <el-col class="torrent-name" :span="20">
        <el-tooltip class="item" effect="dark" :content="name" placement="top">
          <span>{{ name }}</span>
        </el-tooltip>
      </el-col>
      <el-col class="torrent-actions" :span="4">
        <span @click="handleTrashClick">
          <mo-icon name="trash" width="14" height="14" />
        </span>
      </el-col>
    </el-row>
    <mo-task-files
      ref="torrentFileList"
      mode="ADD"
      :files="files"
      :height="200"
      @selection-change="handleSelectionChange"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useAppStore } from '@/store/app'
  import { usePreferenceStore } from '@/store/preference'
  import { remote } from 'parse-torrent'
  import MoTaskFiles from '@/components/TaskDetail/TaskFiles.vue'
  import '@/components/Icons/inbox'
  import {
    EMPTY_STRING,
    NONE_SELECTED_FILES,
    SELECTED_ALL_FILES
  } from '@shared/constants'
  import {
    buildFileList,
    listTorrentFiles,
    getAsBase64
  } from '@shared/utils'

  defineOptions({ name: 'mo-select-torrent' })

  const emit = defineEmits<{
    (e: 'change', torrent: string, selectedFiles: string): void
  }>()

  const appStore = useAppStore()
  const preferenceStore = usePreferenceStore()

  const name = ref(EMPTY_STRING)
  const currentTorrent = ref(EMPTY_STRING)
  const files = ref<any[]>([])
  const selectedFiles = ref<any[]>([])
  const torrentFileList = ref<InstanceType<typeof TaskFiles> | null>(null)

  const torrents = computed(() => appStore.addTaskTorrents)
  const config = computed(() => preferenceStore.config)

  const isTorrentsEmpty = computed(() => torrents.value.length === 0)

  watch(torrents, (fileList) => {
    if (fileList.length === 0) {
      reset()
      return
    }

    const file = fileList[0]
    if (!file.raw) {
      return
    }

    remote(file.raw, { timeout: 60 * 1000 }, (err: Error | null, parsedTorrent: any) => {
      if (err) throw err
      console.log('[Motrix] parsed torrent: ', parsedTorrent)
      files.value = listTorrentFiles(parsedTorrent.files)
      torrentFileList.value?.toggleAllSelection()

      getAsBase64(file.raw, (torrent: string) => {
        name.value = file.name
        currentTorrent.value = torrent
        emit('change', torrent, SELECTED_ALL_FILES)
      })
    })
  })

  function reset () {
    name.value = EMPTY_STRING
    currentTorrent.value = EMPTY_STRING
    files.value = []
    torrentFileList.value?.clearSelection()
    emit('change', EMPTY_STRING, NONE_SELECTED_FILES)
  }

  function handleChange (file: any, fileList: any[]) {
    appStore.addTaskAddTorrents({ fileList })
  }

  function handleExceed (uploadFiles: any[]) {
    const fileList = buildFileList(uploadFiles[0])
    appStore.addTaskAddTorrents({ fileList })
  }

  function handleTrashClick () {
    appStore.addTaskAddTorrents({ fileList: [] })
  }

  function handleSelectionChange (val: string) {
    emit('change', currentTorrent.value, val)
  }
</script>

<style lang="scss">
.upload-torrent {
  width: 100%;
  .el-upload, .el-upload-dragger {
    width: 100%;
  }
  .el-upload-dragger {
    border-radius: 4px;
    padding: 24px;
    height: auto;
  }
  .upload-inbox-icon {
    display: inline-block;
    margin-bottom: 12px;
  }
  .torrent-name {
    margin-top: 4px;
    font-size: $--font-size-small;
    color: $--color-text-secondary;
    line-height: 16px;
  }
}
.selective-torrent {
  .torrent-name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .torrent-info {
    margin-bottom: 15px;
    font-size: 12px;
    line-height: 16px;
  }
  .torrent-actions {
    text-align: right;
    line-height: 16px;
    &> span {
      cursor: pointer;
      display: inline-block;
      vertical-align: middle;
      height: 14px;
      padding: 1px;
    }
  }
}
</style>
