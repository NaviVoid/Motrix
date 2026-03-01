<template>
  <div>
    <ul class="theme-switcher">
      <li
        v-for="item in themeOptions"
        :class="['theme-item', item.className, { active: currentValue === item.value }]"
        :key="item.value"
        @click.prevent="() => handleChange(item.value)"
      >
        <div class="theme-thumb"></div>
        <span>{{ item.text }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { APP_THEME } from '@shared/constants'

  defineOptions({ name: 'mo-theme-switcher' })

  const props = withDefaults(defineProps<{
    value?: string
  }>(), {
    value: APP_THEME.AUTO
  })

  const emit = defineEmits<{
    change: [value: string]
  }>()

  const { t } = useI18n()

  const currentValue = ref(props.value)

  const themeOptions = computed(() => [
    {
      className: 'theme-item-auto',
      value: APP_THEME.AUTO,
      text: t('preferences.theme-auto')
    },
    {
      className: 'theme-item-light',
      value: APP_THEME.LIGHT,
      text: t('preferences.theme-light')
    },
    {
      className: 'theme-item-dark',
      value: APP_THEME.DARK,
      text: t('preferences.theme-dark')
    }
  ])

  watch(currentValue, (val) => {
    emit('change', val)
  })

  function handleChange (theme: string) {
    currentValue.value = theme
  }
</script>

<style lang="scss">
.theme-switcher {
  padding: 0;
  margin: 0;
  font-size: 0;
  line-height: 0;
  .theme-item {
    text-align: center;
    display: inline-block;
    margin: 0 16px 0 0;
    cursor: pointer;
    span {
      font-size: 13px;
      line-height: 20px;
    }
    &.active {
      .theme-thumb {
        border-color: $--color-primary;
        box-shadow: 0 0 1px $--color-primary;
      }
      span {
        color: $--color-primary;
      }
    }
    &.theme-item-auto .theme-thumb {
      background: url('@/assets/theme-auto@2x.png') center center no-repeat;
      background-size: 68px 44px;
    }
    &.theme-item-light .theme-thumb {
      background: url('@/assets/theme-light@2x.png') center center no-repeat;
      background-size: 68px 44px;
    }
    &.theme-item-dark .theme-thumb {
      background: url('@/assets/theme-dark@2x.png') center center no-repeat;
      background-size: 68px 44px;
    }
  }
  .theme-thumb {
    box-sizing: border-box;
    border: 1px solid #aaa;
    border-radius: 5px;
    width: 68px;
    height: 44px;
    margin-bottom: 8px;
  }
}
</style>
