<template>
  <el-form
    ref="form"
    :model="form"
    :label-width="formLabelWidth"
    v-if="task"
  >
    <div
      class="tracker-list"
      v-if="announceList"
    >
      <el-input
        readonly
        autosize
        type="textarea"
        auto-complete="off"
        v-model="announceList">
      </el-input>
    </div>
  </el-form>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import is from 'electron-is'
  import { usePreferenceStore } from '@/store/preference'
  import {
    calcFormLabelWidth,
    checkTaskIsBT,
    checkTaskIsSeeder
  } from '@shared/utils'
  import { convertTrackerDataToLine } from '@shared/utils/tracker'
  import { EMPTY_STRING } from '@shared/constants'

  defineOptions({ name: 'mo-task-trackers' })

  const props = defineProps<{
    task?: Record<string, any>
  }>()

  const preferenceStore = usePreferenceStore()
  const { locale } = preferenceStore.config

  const form = ref<Record<string, any>>({})
  const formLabelWidth = calcFormLabelWidth(locale)

  const isRenderer = is.renderer()

  const isBT = computed(() => checkTaskIsBT(props.task))

  const isSeeder = computed(() => checkTaskIsSeeder(props.task))

  const announceList = computed(() => {
    if (!isBT.value) {
      return EMPTY_STRING
    }

    const { bittorrent } = props.task!
    const data = bittorrent.announceList.map((i: any[]) => i[0])
    return convertTrackerDataToLine(data)
  })
</script>

<style lang="scss">
.tracker-list {
  padding: 0;
  margin: 0;
  font-size: $--font-size-small;
  textarea {
    line-height: 2;
  }
}
</style>
