<template>
  <div class="mo-task-peers">
    <div class="mo-table-wrapper">
      <el-table
        stripe
        ref="peerTable"
        class="mo-peer-table"
        :data="peers"
      >
        <el-table-column
          :label="`${$t('task.task-peer-host')}: `"
          min-width="140">
          <template #default="scope">
            {{ `${scope.row.ip}:${scope.row.port}` }}
          </template>
        </el-table-column>
        <el-table-column
          :label="`${$t('task.task-peer-client')}: `"
          min-width="125">
          <template #default="scope">
            {{ peerIdParser(scope.row.peerId) }}
          </template>
        </el-table-column>
        <el-table-column
          :label="`%`"
          align="right"
          width="55">
          <template #default="scope">
            {{ bitfieldToPercent(scope.row.bitfield) }}%
          </template>
        </el-table-column>
        <el-table-column
          :label="`↑`"
          align="right"
          width="90">
          <template #default="scope">
            {{ bytesToSize(scope.row.uploadSpeed) }}/s
          </template>
        </el-table-column>
        <el-table-column
          :label="`↓`"
          align="right"
          width="90">
          <template #default="scope">
            {{ bytesToSize(scope.row.downloadSpeed) }}/s
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    bitfieldToPercent,
    bytesToSize,
    peerIdParser
  } from '@shared/utils'

  defineOptions({ name: 'mo-task-peers' })

  withDefaults(defineProps<{
    peers?: any[]
  }>(), {
    peers: () => []
  })
</script>

<style lang="scss">
.el-table.mo-peer-table .cell {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
</style>
