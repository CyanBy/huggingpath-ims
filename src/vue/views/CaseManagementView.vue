<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown, ChevronRight, Plus, Search, X } from '@lucide/vue'
import { countCaseAnalysisTasks, createTaskFromCases } from '@/lib/analysisTasks'
import { getCaseResearchProjects } from '@/lib/pathologyEntityLinks'
import { getPathologySiteLabel, getSamplingMethodLabel, PATHOLOGY_SITE_OPTIONS, SAMPLING_METHOD_OPTIONS } from '@/lib/pathologySpecimens'
import { useAnalysisTasks } from '../composables/useAnalysisTasks'
import { useWorkspaceData } from '../composables/useWorkspaceData'
import { writeWorkspaceCases, type WorkspaceCase } from '../data/pathologyWorkspace'

const route = useRoute()
const router = useRouter()
const { cases, wsis, projects, refresh } = useWorkspaceData()
const { tasks } = useAnalysisTasks()
const keyword = ref('')
const projectFilter = ref('全部项目')
const selectedIds = ref<string[]>(readSelection())
const expanded = ref<string[]>([])
const createOpen = ref(false)
const newCase = ref<WorkspaceCase>({ id: '', site: 'stomach', samplingMethod: 'biopsy', ageGroup: '41-60', sex: '未知', status: '待处理', remark: '' })
const error = ref('')

function readSelection() {
  try { const value = JSON.parse(sessionStorage.getItem('huggingpath.workbench.caseSelection.v1') || '[]'); return Array.isArray(value) ? value : [] } catch { return [] }
}
watch(selectedIds, (value) => sessionStorage.setItem('huggingpath.workbench.caseSelection.v1', JSON.stringify(value)), { deep: true })
onMounted(() => {
  const requested = typeof route.query.case === 'string' ? route.query.case : ''
  selectedIds.value = requested && cases.value.some((item) => item.id === requested) ? [requested] : selectedIds.value.filter((id) => cases.value.some((item) => item.id === id))
})

const filtered = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return cases.value.filter((item) => {
    const linked = getCaseResearchProjects(item.id)
    return (projectFilter.value === '全部项目' || linked.some((project) => project.name === projectFilter.value))
      && (!query || `${item.id} ${item.site} ${getPathologySiteLabel(item.site)} ${item.samplingMethod} ${item.remark} ${linked.map((project) => project.name).join(' ')}`.toLowerCase().includes(query))
  })
})
const selected = computed(() => cases.value.filter((item) => selectedIds.value.includes(item.id)))
const allSelected = computed(() => filtered.value.length > 0 && filtered.value.every((item) => selectedIds.value.includes(item.id)))
function caseWsis(id: string) { return wsis.value.filter((item) => item.boundCase === id) }
function toggle(id: string) { selectedIds.value = selectedIds.value.includes(id) ? selectedIds.value.filter((item) => item !== id) : [...selectedIds.value, id] }
function toggleAll() { selectedIds.value = allSelected.value ? selectedIds.value.filter((id) => !filtered.value.some((item) => item.id === id)) : [...new Set([...selectedIds.value, ...filtered.value.map((item) => item.id)])] }
function rowClick(event: MouseEvent, id: string) { if (event.target instanceof Element && event.target.closest('button,input,a')) return; toggle(id) }
function startAnalysis() {
  if (!selected.value.length) return
  const task = createTaskFromCases({ cases: selected.value.map((item) => ({ caseId: item.id, organ: item.site, wsiCount: caseWsis(item.id).length, wsis: caseWsis(item.id).map((wsi) => ({ id: wsi.id, fileName: wsi.fileName, stain: wsi.stain, size: wsi.size })) })) })
  router.push(`/workbench/run/${task.id}`)
}
function createCase() {
  error.value = ''
  const id = newCase.value.id.trim()
  if (!id) return error.value = '请输入 Case 编号。'
  if (cases.value.some((item) => item.id.toLowerCase() === id.toLowerCase())) return error.value = 'Case 编号已存在。'
  writeWorkspaceCases([{ ...newCase.value, id }, ...cases.value])
  createOpen.value = false
  newCase.value = { id: '', site: 'stomach', samplingMethod: 'biopsy', ageGroup: '41-60', sex: '未知', status: '待处理', remark: '' }
  refresh()
}
</script>

<template>
  <div class="min-h-[calc(100dvh-64px)] px-4 py-5 lg:px-6">
    <div v-if="route.query.from === 'wsi'" class="mb-4 flex items-center justify-between rounded-md border border-[#8f35b7]/30 bg-[#8f35b7]/10 px-4 py-3 text-sm"><span>已定位到 WSI 绑定的 Case，返回后原 WSI 选择仍会保留。</span><button class="text-[#d292f4]" @click="router.push('/workbench/wsi')">返回 WSI 管理</button></div>
    <header class="mb-5 flex flex-wrap items-start justify-between gap-4"><div><h1 class="text-2xl font-bold">Case 管理</h1><p class="mt-1 text-sm">管理病例信息、关联 WSI 和研究项目。</p></div><button class="btn-primary" @click="createOpen=true"><Plus :size="16" />新增 Case</button></header>
    <section class="overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]"><header class="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] p-4"><div><h2 class="font-semibold">Case 列表</h2><p class="mt-1 text-xs">点击行空白区域即可多选，展开后查看关联 WSI。</p></div><div class="flex flex-wrap gap-2"><label class="flex h-9 items-center gap-2 rounded-md border border-white/[0.08] bg-[#17181d] px-3"><Search :size="15" class="text-[#64748b]" /><input v-model="keyword" class="w-[250px] bg-transparent text-sm outline-none" placeholder="搜索 Case / 部位 / 项目" /></label><select v-model="projectFilter" class="input-field h-9"><option>全部项目</option><option v-for="item in projects" :key="item.id">{{ item.name }}</option></select><button :disabled="!selected.length" class="btn-primary h-9 disabled:opacity-40" @click="startAnalysis">分析已选 Case（{{ selected.length }}）</button></div></header><div class="overflow-x-auto"><table class="w-full min-w-[1080px] text-sm"><thead class="bg-[#252730]"><tr><th class="w-12"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th><th>Case 编号</th><th>取材部位</th><th>取材方式</th><th>年龄段 / 性别</th><th>WSI 数</th><th>研究项目</th><th>分析次数</th><th>状态</th><th>操作</th></tr></thead><tbody v-for="item in filtered" :key="item.id"><tr :class="['border-t border-white/[0.06] hover:bg-white/[0.025]',selectedIds.includes(item.id)&&'bg-[#8f35b7]/10']" @click="rowClick($event,item.id)"><td><input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggle(item.id)" /></td><td><div class="flex items-center gap-2"><button class="text-[#94a3b8]" @click="expanded=expanded.includes(item.id)?expanded.filter(id=>id!==item.id):[...expanded,item.id]"><ChevronDown v-if="expanded.includes(item.id)" :size="16" /><ChevronRight v-else :size="16" /></button><button class="font-mono text-[#d292f4]" @click="router.push(`/cases/${item.id}`)">{{ item.id }}</button></div><small class="ml-6 mt-1 block text-[#64748b]">{{ item.remark }}</small></td><td>{{ getPathologySiteLabel(item.site) }}</td><td>{{ getSamplingMethodLabel(item.samplingMethod) }}</td><td>{{ item.ageGroup }} / {{ item.sex }}</td><td>{{ caseWsis(item.id).length }}</td><td><span v-if="!getCaseResearchProjects(item.id).length" class="text-[#64748b]">未加入</span><span v-for="project in getCaseResearchProjects(item.id).slice(0,2)" :key="project.id" class="mr-1 rounded bg-[#8f35b7]/15 px-2 py-1 text-xs text-[#d292f4]">{{ project.name }}</span></td><td>{{ countCaseAnalysisTasks(item.id,tasks) }} 次</td><td><span class="rounded-md border border-white/[0.08] px-2 py-1 text-xs">{{ item.status }}</span></td><td><button class="text-[#d292f4]" @click="router.push(`/cases/${item.id}`)">查看</button></td></tr><tr v-if="expanded.includes(item.id)" class="bg-[#17181d]"><td colspan="10" class="p-0"><div v-if="!caseWsis(item.id).length" class="px-16 py-5 text-sm text-[#64748b]">当前 Case 暂无关联 WSI。</div><div v-else class="grid gap-2 px-16 py-4"><button v-for="wsi in caseWsis(item.id)" :key="wsi.id" class="flex items-center justify-between rounded-md border border-white/[0.06] bg-[#202126] px-3 py-2 text-left" @click="router.push(`/workbench/wsi?preview=${wsi.id}`)"><span class="flex items-center gap-2"><img src="/wsi-demo.jpg" alt="WSI" class="h-8 w-12 rounded object-cover" /><span><b class="block font-mono text-xs">{{ wsi.fileName }}</b><small class="text-[#64748b]">{{ wsi.stain }} · {{ wsi.size }}</small></span></span><span class="text-xs text-[#d292f4]">查看 WSI</span></button></div></td></tr></tbody></table></div></section>

    <Teleport to="body"><div v-if="createOpen" class="fixed inset-0 z-[130] grid place-items-center bg-black/75 px-4" @click.self="createOpen=false"><form class="w-full max-w-[620px] rounded-lg border border-white/[0.10] bg-[#202126]" @submit.prevent="createCase"><header class="flex items-center justify-between border-b border-white/[0.08] p-5"><div><h2 class="text-lg font-semibold">新增 Case</h2><p class="mt-1 text-xs">创建后可继续关联已有或新上传的 WSI。</p></div><button type="button" class="text-[#94a3b8]" @click="createOpen=false"><X :size="19" /></button></header><div class="grid gap-4 p-5 sm:grid-cols-2"><label class="field sm:col-span-2">Case 编号 *<input v-model="newCase.id" placeholder="例如 S-20260820-0001" /></label><label class="field">取材部位<select v-model="newCase.site"><option v-for="item in PATHOLOGY_SITE_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option></select></label><label class="field">取材方式<select v-model="newCase.samplingMethod"><option v-for="item in SAMPLING_METHOD_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option></select></label><label class="field">年龄段<select v-model="newCase.ageGroup"><option>0-18</option><option>19-40</option><option>41-60</option><option>61+</option></select></label><label class="field">性别<select v-model="newCase.sex"><option>未知</option><option>男</option><option>女</option></select></label><label class="field sm:col-span-2">备注<textarea v-model="newCase.remark" placeholder="可选" /></label><p v-if="error" class="sm:col-span-2 text-sm text-[#ff9c9c]">{{ error }}</p></div><footer class="flex justify-end gap-2 border-t border-white/[0.08] p-4"><button type="button" class="btn-secondary" @click="createOpen=false">取消</button><button class="btn-primary" type="submit">创建 Case</button></footer></form></div></Teleport>
  </div>
</template>

<style scoped>
th,td{padding:11px 12px;text-align:left}th{color:#cbd5e1;font-weight:600}.field{display:grid;gap:7px;color:#cbd5e1;font-size:13px}.field input,.field select,.field textarea{border:1px solid rgb(255 255 255 / .08);border-radius:6px;background:#17181d;padding:9px 10px;color:#e2e8f0;outline:none}.field textarea{min-height:74px;resize:vertical}
</style>
