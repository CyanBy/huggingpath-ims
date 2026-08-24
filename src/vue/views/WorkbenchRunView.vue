<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Layers, Maximize2, Play, RotateCcw, Search, Settings, Square, ZoomIn } from '@lucide/vue'
import {
  AVAILABLE_ANALYSIS_MODELS,
  deletePendingObject,
  getObjectRuns,
  isModelCompatible,
  reanalyzeAnalysisObject,
  reanalyzeTask,
  setObjectModelSelection,
  startAnalysisTask,
  stopAnalysisObject,
  stopAnalysisTask,
  type AnalysisModelRunRecord,
  type AnalysisTaskObjectRecord,
  type AnalysisTaskStatus,
} from '@/lib/analysisTasks'
import { useAnalysisTasks } from '../composables/useAnalysisTasks'

const route = useRoute()
const router = useRouter()
const { tasks, refresh } = useAnalysisTasks(true)
const taskId = computed(() => String(route.params.taskId || ''))
const task = computed(() => tasks.value.find((item) => item.id === taskId.value) || null)
const selectedId = ref('')
const search = ref('')
const zoom = ref(20)
const showGroundTruth = ref(true)
const showResult = ref(true)
const opacity = ref(70)
const hoveredProgressId = ref('')
const progressPopover = ref({ left: 0, top: 0 })
const selectedObject = computed(() => task.value?.objects.find((item) => item.id === selectedId.value) || task.value?.objects[0] || null)
const runs = computed(() => task.value && selectedObject.value ? getObjectRuns(task.value, selectedObject.value.id) : [])
const filteredObjects = computed(() => {
  const query = search.value.trim().toLowerCase()
  return task.value?.objects.filter((item) => !query || `${item.name} ${item.meta} ${item.caseName || ''} ${item.projectName || ''} ${item.status}`.toLowerCase().includes(query)) || []
})
const taskProgress = computed(() => {
  if (!task.value?.models.length) return 0
  return Math.round(task.value.models.reduce((total, run) => total + runProgress(run), 0) / task.value.models.length)
})

watch(task, (value) => {
  if (!value) return
  if (!value.objects.some((item) => item.id === selectedId.value)) selectedId.value = value.objects[0]?.id || ''
}, { immediate: true })
function runProgress(run: AnalysisModelRunRecord) { return run.status === '分析完成' ? 100 : Math.max(0, Math.min(100, run.progress ?? 0)) }
function objectProgress(item: AnalysisTaskObjectRecord) {
  if (!task.value) return null
  const objectRuns = getObjectRuns(task.value, item.id)
  return objectRuns.length ? Math.round(objectRuns.reduce((total, run) => total + runProgress(run), 0) / objectRuns.length) : null
}
function showProgressDetails(event: MouseEvent, item: AnalysisTaskObjectRecord) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const sidebarRight = target.closest('aside')?.getBoundingClientRect().right ?? rect.right
  hoveredProgressId.value = item.id
  progressPopover.value = {
    left: Math.min(window.innerWidth - 304, Math.max(rect.right, sidebarRight) + 12),
    top: Math.max(72, rect.top - 8),
  }
}
function hideProgressDetails() { hoveredProgressId.value = '' }
function statusClass(status: AnalysisTaskStatus) {
  return { '待分析': 'border-[#8f35b7]/45 bg-[#8f35b7]/15 text-[#d292f4]', '排队中': 'border-[#8f35b7]/45 bg-[#8f35b7]/15 text-[#d292f4]', '正在分析': 'border-[#eab65b]/40 bg-[#eab65b]/10 text-[#f4c577]', '分析完成': 'border-[#84cc16]/35 bg-[#84cc16]/10 text-[#95d94e]', '失败': 'border-[#ff9c9c]/45 bg-[#ff9c9c]/10 text-[#ffb4b4]', '已停止': 'border-[#64748b]/45 bg-[#64748b]/10 text-[#cbd5e1]' }[status]
}
function objectAction(item: AnalysisTaskObjectRecord) {
  if (!task.value) return
  if (['正在分析','排队中'].includes(item.status)) stopAnalysisObject(task.value.id, item.id)
  else if (['分析完成','失败','已停止'].includes(item.status)) reanalyzeAnalysisObject(task.value.id, item.id)
  refresh()
}
function deleteObject(item: AnalysisTaskObjectRecord) {
  if (!task.value) return
  const result = deletePendingObject(task.value.id, item.id)
  refresh()
  if (!result) router.replace('/workbench/tasks')
}
function toggleModel(modelId: string) {
  if (!task.value || !selectedObject.value || task.value.modelLocked) return
  setObjectModelSelection(task.value.id, selectedObject.value.id, modelId); refresh()
}
function startOrRestart() {
  if (!task.value) return
  if (task.value.status === '待分析') startAnalysisTask(task.value.id)
  else if (['分析完成','失败','已停止'].includes(task.value.status)) reanalyzeTask(task.value.id)
  refresh()
}
function stopAll() { if (task.value) { stopAnalysisTask(task.value.id); refresh() } }
</script>

<template>
  <div v-if="task" class="grid h-[calc(100dvh-64px)] grid-cols-[340px_minmax(0,1fr)_320px] overflow-hidden bg-[#0f1014] text-[#e2e8f0]">
    <aside class="flex min-h-0 flex-col border-r border-white/[0.08] bg-[#202126]">
      <div class="border-b border-white/[0.08] p-3"><button class="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#8f35b7]/55 bg-[#8f35b7]/10 font-medium text-[#e8b8f8] hover:bg-[#8f35b7]/18" @click="router.push('/workbench/tasks')"><ArrowLeft :size="17" />返回分析任务列表</button><div class="mt-3 flex items-start justify-between gap-3"><h1 class="min-w-0 truncate text-lg font-semibold" :title="task.taskName">{{ task.taskName }}</h1><span :class="['shrink-0 rounded-md border px-2 py-1 text-xs',statusClass(task.status)]">{{ task.status }}</span></div><div class="mt-2 flex items-center justify-between border-t border-white/[0.06] pt-3"><span class="text-sm text-[#94a3b8]">{{ task.objects.length }} 张 WSI</span><button v-if="['正在分析','排队中'].includes(task.status)" class="rounded-md border border-[#eab65b]/40 bg-[#eab65b]/10 px-2.5 py-1 text-xs text-[#f4c577]" @click="stopAll"><Square :size="11" class="mr-1 inline fill-current" />停止全部</button></div></div>
      <div class="border-b border-white/[0.08] p-3"><label class="flex h-10 items-center gap-2 rounded-md border border-white/[0.08] bg-[#17181d] px-3"><Search :size="16" class="text-[#64748b]" /><input v-model="search" class="w-full bg-transparent text-sm outline-none" placeholder="搜索 WSI / Case / 部位 / 染色" /></label></div>
      <div class="min-h-0 flex-1 space-y-2 overflow-y-auto p-3"><article v-for="item in filteredObjects" :key="item.id" :class="['rounded-lg border p-3 transition',selectedObject?.id===item.id?'border-[#8f35b7] bg-[#8f35b7]/7':'border-white/[0.08] bg-[#17181d] hover:border-white/[0.14]']" @click="selectedId=item.id"><div class="flex gap-3"><img src="/wsi-demo.jpg" alt="WSI" class="h-10 w-16 shrink-0 rounded object-cover" /><div class="min-w-0"><b class="block truncate text-sm" :title="item.name">{{ item.name }}</b><small class="mt-1 block text-[#748095]">{{ item.meta }}</small></div></div><div v-if="objectProgress(item)!==null" class="mt-3 border-t border-white/[0.06] pt-2" @mouseenter="showProgressDetails($event,item)" @mouseleave="hideProgressDetails"><div class="flex justify-between text-xs text-[#748095]"><span>分析进度</span><span>{{ objectProgress(item) }}%</span></div><div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#353740]"><div class="h-full rounded-full bg-[#9c36c7]" :style="{width:`${objectProgress(item)}%`}" /></div></div><div class="mt-3 flex items-center justify-between"><span :class="['rounded-md border px-2 py-1 text-xs',statusClass(item.status)]">{{ item.status }}</span><div class="flex gap-2"><button v-if="['待分析','已停止'].includes(item.status)" class="text-xs text-[#ff9c9c]" @click.stop="deleteObject(item)">删除</button><button v-if="item.status!=='待分析'" class="text-xs text-[#f4c577]" @click.stop="objectAction(item)">{{ ['正在分析','排队中'].includes(item.status)?'停止':'重新分析' }}</button></div></div></article></div>
      <div class="border-t border-white/[0.08] p-3"><div class="mb-2 flex justify-between text-xs text-[#748095]"><span>{{ task.objects.filter(item=>item.modelIds.length).length }}/{{ task.objects.length }} 张 WSI 已配置模型</span><span>{{ taskProgress }}%</span></div><button v-if="!['正在分析','排队中'].includes(task.status)" :disabled="!task.models.length" class="btn-primary h-10 w-full disabled:opacity-40" @click="startOrRestart"><Play :size="16" />{{ task.status==='待分析'?'开始分析':'重新分析任务' }}</button></div>
    </aside>

    <main class="relative min-w-0 overflow-hidden bg-[#111217]"><div class="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-white/[0.08] bg-[#202126]/95 p-1 shadow-lg"><span class="px-2 text-xs font-semibold text-[#94a3b8]">{{ zoom }}X</span><button v-for="value in [0.5,1,4,10,20,40,80]" :key="value" :class="['viewer-button',zoom===value&&'active']" @click="zoom=value">{{ value }}X</button><button class="viewer-button" title="放大" @click="zoom=Math.min(80,zoom+5)"><ZoomIn :size="15" /></button><button class="viewer-button" title="重置" @click="zoom=20"><RotateCcw :size="15" /></button><button class="viewer-button" title="全屏"><Maximize2 :size="15" /></button><button class="viewer-button" title="设置"><Settings :size="15" /></button></div><div class="grid h-full place-items-center p-16"><div class="relative transition-transform duration-200" :style="{transform:`scale(${Math.max(.65,Math.min(1.5,zoom/20))})`}"><img src="/wsi-demo.jpg" alt="当前 WSI" class="max-h-[52vh] max-w-[50vw] rounded-md border border-[#1b5361] object-contain shadow-2xl" /><div v-if="showResult&&runs.some(run=>run.status==='分析完成')" class="pointer-events-none absolute inset-[20%] rounded-[48%] border-2 border-[#d946ef] bg-[#d946ef]/20" :style="{opacity:opacity/100}" /></div></div><div class="absolute bottom-4 left-5 flex items-center gap-4 text-xs text-[#64748b]"><span class="border-t-2 border-[#94a3b8] pt-1">500 μm</span><span>{{ selectedObject?.name }}</span><span>AI 工作台 · 当前 WSI</span></div></main>

    <aside class="min-h-0 overflow-y-auto border-l border-white/[0.08] bg-[#202126] p-4"><header class="border-b border-white/[0.08] pb-4"><h2 class="text-lg font-semibold">分析结果</h2><p class="mt-1 text-sm">当前 WSI 的模型输出与图层</p></header><div class="py-4"><div v-if="!runs.length" class="rounded-lg border border-dashed border-white/[0.10] p-6 text-center text-sm text-[#64748b]">当前 WSI 尚未配置分析模型。</div><article v-for="run in runs" :key="run.id" class="mb-3 rounded-lg border border-white/[0.08] bg-[#17181d] p-3"><div class="flex items-start justify-between gap-2"><div><b class="text-sm">{{ run.name }}</b><p class="mt-1 text-xs">{{ run.desc }}</p></div><span :class="['rounded border px-2 py-1 text-xs',statusClass(run.status)]">{{ run.status }}</span></div><div class="mt-3 flex justify-between text-xs text-[#748095]"><span>分析进度</span><span>{{ runProgress(run) }}%</span></div><div class="mt-1.5 h-1.5 rounded-full bg-[#353740]"><div class="h-full rounded-full bg-[#9c36c7]" :style="{width:`${runProgress(run)}%`}" /></div><div v-if="run.status==='分析完成'" class="mt-3 grid grid-cols-2 gap-2 text-xs"><span class="result-metric">检测细胞 <b>2,456</b></span><span class="result-metric">平均置信度 <b>94%</b></span></div></article></div><section class="border-t border-white/[0.08] pt-4"><h3 class="mb-3 flex items-center gap-2 font-semibold"><Layers :size="16" />图层控制</h3><div class="grid gap-3 text-sm"><label class="flex items-center justify-between">真实 WSI 标注<input v-model="showGroundTruth" type="checkbox" /></label><label class="flex items-center justify-between">分析结果标注<input v-model="showResult" type="checkbox" /></label><label><span class="mb-2 flex justify-between text-[#94a3b8]">叠加透明度 <b>{{ opacity }}%</b></span><input v-model="opacity" type="range" min="0" max="100" class="w-full accent-[#9c36c7]" /></label></div></section><section v-if="selectedObject&&!task.modelLocked&&selectedObject.status==='待分析'" class="mt-5 border-t border-white/[0.08] pt-4"><h3 class="font-semibold">分析模型</h3><p class="mt-1 text-xs">为当前 WSI 选择模型。</p><div class="mt-3 grid gap-2"><button v-for="model in AVAILABLE_ANALYSIS_MODELS" :key="model.id" :disabled="!isModelCompatible(model,selectedObject.stain)" :class="['model-option',selectedObject.modelIds.includes(model.id)&&'active']" @click="toggleModel(model.id)"><span><b>{{ model.name }}</b><small>{{ model.desc }}</small></span><span>{{ !isModelCompatible(model,selectedObject.stain)?'不适用':selectedObject.modelIds.includes(model.id)?'已选':'可选' }}</span></button></div></section></aside>

    <Teleport to="body">
      <div v-if="hoveredProgressId" class="pointer-events-none fixed z-[220] w-[292px] rounded-md border border-white/[0.12] bg-[#111217]/98 p-3 shadow-[0_18px_48px_rgba(0,0,0,.55)]" :style="{ left: `${progressPopover.left}px`, top: `${progressPopover.top}px` }">
        <div class="mb-2 text-xs font-semibold text-[#cbd5e1]">模型分析进度</div>
        <div v-for="run in getObjectRuns(task,hoveredProgressId)" :key="run.id" class="mb-2.5 last:mb-0">
          <div class="flex items-center justify-between gap-3 text-xs"><span class="min-w-0 truncate text-[#e2e8f0]">{{ run.name }}</span><span class="shrink-0 text-[#94a3b8]">{{ run.status }} · {{ runProgress(run) }}%</span></div>
          <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#353740]"><div class="h-full rounded-full bg-[#9c36c7]" :style="{width:`${runProgress(run)}%`}" /></div>
        </div>
      </div>
    </Teleport>
  </div>
  <div v-else class="section-container grid min-h-[60dvh] place-items-center"><div class="text-center"><h1 class="text-xl font-semibold">分析任务不存在或已清空</h1><p class="mt-2">返回任务列表选择其他任务。</p><button class="btn-primary mt-5" @click="router.replace('/workbench/tasks')">返回分析任务列表</button></div></div>
</template>

<style scoped>
.viewer-button{display:grid;min-width:32px;height:32px;place-items:center;border-radius:5px;padding:0 7px;color:#94a3b8;font-size:12px}.viewer-button:hover,.viewer-button.active{background:#9c36c7;color:white}.result-metric{display:grid;gap:3px;border:1px solid rgb(255 255 255 / .07);border-radius:5px;padding:8px;color:#748095}.result-metric b{color:#e2e8f0}.model-option{display:flex;min-height:52px;align-items:center;justify-content:space-between;border:1px solid rgb(255 255 255 / .08);border-radius:6px;background:#17181d;padding:8px 10px;text-align:left;color:#94a3b8}.model-option b,.model-option small{display:block}.model-option b{color:#cbd5e1;font-size:13px}.model-option small{margin-top:2px;color:#64748b;font-size:11px}.model-option.active{border-color:rgb(143 53 183 / .65);background:rgb(143 53 183 / .17);color:#d292f4}.model-option:disabled{cursor:not-allowed;opacity:.35}
</style>
