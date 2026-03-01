<template>
  <div class="mo-history-directory">
    <el-popover
      popper-class="mo-directory-popper"
      trigger="hover"
      :placement="placement"
      :width="width"
    >
      <el-empty class="mo-directory-empty" :image-size="48" v-if="empty" />
      <ul class="mo-directory-list" v-if="favoriteDirectories.length > 0">
        <li
          v-for="directory in favoriteDirectories"
          :key="directory"
          @click.stop="() => handleSelectItem(directory)"
        >
          <span class="mo-directory-path" :title="directory">{{directory}}</span>
          <span class="mo-directory-actions">
            <i
              class="el-icon-star-off icon-history-favorited"
              @click.stop="() => handleCancelFavoriteItem(directory)"
            />
            <i
              class="el-icon-delete icon-history-remove"
              @click.stop="() => handleRemoveItem(directory)"
            />
          </span>
        </li>
      </ul>
      <div class="mo-directory-divider" v-if="showDivider" />
      <ul class="mo-directory-list" v-if="historyDirectories.length > 0">
        <li
          v-for="directory in historyDirectories"
          :key="directory"
          @click.stop="() => handleSelectItem(directory)"
        >
          <span class="mo-directory-path" :title="directory">{{directory}}</span>
          <span class="mo-directory-actions">
            <i
              v-if="showFavoriteAction"
              class="el-icon-star-off icon-history-favorite"
              @click.stop="() => handleFavoriteItem(directory)"
            />
            <i
              class="el-icon-delete icon-history-remove"
              @click.stop="() => handleRemoveItem(directory)"
            />
          </span>
        </li>
      </ul>
      <template #reference>
        <el-button
          :disabled="popoverDisabled"
        >
          <i class="el-icon-time" />
        </el-button>
      </template>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { usePreferenceStore } from '@/store/preference'
  import { MAX_NUM_OF_DIRECTORIES } from '@shared/constants'
  import { cloneArray } from '@shared/utils'

  defineOptions({ name: 'mo-history-directory' })

  withDefaults(defineProps<{
    width?: number
    placement?: string
  }>(), {
    width: 360,
    placement: 'bottom-start'
  })

  const emit = defineEmits<{
    (e: 'selected', directory: string): void
  }>()

  const preferenceStore = usePreferenceStore()

  const visible = ref(false)

  const historyDirectories = computed(() => {
    return cloneArray(preferenceStore.config.historyDirectories, true)
  })

  const favoriteDirectories = computed(() => {
    return cloneArray(preferenceStore.config.favoriteDirectories, true)
  })

  const empty = computed(() => {
    return favoriteDirectories.value.length + historyDirectories.value.length === 0
  })

  const popoverDisabled = computed(() => {
    return favoriteDirectories.value.length === 0 &&
      historyDirectories.value.length === 0
  })

  const showDivider = computed(() => {
    return favoriteDirectories.value.length > 0 &&
      historyDirectories.value.length > 0
  })

  const showFavoriteAction = computed(() => {
    return favoriteDirectories.value.length < MAX_NUM_OF_DIRECTORIES
  })

  function handleIconClick () {
    if (popoverDisabled.value) {
      return
    }

    visible.value = !visible.value
  }

  function handleSelectItem (directory: string) {
    emit('selected', directory.trim())
    visible.value = false
  }

  function handleFavoriteItem (directory: string) {
    console.log('handleFavoriteItem==>', directory)
    preferenceStore.favoriteDirectory(directory)
  }

  function handleCancelFavoriteItem (directory: string) {
    console.log('handleCancelFavoriteItem==>', directory)
    preferenceStore.cancelFavoriteDirectory(directory)
  }

  function handleRemoveItem (directory: string) {
    console.log('handleRemoveItem==>', directory)
    preferenceStore.removeDirectory(directory)
  }
</script>

<style lang="scss">
.el-popover.mo-directory-popper {
  padding: $--popover-padding 0;
}

.el-empty.mo-directory-empty {
  padding: 20px 0;
}

.mo-directory-divider {
  padding: 0 $--popover-padding;
  margin: 6px 0;
  &::after {
    content: ' ';
    display: block;
    height: 1px;
    width: 100%;
    background: $--border-color-base;
  }
}

.mo-directory-list {
  padding: 0;
  margin: 0;
  list-style: none;
  &> li {
    display: flex;
    align-items: center;
    list-style: none;
    line-height: $--font-line-height-primary;
    margin: 0;
    font-size: $--font-size-small;
    color: $--color-text-regular;
    cursor: pointer;
    outline: none;
    padding: 6px 6px 6px $--popover-padding;
    &:focus, &:hover {
      background-color: $--background-color-base;
      color: $--color-primary-light-2;
    }
  }
  .mo-directory-path {
    display: inline-block;
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .mo-directory-actions {
    min-width: 40px;
    text-align: right;
    &> i {
      padding: 3px;
      margin-right: 3px;
      display: inline-block;
    }
  }
  .icon-history-favorite {
    &:focus, &:hover {
      color: $--color-warning;
    }
  }
  .icon-history-favorited {
    color: $--color-warning;
  }
  .icon-history-remove {
    &:focus, &:hover {
      color: $--color-danger;
    }
  }
}

.theme-dark {
  .mo-directory-divider {
    &::after {
      background: $--dk-border-color-base;
    }
  }
  .mo-directory-list {
    &> li {
      color: $--dk-font-color-base;
      &:focus, &:hover {
        background-color: $--color-primary;
        color: $--color-white;
      }
    }
  }
}
</style>
