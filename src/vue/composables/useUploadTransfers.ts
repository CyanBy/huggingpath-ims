import { computed, onMounted, onUnmounted, shallowRef } from 'vue'
import {
  cancelUploadTransfer,
  clearCompletedUploadTransfers,
  readUploadTransfers,
  removeUploadTransfer,
  retryUploadTransfer,
  subscribeUploadTransfers,
} from '@/lib/uploadTransferQueue'

export function useUploadTransfers() {
  const transfers = shallowRef(readUploadTransfers())
  const refresh = () => { transfers.value = readUploadTransfers() }
  const pendingCount = computed(() => transfers.value.filter((item) => ['等待上传', '上传中', '文件处理中'].includes(item.status)).length)
  const completedCount = computed(() => transfers.value.filter((item) => item.status === '已完成').length)
  const failedCount = computed(() => transfers.value.filter((item) => item.status === '上传失败').length)
  const canceledCount = computed(() => transfers.value.filter((item) => item.status === '已取消').length)
  const allComplete = computed(() => transfers.value.length > 0 && pendingCount.value === 0 && failedCount.value === 0 && canceledCount.value === 0 && completedCount.value > 0)
  let unsubscribe: (() => void) | undefined
  onMounted(() => { unsubscribe = subscribeUploadTransfers(refresh); refresh() })
  onUnmounted(() => unsubscribe?.())
  function clearCompleted() { clearCompletedUploadTransfers(); refresh() }
  function cancelTransfer(id: string) { cancelUploadTransfer(id); refresh() }
  function retryTransfer(id: string) { retryUploadTransfer(id); refresh() }
  function removeTransfer(id: string) { removeUploadTransfer(id); refresh() }
  return { transfers, pendingCount, completedCount, failedCount, canceledCount, allComplete, refresh, clearCompleted, cancelTransfer, retryTransfer, removeTransfer }
}
