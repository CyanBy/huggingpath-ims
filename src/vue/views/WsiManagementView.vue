<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertTriangle, Ban, ChevronLeft, ChevronRight, CloudUpload, Database, FileImage, Plus, RefreshCw, Search, Trash2, Upload, X } from '@lucide/vue'
import { configureAndStartAnalysisTask, countWsiSuccessfulAnalyses, createTaskFromWsis, getWsiAnalysisHistory, type AnalysisTaskStatus } from '@/lib/analysisTasks'
import type { AnalysisConfigurationItem, AnalysisModelAssignments } from '@/lib/analysisConfiguration'
import { enqueueWsiTransfers, type UploadTransferItem } from '@/lib/uploadTransferQueue'
import { deleteWsiWithScope, getWsiDeletionImpact, hasWsiRelationship, type PathologyDeletionScope } from '@/lib/pathologyEntityLinks'
import { getCaseSpecimenProfile, getPathologySiteLabel, getSamplingMethodLabel, PATHOLOGY_SITE_OPTIONS, SAMPLING_METHOD_OPTIONS } from '@/lib/pathologySpecimens'
import { useAnalysisTasks } from '../composables/useAnalysisTasks'
import { useWorkspaceData } from '../composables/useWorkspaceData'
import { useUploadTransfers } from '../composables/useUploadTransfers'
import type { WorkspaceWsi } from '../data/pathologyWorkspace'
import SearchableSelect from '../components/SearchableSelect.vue'
import AnalysisConfigurationModal from '../components/AnalysisConfigurationModal.vue'

type PendingRow = WorkspaceWsi & { source: 'file' | 'dicom-series'; dicomPath?: string; dicomInstanceCount?: number }
type CurrentAnalysis = { taskId: string; status: AnalysisTaskStatus; progress?: number }
type WsiListRow = WorkspaceWsi & { transfer?: UploadTransferItem }

const router = useRouter()
const route = useRoute()
const { wsis, cases, refresh } = useWorkspaceData()
const { transfers, cancelTransfer, retryTransfer, removeTransfer } = useUploadTransfers()
const { tasks } = useAnalysisTasks()
const keyword = ref('')
const selectedIds = ref<string[]>([])
const analysisWsis = ref<WorkspaceWsi[]>([])
const existingAnalysisTaskId = ref<string | null>(null)
const previewId = ref<string | null>(null)
const deleteTarget = ref<WorkspaceWsi | null>(null)
const deleteScope = ref<PathologyDeletionScope>('wsi')
const uploadOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const folderInput = ref<HTMLInputElement | null>(null)
const pending = ref<PendingRow[]>([])
const bulkSite = ref('')
const bulkSampling = ref('')
const bulkStain = ref('')
const bulkCase = ref('')
const dicomSummary = ref<{ series: number; instances: number; ignored: number } | null>(null)
const stains = ['HE', 'IHC', 'PAS', 'Ki67', 'HER2']

const transferRows = computed<WsiListRow[]>(() => transfers.value
  .filter((item) => item.status !== '已完成')
  .map((item) => ({ ...item.wsi, transfer: item })))
const listedRows = computed<WsiListRow[]>(() => {
  const transferWsiIds = new Set(transferRows.value.map((item) => item.id))
  return [...transferRows.value, ...wsis.value.filter((item) => !transferWsiIds.has(item.id))]
})
const filtered = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return listedRows.value.filter((item) => !query || `${item.fileName} ${item.site} ${getPathologySiteLabel(item.site)} ${item.stain} ${item.boundCase} ${item.transfer?.status || ''}`.toLowerCase().includes(query))
})
const readyFiltered = computed(() => filtered.value.filter((item) => !item.transfer))
const selected = computed(() => wsis.value.filter((item) => selectedIds.value.includes(item.id)))
const analysisConfigurationItems = computed<AnalysisConfigurationItem[]>(() => {
  const existingTask = existingAnalysisTaskId.value ? tasks.value.find((task) => task.id === existingAnalysisTaskId.value) : null
  if (existingTask) return existingTask.objects.map((item) => ({ id: item.id, name: item.name, organ: item.organ || '', stain: item.stain || '', size: item.size || '', caseId: item.caseId, caseName: item.caseName, projectId: item.projectId, projectName: item.projectName }))
  return analysisWsis.value.map((item) => ({ id: item.id, name: item.fileName, organ: item.site, stain: item.stain, size: item.size, caseId: item.boundCase === '未绑定' ? undefined : item.boundCase, caseName: item.boundCase === '未绑定' ? undefined : item.boundCase }))
})
const allSelected = computed(() => readyFiltered.value.length > 0 && readyFiltered.value.every((item) => selectedIds.value.includes(item.id)))
const previewIndex = computed(() => readyFiltered.value.findIndex((item) => item.id === previewId.value))
const preview = computed(() => previewIndex.value >= 0 ? readyFiltered.value[previewIndex.value] : null)
const incomplete = computed(() => pending.value.filter((item) => !item.site || !item.samplingMethod || !item.stain).length)
const canImport = computed(() => pending.value.length > 0 && incomplete.value === 0)
const storage = computed(() => wsis.value.reduce((total, item) => total + (item.size.includes('GB') ? Number.parseFloat(item.size) : Number.parseFloat(item.size) / 1024), 0).toFixed(1))
const bulkSiteOptions = computed(() => [{ value: '', label: '不批量修改部位' }, ...PATHOLOGY_SITE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))])
const bulkCaseOptions = computed(() => [{ value: '', label: '不批量修改 Case' }, { value: '未绑定', label: '未绑定' }, ...cases.value.map((item) => ({ value: item.id, label: item.id, description: `${getPathologySiteLabel(item.site)} · ${getSamplingMethodLabel(item.samplingMethod)}` }))])

const currentAnalyses = computed(() => {
  const map = new Map<string, CurrentAnalysis>()
  const priority: Record<AnalysisTaskStatus, number> = { '正在分析': 5, '排队中': 4, '待分析': 3, '失败': 2, '已停止': 1, '分析完成': 0 }
  for (const task of tasks.value) for (const object of task.objects) {
    const run = task.models.find((item) => item.objectId === object.id && item.status === '正在分析')
    const candidate = { taskId: task.id, status: object.status, progress: run?.progress }
    const current = map.get(object.id)
    if (!current || priority[candidate.status] > priority[current.status]) map.set(object.id, candidate)
  }
  return map
})

function toggleRow(id: string) {
  selectedIds.value = selectedIds.value.includes(id) ? selectedIds.value.filter((item) => item !== id) : [...selectedIds.value, id]
}
function toggleAll() {
  if (allSelected.value) selectedIds.value = selectedIds.value.filter((id) => !readyFiltered.value.some((item) => item.id === id))
  else selectedIds.value = [...new Set([...selectedIds.value, ...readyFiltered.value.map((item) => item.id)])]
}
function rowClick(event: MouseEvent, id: string) {
  if (event.target instanceof Element && event.target.closest('button,a,input,select,label')) return
  if (transferRows.value.some((item) => item.id === id)) return
  toggleRow(id)
}
function statusText(item: WorkspaceWsi) {
  const current = currentAnalyses.value.get(item.id)
  if (!current) return '暂无任务'
  if (current.status === '正在分析') return `分析中 ${current.progress ?? 1}%`
  if (current.status === '待分析') return '待配置'
  return current.status
}
function primaryAction(item: WorkspaceWsi) {
  const history = getWsiAnalysisHistory(item.id, tasks.value)
  const latestCompleted = history.find((historyTask) => historyTask.models.some((run) => run.objectId === item.id && run.status === '分析完成'))
  if (latestCompleted) return router.push({ path: `/workbench/run/${latestCompleted.id}`, query: { object: item.id, historyScope: 'wsi' } })
  const latestTask = history[0]
  const latestObject = latestTask?.objects.find((object) => object.id === item.id)
  if (latestTask && latestObject?.status !== '待分析') return router.push({ path: `/workbench/run/${latestTask.id}`, query: { object: item.id, historyScope: 'wsi' } })
  if (latestTask && latestObject?.status === '待分析') {
    existingAnalysisTaskId.value = latestTask.id
    analysisWsis.value = []
    return
  }
  existingAnalysisTaskId.value = null
  analysisWsis.value = [item]
}
function startSelected() {
  if (!selected.value.length) return
  existingAnalysisTaskId.value = null
  analysisWsis.value = [...selected.value]
}
function launchConfigured(assignments: AnalysisModelAssignments) {
  const existingTask = existingAnalysisTaskId.value ? tasks.value.find((task) => task.id === existingAnalysisTaskId.value) : null
  const task = existingTask || (analysisWsis.value.length ? createTaskFromWsis({ wsis: analysisWsis.value.map((item) => ({ id: item.id, fileName: item.fileName, size: item.size, organPart: item.site, stain: item.stain, boundCase: item.boundCase })) }) : null)
  if (!task) return
  configureAndStartAnalysisTask(task.id, assignments)
  analysisWsis.value = []
  existingAnalysisTaskId.value = null
  selectedIds.value = []
  router.push(`/workbench/run/${task.id}`)
}
function closeAnalysisConfiguration() {
  analysisWsis.value = []
  existingAnalysisTaskId.value = null
}
function openCase(item: WorkspaceWsi) {
  if (item.boundCase === '未绑定') return
  router.push({ path: '/workbench/cases', query: { case: item.boundCase, from: 'wsi' } })
}
function requestDelete(item: WorkspaceWsi) {
  deleteTarget.value = item
  deleteScope.value = 'wsi'
}
function confirmDelete() {
  if (!deleteTarget.value) return
  deleteWsiWithScope(deleteTarget.value.id, deleteScope.value)
  selectedIds.value = selectedIds.value.filter((id) => id !== deleteTarget.value?.id)
  deleteTarget.value = null
  refresh()
}
function showPreview(item: WorkspaceWsi) { previewId.value = item.id }
function movePreview(direction: -1 | 1) {
  const next = previewIndex.value + direction
  if (next >= 0 && next < readyFiltered.value.length) previewId.value = readyFiltered.value[next].id
}

function transferTone(item: UploadTransferItem) {
  return ['上传失败', '已取消'].includes(item.status) ? 'failed' : 'active'
}

function inferStain(name: string) {
  const upper = name.toUpperCase()
  if (upper.includes('HER2')) return 'HER2'; if (upper.includes('KI67')) return 'Ki67'; if (upper.includes('IHC')) return 'IHC'; if (upper.includes('PAS')) return 'PAS'; if (upper.includes('HE')) return 'HE'; return ''
}
function fileSize(size: number) { return size >= 1024 ** 3 ? `${(size / 1024 ** 3).toFixed(1)} GB` : `${Math.max(1, Math.round(size / 1024 ** 2))} MB` }
function basePending(name: string, size: number, source: PendingRow['source']): PendingRow {
  const requestedCase = typeof route.query.case === 'string' && cases.value.some((item) => item.id === route.query.case) ? route.query.case : '未绑定'
  const profile = requestedCase === '未绑定' ? null : getCaseSpecimenProfile(requestedCase)
  return { id: `wsi-${crypto.randomUUID()}`, fileName: name, size: fileSize(size), site: profile?.site || '', samplingMethod: profile?.samplingMethod || '', stain: inferStain(name), boundCase: requestedCase, uploadedAt: new Date().toISOString().slice(0, 10), source }
}
function selectFiles(list: FileList | null) {
  if (!list) return
  pending.value.push(...Array.from(list).slice(0, 50 - pending.value.length).map((file) => basePending(file.name, file.size, 'file')))
  if (fileInput.value) fileInput.value.value = ''
}
function selectDicomFolder(list: FileList | null) {
  if (!list) return
  const files = Array.from(list)
  const dicom = files.filter((file) => file.name.toLowerCase().endsWith('.dcm'))
  const groups = new Map<string, File[]>()
  for (const file of dicom) {
    const path = file.webkitRelativePath || file.name
    const folder = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : 'DICOM'
    groups.set(folder, [...(groups.get(folder) || []), file])
  }
  const rows = [...groups.entries()].slice(0, 50 - pending.value.length).map(([path, group]) => {
    const row = basePending(`${path.split('/').pop() || 'DICOM'}_series.dcm`, group.reduce((total, file) => total + file.size, 0), 'dicom-series')
    return { ...row, dicomPath: path, dicomInstanceCount: group.length }
  })
  pending.value.push(...rows)
  dicomSummary.value = { series: groups.size, instances: dicom.length, ignored: files.length - dicom.length }
  if (folderInput.value) folderInput.value.value = ''
}
async function openUpload() {
  uploadOpen.value = true
  await nextTick()
  folderInput.value?.setAttribute('webkitdirectory', '')
  folderInput.value?.setAttribute('directory', '')
}
function closeUpload() { uploadOpen.value = false; pending.value = []; dicomSummary.value = null; bulkSite.value = ''; bulkSampling.value = ''; bulkStain.value = ''; bulkCase.value = '' }
function applyCase(row: PendingRow) {
  if (row.boundCase === '未绑定') return
  const profile = getCaseSpecimenProfile(row.boundCase)
  if (profile) { row.site = profile.site; row.samplingMethod = profile.samplingMethod }
}
function applyBulk() {
  pending.value = pending.value.map((row) => {
    const next = { ...row }
    if (bulkCase.value) next.boundCase = bulkCase.value
    if (bulkSite.value) next.site = bulkSite.value
    if (bulkSampling.value) next.samplingMethod = bulkSampling.value
    if (bulkStain.value) next.stain = bulkStain.value
    if (bulkCase.value && !bulkSite.value && !bulkSampling.value) applyCase(next)
    return next
  })
}
function confirmImport() {
  if (!canImport.value) return
  enqueueWsiTransfers(pending.value.map((item) => ({ ...item })))
  selectedIds.value = []
  const returnTo = typeof route.query.returnTo === 'string' ? route.query.returnTo : ''
  closeUpload()
  if (returnTo.startsWith('/') && !returnTo.startsWith('//')) router.push(returnTo)
}
onMounted(() => {
  sessionStorage.removeItem('huggingpath.workbench.wsiSelection.v1')
  const requestedPreview = typeof route.query.preview === 'string' ? route.query.preview : ''
  if (requestedPreview && wsis.value.some((item) => item.id === requestedPreview)) previewId.value = requestedPreview
  if (route.query.upload === '1') openUpload()
})
</script>

<template>
  <div class="min-h-[calc(100dvh-64px)] px-4 py-5 lg:px-6">
    <header class="mb-5 flex flex-wrap items-start justify-between gap-4"><div><h1 class="text-2xl font-bold">WSI 管理</h1><p class="mt-1 text-sm">集中管理已上传的 WSI，绑定 Case 或创建分析任务。</p></div><button class="btn-primary" @click="openUpload"><Plus :size="16" />上传 WSI</button></header>
    <div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><div v-for="item in [['WSI 总数',listedRows.length],['已绑定 Case',listedRows.filter(w=>w.boundCase!=='未绑定').length],['待绑定',listedRows.filter(w=>w.boundCase==='未绑定').length],['模拟存储占用',`${storage} GB`]]" :key="String(item[0])" class="rounded-lg border border-white/[0.08] bg-[#202126] p-4"><small class="text-[#64748b]">{{ item[0] }}</small><div class="mt-2 text-2xl font-bold">{{ item[1] }}</div></div></div>
    <section class="overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]">
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] p-4"><div><h2 class="font-semibold">WSI 文件列表</h2><p class="mt-1 text-xs">上传任务会先在列表中占位，完成后自动转为可分析的 WSI。</p></div><div class="flex flex-wrap gap-2"><label class="flex h-9 items-center gap-2 rounded-md border border-white/[0.08] bg-[#17181d] px-3"><Search :size="15" class="text-[#64748b]" /><input v-model="keyword" class="w-[240px] bg-transparent text-sm outline-none" placeholder="搜索 WSI 文件 / Case / 传输状态" /></label><button :disabled="!selected.length" class="btn-primary h-9 disabled:cursor-not-allowed disabled:opacity-40" @click="startSelected">配置并分析已选 WSI（{{ selected.length }}）</button></div></header>
      <div class="overflow-x-auto"><table class="w-full min-w-[1160px] text-sm">
        <thead class="bg-[#252730]"><tr><th class="w-12"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th><th>文件名</th><th>缩略图</th><th>文件大小</th><th>取材部位</th><th>取材方式</th><th>染色</th><th>绑定 Case</th><th>当前状态</th><th>分析次数</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="item in filtered" :key="item.transfer?.id || item.id" :class="['border-t border-white/[0.06]', item.transfer ? 'transfer-placeholder' : 'hover:bg-white/[0.025]', selectedIds.includes(item.id) && 'bg-[#8f35b7]/10']" @click="rowClick($event,item.id)">
            <td><input v-if="!item.transfer" type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleRow(item.id)" /><span v-else class="transfer-row-dot"><CloudUpload :size="15" /></span></td>
            <td><button v-if="!item.transfer" class="font-mono text-left text-[#d292f4]" @click="showPreview(item)">{{ item.fileName }}</button><div v-else><b class="font-mono text-[#cbd5e1]">{{ item.fileName }}</b><small class="mt-1 block text-[#7f8da1]">任务已创建，等待写入 WSI 数据</small></div></td>
            <td><button v-if="!item.transfer" class="h-10 w-16 overflow-hidden rounded border border-white/[0.08]" @click="showPreview(item)"><img src="/wsi-demo.jpg" alt="WSI 缩略图" class="h-full w-full object-cover" /></button><div v-else class="thumbnail-placeholder"><FileImage :size="18" /><span>生成中</span></div></td>
            <td>{{ item.size }}</td><td>{{ getPathologySiteLabel(item.site) }}</td><td>{{ getSamplingMethodLabel(item.samplingMethod) }}</td><td>{{ item.stain }}</td>
            <td><button :disabled="item.boundCase==='未绑定' || Boolean(item.transfer)" :class="item.boundCase==='未绑定' || item.transfer ? 'text-[#64748b]' : 'text-[#d292f4] hover:underline'" @click="openCase(item)">{{ item.boundCase }}</button></td>
            <td><template v-if="item.transfer"><div class="transfer-status"><div><span :class="['transfer-pill',transferTone(item.transfer)]">{{ item.transfer.status }}</span><strong>{{ item.transfer.progress }}%</strong></div><div class="transfer-progress"><i :class="transferTone(item.transfer)" :style="{width:`${item.transfer.progress}%`}" /></div></div></template><span v-else class="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs">{{ statusText(item) }}</span></td>
            <td>{{ item.transfer ? '—' : `${countWsiSuccessfulAnalyses(item.id,tasks)} 次` }}</td>
            <td><div v-if="item.transfer" class="flex gap-2 whitespace-nowrap"><button class="text-[#d292f4]" @click="router.push('/workbench/transfers')">传输详情</button><button v-if="['等待上传','上传中','文件处理中'].includes(item.transfer.status)" class="text-[#94a3b8]" @click="cancelTransfer(item.transfer.id)"><Ban :size="14" class="inline" /> 取消</button><button v-else-if="['上传失败','已取消'].includes(item.transfer.status)" class="text-[#d292f4]" @click="retryTransfer(item.transfer.id)"><RefreshCw :size="14" class="inline" /> 重试</button><button v-if="!['等待上传','上传中','文件处理中'].includes(item.transfer.status)" class="text-[#ff9c9c]" @click="removeTransfer(item.transfer.id)"><Trash2 :size="14" class="inline" /> 移除</button></div><div v-else class="flex gap-3 whitespace-nowrap"><button class="text-[#d292f4]" @click="showPreview(item)">查看</button><button class="text-[#d292f4]" @click="primaryAction(item)">{{ getWsiAnalysisHistory(item.id,tasks).length ? '查看分析' : '配置分析' }}</button><button class="text-[#ff9c9c]" @click="requestDelete(item)">删除</button></div></td>
          </tr>
        </tbody>
      </table></div>
    </section>

    <Teleport to="body">
      <div v-if="preview" class="fixed inset-0 z-[130] grid place-items-center bg-black/80 px-4" @click.self="previewId=null"><section class="w-full max-w-[900px] overflow-hidden rounded-lg border border-white/[0.10] bg-[#202126]"><header class="flex items-center justify-between border-b border-white/[0.08] p-4"><div><h2 class="font-semibold">{{ preview.fileName }}</h2><p class="mt-1 text-xs">{{ previewIndex+1 }} / {{ readyFiltered.length }} · {{ getPathologySiteLabel(preview.site) }} · {{ preview.stain }}</p></div><button class="icon-button" @click="previewId=null"><X :size="19" /></button></header><div class="relative grid min-h-[480px] place-items-center bg-[#0f1014] p-10"><img src="/wsi-demo.jpg" alt="WSI 预览" class="max-h-[440px] max-w-full object-contain" /><button class="nav-arrow left-4" :disabled="previewIndex<=0" @click="movePreview(-1)"><ChevronLeft :size="24" /></button><button class="nav-arrow right-4" :disabled="previewIndex>=readyFiltered.length-1" @click="movePreview(1)"><ChevronRight :size="24" /></button></div></section></div>
      <div v-if="deleteTarget" class="fixed inset-0 z-[140] grid place-items-center bg-black/75 px-4"><section class="w-full max-w-[520px] rounded-lg border border-white/[0.10] bg-[#202126]"><header class="flex items-center gap-3 border-b border-white/[0.07] p-5"><span class="grid h-9 w-9 place-items-center rounded-lg bg-[#ff9c9c]/10 text-[#ffb4b4]"><AlertTriangle :size="18" /></span><h2 class="font-semibold">删除 {{ deleteTarget.fileName }}</h2></header><div class="p-5"><p class="text-sm leading-6">{{ hasWsiRelationship(deleteTarget.id) ? '该 WSI 存在 Case 或研究项目关联，请选择删除范围。' : '该 WSI 没有关联对象，删除后将不再出现在列表中。' }}</p><div v-if="hasWsiRelationship(deleteTarget.id)" class="mt-4 grid gap-2"><label class="scope"><input v-model="deleteScope" type="radio" value="wsi" />仅删除当前 WSI</label><label class="scope"><input v-model="deleteScope" type="radio" value="chain" />删除关联链路（影响 {{ getWsiDeletionImpact(deleteTarget.id).wsiIds.length }} 张 WSI、{{ getWsiDeletionImpact(deleteTarget.id).caseIds.length }} 个 Case、{{ getWsiDeletionImpact(deleteTarget.id).projects.length }} 个项目）</label></div></div><footer class="flex justify-end gap-2 border-t border-white/[0.07] p-4"><button class="btn-ghost" @click="deleteTarget=null">取消</button><button class="rounded-md bg-[#b64250] px-4 text-sm text-white" @click="confirmDelete">确认删除</button></footer></section></div>
      <AnalysisConfigurationModal v-if="analysisConfigurationItems.length" :items="analysisConfigurationItems" source-label="WSI 管理" @close="closeAnalysisConfiguration" @confirm="launchConfigured" />
    </Teleport>

    <Teleport to="body">
      <div v-if="uploadOpen" class="fixed inset-0 z-[150] overflow-y-auto bg-black/75 p-3 lg:p-6">
        <section class="mx-auto my-2 w-full max-w-[1320px] overflow-visible rounded-lg border border-white/[0.10] bg-[#202126]">
          <header class="flex items-center justify-between border-b border-white/[0.08] px-6 py-4"><div class="flex items-center gap-3"><h2 class="text-xl font-semibold">上传 WSI</h2><span class="rounded-full border border-[#8f35b7]/35 bg-[#8f35b7]/15 px-2.5 py-1 text-xs text-[#d292f4]">支持批量导入</span></div><button class="icon-button" @click="closeUpload"><X :size="20" /></button></header>
          <div class="p-5">
            <h3 class="font-semibold">选择待导入内容</h3><p class="mt-1 text-sm">普通 WSI 按文件导入；DICOM 文件夹会递归扫描并按目录归为序列。</p>
            <div class="mt-4 grid gap-3 md:grid-cols-2"><button class="upload-choice border-[#8f35b7]/35 bg-[#8f35b7]/10" @click="fileInput?.click()"><span class="choice-icon text-[#d292f4]"><FileImage :size="22" /></span><span><b>选择 WSI 文件</b><small>.svs / .sdpc / .tiff / .tif</small></span><span class="choice-action">选择文件</span></button><button class="upload-choice border-[#22d3ee]/30 bg-[#22d3ee]/5" @click="folderInput?.click()"><span class="choice-icon text-[#67e8f9]"><Database :size="22" /></span><span><b>选择 DICOM 文件夹</b><small>递归扫描多层目录并形成序列</small></span><span class="choice-action border-[#22d3ee]/40 text-[#67e8f9]">选择文件夹</span></button><input ref="fileInput" class="hidden" type="file" multiple accept=".svs,.sdpc,.tiff,.tif" @change="selectFiles(($event.target as HTMLInputElement).files)" /><input ref="folderInput" class="hidden" type="file" multiple accept=".dcm,application/dicom" @change="selectDicomFolder(($event.target as HTMLInputElement).files)" /></div>
            <div v-if="dicomSummary" class="mt-3 rounded-md border border-[#22d3ee]/25 bg-[#22d3ee]/5 px-4 py-3 text-sm text-[#a5f3fc]">已识别 {{ dicomSummary.series }} 个 DICOM 序列，共 {{ dicomSummary.instances }} 个实例；忽略 {{ dicomSummary.ignored }} 个非 DICOM 文件。</div>
            <div class="mt-5 rounded-lg border border-white/[0.08] bg-[#17181d] p-4"><div class="mb-3 flex justify-between"><b>批量设置</b><span class="text-xs text-[#64748b]">当前待导入 {{ pending.length }} 项</span></div><div class="grid gap-2 md:grid-cols-[1.2fr_1fr_.7fr_1.3fr_auto]"><SearchableSelect v-model="bulkSite" class="bulk-search-select" :options="bulkSiteOptions" search-placeholder="搜索取材部位" /><select v-model="bulkSampling" class="upload-bulk-select"><option value="">不批量修改方式</option><option v-for="item in SAMPLING_METHOD_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option></select><select v-model="bulkStain" class="upload-bulk-select"><option value="">不批量修改染色</option><option v-for="item in stains" :key="item">{{ item }}</option></select><SearchableSelect v-model="bulkCase" class="bulk-search-select" :options="bulkCaseOptions" search-placeholder="搜索 Case 编号或取材信息" /><button class="btn-secondary h-10 px-3" @click="applyBulk">应用到列表</button></div></div>
            <div class="mt-5 overflow-x-auto rounded-lg border border-white/[0.08]"><table class="w-full min-w-[1120px] text-sm"><thead class="bg-[#252730]"><tr><th>待导入项</th><th>大小</th><th>取材部位 <span class="required-mark">*</span></th><th>取材方式 <span class="required-mark">*</span></th><th>染色 <span class="required-mark">*</span></th><th>绑定 Case</th><th>操作</th></tr></thead><tbody><tr v-if="!pending.length"><td colspan="7" class="h-32 text-center text-[#64748b]">请选择 WSI 文件或 DICOM 文件夹</td></tr><tr v-for="row in pending" v-else :key="row.id" class="border-t border-white/[0.06]"><td><div class="flex items-center gap-2"><span v-if="row.source==='dicom-series'" class="rounded bg-[#22d3ee]/10 px-2 py-1 text-xs text-[#67e8f9]">DICOM 序列</span><b>{{ row.fileName }}</b></div><small v-if="row.dicomPath" class="mt-1 block text-[#64748b]">{{ row.dicomPath }} · {{ row.dicomInstanceCount }} 个实例</small></td><td>{{ row.size }}</td><td><select v-model="row.site" required class="row-select"><option value="">待选择</option><option v-for="item in PATHOLOGY_SITE_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option></select></td><td><select v-model="row.samplingMethod" required class="row-select"><option value="">待选择</option><option v-for="item in SAMPLING_METHOD_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option></select></td><td><select v-model="row.stain" required class="row-select"><option value="">待选择</option><option v-for="item in stains" :key="item">{{ item }}</option></select></td><td><select v-model="row.boundCase" class="row-select" @change="applyCase(row)"><option>未绑定</option><option v-for="item in cases" :key="item.id">{{ item.id }}</option></select></td><td><button class="text-[#ff9c9c]" @click="pending=pending.filter(item=>item.id!==row.id)">移除</button></td></tr></tbody></table></div>
          </div>
          <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] px-5 py-4"><span class="text-sm text-[#94a3b8]">已选择 {{ pending.length }} 个导入项，其中 {{ incomplete }} 项信息待补充。</span><div class="flex gap-2"><button class="btn-ghost h-10" @click="closeUpload">取消</button><button :disabled="!canImport" class="btn-primary disabled:opacity-40" @click="confirmImport"><Upload :size="16" />开始导入（{{ pending.length }}）</button></div></footer>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
th, td { padding: 11px 12px; text-align: left; } th { color: #cbd5e1; font-weight: 600; } .icon-button { display:grid;width:34px;height:34px;place-items:center;color:#94a3b8; }
.nav-arrow { position:absolute; top:50%; display:grid; width:42px;height:42px;place-items:center;transform:translateY(-50%);border-radius:50%;background:rgb(32 33 38 / .9);color:white; }.nav-arrow:disabled{opacity:.25}.scope{display:flex;gap:10px;border:1px solid rgb(255 255 255 / .08);border-radius:6px;padding:12px;color:#cbd5e1;font-size:14px}
.upload-choice{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;border-width:1px;border-radius:8px;padding:16px;text-align:left}.upload-choice small{display:block;margin-top:3px;color:#748095;font-size:12px}.choice-icon{display:grid;width:42px;height:42px;place-items:center;border-radius:8px;background:rgb(255 255 255 / .04)}.choice-action{border:1px solid rgb(143 53 183 / .45);border-radius:6px;padding:7px 10px;color:#d292f4;font-size:12px}.row-select{width:100%;height:34px;border:1px solid rgb(255 255 255 / .09);border-radius:5px;background:#17181d;padding:0 8px;color:#cbd5e1}
.upload-bulk-select{min-width:0;width:100%;height:40px;border:1px solid rgb(255 255 255 / .09);border-radius:6px;background:#202228;padding:0 30px 0 11px;color:#cbd5e1;font-size:13px;outline:none;transition:border-color .15s ease,box-shadow .15s ease}.upload-bulk-select:hover{border-color:rgb(255 255 255 / .16)}.upload-bulk-select:focus{border-color:rgb(143 53 183 / .62);box-shadow:0 0 0 2px rgb(143 53 183 / .14)}
:deep(.bulk-search-select > button){border-radius:6px;color:#cbd5e1;font-size:13px;transition:border-color .15s ease,box-shadow .15s ease}:deep(.bulk-search-select > button:hover){border-color:rgb(255 255 255 / .16)}:deep(.bulk-search-select > button:focus-visible){outline:none;border-color:rgb(143 53 183 / .62);box-shadow:0 0 0 2px rgb(143 53 183 / .14)}
.transfer-placeholder{background:rgb(143 53 183 / .035)}.transfer-row-dot{display:grid;width:27px;height:27px;place-items:center;border-radius:6px;background:rgb(143 53 183 / .13);color:#d292f4}.thumbnail-placeholder{display:grid;width:64px;height:40px;grid-template-columns:auto auto;place-content:center;align-items:center;gap:4px;border:1px dashed rgb(143 53 183 / .35);border-radius:5px;background:rgb(143 53 183 / .06);color:#a878bb}.thumbnail-placeholder span{font-size:8px}.transfer-status{min-width:155px}.transfer-status>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:8px}.transfer-status strong{color:#93a0b3;font-size:9px;font-weight:500}.transfer-pill{border-radius:9px;padding:3px 6px;font-size:9px}.transfer-pill.active{background:rgb(143 53 183 / .14);color:#d292f4}.transfer-pill.failed{background:rgb(239 68 68 / .1);color:#ff8e95}.transfer-progress{height:5px;margin-top:7px;overflow:hidden;border-radius:3px;background:#33353e}.transfer-progress i{display:block;height:100%;border-radius:3px;background:#a64ed0;transition:width .25s ease}.transfer-progress i.failed{background:#ef535a}
</style>
