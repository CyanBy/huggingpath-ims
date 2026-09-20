/**
 * 对话上传文件 store：记录用户通过「+」菜单或拖拽传入对话的文件。
 * 演示工程不存二进制内容；小型文本类文件保存文本内容，供预览使用。
 * 切片类文件（WSI）归属见决策记录，后续走 WSI 管理链路。
 */

export type AgentUploadedFile = {
  id: string
  name: string
  /** 展示用大小，如 "1.2 MB" */
  size: string
  ext: string
  mimeType: string
  uploadedAt: string
  /** 上传时所在会话（草稿期上传后随首条消息绑定） */
  sessionId?: string
  /** 上传时所在项目空间 */
  projectId?: string
  /** 小型文本文件的内容（≤200KB 的 txt/md/csv/json/log） */
  textContent?: string
}

// ---------- 文件自动归类 ----------

export type AgentFileCategory = 'slide' | 'doc' | 'sheet' | 'image' | 'other'

export const AGENT_FILE_CATEGORY_LABELS: Record<AgentFileCategory, string> = {
  slide: '切片',
  doc: '文档',
  sheet: '表格',
  image: '图片',
  other: '其他',
}

const SLIDE_EXTS = ['svs', 'ndpi', 'mrxs', 'sdpc', 'scn', 'tiff', 'tif', 'bif', 'dcm', 'dcmz']
const DOC_EXTS = ['doc', 'docx', 'pdf', 'md', 'txt', 'ppt', 'pptx']
const SHEET_EXTS = ['csv', 'xls', 'xlsx', 'tsv', 'json']
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']

export function categorizeAgentFile(ext: string): AgentFileCategory {
  const key = ext.toLowerCase()
  if (SLIDE_EXTS.includes(key)) return 'slide'
  if (DOC_EXTS.includes(key)) return 'doc'
  if (SHEET_EXTS.includes(key)) return 'sheet'
  if (IMAGE_EXTS.includes(key)) return 'image'
  return 'other'
}

export function isSlideFile(ext: string) {
  return SLIDE_EXTS.includes(ext.toLowerCase())
}

const STORAGE_KEY = 'huggingpath.agentFiles.v1'
export const AGENT_FILES_CHANGE_EVENT = 'huggingpathAgentFilesChange'

const TEXT_EXTS = ['txt', 'md', 'csv', 'json', 'log']
const TEXT_MAX_BYTES = 200 * 1024

export function readAgentFiles(): AgentUploadedFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const value = JSON.parse(raw)
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function writeAll(files: AgentUploadedFile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
  window.dispatchEvent(new Event(AGENT_FILES_CHANGE_EVENT))
}

function createId() {
  return `af-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function isTextPreviewable(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return TEXT_EXTS.includes(ext) && file.size <= TEXT_MAX_BYTES
}

/** 登记上传文件；小型文本文件异步回填内容 */
export function addAgentFile(file: File, scope: { sessionId?: string; projectId?: string }): AgentUploadedFile {
  const record: AgentUploadedFile = {
    id: createId(),
    name: file.name,
    size: formatFileSize(file.size),
    ext: file.name.split('.').pop()?.toLowerCase() ?? '',
    mimeType: file.type,
    uploadedAt: new Date().toISOString(),
    sessionId: scope.sessionId,
    projectId: scope.projectId,
  }
  writeAll([record, ...readAgentFiles()])
  if (isTextPreviewable(file)) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      writeAll(readAgentFiles().map((item) => (item.id === record.id ? { ...item, textContent: text } : item)))
    }
    reader.readAsText(file)
  }
  return record
}

export function deleteAgentFile(id: string) {
  writeAll(readAgentFiles().filter((item) => item.id !== id))
}

/** 草稿期上传的文件在会话创建后绑定会话 */
export function bindAgentFilesToSession(ids: string[], sessionId: string) {
  if (!ids.length) return
  writeAll(readAgentFiles().map((item) => (ids.includes(item.id) && !item.sessionId ? { ...item, sessionId } : item)))
}
