<template>
  <el-drawer
    custom-class="panel task-detail-drawer"
    size="61.8%"
    v-if="gid"
    :title="$t('task.task-detail-title')"
    :with-header="true"
    :show-close="true"
    :destroy-on-close="true"
    :model-value="visible"
    :before-close="handleClose"
    @closed="handleClosed"
  >
    <el-tabs
      tab-position="top"
      class="task-detail-tab"
      value="general"
      :before-leave="handleTabBeforeLeave"
      @tab-click="handleTabClick"
    >
      <el-tab-pane name="general">
        <template #label><span class="task-detail-tab-label"><i class="el-icon-info"></i></span></template>
        <mo-task-general :task="task" />
      </el-tab-pane>
      <el-tab-pane name="activity" lazy>
        <template #label><span class="task-detail-tab-label"><i class="el-icon-s-grid"></i></span></template>
        <mo-task-activity ref="taskGraphic" :task="task" />
      </el-tab-pane>
      <el-tab-pane name="trackers" lazy v-if="isBT">
        <template #label><span class="task-detail-tab-label"><i class="el-icon-discover"></i></span></template>
        <mo-task-trackers :task="task" />
      </el-tab-pane>
      <el-tab-pane name="peers" lazy v-if="isBT">
        <template #label><span class="task-detail-tab-label"><i class="el-icon-s-custom"></i></span></template>
        <mo-task-peers :peers="peers" />
      </el-tab-pane>
      <el-tab-pane name="files" lazy>
        <template #label><span class="task-detail-tab-label"><i class="el-icon-files"></i></span></template>
        <mo-task-files
          ref="detailFileList"
          mode="DETAIL"
          :files="fileList"
          @selection-change="handleSelectionChange"
        />
      </el-tab-pane>
    </el-tabs>
    <div class="task-detail-actions">
      <div class="action-wrapper action-wrapper-left" v-if="optionsChanged">
        <el-button @click="resetChanged">
          {{$t('app.reset')}}
        </el-button>
      </div>
      <div class="action-wrapper action-wrapper-center">
        <mo-task-item-actions mode="DETAIL" :task="task" />
      </div>
      <div class="action-wrapper action-wrapper-right" v-if="optionsChanged">
        <el-button type="primary" @click="saveChanged">
          {{$t('app.save')}}
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue'
  import { useI18n } from 'vue-i18n'
  import is from 'electron-is'
  import { debounce, merge } from 'lodash'
  import { usePreferenceStore } from '@/store/preference'
  import { useTaskStore } from '@/store/task'
  import {
    calcFormLabelWidth,
    checkTaskIsBT,
    checkTaskIsSeeder,
    getFileName,
    getFileExtension
  } from '@shared/utils'
  import {
    EMPTY_STRING,
    NONE_SELECTED_FILES,
    SELECTED_ALL_FILES,
    TASK_STATUS
  } from '@shared/constants'
  import MoTaskItemActions from '@/components/Task/TaskItemActions.vue'
  import MoTaskGeneral from './TaskGeneral.vue'
  import MoTaskActivity from './TaskActivity.vue'
  import MoTaskTrackers from './TaskTrackers.vue'
  import MoTaskPeers from './TaskPeers.vue'
  import MoTaskFiles from './TaskFiles.vue'

  defineOptions({ name: 'mo-task-detail' })

  const { t } = useI18n()
  const instance = getCurrentInstance()!
  const $msg = instance.proxy!.$msg

  const props = defineProps<{
    gid?: string
    task?: Record<string, any>
    files?: any[]
    peers?: any[]
    visible?: boolean
  }>()

  const cached = {
    files: [] as any[]
  }

  const preferenceStore = usePreferenceStore()
  const taskStore = useTaskStore()

  const form = ref<Record<string, any>>({})
  const formLabelWidth = ref(calcFormLabelWidth(preferenceStore.config.locale))
  const locale = ref(preferenceStore.config.locale)
  const activeTab = ref('general')
  const graphicWidth = ref(0)
  const optionsChanged = ref(false)
  const filesSelection = ref<string>(EMPTY_STRING)
  const selectionChangedCount = ref(0)

  const taskGraphic = ref<any>(null)
  const detailFileList = ref<any>(null)

  const isRenderer = computed(() => is.renderer())

  const isBT = computed(() => checkTaskIsBT(props.task))

  const isSeeder = computed(() => checkTaskIsSeeder(props.task))

  const taskStatus = computed(() => {
    if (isSeeder.value) {
      return TASK_STATUS.SEEDING
    } else {
      return props.task?.status
    }
  })

  const fileList = computed(() => {
    const files = props.files ?? []
    const result = files.map((item) => {
      const name = getFileName(item.path)
      const extension = getFileExtension(name)
      return {
        idx: Number(item.index),
        selected: item.selected === 'true',
        path: item.path,
        name,
        extension: `.${extension}`,
        length: parseInt(item.length, 10),
        completedLength: item.completedLength
      }
    })
    merge(cached.files, result)
    return cached.files
  })

  const selectedFileList = computed(() => {
    return fileList.value.filter((item) => item.selected)
  })

  watch(() => props.gid, () => {
    cached.files = []
  })

  function handleClose (done: any) {
    window.removeEventListener('resize', handleAppResize)
    taskStore.hideTaskDetail()
  }

  function handleClosed (done: any) {
    taskStore.updateCurrentTaskGid(EMPTY_STRING)
    taskStore.updateCurrentTaskItem(null)
    optionsChanged.value = false
    resetFaskFilesSelection()
  }

  function handleTabBeforeLeave (activeName: string, oldActiveName: string) {
    activeTab.value = activeName
    optionsChanged.value = false
    switch (oldActiveName) {
    case 'peers':
      taskStore.toggleEnabledFetchPeers(false)
      break
    case 'files':
      resetFaskFilesSelection()
      break
    }
  }

  function handleTabClick (tab: any) {
    const { name } = tab
    switch (name) {
    case 'peers':
      taskStore.toggleEnabledFetchPeers(true)
      break
    case 'files':
      setImmediate(() => {
        updateFilesListSelection()
      })
      break
    }
  }

  function resetChanged () {
    switch (activeTab.value) {
    case 'files':
      resetFaskFilesSelection()
      updateFilesListSelection()
      break
    }
    optionsChanged.value = false
  }

  function saveChanged () {
    switch (activeTab.value) {
    case 'files':
      saveFaskFilesSelection()
      break
    }
    optionsChanged.value = false
  }

  function handleAppResize () {
    debounce(() => {
      console.log('resize===>', activeTab.value, taskGraphic.value)
      if (activeTab.value === 'activity' && taskGraphic.value) {
        taskGraphic.value.updateGraphicWidth()
      }
    }, 250)
  }

  function updateFilesListSelection () {
    if (!detailFileList.value) {
      return
    }

    detailFileList.value.toggleSelection(selectedFileList.value)
  }

  function handleSelectionChange (val: string) {
    filesSelection.value = val
    selectionChangedCount.value += 1
    if (selectionChangedCount.value > 1) {
      optionsChanged.value = true
    }
  }

  function resetFaskFilesSelection () {
    filesSelection.value = EMPTY_STRING
    selectionChangedCount.value = 0
  }

  function saveFaskFilesSelection () {
    const gid = props.gid
    if (filesSelection.value === NONE_SELECTED_FILES) {
      $msg.warning(t('task.select-at-least-one'))
      return
    }

    const options = {
      selectFile: filesSelection.value !== SELECTED_ALL_FILES ? filesSelection.value : EMPTY_STRING
    }
    taskStore.changeTaskOption({ gid, options })
  }

  onMounted(() => {
    window.addEventListener('resize', handleAppResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleAppResize)
    cached.files = []
  })
</script>

<style lang="scss">
.task-detail-drawer {
  min-width: 478px;
  .el-drawer__header {
    padding-top: 2rem;
    margin-bottom: 0;
  }
  .el-drawer__body {
    position: relative;
    overflow: hidden;
  }
  .task-detail-actions {
    position: sticky;
    left: 0;
    bottom: 1rem;
    z-index: inherit;
    width: 100%;
    text-align: center;
    font-size: 0;
    padding: 0 1.25rem;
    display: flex;
    align-content: space-between;
    justify-content: space-between;
    .task-item-actions {
      display: inline-block;
      &> .task-item-action {
        margin: 0 0.5rem;
      }
    }
  }
  .task-detail-drawer-title {
    &> span, &> ul {
      vertical-align: middle;
    }
  }
  .action-wrapper {
    flex: 1;
  }
  .action-wrapper-left {
    text-align: left;
  }
  .action-wrapper-center {
    padding: 1px 0;
    &> .task-item-actions {
      margin: 0 auto;
    }
  }
  .action-wrapper-right {
    text-align: right;
  }
}

.task-detail-tab {
  height: 100%;
  padding: 0.5rem 1.25rem 3.125rem;
  display: flex;
  flex-direction: column;
  .task-detail-tab-label {
    padding: 0 0.75rem;
  }
  .el-tabs__content {
    position: relative;
    height: 100%;
  }
  .el-tab-pane {
    overflow-x: hidden;
    overflow-y: auto;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}

.tab-panel-actions {
  display: flex;
  justify-content: space-between;
  position: absolute;
  bottom: -28px;
  left: 0;
  width: 100%;
}
</style>
