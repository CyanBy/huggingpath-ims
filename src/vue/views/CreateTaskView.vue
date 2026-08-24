<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Database, FileText, FolderOpen, Play, Search, Upload } from '@lucide/vue'
import { createTaskFromSelection } from '@/lib/analysisTasks'
import type { AnalysisTargetType, AnalysisTaskSelection } from '@/lib/analysisSelection'
import { getCatalogModel, MODEL_CATALOG } from '@/lib/modelCatalog'
import { getPathologySiteLabel } from '@/lib/pathologySpecimens'
import { useWorkspaceData } from '../composables/useWorkspaceData'

const route = useRoute()
const router = useRouter()
const { wsis, cases, projects } = useWorkspaceData()
const target = ref<AnalysisTargetType>(['wsi','case','project'].includes(String(route.query.target)) ? route.query.target as AnalysisTargetType : 'wsi')
const modelId = ref(typeof route.query.model === 'string' ? route.query.model : MODEL_CATALOG[0]?.id || '')
const keyword = ref('')
const selectedWsiIds = ref<string[]>([])
const selectedCaseIds = ref<string[]>([])
const selectedProjectIds = ref<string[]>([])
const model = computed(() => getCatalogModel(modelId.value))
const filteredWsis = computed(() => wsis.value.filter((item) => !keyword.value || `${item.fileName} ${item.boundCase} ${item.site} ${item.stain}`.toLowerCase().includes(keyword.value.toLowerCase())))
const filteredCases = computed(() => cases.value.filter((item) => !keyword.value || `${item.id} ${item.site} ${item.remark}`.toLowerCase().includes(keyword.value.toLowerCase())))
const filteredProjects = computed(() => projects.value.filter((item) => !keyword.value || `${item.id} ${item.name} ${item.tags.join(' ')}`.toLowerCase().includes(keyword.value.toLowerCase())))
const selectedCount = computed(() => target.value === 'wsi' ? selectedWsiIds.value.length : target.value === 'case' ? selectedCaseIds.value.length : selectedProjectIds.value.length)

onMounted(() => {
  try {
    const stored = JSON.parse(sessionStorage.getItem('huggingpath.workbench.wsiSelection.v1') || '[]')
    if (Array.isArray(stored)) selectedWsiIds.value = stored.filter((id) => wsis.value.some((item) => item.id === id))
  } catch { selectedWsiIds.value = [] }
})
function toggle(list: string[], id: string) { return list.includes(id) ? list.filter((item) => item !== id) : [...list, id] }
function goUpload() {
  router.push({ path: '/workbench/wsi', query: { upload: '1', returnTo: route.fullPath } })
}
function confirm() {
  if (!model.value || !selectedCount.value) return
  const selectedWsis = wsis.value.filter((item) => selectedWsiIds.value.includes(item.id))
  const selectedCases = cases.value.filter((item) => selectedCaseIds.value.includes(item.id))
  const selectedProjects = projects.value.filter((item) => selectedProjectIds.value.includes(item.id))
  const selection: AnalysisTaskSelection = {
    targetType: target.value,
    wsiSource: 'existing',
    selectedWsiItems: selectedWsis.map((item) => ({ id: item.id, name: item.fileName, organ: item.site, stain: item.stain, size: item.size, caseId: item.boundCase === '未绑定' ? undefined : item.boundCase, uploadedAt: item.uploadedAt })),
    uploadRows: [],
    selectedCaseItems: selectedCases.map((item) => ({ id: item.id, name: item.id, organ: item.site, wsiCount: wsis.value.filter((wsi) => wsi.boundCase === item.id).length, createdAt: item.id.slice(2, 10), wsis: wsis.value.filter((wsi) => wsi.boundCase === item.id).map((wsi) => ({ id: wsi.id, name: wsi.fileName, organ: wsi.site, stain: wsi.stain, magnification: '40X', size: wsi.size })) })),
    selectedProjectItems: selectedProjects.map((item) => ({ id: item.id, name: item.name, caseCount: item.caseIds.length, wsiCount: wsis.value.filter((wsi) => item.standaloneWsiIds.includes(wsi.id) || item.caseIds.includes(wsi.boundCase)).length, memberCount: item.memberCount, cases: cases.value.filter((caseItem) => item.caseIds.includes(caseItem.id)).map((caseItem) => ({ id: caseItem.id, name: caseItem.id, organ: caseItem.site, wsiCount: wsis.value.filter((wsi) => wsi.boundCase === caseItem.id).length, createdAt: '', wsis: wsis.value.filter((wsi) => wsi.boundCase === caseItem.id).map((wsi) => ({ id: wsi.id, name: wsi.fileName, organ: wsi.site, stain: wsi.stain, magnification: '40X', size: wsi.size })) })), standaloneWsis: wsis.value.filter((wsi) => item.standaloneWsiIds.includes(wsi.id)).map((wsi) => ({ id: wsi.id, name: wsi.fileName, organ: wsi.site, stain: wsi.stain, magnification: '40X', size: wsi.size })) })),
    modelId: model.value.id,
    modelName: model.value.name,
  }
  const task = createTaskFromSelection({ sourceType: 'model_center', sourceLabel: '模型中心', selectedModel: { id: model.value.id, name: model.value.name }, selection })
  router.push(`/workbench/run/${task.id}`)
}
</script>

<template>
  <div class="min-h-[calc(100dvh-64px)] px-4 py-6 lg:px-6"><button class="mb-4 text-sm text-[#d292f4]" @click="router.push('/explore')">返回模型中心</button><header class="mb-5"><h1 class="text-2xl font-bold">创建分析任务</h1><p class="mt-1 text-sm">运行模型：<span class="text-[#d292f4]">{{ model?.name || '请选择模型' }}</span>，选择分析对象后进入工作台配置并启动分析。</p></header><section class="overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]"><div class="grid gap-4 border-b border-white/[0.08] p-5 lg:grid-cols-[320px_1fr]"><label class="field">分析模型<select v-model="modelId"><option v-for="item in MODEL_CATALOG" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><div><span class="mb-2 block text-sm font-medium text-[#cbd5e1]">分析对象</span><div class="grid grid-cols-3 gap-2"><button v-for="item in [{key:'wsi',label:'WSI 切片',icon:FileText},{key:'case',label:'Case 病例',icon:FolderOpen},{key:'project',label:'研究项目',icon:Database}]" :key="item.key" :class="['target-button',target===item.key&&'active']" @click="target=item.key as AnalysisTargetType;keyword='' "><component :is="item.icon" :size="17" />{{ item.label }}</button></div></div></div><div class="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] p-4"><div><h2 class="font-semibold">{{ target==='wsi'?'选择已有 WSI':target==='case'?'选择 Case':'选择研究项目' }}</h2><p class="mt-1 text-xs">支持多选，已选择 {{ selectedCount }} 项。</p></div><div class="flex gap-2"><label class="flex h-9 items-center gap-2 rounded-md border border-white/[0.08] bg-[#17181d] px-3"><Search :size="15" class="text-[#64748b]" /><input v-model="keyword" class="w-[240px] bg-transparent text-sm outline-none" placeholder="搜索当前列表" /></label><button v-if="target==='wsi'" class="btn-secondary h-9" @click="goUpload"><Upload :size="15" />上传 WSI</button></div></div>
      <div v-if="target==='wsi'" class="max-h-[480px] overflow-auto"><button v-for="item in filteredWsis" :key="item.id" :class="['selection-row',selectedWsiIds.includes(item.id)&&'active']" @click="selectedWsiIds=toggle(selectedWsiIds,item.id)"><input type="checkbox" :checked="selectedWsiIds.includes(item.id)" tabindex="-1" /><img src="/wsi-demo.jpg" alt="WSI" class="h-10 w-16 rounded object-cover" /><span class="min-w-0 flex-1 text-left"><b class="block truncate font-mono text-sm">{{ item.fileName }}</b><small class="text-[#64748b]">{{ getPathologySiteLabel(item.site) }} · {{ item.stain }} · {{ item.boundCase }}</small></span><span class="text-xs text-[#94a3b8]">{{ item.size }}</span></button></div>
      <div v-else-if="target==='case'" class="max-h-[480px] overflow-auto"><button v-for="item in filteredCases" :key="item.id" :class="['selection-row',selectedCaseIds.includes(item.id)&&'active']" @click="selectedCaseIds=toggle(selectedCaseIds,item.id)"><input type="checkbox" :checked="selectedCaseIds.includes(item.id)" tabindex="-1" /><span class="grid h-10 w-10 place-items-center rounded bg-[#8f35b7]/10 text-[#d292f4]"><FolderOpen :size="19" /></span><span class="flex-1 text-left"><b class="font-mono">{{ item.id }}</b><small class="block text-[#64748b]">{{ getPathologySiteLabel(item.site) }} · {{ wsis.filter(wsi=>wsi.boundCase===item.id).length }} 张 WSI</small></span></button></div>
      <div v-else class="max-h-[480px] overflow-auto"><button v-for="item in filteredProjects" :key="item.id" :class="['selection-row',selectedProjectIds.includes(item.id)&&'active']" @click="selectedProjectIds=toggle(selectedProjectIds,item.id)"><input type="checkbox" :checked="selectedProjectIds.includes(item.id)" tabindex="-1" /><span class="grid h-10 w-10 place-items-center rounded bg-[#8f35b7]/10 text-[#d292f4]"><Database :size="19" /></span><span class="flex-1 text-left"><b>{{ item.name }}</b><small class="block text-[#64748b]">{{ item.id }} · {{ item.caseIds.length }} 个 Case</small></span></button></div>
      <footer class="flex items-center justify-between border-t border-white/[0.08] p-4"><span class="text-sm text-[#94a3b8]">已选择 {{ selectedCount }} 项，模型将在任务中锁定。</span><button :disabled="!selectedCount" class="btn-primary disabled:opacity-40" @click="confirm"><Play :size="16" />加入工作台</button></footer></section></div>
</template>

<style scoped>
.field{display:grid;gap:8px;color:#cbd5e1;font-size:14px}.field select{height:40px;border:1px solid rgb(255 255 255 / .08);border-radius:6px;background:#17181d;padding:0 10px;color:#e2e8f0}.target-button{display:flex;height:40px;align-items:center;justify-content:center;gap:7px;border:1px solid rgb(255 255 255 / .08);border-radius:6px;background:#17181d;color:#94a3b8;font-size:14px}.target-button.active{border-color:rgb(143 53 183 / .65);background:rgb(143 53 183 / .16);color:#d292f4}.selection-row{display:flex;width:100%;align-items:center;gap:12px;border-bottom:1px solid rgb(255 255 255 / .06);padding:12px 16px;color:#cbd5e1}.selection-row:hover{background:rgb(255 255 255 / .025)}.selection-row.active{background:rgb(143 53 183 / .10)}
</style>
