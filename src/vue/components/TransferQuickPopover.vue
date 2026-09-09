<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, CheckCircle2, CircleAlert, Clock3, CloudUpload, FileImage } from '@lucide/vue'
import type { UploadTransferItem } from '@/lib/uploadTransferQueue'
import { useUploadTransfers } from '../composables/useUploadTransfers'

defineEmits<{ close: [] }>()

const { transfers, pendingCount, completedCount, failedCount, canceledCount } = useUploadTransfers()
const exceptionCount = computed(() => failedCount.value + canceledCount.value)
const recentTransfers = computed(() => [...transfers.value]
  .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
  .slice(0, 4))

function tone(item: UploadTransferItem) {
  if (item.status === '已完成') return 'done'
  if (['上传失败', '已取消'].includes(item.status)) return 'failed'
  return 'active'
}
</script>

<template>
  <div class="quick-scrim" @click="$emit('close')" />
  <section class="transfer-quick" role="dialog" aria-label="传输任务快速预览">
    <header>
      <div><span><CloudUpload :size="18" /></span><div><h2>传输任务</h2><p>快速查看当前上传状态</p></div></div>
      <strong v-if="pendingCount">{{ pendingCount }} 项进行中</strong>
      <strong v-else-if="exceptionCount" class="failed">{{ exceptionCount }} 项异常</strong>
      <strong v-else-if="completedCount" class="done">全部完成</strong>
    </header>

    <div class="quick-summary">
      <span><Clock3 :size="14" /><b>{{ pendingCount }}</b>进行中</span>
      <span><CheckCircle2 :size="14" /><b>{{ completedCount }}</b>已完成</span>
      <span :class="exceptionCount && 'has-error'"><CircleAlert :size="14" /><b>{{ exceptionCount }}</b>异常</span>
    </div>

    <div v-if="recentTransfers.length" class="quick-list">
      <article v-for="item in recentTransfers" :key="item.id">
        <span class="file-icon"><FileImage :size="16" /></span>
        <div>
          <div><b :title="item.wsi.fileName">{{ item.wsi.fileName }}</b><em :class="tone(item)">{{ item.status }}</em></div>
          <p>{{ item.wsi.size }} · {{ item.wsi.boundCase === '未绑定' ? '未绑定 Case' : item.wsi.boundCase }}</p>
          <div class="mini-progress"><i :class="tone(item)" :style="{ width: `${item.progress}%` }" /></div>
        </div>
        <small>{{ item.progress }}%</small>
      </article>
    </div>
    <div v-else class="quick-empty"><CloudUpload :size="25" /><b>暂无传输任务</b><span>上传 WSI 后可在这里快速查看进度。</span></div>

    <RouterLink to="/workbench/transfers" class="view-all" @click="$emit('close')">查看全部传输任务<ArrowRight :size="15" /></RouterLink>
  </section>
</template>

<style scoped>
.quick-scrim{position:fixed;inset:0;z-index:155;background:transparent}.transfer-quick{position:fixed;z-index:160;top:58px;right:max(18px,calc((100vw - 1440px)/2 + 16px));width:min(390px,calc(100vw - 24px));overflow:hidden;border:1px solid rgb(255 255 255 / .11);border-radius:10px;background:#202126;box-shadow:0 20px 55px rgb(0 0 0 / .48)}header{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid rgb(255 255 255 / .07);padding:14px 15px}header>div{display:flex;min-width:0;align-items:center;gap:10px}header>div>span{display:grid;width:34px;height:34px;flex:none;place-items:center;border-radius:7px;background:rgb(143 53 183 / .16);color:#d292f4}h2{color:#e2e8f0;font-size:14px;font-weight:650}header p{margin-top:2px;color:#718096;font-size:10px}header strong{flex:none;border-radius:10px;background:rgb(143 53 183 / .13);padding:3px 7px;color:#d292f4;font-size:9px;font-weight:600}header strong.done{background:rgb(34 197 94 / .1);color:#65d6a0}header strong.failed{background:rgb(239 68 68 / .1);color:#ff8e95}.quick-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:10px 12px 7px}.quick-summary span{display:flex;height:34px;align-items:center;justify-content:center;gap:4px;border:1px solid rgb(255 255 255 / .06);border-radius:6px;background:#191a1f;color:#7e8a9d;font-size:9.5px}.quick-summary svg{color:#a970c4}.quick-summary span:nth-child(2) svg{color:#4fc38e}.quick-summary .has-error svg{color:#ff7f86}.quick-summary b{color:#d8dee9;font-size:12px}.quick-list{padding:4px 8px 8px}.quick-list article{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:9px;border-bottom:1px solid rgb(255 255 255 / .06);padding:9px 7px}.quick-list article:last-child{border-bottom:0}.file-icon{display:grid;width:31px;height:31px;place-items:center;border-radius:6px;background:#282a31;color:#9aa7b9}.quick-list article>div{min-width:0}.quick-list article>div>div:first-child{display:flex;align-items:center;gap:7px}.quick-list b{min-width:0;flex:1;overflow:hidden;color:#cbd5e1;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;text-overflow:ellipsis;white-space:nowrap}.quick-list em{flex:none;border-radius:8px;padding:2px 5px;font-size:8px;font-style:normal}.quick-list em.active{background:rgb(143 53 183 / .13);color:#d292f4}.quick-list em.done{background:rgb(34 197 94 / .1);color:#65d6a0}.quick-list em.failed{background:rgb(239 68 68 / .1);color:#ff8e95}.quick-list p{margin-top:2px;color:#667287;font-size:8.5px}.quick-list article>small{width:29px;color:#7e8a9d;font-size:8.5px;text-align:right}.mini-progress{height:3px;margin-top:6px;overflow:hidden;border-radius:2px;background:#33353d}.mini-progress i{display:block;height:100%;border-radius:2px;background:#a64ed0}.mini-progress i.done{background:#35bd83}.mini-progress i.failed{background:#ef535a}.quick-empty{display:grid;min-height:155px;place-content:center;justify-items:center;gap:5px;color:#617086;text-align:center}.quick-empty svg{margin-bottom:4px;color:#a970c4}.quick-empty b{color:#b9c2cf;font-size:12px}.quick-empty span{font-size:9.5px}.view-all{display:flex;height:43px;align-items:center;justify-content:center;gap:6px;border-top:1px solid rgb(255 255 255 / .07);background:#1b1c21;color:#d292f4;font-size:11px;font-weight:600}.view-all:hover{background:rgb(143 53 183 / .08);color:#e6b9f7}@media(max-width:640px){.transfer-quick{right:12px;top:58px}}
</style>
