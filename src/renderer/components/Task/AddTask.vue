<template>
  <el-dialog
    custom-class="tab-title-dialog add-task-dialog"
    width="67vw"
    :model-value="visible"
    :top="dialogTop"
    :show-close="false"
    :before-close="beforeClose"
    @open="handleOpen"
    @opened="handleOpened"
    @closed="handleClosed"
  >
    <el-form ref="taskForm" label-position="left" :model="form" :rules="rules">
      <el-tabs :model-value="type" @tab-click="handleTabClick">
        <el-tab-pane :label="$t('task.uri-task')" name="uri">
          <el-form-item>
            <el-input
              ref="uri"
              type="textarea"
              auto-complete="off"
              :autosize="{ minRows: 3, maxRows: 5 }"
              :placeholder="$t('task.uri-task-tips')"
              @paste="handleUriPaste"
              v-model="form.uris"
            >
            </el-input>
          </el-form-item>
        </el-tab-pane>
        <el-tab-pane :label="$t('task.torrent-task')" name="torrent">
          <el-form-item>
            <mo-select-torrent v-on:change="handleTorrentChange" />
          </el-form-item>
        </el-tab-pane>
      </el-tabs>
      <el-row :gutter="12">
        <el-col :span="15" :xs="24">
          <el-form-item
            :label="`${$t('task.task-out')}: `"
            :label-width="formLabelWidth"
          >
            <el-input
              :placeholder="$t('task.task-out-tips')"
              v-model="form.out"
            >
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="9" :xs="24">
          <el-form-item
            :label="`${$t('task.task-split')}: `"
            :label-width="formLabelWidth"
          >
            <el-input-number
              v-model="form.split"
              controls-position="right"
              :min="1"
              :max="config.engineMaxConnectionPerServer"
              :label="$t('task.task-split')"
            >
            </el-input-number>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item
        :label="`${$t('task.task-dir')}: `"
        :label-width="formLabelWidth"
      >
        <el-input
          placeholder=""
          v-model="form.dir"
          :readonly="isMas"
        >
          <template #prepend>
            <mo-history-directory
              @selected="handleHistoryDirectorySelected"
            />
          </template>
          <template #append>
            <mo-select-directory
              v-if="isRenderer"
              @selected="handleNativeDirectorySelected"
            />
          </template>
        </el-input>
      </el-form-item>
      <div class="task-advanced-options" v-if="showAdvanced">
        <el-form-item
          :label="`${$t('task.task-user-agent')}: `"
          :label-width="formLabelWidth"
        >
          <el-input
            type="textarea"
            auto-complete="off"
            :autosize="{ minRows: 2, maxRows: 3 }"
            :placeholder="$t('task.task-user-agent')"
            v-model="form.userAgent"
          >
          </el-input>
        </el-form-item>
        <el-form-item
          :label="`${$t('task.task-authorization')}: `"
          :label-width="formLabelWidth"
        >
          <el-input
            type="textarea"
            auto-complete="off"
            :autosize="{ minRows: 2, maxRows: 3 }"
            :placeholder="$t('task.task-authorization')"
            v-model="form.authorization"
          >
          </el-input>
        </el-form-item>
        <el-form-item
          :label="`${$t('task.task-referer')}: `"
          :label-width="formLabelWidth"
        >
          <el-input
            type="textarea"
            auto-complete="off"
            :autosize="{ minRows: 2, maxRows: 3 }"
            :placeholder="$t('task.task-referer')"
            v-model="form.referer"
          >
          </el-input>
        </el-form-item>
        <el-form-item
          :label="`${$t('task.task-cookie')}: `"
          :label-width="formLabelWidth"
        >
          <el-input
            type="textarea"
            auto-complete="off"
            :autosize="{ minRows: 2, maxRows: 3 }"
            :placeholder="$t('task.task-cookie')"
            v-model="form.cookie"
          >
          </el-input>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="16" :xs="24">
            <el-form-item
              :label="`${$t('task.task-proxy')}: `"
              :label-width="formLabelWidth"
            >
              <el-input
                placeholder="[http://][USER:PASSWORD@]HOST[:PORT]"
                v-model="form.allProxy">
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8" :xs="24">
            <div class="help-link">
              <a target="_blank" href="https://github.com/agalwood/Motrix/wiki/Proxy" rel="noopener noreferrer">
                {{ $t('preferences.proxy-tips') }}
                <mo-icon name="link" width="12" height="12" />
              </a>
            </div>
          </el-col>
        </el-row>
        <el-form-item label="" :label-width="formLabelWidth" style="margin-top: 12px;">
          <el-checkbox class="chk" v-model="form.newTaskShowDownloading">
            {{$t('task.navigate-to-downloading')}}
          </el-checkbox>
        </el-form-item>
      </div>
    </el-form>
    <template #header>
      <button
        type="button"
        class="el-dialog__headerbtn"
        aria-label="Close"
        @click="handleClose">
        <i class="el-dialog__close el-icon el-icon-close"></i>
      </button>
    </template>
    <template #footer><div class="dialog-footer">
      <el-row>
        <el-col :span="9" :xs="9">
          <el-checkbox class="chk" v-model="showAdvanced">
            {{$t('task.show-advanced-options')}}
          </el-checkbox>
        </el-col>
        <el-col :span="15" :xs="15">
          <el-button @click="handleCancel('taskForm')">
            {{$t('app.cancel')}}
          </el-button>
          <el-button
            type="primary"
            @click="submitForm('taskForm')"
          >
            {{$t('app.submit')}}
          </el-button>
        </el-col>
      </el-row>
    </div></template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, watch, getCurrentInstance } from 'vue'
  import is from 'electron-is'
  import { storeToRefs } from 'pinia'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { useAppStore } from '@/store/app'
  import { usePreferenceStore } from '@/store/preference'
  import { useTaskStore } from '@/store/task'
  import { isEmpty } from 'lodash'
  import MoHistoryDirectory from '@/components/Preference/HistoryDirectory.vue'
  import MoSelectDirectory from '@/components/Native/SelectDirectory.vue'
  import MoSelectTorrent from '@/components/Task/SelectTorrent.vue'
  import {
    initTaskForm,
    buildUriPayload,
    buildTorrentPayload
  } from '@/utils/task'
  import { ADD_TASK_TYPE } from '@shared/constants'
  import { detectResource } from '@shared/utils'
  import '@/components/Icons/inbox'

  defineOptions({ name: 'mo-add-task' })

  const props = withDefaults(defineProps<{
    visible?: boolean
    type?: string
  }>(), {
    visible: false,
    type: ADD_TASK_TYPE.URI
  })

  const { t } = useI18n()
  const router = useRouter()
  const instance = getCurrentInstance()!
  const $msg = instance.proxy!.$msg

  const appStore = useAppStore()
  const preferenceStore = usePreferenceStore()
  const taskStore = useTaskStore()

  const { taskList } = storeToRefs(appStore)
  const { config } = storeToRefs(preferenceStore)

  const formLabelWidth = ref('110px')
  const showAdvanced = ref(false)
  const form = ref<Record<string, any>>({})
  const rules = ref<Record<string, any>>({})

  const uri = ref<any>(null)
  const taskForm = ref<any>(null)

  const isRenderer = computed(() => is.renderer())
  const isMas = computed(() => is.mas())

  const taskType = computed(() => props.type)

  const dialogTop = computed(() => showAdvanced.value ? '8vh' : '15vh')

  watch(taskType, (current, previous) => {
    if (props.visible && previous === ADD_TASK_TYPE.URI) {
      return
    }

    if (current === ADD_TASK_TYPE.URI) {
      setTimeout(() => {
        uri.value && uri.value.focus()
      }, 50)
    }
  })

  watch(() => props.visible, (current) => {
    if (current === true) {
      document.addEventListener('keydown', handleHotkey)
    } else {
      document.removeEventListener('keydown', handleHotkey)
    }
  })

  async function autofillResourceLink () {
    const content = await navigator.clipboard.readText()
    const hasResource = detectResource(content)
    if (!hasResource) {
      return
    }

    if (isEmpty(form.value.uris)) {
      form.value.uris = content
    }
  }

  function beforeClose () {
    if (isEmpty(form.value.uris) && isEmpty(form.value.torrent)) {
      handleClose()
    }
  }

  function handleOpen () {
    form.value = initTaskForm({ appStore: useAppStore(), preferenceStore: usePreferenceStore() })
    if (taskType.value === ADD_TASK_TYPE.URI) {
      autofillResourceLink()
      setTimeout(() => {
        uri.value && uri.value.focus()
      }, 50)
    }
  }

  function handleOpened () {
    detectThunderResource(form.value.uris)
  }

  function handleCancel () {
    appStore.hideAddTaskDialog()
  }

  function handleClose () {
    appStore.hideAddTaskDialog()
    appStore.updateAddTaskOptions({})
  }

  function handleClosed () {
    reset()
  }

  function handleHotkey (event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()

      submitForm('taskForm')
    }
  }

  function handleTabClick (tab: any) {
    appStore.changeAddTaskType(tab.name)
  }

  function handleUriPaste () {
    setImmediate(() => {
      const uris = uri.value.value
      detectThunderResource(uris)
    })
  }

  function detectThunderResource (uris = '') {
    if (uris.includes('thunder://')) {
      $msg({
        type: 'warning',
        message: t('task.thunder-link-tips'),
        duration: 6000
      })
    }
  }

  function handleTorrentChange (torrent: any, selectedFileIndex: any) {
    form.value.torrent = torrent
    form.value.selectFile = selectedFileIndex
  }

  function handleHistoryDirectorySelected (dir: string) {
    form.value.dir = dir
  }

  function handleNativeDirectorySelected (dir: string) {
    form.value.dir = dir
    preferenceStore.recordHistoryDirectory(dir)
  }

  function reset () {
    showAdvanced.value = false
    form.value = initTaskForm({ appStore: useAppStore(), preferenceStore: usePreferenceStore() })
  }

  function addTask (type: string, formData: Record<string, any>) {
    let payload = null
    if (type === ADD_TASK_TYPE.URI) {
      payload = buildUriPayload(formData)
      taskStore.addUri(payload).catch((err: any) => {
        $msg.error(err.message)
      })
    } else if (type === ADD_TASK_TYPE.TORRENT) {
      payload = buildTorrentPayload(formData)
      taskStore.addTorrent(payload).catch((err: any) => {
        $msg.error(err.message)
      })
    } else if (type === 'metalink') {
    // @TODO addMetalink
    } else {
      console.error('[Motrix] Add task fail', formData)
    }
  }

  function submitForm (formName: string) {
    taskForm.value.validate((valid: boolean) => {
      if (!valid) {
        return false
      }

      try {
        addTask(props.type, form.value)

        appStore.hideAddTaskDialog()
        if (form.value.newTaskShowDownloading) {
          router.push({
            path: '/task/active'
          }).catch((err: any) => {
            console.log(err)
          })
        }
      } catch (err: any) {
        $msg.error(t(err.message))
      }
    })
  }
</script>

<style lang="scss">
.el-dialog.add-task-dialog {
  max-width: 632px;
  min-width: 380px;
  .task-advanced-options .el-form-item:last-of-type {
    margin-bottom: 0;
  }
  .el-tabs__header {
    user-select: none;
  }
  .el-input-number.el-input-number--mini {
    width: 100%;
  }
  .help-link {
    font-size: 12px;
    line-height: 14px;
    padding-top: 7px;
    > a {
      color: #909399;
    }
  }
  .el-dialog__footer {
    padding-top: 20px;
    background-color: $--add-task-dialog-footer-background;
    border-radius: 0 0 5px 5px;
  }
  .dialog-footer {
    .chk {
      float: left;
      line-height: 28px;
      &.el-checkbox {
        & .el-checkbox__input {
          line-height: 19px;
        }
        & .el-checkbox__label {
          padding-left: 6px;
        }
      }
    }
  }
}
</style>
