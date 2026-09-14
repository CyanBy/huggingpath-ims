<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowUp, ChevronDown, ChevronRight, ClipboardList, ExternalLink, FileImage, Files, FolderOpen, FolderPlus, MessageSquarePlus, MoreHorizontal, PanelLeft, Sparkles, X } from '@lucide/vue'
import {
  appendAgentMessage,
  createAgentSession,
  deleteAgentSession,
  getAgentSession,
  listAgentSessions,
  renameAgentSession,
  updateAgentSessionProject,
  type AgentChatSession,
} from '@/lib/agentSessions'
import { readAnalysisTasks } from '@/lib/analysisTasks'
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

type AttachedObject = { kind: 'wsi' | 'case'; id: string; label: string }
type MainView = 'chat' | 'project-form'
type CtxTarget = { kind: 'project' | 'session'; id: string }

const sessions = ref<AgentChatSession[]>(listAgentSessions())
const projects = ref<WorkspaceProject[]>(readWorkspaceProjects())
const activeId = ref<string | null>(null)
/** 草稿态（未发送首条消息）的项目归属：null 表示自由对话 */
const draftProjectId = ref<string | null>(null)
const mainView = ref<MainView>('chat')
const expandedProjects = ref<string[]>([])
const draft = ref('')
const thinking = ref(false)
const sidebarOpen = ref(typeof window === 'undefined' ? true : window.innerWidth >= 768)
const filesOpen = ref(false)
const filesTab = ref<'wsi' | 'case'>('wsi')
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

const suggestions = [
  '比较这两个 Case 的 TME 特征差异',
  '这个项目里所有失败的分析是什么原因',
  '把这次分析结果整理成可以汇报的摘要',
  '帮我看看哪张切片还没跑过 TME 分析',
]

function refresh() {
  sessions.value = listAgentSessions()
  projects.value = readWorkspaceProjects()
}

function openSession(id: string) {
  const session = getAgentSession(id)
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
  const hash = item.kind === 'wsi' ? `/workbench/wsi?preview=${item.id}` : `/workbench/cases/${item.id}`
  window.open(`/#${hash}`, '_blank')
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
    // 删除项目：项目下的对话变为自由对话，项目实体从共享 store 移除
    sessions.value.filter((s) => s.projectId === id).forEach((s) => updateAgentSessionProject(s.id, undefined))
    writeWorkspaceProjects(readWorkspaceProjects().filter((p) => p.id !== id))
    if (currentProjectId.value === id) {
      draftProjectId.value = null
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

/** 模拟内核占位：只回答真实存在的统计数据，不编造能力。 */
function mockReply(question: string, objects: AttachedObject[]): string {
  const wsiCount = readWorkspaceWsis().length
  const caseCount = readWorkspaceCases().length
  const projectCount = readWorkspaceProjects().length
  const taskCount = readAnalysisTasks().length
  const parts: string[] = []
  if (activeProject.value) {
    parts.push(`当前在研究项目「**${activeProject.value.name}**」的对话框中，后续提问默认以该项目为范围。`)
  }
  if (objects.length) {
    parts.push(`本次问题关联了 **${objects.length}** 个对象：${objects.map((o) => `${o.kind === 'wsi' ? 'WSI' : 'Case'} ${o.label}`).join('、')}。`)
  }
  parts.push(`我收到了你的问题：「${question}」。`)
  parts.push(`我现在能看到的真实数据：**${caseCount}** 个 Case、**${wsiCount}** 张 WSI、**${projectCount}** 个研究项目、**${taskCount}** 个分析任务。`)
  parts.push('检索、解读与发起分析的对话能力正在逐步接入，每一次回答都会基于这些真实数据，不会编造。')
  return parts.join('\n\n')
}

async function send(text?: string) {
  const content = (text ?? draft.value).trim()
  if (!content || thinking.value) return
  // 草稿 → 首条消息时才创建会话（自由或归属当前项目空间）
  if (!activeId.value) {
    const session = createAgentSession(draftProjectId.value ?? undefined)
    refresh()
    activeId.value = session.id
    router.replace({ query: { session: session.id } })
  }
  const objects = [...attached.value]
  appendAgentMessage(activeId.value, 'user', content)
  draft.value = ''
  attached.value = []
  refresh()
  scrollToBottom()

  thinking.value = true
  await new Promise((resolve) => setTimeout(resolve, 700))
  appendAgentMessage(activeId.value!, 'assistant', mockReply(content, objects))
  thinking.value = false
  refresh()
  scrollToBottom()
}

/** 轻量 Markdown：转义后仅支持 **加粗**，后续扩展表格。 */
function renderLite(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
}

function scrollToBottom() {
  nextTick(() => {
    if (messageListEl.value) messageListEl.value.scrollTop = messageListEl.value.scrollHeight
  })
}

// 从工作台等入口带入对话对象（新建草稿并挂载）
watch(
  () => [route.query.attachKind, route.query.attachId, route.query.attachLabel],
  ([kind, id, label]) => {
    if (typeof id === 'string' && id && (kind === 'wsi' || kind === 'case')) {
      openNewChat()
      attachObject({ kind, id, label: typeof label === 'string' && label ? label : id })
      router.replace({ query: {} })
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

      <p class="px-4 pb-1 pt-1 text-xs text-[#64748b]">研究项目</p>
      <div class="max-h-[30%] overflow-y-auto px-2 pb-2">
        <div v-for="project in projects" :key="project.id">
          <div
            :class="[
              'group flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-2 text-left text-sm transition-colors',
              currentProjectId === project.id ? 'bg-[#8f35b7]/15 text-white' : 'text-[#aab4c4] hover:bg-white/[0.05]',
            ]"
            @click="openProject(project.id)"
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
              <span class="min-w-0 flex-1 truncate">{{ child.title }}</span>
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
        <p v-if="projects.length === 0" class="px-3 py-3 text-xs text-[#64748b]">还没有研究项目</p>
      </div>

      <p class="border-t border-white/[0.06] px-4 pb-1 pt-3 text-xs text-[#64748b]">最近</p>
      <div class="flex-1 overflow-y-auto px-2 pb-3">
        <div
          v-for="session in recentSessions"
          :key="session.id"
          :class="[
            'group flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
            session.id === activeId ? 'bg-[#8f35b7]/15 text-white' : 'text-[#aab4c4] hover:bg-white/[0.05]',
          ]"
          @click="openSession(session.id)"
          @contextmenu="openCtxMenu($event, { kind: 'session', id: session.id })"
        >
          <span class="min-w-0 flex-1">
            <span class="block truncate">{{ session.title }}</span>
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
        <p v-if="recentSessions.length === 0" class="px-3 py-6 text-center text-xs text-[#64748b]">还没有对话记录</p>
      </div>
    </aside>

    <!-- 我的文件面板 -->
    <section v-if="filesOpen" class="flex w-[300px] shrink-0 flex-col border-r border-white/[0.06] bg-[#17181d] max-md:hidden">
      <header class="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <span class="text-sm font-semibold text-white">我的文件</span>
        <button class="text-[#64748b] hover:text-white" title="关闭" @click="filesOpen = false"><X :size="16" /></button>
      </header>
      <nav class="flex gap-1 border-b border-white/[0.06] p-2">
        <button :class="['file-tab', filesTab === 'wsi' && 'file-tab-active']" @click="filesTab = 'wsi'">WSI（{{ wsis.length }}）</button>
        <button :class="['file-tab', filesTab === 'case' && 'file-tab-active']" @click="filesTab = 'case'">Case（{{ cases.length }}）</button>
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
        <template v-else>
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
            <div
              v-if="message.role === 'user'"
              class="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-[#8f35b7]/25 px-4 py-3 text-sm leading-6 text-white"
            >{{ message.text }}</div>
            <!-- renderLite 先转义用户内容再插入 <strong>，无注入风险 -->
            <!-- eslint-disable vue/no-v-html -->
            <div v-else
              class="max-w-[85%] whitespace-pre-wrap rounded-2xl border border-white/[0.07] bg-[#202126] px-4 py-3 text-sm leading-6 text-[#d6dce6]"
              v-html="renderLite(message.text)"
            ></div>
            <!-- eslint-enable vue/no-v-html -->
          </div>
          <div v-if="thinking" class="flex justify-start">
            <div class="rounded-2xl border border-white/[0.07] bg-[#202126] px-4 py-3 text-sm text-[#64748b]">正在思考…</div>
          </div>
        </div>
      </div>

      <!-- 输入区 -->
      <div v-if="mainView !== 'project-form'" class="shrink-0 px-6 pb-5" :class="isEmpty ? '' : 'pt-2'">
        <div class="mx-auto max-w-[760px]">
          <!-- 草稿态：可选归属项目 -->
          <div v-if="!activeId && projects.length" class="mb-2 flex items-center gap-2 px-1 text-xs text-[#64748b]">
            对话归属
            <select v-model="draftProjectId" class="rounded-md border border-white/[0.10] bg-[#17181d] px-2 py-1 text-xs text-[#aab4c4] outline-none focus:border-[#8f35b7]/50">
              <option :value="null">自由对话</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option>
            </select>
          </div>
          <div class="rounded-2xl border border-white/[0.10] bg-[#202126] p-2 focus-within:border-[#8f35b7]/50">
            <div v-if="attached.length" class="flex flex-wrap gap-2 px-2 pb-2">
              <span
                v-for="item in attached"
                :key="`${item.kind}-${item.id}`"
                class="inline-flex items-center gap-1.5 rounded-md border border-[#8f35b7]/40 bg-[#8f35b7]/15 px-2 py-1 text-xs text-[#d292f4]"
              >
                {{ item.kind === 'wsi' ? 'WSI' : 'Case' }} · {{ item.label }}
                <button class="hover:text-white" title="移除" @click="detachObject(item)"><X :size="12" /></button>
              </span>
            </div>
            <div class="flex items-end gap-2">
              <textarea
                v-model="draft"
                rows="1"
                :placeholder="activeProject ? `就「${activeProject.name}」提问，Ctrl+Enter 发送` : '输入你的问题，Ctrl+Enter 发送'"
                class="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white placeholder:text-[#64748b] focus:outline-none"
                @keydown.ctrl.enter.prevent="send()"
                @keydown.meta.enter.prevent="send()"
              />
              <button
                class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#8f35b7] text-white transition-opacity disabled:opacity-40"
                :disabled="!draft.trim() || thinking"
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

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div v-if="ctxMenu" class="fixed inset-0 z-[160]" @click="closeCtxMenu" @contextmenu.prevent="closeCtxMenu">
        <div class="absolute w-[184px] rounded-lg border border-white/[0.08] bg-[#1f2024] p-1.5 shadow-2xl" :style="{ left: `${ctxMenu.x}px`, top: `${ctxMenu.y}px` }" @click.stop>
          <template v-if="ctxMenu.target.kind === 'project'">
            <button class="ctx-item" @click="ctxRename">重命名项目</button>
            <button class="ctx-item ctx-danger" @click="ctxDelete">删除项目</button>
          </template>
          <template v-else>
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
              删除后项目将从「研究项目管理」中一并移除，项目下的对话会保留为自由对话。确认删除吗？
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
.ctx-item:hover { background: rgb(255 255 255 / 0.06); color: #fff; }
.ctx-danger { color: #f28b92; }
.ctx-danger:hover { background: rgb(239 68 68 / 0.12); color: #f28b92; }
</style>
