<template>
  <div
    ref="container"
    style="position: relative; user-select: none; overflow-x: hidden; touch-action: none;"
  >
    <slot v-bind="{ selected: intersected }" />
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted } from 'vue'

  defineOptions({ name: 'mo-drag-select' })

  interface Point {
    x: number
    y: number
  }

  const getCoords = (e: MouseEvent | Touch, containerRect: DOMRect): Point => ({
    x: e.clientX - containerRect.left,
    y: e.clientY - containerRect.top
  })

  const getDimensions = (p1: Point, p2: Point) => ({
    width: Math.abs(p1.x - p2.x),
    height: Math.abs(p1.y - p2.y)
  })

  const collisionCheck = (node1: DOMRect, node2: DOMRect) =>
    node1.left < node2.left + node2.width &&
    node1.left + node1.width > node2.left &&
    node1.top < node2.top + node2.height &&
    node1.top + node1.height > node2.top

  const props = withDefaults(defineProps<{
    attribute: string
    color?: string
    opacity?: number
  }>(), {
    color: '#bad7fb',
    opacity: 0.7
  })

  const emit = defineEmits<{
    change: [intersected: string[]]
  }>()

  const container = ref<HTMLElement | null>(null)
  const intersected = ref<string[]>([])
  const children = ref<NodeListOf<ChildNode> | never[]>([])

  watch(intersected, (i) => {
    emit('change', i)
  })

  let cleanupFn: (() => void) | null = null

  function createBox (): HTMLDivElement {
    const box = document.createElement('div')
    box.setAttribute('data-drag-box-component', '')
    box.style.position = 'absolute'
    box.style.backgroundColor = props.color
    box.style.opacity = String(props.opacity)
    box.style.zIndex = '1000'

    return box
  }

  function intersection (box: HTMLDivElement) {
    const childNodes = children.value
    const rect = box.getBoundingClientRect()
    const result: string[] = []

    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i] as HTMLElement
      if (child.getBoundingClientRect && collisionCheck(rect, child.getBoundingClientRect())) {
        const attr = child.getAttribute(props.attribute)
        if (child.hasAttribute(props.attribute)) {
          result.push(attr!)
        }
      }
    }

    if (
      JSON.stringify([...result]) !==
      JSON.stringify([...intersected.value])
    ) { intersected.value = result }
  }

  onMounted(() => {
    const el = container.value!

    let containerRect = el.getBoundingClientRect()
    const box = createBox()
    let start: Point = { x: 0, y: 0 }
    let end: Point = { x: 0, y: 0 }

    function touchStart (e: TouchEvent) {
      e.preventDefault()
      startDrag(e.touches[0])
    }

    function touchMove (e: TouchEvent) {
      e.preventDefault()
      drag(e.touches[0])
    }

    function startDrag (e: MouseEvent | Touch) {
      const target = (e as any).target as HTMLElement
      if (target && target.closest('.task-item-actions, button, a, input, select, textarea')) {
        return
      }

      containerRect = el.getBoundingClientRect()
      children.value = el.childNodes
      start = getCoords(e, containerRect)
      end = start
      document.addEventListener('mousemove', drag)
      document.addEventListener('touchmove', touchMove as EventListener)

      box.style.top = start.y + 'px'
      box.style.left = start.x + 'px'

      el.prepend(box)
      intersection(box)
    }

    function drag (e: MouseEvent | Touch) {
      end = getCoords(e as MouseEvent | Touch, containerRect)
      const dimensions = getDimensions(start, end)

      if (end.x < start.x) {
        box.style.left = end.x + 'px'
      }
      if (end.y < start.y) {
        box.style.top = end.y + 'px'
      }
      box.style.width = dimensions.width + 'px'
      box.style.height = dimensions.height + 'px'

      intersection(box)
    }

    function endDrag () {
      start = { x: 0, y: 0 }
      end = { x: 0, y: 0 }

      box.style.width = '0'
      box.style.height = '0'

      document.removeEventListener('mousemove', drag)
      document.removeEventListener('touchmove', touchMove as EventListener)
      box.remove()
    }

    el.addEventListener('mousedown', startDrag as EventListener)
    el.addEventListener('touchstart', touchStart as EventListener)

    document.addEventListener('mouseup', endDrag)
    document.addEventListener('touchend', endDrag)

    cleanupFn = () => {
      el.removeEventListener('mousedown', startDrag as EventListener)
      el.removeEventListener('touchstart', touchStart as EventListener)
      document.removeEventListener('mouseup', endDrag)
      document.removeEventListener('touchend', endDrag)
    }
  })

  onUnmounted(() => {
    cleanupFn?.()
  })
</script>
