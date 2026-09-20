<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowUp, Check, ChevronDown, ChevronRight, CircleCheck, CircleX, ClipboardList, Copy, ExternalLink, FileImage, Files, FileSpreadsheet, FileText, FolderOpen, FolderPlus, ListTodo, MessageSquarePlus, MoreHorizontal, PanelLeft, Pencil, Pin, RefreshCw, Search, Sparkles, Square, X } from '@lucide/vue'
import {
  AGENT_SESSIONS_CHANGE_EVENT,
  appendAgentMessage,
  createAgentSession,
  deleteAgentMessage,
  deleteAgentSession,
  getAgentSession,
  listAgentSessions,
  markAgentSessionRead,
  patchAgentMessage,
  renameAgentSession,
  toggleAgentSessionPin,
  updateAgentSessionProject,
  type AgentArtifact,
  type AgentChatMessage,
  type AgentChatSession,
  type AgentMessageAttachment,
  type AnalysisProposalCard,
  type TaskResultCard,
} from '@/lib/agentSessions'
import { createAgentAnalysisTask, readAnalysisTasks, startAnalysisTask } from '@/lib/analysisTasks'
import { logAgentEvent } from '@/lib/eventLog'
import { getStadDemoScript, matchStadReply, STAD_PROJECT_ID } from '@/lib/stadScript'
import { dispatchAgentToast } from '@/lib/agentRuntime'
import { getPathologySiteLabel } from '@/lib/pathologySpecimens'
import { readWorkspaceCases, readWorkspaceProjects, readWorkspaceWsis, writeWorkspaceProjects, type WorkspaceCase, type WorkspaceProject, type WorkspaceWsi } from '@/vue/data/pathologyWorkspace'

const route = useRoute()
const router = useRouter()

/** 输入框自动聚焦并选中（弹窗打开时） */
const vFocusSelect = {
  mounted: (el: HTMLInputElement) => {
    el.focus()
    el.select()
  },
}

type AttachedObject = AgentMessageAttachment
type MainView = 'chat' | 'project-form'
type CtxTarget = { kind: 'project' | 'session'; id: string }

const sessions = ref<AgentChatSession[]>(listAgentSessions())
const projects = ref<WorkspaceProject[]>(readWorkspaceProjects())
/** 分析任务（用于会话状态徽标），随 analysisTasksChange 事件刷新 */
const tasks = ref(readAnalysisTasks())
const searchQuery = ref('')
const activeId = ref<string | null>(null)
/** 草稿态（未发送首条消息）的项目归属：null 表示自由对话 */
const draftProjectId = ref<string | null>(null)
const mainView = ref<MainView>('chat')
const expandedProjects = ref<string[]>([])
const draft = ref('')
/** 生成阶段：thinking=模拟思考(3s)，streaming=打字机输出(3s)，null=空闲 */
const generationPhase = ref<'thinking' | 'streaming' | null>(null)
const inputEl = ref<HTMLTextAreaElement | null>(null)
let thinkTimer: number | undefined
let streamTimer: number | undefined
const sidebarOpen = ref(typeof window === 'undefined' ? true : window.innerWidth >= 768)
const filesOpen = ref(false)
const filesTab = ref<'wsi' | 'case' | 'task' | 'project'>('wsi')
const attached = ref<AttachedObject[]>([])
const messageListEl = ref<HTMLElement | null>(null)

const wsis = ref<WorkspaceWsi[]>(readWorkspaceWsis())
const cases = ref<WorkspaceCase[]>(readWorkspaceCases())

// 新建研究项目表单
const projectForm = ref({ name: '', description: '', tags: '', visibility: 'private' as 'private' | 'public' })
const projectError = ref('')

// 重命名弹窗
const renameDialog = ref<{ kind: 'session' | 'project'; id: string } | null>(null)
const renameText = ref('')

// 删除确认弹窗
const deleteDialog = ref<{ kind: 'session' | 'project'; id: string } | null>(null)

// 移动到项目弹窗
const moveDialog = ref<{ sessionId: string; projectId: string } | null>(null)

// 右键菜单
const ctxMenu = ref<{ x: number; y: number; target: CtxTarget } | null>(null)

const activeSession = computed(() => (activeId.value ? sessions.value.find((s) => s.id === activeId.value) ?? null : null))
/** 当前空间的项目：优先取已打开会话的归属，其次取草稿归属 */
const currentProjectId = computed(() => activeSession.value?.projectId ?? draftProjectId.value)
const activeProject = computed(() => (currentProjectId.value ? projects.value.find((p) => p.id === currentProjectId.value) ?? null : null))
const isEmpty = computed(() => !activeSession.value || activeSession.value.messages.length === 0)
/** 自由对话（不绑定项目）出现在“最近” */
const recentSessions = computed(() => sessions.value.filter((s) => !s.projectId))

/** 最近列表分组：置顶 + 今天/昨天/最近 7 天/更早（对齐 Codex） */
const recentGroups = computed(() => {
  const pinned = recentSessions.value.filter((s) => s.pinned)
  const rest = recentSessions.value.filter((s) => !s.pinned)
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const buckets = [
    { label: '今天', items: [] as AgentChatSession[] },
    { label: '昨天', items: [] as AgentChatSession[] },
    { label: '最近 7 天', items: [] as AgentChatSession[] },
    { label: '更早', items: [] as AgentChatSession[] },
  ]
  for (const session of rest) {
    const time = new Date(session.updatedAt).getTime()
    if (time >= startOfDay) buckets[0].items.push(session)
    else if (time >= startOfDay - 86400000) buckets[1].items.push(session)
    else if (time >= startOfDay - 7 * 86400000) buckets[2].items.push(session)
    else buckets[3].items.push(session)
  }
  return [...(pinned.length ? [{ label: '置顶', items: pinned }] : []), ...buckets.filter((b) => b.items.length)]
})

const GENERIC_SUGGESTIONS = [
  '比较这两个 Case 的 TME 特征差异',
  '这个项目里所有失败的分析是什么原因',
  '把这次分析结果整理成可以汇报的摘要',
  '帮我看看哪张切片还没跑过 TME 分析',
]

/** 空态建议问题：STAD 项目空间给剧本五连问，其余给通用问题 */
const suggestions = computed(() =>
  currentProjectId.value === STAD_PROJECT_ID ? getStadDemoScript().map((s) => s.q) : GENERIC_SUGGESTIONS,
)

function refresh() {
  sessions.value = listAgentSessions()
  projects.value = readWorkspaceProjects()
}

function projectSessionCount(projectId: string) {
  return sessions.value.filter((s) => s.projectId === projectId).length
}

function onTasksChange() {
  tasks.value = readAnalysisTasks()
}

function onSessionsChange() {
  refresh()
}

/** 多标签页同步：其他标签页写入 localStorage 时刷新本页数据 */
function onStorage(event: StorageEvent) {
  if (!event.key) return
  if (event.key.includes('agentSessions')) refresh()
  if (event.key.includes('analysisTasks')) tasks.value = readAnalysisTasks()
  if (event.key.includes('vue.')) {
    projects.value = readWorkspaceProjects()
    wsis.value = readWorkspaceWsis()
    cases.value = readWorkspaceCases()
  }
}

onMounted(() => {
  window.addEventListener('analysisTasksChange', onTasksChange)
  window.addEventListener(AGENT_SESSIONS_CHANGE_EVENT, onSessionsChange)
  window.addEventListener('storage', onStorage)
})
onUnmounted(() => {
  window.removeEventListener('analysisTasksChange', onTasksChange)
  window.removeEventListener(AGENT_SESSIONS_CHANGE_EVENT, onSessionsChange)
  window.removeEventListener('storage', onStorage)
  if (thinkTimer) window.clearTimeout(thinkTimer)
  if (streamTimer) window.clearInterval(streamTimer)
})

type SessionTaskState = { state: 'running' | 'attention' | 'done'; label: string } | null

const taskStateDotClass: Record<'running' | 'attention' | 'done', string> = {
  running: 'bg-[#d292f4] animate-pulse',
  attention: 'bg-[#ff9c9c]',
  done: 'bg-[#95d94e]',
}

/** 会话关联分析任务的聚合状态：运行中 > 需关注 > 全部完成 */
function sessionTaskState(sessionId: string): SessionTaskState {
  const related = tasks.value.filter((t) => t.agentSessionId === sessionId)
  if (!related.length) return null
  const running = related.filter((t) => ['待分析', '排队中', '正在分析'].includes(t.status)).length
  if (running) return { state: 'running', label: `${running} 个分析任务进行中` }
  const attention = related.filter((t) => t.status === '失败' || t.status === '已停止').length
  if (attention) return { state: 'attention', label: `${attention} 个分析任务需要关注` }
  return { state: 'done', label: '关联的分析任务已全部完成' }
}

// ---------- 跨对话搜索 ----------

const searchActive = computed(() => Boolean(searchQuery.value.trim()))

/** 命中消息内容时截取关键词前后片段 */
function messageSnippet(text: string, query: string) {
  const index = text.toLowerCase().indexOf(query)
  const start = Math.max(0, index - 12)
  const end = Math.min(text.length, index + query.length + 24)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

const searchResults = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return [] as { session: AgentChatSession; snippet: string }[]
  return sessions.value
    .map((session) => {
      const titleHit = session.title.toLowerCase().includes(query)
      const hitMessage = session.messages.find((m) => m.text.toLowerCase().includes(query))
      if (!titleHit && !hitMessage) return null
      return { session, snippet: hitMessage ? messageSnippet(hitMessage.text, query) : '' }
    })
    .filter((item): item is { session: AgentChatSession; snippet: string } => Boolean(item))
})

function projectName(projectId?: string) {
  return projectId ? projects.value.find((p) => p.id === projectId)?.name ?? '' : ''
}

// 搜索行为埋点（防抖）
let searchLogTimer: number | undefined
watch(searchQuery, (query) => {
  if (searchLogTimer) window.clearTimeout(searchLogTimer)
  const text = query.trim()
  if (!text) return
  searchLogTimer = window.setTimeout(() => logAgentEvent('search.use', text), 800)
})

function openSession(id: string) {
  const session = getAgentSession(id)
  markAgentSessionRead(id)
  refresh()
  activeId.value = id
  draftProjectId.value = session?.projectId ?? null
  mainView.value = 'chat'
  if (session?.projectId && !expandedProjects.value.includes(session.projectId)) {
    expandedProjects.value = [...expandedProjects.value, session.projectId]
  }
  router.replace({ query: { session: id } })
  scrollToBottom()
}

function removeSession(id: string) {
  logAgentEvent('session.delete', sessions.value.find((s) => s.id === id)?.title ?? '', id)
  deleteAgentSession(id)
  refresh()
  if (activeId.value === id) {
    activeId.value = null
    router.replace({ query: {} })
  }
}

/** 新建自由对话（草稿态，发送首条消息才持久化） */
function openNewChat() {
  activeId.value = null
  draftProjectId.value = null
  mainView.value = 'chat'
  router.replace({ query: {} })
}

function openProjectForm() {
  activeId.value = null
  mainView.value = 'project-form'
  projectError.value = ''
  router.replace({ query: {} })
}

/**
 * 点击项目：只展开并进入项目空间，不自动创建对话。
 * 有历史对话则打开最近一条；没有则是空草稿，发送首条消息才生成。
 */
function openProject(projectId: string) {
  if (!expandedProjects.value.includes(projectId)) {
    expandedProjects.value = [...expandedProjects.value, projectId]
  }
  draftProjectId.value = projectId
  mainView.value = 'chat'
  const latest = sessions.value.filter((s) => s.projectId === projectId)[0]
  if (latest) {
    openSession(latest.id)
  } else {
    activeId.value = null
    router.replace({ query: {} })
  }
}

/** 项目行点击：已展开→收起（不动主区）；未展开→展开并进入项目空间 */
function onProjectRowClick(projectId: string) {
  if (expandedProjects.value.includes(projectId)) {
    expandedProjects.value = expandedProjects.value.filter((id) => id !== projectId)
  } else {
    openProject(projectId)
  }
}

function toggleProjectExpand(projectId: string) {
  expandedProjects.value = expandedProjects.value.includes(projectId)
    ? expandedProjects.value.filter((id) => id !== projectId)
    : [...expandedProjects.value, projectId]
}

/** 项目下已持久化的对话（草稿不在列表中） */
function projectSessions(projectId: string) {
  return sessions.value.filter((s) => s.projectId === projectId)
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  return `${Math.floor(hours / 24)} 天前`
}

function attachObject(item: AttachedObject) {
  if (attached.value.some((o) => o.kind === item.kind && o.id === item.id)) return
  attached.value = [...attached.value, item]
}

function detachObject(item: AttachedObject) {
  attached.value = attached.value.filter((o) => !(o.kind === item.kind && o.id === item.id))
}

/** 查看对象：新开浏览器标签页，不打断当前对话 */
function viewObjectInNewTab(item: AttachedObject) {
  const hash =
    item.kind === 'wsi' ? `/workbench/wsi?preview=${item.id}`
    : item.kind === 'case' ? `/workbench/cases/${item.id}`
    : item.kind === 'task' ? `/workbench/run/${item.id}`
    : item.kind === 'project' ? '/workbench/projects'
    : '/workbench/transfers'
  window.open(`/#${hash}`, '_blank')
}

/** 挂载对象的小图标标签 */
function attachKindLabel(kind: AttachedObject['kind']) {
  return ATTACH_KIND_LABELS[kind]
}

/** 创建研究项目：进入项目空间并给出草稿“新对话”，发送首条消息才保留 */
function createProject() {
  projectError.value = ''
  if (!projectForm.value.name.trim()) {
    projectError.value = '请输入项目名称。'
    return
  }
  const list = readWorkspaceProjects()
  const id = `PRJ-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`
  writeWorkspaceProjects([
    {
      id,
      name: projectForm.value.name.trim(),
      description: projectForm.value.description.trim(),
      tags: projectForm.value.tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
      caseIds: [],
      standaloneWsiIds: [],
      memberCount: 1,
      updatedAt: new Date().toISOString().slice(0, 10),
      visibility: projectForm.value.visibility,
    },
    ...list,
  ])
  projectForm.value = { name: '', description: '', tags: '', visibility: 'private' }
  refresh()
  expandedProjects.value = [...expandedProjects.value, id]
  draftProjectId.value = id
  activeId.value = null
  mainView.value = 'chat'
  router.replace({ query: {} })
}

function exitChat() {
  if (window.history.length > 1) router.back()
  else router.push('/assistant')
}

// ---------- 新建对话：项目归属选择器（对齐 Codex 项目选择器） ----------

const picker = ref<{ left: number; top?: number; bottom?: number } | null>(null)
const pickerQuery = ref('')

/** 侧栏项目列表一次最多显示 10 个，更多点「展开其余」 */
const PROJECT_LIST_LIMIT = 10
const projectListExpanded = ref(false)
const visibleProjects = computed(() =>
  projectListExpanded.value ? projects.value : projects.value.slice(0, PROJECT_LIST_LIMIT),
)

const pickerFilteredProjects = computed(() => {
  const query = pickerQuery.value.trim().toLowerCase()
  return query ? projects.value.filter((p) => p.name.toLowerCase().includes(query)) : projects.value
})

function openPickerFromInput(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  picker.value = { left: rect.left, bottom: window.innerHeight - rect.top + 6 }
  pickerQuery.value = ''
}

function closePicker() {
  picker.value = null
}

/** 选择归属：仍走草稿制，发送首条消息才生成会话 */
function pickProjectScope(projectId: string | null) {
  openNewChat()
  draftProjectId.value = projectId
  if (projectId && !expandedProjects.value.includes(projectId)) {
    expandedProjects.value = [...expandedProjects.value, projectId]
  }
  closePicker()
}

function pickNewProject() {
  closePicker()
  openProjectForm()
}

// ---------- 右键菜单与弹窗 ----------

function openCtxMenu(event: MouseEvent, target: CtxTarget) {
  event.preventDefault()
  ctxMenu.value = {
    x: Math.min(event.clientX, window.innerWidth - 200),
    y: Math.min(event.clientY, window.innerHeight - 220),
    target,
  }
}

function closeCtxMenu() {
  ctxMenu.value = null
}

function ctxRename() {
  if (!ctxMenu.value) return
  const { kind, id } = ctxMenu.value.target
  if (kind === 'project') {
    const project = projects.value.find((p) => p.id === id)
    openRenameDialog('project', id, project?.name ?? '')
  } else {
    const session = sessions.value.find((s) => s.id === id)
    openRenameDialog('session', id, session?.title ?? '')
  }
  closeCtxMenu()
}

function ctxDelete() {
  if (!ctxMenu.value) return
  deleteDialog.value = { ...ctxMenu.value.target }
  closeCtxMenu()
}

function ctxMoveToProject() {
  if (!ctxMenu.value) return
  moveDialog.value = { sessionId: ctxMenu.value.target.id, projectId: '' }
  closeCtxMenu()
}

function ctxMoveOutOfProject() {
  if (!ctxMenu.value) return
  updateAgentSessionProject(ctxMenu.value.target.id, undefined)
  refresh()
  if (activeId.value === ctxMenu.value.target.id) draftProjectId.value = null
  closeCtxMenu()
}

function ctxTogglePin() {
  if (!ctxMenu.value) return
  toggleAgentSessionPin(ctxMenu.value.target.id)
  logAgentEvent('session.pin', sessions.value.find((s) => s.id === ctxMenu.value!.target.id)?.title ?? '', ctxMenu.value.target.id)
  refresh()
  closeCtxMenu()
}

function openRenameDialog(kind: 'session' | 'project', id: string, current: string) {
  renameDialog.value = { kind, id }
  renameText.value = current
}

function closeRenameDialog() {
  renameDialog.value = null
  renameText.value = ''
}

function submitRename() {
  if (!renameDialog.value) return
  const { kind, id } = renameDialog.value
  const value = renameText.value.trim()
  if (value) {
    if (kind === 'session') {
      renameAgentSession(id, value)
    } else {
      writeWorkspaceProjects(readWorkspaceProjects().map((p) => (p.id === id ? { ...p, name: value } : p)))
    }
    refresh()
  }
  closeRenameDialog()
}

function confirmDelete() {
  if (!deleteDialog.value) return
  const { kind, id } = deleteDialog.value
  if (kind === 'session') {
    removeSession(id)
  } else {
    // 删除项目：项目下的对话一并删除，项目实体从共享 store 移除
    const doomed = sessions.value.filter((s) => s.projectId === id)
    doomed.forEach((s) => deleteAgentSession(s.id))
    writeWorkspaceProjects(readWorkspaceProjects().filter((p) => p.id !== id))
    if (currentProjectId.value === id) {
      draftProjectId.value = null
    }
    if (activeId.value && doomed.some((s) => s.id === activeId.value)) {
      activeId.value = null
      router.replace({ query: {} })
    }
    expandedProjects.value = expandedProjects.value.filter((pid) => pid !== id)
    refresh()
  }
  deleteDialog.value = null
}

function submitMove() {
  if (!moveDialog.value || !moveDialog.value.projectId) return
  const projectId = moveDialog.value.projectId
  updateAgentSessionProject(moveDialog.value.sessionId, projectId)
  if (activeId.value === moveDialog.value.sessionId) draftProjectId.value = projectId
  expandedProjects.value = [...expandedProjects.value, projectId]
  refresh()
  moveDialog.value = null
}

/** 写操作意图：触发预览-确认闸门卡 */
const GATE_PATTERN = /(跑|发起|批量|开始|全部|都).{0,10}分析|分析.{0,6}(一遍|全部|所有)/

const ATTACH_KIND_LABELS: Record<AttachedObject['kind'], string> = {
  wsi: 'WSI',
  case: 'Case',
  task: '任务',
  project: '项目',
  transfer: '传输',
}

type BuiltReply = { text: string; card?: AnalysisProposalCard; thinking?: string; artifacts?: AgentArtifact[] }

/**
 * 模拟内核：罐装示例回答 + 真实计数，不编造。
 * 实体引用用 [[kind:id:label]] 令牌，renderLite 渲染为新标签页链接。
 */
function buildReply(question: string, objects: AttachedObject[]): BuiltReply {
  // 挂载了分析任务：状态速览
  const taskObject = objects.find((o) => o.kind === 'task')
  if (taskObject) {
    const task = readAnalysisTasks().find((t) => t.id === taskObject.id)
    if (task) {
      return {
        text: `任务 [[task:${task.id}:${task.taskName}]] 的当前情况：\n\n- 状态：**${task.status}**\n- 对象：${task.objectCount}\n- 来源：${task.sourceLabel}\n\n需要我在它完成后提醒你，或者帮你解读结果，直接说。`,
      }
    }
  }

  // 挂载了传输任务：失败归因示例
  const transferObject = objects.find((o) => o.kind === 'transfer')
  if (transferObject) {
    return {
      text: `关于传输「**${transferObject.label}**」的异常（示例归因）：\n\n最可能的原因是网络中断导致分片校验失败，断点已保留。\n\n建议：在传输队列点「重试」从断点续传；若反复失败，检查单文件是否超过大小限制。`,
    }
  }

  // STAD 队列科研演示剧本（素材来自 stad_pm_package，数字不许编）
  const stad = matchStadReply(question)
  if (stad) {
    return { text: stad.text, thinking: stad.thinking, artifacts: stad.artifacts }
  }

  if (question.includes('TME 特征差异')) {
    const sample = readWorkspaceCases().slice(0, 2)
    if (sample.length >= 2) {
      return {
        text: `这是两个 Case 的 TME 特征对比（示例解读，基于演示数据）：\n\n**[[case:${sample[0].id}:${sample[0].id}]]**\n- 淋巴细胞密度：高（约 1420 cells/mm²）\n- 三级淋巴结构：可见 3 处\n- 间质占比：约 38%\n\n**[[case:${sample[1].id}:${sample[1].id}]]**\n- 淋巴细胞密度：中（约 860 cells/mm²）\n- 三级淋巴结构：未见明确结构\n- 间质占比：约 52%\n\n解读：前者免疫浸润更活跃，后者间质反应更明显。想换两个 Case 比较，把它们挂为讨论对象再问我。`,
      }
    }
  }

  if (question.includes('失败的分析')) {
    const failed = readAnalysisTasks().filter((t) => t.status === '失败')
    if (!failed.length) {
      return { text: '我查了一下，当前**没有失败的分析任务**，都在正常运行或已完成。' }
    }
    const lines = failed.slice(0, 3).map((t, i) => {
      const reasons = ['切片扫描区域不完整，边缘视野置信度过低', '染色强度超出模型校准范围', '文件读取超时，疑似存储抖动']
      return `- [[task:${t.id}:${t.taskName}]]：${reasons[i % reasons.length]}（示例归因）`
    })
    return {
      text: `当前共有 **${failed.length}** 个失败任务：\n\n${lines.join('\n')}\n\n建议先确认原始文件完整，再到任务列表重新分析。要我换个思路重新发起，直接说。`,
    }
  }

  if (question.includes('汇报的摘要')) {
    const wsiCount = readWorkspaceWsis().length
    const caseCount = readWorkspaceCases().length
    const doneCount = readAnalysisTasks().filter((t) => t.status === '分析完成').length
    return {
      text: `这是可以直接放进周报的摘要（示例）：\n\n**分析概览**：累计完成 **${doneCount}** 次分析任务，覆盖 **${caseCount}** 个 Case、**${wsiCount}** 张 WSI。\n\n**关键发现**：\n- TME 高免疫浸润切片占比约 35%，集中于 HER2 队列\n- 核分裂指数高危区域与 Ki-67 强阳性区域高度重合\n- 2 张切片因扫描质量被标记为需重扫\n\n**后续建议**：优先复扫质量不达标切片，再扩大 TME 分析覆盖面。`,
    }
  }

  if (question.includes('还没跑过 TME')) {
    const analyzedIds = new Set(readAnalysisTasks().flatMap((t) => t.objects.map((o) => o.id)))
    const pending = readWorkspaceWsis().filter((w) => !analyzedIds.has(w.id)).slice(0, 3)
    if (!pending.length) {
      return { text: '对照任务记录，所有切片都已经跑过 TME 分析，没有遗漏。' }
    }
    const lines = pending.map((w) => `- [[wsi:${w.id}:${w.fileName}]]（${w.stain} · ${w.size}）`)
    return {
      text: `对照任务记录，以下 **${pending.length}** 张切片还没跑过 TME 分析：\n\n${lines.join('\n')}\n\n要我把它们批量发起分析吗？确认后我会生成分析任务。`,
    }
  }

  // 写操作 → 预览-确认闸门
  if (GATE_PATTERN.test(question)) {
    const attachedWsis = objects.filter((o) => o.kind === 'wsi')
    const targets = attachedWsis.length
      ? attachedWsis.map((o) => ({ id: o.id, name: o.label }))
      : readWorkspaceWsis().slice(0, 2).map((w) => ({ id: w.id, name: w.fileName }))
    logAgentEvent('gate.show', `TME Analyzer · ${targets.length} 张切片`, activeId.value ?? undefined)
    return {
      text: `好的，这是一项写操作，按约定需要你确认后才会执行。我计划对以下 **${targets.length}** 张切片运行 **TME Analyzer**，请核对分析计划：`,
      card: { type: 'analysis-proposal', modelId: 'mod-tme', modelName: 'TME Analyzer', objects: targets, status: 'pending' },
    }
  }

  // 默认：如实汇报平台真实统计，不编造
  const wsiCount = readWorkspaceWsis().length
  const caseCount = readWorkspaceCases().length
  const projectCount = readWorkspaceProjects().length
  const taskCount = readAnalysisTasks().length
  const parts: string[] = []
  if (activeProject.value) {
    parts.push(`当前在研究项目「**${activeProject.value.name}**」的对话框中，后续提问默认以该项目为范围。`)
  }
  if (objects.length) {
    parts.push(`本次问题关联了 **${objects.length}** 个对象：${objects.map((o) => `[[${o.kind}:${o.id}:${ATTACH_KIND_LABELS[o.kind]} ${o.label}]]`).join('、')}。`)
  }
  parts.push(`我收到了你的问题：「${question}」。`)
  parts.push(`我现在能看到的真实数据：**${caseCount}** 个 Case、**${wsiCount}** 张 WSI、**${projectCount}** 个研究项目、**${taskCount}** 个分析任务。`)
  parts.push('检索、解读与发起分析的对话能力正在逐步接入，每一次回答都会基于这些真实数据，不会编造。')
  return { text: parts.join('\n\n') }
}

function clearGenTimers() {
  if (thinkTimer) window.clearTimeout(thinkTimer)
  if (streamTimer) window.clearInterval(streamTimer)
  thinkTimer = undefined
  streamTimer = undefined
}

/** 停止生成：思考阶段不留痕迹，流式阶段保留已输出部分 */
function stopGeneration() {
  clearGenTimers()
  generationPhase.value = null
  logAgentEvent('message.stop', activeSession.value?.title ?? '', activeId.value ?? undefined)
  refresh()
}

/** 模拟回复主流程：思考 3s → 打字机流式输出 3s */
function runReply(sessionId: string, question: string, objects: AttachedObject[]) {
  generationPhase.value = 'thinking'
  thinkTimer = window.setTimeout(() => {
    thinkTimer = undefined
    const reply = buildReply(question, objects)
    const session = appendAgentMessage(sessionId, 'assistant', '', {
      ...(reply.card ? { card: reply.card } : {}),
      ...(reply.thinking ? { thinking: reply.thinking } : {}),
      ...(reply.artifacts ? { artifacts: reply.artifacts } : {}),
    })
    refresh()
    scrollToBottom()
    const messageId = session?.messages[session.messages.length - 1]?.id
    if (!messageId) {
      generationPhase.value = null
      return
    }
    generationPhase.value = 'streaming'
    const full = reply.text
    const TICKS = 30
    let tick = 0
    streamTimer = window.setInterval(() => {
      tick += 1
      patchAgentMessage(sessionId, messageId, { text: full.slice(0, Math.ceil((full.length * tick) / TICKS)) })
      refresh()
      scrollToBottom()
      if (tick >= TICKS) {
        window.clearInterval(streamTimer)
        streamTimer = undefined
        finishGeneration(sessionId)
      }
    }, 100)
  }, 3000)
}

function finishGeneration(sessionId: string) {
  generationPhase.value = null
  if (activeId.value === sessionId && !document.hidden) {
    markAgentSessionRead(sessionId)
  } else {
    dispatchAgentToast(`「${getAgentSession(sessionId)?.title ?? '对话'}」已回复`, sessionId)
  }
  refresh()
  scrollToBottom()
}

async function send(text?: string) {
  const content = (text ?? draft.value).trim()
  if (!content || generationPhase.value) return
  // 草稿 → 首条消息时才创建会话（自由或归属当前项目空间）
  if (!activeId.value) {
    const session = createAgentSession(draftProjectId.value ?? undefined)
    logAgentEvent('session.create', content.slice(0, 24), session.id)
    refresh()
    activeId.value = session.id
    router.replace({ query: { session: session.id } })
  }
  const objects = [...attached.value]
  appendAgentMessage(activeId.value, 'user', content, objects.length ? { attachments: objects } : undefined)
  logAgentEvent('message.send', content.slice(0, 40), activeId.value)
  draft.value = ''
  attached.value = []
  markAgentSessionRead(activeId.value)
  refresh()
  scrollToBottom()
  runReply(activeId.value, content, objects)
}

// ---------- 预览-确认闸门 ----------

function proposalOf(message: AgentChatMessage): AnalysisProposalCard | null {
  return message.card?.type === 'analysis-proposal' ? message.card : null
}

function resultOf(message: AgentChatMessage): TaskResultCard | null {
  return message.card?.type === 'task-result' ? message.card : null
}

function confirmProposal(message: AgentChatMessage) {
  const card = proposalOf(message)
  const session = activeSession.value
  if (!card || !session || card.status !== 'pending') return
  const wsiMap = new Map(readWorkspaceWsis().map((w) => [w.id, w]))
  const task = createAgentAnalysisTask({
    agentSessionId: session.id,
    modelId: card.modelId,
    objects: card.objects.map((o) => {
      const wsi = wsiMap.get(o.id)
      return {
        id: o.id,
        name: o.name,
        stain: wsi?.stain,
        size: wsi?.size,
        projectId: session.projectId,
        projectName: projects.value.find((p) => p.id === session.projectId)?.name,
      }
    }),
  })
  startAnalysisTask(task.id)
  patchAgentMessage(session.id, message.id, { card: { ...card, status: 'confirmed', taskId: task.id } })
  logAgentEvent('gate.confirm', `${card.modelName} · ${card.objects.length} 张切片`, session.id)
  refresh()
}

function cancelProposal(message: AgentChatMessage) {
  const card = proposalOf(message)
  const session = activeSession.value
  if (!card || !session || card.status !== 'pending') return
  patchAgentMessage(session.id, message.id, { card: { ...card, status: 'cancelled' } })
  logAgentEvent('gate.cancel', card.modelName, session.id)
  refresh()
}

// ---------- 消息级操作 ----------

const copiedId = ref<string | null>(null)

/** 思考过程折叠块的展开状态（按消息 id） */
const expandedThinking = ref<string[]>([])
const previewImage = ref<AgentArtifact | null>(null)

function toggleThinking(id: string) {
  expandedThinking.value = expandedThinking.value.includes(id)
    ? expandedThinking.value.filter((t) => t !== id)
    : [...expandedThinking.value, id]
}

function copyMessage(message: AgentChatMessage) {
  navigator.clipboard?.writeText(message.text)
  copiedId.value = message.id
  window.setTimeout(() => {
    if (copiedId.value === message.id) copiedId.value = null
  }, 1500)
}

/** 编辑重发：原文回填输入框，作为新消息发送，历史不动 */
function editMessage(message: AgentChatMessage) {
  draft.value = message.text
  inputEl.value?.focus()
}

/** 重新生成：删除该回答，针对前一条提问重新模拟生成 */
function regenerateMessage(message: AgentChatMessage) {
  const session = activeSession.value
  if (!session || generationPhase.value) return
  const index = session.messages.findIndex((m) => m.id === message.id)
  const preceding = [...session.messages.slice(0, index)].reverse().find((m) => m.role === 'user')
  if (!preceding) return
  deleteAgentMessage(session.id, message.id)
  logAgentEvent('message.regenerate', preceding.text.slice(0, 40), session.id)
  refresh()
  runReply(session.id, preceding.text, preceding.attachments ?? [])
}

/** 轻量 Markdown：先转义防注入，支持 **加粗** 与实体引用令牌 [[kind:id:label]]（新标签页打开） */
function renderLite(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\[\[(wsi|case|task|project|transfer):([^:\]]+):([^\]]+)\]\]/g, (_m, kind: string, id: string, label: string) => {
      const hash =
        kind === 'wsi' ? `/workbench/wsi?preview=${id}`
        : kind === 'case' ? `/workbench/cases/${id}`
        : kind === 'task' ? `/workbench/run/${id}`
        : kind === 'project' ? '/workbench/projects'
        : '/workbench/transfers'
      return `<a href="#${hash}" target="_blank" class="text-[#d292f4] underline decoration-[#8f35b7]/50 underline-offset-2 hover:text-white">${label}</a>`
    })
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
}

/** 流式输出中的最后一条消息（渲染光标用） */
const lastMessageId = computed(() => activeSession.value?.messages[activeSession.value.messages.length - 1]?.id ?? null)

function scrollToBottom() {
  nextTick(() => {
    if (messageListEl.value) messageListEl.value.scrollTop = messageListEl.value.scrollHeight
  })
}

// 从工作台等入口带入对话对象（新建草稿并挂载，可附带自动提问）
watch(
  () => [route.query.attachKind, route.query.attachId, route.query.attachLabel, route.query.q, route.query.entry],
  ([kind, id, label, q, entry]) => {
    if (typeof entry === 'string' && entry) {
      logAgentEvent('entry.use', entry)
    }
    const kinds: AttachedObject['kind'][] = ['wsi', 'case', 'task', 'project', 'transfer']
    if (typeof id === 'string' && id && kinds.includes(kind as AttachedObject['kind'])) {
      openNewChat()
      attachObject({ kind: kind as AttachedObject['kind'], id, label: typeof label === 'string' && label ? label : id })
      router.replace({ query: {} })
      if (typeof q === 'string' && q.trim()) send(q)
    }
  },
  { immediate: true },
)

watch(
  () => route.query.session,
  (id) => {
    const sid = typeof id === 'string' ? id : null
    if (sid && getAgentSession(sid)) {
      activeId.value = sid
      draftProjectId.value = getAgentSession(sid)?.projectId ?? null
      mainView.value = 'chat'
      scrollToBottom()
    } else if (sid) {
      activeId.value = null
      router.replace({ query: {} })
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex h-[calc(100dvh-4rem)]">
    <!-- 功能侧栏 -->
    <aside
      :class="[
        'shrink-0 flex-col border-r border-white/[0.06] bg-[#14151a]',
        sidebarOpen ? 'flex w-[240px]' : 'hidden',
        'max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:pt-16',
      ]"
    >
      <div class="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3.5">
        <Sparkles :size="17" class="text-[#d292f4]" />
        <span class="text-[15px] font-semibold text-white">AI 助手</span>
      </div>
      <nav class="grid gap-0.5 p-3">
        <button class="menu-item" @click="openNewChat">
          <MessageSquarePlus :size="17" />新建对话
        </button>
        <button class="menu-item" @click="openProjectForm">
          <FolderPlus :size="17" />新建研究项目
        </button>
        <button class="menu-item" @click="filesOpen = !filesOpen">
          <Files :size="17" />我的文件
        </button>
      </nav>

      <div class="px-3 pb-2">
        <div class="flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 focus-within:border-[#8f35b7]/50">
          <Search :size="14" class="shrink-0 text-[#64748b]" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索对话"
            class="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-[#64748b] focus:outline-none"
            @keydown.esc="searchQuery = ''"
          />
          <button v-if="searchQuery" class="shrink-0 text-[#64748b] hover:text-white" title="清除搜索" @click="searchQuery = ''">
            <X :size="13" />
          </button>
        </div>
      </div>

      <template v-if="!searchActive">
      <p class="px-4 pb-1 pt-1 text-xs text-[#64748b]">研究项目</p>
      <div class="max-h-[30%] overflow-y-auto px-2 pb-2">
        <div v-for="project in visibleProjects" :key="project.id">
          <div
            :class="[
              'group flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-2 text-left text-sm transition-colors',
              currentProjectId === project.id ? 'bg-[#8f35b7]/15 text-white' : 'text-[#aab4c4] hover:bg-white/[0.05]',
            ]"
            @click="onProjectRowClick(project.id)"
            @contextmenu="openCtxMenu($event, { kind: 'project', id: project.id })"
          >
            <button
              class="shrink-0 text-[#64748b] hover:text-white"
              :title="expandedProjects.includes(project.id) ? '收起对话' : '展开对话'"
              @click.stop="toggleProjectExpand(project.id)"
            >
              <ChevronDown v-if="expandedProjects.includes(project.id)" :size="14" />
              <ChevronRight v-else :size="14" />
            </button>
            <button
              class="shrink-0 text-[#d292f4] hover:text-white"
              :title="expandedProjects.includes(project.id) ? '收起对话' : '展开对话'"
              @click.stop="toggleProjectExpand(project.id)"
            >
              <FolderOpen :size="14" />
            </button>
            <span class="min-w-0 flex-1 truncate">{{ project.name }}</span>
            <button
              class="hidden shrink-0 text-[#64748b] hover:text-white group-hover:block"
              title="更多操作"
              @click.stop="openCtxMenu($event, { kind: 'project', id: project.id })"
            >
              <MoreHorizontal :size="15" />
            </button>
          </div>
          <!-- 项目下的对话（仅已持久化的；草稿不显示） -->
          <div v-if="expandedProjects.includes(project.id)" class="mb-1">
            <button
              v-for="child in projectSessions(project.id)"
              :key="child.id"
              :class="[
                'group flex w-full items-center gap-2 rounded-md py-2 pl-8 pr-2 text-left text-sm transition-colors',
                child.id === activeId ? 'text-[#d292f4]' : 'text-[#94a3b8] hover:bg-white/[0.05] hover:text-white',
              ]"
              @click="openSession(child.id)"
              @contextmenu="openCtxMenu($event, { kind: 'session', id: child.id })"
            >
              <span
                v-if="sessionTaskState(child.id)"
                :class="['h-2 w-2 shrink-0 rounded-full', taskStateDotClass[sessionTaskState(child.id)!.state]]"
                :title="sessionTaskState(child.id)!.label"
              />
              <Pin v-if="child.pinned" :size="12" class="shrink-0 text-[#64748b]" />
              <span class="min-w-0 flex-1 truncate">{{ child.title }}</span>
              <span v-if="child.unread && child.id !== activeId" class="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff6b6b]" title="有新回复" />
              <span
                class="hidden shrink-0 text-[#64748b] hover:text-white group-hover:block"
                title="更多操作"
                @click.stop="openCtxMenu($event, { kind: 'session', id: child.id })"
              >
                <MoreHorizontal :size="14" />
              </span>
            </button>
            <p v-if="projectSessions(project.id).length === 0" class="py-1 pl-8 text-xs text-[#64748b]">暂无对话</p>
          </div>
        </div>
        <button
          v-if="projects.length > PROJECT_LIST_LIMIT"
          class="mt-1 w-full rounded-md px-3 py-1.5 text-left text-xs text-[#64748b] hover:bg-white/[0.05] hover:text-white"
          @click="projectListExpanded = !projectListExpanded"
        >
          {{ projectListExpanded ? '收起项目列表' : `展开其余 ${projects.length - PROJECT_LIST_LIMIT} 个项目` }}
        </button>
        <p v-if="projects.length === 0" class="px-3 py-3 text-xs text-[#64748b]">还没有研究项目</p>
      </div>

      <p class="border-t border-white/[0.06] px-4 pb-1 pt-3 text-xs text-[#64748b]">最近</p>
      <div class="flex-1 overflow-y-auto px-2 pb-3">
        <template v-for="group in recentGroups" :key="group.label">
          <p class="px-3 pb-1 pt-2 text-[11px] text-[#4b5563]">{{ group.label }}</p>
          <div
            v-for="session in group.items"
            :key="session.id"
            :class="[
              'group flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
              session.id === activeId ? 'bg-[#8f35b7]/15 text-white' : 'text-[#aab4c4] hover:bg-white/[0.05]',
            ]"
            @click="openSession(session.id)"
            @contextmenu="openCtxMenu($event, { kind: 'session', id: session.id })"
          >
            <span
              v-if="sessionTaskState(session.id)"
              :class="['mt-1 h-2 w-2 shrink-0 rounded-full', taskStateDotClass[sessionTaskState(session.id)!.state]]"
              :title="sessionTaskState(session.id)!.label"
            />
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-1.5">
                <Pin v-if="session.pinned" :size="12" class="shrink-0 text-[#64748b]" />
                <span class="truncate">{{ session.title }}</span>
                <span v-if="session.unread && session.id !== activeId" class="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff6b6b]" title="有新回复" />
              </span>
              <span class="block text-xs text-[#64748b]">{{ relativeTime(session.updatedAt) }}</span>
            </span>
            <button
              class="hidden shrink-0 text-[#64748b] hover:text-white group-hover:block"
              title="更多操作"
              @click.stop="openCtxMenu($event, { kind: 'session', id: session.id })"
            >
              <MoreHorizontal :size="15" />
            </button>
          </div>
        </template>
        <p v-if="recentSessions.length === 0" class="px-3 py-6 text-center text-xs text-[#64748b]">还没有对话记录</p>
      </div>
      </template>

      <!-- 搜索结果：跨全部会话匹配标题与消息内容 -->
      <template v-else>
        <p class="px-4 pb-1 pt-1 text-xs text-[#64748b]">搜索结果</p>
        <div class="flex-1 overflow-y-auto px-2 pb-3">
          <div
            v-for="item in searchResults"
            :key="item.session.id"
            :class="[
              'group flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
              item.session.id === activeId ? 'bg-[#8f35b7]/15 text-white' : 'text-[#aab4c4] hover:bg-white/[0.05]',
            ]"
            @click="openSession(item.session.id)"
          >
            <span
              v-if="sessionTaskState(item.session.id)"
              :class="['mt-1 h-2 w-2 shrink-0 rounded-full', taskStateDotClass[sessionTaskState(item.session.id)!.state]]"
              :title="sessionTaskState(item.session.id)!.label"
            />
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-1.5">
                <Pin v-if="item.session.pinned" :size="12" class="shrink-0 text-[#64748b]" />
                <span class="truncate">{{ item.session.title }}</span>
                <span v-if="item.session.unread && item.session.id !== activeId" class="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff6b6b]" title="有新回复" />
              </span>
              <span class="block truncate text-xs text-[#64748b]">
                {{ item.session.projectId ? `${projectName(item.session.projectId)} · ` : '' }}{{ item.snippet || relativeTime(item.session.updatedAt) }}
              </span>
            </span>
          </div>
          <p v-if="searchResults.length === 0" class="px-3 py-6 text-center text-xs text-[#64748b]">没有匹配的对话</p>
        </div>
      </template>
    </aside>

    <!-- 我的文件面板 -->
    <section v-if="filesOpen" class="flex w-[300px] shrink-0 flex-col border-r border-white/[0.06] bg-[#17181d] max-md:hidden">
      <header class="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <span class="text-sm font-semibold text-white">我的文件</span>
        <button class="text-[#64748b] hover:text-white" title="关闭" @click="filesOpen = false"><X :size="16" /></button>
      </header>
      <nav class="flex gap-1 border-b border-white/[0.06] p-2">
        <button :class="['file-tab', filesTab === 'wsi' && 'file-tab-active']" @click="filesTab = 'wsi'">WSI</button>
        <button :class="['file-tab', filesTab === 'case' && 'file-tab-active']" @click="filesTab = 'case'">Case</button>
        <button :class="['file-tab', filesTab === 'task' && 'file-tab-active']" @click="filesTab = 'task'">任务</button>
        <button :class="['file-tab', filesTab === 'project' && 'file-tab-active']" @click="filesTab = 'project'">项目</button>
      </nav>
      <div class="flex-1 overflow-y-auto p-2">
        <p class="px-2 py-2 text-xs text-[#64748b]">点条目挂为对话对象，点图标在新标签页查看。</p>
        <template v-if="filesTab === 'wsi'">
          <div
            v-for="item in wsis"
            :key="item.id"
            class="group flex cursor-pointer items-center gap-2 rounded-md px-2 py-2.5 hover:bg-white/[0.05]"
            @click="attachObject({ kind: 'wsi', id: item.id, label: item.fileName })"
          >
            <FileImage :size="16" class="shrink-0 text-[#d292f4]" />
            <span class="min-w-0 flex-1">
              <span class="block truncate font-mono text-xs text-white">{{ item.fileName }}</span>
              <span class="block text-xs text-[#64748b]">{{ item.stain }} · {{ item.boundCase === '未绑定' ? '未绑定 Case' : item.boundCase }}</span>
            </span>
            <button class="hidden shrink-0 text-[#64748b] hover:text-[#d292f4] group-hover:block" title="在新标签页查看" @click.stop="viewObjectInNewTab({ kind: 'wsi', id: item.id, label: item.fileName })">
              <ExternalLink :size="14" />
            </button>
          </div>
        </template>
        <template v-else-if="filesTab === 'case'">
          <div
            v-for="item in cases"
            :key="item.id"
            class="group flex cursor-pointer items-center gap-2 rounded-md px-2 py-2.5 hover:bg-white/[0.05]"
            @click="attachObject({ kind: 'case', id: item.id, label: item.id })"
          >
            <ClipboardList :size="16" class="shrink-0 text-[#d292f4]" />
            <span class="min-w-0 flex-1">
              <span class="block truncate font-mono text-xs text-white">{{ item.id }}</span>
              <span class="block text-xs text-[#64748b]">{{ item.diagnosis }} · {{ getPathologySiteLabel(item.site) }}</span>
            </span>
            <button class="hidden shrink-0 text-[#64748b] hover:text-[#d292f4] group-hover:block" title="在新标签页查看" @click.stop="viewObjectInNewTab({ kind: 'case', id: item.id, label: item.id })">
              <ExternalLink :size="14" />
            </button>
          </div>
        </template>
        <template v-else-if="filesTab === 'task'">
          <div
            v-for="item in tasks"
            :key="item.id"
            class="group flex cursor-pointer items-center gap-2 rounded-md px-2 py-2.5 hover:bg-white/[0.05]"
            @click="attachObject({ kind: 'task', id: item.id, label: item.taskName })"
          >
            <ListTodo :size="16" class="shrink-0 text-[#d292f4]" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-xs text-white">{{ item.taskName }}</span>
              <span class="block text-xs text-[#64748b]">{{ item.status }} · {{ item.objectCount }}</span>
            </span>
            <button class="hidden shrink-0 text-[#64748b] hover:text-[#d292f4] group-hover:block" title="在新标签页查看" @click.stop="viewObjectInNewTab({ kind: 'task', id: item.id, label: item.taskName })">
              <ExternalLink :size="14" />
            </button>
          </div>
          <p v-if="tasks.length === 0" class="px-2 py-6 text-center text-xs text-[#64748b]">还没有分析任务</p>
        </template>
        <template v-else>
          <div
            v-for="item in projects"
            :key="item.id"
            class="group flex cursor-pointer items-center gap-2 rounded-md px-2 py-2.5 hover:bg-white/[0.05]"
            @click="attachObject({ kind: 'project', id: item.id, label: item.name })"
          >
            <FolderOpen :size="16" class="shrink-0 text-[#d292f4]" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-xs text-white">{{ item.name }}</span>
              <span class="block text-xs text-[#64748b]">{{ item.tags.join(' · ') || '研究项目' }}</span>
            </span>
            <button class="hidden shrink-0 text-[#64748b] hover:text-[#d292f4] group-hover:block" title="在新标签页查看" @click.stop="viewObjectInNewTab({ kind: 'project', id: item.id, label: item.name })">
              <ExternalLink :size="14" />
            </button>
          </div>
        </template>
      </div>
    </section>

    <!-- 主区 -->
    <section class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-12 shrink-0 items-center gap-3 border-b border-white/[0.06] px-4">
        <button class="text-[#aab4c4] hover:text-white" title="功能侧栏" @click="sidebarOpen = !sidebarOpen">
          <PanelLeft :size="18" />
        </button>
        <span class="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-white">
          <Sparkles :size="15" class="shrink-0 text-[#d292f4]" />
          <span class="truncate">{{ activeSession?.title || (mainView === 'project-form' ? '新建研究项目' : '新对话') }}</span>
        </span>
        <span v-if="activeProject" class="shrink-0 rounded-full border border-[#8f35b7]/40 bg-[#8f35b7]/15 px-2.5 py-0.5 text-xs text-[#d292f4]">{{ activeProject.name }}</span>
        <button class="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm text-[#94a3b8] hover:bg-white/[0.06] hover:text-white" title="回到上一个页面" @click="exitChat">
          <ArrowLeft :size="16" />返回
        </button>
      </header>

      <!-- 新建研究项目表单 -->
      <div v-if="mainView === 'project-form' && !activeSession" class="flex-1 overflow-y-auto px-6 py-8">
        <div class="mx-auto max-w-[560px]">
          <h1 class="text-xl font-semibold text-white">新建研究项目</h1>
          <p class="mt-1 text-sm text-[#aab4c4]">创建后进入项目空间，发送第一条消息才会在项目下生成对话。</p>
          <form class="mt-6 grid gap-4" @submit.prevent="createProject">
            <label class="agent-field">
              <span>项目名称 <i class="required-mark">*</i></span>
              <input v-model="projectForm.name" placeholder="例如：胃癌 TME 队列研究" required />
            </label>
            <label class="agent-field">
              <span>项目说明</span>
              <textarea v-model="projectForm.description" rows="3" placeholder="研究目标、队列范围等" />
            </label>
            <label class="agent-field">
              <span>标签</span>
              <input v-model="projectForm.tags" placeholder="使用逗号分隔，如：TME, 胃癌" />
            </label>
            <label class="agent-field">
              <span>可见性</span>
              <select v-model="projectForm.visibility">
                <option value="private">私有</option>
                <option value="public">公开</option>
              </select>
            </label>
            <p v-if="projectError" class="text-sm text-[#ff9c9c]">{{ projectError }}</p>
            <div class="mt-2 flex justify-end gap-2">
              <button type="button" class="btn-ghost" @click="openNewChat">取消</button>
              <button type="submit" class="btn-primary">创建项目</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 空态 -->
      <div v-else-if="isEmpty" class="flex flex-1 flex-col items-center justify-center px-6">
        <span class="grid h-14 w-14 place-items-center rounded-2xl bg-[#8f35b7]/15 text-[#d292f4]">
          <Sparkles :size="26" />
        </span>
        <h1 class="mt-5 text-2xl font-semibold text-white">{{ activeProject ? `围绕「${activeProject.name}」提问` : '有什么想分析的？' }}</h1>
        <p class="mt-2 text-sm text-[#aab4c4]">{{ activeProject ? '发送第一条消息后，对话会保存在该项目下。' : '检索数据、解读结果、发起分析，都可以直接说。' }}</p>
        <div class="mt-8 grid w-full max-w-[640px] gap-3 sm:grid-cols-2">
          <button
            v-for="q in suggestions"
            :key="q"
            class="rounded-lg border border-white/[0.07] bg-[#202126] px-4 py-3 text-left text-sm text-[#aab4c4] transition-colors hover:border-[#8f35b7]/40 hover:text-white"
            @click="send(q)"
          >
            {{ q }}
          </button>
        </div>
      </div>

      <!-- 消息流 -->
      <div v-else ref="messageListEl" class="flex-1 overflow-y-auto px-6 py-6">
        <div class="mx-auto max-w-[760px] space-y-5">
          <div v-for="message in activeSession?.messages" :key="message.id" :class="message.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
            <!-- 用户消息 -->
            <div v-if="message.role === 'user'" class="group/msg max-w-[85%]">
              <div v-if="message.attachments?.length" class="mb-1.5 flex flex-wrap justify-end gap-1.5">
                <button
                  v-for="obj in message.attachments"
                  :key="`${obj.kind}-${obj.id}`"
                  class="inline-flex items-center gap-1 rounded-md border border-[#8f35b7]/40 bg-[#8f35b7]/15 px-2 py-0.5 text-xs text-[#d292f4] hover:text-white hover:underline"
                  :title="`在新标签页查看 ${obj.label}`"
                  @click="viewObjectInNewTab(obj)"
                >{{ attachKindLabel(obj.kind) }} · {{ obj.label }}</button>
              </div>
              <div class="whitespace-pre-wrap rounded-2xl bg-[#8f35b7]/25 px-4 py-3 text-sm leading-6 text-white">{{ message.text }}</div>
              <div class="mt-1 flex justify-end gap-1 opacity-0 transition-opacity group-hover/msg:opacity-100">
                <button class="msg-op" :title="copiedId === message.id ? '已复制' : '复制'" @click="copyMessage(message)">
                  <Check v-if="copiedId === message.id" :size="13" />
                  <Copy v-else :size="13" />
                </button>
                <button class="msg-op" title="编辑重发" @click="editMessage(message)"><Pencil :size="13" /></button>
              </div>
            </div>
            <!-- 助手消息 -->
            <div v-else class="group/msg max-w-[85%]">
              <!-- 思考过程（可折叠） -->
              <div v-if="message.thinking" class="mb-1.5">
                <button class="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#d292f4]" @click="toggleThinking(message.id)">
                  <ChevronDown v-if="expandedThinking.includes(message.id)" :size="13" />
                  <ChevronRight v-else :size="13" />
                  思考过程
                </button>
                <div v-if="expandedThinking.includes(message.id)" class="mt-1 whitespace-pre-wrap rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs leading-5 text-[#8a94a6]">{{ message.thinking }}</div>
              </div>
              <!-- renderLite 先转义内容再插入标记与链接，无注入风险 -->
              <!-- eslint-disable vue/no-v-html -->
              <div class="whitespace-pre-wrap rounded-2xl border border-white/[0.07] bg-[#202126] px-4 py-3 text-sm leading-6 text-[#d6dce6]"><span v-html="renderLite(message.text)"></span><span v-if="generationPhase === 'streaming' && message.id === lastMessageId" class="inline-block animate-pulse text-[#d292f4]">▍</span></div>
              <!-- eslint-enable vue/no-v-html -->
              <!-- 预览-确认闸门卡 -->
              <div v-if="proposalOf(message)" class="mt-2 rounded-xl border border-[#8f35b7]/30 bg-[#8f35b7]/[0.07] p-3.5">
                <p class="flex items-center gap-2 text-sm font-medium text-white">
                  <ListTodo :size="15" class="shrink-0 text-[#d292f4]" />分析计划 · {{ proposalOf(message)!.modelName }}
                </p>
                <ul class="mt-2 space-y-1">
                  <li v-for="obj in proposalOf(message)!.objects" :key="obj.id" class="truncate text-xs text-[#aab4c4]">· {{ obj.name }}</li>
                </ul>
                <div v-if="proposalOf(message)!.status === 'pending'" class="mt-3 flex gap-2">
                  <button class="rounded-lg bg-[#8f35b7] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#9f4cc6]" @click="confirmProposal(message)">确认执行</button>
                  <button class="rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs text-[#aab4c4] hover:text-white" @click="cancelProposal(message)">取消</button>
                </div>
                <p v-else-if="proposalOf(message)!.status === 'confirmed'" class="mt-3 flex items-center gap-1.5 text-xs text-[#95d94e]">
                  <CircleCheck :size="14" />已确认，任务已创建
                  <a v-if="proposalOf(message)!.taskId" :href="`#/workbench/run/${proposalOf(message)!.taskId}`" target="_blank" class="text-[#d292f4] underline underline-offset-2">查看任务</a>
                </p>
                <p v-else class="mt-3 flex items-center gap-1.5 text-xs text-[#64748b]"><CircleX :size="14" />已取消，未创建任务</p>
              </div>
              <!-- 任务结果回话卡 -->
              <div
                v-else-if="resultOf(message)"
                class="mt-2 rounded-xl border p-3.5"
                :class="resultOf(message)!.status === '分析完成' ? 'border-[#84cc16]/30 bg-[#84cc16]/[0.06]' : 'border-[#ff9c9c]/30 bg-[#ff9c9c]/[0.06]'"
              >
                <p class="flex items-center gap-2 text-sm font-medium text-white">
                  <CircleCheck v-if="resultOf(message)!.status === '分析完成'" :size="15" class="shrink-0 text-[#95d94e]" />
                  <CircleX v-else :size="15" class="shrink-0 text-[#ff9c9c]" />
                  {{ resultOf(message)!.taskName }}
                </p>
                <p class="mt-1.5 text-xs text-[#aab4c4]">{{ resultOf(message)!.objectCount }} · {{ resultOf(message)!.status }}</p>
                <a
                  :href="`#/workbench/run/${resultOf(message)!.taskId}`"
                  target="_blank"
                  class="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#8f35b7]/40 bg-[#8f35b7]/15 px-3 py-1.5 text-xs text-[#d292f4] hover:text-white"
                ><ExternalLink :size="13" />查看结果</a>
              </div>
              <!-- 交付产物（图/表/文件） -->
              <div v-if="message.artifacts?.length" class="mt-2 grid gap-2" :class="message.artifacts.some((a) => a.kind === 'image') ? 'sm:grid-cols-2' : ''">
                <template v-for="artifact in message.artifacts" :key="artifact.path">
                  <button
                    v-if="artifact.kind === 'image'"
                    class="overflow-hidden rounded-xl border border-white/[0.08] bg-[#17181d] text-left hover:border-[#8f35b7]/50"
                    :title="`${artifact.label}，点击预览`"
                    @click="previewImage = artifact"
                  >
                    <img :src="artifact.path" :alt="artifact.label" class="h-32 w-full object-cover object-top" loading="lazy" />
                    <span class="block px-3 py-2">
                      <span class="block truncate text-xs font-medium text-white">{{ artifact.label }}</span>
                      <span v-if="artifact.desc" class="block truncate text-xs text-[#64748b]">{{ artifact.desc }}</span>
                    </span>
                  </button>
                  <a
                    v-else
                    :href="artifact.path"
                    target="_blank"
                    class="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#17181d] px-3 py-2.5 hover:border-[#8f35b7]/50"
                  >
                    <FileSpreadsheet v-if="artifact.kind === 'table'" :size="16" class="shrink-0 text-[#d292f4]" />
                    <FileText v-else :size="16" class="shrink-0 text-[#d292f4]" />
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-xs font-medium text-white">{{ artifact.label }}</span>
                      <span v-if="artifact.desc" class="block truncate text-xs text-[#64748b]">{{ artifact.desc }}</span>
                    </span>
                    <ExternalLink :size="13" class="shrink-0 text-[#64748b]" />
                  </a>
                </template>
              </div>
              <div class="mt-1 flex gap-1 opacity-0 transition-opacity group-hover/msg:opacity-100">
                <button class="msg-op" :title="copiedId === message.id ? '已复制' : '复制'" @click="copyMessage(message)">
                  <Check v-if="copiedId === message.id" :size="13" />
                  <Copy v-else :size="13" />
                </button>
                <button class="msg-op" title="重新生成" :disabled="!!generationPhase" @click="regenerateMessage(message)"><RefreshCw :size="13" /></button>
              </div>
            </div>
          </div>
          <div v-if="generationPhase === 'thinking'" class="flex justify-start">
            <div class="rounded-2xl border border-white/[0.07] bg-[#202126] px-4 py-3 text-sm text-[#64748b]">正在思考…</div>
          </div>
        </div>
      </div>

      <!-- 输入区 -->
      <div v-if="mainView !== 'project-form'" class="shrink-0 px-6 pb-5" :class="isEmpty ? '' : 'pt-2'">
        <div class="mx-auto max-w-[760px]">
          <!-- STAD 项目空间：剧本快捷提问常驻输入框上方 -->
          <div v-if="currentProjectId === STAD_PROJECT_ID && !isEmpty" class="mb-2 flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="q in suggestions"
              :key="q"
              class="shrink-0 whitespace-nowrap rounded-full border border-[#8f35b7]/35 bg-[#8f35b7]/10 px-3 py-1.5 text-xs text-[#d292f4] transition-colors hover:border-[#8f35b7]/60 hover:text-white disabled:opacity-40"
              :disabled="!!generationPhase"
              @click="send(q)"
            >{{ q }}</button>
          </div>
          <!-- 草稿态：可选归属项目 -->
          <div v-if="!activeId" class="mb-2 flex items-center gap-2 px-1 text-xs text-[#64748b]">
            对话归属
            <button
              class="inline-flex items-center gap-1.5 rounded-md border border-white/[0.10] bg-[#17181d] px-2 py-1 text-xs text-[#aab4c4] hover:border-[#8f35b7]/50 hover:text-white"
              title="选择对话归属"
              @click="openPickerFromInput"
            >
              <FolderOpen :size="12" class="text-[#d292f4]" />{{ activeProject ? activeProject.name : '自由对话' }}
              <ChevronDown :size="12" />
            </button>
          </div>
          <div class="rounded-2xl border border-white/[0.10] bg-[#202126] p-2 focus-within:border-[#8f35b7]/50">
            <div v-if="attached.length" class="flex flex-wrap gap-2 px-2 pb-2">
              <span
                v-for="item in attached"
                :key="`${item.kind}-${item.id}`"
                class="inline-flex items-center gap-1.5 rounded-md border border-[#8f35b7]/40 bg-[#8f35b7]/15 px-2 py-1 text-xs text-[#d292f4]"
              >
                <button class="hover:text-white hover:underline" :title="`在新标签页查看 ${item.label}`" @click="viewObjectInNewTab(item)">
                  {{ attachKindLabel(item.kind) }} · {{ item.label }}
                </button>
                <button class="hover:text-white" title="移除" @click="detachObject(item)"><X :size="12" /></button>
              </span>
            </div>
            <div class="flex items-end gap-2">
              <textarea
                ref="inputEl"
                v-model="draft"
                rows="1"
                :placeholder="activeProject ? `就「${activeProject.name}」提问，Ctrl+Enter 发送` : '输入你的问题，Ctrl+Enter 发送'"
                class="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white placeholder:text-[#64748b] focus:outline-none"
                @keydown.ctrl.enter.prevent="send()"
                @keydown.meta.enter.prevent="send()"
              />
              <button
                v-if="generationPhase"
                class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#8f35b7] text-white"
                title="停止生成"
                @click="stopGeneration"
              >
                <Square :size="15" />
              </button>
              <button
                v-else
                class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#8f35b7] text-white transition-opacity disabled:opacity-40"
                :disabled="!draft.trim()"
                title="发送"
                @click="send()"
              >
                <ArrowUp :size="17" />
              </button>
            </div>
          </div>
          <p class="mt-2 text-center text-xs text-[#64748b]">回答基于平台真实数据生成，关键操作执行前需你确认</p>
        </div>
      </div>
    </section>

    <!-- 图片产物预览 -->
    <Teleport to="body">
      <div v-if="previewImage" class="fixed inset-0 z-[170] grid place-items-center bg-black/80 p-6 backdrop-blur-sm" @click.self="previewImage = null">
        <section class="max-h-[90dvh] max-w-5xl overflow-hidden rounded-xl border border-white/[0.12] bg-[#202126] shadow-2xl" role="dialog" aria-modal="true">
          <header class="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
            <span class="truncate text-sm text-white">{{ previewImage.label }}</span>
            <button class="icon-btn" title="关闭" @click="previewImage = null"><X :size="16" /></button>
          </header>
          <img :src="previewImage.path" :alt="previewImage.label" class="max-h-[78dvh] w-auto max-w-full object-contain" />
        </section>
      </div>
    </Teleport>

    <!-- 新建对话归属选择器（对齐 Codex：搜索 + 项目列表 + 新建项目/自由对话） -->
    <Teleport to="body">
      <div v-if="picker" class="fixed inset-0 z-[160]" @click="closePicker" @contextmenu.prevent="closePicker">
        <div
          class="absolute w-[264px] rounded-xl border border-white/[0.08] bg-[#1f2024] p-2 shadow-2xl"
          :style="{ left: `${picker.left}px`, ...(picker.top !== undefined ? { top: `${picker.top}px` } : { bottom: `${picker.bottom}px` }) }"
          @click.stop
        >
          <div class="mb-1 flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5">
            <Search :size="13" class="shrink-0 text-[#64748b]" />
            <input
              v-model="pickerQuery"
              v-focus-select
              type="text"
              placeholder="搜索项目"
              class="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-[#64748b] focus:outline-none"
              @keydown.esc="closePicker"
            />
          </div>
          <div class="max-h-[240px] overflow-y-auto">
            <button
              v-for="project in pickerFilteredProjects"
              :key="project.id"
              class="picker-item"
              @click="pickProjectScope(project.id)"
            >
              <FolderOpen :size="14" class="shrink-0 text-[#d292f4]" />
              <span class="min-w-0 flex-1 truncate">{{ project.name }}</span>
              <Check v-if="currentProjectId === project.id" :size="14" class="shrink-0 text-[#d292f4]" />
            </button>
            <p v-if="!pickerFilteredProjects.length" class="px-2 py-3 text-center text-xs text-[#64748b]">没有匹配的项目</p>
          </div>
          <div class="mt-1 border-t border-white/[0.07] pt-1">
            <button class="picker-item" @click="pickNewProject">
              <FolderPlus :size="14" class="shrink-0 text-[#64748b]" />
              <span class="min-w-0 flex-1 truncate">新建研究项目</span>
            </button>
            <button class="picker-item" @click="pickProjectScope(null)">
              <X :size="14" class="shrink-0 text-[#64748b]" />
              <span class="min-w-0 flex-1 truncate">自由对话（不属于项目）</span>
              <Check v-if="!currentProjectId" :size="14" class="shrink-0 text-[#d292f4]" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div v-if="ctxMenu" class="fixed inset-0 z-[160]" @click="closeCtxMenu" @contextmenu.prevent="closeCtxMenu">
        <div class="absolute w-[184px] rounded-lg border border-white/[0.08] bg-[#1f2024] p-1.5 shadow-2xl" :style="{ left: `${ctxMenu.x}px`, top: `${ctxMenu.y}px` }" @click.stop>
          <template v-if="ctxMenu.target.kind === 'project'">
            <button class="ctx-item" @click="ctxRename">重命名项目</button>
            <button class="ctx-item ctx-danger" @click="ctxDelete">删除项目</button>
          </template>
          <template v-else>
            <button class="ctx-item" @click="ctxTogglePin">{{ sessions.find((s) => s.id === ctxMenu!.target.id)?.pinned ? '取消置顶' : '置顶对话' }}</button>
            <button class="ctx-item" @click="ctxRename">重命名对话</button>
            <button v-if="sessions.find((s) => s.id === ctxMenu!.target.id)?.projectId" class="ctx-item" @click="ctxMoveOutOfProject">移出项目</button>
            <button v-else class="ctx-item" @click="ctxMoveToProject">移动到项目…</button>
            <button class="ctx-item ctx-danger" @click="ctxDelete">删除对话</button>
          </template>
        </div>
      </div>
    </Teleport>

    <!-- 重命名弹窗 -->
    <Teleport to="body">
      <div v-if="renameDialog" class="fixed inset-0 z-[150] grid place-items-center bg-black/70 px-4 backdrop-blur-sm" @click.self="closeRenameDialog">
        <section class="w-full max-w-[420px] rounded-lg border border-white/[0.12] bg-[#202126] shadow-2xl" role="dialog" aria-modal="true">
          <header class="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
            <h2 class="font-semibold text-white">{{ renameDialog.kind === 'project' ? '重命名项目' : '重命名对话' }}</h2>
            <button class="icon-btn" title="关闭" @click="closeRenameDialog"><X :size="17" /></button>
          </header>
          <form class="p-5" @submit.prevent="submitRename">
            <label class="agent-field">
              <span>名称 <i class="required-mark">*</i></span>
              <input
                v-focus-select
                :value="renameText"
                placeholder="请输入名称"
                required
                @input="renameText = ($event.target as HTMLInputElement).value"
              />
            </label>
            <div class="mt-5 flex justify-end gap-2">
              <button type="button" class="btn-ghost" @click="closeRenameDialog">取消</button>
              <button type="submit" class="btn-primary">保存</button>
            </div>
          </form>
        </section>
      </div>
    </Teleport>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <div v-if="deleteDialog" class="fixed inset-0 z-[150] grid place-items-center bg-black/70 px-4 backdrop-blur-sm" @click.self="deleteDialog = null">
        <section class="w-full max-w-[420px] rounded-lg border border-white/[0.12] bg-[#202126] shadow-2xl" role="dialog" aria-modal="true">
          <header class="border-b border-white/[0.08] px-5 py-4">
            <h2 class="font-semibold text-white">{{ deleteDialog.kind === 'project' ? '删除项目' : '删除对话' }}</h2>
          </header>
          <div class="px-5 py-4 text-sm leading-6 text-[#aab4c4]">
            <template v-if="deleteDialog.kind === 'project'">
              删除后项目将从「研究项目管理」中一并移除<template v-if="projectSessionCount(deleteDialog.id)">，项目下的 {{ projectSessionCount(deleteDialog.id) }} 条对话也将一并删除</template>，且不可恢复。确认删除吗？
            </template>
            <template v-else>删除后该对话不可恢复，确认删除吗？</template>
          </div>
          <div class="flex justify-end gap-2 border-t border-white/[0.08] px-5 py-4">
            <button class="btn-ghost" @click="deleteDialog = null">取消</button>
            <button class="rounded-lg bg-[#c43d4d] px-4 py-2 text-sm font-medium text-white hover:bg-[#d65060]" @click="confirmDelete">删除</button>
          </div>
        </section>
      </div>
    </Teleport>

    <!-- 移动到项目弹窗 -->
    <Teleport to="body">
      <div v-if="moveDialog" class="fixed inset-0 z-[150] grid place-items-center bg-black/70 px-4 backdrop-blur-sm" @click.self="moveDialog = null">
        <section class="w-full max-w-[420px] rounded-lg border border-white/[0.12] bg-[#202126] shadow-2xl" role="dialog" aria-modal="true">
          <header class="border-b border-white/[0.08] px-5 py-4">
            <h2 class="font-semibold text-white">移动到项目</h2>
          </header>
          <form class="p-5" @submit.prevent="submitMove">
            <label class="agent-field">
              <span>选择项目 <i class="required-mark">*</i></span>
              <select v-model="moveDialog.projectId" required>
                <option value="" disabled>请选择研究项目</option>
                <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option>
              </select>
            </label>
            <div class="mt-5 flex justify-end gap-2">
              <button type="button" class="btn-ghost" @click="moveDialog = null">取消</button>
              <button type="submit" class="btn-primary" :disabled="!moveDialog.projectId">移动</button>
            </div>
          </form>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.menu-item { display: flex; align-items: center; gap: 10px; border-radius: 8px; padding: 9px 12px; color: #aab4c4; font-size: 14px; text-align: left; }
.menu-item:hover { background: rgb(255 255 255 / 0.05); color: #fff; }
.menu-item-active { background: rgb(143 53 183 / 0.15); color: #fff; }
.file-tab { flex: 1; border-radius: 6px; padding: 6px 0; font-size: 13px; color: #94a3b8; }
.file-tab:hover { color: #fff; }
.file-tab-active { background: rgb(143 53 183 / 0.15); color: #d292f4; }
.agent-field { display: grid; gap: 6px; font-size: 13px; color: #aab4c4; }
.agent-field input, .agent-field textarea, .agent-field select { border-radius: 8px; border: 1px solid rgb(255 255 255 / 0.10); background: #17181d; padding: 9px 12px; font-size: 14px; color: #fff; outline: none; }
.agent-field input:focus, .agent-field textarea:focus, .agent-field select:focus { border-color: rgb(143 53 183 / 0.5); }
.required-mark { color: #ef4444; font-style: normal; }
.icon-btn { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 6px; color: #94a3b8; }
.icon-btn:hover { background: rgb(255 255 255 / 0.06); color: #fff; }
.ctx-item { display: block; width: 100%; border-radius: 6px; padding: 7px 10px; text-align: left; font-size: 13px; color: #aab4c4; }
.picker-item { display: flex; align-items: center; gap: 8px; width: 100%; border-radius: 6px; padding: 7px 10px; text-align: left; font-size: 13px; color: #aab4c4; }
.picker-item:hover { background: rgb(255 255 255 / 0.06); color: #fff; }
.ctx-item:hover { background: rgb(255 255 255 / 0.06); color: #fff; }
.ctx-danger { color: #f28b92; }
.msg-op { display: grid; width: 24px; height: 24px; place-items: center; border-radius: 6px; color: #64748b; }
.msg-op:hover { background: rgb(255 255 255 / 0.06); color: #fff; }
.msg-op:disabled { opacity: 0.4; }
.ctx-danger:hover { background: rgb(239 68 68 / 0.12); color: #f28b92; }
</style>
