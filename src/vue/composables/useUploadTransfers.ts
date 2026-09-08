import { computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { clearCompletedUploadTransfers, readUploadTransfers, subscribeUploadTransfers } from '@/lib/uploadTransferQueue'

export function useUploadTransfers() {
  const transfers = shallowRef(readUploadTransfers())
  const refresh = () => { transfers.value = readUploadTransfers() }
  const pendingCount = computed(() => transfers.value.filter((item) => ['等待上传', '上传中'].includes(item.status)).length)
  const completedCount = computed(() => transfers.value.filter((item) => item.status === '已完成').length)
  const allComplete = computed(() => transfers.value.length > 0 && pendingCount.value === 0 && completedCount.value > 0)
  let unsubscribe: (() => void) | undefined
  onMounted(() => { unsubscribe = subscribeUploadTransfers(refresh); refresh() })
  onUnmounted(() => unsubscribe?.())
  function clearCompleted() { clearCompletedUploadTransfers(); refresh() }
  return { transfers, pendingCount, completedCount, allComplete, refresh, clearCompleted }
}
