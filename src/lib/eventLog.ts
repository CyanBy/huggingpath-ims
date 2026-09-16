/**
 * 行为事件日志：记录 AI 助手相关的关键行为，驱动后续迭代决策。
 * 仅存 localStorage，上限 1000 条，FIFO 淘汰。
 */

export type AgentEventType =
  | 'session.create'
  | 'session.delete'
  | 'session.pin'
  | 'message.send'
  | 'message.stop'
  | 'message.regenerate'
  | 'gate.show'
  | 'gate.confirm'
  | 'gate.cancel'
  | 'task.complete'
  | 'entry.use'
  | 'search.use'

export type AgentEvent = {
  id: string
  type: AgentEventType
  /** 事件细节：会话标题、入口名称、问题摘要等 */
  detail: string
  sessionId?: string
  createdAt: string
}

export const AGENT_EVENT_TYPE_LABELS: Record<AgentEventType, string> = {
  'session.create': '创建会话',
  'session.delete': '删除会话',
  'session.pin': '置顶切换',
  'message.send': '发送消息',
  'message.stop': '停止生成',
  'message.regenerate': '重新生成',
  'gate.show': '闸门展示',
  'gate.confirm': '闸门确认',
  'gate.cancel': '闸门取消',
  'task.complete': '任务回话',
  'entry.use': '情境入口',
  'search.use': '搜索对话',
}

const STORAGE_KEY = 'huggingpath.agentEvents.v1'
const MAX_EVENTS = 1000
export const AGENT_EVENTS_CHANGE_EVENT = 'huggingpathAgentEventsChange'

export function readAgentEvents(): AgentEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const value = JSON.parse(raw)
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function logAgentEvent(type: AgentEventType, detail: string, sessionId?: string) {
  const event: AgentEvent = {
    id: `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    detail: detail.slice(0, 120),
    sessionId,
    createdAt: new Date().toISOString(),
  }
  const next = [event, ...readAgentEvents()].slice(0, MAX_EVENTS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(AGENT_EVENTS_CHANGE_EVENT))
}

export function clearAgentEvents() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(AGENT_EVENTS_CHANGE_EVENT))
}
