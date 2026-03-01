<template>
  <nav class="subnav-inner">
    <h3>{{ title }}</h3>
    <ul>
      <li
        @click="() => nav('basic')"
        :class="[ current === 'basic' ? 'active' : '' ]"
        >
        <i class="subnav-icon">
          <mo-icon name='preference-basic' width="20" height="20" />
        </i>
        <span>{{ $t('preferences.basic') }}</span>
      </li>
      <li
        @click="() => nav('advanced')"
        :class="[ current === 'advanced' ? 'active' : '' ]"
        >
        <i class="subnav-icon">
          <mo-icon name='preference-advanced' width="20" height="20" />
        </i>
        <span>{{ $t('preferences.advanced') }}</span>
      </li>
      <li
        @click="() => nav('lab')"
        :class="[ current === 'lab' ? 'active' : '' ]"
        >
        <i class="subnav-icon">
          <mo-icon name='preference-lab' width="20" height="20" />
        </i>
        <span>{{ $t('preferences.lab') }}</span>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import '@/components/Icons/preference-basic'
  import '@/components/Icons/preference-advanced'
  import '@/components/Icons/preference-lab'

  defineOptions({ name: 'mo-preference-subnav' })

  withDefaults(defineProps<{
    current?: string
  }>(), {
    current: 'basic'
  })

  const router = useRouter()
  const { t } = useI18n()

  const title = computed(() => t('subnav.preferences'))

  function nav (category = 'basic') {
    router.push({
      path: `/preference/${category}`
    }).catch((err: Error) => {
      console.log(err)
    })
  }
</script>
