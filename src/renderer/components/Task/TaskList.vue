<template>
  <mo-drag-select
    class="task-list"
    v-if="taskList.length > 0"
    attribute="attr"
    @change="handleDragSelectChange"
  >
    <div
      v-for="item in taskList"
      :key="item.gid"
      :attr="item.gid"
      :class="getItemClass(item)"
    >
      <mo-task-item
        :task="item"
      />
    </div>
  </mo-drag-select>
  <div class="no-task" v-else>
    <div class="no-task-inner">
      {{ $t('task.no-task') }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useTaskStore } from '@/store/task'
  import { cloneDeep } from 'lodash'
  import MoDragSelect from '@/components/DragSelect/Index.vue'
  import MoTaskItem from './TaskItem.vue'

  defineOptions({ name: 'mo-task-list' })

  const taskStore = useTaskStore()

  const selectedList = ref<string[]>(cloneDeep(taskStore.selectedList) || [])

  const taskList = computed(() => taskStore.taskList)
  const selectedGidList = computed(() => taskStore.selectedGidList)

  function handleDragSelectChange (newSelectedList: string[]) {
    selectedList.value = newSelectedList
    taskStore.selectTasks(cloneDeep(newSelectedList))
  }

  function getItemClass (item: Record<string, any>) {
    const isSelected = selectedList.value.includes(item.gid)
    return {
      selected: isSelected
    }
  }

  watch(selectedGidList, (newVal) => {
    selectedList.value = newVal
  })
</script>

<style lang="scss">
.task-list {
  padding: 16px 16px 64px;
  min-height: 100%;
  box-sizing: border-box;
}
.no-task {
  display: flex;
  height: 100%;
  text-align: center;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #555;
  user-select: none;
}
.no-task-inner {
  width: 100%;
  padding-top: 360px;
  background: transparent url('@/assets/no-task.svg') top center no-repeat;
}
</style>
