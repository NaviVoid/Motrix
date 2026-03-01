<template>
  <svg version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    class="svg-task-graphic"
    :width="width"
    :height="height"
    :viewBox="box">
    <g v-for="(row, index) in atoms" :key="`g-${index}`" >
      <Atom
        v-for="atom in row"
        :key="`atom-${atom.id}`"
        :status="atom.status"
        :width="atomWidth"
        :height="atomHeight"
        :radius="atomRadius"
        :x="atom.x"
        :y="atom.y"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import Atom from './Atom.vue'

  defineOptions({ name: 'mo-task-graphic' })

  interface AtomData {
    id: string
    status: number
    x: number
    y: number
  }

  const props = withDefaults(defineProps<{
    bitfield?: string
    outerWidth?: number
    atomWidth?: number
    atomHeight?: number
    atomGutter?: number
    atomRadius?: number
  }>(), {
    bitfield: '',
    outerWidth: 240,
    atomWidth: 10,
    atomHeight: 10,
    atomGutter: 3,
    atomRadius: 2
  })

  const len = computed(() => props.bitfield.length)

  const atomWG = computed(() => props.atomWidth + props.atomGutter)

  const atomHG = computed(() => props.atomHeight + props.atomGutter)

  const columnCount = computed(() => {
    const result = parseInt(String((props.outerWidth - props.atomWidth) / atomWG.value), 10) + 1
    return result
  })

  const rowCount = computed(() => {
    const result = parseInt(String(len.value / columnCount.value), 10) + 1
    return result
  })

  const offset = computed(() => {
    const totalWidth = atomWG.value * (columnCount.value - 1) + props.atomWidth
    const result = (props.outerWidth - totalWidth) / 2
    return parseFloat(result.toFixed(2))
  })

  const width = computed(() => {
    const result = atomWG.value * (columnCount.value - 1) + props.atomWidth
    return parseInt(String(result), 10)
  })

  const height = computed(() => {
    const result = atomHG.value * (rowCount.value - 1) + props.atomHeight + offset.value * 2
    return parseInt(String(result), 10)
  })

  const box = computed(() => `0 0 ${width.value} ${height.value}`)

  function buildAtom (index: number): AtomData {
    const hIndex = index + 1
    let chIndex = index % columnCount.value
    let rhIndex = parseInt(String(index / columnCount.value), 10)
    chIndex = chIndex < 0 ? 0 : chIndex
    rhIndex = rhIndex < 0 ? 0 : rhIndex
    return {
      id: `${hIndex}`,
      status: Math.floor(parseInt(props.bitfield[index], 16) / 4),
      x: chIndex * atomWG.value,
      y: offset.value + rhIndex * atomHG.value
    }
  }

  const atoms = computed(() => {
    const result: AtomData[][] = []
    let row: AtomData[] = []
    for (let i = 0; i < len.value; i++) {
      row.push(buildAtom(i))

      if ((i + 1) % columnCount.value === 0) {
        result.push(row)
        row = []
      }
    }
    result.push(row)

    return result
  })
</script>
