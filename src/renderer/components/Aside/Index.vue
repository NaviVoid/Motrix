<template>
  <el-aside width="78px" :class="['aside', 'hidden-sm-and-down', { 'draggable': asideDraggable }]" :style="vibrancy">
    <div class="aside-inner">
      <mo-logo-mini />
      <ul class="menu top-menu">
        <li @click="nav('/task')" class="non-draggable">
          <mo-icon name="menu-task" width="20" height="20" />
        </li>
        <li @click="showAddTask()" class="non-draggable">
          <mo-icon name="menu-add" width="20" height="20" />
        </li>
      </ul>
      <ul class="menu bottom-menu">
        <li @click="nav('/preference')" class="non-draggable">
          <mo-icon name="menu-preference" width="20" height="20" />
        </li>
        <li @click="showAboutPanel" class="non-draggable">
          <mo-icon name="menu-about" width="20" height="20" />
        </li>
      </ul>
    </div>
  </el-aside>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import is from 'electron-is'
  import { storeToRefs } from 'pinia'
  import { useAppStore } from '@/store/app'
  import { ADD_TASK_TYPE } from '@shared/constants'
  import MoLogoMini from '@/components/Logo/LogoMini.vue'
  import '@/components/Icons/menu-task'
  import '@/components/Icons/menu-add'
  import '@/components/Icons/menu-preference'
  import '@/components/Icons/menu-about'

  defineOptions({ name: 'mo-aside' })

  const router = useRouter()
  const appStore = useAppStore()
  const { currentPage } = storeToRefs(appStore)

  const asideDraggable = computed(() => is.macOS())

  const vibrancy = computed(() => {
    return is.macOS()
      ? { backgroundColor: 'transparent' }
      : {}
  })

  function showAddTask (taskType = ADD_TASK_TYPE.URI) {
    appStore.showAddTaskDialog(taskType)
  }

  function showAboutPanel () {
    appStore.showAboutPanel()
  }

  function nav (page: string) {
    router.push({ path: page }).catch((err: Error) => {
      console.log(err)
    })
  }
</script>

<style lang="scss">
.aside-inner {
  display: flex;
  height: 100%;
  flex-flow: column;
}
.logo-mini {
  margin-top: 40px;
}
.menu {
  list-style: none;
  padding: 0;
  margin: 0 auto;
  user-select: none;
  cursor: default;
  > li {
    width: 32px;
    height: 32px;
    margin-top: 24px;
    cursor: pointer;
    border-radius: 16px;
    transition: background-color 0.25s;
    &:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }
  }
  svg {
    padding: 6px;
    color: #fff;
  }
}
.top-menu {
  flex: 1;
}
.bottom-menu {
  margin-bottom: 24px;
}
</style>
