<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertTriangle, Plus } from '@lucide/vue'
import { countCaseAnalysisTasks, countWsiSuccessfulAnalyses, readAnalysisTasks } from '@/lib/analysisTasks'
import { getCaseSpecimenProfile, getPathologySiteLabel, getSamplingMethodLabel } from '@/lib/pathologySpecimens'
import { readPathologyEntityDeletions, subscribePathologyEntityDeletions } from '@/lib/pathologyEntityLinks'

type WsiRow = { id: string; name: string; site: string; samplingMethod: string; stain: string; magnification: string; fileSize: string; createdAt: string }
const seedRows: WsiRow[] = [
  { id: 'wsi-001', name: 'S-20260517-1906_HE_001.svs', site: 'lung', samplingMethod: 'biopsy', stain: 'HE', magnification: '40X', fileSize: '1.24 GB', createdAt: '2026-05-17' },
  { id: 'wsi-002', name: 'S-20260517-1906_IHC_Ki67_001.svs', site: 'lung', samplingMethod: 'biopsy', stain: 'Ki67', magnification: '40X', fileSize: '982 MB', createdAt: '2026-05-17' },
  { id: 'wsi-003', name: 'S-20260517-1906_PAS_001.svs', site: 'lung', samplingMethod: 'biopsy', stain: 'PAS', magnification: '20X', fileSize: '756 MB', createdAt: '2026-05-18' },
]
const route = useRoute()
const router = useRouter()
const caseId = computed(() => String(route.params.caseId || 'S-20260517-1906'))
const rows = ref<WsiRow[]>([])
const deleted = ref(false)
const tasks = ref(readAnalysisTasks())
const profile = computed(() => getCaseSpecimenProfile(caseId.value) || { site: 'other', samplingMethod: 'other' })
const analysisCount = computed(() => countCaseAnalysisTasks(caseId.value, tasks.value))
let unsubscribe: (() => void) | undefined

function refresh() {
  const deletions = readPathologyEntityDeletions()
  rows.value = seedRows.filter((item) => !deletions.deletedWsiIds.includes(item.id))
  deleted.value = deletions.deletedCaseIds.includes(caseId.value)
  tasks.value = readAnalysisTasks()
}
onMounted(() => {
  refresh()
  unsubscribe = subscribePathologyEntityDeletions(refresh)
  window.addEventListener('analysisTasksChange', refresh)
})
onUnmounted(() => {
  unsubscribe?.()
  window.removeEventListener('analysisTasksChange', refresh)
})
function addWsi() {
  const index = rows.value.length + 1
  rows.value.unshift({ id: `wsi-${Date.now()}`, name: `${caseId.value}_NEW_${String(index).padStart(3, '0')}.svs`, site: profile.value.site, samplingMethod: profile.value.samplingMethod, stain: 'HE', magnification: '40X', fileSize: '待识别', createdAt: new Date().toISOString().slice(0, 10) })
}
</script>

<template>
  <div v-if="deleted" class="section-container grid min-h-[60dvh] place-items-center"><div class="max-w-[560px] rounded-lg border border-white/[0.08] bg-[#202126] px-8 py-10 text-center"><span class="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#ef4444]/10 text-[#fca5a5]"><AlertTriangle :size="23" /></span><h1 class="mt-4 text-xl font-bold">Case 已删除</h1><p class="mt-2">Case {{ caseId }} 已随关联链路删除，当前详情不可继续访问。</p><button class="btn-primary mt-6" @click="router.push('/workbench/cases')">返回 Case 列表</button></div></div>
  <div v-else class="min-h-[calc(100dvh-64px)] px-4 py-5 lg:px-6"><section class="rounded-lg border border-white/[0.08] bg-[#202126] p-5"><header class="mb-5 flex items-start justify-between"><div><h1 class="text-2xl font-bold">Case 详情</h1><p class="mt-2 text-sm">当前 Case：<code>{{ caseId }}</code></p></div><button class="btn-secondary" @click="router.back()">返回列表</button></header><div class="grid gap-3 border-t border-white/[0.06] pt-5 sm:grid-cols-2 xl:grid-cols-5"><div v-for="item in [['Case 编号',caseId],['WSI 数',rows.length],['取材部位',getPathologySiteLabel(profile.site)],['取材方式',getSamplingMethodLabel(profile.samplingMethod)],['分析次数',analysisCount]]" :key="String(item[0])" class="rounded-lg border border-white/[0.08] bg-[#17181d] p-4"><small class="text-[#64748b]">{{ item[0] }}</small><div class="mt-2 text-lg font-semibold">{{ item[1] }}</div></div></div></section><section class="mt-5 overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]"><header class="flex items-center justify-between border-b border-white/[0.06] p-4"><div><h2 class="font-semibold">关联 WSI</h2><p class="mt-1 text-xs">当前 Case 的病理切片和分析记录</p></div><button class="btn-primary h-9" @click="addWsi"><Plus :size="15" />添加 WSI</button></header><div v-if="!rows.length" class="grid min-h-[220px] place-items-center text-sm text-[#64748b]">暂无关联 WSI</div><div v-else class="overflow-x-auto"><table class="w-full min-w-[900px] text-sm"><thead class="bg-[#252730]"><tr><th>文件名</th><th>缩略图</th><th>取材部位</th><th>取材方式</th><th>染色</th><th>倍率</th><th>文件大小</th><th>分析次数</th></tr></thead><tbody><tr v-for="row in rows" :key="row.id" class="border-t border-white/[0.06]"><td><button class="font-mono text-[#d292f4]" @click="router.push(`/workbench/wsi?preview=${row.id}`)">{{ row.name }}</button></td><td><div class="grid h-10 w-16 place-items-center overflow-hidden rounded border border-white/[0.08] bg-[#0d2024]"><img src="/wsi-demo.jpg" alt="WSI 缩略图" class="h-full w-full object-cover" /></div></td><td>{{ getPathologySiteLabel(row.site) }}</td><td>{{ getSamplingMethodLabel(row.samplingMethod) }}</td><td>{{ row.stain }}</td><td>{{ row.magnification }}</td><td>{{ row.fileSize }}</td><td>{{ countWsiSuccessfulAnalyses(row.id, tasks) }} 次</td></tr></tbody></table></div></section></div>
</template>

<style scoped>
th, td { padding: 12px 14px; text-align: left; } th { font-weight: 600; color: #cbd5e1; }
</style>
