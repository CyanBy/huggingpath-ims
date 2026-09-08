<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Building2, CheckCircle2, Clock3, KeyRound, ShieldCheck, UserCircle } from '@lucide/vue'
import { applyForOrganization, signOut, updateMyPassword, updateMyProfile } from '@/lib/accountDirectory'
import { useDirectory } from '../composables/useDirectory'

type Tab = 'profile' | 'security' | 'organization'
const route = useRoute()
const router = useRouter()
const { directory, session, refresh } = useDirectory()
const activeTab = ref<Tab>(route.query.tab === 'organization' ? 'organization' : 'profile')
const displayName = ref(session.value?.account.displayName || '')
const phone = ref(session.value?.account.phone || '')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const organizationCode = ref('')
const realName = ref('')
const reason = ref('')
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const ownRequests = computed(() => directory.value.membershipRequests.filter((item) => item.accountId === session.value?.account.id))
const pendingRequest = computed(() => ownRequests.value.find((item) => item.status === 'pending'))

watch(session, (value) => {
  if (!value) return
  displayName.value = value.account.displayName
  phone.value = value.account.phone
}, { immediate: true })

function setMessage(type: 'success' | 'error', text: string) {
  message.value = { type, text }
  window.setTimeout(() => { message.value = null }, 5000)
}
function saveProfile() {
  if (!session.value || !displayName.value.trim()) return setMessage('error', '展示名称不能为空。')
  updateMyProfile(session.value.account.id, { displayName: displayName.value, phone: phone.value })
  refresh(); setMessage('success', '个人资料已更新。')
}
function changePassword() {
  if (!session.value) return
  if (newPassword.value.length < 8) return setMessage('error', '新密码至少需要 8 位。')
  if (newPassword.value !== confirmPassword.value) return setMessage('error', '两次输入的新密码不一致。')
  const result = updateMyPassword(session.value.account.id, currentPassword.value, newPassword.value)
  if (!result.ok) return setMessage('error', result.message)
  currentPassword.value = ''; newPassword.value = ''; confirmPassword.value = ''; setMessage('success', '密码已更新。')
}
function apply() {
  if (!session.value) return
  if (!organizationCode.value.trim() || !realName.value.trim()) return setMessage('error', '请填写机构编码和真实姓名。')
  const result = applyForOrganization(session.value.account.id, { organizationCode: organizationCode.value, realName: realName.value, reason: reason.value })
  if (!result.ok) return setMessage('error', result.message)
  refresh(); setMessage('success', '机构申请已提交。')
}
function logout() { signOut(); router.push('/home') }
</script>

<template>
  <main v-if="session" class="min-h-[calc(100dvh-64px)] px-4 py-8 lg:px-6"><div class="mx-auto max-w-[1180px]"><header class="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h1 class="text-2xl font-semibold">个人中心</h1><p class="mt-1 text-sm">管理个人信息、安全设置和机构成员关系。</p></div><button class="text-sm text-[#f28b92]" @click="logout">退出登录</button></header><div class="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]"><aside class="h-fit overflow-hidden rounded-lg border border-white/[0.08] bg-[#1d1e23]"><div class="border-b border-white/[0.07] p-5"><div class="flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-full bg-[#9c42bd]/15 text-[#dfa8f2]">{{ session.account.displayName.slice(0,1).toUpperCase() }}</span><div class="min-w-0"><b class="block truncate text-sm">{{ session.account.displayName }}</b><small class="block truncate text-[#697386]">{{ session.account.email }}</small></div></div></div><nav class="p-2"><button v-for="tab in [{key:'profile',label:'个人资料',icon:UserCircle},{key:'security',label:'安全设置',icon:KeyRound},{key:'organization',label:'机构关系',icon:Building2}]" :key="tab.key" :class="['tab-button', activeTab === tab.key && 'active']" @click="activeTab = tab.key as Tab"><component :is="tab.icon" :size="16" />{{ tab.label }}<span v-if="tab.key === 'organization' && pendingRequest" class="ml-auto h-2 w-2 rounded-full bg-[#c66ee2]" /></button></nav></aside><section class="overflow-hidden rounded-lg border border-white/[0.08] bg-[#1d1e23]"><div class="grid gap-4 border-b border-white/[0.07] px-5 py-4 sm:grid-cols-3"><div v-for="item in [{label:'账号状态',value:'正常',icon:CheckCircle2},{label:'当前角色',value:session.role.name,icon:ShieldCheck},{label:'所属机构',value:session.organization?.name || '个人账号',icon:Building2}]" :key="item.label"><small class="text-[#697386]">{{ item.label }}</small><div class="mt-1 flex items-center gap-1.5 text-sm"><component :is="item.icon" :size="13" class="text-[#d292f4]" />{{ item.value }}</div></div></div><div v-if="message" :class="['mx-5 mt-5 rounded-md border px-3 py-2.5 text-sm', message.type === 'success' ? 'border-[#2c6d5a] bg-[#16342c] text-[#8be2c0]' : 'border-[#8e3942] bg-[#361b20] text-[#fda4af]']">{{ message.text }}</div>

          <form v-if="activeTab === 'profile'" class="p-5 sm:p-6" @submit.prevent="saveProfile"><h2 class="font-semibold">个人资料</h2><p class="mt-1 text-sm">展示名称会同步到导航和后台用户列表。</p><div class="mt-6 grid gap-4 sm:grid-cols-2"><label class="field"><span>展示名称 <i class="required-mark">*</i></span><input v-model="displayName" required /></label><label class="field">登录用户名<input :value="session.account.username" readonly /></label><label class="field">邮箱<input :value="session.account.email" readonly /></label><label class="field">手机号<input v-model="phone" placeholder="选填" /></label></div><div class="mt-6 flex justify-end border-t border-white/[0.07] pt-5"><button class="btn-primary" type="submit">保存资料</button></div></form>
          <form v-else-if="activeTab === 'security'" class="p-5 sm:p-6" @submit.prevent="changePassword"><div class="flex gap-3"><span class="grid h-9 w-9 place-items-center rounded-md bg-[#9c42bd]/15 text-[#d292f4]"><KeyRound :size="18" /></span><div><h2 class="font-semibold">修改密码</h2><p class="mt-1 text-sm">更新后，下次登录立即使用新密码。</p></div></div><div class="mt-6 grid gap-4 sm:grid-cols-2"><label class="field sm:col-span-2"><span>当前密码 <i class="required-mark">*</i></span><input v-model="currentPassword" required type="password" /></label><label class="field"><span>新密码 <i class="required-mark">*</i></span><input v-model="newPassword" required type="password" placeholder="至少 8 位" /></label><label class="field"><span>确认新密码 <i class="required-mark">*</i></span><input v-model="confirmPassword" required type="password" /></label></div><div class="mt-6 flex justify-end border-t border-white/[0.07] pt-5"><button class="btn-primary" type="submit">更新密码</button></div></form>
          <div v-else class="p-5 sm:p-6"><h2 class="font-semibold">机构成员关系</h2><p class="mt-1 text-sm">机构申请由机构管理员或平台管理员审核。</p><div v-if="session.organization" class="mt-6 rounded-md border border-[#2c6d5a] bg-[#16342c] p-4"><b class="text-[#b8f1dc]">{{ session.organization.name }}</b><p class="mt-1 text-xs text-[#74b9a0]">机构编码 {{ session.organization.code }} · 已绑定</p></div><div v-else-if="pendingRequest" class="mt-6 flex gap-3 rounded-md border border-[#8b6a2c] bg-[#332b18] p-4"><Clock3 :size="18" class="text-[#e6bc68]" /><div><b class="text-[#f2d38f]">申请审核中</b><p class="mt-1 text-sm">{{ directory.organizations.find(item => item.id === pendingRequest?.organizationId)?.name }}</p></div></div><form v-else class="mt-6 grid gap-4 sm:grid-cols-2" @submit.prevent="apply"><label class="field"><span>机构编码 <i class="required-mark">*</i></span><input v-model="organizationCode" required placeholder="向机构管理员获取" /></label><label class="field"><span>真实姓名 <i class="required-mark">*</i></span><input v-model="realName" required /></label><label class="field sm:col-span-2">申请说明<textarea v-model="reason" placeholder="所属科室、用途或申请原因" /></label><div class="sm:col-span-2 flex justify-end"><button class="btn-primary" type="submit">提交申请</button></div></form></div>
        </section></div></div></main>
</template>

<style scoped>
.tab-button { display: flex; width: 100%; height: 40px; align-items: center; gap: 8px; border-radius: 6px; padding: 0 12px; color: #8b95a8; font-size: 14px; }
.tab-button:hover { background: rgb(255 255 255 / .04); color: #e2e8f0; } .tab-button.active { background: rgb(156 66 189 / .18); color: #e0a8f4; }
.field { display: grid; gap: 8px; color: #cbd5e1; font-size: 14px; font-weight: 500; } .field input, .field textarea { border: 1px solid rgb(255 255 255 / .08); border-radius: 6px; background: #17181d; padding: 10px 12px; color: #e2e8f0; outline: none; } .field input:focus, .field textarea:focus { border-color: #9c42bd; } .field textarea { min-height: 96px; resize: vertical; }
</style>
