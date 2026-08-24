<script setup lang="ts">
import { computed, ref } from 'vue'
import { BarChart3, Building2, Database, Eye, Search, Users, X } from '@lucide/vue'
import { publicProjects, type PublicProject } from '../data/publicData'

const keyword = ref('')
const disease = ref('全部疾病')
const dataType = ref('全部类型')
const selected = ref<PublicProject | null>(null)
const filtered = computed(() => publicProjects.filter((project) => {
  const query = keyword.value.trim().toLowerCase()
  return (!query || `${project.name} ${project.id} ${project.organization} ${project.tags.join(' ')}`.toLowerCase().includes(query))
    && (disease.value === '全部疾病' || project.disease === disease.value)
    && (dataType.value === '全部类型' || project.dataType === dataType.value)
}))
</script>

<template>
  <div class="min-h-[70dvh]">
    <section class="border-b border-white/[0.06] pb-9 pt-16"><div class="section-container"><span class="text-xs tracking-[.15em] text-[#64748b]">PUBLIC RESEARCH</span><h1 class="mt-2 text-3xl font-semibold">项目广场</h1><p class="mt-2">发现公开病理研究项目、数据摘要和 AI 分析成果。</p><div class="mt-7 flex flex-wrap gap-2"><label class="flex h-10 min-w-[280px] flex-1 items-center gap-2 rounded-md border border-white/[0.08] bg-[#17181d] px-3"><Search :size="16" class="text-[#64748b]" /><input v-model="keyword" class="w-full bg-transparent text-sm outline-none" placeholder="搜索项目、机构或标签" /></label><select v-model="disease" class="input-field h-10"><option>全部疾病</option><option v-for="item in [...new Set(publicProjects.map(p => p.disease))]" :key="item">{{ item }}</option></select><select v-model="dataType" class="input-field h-10"><option>全部类型</option><option v-for="item in [...new Set(publicProjects.map(p => p.dataType))]" :key="item">{{ item }}</option></select></div></div></section>
    <section class="section-container py-8 pb-20"><div class="mb-4 text-xs text-[#64748b]">共 {{ filtered.length }} 个项目</div><div class="grid gap-5 lg:grid-cols-2"><article v-for="project in filtered" :key="project.id" class="rounded-lg border border-white/[0.07] bg-[#202126] p-5"><div class="flex items-start justify-between gap-4"><div><code class="text-xs text-[#64748b]">{{ project.id }}</code><h2 class="mt-2 text-lg font-semibold">{{ project.name }}</h2></div><span class="rounded-md border border-[#8f35b7]/35 bg-[#8f35b7]/15 px-2 py-1 text-xs text-[#d292f4]">{{ project.policy }}</span></div><p class="mt-3 min-h-12 text-sm leading-6">{{ project.summary }}</p><div class="mt-4 flex flex-wrap gap-2"><span v-for="tag in project.tags" :key="tag" class="rounded bg-white/[0.05] px-2 py-1 text-xs text-[#94a3b8]">{{ tag }}</span></div><div class="mt-5 grid grid-cols-3 border-y border-white/[0.06] py-4 text-sm"><div><small>Case</small><b>{{ project.caseCount }}</b></div><div><small>WSI</small><b>{{ project.wsiCount }}</b></div><div><small>分析</small><b>{{ project.analysisCount }}</b></div></div><div class="mt-4 flex items-center justify-between"><span class="flex items-center gap-1 text-xs text-[#64748b]"><Building2 :size="14" />{{ project.organization }} · {{ project.owner }}</span><button class="text-sm text-[#d292f4]" @click="selected = project">查看项目</button></div></article></div></section>

    <Teleport to="body"><div v-if="selected" class="fixed inset-0 z-[120] grid place-items-center bg-black/70 px-4" @click.self="selected = null"><section class="w-full max-w-[720px] rounded-lg border border-white/[0.10] bg-[#202126] shadow-2xl"><header class="flex items-start justify-between border-b border-white/[0.08] p-5"><div><code class="text-xs text-[#64748b]">{{ selected.id }}</code><h2 class="mt-1 text-xl font-semibold">{{ selected.name }}</h2></div><button class="icon-button" @click="selected = null"><X :size="19" /></button></header><div class="p-5"><p class="leading-7">{{ selected.summary }}</p><div class="mt-5 grid gap-3 sm:grid-cols-4"><div class="metric"><Database :size="16" />{{ selected.wsiCount }} WSI</div><div class="metric"><Users :size="16" />{{ selected.members }} 成员</div><div class="metric"><BarChart3 :size="16" />{{ selected.analysisCount }} 分析</div><div class="metric"><Eye :size="16" />{{ selected.views }} 浏览</div></div><div class="mt-5 rounded-md border border-white/[0.07] bg-[#17181d] p-4 text-sm text-[#94a3b8]">公开范围包括项目概览、数据统计、AI 分析摘要与引用信息。数据下载遵循项目的“{{ selected.policy }}”策略。</div></div></section></div></Teleport>
  </div>
</template>

<style scoped>
article small { display: block; color: #64748b; font-size: 11px; } article b { display: block; margin-top: 3px; color: #e2e8f0; }
.metric { display: flex; align-items: center; gap: 7px; border: 1px solid rgb(255 255 255 / .07); border-radius: 6px; background: #17181d; padding: 12px; color: #cbd5e1; font-size: 13px; }
.icon-button { display: grid; width: 34px; height: 34px; place-items: center; color: #94a3b8; }
</style>
