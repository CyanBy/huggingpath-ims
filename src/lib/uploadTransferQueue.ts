import { upsertWorkspaceWsi, type WorkspaceWsi } from '@/vue/data/pathologyWorkspace'

export type UploadTransferStatus = '等待上传' | '上传中' | '文件处理中' | '已完成' | '上传失败' | '已取消'

export type UploadTransferItem = {
  id: string
  wsi: WorkspaceWsi
  progress: number
  status: UploadTransferStatus
  createdAt: string
  completedAt?: string
}

const STORAGE_KEY = 'huggingpath.uploadTransferQueue.v1'
export const UPLOAD_TRANSFER_CHANGE_EVENT = 'huggingpathUploadTransferChange'
let timer: number | undefined

function emitChange() {
  window.dispatchEvent(new Event(UPLOAD_TRANSFER_CHANGE_EVENT))
}

export function readUploadTransfers(): UploadTransferItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function writeUploadTransfers(value: UploadTransferItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  emitChange()
}

function processQueue() {
  const items = readUploadTransfers()
  const active = items.filter((item) => ['等待上传', '上传中', '文件处理中'].includes(item.status)).slice(0, 2)
  if (!active.length) {
    if (timer) window.clearInterval(timer)
    timer = undefined
    return
  }
  const activeIds = new Set(active.map((item) => item.id))
  let changed = false
  for (const item of items) {
    if (!activeIds.has(item.id)) continue
    if (item.status === '等待上传') item.status = '上传中'
    if (item.status === '上传中') {
      item.progress = Math.min(88, item.progress + 4 + Math.floor(Math.random() * 7))
      if (item.progress >= 88) item.status = '文件处理中'
    } else if (item.status === '文件处理中') {
      item.progress = Math.min(100, item.progress + 2 + Math.floor(Math.random() * 4))
    }
    if (item.progress >= 100) {
      item.status = '已完成'
      item.completedAt = new Date().toISOString()
      upsertWorkspaceWsi(item.wsi)
    }
    changed = true
  }
  if (changed) writeUploadTransfers(items)
}

function ensureProcessing() {
  if (timer || typeof window === 'undefined') return
  processQueue()
  if (readUploadTransfers().some((item) => ['等待上传', '上传中', '文件处理中'].includes(item.status))) {
    timer = window.setInterval(processQueue, 650)
  }
}

export function enqueueWsiTransfers(wsis: WorkspaceWsi[]) {
  if (!wsis.length) return []
  const now = new Date().toISOString()
  const items = wsis.map((wsi): UploadTransferItem => ({
    id: `upload-${crypto.randomUUID()}`,
    wsi,
    progress: 0,
    status: '等待上传',
    createdAt: now,
  }))
  writeUploadTransfers([...items, ...readUploadTransfers()].slice(0, 100))
  ensureProcessing()
  return items
}

export function clearCompletedUploadTransfers() {
  writeUploadTransfers(readUploadTransfers().filter((item) => item.status !== '已完成'))
}

export function cancelUploadTransfer(id: string) {
  const items = readUploadTransfers()
  const target = items.find((item) => item.id === id)
  if (!target || !['等待上传', '上传中', '文件处理中'].includes(target.status)) return
  target.status = '已取消'
  target.completedAt = new Date().toISOString()
  writeUploadTransfers(items)
}

export function retryUploadTransfer(id: string) {
  const items = readUploadTransfers()
  const target = items.find((item) => item.id === id)
  if (!target || !['上传失败', '已取消'].includes(target.status)) return
  target.status = '等待上传'
  target.progress = 0
  delete target.completedAt
  writeUploadTransfers(items)
  ensureProcessing()
}

export function removeUploadTransfer(id: string) {
  writeUploadTransfers(readUploadTransfers().filter((item) => item.id !== id || ['等待上传', '上传中', '文件处理中'].includes(item.status)))
}

export function subscribeUploadTransfers(listener: () => void) {
  window.addEventListener(UPLOAD_TRANSFER_CHANGE_EVENT, listener)
  window.addEventListener('storage', listener)
  ensureProcessing()
  return () => {
    window.removeEventListener(UPLOAD_TRANSFER_CHANGE_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
