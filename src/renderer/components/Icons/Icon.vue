<template>
  <svg
    version="1.1"
    :class="klass"
    :role="label ? 'img' : 'presentation'"
    :aria-label="label"
    :x="x"
    :y="y"
    :width="width"
    :height="height"
    :viewBox="box"
    :style="style"
  >
    <slot>
      <template v-if="icon && icon.paths">
        <path v-for="(path, i) in icon.paths" :key="`path-${i}`" v-bind="path" />
      </template>
      <template v-if="icon && icon.polygons">
        <polygon v-for="(polygon, i) in icon.polygons" :key="`polygon-${i}`" v-bind="polygon" />
      </template>
      <template v-if="icon && icon.raw"><g v-bind="icon.g" v-html="raw" /></template>
    </slot>
  </svg>
</template>

<script lang="ts">
  export interface IconData {
    width: number
    height: number
    d?: string
    paths?: Array<Record<string, string>>
    points?: string
    polygons?: Array<Record<string, string>>
    raw?: string
    g?: Record<string, string>
  }

  const icons: Record<string, IconData> = {}

  let cursor = 0xD4937
  function getId (): string {
    return `mo-${(cursor++).toString(16)}`
  }

  export function register (data: Record<string, IconData>): void {
    for (const name in data) {
      const icon = data[name]

      if (!icon.paths) {
        icon.paths = []
      }
      if (icon.d) {
        icon.paths.push({ d: icon.d })
      }

      if (!icon.polygons) {
        icon.polygons = []
      }
      if (icon.points) {
        icon.polygons.push({ points: icon.points })
      }

      icons[name] = icon
    }
  }

  export { icons }
</script>

<script setup lang="ts">
  import { ref, computed, onMounted, useSlots } from 'vue'

  defineOptions({ name: 'mo-icon' })

  const props = defineProps<{
    name?: string
    scale?: number | string
    spin?: boolean
    inverse?: boolean
    pulse?: boolean
    flip?: 'horizontal' | 'vertical'
    label?: string
  }>()

  const x = ref<number | undefined>(undefined)
  const y = ref<number | undefined>(undefined)
  const childrenWidth = ref(0)
  const childrenHeight = ref(0)
  const outerScale = ref(1)

  const slots = useSlots()

  const normalizedScale = computed(() => {
    let scale: number = typeof props.scale === 'undefined' ? 1 : Number(props.scale)
    if (isNaN(scale) || scale <= 0) {
      console.warn('Invalid prop: prop "scale" should be a number over 0.')
      return outerScale.value
    }
    return scale * outerScale.value
  })

  const klass = computed(() => ({
    'mo-icon': true,
    'mo-spin': props.spin,
    'mo-flip-horizontal': props.flip === 'horizontal',
    'mo-flip-vertical': props.flip === 'vertical',
    'mo-inverse': props.inverse,
    'mo-pulse': props.pulse
  }))

  const icon = computed(() => {
    if (props.name) {
      return icons[props.name] ?? null
    }
    return null
  })

  const ratio = computed(() => {
    if (!icon.value) {
      return 1
    }
    const { width: w, height: h } = icon.value
    return Math.max(w, h) / 16
  })

  const width = computed(() => {
    return childrenWidth.value || (icon.value && icon.value.width / ratio.value * normalizedScale.value) || 0
  })

  const height = computed(() => {
    return childrenHeight.value || (icon.value && icon.value.height / ratio.value * normalizedScale.value) || 0
  })

  const box = computed(() => {
    if (icon.value) {
      return `0 0 ${icon.value.width} ${icon.value.height}`
    }
    return `0 0 ${width.value} ${height.value}`
  })

  const style = computed(() => {
    if (normalizedScale.value === 1) {
      return false
    }
    return {
      fontSize: normalizedScale.value + 'em'
    }
  })

  const raw = computed(() => {
    // generate unique id for each icon's SVG element with ID
    if (!icon.value || !icon.value.raw) {
      return null
    }
    let rawStr = icon.value.raw
    const ids: Record<string, string> = {}
    rawStr = rawStr.replace(/\s(?:xml:)?id=(["']?)([^"')\s]+)\1/g, (_match: string, _quote: string, id: string) => {
      const uniqueId = getId()
      ids[id] = uniqueId
      return ` id="${uniqueId}"`
    })
    rawStr = rawStr.replace(/#(?:([^'")\s]+)|xpointer\(id\((['"]?)([^')]+)\2\)\))/g, (match: string, rawId: string, _: string, pointerId: string) => {
      const id = rawId || pointerId
      if (!id || !ids[id]) {
        return match
      }

      return `#${ids[id]}`
    })

    return rawStr
  })

  onMounted(() => {
    if (!props.name && !slots.default) {
      console.warn('Invalid prop: prop "name" is required.')
    }
  })

  defineExpose({
    outerScale,
    x,
    y,
    width,
    height
  })
</script>

<style>
.mo-icon {
  display: inline-block;
  fill: currentColor;
}

.mo-flip-horizontal {
  transform: scale(-1, 1);
}

.mo-flip-vertical {
  transform: scale(1, -1);
}

.mo-spin {
  animation: mo-spin 0.5s 0s infinite linear;
}

.mo-inverse {
  color: #fff;
}

.mo-pulse {
  animation: mo-spin 1s infinite steps(8);
}

@keyframes mo-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
