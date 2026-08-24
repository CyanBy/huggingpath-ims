<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, User } from '@lucide/vue'
import { getDirectory, getSessionAccount, registerAccount, signIn } from '@/lib/accountDirectory'
import AppLogo from '../components/AppLogo.vue'

type Mode = 'login' | 'register'

const route = useRoute()
const router = useRouter()
const mode = ref<Mode>('login')
const showPassword = ref(false)
const loginAccount = ref('')
const loginPassword = ref('')
const registerName = ref('')
const registerEmail = ref('')
const registerPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const registrationComplete = ref(false)
const session = computed(() => getSessionAccount(getDirectory()))
const destination = computed(() => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/workbench/tasks'
  return redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/workbench/tasks'
})

function switchMode(nextMode: Mode) {
  mode.value = nextMode
  error.value = ''
}

function submitLogin() {
  error.value = ''
  if (!loginAccount.value.trim() || !loginPassword.value) {
    error.value = '请输入账号和密码。'
    return
  }
  const result = signIn(loginAccount.value, loginPassword.value)
  if (!result.ok) {
    error.value = result.message
    return
  }
  router.replace(destination.value)
}

function submitRegister() {
  error.value = ''
  if (registerName.value.trim().length < 2) {
    error.value = '用户名至少需要 2 个字符。'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail.value)) {
    error.value = '请输入有效的邮箱地址。'
    return
  }
  if (registerPassword.value.length < 8) {
    error.value = '密码至少需要 8 位。'
    return
  }
  if (registerPassword.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致。'
    return
  }
  const result = registerAccount({ username: registerName.value, email: registerEmail.value, password: registerPassword.value })
  if (!result.ok) {
    error.value = result.message
    return
  }
  registrationComplete.value = true
}
</script>

<template>
  <main class="min-h-[100dvh] bg-[#0f1014] px-4 py-8 text-[#f1f3f6] sm:px-6">
    <div class="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[1040px] items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
      <section class="hidden max-w-[390px] lg:block">
        <button class="mb-12 flex items-center gap-3 text-left" @click="router.push('/explore')"><AppLogo :size="42" /><span><b class="block text-xl">HuggingPath</b><small class="mt-0.5 block text-[#64748b]">病理影像分析平台</small></span></button>
        <h1 class="text-3xl font-semibold leading-tight">一个账号，连接数据、模型与分析任务</h1>
        <div class="mt-8 grid gap-5">
          <div v-for="item in [['个人空间','注册后可立即使用个人数据与公开模型。'],['机构协作','通过机构编码提交申请，审核状态与账号实时同步。'],['权限边界','工作台与后台入口根据当前角色自动显示。']]" :key="item[0]" class="flex gap-3"><CheckCircle2 :size="18" class="mt-0.5 shrink-0 text-[#b866d5]" /><div><b class="text-sm">{{ item[0] }}</b><p class="mt-1 text-sm leading-6">{{ item[1] }}</p></div></div>
        </div>
      </section>

      <section class="mx-auto w-full max-w-[520px] overflow-hidden rounded-lg border border-white/[0.10] bg-[#1f2024] shadow-[0_28px_90px_rgba(0,0,0,.5)]">
      <header class="border-b border-white/[0.08] px-6 pt-5 sm:px-8">
        <div class="mb-5 flex items-center justify-between lg:hidden">
          <button class="flex items-center gap-2" @click="router.push('/explore')"><AppLogo :size="32" /><span class="font-semibold">HuggingPath</span></button>
          <button class="inline-flex items-center gap-1 text-xs text-[#64748b] hover:text-[#cbd5e1]" @click="router.push('/explore')"><ArrowLeft :size="13" />返回模型中心</button>
        </div>
        <div v-if="!registrationComplete" class="grid grid-cols-2 rounded-md bg-[#131419] p-1">
          <button v-for="item in (['login','register'] as const)" :key="item" type="button" :class="['h-9 rounded text-sm', mode === item ? 'bg-[#2a2c33] text-[#f1f3f6]' : 'text-[#737d91] hover:text-[#cbd5e1]']" @click="switchMode(item)">{{ item === 'login' ? '登录' : '注册账号' }}</button>
        </div>
      </header>

      <div class="px-6 py-7 sm:px-8">
        <div v-if="registrationComplete">
          <div class="grid h-12 w-12 place-items-center rounded-full border border-[#3b7b68] bg-[#17372f] text-[#6ee7b7]"><CheckCircle2 :size="24" /></div>
          <h1 class="mt-5 text-xl font-semibold">账号已创建</h1>
          <p class="mt-2 text-sm leading-6">当前为个人账号，可直接进入工作台，也可到个人中心申请加入机构。</p>
          <div class="mt-7 grid gap-3 sm:grid-cols-2">
            <button class="btn-secondary h-11" @click="router.push('/user-center?tab=organization')">申请加入机构</button>
            <button class="btn-primary h-11" @click="router.replace(destination)">进入工作台 <ArrowRight :size="16" /></button>
          </div>
        </div>

        <form v-else-if="mode === 'login'" @submit.prevent="submitLogin">
          <h1 class="text-xl font-semibold">登录账号</h1><p class="mt-1.5 text-sm">继续访问你的工作台和机构数据。</p>
          <div v-if="session" class="mt-5 flex items-center justify-between rounded-md border border-white/[0.08] bg-[#14151a] px-3 py-2.5 text-sm"><span class="truncate text-[#94a3b8]">当前登录：{{ session.account.displayName }}</span><button type="button" class="text-[#d292f4]" @click="router.replace(destination)">继续使用</button></div>
          <div class="mt-6 space-y-4">
            <label class="field"><span>账号或邮箱</span><div class="field-control"><User :size="16" /><input v-model="loginAccount" autocomplete="username" placeholder="请输入账号或邮箱" /></div></label>
            <label class="field"><span class="flex justify-between">密码 <small>密码重置请联系管理员</small></span><div class="field-control"><LockKeyhole :size="16" /><input v-model="loginPassword" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="请输入密码" /><button type="button" @click="showPassword = !showPassword"><EyeOff v-if="showPassword" :size="16" /><Eye v-else :size="16" /></button></div></label>
          </div>
          <p v-if="error" class="mt-4 rounded-md border border-[#8e3942] bg-[#361b20] px-3 py-2.5 text-sm text-[#fda4af]">{{ error }}</p>
          <button class="btn-primary mt-6 h-11 w-full" type="submit">登录 <ArrowRight :size="16" /></button>
          <p class="mt-4 text-xs text-[#64748b]">演示账号：demo / demo123</p>
        </form>

        <form v-else @submit.prevent="submitRegister">
          <h1 class="text-xl font-semibold">创建个人账号</h1><p class="mt-1.5 text-sm">机构关系在注册后通过申请建立。</p>
          <div class="mt-6 space-y-4">
            <label class="field"><span>用户名</span><div class="field-control"><User :size="16" /><input v-model="registerName" autocomplete="username" placeholder="用于登录和个人标识" /></div></label>
            <label class="field"><span>邮箱</span><div class="field-control"><Mail :size="16" /><input v-model="registerEmail" type="email" autocomplete="email" placeholder="example@domain.com" /></div></label>
            <label class="field"><span>密码</span><div class="field-control"><LockKeyhole :size="16" /><input v-model="registerPassword" type="password" autocomplete="new-password" placeholder="至少 8 位" /></div></label>
            <label class="field"><span>确认密码</span><div class="field-control"><ShieldCheck :size="16" /><input v-model="confirmPassword" type="password" autocomplete="new-password" placeholder="再次输入密码" /></div></label>
          </div>
          <p v-if="error" class="mt-4 rounded-md border border-[#8e3942] bg-[#361b20] px-3 py-2.5 text-sm text-[#fda4af]">{{ error }}</p>
          <button class="btn-primary mt-6 h-11 w-full" type="submit"><ShieldCheck :size="16" />创建账号</button>
        </form>
      </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.field { display: grid; gap: 8px; color: #cbd5e1; font-size: 14px; font-weight: 500; }
.field small { color: #64748b; font-size: 12px; font-weight: 400; }
.field-control { display: flex; height: 44px; align-items: center; gap: 10px; border: 1px solid rgb(255 255 255 / .10); border-radius: 6px; background: #14151a; padding: 0 12px; color: #64748b; }
.field-control:focus-within { border-color: #8f35b7; box-shadow: 0 0 0 3px rgb(143 53 183 / .14); }
.field-control input { min-width: 0; flex: 1; border: 0; outline: 0; background: transparent; color: #e2e8f0; }
</style>
