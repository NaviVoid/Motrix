<template>
  <div class="mo-task-files" v-if="files">
    <div class="mo-table-wrapper">
      <el-table
        stripe
        ref="torrentTable"
        :height="height"
        :data="files"
        tooltip-effect="dark"
        style="width: 100%"
        @row-dblclick="handleRowDbClick"
        @selection-change="handleSelectionChange">
        <el-table-column
          type="selection"
          width="42">
        </el-table-column>
        <el-table-column
          :label="$t('task.file-name')"
          min-width="200"
          show-overflow-tooltip>
          <template #default="scope">{{ scope.row.name }}</template>
        </el-table-column>
        <el-table-column
          :label="$t('task.file-extension')"
          width="80">
          <template #default="scope">{{ removeExtensionDot(scope.row.extension) }}</template>
        </el-table-column>
        <el-table-column
          v-if="mode === 'DETAIL'"
          :label="`%`"
          align="right"
          width="50">
          <template #default="scope">{{ calcProgress(scope.row.length, scope.row.completedLength, 1) }}</template>
        </el-table-column>
        <el-table-column
          v-if="mode === 'DETAIL'"
          :label="`✓`"
          align="right"
          width="85">
          <template #default="scope">{{ bytesToSize(scope.row.completedLength) }}</template>
        </el-table-column>
        <el-table-column
          :label="$t('task.file-size')"
          align="right"
          width="85">
          <template #default="scope">{{ bytesToSize(scope.row.length) }}</template>
        </el-table-column>
      </el-table>
    </div>
    <el-row class="file-filters" :gutter="12">
      <el-col
        class="quick-filters"
        :xs="24"
        :sm="8"
        :md="8"
        :lg="8"
      >
        <el-button-group>
          <el-button @click="toggleVideoSelection()">
            <mo-icon name="video" width="12" height="12" />
          </el-button>
          <el-button @click="toggleAudioSelection()">
            <mo-icon name="audio" width="12" height="12" />
          </el-button>
          <el-button @click="toggleImageSelection()">
            <mo-icon name="image" width="12" height="12" />
          </el-button>
          <el-button @click="toggleDocumentSelection()">
            <mo-icon name="document" width="12" height="12" />
          </el-button>
        </el-button-group>
      </el-col>
      <el-col
        class="files-summary"
        :xs="24"
        :sm="16"
        :md="16"
        :lg="16"
      >
        {{ $t('task.selected-files-sum', { selectedFilesCount, selectedFilesTotalSize }) }}
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { isEmpty } from 'lodash'
  import '@/components/Icons/video'
  import '@/components/Icons/audio'
  import '@/components/Icons/image'
  import '@/components/Icons/document'
  import {
    NONE_SELECTED_FILES,
    SELECTED_ALL_FILES
  } from '@shared/constants'
  import {
    bytesToSize,
    calcProgress,
    filterAudioFiles,
    filterDocumentFiles,
    filterImageFiles,
    filterVideoFiles,
    removeExtensionDot
  } from '@shared/utils'

  defineOptions({ name: 'mo-task-files' })

  const props = withDefaults(defineProps<{
    mode?: string
    height?: number | string
    files?: any[]
  }>(), {
    mode: 'ADD',
    files: () => []
  })

  const emit = defineEmits<{
    (e: 'selection-change', selectedFileIndex: string): void
  }>()

  const selectedFiles = ref<any[]>([])
  const torrentTable = ref<any>(null)

  const selectedFilesCount = computed(() => selectedFiles.value.length)

  const selectedFilesTotalSize = computed(() => {
    const result = selectedFiles.value.reduce((acc: number, cur: any) => {
      return acc + parseInt(cur.length, 10)
    }, 0)
    return bytesToSize(result)
  })

  const selectedFileIndex = computed(() => {
    if (props.files.length === 0 || selectedFiles.value.length === 0) {
      return NONE_SELECTED_FILES
    }
    if (props.files.length === selectedFiles.value.length) {
      return SELECTED_ALL_FILES
    }
    const indexArr = selectedFiles.value.map((item: any) => item.idx)
    const result = indexArr.join(',')
    return result
  })

  watch(selectedFileIndex, () => {
    emit('selection-change', selectedFileIndex.value)
  })

  function toggleAllSelection () {
    if (!torrentTable.value) {
      return
    }
    torrentTable.value.toggleAllSelection()
  }

  function clearSelection () {
    if (!torrentTable.value) {
      return
    }
    torrentTable.value.clearSelection()
  }

  function toggleSelection (rows: any[]) {
    if (isEmpty(rows)) {
      torrentTable.value.clearSelection()
    } else {
      torrentTable.value.clearSelection()
      rows.forEach((row: any) => {
        torrentTable.value.toggleRowSelection(row, true)
      })
    }
  }

  function toggleVideoSelection () {
    const filtered = filterVideoFiles(props.files)
    toggleSelection(filtered)
  }

  function toggleAudioSelection () {
    const filtered = filterAudioFiles(props.files)
    toggleSelection(filtered)
  }

  function toggleImageSelection () {
    const filtered = filterImageFiles(props.files)
    toggleSelection(filtered)
  }

  function toggleDocumentSelection () {
    const filtered = filterDocumentFiles(props.files)
    toggleSelection(filtered)
  }

  function handleRowDbClick (row: any, column: any, event: Event) {
    torrentTable.value.toggleRowSelection(row)
  }

  function handleSelectionChange (val: any[]) {
    selectedFiles.value = val
  }

  defineExpose({
    toggleAllSelection,
    clearSelection,
    toggleSelection
  })
</script>

<style lang="scss">
.file-filters {
  margin-top: 0.5rem;
  .quick-filters {
    button {
      font-size: 0;
    }
  }
  .files-summary {
    text-align: right;
    font-size: $--font-size-base;
    color: $--color-text-regular;
    line-height: 1.75rem;
  }
}
</style>
