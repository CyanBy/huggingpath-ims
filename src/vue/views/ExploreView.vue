<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Database, Eye, FileText, FolderOpen, LayoutGrid, List, Play } from '@lucide/vue'
import { MODEL_CATALOG, type ModelCatalogItem } from '@/lib/modelCatalog'

type ViewMode = 'card' | 'list'
type AnalysisTarget = 'wsi' | 'case' | 'project'

const router = useRouter()
const viewMode = ref<ViewMode>('card')
const runMenuModelId = ref<string | null>(null)
const targets = [
  { key: 'wsi' as const, label: 'WSI 切片', desc: '选择已有切片或上传新 WSI', icon: FileText },
  { key: 'case' as const, label: 'Case 病例', desc: '按病例选择需要分析的 WSI', icon: FolderOpen },
  { key: 'project' as const, label: '研究项目', desc: '按项目批量选择 Case 和 WSI', icon: Database },
]

function selectTarget(model: ModelCatalogItem, target: AnalysisTarget) {
  runMenuModelId.value = null
  router.push({ path: '/workbench/tasks/new', query: { model: model.id, target } })
}

function closeMenus(event: MouseEvent) {
  if (event.target instanceof Element && event.target.closest('[data-run-menu]')) return
  runMenuModelId.value = null
}
onMounted(() => window.addEventListener('pointerdown', closeMenus))
onUnmounted(() => window.removeEventListener('pointerdown', closeMenus))
</script>

<template>
  <div class="min-h-[60dvh]">
    <section class="border-b border-white/[0.06] pb-10 pt-20">
      <div class="section-container">
        <span class="text-xs uppercase tracking-[.16em] text-[#64748b]">MODEL HUB</span>
        <h1 class="mt-2 text-3xl font-semibold">探索模型</h1>
        <p class="mt-2">浏览并运行开源病理分割、检测和分类模型</p>
        <div class="mt-8 flex items-center justify-between"><span class="text-xs text-[#64748b]">共 {{ MODEL_CATALOG.length }} 个模型</span><div class="flex rounded-lg bg-[#202228] p-1"><button :class="['view-button', viewMode === 'card' && 'active']" title="卡片视图" @click="viewMode = 'card'"><LayoutGrid :size="16" /></button><button :class="['view-button', viewMode === 'list' && 'active']" title="列表视图" @click="viewMode = 'list'"><List :size="16" /></button></div></div>
      </div>
    </section>

    <section class="section-container py-8 pb-20">
      <div :class="viewMode === 'card' ? 'grid gap-5 md:grid-cols-2' : 'grid gap-3'">
        <article v-for="model in MODEL_CATALOG" :key="model.id" :class="['group border border-white/[0.07] bg-[#24262c] transition-all hover:border-[#8f35b7]/40', viewMode === 'card' ? 'rounded-lg p-5' : 'grid grid-cols-[minmax(200px,.8fr)_minmax(0,1.6fr)_auto] items-center gap-5 rounded-lg px-5 py-4']">
          <div><h2 class="font-semibold group-hover:text-[#d292f4]">{{ model.name }}</h2><code class="mt-1 block text-xs text-[#64748b]">{{ model.id }}</code></div>
          <p :class="['text-sm leading-6', viewMode === 'card' && 'mt-4 min-h-12']">{{ model.summary }}</p>
          <div :class="['flex items-center gap-3', viewMode === 'card' ? 'mt-5 border-t border-white/[0.06] pt-4' : 'justify-end']">
            <button class="btn-secondary h-9" @click="router.push(`/model/${encodeURIComponent(model.id)}`)"><Eye :size="14" />查看详情</button>
            <div class="relative" data-run-menu>
              <button class="btn-primary h-9" @click="runMenuModelId = runMenuModelId === model.id ? null : model.id"><Play :size="14" />运行模型</button>
              <div v-if="runMenuModelId === model.id" class="absolute right-0 top-full z-30 mt-2 w-[292px] rounded-lg border border-white/[0.10] bg-[#202126] p-1.5 shadow-2xl">
                <div class="px-3 py-2 text-xs text-[#64748b]">选择分析对象</div>
                <button v-for="target in targets" :key="target.key" class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-[#8f35b7]/15" @click="selectTarget(model, target.key)"><span class="grid h-8 w-8 place-items-center rounded-md bg-[#8f35b7]/10 text-[#d292f4]"><component :is="target.icon" :size="17" /></span><span><b class="block text-sm">{{ target.label }}</b><small class="text-[#748095]">{{ target.desc }}</small></span></button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.view-button { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 6px; color: #64748b; }
.view-button.active { background: #2b2d33; color: #e2e8f0; }
</style>
