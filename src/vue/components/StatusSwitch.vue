<script setup lang="ts">
defineProps<{ active: boolean; disabled?: boolean }>()
const emit = defineEmits<{ change: [value: boolean] }>()
</script>

<template>
  <button type="button" :disabled="disabled" :title="active ? '点击停用' : '点击启用'" :aria-label="active ? '停用' : '启用'" :aria-pressed="active" :class="['status-switch', active && 'active']" @click="emit('change', !active)"><span /></button>
</template>

<style scoped>
.status-switch{position:relative;width:42px;height:24px;border-radius:999px;background:#3a3c45;transition:.18s}.status-switch span{position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#aab4c4;transition:.18s}.status-switch.active{background:#8f35b7}.status-switch.active span{transform:translateX(18px);background:white}.status-switch:disabled{cursor:not-allowed;opacity:.35}
</style>
