<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Check, ChevronDown, ChevronRight, Layers, Play, SlidersHorizontal, Sparkles, X } from '@lucide/vue'
import { AVAILABLE_ANALYSIS_MODELS, isModelCompatible } from '@/lib/analysisTasks'
import type { AnalysisConfigurationItem, AnalysisModelAssignments } from '@/lib/analysisConfiguration'
import { getPathologySiteLabel } from '@/lib/pathologySpecimens'

type ConfigurationMode = 'uniform' | 'individual'

const props = withDefaults(defineProps<{
  items: AnalysisConfigurationItem[]
  sourceLabel?: string
}>(), { sourceLabel: '工作台' })
const emit = defineEmits<{ close: []; confirm: [assignments: AnalysisModelAssignments] }>()

const mode = ref<ConfigurationMode>('uniform')
const uniformModelIds = ref<string[]>([])
const individualAssignments = ref<AnalysisModelAssignments>({})
const collapsedGroups = ref<string[]>([])
const collapsedScopeGroups = ref<string[]>([])
let previousBodyOverflow = ''

const uniqueItems = computed(() => {
  const ids = new Set<string>()
  return props.items.filter((item) => {
    if (ids.has(item.id)) return false
    ids.add(item.id)
    return true
  })
})
const groups = computed(() => {
  const grouped = new Map<string, { key: string; label: string; sublabel: string; context: string; items: AnalysisConfigurationItem[] }>()
  uniqueItems.value.forEach((item) => {
    const parent = item.projectName || item.projectId
    const caseLabel = item.caseName || item.caseId
    const key = `${parent || ''}::${caseLabel || 'standalone'}`
    const label = caseLabel ? `Case ${caseLabel}` : parent ? '项目独立 WSI' : '独立 WSI'
    const sublabel = parent ? `${parent} · ${label}` : label
    const context = parent || (caseLabel ? 'Case 内切片' : '未绑定 Case')
    const group = grouped.get(key) || { key, label, sublabel, context, items: [] }
    group.items.push(item)
    grouped.set(key, group)
  })
  return [...grouped.values()]
})
const projectScopes = computed(() => {
  const grouped = new Map<string, { key: string; label: string; items: AnalysisConfigurationItem[] }>()
  uniqueItems.value.forEach((item) => {
    if (!item.projectId && !item.projectName) return
    const key = item.projectId || item.projectName || ''
    const scope = grouped.get(key) || { key, label: item.projectName || item.projectId || '研究项目', items: [] }
    scope.items.push(item)
    grouped.set(key, scope)
  })
  return [...grouped.values()]
})
const effectiveAssignments = computed<AnalysisModelAssignments>(() => {
  if (mode.value === 'individual') return individualAssignments.value
  return Object.fromEntries(uniqueItems.value.map((item) => [
    item.id,
    uniformModelIds.value.filter((modelId) => {
      const model = AVAILABLE_ANALYSIS_MODELS.find((entry) => entry.id === modelId)
      return model ? isModelCompatible(model, item.stain) : false
    }),
  ]))
})
const configuredCount = computed(() => uniqueItems.value.filter((item) => effectiveAssignments.value[item.id]?.length).length)
const runCount = computed(() => uniqueItems.value.reduce((total, item) => total + (effectiveAssignments.value[item.id]?.length || 0), 0))
const canConfirm = computed(() => uniqueItems.value.length > 0 && configuredCount.value === uniqueItems.value.length)

function compatibleCount(modelId: string, items = uniqueItems.value) {
  const model = AVAILABLE_ANALYSIS_MODELS.find((entry) => entry.id === modelId)
  return model ? items.filter((item) => isModelCompatible(model, item.stain)).length : 0
}
function toggleUniform(modelId: string) {
  uniformModelIds.value = uniformModelIds.value.includes(modelId)
    ? uniformModelIds.value.filter((id) => id !== modelId)
    : [...uniformModelIds.value, modelId]
}
function setMode(next: ConfigurationMode) {
  if (next === mode.value) return
  if (next === 'individual' && !Object.keys(individualAssignments.value).length) {
    individualAssignments.value = structuredClone(effectiveAssignments.value)
  }
  mode.value = next
}
function toggleItemModel(item: AnalysisConfigurationItem, modelId: string) {
  const selected = individualAssignments.value[item.id] || []
  individualAssignments.value = {
    ...individualAssignments.value,
    [item.id]: selected.includes(modelId) ? selected.filter((id) => id !== modelId) : [...selected, modelId],
  }
}
function toggleModelsForItems(items: AnalysisConfigurationItem[], modelId: string) {
  const model = AVAILABLE_ANALYSIS_MODELS.find((entry) => entry.id === modelId)
  if (!model) return
  const compatible = items.filter((item) => isModelCompatible(model, item.stain))
  const allSelected = compatible.length > 0 && compatible.every((item) => individualAssignments.value[item.id]?.includes(modelId))
  const next = { ...individualAssignments.value }
  compatible.forEach((item) => {
    const selected = next[item.id] || []
    next[item.id] = allSelected ? selected.filter((id) => id !== modelId) : [...new Set([...selected, modelId])]
  })
  individualAssignments.value = next
}
function toggleGroup(key: string) {
  collapsedGroups.value = collapsedGroups.value.includes(key)
    ? collapsedGroups.value.filter((item) => item !== key)
    : [...collapsedGroups.value, key]
}
function toggleScopeGroup(key: string) {
  collapsedScopeGroups.value = collapsedScopeGroups.value.includes(key)
    ? collapsedScopeGroups.value.filter((item) => item !== key)
    : [...collapsedScopeGroups.value, key]
}
function confirm() {
  if (!canConfirm.value) return
  emit('confirm', structuredClone(effectiveAssignments.value))
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.body.style.overflow = previousBodyOverflow
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="config-overlay" @click.self="emit('close')">
    <section class="config-modal" role="dialog" aria-modal="true" aria-labelledby="analysis-config-title">
      <header class="config-header">
        <div><span class="header-icon"><SlidersHorizontal :size="20" /></span><div><h2 id="analysis-config-title">配置分析模型</h2><p>{{ sourceLabel }} · {{ uniqueItems.length }} 张 WSI</p></div></div>
        <button aria-label="关闭分析配置" @click="emit('close')"><X :size="20" /></button>
      </header>

      <div class="config-mode">
        <button :class="mode==='uniform'&&'active'" @click="setMode('uniform')"><Layers :size="17" /><span><b>统一配置</b><small>全部切片使用同一组模型</small></span><em>推荐</em></button>
        <button :class="mode==='individual'&&'active'" @click="setMode('individual')"><SlidersHorizontal :size="17" /><span><b>按切片配置</b><small>为不同切片指定不同模型</small></span></button>
      </div>

      <div v-if="mode==='uniform'" class="uniform-content">
        <div class="section-heading"><div><h3>选择分析模型</h3><p>系统只会把模型应用到兼容的染色类型。</p></div><span>{{ uniformModelIds.length }} 个模型</span></div>
        <div class="model-grid">
          <button v-for="model in AVAILABLE_ANALYSIS_MODELS" :key="model.id" :disabled="compatibleCount(model.id)===0" :class="['model-card',uniformModelIds.includes(model.id)&&'selected']" @click="toggleUniform(model.id)">
            <span class="model-check"><Check v-if="uniformModelIds.includes(model.id)" :size="14" /></span>
            <span><b>{{ model.name }}</b><small>{{ model.desc }}</small><em>适用于 {{ compatibleCount(model.id) }}/{{ uniqueItems.length }} 张 WSI</em></span>
          </button>
        </div>
        <div v-if="uniformModelIds.length && configuredCount<uniqueItems.length" class="warning"><Sparkles :size="16" />有 {{ uniqueItems.length-configuredCount }} 张切片与所选模型不兼容，请增加兼容模型或改为按切片配置。</div>
        <div class="scope-preview">
          <h3>本次分析范围</h3>
          <article v-for="group in groups" :key="group.key" class="scope-group">
            <button class="scope-group-header" @click="toggleScopeGroup(group.key)">
              <span class="scope-group-title"><ChevronRight v-if="collapsedScopeGroups.includes(group.key)" :size="17" /><ChevronDown v-else :size="17" /><span><b>{{ group.sublabel }}</b><small>{{ group.items.length }} 张 WSI</small></span></span>
              <span class="stain-list"><em v-for="stain in [...new Set(group.items.map(item=>item.stain))]" :key="stain">{{ stain }}</em></span>
            </button>
            <div v-if="!collapsedScopeGroups.includes(group.key)" class="scope-wsi-list">
              <div v-for="item in group.items" :key="item.id" class="scope-wsi-row">
                <img src="/wsi-demo.jpg" alt="WSI" />
                <span><b :title="item.name">{{ item.name }}</b><small>{{ getPathologySiteLabel(item.organ) }} · {{ item.size }}</small></span>
                <em>{{ item.stain }}</em>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div v-else class="individual-content">
        <div class="bulk-toolbar"><div><h3>批量应用到兼容切片</h3><p>可先批量设置，再对个别 WSI 覆盖。</p></div><div><button v-for="model in AVAILABLE_ANALYSIS_MODELS" :key="model.id" @click="toggleModelsForItems(uniqueItems,model.id)">{{ model.name }}<small>{{ compatibleCount(model.id) }}/{{ uniqueItems.length }}</small></button></div></div>
        <div v-if="projectScopes.length>1" class="project-scope-list"><div v-for="scope in projectScopes" :key="scope.key"><span><b>{{ scope.label }}</b><small>{{ scope.items.length }} 张 WSI</small></span><span><button v-for="model in AVAILABLE_ANALYSIS_MODELS" :key="model.id" :disabled="compatibleCount(model.id,scope.items)===0" @click="toggleModelsForItems(scope.items,model.id)">{{ model.name }}<small>{{ compatibleCount(model.id,scope.items) }}/{{ scope.items.length }}</small></button></span></div></div>
        <div class="group-list">
          <article v-for="group in groups" :key="group.key" class="config-group">
            <header><button class="group-title" @click="toggleGroup(group.key)"><ChevronRight v-if="collapsedGroups.includes(group.key)" :size="16" /><ChevronDown v-else :size="16" /><span><b>{{ group.label }}</b><small>{{ group.context }} · {{ group.items.length }} 张 WSI</small></span></button><div><button v-for="model in AVAILABLE_ANALYSIS_MODELS" :key="model.id" :disabled="compatibleCount(model.id,group.items)===0" @click="toggleModelsForItems(group.items,model.id)">{{ model.name }}</button></div></header>
            <div v-if="!collapsedGroups.includes(group.key)" class="wsi-config-list">
              <div v-for="item in group.items" :key="item.id" :class="['wsi-config-row',!effectiveAssignments[item.id]?.length&&'missing']">
                <img src="/wsi-demo.jpg" alt="WSI" /><span class="wsi-meta"><b :title="item.name">{{ item.name }}</b><small>{{ getPathologySiteLabel(item.organ) }} · {{ item.stain }} · {{ item.size }}</small></span>
                <div class="row-models"><button v-for="model in AVAILABLE_ANALYSIS_MODELS" :key="model.id" :disabled="!isModelCompatible(model,item.stain)" :class="effectiveAssignments[item.id]?.includes(model.id)&&'active'" :title="isModelCompatible(model,item.stain)?model.name:`${model.name} 不支持 ${item.stain}`" @click="toggleItemModel(item,model.id)"><Check v-if="effectiveAssignments[item.id]?.includes(model.id)" :size="11" />{{ model.name }}</button></div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <footer class="config-footer">
        <div><span :class="canConfirm?'ready':'pending'" /><p><b>{{ configuredCount }}/{{ uniqueItems.length }}</b> 张 WSI 已配置，预计生成 <b>{{ runCount }}</b> 个模型运行</p></div>
        <div><button class="btn-ghost" @click="emit('close')">取消</button><button :disabled="!canConfirm" class="btn-primary disabled:cursor-not-allowed disabled:opacity-40" @click="confirm"><Play :size="15" />开始分析并进入工作台</button></div>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.config-overlay{position:fixed;inset:0;z-index:170;display:flex;align-items:center;justify-content:center;overflow-y:auto;background:rgb(0 0 0 / .72);padding:20px;backdrop-filter:blur(2px)}.config-modal{display:flex;width:min(1280px,100%);max-height:min(920px,calc(100dvh - 40px));flex-direction:column;overflow:hidden;border:1px solid rgb(255 255 255 / .12);border-radius:12px;background:#202126;box-shadow:0 26px 80px rgb(0 0 0 / .58)}
.config-header{display:flex;min-height:82px;align-items:center;justify-content:space-between;border-bottom:1px solid rgb(255 255 255 / .08);padding:16px 22px}.config-header>div{display:flex;align-items:center;gap:13px}.header-icon{display:grid;width:44px;height:44px;place-items:center;border-radius:9px;background:rgb(143 53 183 / .18);color:#dca0f5}.config-header h2{font-size:20px;font-weight:680}.config-header p{margin-top:4px;color:#8490a3;font-size:13px}.config-header>button{display:grid;width:40px;height:40px;place-items:center;border-radius:7px;color:#94a3b8}.config-header>button:hover{background:rgb(255 255 255 / .07);color:white}
.config-mode{display:grid;grid-template-columns:1fr 1fr;gap:12px;border-bottom:1px solid rgb(255 255 255 / .07);background:#191a1f;padding:13px 18px}.config-mode>button{position:relative;display:flex;min-height:64px;align-items:center;gap:12px;border:1px solid rgb(255 255 255 / .09);border-radius:9px;padding:12px 16px;color:#94a3b8;text-align:left}.config-mode>button:hover{border-color:rgb(255 255 255 / .16);background:rgb(255 255 255 / .03)}.config-mode>button.active{border-color:rgb(143 53 183 / .68);background:rgb(143 53 183 / .15);color:#dca0f5}.config-mode span{min-width:0;flex:1}.config-mode b,.config-mode small{display:block}.config-mode b{color:#e2e8f0;font-size:15px}.config-mode small{margin-top:4px;color:#8490a3;font-size:12px}.config-mode em{border-radius:11px;background:rgb(143 53 183 / .25);padding:3px 8px;font-size:10px;font-style:normal}
.uniform-content,.individual-content{min-height:0;flex:1;overflow-y:auto;padding:22px}.section-heading{display:flex;align-items:center;justify-content:space-between}.section-heading h3,.scope-preview h3,.bulk-toolbar h3{color:#e2e8f0;font-size:15px;font-weight:650}.section-heading p,.bulk-toolbar p{margin-top:4px;color:#8490a3;font-size:12px}.section-heading>span{color:#c084dd;font-size:12px}.model-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.model-card{display:flex;min-height:108px;align-items:flex-start;gap:13px;border:1px solid rgb(255 255 255 / .1);border-radius:10px;background:#18191e;padding:17px;text-align:left}.model-card:hover{border-color:rgb(143 53 183 / .48)}.model-card.selected{border-color:rgb(168 70 210 / .85);background:rgb(143 53 183 / .16);box-shadow:inset 0 0 0 1px rgb(168 70 210 / .14)}.model-card:disabled{cursor:not-allowed;opacity:.4}.model-check{display:grid;width:24px;height:24px;flex:none;place-items:center;border:1px solid rgb(255 255 255 / .2);border-radius:6px;color:white}.model-card.selected .model-check{border-color:#a43bd0;background:#a43bd0}.model-card>span:last-child{min-width:0}.model-card b,.model-card small,.model-card em{display:block}.model-card b{color:#edf2f7;font-size:15px}.model-card small{margin-top:6px;color:#94a3b8;font-size:12.5px}.model-card em{margin-top:12px;color:#d292f4;font-size:11.5px;font-style:normal}.warning{display:flex;align-items:center;gap:8px;margin-top:14px;border:1px solid rgb(234 182 91 / .28);border-radius:7px;background:rgb(234 182 91 / .08);padding:11px 13px;color:#edca7c;font-size:12px}.scope-preview{margin-top:20px;border:1px solid rgb(255 255 255 / .09);border-radius:10px;background:#18191e;padding:16px}.scope-preview>h3{margin-bottom:10px}.scope-group{overflow:hidden;border-top:1px solid rgb(255 255 255 / .07)}.scope-group:first-of-type{border-top:0}.scope-group-header{display:flex;width:100%;align-items:center;justify-content:space-between;gap:14px;padding:12px 4px;text-align:left}.scope-group-header:hover{background:rgb(255 255 255 / .02)}.scope-group-title{display:flex;min-width:0;align-items:center;gap:8px}.scope-group-title>span{min-width:0}.scope-preview b,.scope-preview small{display:block}.scope-preview b{overflow:hidden;color:#dbe3ee;font-size:13px;text-overflow:ellipsis;white-space:nowrap}.scope-preview small{margin-top:3px;color:#718096;font-size:11px}.stain-list{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:5px}.stain-list em{border-radius:5px;background:rgb(255 255 255 / .06);padding:4px 8px;color:#a7b3c4;font-size:10.5px;font-style:normal}.scope-wsi-list{margin:0 4px 12px 28px;overflow:hidden;border:1px solid rgb(255 255 255 / .06);border-radius:7px}.scope-wsi-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:11px;border-top:1px solid rgb(255 255 255 / .055);padding:9px 11px}.scope-wsi-row:first-child{border-top:0}.scope-wsi-row img{width:52px;height:34px;border-radius:5px;object-fit:cover}.scope-wsi-row>span{min-width:0}.scope-wsi-row b,.scope-wsi-row small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.scope-wsi-row b{color:#cbd5e1;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px}.scope-wsi-row small{margin-top:3px;color:#718096;font-size:10.5px}.scope-wsi-row>em{min-width:46px;border-radius:5px;background:rgb(143 53 183 / .13);padding:5px 8px;color:#d292f4;font-size:11px;font-style:normal;text-align:center}
.bulk-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;border:1px solid rgb(143 53 183 / .28);border-radius:10px;background:rgb(143 53 183 / .08);padding:14px 16px}.bulk-toolbar>div:last-child{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.bulk-toolbar button,.config-group>header>div button{min-width:112px;min-height:40px;border:1px solid rgb(143 53 183 / .5);border-radius:7px;padding:9px 13px;color:#e1a6f6;font-size:13px;white-space:nowrap}.bulk-toolbar button:hover,.config-group>header>div button:hover{border-color:rgb(168 70 210 / .85);background:rgb(143 53 183 / .18)}.bulk-toolbar button small{margin-left:7px;color:#c195d3}.group-list{display:grid;gap:12px;margin-top:14px}.config-group{overflow:hidden;border:1px solid rgb(255 255 255 / .09);border-radius:9px;background:#18191e}.config-group>header{display:flex;min-height:64px;align-items:center;justify-content:space-between;gap:12px;background:#1c1d23;padding:12px 14px}.group-title{display:flex;min-width:0;align-items:center;gap:8px;text-align:left}.group-title>span{min-width:0}.group-title b,.group-title small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.group-title b{color:#e2e8f0;font-size:13.5px}.group-title small{margin-top:4px;color:#7f8b9e;font-size:11px}.config-group>header>div{display:flex;flex:none;gap:8px}.config-group>header>div button:disabled{cursor:not-allowed;opacity:.35}.wsi-config-row{display:grid;grid-template-columns:auto minmax(0,1fr) minmax(400px,.95fr);align-items:center;gap:12px;border-top:1px solid rgb(255 255 255 / .06);padding:12px 14px}.wsi-config-row.missing{background:rgb(239 68 68 / .025)}.wsi-config-row>img{width:58px;height:38px;border-radius:5px;object-fit:cover}.wsi-meta{min-width:0}.wsi-meta b,.wsi-meta small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wsi-meta b{color:#d5dde8;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12.5px}.wsi-meta small{margin-top:4px;color:#7f8b9e;font-size:11px}.row-models{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.row-models button{display:flex;min-width:112px;min-height:40px;align-items:center;justify-content:center;gap:6px;border:1px solid rgb(255 255 255 / .16);border-radius:7px;padding:9px 13px;color:#adb8c8;font-size:12.5px;white-space:nowrap}.row-models button:hover:not(:disabled){border-color:rgb(143 53 183 / .58);color:#e7bcf7}.row-models button.active{border-color:rgb(168 70 210 / .85);background:rgb(143 53 183 / .22);color:#f1d2fc}.row-models button:disabled{cursor:not-allowed;opacity:.3}
.project-scope-list{display:grid;gap:8px;margin-top:12px}.project-scope-list>div{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid rgb(255 255 255 / .09);border-radius:8px;background:#18191e;padding:11px 14px}.project-scope-list>div>span:first-child b,.project-scope-list>div>span:first-child small{display:block}.project-scope-list>div>span:first-child b{color:#d5dde8;font-size:12.5px}.project-scope-list>div>span:first-child small{margin-top:3px;color:#718096;font-size:10.5px}.project-scope-list>div>span:last-child{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:7px}.project-scope-list button{min-height:34px;border:1px solid rgb(143 53 183 / .42);border-radius:7px;padding:7px 11px;color:#dca0f5;font-size:11.5px}.project-scope-list button:hover{background:rgb(143 53 183 / .15)}.project-scope-list button:disabled{cursor:not-allowed;opacity:.3}.project-scope-list button small{margin-left:6px;color:#aa82ba}
.config-footer{display:flex;min-height:72px;align-items:center;justify-content:space-between;gap:14px;border-top:1px solid rgb(255 255 255 / .08);padding:14px 22px}.config-footer>div{display:flex;align-items:center;gap:10px}.config-footer>div:last-child{gap:9px}.config-footer>div>span{width:9px;height:9px;border-radius:50%}.config-footer>div>span.ready{background:#22c55e;box-shadow:0 0 0 4px rgb(34 197 94 / .1)}.config-footer>div>span.pending{background:#eab65b;box-shadow:0 0 0 4px rgb(234 182 91 / .1)}.config-footer p{color:#8b98aa;font-size:12px}.config-footer p b{color:#d5dde8}.config-footer button{height:42px;padding-inline:17px;font-size:13px}
@media(max-width:900px){.config-modal{width:100%}.wsi-config-row{grid-template-columns:auto minmax(0,1fr)}.row-models{grid-column:1/-1;justify-content:flex-start}.project-scope-list>div{align-items:flex-start;flex-direction:column}.project-scope-list>div>span:last-child{justify-content:flex-start}}
@media(max-width:700px){.config-overlay{padding:0}.config-modal{width:100%;height:100dvh;max-height:none;border:0;border-radius:0}.config-mode{grid-template-columns:1fr}.model-grid{grid-template-columns:1fr}.uniform-content,.individual-content{padding:15px}.bulk-toolbar{align-items:flex-start;flex-direction:column}.bulk-toolbar>div:last-child{justify-content:flex-start}.config-group>header{align-items:flex-start;flex-direction:column}.scope-wsi-list{margin-left:4px}.config-footer{align-items:stretch;flex-direction:column}.config-footer>div:last-child{justify-content:flex-end}}
</style>
