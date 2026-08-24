<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@lucide/vue'
import { publicCases } from '../data/publicData'

const router = useRouter()
const query = ref('')
const site = ref('全部部位')
const status = ref('全部状态')
const filtered = computed(() => publicCases.filter((item) => (!query.value || `${item.caseId} ${item.description} ${item.patient}`.toLowerCase().includes(query.value.toLowerCase())) && (site.value === '全部部位' || item.site === site.value) && (status.value === '全部状态' || item.status === status.value)))
const statusClass = (value: string) => value === '分析完成' ? 'bg-[#22c55e]/10 text-[#83e5a8]' : value === '分析中' ? 'bg-[#5d8eff]/15 text-[#9db8ff]' : value === '分析失败' ? 'bg-[#ef5b5b]/15 text-[#ff9c9c]' : 'bg-slate-400/15 text-[#aeb5c1]'
</script>

<template>
  <div class="min-h-[calc(100dvh-64px)] bg-[#0f1014] px-4 py-6 lg:px-6"><div class="mb-5"><h1 class="text-2xl font-semibold">病例库</h1><p class="mt-1 text-sm">浏览公开病例摘要、关联切片和分析状态。</p></div><section class="overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]"><header class="flex flex-wrap gap-2 border-b border-white/[0.06] p-4"><label class="flex h-10 min-w-[280px] flex-1 items-center gap-2 rounded-md border border-white/[0.08] bg-[#17181d] px-3"><Search :size="16" class="text-[#64748b]" /><input v-model="query" class="w-full bg-transparent text-sm outline-none" placeholder="搜索 Case 编号或患者" /></label><select v-model="site" class="input-field h-10"><option>全部部位</option><option v-for="item in [...new Set(publicCases.map(c => c.site))]" :key="item">{{ item }}</option></select><select v-model="status" class="input-field h-10"><option>全部状态</option><option>未分析</option><option>分析中</option><option>分析完成</option><option>分析失败</option></select></header><div class="overflow-x-auto"><table class="w-full min-w-[900px] text-sm"><thead class="bg-[#252730]"><tr><th>Case</th><th>患者</th><th>部位</th><th>取材方式</th><th>WSI</th><th>AI 状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody><tr v-for="item in filtered" :key="item.caseId" class="border-t border-white/[0.06] hover:bg-white/[0.025]" @dblclick="router.push(`/cases/${item.caseId}`)"><td><b>{{ item.caseId }}</b><small>{{ item.description }}</small></td><td>{{ item.patient }}<small>{{ item.patientMeta }}</small></td><td>{{ item.site }}</td><td>{{ item.sampling }}</td><td>{{ item.slideCount }}</td><td><span :class="['rounded-full px-2.5 py-1 text-xs font-semibold', statusClass(item.status)]">{{ item.status }}</span></td><td>{{ item.createdAt }}</td><td><button class="text-[#d292f4]" @click="router.push(`/cases/${item.caseId}`)">查看</button></td></tr></tbody></table></div></section></div>
</template>

<style scoped>
th, td { padding: 13px 14px; text-align: left; } th { color: #cbd5e1; font-weight: 600; } td small { display: block; margin-top: 3px; color: #64748b; font-size: 11px; }
</style>
