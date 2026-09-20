/**
 * AI 助手会话存储。
 * 会话不绑定项目，扁平列表；与 HP 业务数据共用 localStorage，单向读取。
 */
/** 挂载的讨论对象（WSI/Case/任务/项目/传输） */
export type AgentMessageAttachment = {
  kind: 'wsi' | 'case' | 'task' | 'project' | 'transfer' | 'skill' | 'file'
  id: string
  label: string
}

/** 分析提案确认卡（预览-确认闸门）：确认后才创建任务 */
export type AnalysisProposalCard = {
  type: 'analysis-proposal'
  modelId: string
  modelName: string
  objects: { id: string; name: string }[]
  status: 'pending' | 'confirmed' | 'cancelled'
  taskId?: string
}

/** 项目创建提案卡（模拟 Agent：建项目 + 纳入切片，确认后真执行） */
export type ProjectProposalCard = {
  type: 'project-proposal'
  name: string
  description: string
  wsis: { id: string; name: string }[]
  status: 'pending' | 'confirmed' | 'cancelled'
  projectId?: string
}

/** 任务完成回话卡：任务终态时自动落到来源会话 */
export type TaskResultCard = {
  type: 'task-result'
  taskId: string
  taskName: string
  status: '分析完成' | '失败'
  objectCount: string
}

/** 助手回复交付的产物：图片内联展示可预览，表格/文件新标签页打开 */
export type AgentArtifact = {
  kind: 'image' | 'table' | 'file'
  label: string
  /** 静态资源路径（public 下）或 hash 路由 */
  path: string
  desc?: string
}

export type AgentMessageCard = AnalysisProposalCard | TaskResultCard | ProjectProposalCard

export type AgentChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
  /** 发问时挂载的讨论对象，随消息持久化 */
  attachments?: AgentMessageAttachment[]
  /** 富交互卡片（确认闸门 / 任务结果） */
  card?: AgentMessageCard
  /** 思考过程（推理链），在气泡上方可折叠展示 */
  thinking?: string
  /** 交付产物清单（图/表/文件） */
  artifacts?: AgentArtifact[]
}

export type AgentChatSession = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: AgentChatMessage[]
  /** 绑定研究项目的会话；自由对话无此字段 */
  projectId?: string
  /** 置顶会话在列表中排在最前 */
  pinned?: boolean
  /** 有新的助手回复/回话未查看 */
  unread?: boolean
}

const STORAGE_KEY = 'huggingpath.agentSessions.v1'
export const AGENT_SESSIONS_CHANGE_EVENT = 'huggingpathAgentSessionsChange'

function readAll(): AgentChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const value = JSON.parse(raw)
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function writeAll(sessions: AgentChatSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  window.dispatchEvent(new Event(AGENT_SESSIONS_CHANGE_EVENT))
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function listAgentSessions(): AgentChatSession[] {
  return readAll().sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false) || b.updatedAt.localeCompare(a.updatedAt))
}

export function getAgentSession(id: string): AgentChatSession | undefined {
  return readAll().find((s) => s.id === id)
}

export function createAgentSession(projectId?: string, title?: string): AgentChatSession {
  const now = new Date().toISOString()
  const session: AgentChatSession = { id: createId('as'), title: title || '新对话', createdAt: now, updatedAt: now, messages: [], projectId }
  writeAll([session, ...readAll()])
  return session
}

/** 每个研究项目对应一个对话框（默认名“新对话”），不存在时按需创建。 */
export function getOrCreateProjectSession(projectId: string): AgentChatSession {
  const existing = readAll().find((s) => s.projectId === projectId)
  if (existing) return existing
  return createAgentSession(projectId)
}

export function renameAgentSession(id: string, title: string) {
  writeAll(readAll().map((s) => (s.id === id ? { ...s, title: title.trim() || s.title } : s)))
}

/** 调整会话归属：传入 projectId 移入项目，传 undefined 变为自由对话。 */
export function updateAgentSessionProject(id: string, projectId?: string) {
  writeAll(readAll().map((s) => (s.id === id ? { ...s, projectId } : s)))
}

export function toggleAgentSessionPin(id: string) {
  writeAll(readAll().map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s)))
}

export function deleteAgentSession(id: string) {
  writeAll(readAll().filter((s) => s.id !== id))
}

export function appendAgentMessage(
  sessionId: string,
  role: AgentChatMessage['role'],
  text: string,
  extras?: { attachments?: AgentMessageAttachment[]; card?: AgentMessageCard; thinking?: string; artifacts?: AgentArtifact[] },
): AgentChatSession | undefined {
  const now = new Date().toISOString()
  const message: AgentChatMessage = { id: createId('am'), role, text, createdAt: now, ...extras }
  let updated: AgentChatSession | undefined
  writeAll(
    readAll().map((s) => {
      if (s.id !== sessionId) return s
      updated = {
        ...s,
        title: s.messages.length === 0 && role === 'user' && s.title === '新对话' ? text.slice(0, 24) : s.title,
        updatedAt: now,
        unread: role === 'assistant' ? true : s.unread,
        messages: [...s.messages, message],
      }
      return updated
    }),
  )
  return updated
}

/** 流式输出/卡片状态变更时局部更新一条消息 */
export function patchAgentMessage(sessionId: string, messageId: string, patch: Partial<Pick<AgentChatMessage, 'text' | 'card'>>) {
  writeAll(
    readAll().map((s) =>
      s.id === sessionId
        ? { ...s, messages: s.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)) }
        : s,
    ),
  )
}

export function deleteAgentMessage(sessionId: string, messageId: string) {
  writeAll(
    readAll().map((s) =>
      s.id === sessionId ? { ...s, messages: s.messages.filter((m) => m.id !== messageId) } : s,
    ),
  )
}

export function markAgentSessionRead(id: string) {
  writeAll(readAll().map((s) => (s.id === id && s.unread ? { ...s, unread: false } : s)))
}
