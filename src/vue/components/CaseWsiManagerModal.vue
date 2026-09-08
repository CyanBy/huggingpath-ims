<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { CheckCircle2, Database, FileImage, Link2, Search, Upload, X } from '@lucide/vue'
import { enqueueWsiTransfers } from '@/lib/uploadTransferQueue'
import { getPathologySiteLabel, getSamplingMethodLabel } from '@/lib/pathologySpecimens'
import { useWorkspaceData } from '../composables/useWorkspaceData'
import { writeWorkspaceWsis, type WorkspaceCase, type WorkspaceWsi } from '../data/pathologyWorkspace'

type Mode = 'upload' | 'bind'
type PendingUpload = WorkspaceWsi & { source: 'file' | 'dicom-series'; dicomPath?: string; dicomInstanceCount?: number }

const props = defineProps<{ caseItem: WorkspaceCase }>()
const emit = defineEmits<{ close: []; changed: [] }>()
const { wsis, refresh } = useWorkspaceData()
const mode = ref<Mode>('upload')
const fileInput = ref<HTMLInputElement | null>(null)
const folderInput = ref<HTMLInputElement | null>(null)
const pending = ref<PendingUpload[]>([])
const selectedIds = ref<string[]>([])
const keyword = ref('')
const stains = ['HE', 'IHC', 'PAS', 'Ki67', 'HER2']

const availableWsis = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return wsis.value.filter((item) => item.boundCase === '未绑定' && (!query || `${item.fileName} ${item.site} ${item.stain}`.toLowerCase().includes(query)))
})
const uploadReady = computed(() => pending.value.length > 0 && pending.value.every((item) => item.stain))

function inferStain(name: string) {
  const upper = name.toUpperCase()
  if (upper.includes('HER2')) return 'HER2'
  if (upper.includes('KI67')) return 'Ki67'
  if (upper.includes('IHC')) return 'IHC'
  if (upper.includes('PAS')) return 'PAS'
  if (upper.includes('HE')) return 'HE'
  return ''
}
function fileSize(size: number) {
  return size >= 1024 ** 3 ? `${(size / 1024 ** 3).toFixed(1)} GB` : `${Math.max(1, Math.round(size / 1024 ** 2))} MB`
}
function pendingRow(name: string, size: number, source: PendingUpload['source']): PendingUpload {
  return {
    id: `wsi-${crypto.randomUUID()}`,
    fileName: name,
    size: fileSize(size),
    site: props.caseItem.site,
    samplingMethod: props.caseItem.samplingMethod,
    stain: inferStain(name),
    boundCase: props.caseItem.id,
    uploadedAt: new Date().toISOString().slice(0, 10),
    source,
  }
}
function selectFiles(files: FileList | null) {
  if (!files) return
  pending.value.push(...Array.from(files).slice(0, 50 - pending.value.length).map((file) => pendingRow(file.name, file.size, 'file')))
  if (fileInput.value) fileInput.value.value = ''
}
function selectDicomFolder(files: FileList | null) {
  if (!files) return
  const dicom = Array.from(files).filter((file) => file.name.toLowerCase().endsWith('.dcm'))
  const groups = new Map<string, File[]>()
  for (const file of dicom) {
    const path = file.webkitRelativePath || file.name
    const folder = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : 'DICOM'
    groups.set(folder, [...(groups.get(folder) || []), file])
  }
  pending.value.push(...[...groups.entries()].slice(0, 50 - pending.value.length).map(([path, filesInSeries]) => ({
    ...pendingRow(`${path.split('/').pop() || 'DICOM'}_series.dcm`, filesInSeries.reduce((sum, file) => sum + file.size, 0), 'dicom-series'),
    dicomPath: path,
    dicomInstanceCount: filesInSeries.length,
  })))
  if (folderInput.value) folderInput.value.value = ''
}
function startUpload() {
  if (!uploadReady.value) return
  enqueueWsiTransfers(pending.value.map((item) => ({ ...item })))
  emit('changed')
  emit('close')
}
function toggle(id: string) {
  selectedIds.value = selectedIds.value.includes(id) ? selectedIds.value.filter((item) => item !== id) : [...selectedIds.value, id]
}
function bindExisting() {
  if (!selectedIds.value.length) return
  writeWorkspaceWsis(wsis.value.map((item) => selectedIds.value.includes(item.id) ? {
    ...item,
    boundCase: props.caseItem.id,
    site: props.caseItem.site,
    samplingMethod: props.caseItem.samplingMethod,
  } : item))
  refresh()
  emit('changed')
  emit('close')
}

onMounted(async () => {
  await nextTick()
  folderInput.value?.setAttribute('webkitdirectory', '')
  folderInput.value?.setAttribute('directory', '')
})
</script>

<template>
  <div class="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto bg-black/75 p-4" @click.self="emit('close')">
    <section class="my-auto w-full max-w-[1040px] overflow-hidden rounded-lg border border-white/[0.10] bg-[#202126] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="case-wsi-title">
      <header class="flex items-center justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 id="case-wsi-title" class="text-lg font-semibold">为 Case 添加 WSI</h2><p class="mt-1 text-xs text-[#94a3b8]"><span class="font-mono text-[#d292f4]">{{ caseItem.id }}</span> · {{ caseItem.patientCode }} · {{ getPathologySiteLabel(caseItem.site) }} / {{ getSamplingMethodLabel(caseItem.samplingMethod) }}</p></div><button class="manager-close" aria-label="关闭" @click="emit('close')"><X :size="19" /></button></header>
      <nav class="manager-tabs"><button :class="mode==='upload'&&'active'" @click="mode='upload'"><Upload :size="15" />上传新 WSI</button><button :class="mode==='bind'&&'active'" @click="mode='bind'"><Link2 :size="15" />绑定已有 WSI <span>{{ availableWsis.length }}</span></button></nav>

      <template v-if="mode==='upload'">
        <div class="p-5">
          <div class="case-bind-hint"><CheckCircle2 :size="17" /><span>本次添加的切片将自动绑定当前 Case，并继承取材部位与取材方式。</span></div>
          <div class="mt-4 grid gap-3 md:grid-cols-2"><button class="upload-choice purple" @click="fileInput?.click()"><span class="choice-icon"><FileImage :size="21" /></span><span><b>选择 WSI 文件</b><small>.svs / .sdpc / .tiff / .tif</small></span><em>选择文件</em></button><button class="upload-choice cyan" @click="folderInput?.click()"><span class="choice-icon"><Database :size="21" /></span><span><b>选择 DICOM 文件夹</b><small>递归扫描并按目录归为序列</small></span><em>选择文件夹</em></button><input ref="fileInput" class="hidden" type="file" multiple accept=".svs,.sdpc,.tiff,.tif" @change="selectFiles(($event.target as HTMLInputElement).files)" /><input ref="folderInput" class="hidden" type="file" multiple accept=".dcm,application/dicom" @change="selectDicomFolder(($event.target as HTMLInputElement).files)" /></div>
          <div class="mt-4 overflow-x-auto rounded-lg border border-white/[0.08]"><table class="w-full min-w-[760px] text-sm"><thead><tr><th>待上传文件</th><th>大小</th><th>取材信息</th><th>染色 <span class="required-mark">*</span></th><th>绑定 Case</th><th>操作</th></tr></thead><tbody><tr v-if="!pending.length"><td colspan="6" class="h-32 text-center text-[#64748b]">请选择 WSI 文件或 DICOM 文件夹</td></tr><tr v-for="item in pending" v-else :key="item.id"><td><b>{{ item.fileName }}</b><small v-if="item.dicomPath">{{ item.dicomPath }} · {{ item.dicomInstanceCount }} 个实例</small></td><td>{{ item.size }}</td><td>{{ getPathologySiteLabel(item.site) }} · {{ getSamplingMethodLabel(item.samplingMethod) }}</td><td><select v-model="item.stain" required><option value="">请选择</option><option v-for="stain in stains" :key="stain">{{ stain }}</option></select></td><td class="font-mono text-[#d292f4]">{{ item.boundCase }}</td><td><button class="remove" @click="pending=pending.filter(row=>row.id!==item.id)">移除</button></td></tr></tbody></table></div>
        </div>
        <footer><span>已选择 {{ pending.length }} 项，提交后可在顶部传输队列查看进度。</span><div><button class="btn-ghost" @click="emit('close')">取消</button><button :disabled="!uploadReady" class="btn-primary disabled:opacity-40" @click="startUpload"><Upload :size="15" />开始上传（{{ pending.length }}）</button></div></footer>
      </template>

      <template v-else>
        <div class="p-5"><div class="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 class="font-semibold">选择未绑定 WSI</h3><p class="mt-1 text-xs text-[#64748b]">绑定后会按当前 Case 统一取材信息，不会复制文件。</p></div><label class="manager-search"><Search :size="15" /><input v-model="keyword" placeholder="搜索文件名 / 部位 / 染色" /></label></div><div v-if="!availableWsis.length" class="manager-empty"><Link2 :size="25" /><b>暂无可绑定的 WSI</b><span>只显示尚未绑定其他 Case 的切片。</span></div><div v-else class="existing-list"><button v-for="item in availableWsis" :key="item.id" :class="selectedIds.includes(item.id)&&'active'" @click="toggle(item.id)"><input type="checkbox" :checked="selectedIds.includes(item.id)" tabindex="-1" /><img src="/wsi-demo.jpg" alt="WSI" /><span><b>{{ item.fileName }}</b><small>{{ getPathologySiteLabel(item.site) }} · {{ item.stain }} · {{ item.size }}</small></span><em>{{ selectedIds.includes(item.id) ? '已选' : '选择' }}</em></button></div></div>
        <footer><span>已选择 {{ selectedIds.length }} 张 WSI。</span><div><button class="btn-ghost" @click="emit('close')">取消</button><button :disabled="!selectedIds.length" class="btn-primary disabled:opacity-40" @click="bindExisting"><Link2 :size="15" />绑定到当前 Case</button></div></footer>
      </template>
    </section>
  </div>
</template>

<style scoped>
.manager-close{display:grid;width:34px;height:34px;place-items:center;border-radius:6px;color:#94a3b8}.manager-close:hover{background:rgb(255 255 255 / .05);color:white}.manager-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;border-bottom:1px solid rgb(255 255 255 / .08);background:#17181d;padding:6px}.manager-tabs button{display:flex;height:40px;align-items:center;justify-content:center;gap:7px;border-radius:6px;color:#94a3b8;font-size:13px}.manager-tabs button.active{background:rgb(143 53 183 / .2);color:#e7b8f7}.manager-tabs button span{display:grid;min-width:18px;height:18px;place-items:center;border-radius:9px;background:rgb(255 255 255 / .08);padding:0 5px;font-size:9px}.case-bind-hint{display:flex;align-items:center;gap:8px;border:1px solid rgb(34 197 94 / .2);border-radius:6px;background:rgb(34 197 94 / .06);padding:10px 12px;color:#9bd9bd;font-size:12px}.upload-choice{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;border:1px solid;border-radius:8px;padding:14px;text-align:left}.upload-choice.purple{border-color:rgb(143 53 183 / .35);background:rgb(143 53 183 / .09);color:#d292f4}.upload-choice.cyan{border-color:rgb(34 211 238 / .28);background:rgb(34 211 238 / .05);color:#67e8f9}.upload-choice .choice-icon{display:grid;width:40px;height:40px;place-items:center;border-radius:7px;background:rgb(255 255 255 / .04)}.upload-choice b{color:#e2e8f0;font-size:13px}.upload-choice small{display:block;margin-top:3px;color:#748095;font-size:10px}.upload-choice em{border:1px solid currentColor;border-radius:5px;padding:6px 8px;font-size:10px;font-style:normal}table thead{background:#252730}th,td{padding:10px 12px;text-align:left}th{color:#cbd5e1;font-weight:600}tbody tr{border-top:1px solid rgb(255 255 255 / .06)}td small{display:block;margin-top:3px;color:#64748b;font-size:10px}td select{height:34px;border:1px solid rgb(255 255 255 / .09);border-radius:5px;background:#17181d;padding:0 28px 0 8px;color:#cbd5e1}.remove{color:#ff9c9c}section>footer{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid rgb(255 255 255 / .08);padding:13px 20px;color:#94a3b8;font-size:11px}section>footer>div{display:flex;gap:8px}.manager-search{display:flex;height:38px;min-width:290px;align-items:center;gap:8px;border:1px solid rgb(255 255 255 / .08);border-radius:6px;background:#17181d;padding:0 11px;color:#64748b}.manager-search input{min-width:0;flex:1;background:transparent;color:#e2e8f0;outline:none}.manager-empty{display:grid;min-height:260px;place-content:center;justify-items:center;gap:7px;color:#64748b;text-align:center}.manager-empty b{color:#cbd5e1;font-size:13px}.manager-empty span{font-size:11px}.existing-list{max-height:430px;overflow-y:auto;border:1px solid rgb(255 255 255 / .07);border-radius:7px}.existing-list button{display:flex;width:100%;align-items:center;gap:12px;border-bottom:1px solid rgb(255 255 255 / .06);padding:10px 12px;text-align:left}.existing-list button:last-child{border-bottom:0}.existing-list button:hover{background:rgb(255 255 255 / .025)}.existing-list button.active{background:rgb(143 53 183 / .12)}.existing-list img{width:58px;height:38px;border-radius:4px;object-fit:cover}.existing-list span{min-width:0;flex:1}.existing-list b,.existing-list small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.existing-list b{color:#d8dee9;font-size:12px}.existing-list small{margin-top:3px;color:#64748b;font-size:10px}.existing-list em{color:#d292f4;font-size:10px;font-style:normal}
</style>
