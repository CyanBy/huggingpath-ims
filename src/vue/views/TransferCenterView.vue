<script setup lang="ts">
import { computed, ref } from 'vue'
import { Ban, CheckCircle2, CircleAlert, Clock3, CloudUpload, FileImage, RefreshCw, Search, Trash2 } from '@lucide/vue'
import type { UploadTransferItem } from '@/lib/uploadTransferQueue'
import { getPathologySiteLabel } from '@/lib/pathologySpecimens'
import { useUploadTransfers } from '../composables/useUploadTransfers'

type TransferFilter = 'all' | 'active' | 'completed' | 'exception'
const filter = ref<TransferFilter>('all')
const keyword = ref('')
const { transfers, pendingCount, completedCount, failedCount, canceledCount, clearCompleted, cancelTransfer, retryTransfer, removeTransfer } = useUploadTransfers()
const exceptionCount = computed(() => failedCount.value + canceledCount.value)
const filtered = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  return transfers.value.filter((item) => {
    const statusMatches = filter.value === 'all'
      || (filter.value === 'active' && ['等待上传', '上传中', '文件处理中'].includes(item.status))
      || (filter.value === 'completed' && item.status === '已完成')
      || (filter.value === 'exception' && ['上传失败', '已取消'].includes(item.status))
    return statusMatches && (!query || `${item.wsi.fileName} ${item.wsi.boundCase} ${item.wsi.site} ${item.wsi.stain}`.toLowerCase().includes(query))
  })
})
const tabs = computed(() => [
  { key: 'all' as const, label: '全部任务', count: transfers.value.length },
  { key: 'active' as const, label: '传输中', count: pendingCount.value },
  { key: 'completed' as const, label: '已完成', count: completedCount.value },
  { key: 'exception' as const, label: '异常', count: exceptionCount.value },
])
function tone(item: UploadTransferItem) {
  if (item.status === '已完成') return 'done'
  if (['上传失败', '已取消'].includes(item.status)) return 'failed'
  return 'active'
}
function formatTime(value?: string) {
  if (!value) return '--'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '--' : date.toLocaleString('zh-CN', { hour12: false })
}
function durationText(item: { createdAt: string; completedAt?: string }) {
  if (!item.completedAt) return ''
  const ms = new Date(item.completedAt).getTime() - new Date(item.createdAt).getTime()
  if (Number.isNaN(ms) || ms < 0) return ''
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds} 秒`
  const minutes = Math.floor(totalSeconds / 60)
  if (minutes < 60) return `${minutes} 分 ${totalSeconds % 60} 秒`
  return `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分`
}
</script>

<template>
  <div class="transfer-page">
    <header class="page-heading"><div><h1>传输队列</h1><p>集中管理 WSI 上传任务、处理进度和异常记录。</p></div><button v-if="completedCount" class="clear-completed" @click="clearCompleted"><Trash2 :size="15" />清除已完成</button></header>
    <section class="summary-cards">
      <button :class="filter==='active'&&'selected'" @click="filter='active'"><span class="purple"><Clock3 :size="20" /></span><div><small>传输中</small><b>{{ pendingCount }}</b><p>上传及文件处理中的任务</p></div></button>
      <button :class="filter==='completed'&&'selected'" @click="filter='completed'"><span class="green"><CheckCircle2 :size="20" /></span><div><small>已完成</small><b>{{ completedCount }}</b><p>已成功写入 WSI 管理</p></div></button>
      <button :class="filter==='exception'&&'selected'" @click="filter='exception'"><span class="red"><CircleAlert :size="20" /></span><div><small>异常</small><b>{{ exceptionCount }}</b><p>失败或已取消的任务</p></div></button>
    </section>
    <section class="records-panel">
      <header><nav><button v-for="tab in tabs" :key="tab.key" :class="filter===tab.key&&'active'" @click="filter=tab.key">{{ tab.label }}<span>{{ tab.count }}</span></button></nav><label><Search :size="15" /><input v-model="keyword" placeholder="搜索文件名 / Case / 部位 / 染色" /></label></header>
      <div v-if="!filtered.length" class="empty"><CloudUpload :size="34" /><b>{{ transfers.length ? '当前筛选下暂无传输记录' : '暂无传输任务' }}</b><p>{{ transfers.length ? '调整筛选条件后再查看。' : '从 WSI 管理或 Case 中上传切片后，任务会显示在这里。' }}</p></div>
      <div v-else class="records-table-wrap">
        <table class="transfer-table">
          <thead><tr><th>文件</th><th>取材信息</th><th>绑定 Case</th><th>状态与进度</th><th>时间</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filtered" :key="item.id">
              <td><div class="file-cell"><span :class="tone(item)"><FileImage :size="20" /></span><div><b :title="item.wsi.fileName">{{ item.wsi.fileName }}</b><small>{{ item.wsi.size }} · {{ item.wsi.source === 'dicom-series' ? 'DICOM 序列' : 'WSI 文件' }}</small></div></div></td>
              <td><b class="cell-primary">{{ getPathologySiteLabel(item.wsi.site) }}</b><small class="cell-secondary">{{ item.wsi.stain }}</small></td>
              <td><span :class="['case-value',item.wsi.boundCase==='未绑定'&&'unbound']">{{ item.wsi.boundCase === '未绑定' ? '未绑定' : item.wsi.boundCase }}</span></td>
              <td><div class="table-progress"><div class="status-line"><em :class="tone(item)">{{ item.status }}</em><strong>{{ item.progress }}%</strong></div><div><i :class="tone(item)" :style="{width:`${item.progress}%`}" /></div><small v-if="item.status==='文件处理中'">正在校验文件并生成缩略图</small><small v-else-if="item.status==='已完成'&&durationText(item)">耗时 {{ durationText(item) }}</small></div></td>
              <td><div class="time-cell"><span><em>创建</em><time>{{ formatTime(item.createdAt) }}</time></span><span><em>结束</em><time :class="!item.completedAt&&'muted'">{{ formatTime(item.completedAt) }}</time></span></div></td>
              <td><div class="table-actions"><button v-if="['等待上传','上传中','文件处理中'].includes(item.status)" class="cancel" @click="cancelTransfer(item.id)"><Ban :size="15" />取消</button><button v-else-if="['上传失败','已取消'].includes(item.status)" class="retry" @click="retryTransfer(item.id)"><RefreshCw :size="15" />重试</button><button v-if="!['等待上传','上传中','文件处理中'].includes(item.status)" class="remove" @click="removeTransfer(item.id)"><Trash2 :size="15" />移除</button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.transfer-page{min-height:calc(100dvh - 64px);padding:24px}.page-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}.page-heading h1{color:#e2e8f0;font-size:24px;font-weight:700}.page-heading p{margin-top:5px;color:#718096;font-size:13px}.clear-completed{display:flex;height:38px;align-items:center;gap:6px;border:1px solid rgb(255 255 255 / .1);border-radius:7px;padding:0 12px;color:#9aa7b9;font-size:12px}.clear-completed:hover{border-color:rgb(255 255 255 / .18);color:#e2e8f0}.summary-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}.summary-cards>button{display:flex;align-items:center;gap:13px;border:1px solid rgb(255 255 255 / .08);border-radius:9px;background:#202126;padding:16px;text-align:left}.summary-cards>button:hover,.summary-cards>button.selected{border-color:rgb(143 53 183 / .5);background:rgb(143 53 183 / .08)}.summary-cards>button>span{display:grid;width:43px;height:43px;flex:none;place-items:center;border-radius:9px}.summary-cards .purple{background:rgb(143 53 183 / .14);color:#d292f4}.summary-cards .green{background:rgb(34 197 94 / .1);color:#65d6a0}.summary-cards .red{background:rgb(239 68 68 / .1);color:#ff8e95}.summary-cards div{display:grid;grid-template-columns:auto auto;align-items:end;column-gap:9px}.summary-cards small{color:#8794a8;font-size:11px}.summary-cards b{color:#e2e8f0;font-size:24px;line-height:1}.summary-cards p{grid-column:1/-1;margin-top:5px;color:#667287;font-size:10px}.records-panel{overflow:hidden;border:1px solid rgb(255 255 255 / .08);border-radius:9px;background:#202126}.records-panel>header{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid rgb(255 255 255 / .07);padding:10px 14px}.records-panel nav{display:flex;gap:3px}.records-panel nav button{display:flex;height:35px;align-items:center;gap:6px;border-radius:6px;padding:0 11px;color:#8895a8;font-size:12px}.records-panel nav button:hover{background:rgb(255 255 255 / .04);color:#cbd5e1}.records-panel nav button.active{background:rgb(143 53 183 / .18);color:#e1afeF}.records-panel nav span{display:grid;min-width:18px;height:18px;place-items:center;border-radius:9px;background:rgb(255 255 255 / .07);padding:0 5px;font-size:9px}.records-panel>header>label{display:flex;width:min(330px,40vw);height:37px;align-items:center;gap:8px;border:1px solid rgb(255 255 255 / .08);border-radius:6px;background:#17181d;padding:0 11px;color:#657287}.records-panel input{min-width:0;flex:1;background:transparent;color:#d8dee9;font-size:12px;outline:none}.empty{display:grid;min-height:390px;place-content:center;justify-items:center;gap:7px;color:#667287;text-align:center}.empty svg{margin-bottom:5px;color:#a970c4}.empty b{color:#cbd5e1;font-size:14px}.empty p{font-size:11px}.records{display:grid;gap:9px;padding:12px}.records article{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:13px;border:1px solid rgb(255 255 255 / .07);border-radius:8px;background:#18191e;padding:14px}.record-icon{display:grid;width:45px;height:45px;place-items:center;border-radius:8px;background:#25272e;color:#a0adbf}.record-main{min-width:0}.record-title{display:flex;align-items:center;gap:9px}.record-title b{overflow:hidden;color:#d8dee9;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.record-title em{flex:none;border-radius:10px;padding:3px 7px;font-size:9px;font-style:normal}.record-title em.active{background:rgb(143 53 183 / .14);color:#d292f4}.record-title em.done{background:rgb(34 197 94 / .1);color:#65d6a0}.record-title em.failed{background:rgb(239 68 68 / .1);color:#ff8e95}.record-main>p{margin-top:4px;color:#748196;font-size:10px}.record-progress{display:flex;align-items:center;gap:10px;margin-top:11px}.record-progress>div{height:6px;flex:1;overflow:hidden;border-radius:3px;background:#30323a}.record-progress i{display:block;height:100%;border-radius:3px;background:#a64ed0}.record-progress i.done{background:#34bd83}.record-progress i.failed{background:#ef535a}.record-progress strong{width:34px;color:#91a0b4;font-size:9px;font-weight:500;text-align:right}.record-main footer{display:flex;flex-wrap:wrap;gap:5px 16px;margin-top:8px;color:#59677a;font-size:9px}.record-actions{display:flex;align-items:center;gap:5px}.record-actions button{display:flex;height:33px;align-items:center;gap:5px;border-radius:6px;padding:0 9px;color:#8d9aad;font-size:10px}.record-actions button:hover{background:rgb(255 255 255 / .05);color:#dce3ec}@media(max-width:800px){.transfer-page{padding:16px}.summary-cards{grid-template-columns:1fr}.records-panel>header{align-items:stretch;flex-direction:column}.records-panel>header>label{width:100%}.records article{grid-template-columns:auto minmax(0,1fr)}.record-actions{grid-column:1/-1;justify-content:flex-end}}
.records-table-wrap{overflow-x:auto}.transfer-table{width:100%;min-width:1160px;border-collapse:collapse}.transfer-table th{height:48px;background:#252730;padding:0 16px;color:#9aa7ba;font-size:13px;font-weight:600;text-align:left}.transfer-table td{height:84px;border-top:1px solid rgb(255 255 255 / .065);padding:12px 16px;color:#cbd5e1;font-size:13px;vertical-align:middle}.transfer-table tbody tr{transition:background .14s}.transfer-table tbody tr:hover{background:rgb(255 255 255 / .025)}.transfer-table th:first-child{width:290px}.transfer-table th:nth-child(2){width:110px}.transfer-table th:nth-child(3){width:160px}.transfer-table th:nth-child(5){width:235px}.transfer-table th:last-child{width:120px}.file-cell{display:flex;min-width:0;align-items:center;gap:10px}.file-cell>span{display:grid;width:42px;height:42px;flex:none;place-items:center;border-radius:7px;background:#292b33;color:#9eaabd}.file-cell>span.active{background:rgb(143 53 183 / .14);color:#d292f4}.file-cell>span.done{background:rgb(34 197 94 / .1);color:#65d6a0}.file-cell>span.failed{background:rgb(239 68 68 / .1);color:#ff8e95}.file-cell>div{min-width:0}.file-cell b,.file-cell small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.file-cell b{max-width:320px;color:#d8dee9;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13.5px}.file-cell small{margin-top:5px;color:#64748b;font-size:11px}.cell-primary,.cell-secondary{display:block}.cell-primary{color:#cbd5e1;font-size:13px}.cell-secondary{margin-top:5px;color:#748196;font-size:11px}.case-value{color:#d292f4;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12.5px}.case-value.unbound{color:#657287;font-family:inherit}.table-progress{min-width:220px}.status-line{display:flex;align-items:center;justify-content:space-between;gap:8px}.status-line em{border-radius:10px;padding:4px 9px;font-size:11px;font-style:normal}.status-line em.active{background:rgb(143 53 183 / .14);color:#d292f4}.status-line em.done{background:rgb(34 197 94 / .1);color:#65d6a0}.status-line em.failed{background:rgb(239 68 68 / .1);color:#ff8e95}.status-line strong{color:#91a0b4;font-size:12px;font-weight:500}.table-progress>div:nth-child(2){height:6px;margin-top:9px;overflow:hidden;border-radius:3px;background:#30323a}.table-progress i{display:block;height:100%;border-radius:3px;background:#a64ed0}.table-progress i.done{background:#34bd83}.table-progress i.failed{background:#ef535a}.table-progress>small{display:block;margin-top:6px;color:#718096;font-size:10.5px}.transfer-table time{color:#8794a7;font-size:12px;white-space:nowrap}.time-cell{display:grid;gap:6px}.time-cell>span{display:flex;align-items:baseline;gap:9px}.time-cell em{width:24px;flex:none;color:#5b6678;font-size:10.5px;font-style:normal}.transfer-table time.muted{color:#4f5a6a}.table-actions{display:flex;flex-wrap:wrap;align-items:center;gap:4px}.table-actions button{display:flex;height:36px;align-items:center;gap:6px;border-radius:6px;padding:0 10px;color:#8d9aad;font-size:12px;white-space:nowrap}.table-actions button:hover{background:rgb(255 255 255 / .05);color:#e2e8f0}.table-actions .retry{color:#d292f4}.table-actions .remove{color:#ef8d94}@media(max-width:800px){.records-table-wrap{margin:0}.transfer-table{min-width:1160px}}
</style>
