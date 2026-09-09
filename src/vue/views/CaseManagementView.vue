<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown, ChevronRight, Plus, Search } from '@lucide/vue'
import { configureAndStartAnalysisTask, countCaseAnalysisTasks, createTaskFromCases, getCaseAnalysisHistory } from '@/lib/analysisTasks'
import type { AnalysisConfigurationItem, AnalysisModelAssignments } from '@/lib/analysisConfiguration'
import { getCaseResearchProjects } from '@/lib/pathologyEntityLinks'
import { getPathologySiteLabel, getSamplingMethodLabel } from '@/lib/pathologySpecimens'
import { useAnalysisTasks } from '../composables/useAnalysisTasks'
import { useWorkspaceData } from '../composables/useWorkspaceData'
import CaseEditorModal from '../components/CaseEditorModal.vue'
import AnalysisConfigurationModal from '../components/AnalysisConfigurationModal.vue'
import type { WorkspaceCase } from '../data/pathologyWorkspace'

const route = useRoute()
const router = useRouter()
const { cases, wsis, projects, refresh } = useWorkspaceData()
const { tasks } = useAnalysisTasks()
const keyword = ref('')
const projectFilter = ref('全部项目')
const selectedIds = ref<string[]>([])
const expanded = ref<string[]>([])
const createOpen = ref(false)
const analysisCases = ref<WorkspaceCase[]>([])

onMounted(() => {
  sessionStorage.removeItem('huggingpath.workbench.caseSelection.v1')
  const requested = typeof route.query.case === 'string' ? route.query.case : ''
  selectedIds.value = requested && cases.value.some((item) => item.id === requested) ? [requested] : []
})

const filtered = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return cases.value.filter((item) => {
    const linked = getCaseResearchProjects(item.id)
    return (projectFilter.value === '全部项目' || linked.some((project) => project.name === projectFilter.value))
      && (!query || `${item.id} ${item.patientCode} ${item.diagnosis} ${item.department} ${item.site} ${getPathologySiteLabel(item.site)} ${item.samplingMethod} ${item.remark} ${linked.map((project) => project.name).join(' ')}`.toLowerCase().includes(query))
  })
})
const selected = computed(() => cases.value.filter((item) => selectedIds.value.includes(item.id)))
const selectedEmptyCount = computed(() => selected.value.filter((item) => !caseWsis(item.id).length).length)
const analysisConfigurationItems = computed<AnalysisConfigurationItem[]>(() => analysisCases.value.flatMap((caseItem) => caseWsis(caseItem.id).map((wsi) => ({
  id: wsi.id,
  name: wsi.fileName,
  organ: wsi.site,
  stain: wsi.stain,
  size: wsi.size,
  caseId: caseItem.id,
  caseName: caseItem.id,
}))))
const allSelected = computed(() => filtered.value.length > 0 && filtered.value.every((item) => selectedIds.value.includes(item.id)))
function caseWsis(id: string) { return wsis.value.filter((item) => item.boundCase === id) }
function toggle(id: string) { selectedIds.value = selectedIds.value.includes(id) ? selectedIds.value.filter((item) => item !== id) : [...selectedIds.value, id] }
function toggleAll() { selectedIds.value = allSelected.value ? selectedIds.value.filter((id) => !filtered.value.some((item) => item.id === id)) : [...new Set([...selectedIds.value, ...filtered.value.map((item) => item.id)])] }
function rowClick(event: MouseEvent, id: string) { if (event.target instanceof Element && event.target.closest('button,input,a')) return; toggle(id) }
function startAnalysis() {
  if (!selected.value.length || selectedEmptyCount.value) return
  analysisCases.value = [...selected.value]
}
function launchConfigured(assignments: AnalysisModelAssignments) {
  if (!analysisCases.value.length) return
  const task = createTaskFromCases({ cases: analysisCases.value.map((item) => ({ caseId: item.id, organ: item.site, wsiCount: caseWsis(item.id).length, wsis: caseWsis(item.id).map((wsi) => ({ id: wsi.id, fileName: wsi.fileName, stain: wsi.stain, size: wsi.size })) })) })
  configureAndStartAnalysisTask(task.id, assignments)
  analysisCases.value = []
  selectedIds.value = []
  router.push(`/workbench/run/${task.id}`)
}
function createdCase(value: WorkspaceCase) {
  createOpen.value = false
  refresh()
  router.push(`/workbench/cases/${value.id}`)
}
function viewCaseAnalysis(id: string) {
  const latest = getCaseAnalysisHistory(id, tasks.value).find((historyTask) => {
    const objectIds = new Set(historyTask.objects.filter((item) => item.caseId === id).map((item) => item.id))
    return historyTask.models.some((run) => objectIds.has(run.objectId) && run.status === '分析完成')
  })
  if (!latest) return
  const object = latest.objects.find((item) => item.caseId === id)
  router.push({ path: `/workbench/run/${latest.id}`, query: { object: object?.id, historyScope: 'case' } })
}
</script>

<template>
  <div class="min-h-[calc(100dvh-64px)] px-4 py-5 lg:px-6">
    <div v-if="route.query.from === 'wsi'" class="mb-4 flex items-center justify-between rounded-md border border-[#8f35b7]/30 bg-[#8f35b7]/10 px-4 py-3 text-sm"><span>已定位到当前 WSI 绑定的 Case。</span><button class="text-[#d292f4]" @click="router.push('/workbench/wsi')">返回 WSI 管理</button></div>
    <header class="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Case 管理</h1>
        <p class="mt-1 text-sm">管理病例信息、关联 WSI 和研究项目。</p>
      </div>
      <button class="btn-primary h-10 shrink-0" @click="createOpen=true"><Plus :size="16" />新增 Case</button>
    </header>

    <section class="overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]">
      <div class="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <label class="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-md border border-white/[0.08] bg-[#17181d] px-3">
          <Search :size="15" class="shrink-0 text-[#64748b]" />
          <input v-model="keyword" class="w-full min-w-0 bg-transparent text-sm outline-none" placeholder="搜索 Case / 部位 / 项目" />
        </label>
        <select v-model="projectFilter" class="filter" :title="projectFilter">
          <option>全部项目</option>
          <option v-for="item in projects" :key="item.id">{{ item.name }}</option>
        </select>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div>
          <h2 class="font-semibold">Case 列表</h2>
          <p class="mt-0.5 text-xs text-[#94a3b8]">点击行空白处可多选，展开后查看关联 WSI。</p>
        </div>
        <div class="text-right"><button :disabled="!selected.length||Boolean(selectedEmptyCount)" :title="selectedEmptyCount?`所选 Case 中有 ${selectedEmptyCount} 个没有 WSI`:''" class="btn-primary h-9 shrink-0 disabled:cursor-not-allowed disabled:opacity-40" @click="startAnalysis">配置并分析已选 Case（{{ selected.length }}）</button><small v-if="selectedEmptyCount" class="mt-1 block text-[#f0b36c]">{{ selectedEmptyCount }} 个所选 Case 暂无 WSI</small></div>
      </div>
      <div class="overflow-x-auto"><table class="w-full min-w-[1240px] text-sm"><thead class="bg-[#252730]"><tr><th class="w-12"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th><th>Case 编号</th><th>患者 / 诊断</th><th>取材信息</th><th>年龄 / 性别</th><th>WSI 数</th><th>研究项目</th><th>分析次数</th><th>状态</th><th>操作</th></tr></thead><tbody v-for="item in filtered" :key="item.id"><tr :class="['border-t border-white/[0.06] hover:bg-white/[0.025]',selectedIds.includes(item.id)&&'bg-[#8f35b7]/10']" @click="rowClick($event,item.id)"><td><input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggle(item.id)" /></td><td><div class="flex items-center gap-2"><button class="text-[#94a3b8]" @click="expanded=expanded.includes(item.id)?expanded.filter(id=>id!==item.id):[...expanded,item.id]"><ChevronDown v-if="expanded.includes(item.id)" :size="16" /><ChevronRight v-else :size="16" /></button><button class="font-mono text-[#d292f4]" @click="router.push(`/workbench/cases/${item.id}`)">{{ item.id }}</button></div><small class="ml-6 mt-1 block text-[#64748b]">{{ item.receivedAt }} · {{ item.priority }}</small></td><td><b class="block text-xs">{{ item.patientCode }}</b><small class="mt-1 block max-w-[240px] truncate text-[#64748b]" :title="item.diagnosis">{{ item.diagnosis }}</small></td><td>{{ getPathologySiteLabel(item.site) }} · {{ getSamplingMethodLabel(item.samplingMethod) }}</td><td>{{ item.age ?? '未知' }} / {{ item.sex }}</td><td>{{ caseWsis(item.id).length }}</td><td><span v-if="!getCaseResearchProjects(item.id).length" class="text-[#64748b]">未加入</span><span v-for="project in getCaseResearchProjects(item.id)" :key="project.id" class="mr-1 rounded bg-[#8f35b7]/15 px-2 py-1 text-xs text-[#d292f4]">{{ project.name }}</span></td><td>{{ countCaseAnalysisTasks(item.id,tasks) }} 次</td><td><span class="rounded-md border border-white/[0.08] px-2 py-1 text-xs">{{ item.status }}</span></td><td><div class="flex gap-3 whitespace-nowrap"><button v-if="getCaseAnalysisHistory(item.id,tasks).length" class="text-[#d292f4]" @click="viewCaseAnalysis(item.id)">查看分析</button><button class="text-[#d292f4]" @click="router.push(`/workbench/cases/${item.id}`)">查看详情</button></div></td></tr><tr v-if="expanded.includes(item.id)" class="bg-[#17181d]"><td colspan="10" class="p-0"><div class="border-b border-white/[0.06] px-16 py-3 text-xs text-[#94a3b8]">送检科室：{{ item.department || '未填写' }}<span v-if="item.remark"> · 备注：{{ item.remark }}</span></div><div v-if="!caseWsis(item.id).length" class="px-16 py-5 text-sm text-[#64748b]">当前 Case 暂无关联 WSI。</div><div v-else class="grid gap-2 px-16 py-4"><button v-for="wsi in caseWsis(item.id)" :key="wsi.id" class="flex items-center justify-between rounded-md border border-white/[0.06] bg-[#202126] px-3 py-2 text-left" @click="router.push(`/workbench/wsi?preview=${wsi.id}`)"><span class="flex items-center gap-2"><img src="/wsi-demo.jpg" alt="WSI" class="h-8 w-12 rounded object-cover" /><span><b class="block font-mono text-xs">{{ wsi.fileName }}</b><small class="text-[#64748b]">{{ wsi.stain }} · {{ wsi.size }}</small></span></span><span class="text-xs text-[#d292f4]">查看 WSI</span></button></div></td></tr></tbody></table></div>
    </section>

    <Teleport to="body"><CaseEditorModal v-if="createOpen" @close="createOpen=false" @saved="createdCase" /><AnalysisConfigurationModal v-if="analysisCases.length" :items="analysisConfigurationItems" source-label="Case 管理" @close="analysisCases=[]" @confirm="launchConfigured" /></Teleport>
  </div>
</template>

<style scoped>
th,td{padding:11px 12px;text-align:left}th{color:#cbd5e1;font-weight:600}
.field{display:grid;gap:7px;color:#cbd5e1;font-size:13px}
.field input,.field select,.field textarea{border:1px solid rgb(255 255 255 / .08);border-radius:6px;background:#17181d;padding:9px 10px;color:#e2e8f0;outline:none}
.field textarea{min-height:74px;resize:vertical}
.filter {
  height: 36px;
  min-width: 148px;
  max-width: 220px;
  border: 1px solid rgb(255 255 255 / .08);
  border-radius: 6px;
  color: #cbd5e1;
  outline: none;
  appearance: none;
  padding: 0 28px 0 12px;
  background-color: #17181d;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}
</style>
