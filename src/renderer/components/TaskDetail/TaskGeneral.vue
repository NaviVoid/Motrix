<template>
  <el-form
    class="mo-task-general"
    ref="form"
    :model="form"
    :label-width="formLabelWidth"
    v-if="task"
  >
    <el-form-item :label="`${$t('task.task-gid')}: `">
      <div class="form-static-value">
        {{ task.gid }}
      </div>
    </el-form-item>
    <el-form-item :label="`${$t('task.task-name')}: `">
      <div class="form-static-value">
        {{ taskFullName }}
      </div>
    </el-form-item>
    <el-form-item :label="`${$t('task.task-dir')}: `">
      <el-input placeholder="" readonly v-model="path">
        <template #append>
          <mo-show-in-folder
            v-if="isRenderer"
            :path="path"
          />
        </template>
      </el-input>
    </el-form-item>
    <el-form-item :label="`${$t('task.task-status')}: `">
      <div class="form-static-value">
        <mo-task-status :theme="currentTheme" :status="taskStatus" />
      </div>
    </el-form-item>
    <el-form-item :label="`${$t('task.task-error-info')}: `" v-if="task.errorCode && task.errorCode !== '0'">
      <div class="form-static-value">
        {{ task.errorCode }} {{ task.errorMessage }}
      </div>
    </el-form-item>

    <el-divider v-if="isBT">
      <i class="el-icon-attract"></i>
      {{ $t('task.task-bittorrent-info') }}
    </el-divider>

    <el-form-item :label="`${$t('task.task-info-hash')}: `" v-if="isBT">
      <div class="form-static-value">
        {{ task.infoHash }}
        <i class="copy-link" @click="handleCopyClick">
          <mo-icon
            name="link"
            width="12"
            height="12"
          />
        </i>
      </div>
    </el-form-item>
    <el-form-item :label="`${$t('task.task-piece-length')}: `" v-if="isBT">
      <div class="form-static-value">
        {{ bytesToSize(task.pieceLength) }}
      </div>
    </el-form-item>
    <el-form-item :label="`${$t('task.task-num-pieces')}: `" v-if="isBT">
      <div class="form-static-value">
        {{ task.numPieces }}
      </div>
    </el-form-item>
    <el-form-item :label="`${$t('task.task-bittorrent-creation-date')}: `" v-if="isBT">
      <div class="form-static-value">
        {{ localeDateTimeFormat(task.bittorrent.creationDate, locale) }}
      </div>
    </el-form-item>
    <el-form-item :label="`${$t('task.task-bittorrent-comment')}: `" v-if="isBT">
      <div class="form-static-value">
        {{ task.bittorrent.comment }}
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
  import { ref, computed, getCurrentInstance } from 'vue'
  import is from 'electron-is'
  import { useI18n } from 'vue-i18n'
  import { useAppStore } from '@/store/app'
  import { usePreferenceStore } from '@/store/preference'
  import {
    bytesToSize,
    calcFormLabelWidth,
    checkTaskIsBT,
    checkTaskIsSeeder,
    getTaskName,
    getTaskUri,
    localeDateTimeFormat
  } from '@shared/utils'
  import { APP_THEME, TASK_STATUS } from '@shared/constants'
  import { getTaskFullPath } from '@/utils/native'
  import MoShowInFolder from '@/components/Native/ShowInFolder.vue'
  import MoTaskStatus from '@/components/Task/TaskStatus.vue'
  import '@/components/Icons/folder'
  import '@/components/Icons/link'

  defineOptions({ name: 'mo-task-general' })

  const props = defineProps<{
    task?: Record<string, any>
  }>()

  const { t } = useI18n()
  const instance = getCurrentInstance()!
  const $msg = instance.proxy!.$msg

  const appStore = useAppStore()
  const preferenceStore = usePreferenceStore()
  const { locale } = preferenceStore.config

  const form = ref<Record<string, any>>({})
  const formLabelWidth = calcFormLabelWidth(locale)

  const isRenderer = is.renderer()

  const systemTheme = computed(() => appStore.systemTheme)
  const theme = computed(() => preferenceStore.config.theme)

  const currentTheme = computed(() => {
    if (theme.value === APP_THEME.AUTO) {
      return systemTheme.value
    } else {
      return theme.value
    }
  })

  const taskFullName = computed(() => {
    return getTaskName(props.task, {
      defaultName: t('task.get-task-name'),
      maxLen: -1
    })
  })

  const taskName = computed(() => {
    return getTaskName(props.task, {
      defaultName: t('task.get-task-name'),
      maxLen: 32
    })
  })

  const isSeeder = computed(() => checkTaskIsSeeder(props.task))

  const taskStatus = computed(() => {
    if (isSeeder.value) {
      return TASK_STATUS.SEEDING
    } else {
      return props.task?.status
    }
  })

  const path = computed(() => getTaskFullPath(props.task))

  const isBT = computed(() => checkTaskIsBT(props.task))

  function handleCopyClick () {
    const uri = getTaskUri(props.task)
    navigator.clipboard.writeText(uri)
      .then(() => {
        $msg.success(t('task.copy-link-success'))
      })
  }
</script>

<style lang="scss">
.copy-link {
  cursor: pointer;
}
</style>
