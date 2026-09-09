<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Check, ChevronDown, CircleAlert, CloudUpload, Download, LogOut, Menu, Package, Plug, Search, ShieldCheck, UserCircle, X } from '@lucide/vue'
import { canAccessAdmin, hasDirectoryPermission, signOut, type Permission } from '@/lib/accountDirectory'
import { useDirectory } from '../composables/useDirectory'
import { useUploadTransfers } from '../composables/useUploadTransfers'
import AppLogo from './AppLogo.vue'
import TransferQuickPopover from './TransferQuickPopover.vue'

const route = useRoute()
const router = useRouter()
const { session } = useDirectory()
const scrolled = ref(false)
const mobileOpen = ref(false)
const userMenuOpen = ref(false)
const uploadToolOpen = ref(false)
const transferCenterOpen = ref(false)
const { pendingCount, failedCount, canceledCount, allComplete } = useUploadTransfers()
const transferExceptionCount = computed(() => failedCount.value + canceledCount.value)

const workbenchLinks: { label: string; path: string; permission: Permission }[] = [
  { label: 'WSI 管理', path: '/workbench/wsi', permission: 'wsi:manage' },
  { label: 'Case 管理', path: '/workbench/cases', permission: 'cases:manage' },
  { label: '研究项目管理', path: '/workbench/projects', permission: 'projects:manage' },
  { label: '分析任务', path: '/workbench/tasks', permission: 'analysis:manage' },
  { label: '传输队列', path: '/workbench/transfers', permission: 'wsi:manage' },
]

const visibleWorkbenchLinks = computed(() => workbenchLinks.filter((item) => hasDirectoryPermission(session.value, item.permission)))
const workbenchActive = computed(() => route.path.startsWith('/workbench'))
const adminActive = computed(() => route.path.startsWith('/admin'))

const handleScroll = () => { scrolled.value = window.scrollY > 80 }
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  mobileOpen.value = false
  userMenuOpen.value = false
  uploadToolOpen.value = false
  transferCenterOpen.value = false
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handleKeydown)
})
watch(() => route.fullPath, () => {
  mobileOpen.value = false
  userMenuOpen.value = false
  transferCenterOpen.value = false
})

function goLogin() {
  router.push({ name: 'login', query: { redirect: route.fullPath } })
}

function logout() {
  signOut()
  userMenuOpen.value = false
  router.push('/home')
}

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <header :class="['fixed inset-x-0 top-0 z-50 h-16 transition-all duration-300', scrolled ? 'border-b border-white/[0.06] bg-[#1f2024]/90 backdrop-blur-xl' : 'bg-[#0f1014]/92 backdrop-blur-md']">
    <div class="section-container flex h-full items-center justify-between">
      <RouterLink to="/home" class="flex shrink-0 items-center gap-2">
        <AppLogo :size="32" /><span class="hidden text-lg font-semibold text-[#e2e8f0] sm:block">HuggingPath</span>
      </RouterLink>

      <nav class="hidden items-center gap-1 lg:flex">
        <RouterLink to="/explore" :class="['nav-link', isActive('/explore') || isActive('/model') ? 'nav-active' : '']">模型中心</RouterLink>
        <div v-if="visibleWorkbenchLinks.length" class="group relative">
          <button :class="['nav-link inline-flex items-center gap-1', workbenchActive ? 'nav-active' : '']">工作台 <ChevronDown :size="14" /></button>
          <div class="absolute left-0 top-full hidden pt-2 group-hover:block">
            <div class="w-[156px] rounded-lg border border-white/[0.08] bg-[#1f2024] p-1.5 shadow-2xl">
              <RouterLink v-for="item in visibleWorkbenchLinks" :key="item.path" :to="item.path" :class="['block rounded-md px-3 py-2 text-sm', isActive(item.path) ? 'bg-[#8f35b7]/25 text-[#e2e8f0]' : 'text-[#94a3b8] hover:bg-white/[0.06] hover:text-white']">{{ item.label }}</RouterLink>
            </div>
          </div>
        </div>
        <RouterLink to="/datasets" :class="['nav-link', isActive('/datasets') ? 'nav-active' : '']">项目广场</RouterLink>
        <RouterLink to="/about" :class="['nav-link', isActive('/about') ? 'nav-active' : '']">关于</RouterLink>
      </nav>

      <div class="flex items-center gap-2 sm:gap-3">
        <label class="relative hidden md:block">
          <Search :size="16" class="pointer-events-none absolute left-3 top-3 text-[#64748b]" />
          <input class="input-field h-10 w-[280px] pl-9" placeholder="搜索模型、研究项目..." />
        </label>
        <button class="icon-button" title="上传工具下载" @click="uploadToolOpen = true"><Plug :size="20" /></button>
        <div class="relative">
          <button :class="['icon-button relative',transferCenterOpen&&'bg-white/[0.06] text-white']" title="传输任务" aria-label="快速查看传输任务" @click="transferCenterOpen=!transferCenterOpen;userMenuOpen=false">
            <CloudUpload :size="20" />
            <span v-if="pendingCount" class="transfer-count">{{ pendingCount > 99 ? '99+' : pendingCount }}</span>
            <span v-else-if="transferExceptionCount" class="transfer-failed"><CircleAlert :size="9" :stroke-width="3" /></span>
            <span v-else-if="allComplete" class="transfer-complete"><Check :size="9" :stroke-width="3" /></span>
          </button>
        </div>
        <button v-if="!session" class="h-9 rounded-lg bg-[#8f35b7] px-4 text-sm font-medium text-white hover:bg-[#a64ed0]" @click="goLogin">登录</button>
        <div v-else class="relative">
          <button class="grid h-9 w-9 place-items-center rounded-full border border-[#8f35b7]/40 bg-[#8f35b7]/20 text-[#d292f4]" title="用户菜单" @click="userMenuOpen = !userMenuOpen"><UserCircle :size="22" /></button>
          <div v-if="userMenuOpen" class="absolute right-0 top-11 z-50 w-[196px] rounded-lg border border-white/[0.08] bg-[#1f2024] p-1.5 shadow-2xl">
            <div class="mb-1 border-b border-white/[0.06] px-3 py-2">
              <div class="truncate text-sm font-medium text-[#e2e8f0]">{{ session.account.displayName }}</div>
              <div class="truncate text-xs text-[#64748b]">{{ session.account.email }}</div>
            </div>
            <RouterLink to="/user-center" class="menu-button"><UserCircle :size="15" />个人资料</RouterLink>
            <button class="menu-button text-[#f28b92]" @click="logout"><LogOut :size="15" />退出登录</button>
          </div>
        </div>
        <RouterLink v-if="canAccessAdmin(session)" to="/admin" :class="['hidden h-9 items-center gap-2 rounded-lg border px-3 text-sm sm:inline-flex', adminActive ? 'border-[#8f35b7]/60 bg-[#8f35b7]/20 text-[#d292f4]' : 'border-white/[0.10] text-[#94a3b8] hover:text-white']"><ShieldCheck :size="16" />后台管理</RouterLink>
        <button class="icon-button nav-menu-trigger" aria-label="展开导航" @click="mobileOpen = !mobileOpen"><X v-if="mobileOpen" :size="20" /><Menu v-else :size="20" /></button>
      </div>
    </div>

    <div v-if="mobileOpen" class="border-b border-white/[0.06] bg-[#1f2024] p-4 lg:hidden">
      <div class="section-container grid gap-1">
        <RouterLink to="/explore" class="mobile-link">模型中心</RouterLink>
        <RouterLink v-for="item in visibleWorkbenchLinks" :key="item.path" :to="item.path" class="mobile-link">{{ item.label }}</RouterLink>
        <RouterLink to="/datasets" class="mobile-link">项目广场</RouterLink>
        <RouterLink to="/about" class="mobile-link">关于</RouterLink>
      </div>
    </div>
  </header>

  <Teleport to="body">
    <div v-if="uploadToolOpen" class="fixed inset-0 z-[140] grid place-items-center bg-black/70 px-4 backdrop-blur-sm" @click.self="uploadToolOpen = false">
      <section class="w-full max-w-[460px] overflow-hidden rounded-lg border border-white/[0.12] bg-[#202126] shadow-2xl" role="dialog" aria-modal="true">
        <header class="flex h-16 items-center justify-between border-b border-white/[0.08] px-5">
          <div class="flex items-center gap-3"><span class="grid h-9 w-9 place-items-center rounded-lg bg-[#8f35b7]/15 text-[#d292f4]"><Plug :size="19" /></span><div><h2 class="font-semibold">上传工具下载</h2><p class="text-xs">HuggingPath 本地辅助工具</p></div></div>
          <button class="icon-button" aria-label="关闭" @click="uploadToolOpen = false"><X :size="18" /></button>
        </header>
        <div class="p-5">
          <div class="mb-5 flex items-center gap-4 rounded-lg border border-white/[0.08] bg-[#17181d] p-4"><span class="grid h-11 w-11 place-items-center rounded-lg bg-[#23242a] text-[#d292f4]"><Package :size="21" /></span><div><div class="font-semibold">上传工具 v0.7.0</div><p class="text-sm">macOS Apple Silicon · 约 230 MB</p><code class="text-xs text-[#64748b]">QuPath-v0.7.0-Mac-arm64.pkg</code></div></div>
          <div class="flex justify-end gap-2"><button class="btn-ghost" @click="uploadToolOpen = false">取消</button><button disabled class="btn-primary cursor-not-allowed opacity-50"><Download :size="16" />安装包暂不可用</button></div>
        </div>
      </section>
    </div>
  </Teleport>
  <Teleport to="body"><TransferQuickPopover v-if="transferCenterOpen" @close="transferCenterOpen=false" /></Teleport>
</template>

<style scoped>
.nav-link { border-radius: 6px; padding: 6px 12px; color: #94a3b8; font-size: 14px; font-weight: 500; }
.nav-link:hover, .nav-active { background: rgb(255 255 255 / 0.08); color: #e2e8f0; }
.icon-button { display: grid; width: 36px; height: 36px; place-items: center; border-radius: 8px; color: #94a3b8; }
.icon-button:hover { background: rgb(255 255 255 / 0.06); color: #e2e8f0; }
.transfer-count{position:absolute;right:-4px;top:-4px;display:grid;min-width:17px;height:17px;place-items:center;border:2px solid #0f1014;border-radius:9px;background:#ef4444;padding:0 4px;color:white;font-size:9px;font-weight:700}.transfer-complete,.transfer-failed{position:absolute;right:-2px;top:-2px;display:grid;width:15px;height:15px;place-items:center;border:2px solid #0f1014;border-radius:50%}.transfer-complete{background:#22c55e;color:#07160d}.transfer-failed{background:#ef4444;color:white}
.menu-button { display: flex; width: 100%; height: 36px; align-items: center; gap: 8px; border-radius: 6px; padding: 0 12px; color: #94a3b8; font-size: 14px; }
.menu-button:hover { background: rgb(255 255 255 / 0.06); color: #e2e8f0; }
.mobile-link { border-radius: 6px; padding: 10px 12px; color: #94a3b8; font-size: 14px; }
.mobile-link:hover { background: rgb(255 255 255 / 0.06); color: #e2e8f0; }
@media (min-width: 1024px) {
  .nav-menu-trigger { display: none; }
}
</style>
