import { computed, onMounted, onUnmounted, shallowRef } from 'vue'
import {
  cancelUploadTransfer,
  clearCompletedUploadTransfers,
  readUploadTransfers,
  removeUploadTransfer,
  retryUploadTransfer,
  subscribeUploadTransfers,
} from '@/lib/uploadTransferQueue'

/** 快速预览"清除记录"的时间点：早于它的终态记录不再计入预览与导航徽标（不动队列数据） */
const CLEARED_KEY = 'huggingpath.transferPreviewClearedAt.v1'
const clearedAt = shallowRef(Number(localStorage.getItem(CLEARED_KEY) || 0))

function clearPreviewRecords() {
  clearedAt.value = Date.now()
  localStorage.setItem(CLEARED_KEY, String(clearedAt.value))
}

function isVisible(item: { status: string; createdAt: string; completedAt?: string }) {
  const isActive = ['等待上传', '上传中', '文件处理中'].includes(item.status)
  return isActive || new Date(item.completedAt || item.createdAt).getTime() > clearedAt.value
}

export function useUploadTransfers() {
  const transfers = shallowRef(readUploadTransfers())
  const refresh = () => { transfers.value = readUploadTransfers() }
  const pendingCount = computed(() => transfers.value.filter((item) => ['等待上传', '上传中', '文件处理中'].includes(item.status)).length)
  const completedCount = computed(() => transfers.value.filter((item) => item.status === '已完成').length)
  const failedCount = computed(() => transfers.value.filter((item) => item.status === '上传失败').length)
  const canceledCount = computed(() => transfers.value.filter((item) => item.status === '已取消').length)
  /** 导航徽标用：只看未被清除的记录 */
  const visibleCompletedCount = computed(() => transfers.value.filter((item) => item.status === '已完成' && isVisible(item)).length)
  const visibleExceptionCount = computed(() => transfers.value.filter((item) => ['上传失败', '已取消'].includes(item.status) && isVisible(item)).length)
  const allComplete = computed(() => pendingCount.value === 0 && visibleExceptionCount.value === 0 && visibleCompletedCount.value > 0)
  let unsubscribe: (() => void) | undefined
  onMounted(() => { unsubscribe = subscribeUploadTransfers(refresh); refresh() })
  onUnmounted(() => unsubscribe?.())
  function clearCompleted() { clearCompletedUploadTransfers(); refresh() }
  function cancelTransfer(id: string) { cancelUploadTransfer(id); refresh() }
  function retryTransfer(id: string) { retryUploadTransfer(id); refresh() }
  function removeTransfer(id: string) { removeUploadTransfer(id); refresh() }
  return { transfers, pendingCount, completedCount, failedCount, canceledCount, allComplete, clearedAt, clearPreviewRecords, visibleExceptionCount, isVisible, refresh, clearCompleted, cancelTransfer, retryTransfer, removeTransfer }
}
