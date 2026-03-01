<template>
  <rect
    :class="klass"
    :status="status"
    :width="width"
    :height="height"
    :rx="radius"
    :ry="radius"
    :x="x"
    :y="y"
    >
  </rect>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  defineOptions({ name: 'mo-task-graphic-atom' })

  const props = withDefaults(defineProps<{
    status?: number
    width?: number
    height?: number
    radius?: number
    x?: number
    y?: number
  }>(), {
    width: 10,
    height: 10,
    radius: 2
  })

  const klass = computed(() => {
    return `graphic-atom graphic-atom-s${props.status}`
  })
</script>

<style lang="scss">
.graphic-atom {
  shape-rendering: geometricPrecision;
  outline-offset: -1px;
}
.graphic-atom-s0 {
  fill: $--graphic-atom-color-0;
  outline: 1px solid $--graphic-atom-outline-color;
}
.graphic-atom-s1 {
  fill: $--graphic-atom-color-1;
  outline: 1px solid $--graphic-atom-outline-color;
}
.graphic-atom-s2 {
  fill: $--graphic-atom-color-2;
  outline: 1px solid $--graphic-atom-outline-color;
}
.graphic-atom-s3 {
  fill: $--graphic-atom-color-3;
  outline: 1px solid $--graphic-atom-outline-color;
}
.graphic-atom-s4 {
  fill: $--graphic-atom-color-4;
  outline: 1px solid $--graphic-atom-outline-color;
}
</style>
