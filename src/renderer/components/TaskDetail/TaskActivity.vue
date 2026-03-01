<template>
  <el-form
    class="mo-task-activity"
    ref="form"
    :model="form"
    :label-width="formLabelWidth"
    v-if="task"
  >
    <div class="graphic-box" ref="graphicBox">
      <mo-task-graphic
        :outerWidth="graphicWidth"
        :bitfield="task.bitfield"
        v-if="graphicWidth > 0"
      />
    </div>
    <el-form-item :label="`${$t('task.task-progress-info')}: `">
      <div class="form-static-value" style="overflow: hidden">
        <el-row :gutter="12">
          <el-col :span="18">
            <div class="progress-wrapper">
              <mo-task-progress
                :completed="Number(task.completedLength)"
                :total="Number(task.totalLength)"
                :status="taskStatus"
              />
            </div>
          </el-col>
          <el-col :span="5">
            {{ percent }}
          </el-col>
        </el-row>
      </div>
    </el-form-item>
    <el-form-item>
      <div class="form-static-value">
        <span>{{ bytesToSize(task.completedLength, 2) }}</span>
        <span v-if="task.totalLength > 0"> / {{ bytesToSize(task.totalLength, 2) }}</span>
        <span class="task-time-remaining" v-if="isActive && remaining > 0">
          {{
            timeFormat(remaining, {
              prefix: $t('task.remaining-prefix'),
              i18n: {
                'gt1d': $t('app.gt1d'),
                'hour': $t('app.hour'),
                'minute': $t('app.minute'),
                'second': $t('app.second')
              }
            })
          }}
        </span>
      </div>
    </el-form-item>
    <el-form-item :label="`${$t('task.task-num-seeders')}: `" v-if="isBT">
      <div class="form-static-value">
        {{ task.numSeeders }}
      </div>
    </el-form-item>
    <el-form-item :label="`${$t('task.task-connections')}: `">
      <div class="form-static-value">
        {{ task.connections }}
      </div>
    </el-form-item>
    <el-form-item :label="`${$t('task.task-download-speed')}: `">
      <div class="form-static-value">
        <span>{{ bytesToSize(task.downloadSpeed) }}/s</span>
      </div>
    </el-form-item>
    <el-form-item :label="`${$t('task.task-upload-speed')}: `" v-if="isBT">
      <div class="form-static-value">
        <span>{{ bytesToSize(task.uploadSpeed) }}/s</span>
      </div>
    </el-form-item>
    <el-form-item :label="`${$t('task.task-upload-length')}: `" v-if="isBT">
      <div class="form-static-value">
        <span>{{ bytesToSize(task.uploadLength) }}</span>
      </div>
    </el-form-item>
    <el-form-item :label="`${$t('task.task-ratio')}: `" v-if="isBT">
      <div class="form-static-value">
        {{ ratio }}
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import is from 'electron-is'
  import { useI18n } from 'vue-i18n'
  import { usePreferenceStore } from '@/store/preference'
  import {
    bytesToSize,
    calcFormLabelWidth,
    calcProgress,
    calcRatio,
    checkTaskIsBT,
    checkTaskIsSeeder,
    timeFormat,
    timeRemaining
  } from '@shared/utils'
  import { TASK_STATUS } from '@shared/constants'
  import MoTaskGraphic from '@/components/TaskGraphic/Index.vue'
  import MoTaskProgress from '@/components/Task/TaskProgress.vue'

  defineOptions({ name: 'mo-task-activity' })

  const props = withDefaults(defineProps<{
    gid?: string
    task?: Record<string, any>
    files?: any[]
    peers?: any[]
    visible?: boolean
  }>(), {
    files: () => [],
    peers: () => [],
    visible: false
  })

  const { t } = useI18n()
  const preferenceStore = usePreferenceStore()
  const { locale } = preferenceStore.config

  const form = ref<Record<string, any>>({})
  const formLabelWidth = calcFormLabelWidth(locale)
  const graphicWidth = ref(0)
  const graphicBox = ref<HTMLElement | null>(null)

  const isRenderer = is.renderer()

  const isBT = computed(() => checkTaskIsBT(props.task))

  const isSeeder = computed(() => checkTaskIsSeeder(props.task))

  const taskStatus = computed(() => {
    if (isSeeder.value) {
      return TASK_STATUS.SEEDING
    } else {
      return props.task?.status
    }
  })

  const isActive = computed(() => taskStatus.value === TASK_STATUS.ACTIVE)

  const percent = computed(() => {
    const { totalLength, completedLength } = props.task!
    const p = calcProgress(totalLength, completedLength)
    return `${p}%`
  })

  const remaining = computed(() => {
    const { totalLength, completedLength, downloadSpeed } = props.task!
    return timeRemaining(totalLength, completedLength, downloadSpeed)
  })

  const ratio = computed(() => {
    if (!isBT.value) {
      return 0
    }

    const { totalLength, uploadLength } = props.task!
    return calcRatio(totalLength, uploadLength)
  })

  onMounted(() => {
    setImmediate(() => {
      updateGraphicWidth()
    })
  })

  function updateGraphicWidth () {
    if (!graphicBox.value) {
      return
    }
    graphicWidth.value = calcInnerWidth(graphicBox.value)
  }

  function calcInnerWidth (ele: HTMLElement | null): number {
    if (!ele) {
      return 0
    }

    const style = getComputedStyle(ele, null)
    const width = parseInt(style.width, 10)
    const paddingLeft = parseInt(style.paddingLeft, 10)
    const paddingRight = parseInt(style.paddingRight, 10)
    return width - paddingLeft - paddingRight
  }
</script>

<style lang="scss">
.progress-wrapper {
  padding: 0.6875rem 0 0 0;
}

.task-time-remaining {
  margin-left: 1rem;
}
</style>
