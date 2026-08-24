<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, X } from '@lucide/vue'
import { MODEL_CATALOG, type ModelCatalogItem } from '@/lib/modelCatalog'
import StatusSwitch from '../components/StatusSwitch.vue'

const keyword = ref('')
const selected = ref<ModelCatalogItem | null>(null)
const states = ref<Record<string, boolean>>(readStates())
const notice = ref('')
function readStates() {
  try { return { ...Object.fromEntries(MODEL_CATALOG.map((item) => [item.id, true])), ...JSON.parse(localStorage.getItem('huggingpath.vue.orgModels.v1') || '{}') } } catch { return Object.fromEntries(MODEL_CATALOG.map((item) => [item.id, true])) }
}
const filtered = computed(() => MODEL_CATALOG.filter((item) => !keyword.value || `${item.id} ${item.name} ${item.summary}`.toLowerCase().includes(keyword.value.toLowerCase())))
function toggle(id: string, value: boolean) { states.value[id] = value; localStorage.setItem('huggingpath.vue.orgModels.v1', JSON.stringify(states.value)); notice.value = value ? '机构模型已启用。' : '机构模型已停用。'; window.setTimeout(() => { notice.value = '' }, 5000) }
</script>

<template>
  <div class="min-h-[calc(100dvh-64px)] px-4 py-5 lg:px-6"><Teleport to="body"><div v-if="notice" class="fixed left-1/2 top-5 z-[180] -translate-x-1/2 rounded-md border border-[#2c6d5a] bg-[#16342c] px-5 py-3 text-sm text-[#8be2c0] shadow-xl">{{ notice }}</div></Teleport><header class="mb-5"><h1 class="text-2xl font-bold">工作台模型</h1><p class="mt-1 text-sm">配置机构工作台可使用的分析模型和默认参数。</p></header><section class="overflow-hidden rounded-lg border border-white/[0.08] bg-[#202126]"><header class="flex items-center justify-between border-b border-white/[0.07] p-4"><div><h2 class="font-semibold">模型列表</h2><p class="mt-1 text-xs">停用后不再出现在新的任务配置中，已有任务记录不受影响。</p></div><label class="flex h-9 items-center gap-2 rounded-md border border-white/[0.08] bg-[#17181d] px-3"><Search :size="15" class="text-[#64748b]" /><input v-model="keyword" class="w-[260px] bg-transparent text-sm outline-none" placeholder="搜索模型名称或 ID" /></label></header><table class="w-full text-sm"><thead class="bg-[#252730]"><tr><th>模型</th><th>模型 ID</th><th>能力说明</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="item in filtered" :key="item.id" class="border-t border-white/[0.06]"><td><b>{{ item.name }}</b></td><td><code>{{ item.id }}</code></td><td class="max-w-[520px] text-[#94a3b8]">{{ item.summary }}</td><td><StatusSwitch :active="states[item.id]" @change="toggle(item.id,$event)" /></td><td><div class="flex gap-3"><button class="text-[#7dd3fc]" @click="selected=item">查看</button><button class="text-[#d292f4]" @click="selected=item">配置</button></div></td></tr></tbody></table></section><Teleport to="body"><div v-if="selected" class="fixed inset-0 z-[130] grid place-items-center bg-black/75 px-4" @click.self="selected=null"><section class="w-full max-w-[620px] rounded-lg border border-white/[0.10] bg-[#202126]"><header class="flex justify-between border-b border-white/[0.08] p-5"><div><h2 class="text-lg font-semibold">{{ selected.name }}</h2><code class="mt-1 block text-xs text-[#64748b]">{{ selected.id }}</code></div><button @click="selected=null"><X :size="19" /></button></header><div class="p-5"><p class="leading-7">{{ selected.summary }}</p><div class="mt-5 grid gap-4 sm:grid-cols-2"><label class="field">默认批次<input value="16" type="number" /></label><label class="field">置信度阈值<input value="0.5" type="number" step="0.1" /></label><label class="field">默认倍率<select><option>20X</option><option selected>40X</option></select></label><label class="field">执行设备<select><option>GPU</option><option>CPU</option></select></label></div></div><footer class="flex justify-end gap-2 border-t border-white/[0.08] p-4"><button class="btn-secondary" @click="selected=null">关闭</button><button class="btn-primary" @click="selected=null;notice='模型配置已保存。'">保存配置</button></footer></section></div></Teleport></div>
</template>

<style scoped>
th,td{padding:12px 14px;text-align:left}th{font-weight:600;color:#cbd5e1}.field{display:grid;gap:7px;color:#cbd5e1;font-size:13px}.field input,.field select{border:1px solid rgb(255 255 255 / .08);border-radius:6px;background:#17181d;padding:9px 10px;color:#e2e8f0}
</style>
