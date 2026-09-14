/**
 * AI 助手会话存储。
 * 会话不绑定项目，扁平列表；与 HP 业务数据共用 localStorage，单向读取。
 */
export type AgentChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
}

export type AgentChatSession = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: AgentChatMessage[]
  /** 绑定研究项目的会话；自由对话无此字段 */
  projectId?: string
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
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
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

export function deleteAgentSession(id: string) {
  writeAll(readAll().filter((s) => s.id !== id))
}

export function appendAgentMessage(sessionId: string, role: AgentChatMessage['role'], text: string): AgentChatSession | undefined {
  const now = new Date().toISOString()
  const message: AgentChatMessage = { id: createId('am'), role, text, createdAt: now }
  let updated: AgentChatSession | undefined
  writeAll(
    readAll().map((s) => {
      if (s.id !== sessionId) return s
      updated = {
        ...s,
        title: s.messages.length === 0 && role === 'user' && s.title === '新对话' ? text.slice(0, 24) : s.title,
        updatedAt: now,
        messages: [...s.messages, message],
      }
      return updated
    }),
  )
  return updated
}
