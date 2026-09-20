<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppFooter from './components/AppFooter.vue'
import AppNavbar from './components/AppNavbar.vue'
import AgentToasts from './components/AgentToasts.vue'
import { ensureAgentDemoSeed, ensureStadDemoSeed } from '@/lib/agentDemoSeed'
import { initAgentRuntime } from '@/lib/agentRuntime'

ensureAgentDemoSeed()
ensureStadDemoSeed()
initAgentRuntime()

const route = useRoute()
const isLoginPage = computed(() => route.name === 'login')
const isImmersivePage = computed(() => route.name === 'workbench-run' || route.name === 'assistant-chat')
</script>

<template>
  <div class="flex min-h-[100dvh] flex-col bg-[#0f1014]">
    <AppNavbar v-if="!isLoginPage" />
    <main :class="['flex-1', isLoginPage ? 'pt-0' : 'pt-16']">
      <RouterView />
    </main>
    <AppFooter v-if="!isLoginPage && !isImmersivePage" />
    <AgentToasts v-if="!isLoginPage" />
  </div>
</template>
