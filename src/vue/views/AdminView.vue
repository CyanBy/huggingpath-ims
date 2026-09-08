<script setup lang="ts">
import { computed, defineComponent, h, reactive, ref } from 'vue'
import { Building2, ChevronDown, ChevronRight, LayoutDashboard, Plus, Search, Settings, ShieldCheck, Users, X } from '@lucide/vue'
import {
  createDirectoryAccount,
  createDirectoryOrganization,
  createDirectoryRole,
  directoryPermissionGroups,
  hasDirectoryPermission,
  removeDirectoryAccount,
  removeDirectoryRole,
  removeUnusedDirectoryOrganization,
  reviewMembershipRequest,
  setDirectoryAccountStatus,
  setDirectoryOrganizationStatus,
  setDirectoryRoleStatus,
  updateDirectoryAccount,
  updateDirectoryOrganization,
  updateDirectoryRole,
  type AccountStatus,
  type DirectoryAccount,
  type DirectoryOrganization,
  type DirectoryRole,
  type Permission,
} from '@/lib/accountDirectory'
import { MODEL_CATALOG } from '@/lib/modelCatalog'
import { useDirectory } from '../composables/useDirectory'
import StatusSwitch from '../components/StatusSwitch.vue'

type Section = 'overview' | 'users' | 'roles' | 'organizations' | 'models' | 'settings'
const { directory, session, refresh } = useDirectory()
const section = ref<Section>('overview')
const systemExpanded = ref(false)
const settingsPage = ref<'basic' | 'smtp'>('basic')
const keyword = ref('')
const userOrganizationFilter = ref('')
const userRoleFilter = ref('')
const userStatusFilter = ref('')
const toast = ref('')
const userModal = ref(false)
const editingUserId = ref<string | null>(null)
const userForm = ref({ username: '', displayName: '', email: '', password: '', organizationId: '', roleId: 'role-standard-user', status: 'active' as AccountStatus })
const roleModal = ref(false)
const editingRoleId = ref<string | null>(null)
const roleForm = ref({ name: '', description: '', status: 'active' as AccountStatus, permissions: [] as Permission[] })
const orgModal = ref(false)
const editingOrgId = ref<string | null>(null)
const orgForm = ref({ name: '', code: '', type: '病理中心', quota: '1 TB', status: 'active' as AccountStatus })
const formError = ref('')
const modelStates = ref<Record<string, boolean>>(Object.fromEntries(MODEL_CATALOG.map((model) => [model.id, true])))
const cellvitName = MODEL_CATALOG.find((model) => model.id === 'ai4path/cellvit-v2')?.name || 'CellViT V2'
const tmeName = MODEL_CATALOG.find((model) => model.id === 'mod-tme')?.name || 'TME Analyzer'
const gpuRows = [
  { name: 'GPU 1', model: 'NVIDIA RTX 4090', usage: 72, memory: '17.4 / 24 GB', temperature: '63°C', runningTask: `${cellvitName} · TASK-20260520-001` },
  { name: 'GPU 2', model: 'NVIDIA RTX 4090', usage: 38, memory: '9.2 / 24 GB', temperature: '51°C', runningTask: `${tmeName} · TASK-20260520-004` },
]
const serviceRows = [
  { name: 'Redis', desc: '缓存 / 队列状态正常', metric: '内存 1.8 GB · 命中率 98.6%' },
  { name: 'PostgreSQL', desc: '业务数据库连接正常', metric: '连接 42 / 200' },
  { name: 'Object Storage', desc: 'WSI 文件存储可用', metric: '已用 8.6 TB / 20 TB' },
  { name: 'Inference Worker', desc: 'AI 推理 Worker 在线', metric: '在线 6 / 6' },
]
const basicSettings = reactive({ platformName: 'HuggingPath', language: '简体中文', guestRuns: 3, uploadLimit: 50, formats: '.svs, .sdpc, .tiff, .tif, DICOM', storageWarning: 85, allowRegistration: true })
const smtpSettings = reactive({ enabled: true, host: 'smtp.example.com', port: 465, encryption: 'SSL', senderEmail: 'noreply@huggingpath.com', senderName: 'HuggingPath', account: 'noreply@huggingpath.com', password: '', testRecipient: 'admin@example.com' })

const permissionLabels: Record<Permission, string> = {
  'workbench:use': '使用分析工作台', 'analysis:manage': '管理分析任务', 'projects:manage': '管理研究项目', 'wsi:manage': '管理 WSI 数据', 'cases:manage': '管理 Case 数据', 'workbench-models:manage': '配置机构模型', 'models:manage': '管理平台模型', 'users:manage': '管理用户与申请', 'roles:manage': '管理角色权限', 'organizations:manage': '管理机构配置', 'settings:manage': '管理系统设置',
}
const menu = computed(() => [
  { key: 'overview' as const, label: '总览', icon: LayoutDashboard, show: true },
  { key: 'users' as const, label: '用户管理', icon: Users, show: hasDirectoryPermission(session.value, 'users:manage') },
  { key: 'roles' as const, label: '角色管理', icon: ShieldCheck, show: hasDirectoryPermission(session.value, 'roles:manage') },
  { key: 'organizations' as const, label: '机构管理', icon: Building2, show: hasDirectoryPermission(session.value, 'organizations:manage') },
  { key: 'models' as const, label: '模型管理', icon: Settings, show: hasDirectoryPermission(session.value, 'models:manage') },
].filter((item) => item.show))
const filteredUsers = computed(() => directory.value.accounts.filter((item) => {
  const query = keyword.value.trim().toLowerCase()
  return (!query || `${item.username} ${item.displayName} ${item.email} ${orgName(item.organizationId)} ${roleName(item.roleId)}`.toLowerCase().includes(query))
    && (!userOrganizationFilter.value || (item.organizationId || 'personal') === userOrganizationFilter.value)
    && (!userRoleFilter.value || item.roleId === userRoleFilter.value)
    && (!userStatusFilter.value || item.status === userStatusFilter.value)
}))
const filteredRoles = computed(() => directory.value.roles.filter((item) => !keyword.value || `${item.name} ${item.description}`.toLowerCase().includes(keyword.value.toLowerCase())))
const filteredOrganizations = computed(() => directory.value.organizations.filter((item) => !keyword.value || `${item.name} ${item.code} ${item.type}`.toLowerCase().includes(keyword.value.toLowerCase())))
const pendingRequests = computed(() => directory.value.membershipRequests.filter((item) => item.status === 'pending'))
function notify(message: string) { toast.value = message; window.setTimeout(() => { toast.value = '' }, 5000) }
function roleName(id: string) { return directory.value.roles.find((item) => item.id === id)?.name || '未知角色' }
function orgName(id: string | null) { return id ? directory.value.organizations.find((item) => item.id === id)?.name || '机构已删除' : '个人账号' }
function handleResult(result: { ok: boolean; message?: string }, success: string) { if (!result.ok) { formError.value = result.message || '操作失败。'; return false } refresh(); notify(success); return true }

function openNewUser() { editingUserId.value = null; userForm.value = { username: '', displayName: '', email: '', password: '', organizationId: '', roleId: 'role-standard-user', status: 'active' }; formError.value = ''; userModal.value = true }
function openEditUser(item: DirectoryAccount) { editingUserId.value = item.id; userForm.value = { username: item.username, displayName: item.displayName, email: item.email, password: '', organizationId: item.organizationId || '', roleId: item.roleId, status: item.status }; formError.value = ''; userModal.value = true }
function saveUser() {
  formError.value = ''
  if (!userForm.value.displayName.trim()) return formError.value = '请输入展示名称。'
  if (editingUserId.value) { updateDirectoryAccount(editingUserId.value, { displayName: userForm.value.displayName, organizationId: userForm.value.organizationId || null, roleId: userForm.value.roleId, status: userForm.value.status }); refresh(); notify('用户资料、角色和机构关系已同步更新。'); userModal.value = false; return }
  if (!userForm.value.username || !userForm.value.email || userForm.value.password.length < 8) return formError.value = '请完整填写账号、邮箱和至少 8 位密码。'
  if (handleResult(createDirectoryAccount({ ...userForm.value, organizationId: userForm.value.organizationId || null }), '用户已创建。')) userModal.value = false
}
function toggleUser(item: DirectoryAccount, active: boolean) { const result = setDirectoryAccountStatus(item.id, active ? 'active' : 'disabled'); if (handleResult(result, active ? '用户已启用。' : '用户已停用。')) refresh() }
function deleteUser(item: DirectoryAccount) { if (!confirm(`确认删除用户“${item.displayName}”吗？`)) return; handleResult(removeDirectoryAccount(item.id), '用户已删除。') }

function openNewRole() { editingRoleId.value = null; roleForm.value = { name: '', description: '', status: 'active', permissions: [] }; formError.value = ''; roleModal.value = true }
function openEditRole(item: DirectoryRole) { editingRoleId.value = item.id; roleForm.value = { name: item.name, description: item.description, status: item.status, permissions: [...item.permissions] }; formError.value = ''; roleModal.value = true }
function togglePermission(permission: Permission) { roleForm.value.permissions = roleForm.value.permissions.includes(permission) ? roleForm.value.permissions.filter((item) => item !== permission) : [...roleForm.value.permissions, permission] }
function saveRole() { formError.value = ''; if (!roleForm.value.name.trim()) return formError.value = '请输入角色名称。'; const result = editingRoleId.value ? updateDirectoryRole(editingRoleId.value, roleForm.value) : createDirectoryRole(roleForm.value); if (handleResult(result, editingRoleId.value ? '角色已更新。' : '角色已创建。')) roleModal.value = false }
function toggleRole(item: DirectoryRole, active: boolean) { handleResult(setDirectoryRoleStatus(item.id, active ? 'active' : 'disabled'), active ? '角色已启用。' : '角色已停用。') }
function deleteRole(item: DirectoryRole) { if (!confirm(`确认删除角色“${item.name}”吗？`)) return; handleResult(removeDirectoryRole(item.id), '角色已删除。') }

function openNewOrg() { editingOrgId.value = null; orgForm.value = { name: '', code: '', type: '病理中心', quota: '1 TB', status: 'active' }; formError.value = ''; orgModal.value = true }
function openEditOrg(item: DirectoryOrganization) { editingOrgId.value = item.id; orgForm.value = { name: item.name, code: item.code, type: item.type, quota: item.quota, status: item.status }; formError.value = ''; orgModal.value = true }
function saveOrg() { formError.value = ''; if (!orgForm.value.name.trim() || !orgForm.value.code.trim()) return formError.value = '请输入机构名称和编码。'; const result = editingOrgId.value ? updateDirectoryOrganization(editingOrgId.value, orgForm.value) : createDirectoryOrganization(orgForm.value); if (handleResult(result, editingOrgId.value ? '机构已更新。' : '机构已创建。')) orgModal.value = false }
function toggleOrg(item: DirectoryOrganization, active: boolean) { handleResult(setDirectoryOrganizationStatus(item.id, active ? 'active' : 'disabled'), active ? '机构已启用。' : '机构已停用。') }
function deleteOrg(item: DirectoryOrganization) { if (!confirm(`确认删除机构“${item.name}”吗？`)) return; handleResult(removeUnusedDirectoryOrganization(item.id), '机构已删除。') }
function review(id: string, decision: 'approved' | 'rejected') { if (!session.value) return; handleResult(reviewMembershipRequest(id, session.value, decision), decision === 'approved' ? '加入申请已通过。' : '加入申请已拒绝。') }

const PageHeader = defineComponent({
  props: { title: String, desc: String, button: String },
  emits: ['add'],
  setup(props, { emit }) {
    return () => h('header', { class: 'mb-5 flex items-start justify-between gap-4' }, [
      h('div', [h('h2', { class: 'text-2xl font-semibold' }, props.title), h('p', { class: 'mt-1 text-sm' }, props.desc)]),
      h('button', { class: 'btn-primary', onClick: () => emit('add') }, [h(Plus, { size: 16 }), props.button]),
    ])
  },
})
const Toolbar = defineComponent({
  props: { modelValue: String, placeholder: String },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('label', { class: 'mb-3 flex h-10 items-center gap-2 rounded-md border border-white/[0.08] bg-[#17181d] px-3' }, [
      h(Search, { size: 16, class: 'text-[#64748b]' }),
      h('input', { value: props.modelValue, placeholder: props.placeholder, class: 'w-full bg-transparent text-sm outline-none', onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value) }),
    ])
  },
})
const DataTable = defineComponent({
  props: { headers: { type: Array as () => string[], required: true } },
  setup(props, { slots }) {
    return () => h('div', { class: 'overflow-x-auto rounded-lg border border-white/[0.08] bg-[#202126]' }, h('table', { class: 'w-full min-w-[980px] text-sm' }, [
      h('thead', { class: 'bg-[#252730]' }, h('tr', props.headers.map((header) => h('th', header)))),
      h('tbody', slots.default?.()),
    ]))
  },
})
const AdminModal = defineComponent({
  props: { title: String, wide: Boolean },
  emits: ['close', 'save'],
  setup(props, { slots, emit }) {
    return () => h('div', { class: 'fixed inset-0 z-[150] grid place-items-center bg-black/75 px-4', onClick: (event: MouseEvent) => { if (event.target === event.currentTarget) emit('close') } }, h('section', { class: `w-full ${props.wide ? 'max-w-[760px]' : 'max-w-[640px]'} max-h-[90dvh] overflow-y-auto rounded-lg border border-white/[0.10] bg-[#202126]` }, [
      h('header', { class: 'flex items-center justify-between border-b border-white/[0.08] p-5' }, [h('h2', { class: 'text-lg font-semibold' }, props.title), h('button', { class: 'text-[#94a3b8]', onClick: () => emit('close') }, h(X, { size: 19 }))]),
      h('div', { class: 'p-5' }, slots.default?.()),
      h('footer', { class: 'flex justify-end gap-2 border-t border-white/[0.08] p-4' }, [h('button', { class: 'btn-ghost', onClick: () => emit('close') }, '关闭'), h('button', { class: 'btn-primary', onClick: () => emit('save') }, '保存')]),
    ]))
  },
})
</script>

<template>
  <div class="grid min-h-[calc(100dvh-64px)] grid-cols-[220px_minmax(0,1fr)] bg-[#0f1014]">
    <aside class="border-r border-white/[0.07] bg-[#17181d] p-3"><div class="px-2 pb-5 pt-2"><h1 class="text-xl font-semibold">后台管理</h1><p class="text-xs">Admin Console</p></div><nav class="grid gap-1"><button v-for="item in menu" :key="item.key" :class="['admin-nav',section===item.key&&'active']" @click="section=item.key;keyword='' "><component :is="item.icon" :size="17" />{{ item.label }}</button><button v-if="hasDirectoryPermission(session,'settings:manage')" :class="['admin-nav',section==='settings'&&'active']" @click="systemExpanded=!systemExpanded"><Settings :size="17" />系统设置<ChevronDown v-if="systemExpanded" :size="15" class="ml-auto" /><ChevronRight v-else :size="15" class="ml-auto" /></button><div v-if="systemExpanded" class="ml-6 grid gap-1"><button :class="['sub-nav',section==='settings'&&settingsPage==='basic'&&'active']" @click="section='settings';settingsPage='basic'">基础设置</button><button :class="['sub-nav',section==='settings'&&settingsPage==='smtp'&&'active']" @click="section='settings';settingsPage='smtp'">SMTP 设置</button></div></nav><div class="mt-5 border-t border-white/[0.07] px-2 pt-4"><b class="block text-xs">{{ session?.account.displayName }}</b><small class="text-[#64748b]">{{ session?.role.name }} · {{ session?.organization?.name || '平台' }}</small></div></aside>
    <main class="min-w-0 p-5"><Teleport to="body"><div v-if="toast" class="fixed left-1/2 top-5 z-[200] -translate-x-1/2 rounded-md border border-[#2c6d5a] bg-[#16342c] px-5 py-3 text-sm text-[#8be2c0] shadow-2xl">{{ toast }}</div></Teleport>
      <template v-if="section==='overview'">
        <header class="mb-5">
          <h2 class="text-2xl font-semibold">后台总览</h2>
          <p class="mt-1 text-sm">用于查看平台资源规模、服务器资源、GPU 负载、核心服务状态和系统运行情况。</p>
        </header>

        <div class="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article v-for="item in [
            ['平台用户', directory.accounts.length, `${directory.accounts.filter(account => account.status === 'active').length} 个账号状态正常。`],
            ['机构', directory.organizations.length, '统一维护编码、成员和资源状态。'],
            ['角色', directory.roles.length, '系统角色与自定义权限模板。'],
            ['待审核申请', pendingRequests.length, '在机构管理中集中处理。'],
          ]" :key="String(item[0])" class="overview-card">
            <small>{{ item[0] }}</small>
            <strong>{{ item[1] }}</strong>
            <p>{{ item[2] }}</p>
          </article>
        </div>

        <div class="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article v-for="item in [
            ['CPU 型号', 'Intel Xeon Silver 4314', '16 Core / 32 Thread'],
            ['CPU 频率', '2.80 GHz', '当前平均频率，负载 46%。'],
            ['系统内存', '86 / 256 GB', '当前内存占用 33.6%。'],
            ['服务运行时间', '18d 06h', '最近一次重启：2026-05-02。'],
          ]" :key="String(item[0])" class="overview-card">
            <small>{{ item[0] }}</small>
            <strong class="text-xl">{{ item[1] }}</strong>
            <p>{{ item[2] }}</p>
          </article>
        </div>

        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.85fr)]">
          <section class="overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]">
            <header class="flex min-h-16 items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-3">
              <div><h3 class="font-semibold">GPU 资源占用</h3><p class="mt-1 text-xs">当前推理服务器 GPU 使用率、显存占用、温度与运行任务。</p></div>
              <span class="shrink-0 rounded-full border border-[#3f6212] bg-[#3f6212]/25 px-3 py-1 text-xs text-[#95d94e]">2 / 2 在线</span>
            </header>
            <div class="grid gap-3 p-4 lg:grid-cols-2">
              <article v-for="gpu in gpuRows" :key="gpu.name" class="rounded-lg border border-white/[0.08] bg-[#17181d] p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0"><b class="block text-sm">{{ gpu.name }} · {{ gpu.model }}</b><p class="mt-1 truncate text-xs">{{ gpu.runningTask }}</p></div>
                  <div class="shrink-0 text-right"><strong class="text-xl">{{ gpu.usage }}%</strong><small class="mt-1 block">GPU 使用率</small></div>
                </div>
                <div class="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div class="h-full rounded-full bg-[#8f35b7]" :style="{ width: `${gpu.usage}%` }" /></div>
                <div class="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div class="gpu-metric"><small>显存</small><b>{{ gpu.memory }}</b></div>
                  <div class="gpu-metric"><small>温度</small><b>{{ gpu.temperature }}</b></div>
                  <div class="gpu-metric"><small>状态</small><b class="text-[#95d94e]">运行中</b></div>
                </div>
              </article>
            </div>
          </section>

          <section class="overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]">
            <header class="min-h-16 border-b border-white/[0.06] px-5 py-3"><h3 class="font-semibold">核心服务状态</h3><p class="mt-1 text-xs">Redis、数据库、存储与推理 Worker 状态。</p></header>
            <div class="grid gap-2 p-4">
              <article v-for="service in serviceRows" :key="service.name" class="flex items-center justify-between gap-4 rounded-lg border border-white/[0.08] bg-[#17181d] p-3">
                <div><b class="text-sm">{{ service.name }}</b><p class="mt-1 text-xs">{{ service.desc }}</p><small class="mt-1 block text-[#94a3b8]">{{ service.metric }}</small></div>
                <span class="shrink-0 rounded-md border border-[#22c55e]/35 bg-[#22c55e]/10 px-2 py-1 text-xs text-[#6ee7a0]">正常</span>
              </article>
            </div>
          </section>
        </div>

        <section v-if="pendingRequests.length" class="mt-4 overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]"><header class="border-b border-white/[0.07] p-4 font-semibold">待处理加入申请</header><div v-for="request in pendingRequests" :key="request.id" class="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 text-sm"><div><b>{{ request.realName }}</b><span class="ml-3 text-[#64748b]">{{ orgName(request.organizationId) }} · {{ request.reason }}</span></div><div class="flex gap-3"><button class="text-[#6ee7a0]" @click="review(request.id,'approved')">通过</button><button class="text-[#ff9c9c]" @click="review(request.id,'rejected')">拒绝</button></div></div></section>
      </template>

      <template v-else-if="section==='users'">
        <PageHeader title="用户管理" desc="管理登录账号、机构归属和角色权限。" button="新增用户" @add="openNewUser" />
        <div class="mb-3 grid gap-2 rounded-lg border border-white/[0.08] bg-[#202126] p-2 md:grid-cols-[minmax(280px,1fr)_180px_180px_140px]">
          <label class="flex h-10 items-center gap-2 rounded-md border border-white/[0.08] bg-[#17181d] px-3"><Search :size="16" class="text-[#64748b]" /><input v-model="keyword" class="w-full bg-transparent text-sm outline-none" placeholder="搜索用户名、邮箱、机构或角色" /></label>
          <select v-model="userOrganizationFilter" class="input-field"><option value="">全部机构</option><option value="personal">个人账号</option><option v-for="item in directory.organizations" :key="item.id" :value="item.id">{{ item.name }}</option></select>
          <select v-model="userRoleFilter" class="input-field"><option value="">全部角色</option><option v-for="item in directory.roles" :key="item.id" :value="item.id">{{ item.name }}</option></select>
          <select v-model="userStatusFilter" class="input-field"><option value="">全部状态</option><option value="active">正常</option><option value="disabled">已停用</option></select>
        </div>
        <DataTable :headers="['用户','邮箱','机构','角色','状态','最近登录','操作']"><tr v-for="item in filteredUsers" :key="item.id"><td><b>{{ item.displayName }}</b><small>@{{ item.username }}</small></td><td>{{ item.email }}</td><td>{{ orgName(item.organizationId) }}</td><td>{{ roleName(item.roleId) }}</td><td><StatusSwitch :active="item.status==='active'" @change="toggleUser(item,$event)" /></td><td>{{ item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString() : '从未登录' }}</td><td><div class="actions"><button class="view" @click="openEditUser(item)">查看</button><button class="edit" @click="openEditUser(item)">编辑</button><button class="delete" @click="deleteUser(item)">删除</button></div></td></tr></DataTable>
      </template>
      <template v-else-if="section==='roles'"><PageHeader title="角色管理" desc="维护角色状态和完整权限范围。" button="新增角色" @add="openNewRole" /><Toolbar v-model="keyword" placeholder="搜索角色名称或说明" /><DataTable :headers="['角色','类型','成员','权限数','状态','更新时间','操作']"><tr v-for="item in filteredRoles" :key="item.id"><td><b>{{ item.name }}</b><small>{{ item.description }}</small></td><td>{{ item.type==='system'?'系统内置':'自定义' }}</td><td>{{ directory.accounts.filter(account=>account.roleId===item.id).length }}</td><td>{{ item.permissions.length }}</td><td><StatusSwitch :active="item.status==='active'" @change="toggleRole(item,$event)" /></td><td>{{ new Date(item.updatedAt).toLocaleDateString() }}</td><td><div class="actions"><button class="view" @click="openEditRole(item)">查看</button><button v-if="item.type==='custom'" class="edit" @click="openEditRole(item)">编辑</button><button v-if="item.type==='custom'" class="delete" @click="deleteRole(item)">删除</button></div></td></tr></DataTable></template>
      <template v-else-if="section==='organizations'">
        <PageHeader title="机构管理" desc="统一维护机构编码、成员申请、资源规模和启用状态。" button="新增机构" @add="openNewOrg" />
        <section class="mb-4 overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]"><header class="flex items-center justify-between border-b border-white/[0.07] px-4 py-3"><b class="text-sm">待处理加入申请</b><span class="rounded border border-[#8f35b7]/35 bg-[#8f35b7]/12 px-2 py-1 text-xs text-[#d292f4]">{{ pendingRequests.length }}</span></header><div v-if="!pendingRequests.length" class="grid min-h-16 place-items-center text-sm text-[#64748b]">当前没有待审核申请</div><div v-for="request in pendingRequests" :key="request.id" class="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3 text-sm"><div><b>{{ request.realName }}</b><span class="ml-3 text-[#64748b]">{{ orgName(request.organizationId) }} · {{ request.reason }}</span></div><div class="flex gap-3"><button class="text-[#6ee7a0]" @click="review(request.id,'approved')">通过</button><button class="text-[#ff9c9c]" @click="review(request.id,'rejected')">拒绝</button></div></div></section>
        <Toolbar v-model="keyword" placeholder="搜索机构名称、编码或类型" />
        <DataTable :headers="['机构','编码','成员','Case / WSI','存储配额','状态','操作']"><tr v-for="item in filteredOrganizations" :key="item.id"><td><b>{{ item.name }}</b><small>{{ item.type }}</small></td><td><code>{{ item.code }}</code></td><td>{{ directory.accounts.filter(account=>account.organizationId===item.id).length }}</td><td>{{ item.caseCount }} / {{ item.wsiCount }}</td><td>{{ item.quota }}</td><td><StatusSwitch :active="item.status==='active'" @change="toggleOrg(item,$event)" /></td><td><div class="actions"><button class="view" @click="openEditOrg(item)">查看</button><button class="edit" @click="openEditOrg(item)">编辑</button><button class="delete" @click="deleteOrg(item)">删除</button></div></td></tr></DataTable>
      </template>
      <template v-else-if="section==='models'"><header class="mb-5"><h2 class="text-2xl font-semibold">模型管理</h2><p class="mt-1 text-sm">管理平台模型的可见性和运行状态。</p></header><div class="overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]"><table class="w-full text-sm"><thead class="bg-[#252730]"><tr><th>模型</th><th>模型 ID</th><th>说明</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="model in MODEL_CATALOG" :key="model.id"><td><b>{{ model.name }}</b></td><td><code>{{ model.id }}</code></td><td>{{ model.summary }}</td><td><StatusSwitch :active="modelStates[model.id]" @change="modelStates[model.id]=$event;notify($event?'模型已启用。':'模型已停用。')" /></td><td><div class="actions"><button class="view">查看</button><button class="edit">编辑</button><button class="delete">删除</button></div></td></tr></tbody></table></div></template>
      <template v-else>
        <template v-if="settingsPage==='basic'">
          <header class="mb-5"><h2 class="text-2xl font-semibold">基础设置</h2><p class="mt-1 text-sm">配置平台通用规则，包括游客分析次数、上传限制、支持格式和存储预警。</p></header>
          <div class="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><article v-for="item in [['游客分析次数',`${basicSettings.guestRuns} 次`],['单次上传上限',`${basicSettings.uploadLimit} GB`],['存储预警阈值',`${basicSettings.storageWarning}%`],['账号注册',basicSettings.allowRegistration?'开放':'关闭']]" :key="item[0]" class="overview-card"><small>{{ item[0] }}</small><strong class="text-xl">{{ item[1] }}</strong></article></div>
          <section class="max-w-[900px] rounded-lg border border-white/[0.08] bg-[#202126] p-5"><div class="grid gap-4 sm:grid-cols-2"><label class="field">平台名称<input v-model="basicSettings.platformName" /></label><label class="field">默认语言<select v-model="basicSettings.language"><option>简体中文</option><option>English</option></select></label><label class="field">游客分析次数<input v-model="basicSettings.guestRuns" type="number" min="0" /></label><label class="field">单次上传上限（GB）<input v-model="basicSettings.uploadLimit" type="number" min="1" /></label><label class="field sm:col-span-2">支持文件格式<input v-model="basicSettings.formats" /></label><label class="field">存储预警阈值（%）<input v-model="basicSettings.storageWarning" type="number" min="1" max="100" /></label><label class="field">允许用户自主注册<span class="flex h-10 items-center"><StatusSwitch :active="basicSettings.allowRegistration" @change="basicSettings.allowRegistration=$event" /></span></label></div><div class="mt-5 flex justify-end border-t border-white/[0.07] pt-4"><button class="btn-primary" @click="notify('基础设置已保存。')">保存基础设置</button></div></section>
        </template>
        <template v-else>
          <header class="mb-5"><h2 class="text-2xl font-semibold">SMTP 设置</h2><p class="mt-1 text-sm">配置平台级邮件服务，用于账号通知、任务状态和系统告警。</p></header>
          <div class="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><article v-for="item in [['SMTP 状态',smtpSettings.enabled?'开启':'关闭'],['邮件服务器',smtpSettings.host],['加密方式',smtpSettings.encryption],['发件邮箱',smtpSettings.senderEmail]]" :key="item[0]" class="overview-card"><small>{{ item[0] }}</small><strong class="text-base">{{ item[1] }}</strong></article></div>
          <section class="max-w-[980px] rounded-lg border border-white/[0.08] bg-[#202126] p-5"><div class="grid gap-4 sm:grid-cols-2"><label class="field">SMTP 服务状态<span class="flex h-10 items-center"><StatusSwitch :active="smtpSettings.enabled" @change="smtpSettings.enabled=$event" /></span></label><label class="field">加密方式<select v-model="smtpSettings.encryption"><option>SSL</option><option>TLS</option><option>None</option></select></label><label class="field">SMTP Host<input v-model="smtpSettings.host" /></label><label class="field">SMTP Port<input v-model="smtpSettings.port" type="number" /></label><label class="field">发件邮箱<input v-model="smtpSettings.senderEmail" type="email" /></label><label class="field">发件人名称<input v-model="smtpSettings.senderName" /></label><label class="field">认证账号<input v-model="smtpSettings.account" /></label><label class="field">认证密码<input v-model="smtpSettings.password" type="password" placeholder="请输入 SMTP 授权码或密码" /></label><label class="field sm:col-span-2">测试收件人<input v-model="smtpSettings.testRecipient" type="email" /></label></div><div class="mt-5 flex justify-end gap-2 border-t border-white/[0.07] pt-4"><button class="btn-secondary" @click="notify('测试邮件已模拟发送。')">发送测试邮件</button><button class="btn-primary" @click="notify('SMTP 设置已保存。')">保存 SMTP 设置</button></div></section>
        </template>
      </template>
    </main>

    <AdminModal v-if="userModal" :title="editingUserId?'编辑用户':'新增用户'" @close="userModal=false" @save="saveUser"><div class="grid gap-4 sm:grid-cols-2"><label class="field"><span>用户名 <i class="required-mark">*</i></span><input v-model="userForm.username" required :readonly="!!editingUserId" /></label><label class="field"><span>展示名称 <i class="required-mark">*</i></span><input v-model="userForm.displayName" required /></label><label class="field"><span>邮箱 <i class="required-mark">*</i></span><input v-model="userForm.email" required type="email" :readonly="!!editingUserId" /></label><label v-if="!editingUserId" class="field"><span>初始密码 <i class="required-mark">*</i></span><input v-model="userForm.password" required type="password" /></label><label class="field">机构<select v-model="userForm.organizationId"><option value="">个人账号</option><option v-for="item in directory.organizations" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label class="field"><span>角色 <i class="required-mark">*</i></span><select v-model="userForm.roleId" required><option v-for="item in directory.roles" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label class="field">状态<select v-model="userForm.status"><option value="active">启用</option><option value="disabled">停用</option></select></label><p v-if="formError" class="sm:col-span-2 text-sm text-[#ff9c9c]">{{ formError }}</p></div></AdminModal>
    <AdminModal v-if="roleModal" :title="editingRoleId?'编辑角色':'新增角色'" wide @close="roleModal=false" @save="saveRole"><div class="grid gap-4 sm:grid-cols-2"><label class="field"><span>角色名称 <i class="required-mark">*</i></span><input v-model="roleForm.name" required :readonly="!!editingRoleId&&directory.roles.find(item=>item.id===editingRoleId)?.type==='system'" /></label><label class="field">状态<select v-model="roleForm.status"><option value="active">启用</option><option value="disabled">停用</option></select></label><label class="field sm:col-span-2">角色说明<textarea v-model="roleForm.description" /></label><div class="sm:col-span-2"><span class="mb-2 block text-sm font-medium">权限范围</span><div class="grid gap-3"><section v-for="group in directoryPermissionGroups" :key="group.label" class="rounded-md border border-white/[0.08] bg-[#17181d] p-3"><small class="text-[#64748b]">{{ group.label }}</small><div class="mt-2 grid gap-2 sm:grid-cols-2"><label v-for="permission in group.values" :key="permission" :class="['permission',roleForm.permissions.includes(permission)&&'active']"><input type="checkbox" :checked="roleForm.permissions.includes(permission)" :disabled="!!editingRoleId&&directory.roles.find(item=>item.id===editingRoleId)?.type==='system'" @change="togglePermission(permission)" />{{ permissionLabels[permission] }}</label></div></section></div></div><p v-if="formError" class="sm:col-span-2 text-sm text-[#ff9c9c]">{{ formError }}</p></div></AdminModal>
    <AdminModal v-if="orgModal" :title="editingOrgId?'编辑机构':'新增机构'" @close="orgModal=false" @save="saveOrg"><div class="grid gap-4 sm:grid-cols-2"><label class="field"><span>机构名称 <i class="required-mark">*</i></span><input v-model="orgForm.name" required /></label><label class="field"><span>机构编码 <i class="required-mark">*</i></span><input v-model="orgForm.code" required /></label><label class="field">机构类型<input v-model="orgForm.type" /></label><label class="field">存储配额<input v-model="orgForm.quota" /></label><label class="field">状态<select v-model="orgForm.status"><option value="active">启用</option><option value="disabled">停用</option></select></label><p v-if="formError" class="sm:col-span-2 text-sm text-[#ff9c9c]">{{ formError }}</p></div></AdminModal>
  </div>
</template>

<style scoped>
.admin-nav{display:flex;height:40px;align-items:center;gap:10px;border-radius:6px;padding:0 10px;color:#94a3b8;font-size:14px}.admin-nav:hover{background:rgb(255 255 255 / .04);color:#e2e8f0}.admin-nav.active{background:rgb(143 53 183 / .25);color:#e6b4f5}.sub-nav{height:32px;border-radius:5px;padding:0 9px;text-align:left;color:#748095;font-size:12px}.sub-nav:hover,.sub-nav.active{background:rgb(143 53 183 / .14);color:#d292f4}th,td{padding:12px 14px;text-align:left;border-top:1px solid rgb(255 255 255 / .06)}thead th{border:0;color:#cbd5e1;font-weight:600}td small{display:block;margin-top:3px;color:#64748b;font-size:11px}.actions{display:flex;gap:12px;white-space:nowrap}.actions button{font-size:12px}.actions .view{color:#7dd3fc}.actions .edit{color:#d292f4}.actions .delete{color:#ff9c9c}.field{display:grid;gap:7px;color:#cbd5e1;font-size:13px}.field input,.field select,.field textarea{border:1px solid rgb(255 255 255 / .08);border-radius:6px;background:#17181d;padding:9px 10px;color:#e2e8f0;outline:none}.field textarea{min-height:74px;resize:vertical}.permission{display:flex;align-items:center;gap:8px;border:1px solid rgb(255 255 255 / .07);border-radius:6px;padding:9px 10px;color:#94a3b8;font-size:13px}.permission.active{border-color:rgb(143 53 183 / .55);background:rgb(143 53 183 / .13);color:#d292f4}
.overview-card{min-height:128px;border:1px solid rgb(255 255 255 / .08);border-radius:8px;background:#202126;padding:16px}.overview-card small{display:block;color:#64748b;font-size:13px}.overview-card strong{display:block;margin-top:9px;color:#f1f3f6;font-size:26px;line-height:1.2}.overview-card p{margin-top:8px;color:#64748b;font-size:12px}.gpu-metric{min-width:0;border:1px solid rgb(255 255 255 / .06);border-radius:6px;background:#202126;padding:9px}.gpu-metric small,.gpu-metric b{display:block}.gpu-metric small{margin-bottom:4px;color:#64748b}.gpu-metric b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e2e8f0}
</style>
