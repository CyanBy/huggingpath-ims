<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Check, ChevronRight, Copy, Database, FileText, Laptop, Lock, Play, Star } from '@lucide/vue'
import { getCatalogModel } from '@/lib/modelCatalog'

const route = useRoute()
const router = useRouter()
const copied = ref(false)
const model = computed(() => getCatalogModel(typeof route.params.id === 'string' ? route.params.id : null))
const parameters = [
  ['model_weights_path', 'path', 'auto-detect', '模型权重文件路径'], ['batch_size', 'number', '16', '推理批次大小'], ['confidence_threshold', 'range', '0.5', '置信度阈值'], ['magnification', 'select', '40X', '分析倍率'], ['use_gpu', 'boolean', 'true', '使用 GPU 加速'], ['tile_size', 'number', '512', '瓦片大小'],
]
async function copyId() {
  if (!model.value) return
  await navigator.clipboard.writeText(model.value.id)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1800)
}
</script>

<template>
  <div v-if="model">
    <section class="border-b border-white/[0.06] bg-[#1f2024] py-4"><div class="section-container flex flex-wrap items-center gap-6 text-xs text-[#94a3b8]"><span class="flex items-center gap-2"><FileText :size="15" class="text-[#d292f4]" />Nature Methods 2024</span><span class="flex items-center gap-2"><Database :size="15" />TCGA 验证数据</span><span class="rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 px-2.5 py-1 text-[#6ee7a0]"><Lock :size="13" class="mr-1 inline" />数据不出院</span><span><Laptop :size="14" class="mr-1 inline" />本地运行</span></div></section>
    <section class="section-container py-10">
      <nav class="mb-5 flex items-center gap-2 text-xs text-[#64748b]"><button @click="router.push('/home')">首页</button><ChevronRight :size="13" /><button @click="router.push('/explore')">模型中心</button><ChevronRight :size="13" /><span>{{ model.name }}</span></nav>
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div><div class="flex flex-wrap items-center gap-3"><h1 class="text-3xl font-semibold">{{ model.name }}</h1><span class="rounded bg-[#22c55e]/10 px-2 py-1 text-xs text-[#6ee7a0]">可用</span></div><div class="mt-3 flex items-center gap-2"><code class="text-sm text-[#64748b]">{{ model.id }}</code><button class="text-[#64748b]" title="复制模型 ID" @click="copyId"><Check v-if="copied" :size="15" class="text-[#22c55e]" /><Copy v-else :size="15" /></button></div><section class="mt-7"><h2 class="text-lg font-semibold">模型说明</h2><p class="mt-3 max-w-[820px] text-base leading-8">{{ model.summary }}。该模型支持病理切片的标准化批量运行，并将结果按 WSI 与模型组合保存，便于在 Case 和研究项目维度继续聚合。</p></section><div class="mt-8"><h2 class="text-lg font-semibold">关键参数</h2><div class="mt-4 overflow-hidden rounded-lg border border-white/[0.07]"><table class="w-full text-sm"><thead class="bg-[#252730]"><tr><th>参数</th><th>类型</th><th>默认值</th><th>说明</th></tr></thead><tbody><tr v-for="row in parameters" :key="row[0]" class="border-t border-white/[0.06]"><td><code>{{ row[0] }}</code></td><td><span class="rounded bg-[#8f35b7]/15 px-2 py-1 text-xs text-[#d292f4]">{{ row[1] }}</span></td><td>{{ row[2] }}</td><td class="text-[#94a3b8]">{{ row[3] }}</td></tr></tbody></table></div></div></div>
        <aside class="h-fit rounded-lg border border-white/[0.08] bg-[#202126] p-5"><div class="flex items-center justify-between"><span class="text-sm text-[#94a3b8]">社区评分</span><span class="flex items-center gap-1 font-semibold"><Star :size="16" class="fill-[#f4c577] text-[#f4c577]" />4.8</span></div><dl class="mt-5 grid gap-3 border-y border-white/[0.07] py-4 text-sm"><div class="flex justify-between"><dt>模型状态</dt><dd class="text-[#6ee7a0]">可运行</dd></div><div class="flex justify-between"><dt>输入类型</dt><dd>WSI</dd></div><div class="flex justify-between"><dt>推荐倍率</dt><dd>40X</dd></div><div class="flex justify-between"><dt>执行设备</dt><dd>GPU</dd></div></dl><button class="btn-primary mt-5 h-11 w-full" @click="router.push({ path: '/workbench/tasks/new', query: { model: model.id, target: 'wsi' } })"><Play :size="16" />运行模型</button><p class="mt-3 text-xs leading-5">运行前选择 WSI、Case 或研究项目，任务将统一进入分析任务列表。</p></aside>
      </div>

      <section class="mt-12 border-t border-white/[0.07] pt-10"><h2 class="text-lg font-semibold">演示效果</h2><p class="mt-2 text-sm">在示例病理切片上查看模型输出与真实图像的叠加效果。</p><div class="mt-5 grid overflow-hidden rounded-lg border border-white/[0.08] bg-[#17181d] lg:grid-cols-[minmax(0,1fr)_300px]"><div class="relative grid min-h-[440px] place-items-center bg-[#111217] p-8"><img src="/wsi-demo.jpg" alt="模型演示切片" class="max-h-[400px] max-w-full rounded-md border border-[#1b5361] object-contain" /><span class="pointer-events-none absolute left-[42%] top-[36%] h-24 w-32 rounded-[48%] border-2 border-[#d946ef] bg-[#d946ef]/20" /></div><div class="border-t border-white/[0.08] p-5 lg:border-l lg:border-t-0"><h3 class="font-semibold">示例结果摘要</h3><div class="mt-4 grid gap-3"><div class="detail-metric"><small>检测细胞</small><strong>2,456</strong></div><div class="detail-metric"><small>平均置信度</small><strong>94.2%</strong></div><div class="detail-metric"><small>推理耗时</small><strong>03:42</strong></div></div></div></div></section>

      <section class="mt-12 border-t border-white/[0.07] pt-10"><h2 class="text-lg font-semibold">性能对比</h2><p class="mt-2 text-sm">在公开验证集上的模型指标，仅用于研究评估参考。</p><div class="mt-5 overflow-x-auto rounded-lg border border-white/[0.08]"><table class="w-full min-w-[720px] text-sm"><thead class="bg-[#252730]"><tr><th>模型</th><th>Dice</th><th>Panoptic Quality</th><th>F1 Score</th><th>推理速度</th></tr></thead><tbody><tr class="border-t border-white/[0.06] bg-[#8f35b7]/8"><td><b>{{ model.name }}</b></td><td>0.891</td><td>0.812</td><td>0.926</td><td>18.4 tiles/s</td></tr><tr class="border-t border-white/[0.06]"><td>Hover-Net baseline</td><td>0.842</td><td>0.755</td><td>0.884</td><td>12.1 tiles/s</td></tr><tr class="border-t border-white/[0.06]"><td>U-Net baseline</td><td>0.806</td><td>0.701</td><td>0.851</td><td>21.7 tiles/s</td></tr></tbody></table></div></section>

      <section class="mt-12 border-t border-white/[0.07] pt-10"><h2 class="text-lg font-semibold">示例输出</h2><div class="mt-5 grid gap-4 md:grid-cols-3"><article v-for="item in [['细胞核实例','逐个标记细胞核边界并保留实例编号。'],['细胞类型','输出肿瘤、炎症与间质等类别信息。'],['空间统计','生成细胞密度、比例与邻域关系摘要。']]" :key="item[0]" class="rounded-lg border border-white/[0.08] bg-[#202126] p-5"><h3 class="font-semibold">{{ item[0] }}</h3><p class="mt-2 text-sm leading-6">{{ item[1] }}</p></article></div></section>
    </section>
  </div>
  <div v-else class="section-container grid min-h-[55dvh] place-items-center"><div class="text-center"><h1 class="text-xl font-semibold">模型不存在</h1><button class="mt-4 text-[#d292f4]" @click="router.push('/explore')">返回模型中心</button></div></div>
</template>

<style scoped>
th, td { padding: 12px 14px; text-align: left; } th { color: #cbd5e1; font-weight: 600; }
.detail-metric{display:flex;align-items:center;justify-content:space-between;border:1px solid rgb(255 255 255 / .07);border-radius:6px;background:#202126;padding:12px}.detail-metric small{color:#64748b}.detail-metric strong{color:#e2e8f0}
</style>
