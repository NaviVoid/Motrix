<template>
  <el-container id="container">
    <mo-aside />
    <router-view />
    <mo-speedometer />
    <mo-add-task :model-value="addTaskVisible" :type="addTaskType" />
    <mo-about-panel :model-value="aboutPanelVisible" />
    <mo-task-detail
      :model-value="taskDetailVisible"
      :gid="currentTaskGid"
      :task="currentTaskItem"
      :files="currentTaskFiles"
      :peers="currentTaskPeers"
    />
    <mo-dragger />
  </el-container>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useAppStore } from '@/store/app'
  import { useTaskStore } from '@/store/task'
  import MoAboutPanel from '@/components/About/AboutPanel.vue'
  import MoAside from '@/components/Aside/Index.vue'
  import MoSpeedometer from '@/components/Speedometer/Speedometer.vue'
  import MoAddTask from '@/components/Task/AddTask.vue'
  import MoTaskDetail from '@/components/TaskDetail/Index.vue'
  import MoDragger from '@/components/Dragger/Index.vue'

  defineOptions({ name: 'mo-main' })

  const appStore = useAppStore()
  const taskStore = useTaskStore()

  const aboutPanelVisible = computed(() => appStore.aboutPanelVisible)
  const addTaskVisible = computed(() => appStore.addTaskVisible)
  const addTaskType = computed(() => appStore.addTaskType)

  const taskDetailVisible = computed(() => taskStore.taskDetailVisible)
  const currentTaskGid = computed(() => taskStore.currentTaskGid)
  const currentTaskItem = computed(() => taskStore.currentTaskItem)
  const currentTaskFiles = computed(() => taskStore.currentTaskFiles)
  const currentTaskPeers = computed(() => taskStore.currentTaskPeers)
</script>

<style lang="scss">
  .mo-speedometer {
    position: fixed;
    right: 16px;
    bottom: 24px;
    z-index: 20;
  }
</style>
