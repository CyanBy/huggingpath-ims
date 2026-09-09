<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertTriangle, ArrowLeft, History, Plus, Play } from '@lucide/vue'
import { configureAndStartAnalysisTask, countCaseAnalysisTasks, countWsiSuccessfulAnalyses, createTaskFromCases, getCaseAnalysisHistory, getWsiAnalysisHistory, readAnalysisTasks } from '@/lib/analysisTasks'
import type { AnalysisConfigurationItem, AnalysisModelAssignments } from '@/lib/analysisConfiguration'
import { getPathologySiteLabel, getSamplingMethodLabel } from '@/lib/pathologySpecimens'
import { readPathologyEntityDeletions, subscribePathologyEntityDeletions } from '@/lib/pathologyEntityLinks'
import { useWorkspaceData } from '../composables/useWorkspaceData'
import CaseWsiManagerModal from '../components/CaseWsiManagerModal.vue'
import AnalysisConfigurationModal from '../components/AnalysisConfigurationModal.vue'

const route = useRoute()
const router = useRouter()
const caseId = computed(() => String(route.params.caseId || 'S-20260517-1906'))
const { cases, wsis, refresh } = useWorkspaceData()
const tasks = ref(readAnalysisTasks())
const current = computed(() => cases.value.find((item) => item.id === caseId.value))
const rows = computed(() => wsis.value.filter((item) => item.boundCase === caseId.value))
const deleted = computed(() => !current.value || readPathologyEntityDeletions().deletedCaseIds.includes(caseId.value))
const analysisCount = computed(() => countCaseAnalysisTasks(caseId.value, tasks.value))
const wsiManagerOpen = ref(false)
const analysisConfigOpen = ref(false)
const analysisConfigurationItems = computed<AnalysisConfigurationItem[]>(() => rows.value.map((wsi) => ({
  id: wsi.id,
  name: wsi.fileName,
  organ: wsi.site,
  stain: wsi.stain,
  size: wsi.size,
  caseId: caseId.value,
  caseName: caseId.value,
})))
let unsubscribeDeletions: (() => void) | undefined

function refreshTasks() { tasks.value = readAnalysisTasks() }
onMounted(() => {
  unsubscribeDeletions = subscribePathologyEntityDeletions(refresh)
  window.addEventListener('analysisTasksChange', refreshTasks)
})
onUnmounted(() => {
  unsubscribeDeletions?.()
  window.removeEventListener('analysisTasksChange', refreshTasks)
})
function addWsi() {
  if (!current.value) return
  wsiManagerOpen.value = true
}

function analyzeCase() {
  if (!rows.value.length) return
  analysisConfigOpen.value = true
}
function launchConfigured(assignments: AnalysisModelAssignments) {
  if (!current.value || !rows.value.length) return
  const task = createTaskFromCases({ cases: [{
    caseId: current.value.id,
    organ: current.value.site,
    wsiCount: rows.value.length,
    wsis: rows.value.map((wsi) => ({ id: wsi.id, fileName: wsi.fileName, stain: wsi.stain, size: wsi.size })),
  }] })
  configureAndStartAnalysisTask(task.id, assignments)
  analysisConfigOpen.value = false
  router.push(`/workbench/run/${task.id}`)
}
function viewCaseAnalysis() {
  const latest = getCaseAnalysisHistory(caseId.value, tasks.value).find((historyTask) => {
    const objectIds = new Set(historyTask.objects.filter((item) => item.caseId === caseId.value).map((item) => item.id))
    return historyTask.models.some((run) => objectIds.has(run.objectId) && run.status === '分析完成')
  })
  if (!latest) return
  const object = latest.objects.find((item) => item.caseId === caseId.value)
  router.push({ path: `/workbench/run/${latest.id}`, query: { object: object?.id, historyScope: 'case' } })
}
function viewWsiAnalysis(wsiId: string) {
  const latest = getWsiAnalysisHistory(wsiId, tasks.value).find((historyTask) => historyTask.models.some((run) => run.objectId === wsiId && run.status === '分析完成'))
  if (!latest) return
  router.push({ path: `/workbench/run/${latest.id}`, query: { object: wsiId, historyScope: 'wsi' } })
}
</script>

<template>
  <div v-if="deleted" class="section-container grid min-h-[60dvh] place-items-center"><div class="max-w-[560px] rounded-lg border border-white/[0.08] bg-[#202126] px-8 py-10 text-center"><span class="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#ef4444]/10 text-[#fca5a5]"><AlertTriangle :size="23" /></span><h1 class="mt-4 text-xl font-bold">Case 已删除</h1><p class="mt-2">Case {{ caseId }} 已随关联链路删除，当前详情不可继续访问。</p><button class="btn-primary mt-6" @click="router.push('/workbench/cases')">返回 Case 列表</button></div></div>
  <div v-else class="min-h-[calc(100dvh-64px)] px-4 py-5 lg:px-6">
    <header class="mb-5 flex flex-wrap items-center justify-between gap-3"><div><button class="mb-3 flex items-center gap-2 text-sm text-[#d292f4]" @click="router.push('/workbench/cases')"><ArrowLeft :size="15" />返回 Case 列表</button><h1 class="text-2xl font-bold">Case 详情</h1><p class="mt-1 font-mono text-sm text-[#94a3b8]">{{ caseId }}</p></div><div class="flex gap-2"><button v-if="getCaseAnalysisHistory(caseId,tasks).length" class="btn-secondary h-10" @click="viewCaseAnalysis"><History :size="15" />查看分析</button><button class="btn-secondary h-10" @click="addWsi"><Plus :size="15" />添加 WSI</button><button class="btn-primary h-10" :disabled="!rows.length" @click="analyzeCase"><Play :size="15" />配置并分析</button></div></header>
    <section class="rounded-lg border border-white/[0.08] bg-[#202126] p-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 class="font-semibold">基本信息</h2><p class="mt-1 text-xs text-[#64748b]">临床与标本信息使用脱敏数据展示。</p></div><span :class="['rounded-md border px-2 py-1 text-xs',current?.priority==='加急'?'border-[#ef4444]/40 bg-[#ef4444]/10 text-[#fca5a5]':'border-white/[0.10] text-[#cbd5e1]']">{{ current?.priority }}</span></div>
      <dl class="case-info-grid"><div><dt>Case 编号</dt><dd class="font-mono">{{ caseId }}</dd></div><div><dt>脱敏患者编号</dt><dd>{{ current?.patientCode }}</dd></div><div><dt>年龄 / 性别</dt><dd>{{ current?.age ?? '未知' }} / {{ current?.sex }}</dd></div><div><dt>收样日期</dt><dd>{{ current?.receivedAt }}</dd></div><div class="sm:col-span-2"><dt>临床诊断</dt><dd>{{ current?.diagnosis }}</dd></div><div><dt>取材部位</dt><dd>{{ getPathologySiteLabel(current?.site || '') }}</dd></div><div><dt>取材方式</dt><dd>{{ getSamplingMethodLabel(current?.samplingMethod || '') }}</dd></div><div><dt>送检科室</dt><dd>{{ current?.department || '未填写' }}</dd></div><div><dt>处理状态</dt><dd>{{ current?.status }}</dd></div><div class="sm:col-span-2"><dt>备注</dt><dd>{{ current?.remark || '无' }}</dd></div></dl>
      <div class="mt-5 grid gap-3 border-t border-white/[0.06] pt-5 sm:grid-cols-2"><div class="rounded-lg border border-white/[0.08] bg-[#17181d] p-4"><small class="text-[#64748b]">关联 WSI</small><b class="mt-2 block text-xl">{{ rows.length }} 张</b></div><div class="rounded-lg border border-white/[0.08] bg-[#17181d] p-4"><small class="text-[#64748b]">分析次数</small><b class="mt-2 block text-xl">{{ analysisCount }} 次</b></div></div>
    </section>
    <section class="mt-5 overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]"><header class="flex items-center justify-between border-b border-white/[0.06] p-4"><div><h2 class="font-semibold">关联 WSI</h2><p class="mt-1 text-xs">只显示当前 Case 绑定的切片</p></div><button class="btn-secondary h-9" @click="addWsi"><Plus :size="15" />添加 WSI</button></header><div v-if="!rows.length" class="grid min-h-[220px] place-items-center text-center text-sm text-[#64748b]"><div><b class="block text-[#cbd5e1]">当前 Case 还没有 WSI</b><p class="mt-2">可直接上传新切片，或绑定工作台中已有的未归属 WSI。</p><button class="btn-primary mt-4" @click="addWsi">添加第一张 WSI</button></div></div><div v-else class="overflow-x-auto"><table class="w-full min-w-[980px] text-sm"><thead class="bg-[#252730]"><tr><th>文件名</th><th>缩略图</th><th>取材部位</th><th>取材方式</th><th>染色</th><th>文件大小</th><th>分析次数</th><th>操作</th></tr></thead><tbody><tr v-for="row in rows" :key="row.id" class="border-t border-white/[0.06]"><td><button class="font-mono text-[#d292f4]" @click="router.push(`/workbench/wsi?preview=${row.id}`)">{{ row.fileName }}</button></td><td><div class="grid h-10 w-16 place-items-center overflow-hidden rounded border border-white/[0.08] bg-[#0d2024]"><img src="/wsi-demo.jpg" alt="WSI 缩略图" class="h-full w-full object-cover" /></div></td><td>{{ getPathologySiteLabel(row.site) }}</td><td>{{ getSamplingMethodLabel(row.samplingMethod) }}</td><td>{{ row.stain }}</td><td>{{ row.size }}</td><td>{{ countWsiSuccessfulAnalyses(row.id, tasks) }} 次</td><td><button v-if="getWsiAnalysisHistory(row.id,tasks).length" class="text-[#d292f4]" @click="viewWsiAnalysis(row.id)">查看分析</button><span v-else class="text-[#64748b]">暂无分析</span></td></tr></tbody></table></div></section>
    <Teleport to="body"><CaseWsiManagerModal v-if="wsiManagerOpen && current" :case-item="current" @close="wsiManagerOpen=false" @changed="refresh" /><AnalysisConfigurationModal v-if="analysisConfigOpen" :items="analysisConfigurationItems" source-label="Case 详情" @close="analysisConfigOpen=false" @confirm="launchConfigured" /></Teleport>
  </div>
</template>

<style scoped>
th, td { padding: 12px 14px; text-align: left; } th { font-weight: 600; color: #cbd5e1; }
.case-info-grid{display:grid;gap:10px}@media(min-width:640px){.case-info-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}.case-info-grid>div{min-width:0;border:1px solid rgb(255 255 255 / .07);border-radius:7px;background:#17181d;padding:12px}.case-info-grid dt{color:#64748b;font-size:11px}.case-info-grid dd{margin-top:6px;color:#e2e8f0;font-size:13px;line-height:1.55;overflow-wrap:anywhere}
</style>
