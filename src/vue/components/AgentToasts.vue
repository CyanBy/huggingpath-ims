<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Sparkles, X } from '@lucide/vue'
import { AGENT_TOAST_EVENT, type AgentToastPayload } from '@/lib/agentRuntime'

type Toast = { id: number; text: string; sessionId?: string }

const router = useRouter()
const toasts = ref<Toast[]>([])
let seq = 0

const baseTitle = document.title
let titleTimer: number | undefined

function flashTitle() {
  if (!document.hidden || titleTimer) return
  let on = false
  titleTimer = window.setInterval(() => {
    on = !on
    document.title = on ? '● AI 助手有新消息' : baseTitle
  }, 1000)
}

function restoreTitle() {
  if (titleTimer) window.clearInterval(titleTimer)
  titleTimer = undefined
  document.title = baseTitle
}

function onToast(event: Event) {
  const detail = (event as CustomEvent<AgentToastPayload>).detail
  const toast: Toast = { id: ++seq, text: detail.text, sessionId: detail.sessionId }
  toasts.value = [toast, ...toasts.value]
  flashTitle()
  window.setTimeout(() => dismiss(toast.id), 6000)
}

function dismiss(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

function openToast(toast: Toast) {
  dismiss(toast.id)
  restoreTitle()
  if (toast.sessionId) router.push({ path: '/assistant/chat', query: { session: toast.sessionId } })
  else router.push('/assistant/chat')
}

onMounted(() => {
  window.addEventListener(AGENT_TOAST_EVENT, onToast)
  window.addEventListener('focus', restoreTitle)
})
onUnmounted(() => {
  window.removeEventListener(AGENT_TOAST_EVENT, onToast)
  window.removeEventListener('focus', restoreTitle)
  restoreTitle()
})
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed right-5 top-20 z-[300] flex w-[320px] flex-col gap-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex cursor-pointer items-center gap-3 rounded-xl border border-[#8f35b7]/35 bg-[#202126] px-4 py-3 shadow-2xl transition-all hover:border-[#8f35b7]/60"
        @click="openToast(toast)"
      >
        <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#8f35b7]/15 text-[#d292f4]">
          <Sparkles :size="16" />
        </span>
        <span class="min-w-0 flex-1 truncate text-sm text-white">{{ toast.text }}</span>
        <button class="shrink-0 text-[#64748b] hover:text-white" title="关闭" @click.stop="dismiss(toast.id)">
          <X :size="15" />
        </button>
      </div>
    </div>
  </Teleport>
</template>
