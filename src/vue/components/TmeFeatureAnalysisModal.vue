<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  BarChart3,
  Check,
  Flame,
  Grid3X3,
  Layers,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Table2,
  X,
} from '@lucide/vue'
import type { AnalysisTaskObjectRecord } from '@/lib/analysisTasks'
import {
  getSparkSlideSummary,
  SPARK_FEATURE_CATEGORIES,
  SPARK_FEATURES,
  type SparkFeatureDefinition,
} from '../data/sparkFeatures'

type ResultTab = 'heatmap' | 'table' | 'spatial'

const props = defineProps<{
  objects: AnalysisTaskObjectRecord[]
  currentObjectId?: string
}>()

const emit = defineEmits<{
  close: []
  selectObject: [objectId: string]
}>()

const fullFeatures = SPARK_FEATURES
const resultTab = ref<ResultTab>('heatmap')
const query = ref('')
const category = ref('全部类别')
const popularOnly = ref(false)
const selectedFeatureIds = ref<Set<string>>(new Set(fullFeatures.map((feature) => feature.id)))
const activeFeatureId = ref(fullFeatures[0].id)
const activeObjectId = ref(props.currentObjectId || props.objects[0]?.id || '')
const spatialOverlay = ref(true)
const spatialRefreshSeed = ref(0)
const running = ref(false)
const progress = ref(0)
const hasResult = ref(true)
let runTimer: number | undefined

const features = computed(() => fullFeatures)
const selectedFeatures = computed(() => features.value.filter((feature) => selectedFeatureIds.value.has(feature.id)))
const activeFeature = computed(() => features.value.find((feature) => feature.id === activeFeatureId.value) || features.value[0])
const filteredFeatures = computed(() => {
  const text = query.value.trim().toLowerCase()
  return features.value.filter((feature) =>
    (category.value === '全部类别' || feature.category === category.value)
    && (!popularOnly.value || feature.popular)
    && (!text || `${feature.name} ${feature.category}`.toLowerCase().includes(text)),
  )
})
const tableFeatures = computed(() => selectedFeatures.value)
const comparisonFeatures = computed(() => selectedFeatures.value.slice(0, 12))
const analyzedObjects = computed(() => props.objects.length ? props.objects : [{
  id: 'preview-wsi',
  name: '24-8774.sdpc',
  meta: 'TME 演示切片',
  status: '分析完成' as const,
  modelIds: ['mod-tme'],
}])
const selectedObject = computed(() => analyzedObjects.value.find((item) => item.id === activeObjectId.value) || analyzedObjects.value[0])
const spatialFeatures = computed(() => selectedFeatures.value.filter((feature) => feature.spatial))
const spatialCells = computed(() => Array.from({ length: 88 }, (_, index) => {
  const value = normalizedValue(Math.max(0, analyzedObjects.value.findIndex((item) => item.id === selectedObject.value?.id)), features.value.indexOf(activeFeature.value), index + spatialRefreshSeed.value)
  return { value, x: (index % 11) * 9.1, y: Math.floor(index / 11) * 12.5 }
}))
const summary = computed(() => getSparkSlideSummary(
  analyzedObjects.value.findIndex((item) => item.id === selectedObject.value?.id),
))

watch(() => props.currentObjectId, (value) => {
  if (value) activeObjectId.value = value
})

watch(resultTab, (value) => {
  if (value === 'spatial' && !activeFeature.value?.spatial && spatialFeatures.value[0]) {
    activeFeatureId.value = spatialFeatures.value[0].id
  }
})

function normalizedValue(rowIndex: number, featureIndex: number, salt = 0) {
  const raw = (Math.sin((rowIndex + 1) * 1.71 + (featureIndex + 2) * 0.83 + salt * 0.19)
    + Math.cos((rowIndex + 3) * 0.47 - featureIndex * 0.39 + salt * 0.11)) / 4 + 0.5
  return Math.max(0.001, Math.min(0.999, raw))
}

function rawValue(rowIndex: number, featureIndex: number) {
  const normalized = normalizedValue(rowIndex, featureIndex)
  if (featureIndex % 9 === 0) return normalized * 0.00024
  if (featureIndex % 7 === 0) return normalized * 12 - 4
  if (featureIndex % 5 === 0) return normalized * 180
  return normalized
}

function formattedValue(rowIndex: number, featureIndex: number) {
  const value = rawValue(rowIndex, featureIndex)
  if (Math.abs(value) < 0.001) return value.toExponential(2)
  if (Math.abs(value) >= 100) return value.toFixed(1)
  return value.toFixed(3)
}

function heatColor(value: number) {
  if (value >= 0.82) return '#dce530'
  if (value >= 0.66) return '#e38a4b'
  if (value >= 0.5) return '#45a68f'
  if (value >= 0.34) return '#3aca25'
  if (value >= 0.18) return '#2f8597'
  return '#22558f'
}

function toggleFeature(id: string) {
  const next = new Set(selectedFeatureIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedFeatureIds.value = next
  if (next.has(id)) activeFeatureId.value = id
}

function selectPopular() {
  selectedFeatureIds.value = new Set(features.value.filter((feature) => feature.popular).map((feature) => feature.id))
  activeFeatureId.value = features.value.find((feature) => feature.popular)?.id || features.value[0].id
}

function selectAll() {
  selectedFeatureIds.value = new Set(features.value.map((feature) => feature.id))
}

function clearSelection() {
  selectedFeatureIds.value = new Set()
}

function startAnalysis() {
  if (running.value || !selectedFeatureIds.value.size) return
  running.value = true
  progress.value = 4
  hasResult.value = false
  window.clearInterval(runTimer)
  runTimer = window.setInterval(() => {
    progress.value = Math.min(100, progress.value + 12)
    if (progress.value >= 100) {
      window.clearInterval(runTimer)
      running.value = false
      hasResult.value = true
    }
  }, 120)
}

function clearAndRerun() {
  hasResult.value = false
  progress.value = 0
  startAnalysis()
}

function openObject(objectId: string) {
  activeObjectId.value = objectId
  emit('selectObject', objectId)
}

function featureStats(feature: SparkFeatureDefinition) {
  const featureIndex = features.value.indexOf(feature)
  const values = analyzedObjects.value.map((_, rowIndex) => rawValue(rowIndex, featureIndex)).sort((a, b) => a - b)
  const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length)
  const middle = Math.floor(values.length / 2)
  const median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2
  const format = (value: number) => Math.abs(value) < 0.001 ? value.toExponential(2) : value.toFixed(3)
  return {
    n: values.length,
    mean: format(mean),
    sd: format(Math.sqrt(variance)),
    median: format(median || 0),
    min: format(values[0] || 0),
    max: format(values.at(-1) || 0),
  }
}

onBeforeUnmount(() => window.clearInterval(runTimer))
</script>

<template>
  <Teleport to="body">
    <div class="tme-modal-backdrop" @click.self="emit('close')">
      <section class="tme-modal" role="dialog" aria-modal="true" aria-label="SPARK 特征分析">
        <header class="tme-modal-header">
          <div><h2><Sparkles :size="17" />SPARK 特征分析 · 全量 951 维向量特征</h2><p>全量计算细胞、组织和空间关系特征，并从已分析切片生成批量统计。</p></div>
          <button title="关闭" @click="emit('close')"><X :size="18" /></button>
        </header>

        <div class="tme-modal-body">
          <aside class="tme-sidebar">
            <section class="current-slide"><span>当前切片</span><b :title="selectedObject?.name">{{ selectedObject?.name }}</b></section>
            <div class="full-mode-badge"><Sparkles :size="14" /><span>全量模式</span><b>951 个特征</b></div>
            <button class="run-button" :disabled="running || !selectedFeatureIds.size" @click="startAnalysis"><Play :size="15" />{{ running ? `分析中 ${progress}%` : '开始全量特征分析' }}</button>
            <button class="rerun-button" :disabled="running" @click="clearAndRerun"><RotateCcw :size="14" />清理结果重跑</button>

            <dl class="run-summary">
              <div><dt>模式</dt><dd>FULL 951</dd></div>
              <div><dt>特征数</dt><dd>{{ summary.featureCount }} <small>({{ summary.validCount }} 有效)</small></dd></div>
              <div><dt>耗时</dt><dd>{{ summary.seconds.toFixed(1) }}s</dd></div>
              <div><dt>细胞数</dt><dd>{{ summary.cellCount.toLocaleString() }}</dd></div>
              <div><dt>ROI</dt><dd>{{ summary.roiCount.toLocaleString() }}</dd></div>
              <div><dt>计算</dt><dd class="full">全量路径</dd></div>
            </dl>

            <div class="feature-selection-title"><span>特征选择</span><b>{{ selectedFeatureIds.size }} 选中 / {{ features.length }}</b></div>
            <label class="feature-search"><Search :size="14" /><input v-model="query" placeholder="搜索特征名/类别..." /></label>
            <div class="feature-filter-row"><select v-model="category"><option>全部类别</option><option v-for="name in SPARK_FEATURE_CATEGORIES" :key="name">{{ name }}</option></select><label><input v-model="popularOnly" type="checkbox" />仅热门</label></div>
            <div class="quick-actions"><button @click="selectPopular"><Flame :size="12" />默认热门</button><button @click="selectAll">全选</button><button @click="clearSelection">清空</button></div>
            <div class="feature-options">
              <button v-for="feature in filteredFeatures" :key="feature.id" :class="[selectedFeatureIds.has(feature.id) && 'selected', activeFeatureId === feature.id && 'active']" @click="toggleFeature(feature.id)">
                <i><Check v-if="selectedFeatureIds.has(feature.id)" :size="10" /></i><span><b :title="feature.name">{{ feature.name }}</b><small>{{ feature.category }}</small></span><Flame v-if="feature.popular" :size="12" />
              </button>
              <p v-if="!filteredFeatures.length">没有符合条件的特征</p>
            </div>
          </aside>

          <main class="tme-results">
            <nav class="tme-tabs"><button :class="resultTab === 'heatmap' && 'active'" @click="resultTab = 'heatmap'"><Grid3X3 :size="14" />热力图 + 统计</button><button :class="resultTab === 'table' && 'active'" @click="resultTab = 'table'"><Table2 :size="14" />完整特征表（{{ selectedFeatureIds.size }}）</button><button :class="resultTab === 'spatial' && 'active'" @click="resultTab = 'spatial'"><Layers :size="14" />空间热力图</button><span>已分析切片：{{ hasResult ? analyzedObjects.length : 0 }} · 全量模式</span></nav>

            <div v-if="running" class="analysis-progress"><i :style="{ width: `${progress}%` }" /><span>正在计算 {{ selectedFeatureIds.size }} 个特征 · {{ progress }}%</span></div>
            <div v-if="!hasResult && !running" class="empty-result"><Sparkles :size="28" /><b>尚无特征结果</b><span>在左侧选择特征后开始分析。</span></div>

            <template v-else-if="resultTab === 'heatmap'">
              <section class="heatmap-section">
                <header><div><h3>特征热力图</h3><p>每列按切片归一化；悬停单元格查看原始值。</p></div><span>显示前 {{ comparisonFeatures.length }} / {{ selectedFeatureIds.size }} 个已选特征</span></header>
                <div class="table-scroll heatmap-scroll">
                  <table class="tme-heatmap-table"><thead><tr><th>切片</th><th v-for="feature in comparisonFeatures" :key="feature.id" :title="feature.name">{{ feature.name }}</th></tr></thead><tbody><tr v-for="(object, rowIndex) in analyzedObjects" :key="object.id" :class="activeObjectId === object.id && 'active'" @click="openObject(object.id)"><th :title="object.name">{{ object.name.replace(/\.[^.]+$/, '') }}</th><td v-for="feature in comparisonFeatures" :key="feature.id" :style="{ background: heatColor(normalizedValue(rowIndex, features.indexOf(feature))) }" :title="`${object.name} · ${feature.name}: ${formattedValue(rowIndex, features.indexOf(feature))}`"><span>{{ formattedValue(rowIndex, features.indexOf(feature)) }}</span></td></tr></tbody></table>
                </div>
              </section>
              <section class="statistics-section">
                <header><h3><BarChart3 :size="14" />统计分布</h3><span>跨 {{ analyzedObjects.length }} 张切片</span></header>
                <div class="table-scroll"><table class="statistics-table"><thead><tr><th>特征</th><th>类别</th><th>n</th><th>均值</th><th>标准差</th><th>中位数</th><th>最小</th><th>最大</th></tr></thead><tbody><tr v-for="feature in comparisonFeatures" :key="feature.id"><th :title="feature.name">{{ feature.name }}</th><td>{{ feature.category }}</td><td>{{ featureStats(feature).n }}</td><td>{{ featureStats(feature).mean }}</td><td>{{ featureStats(feature).sd }}</td><td>{{ featureStats(feature).median }}</td><td>{{ featureStats(feature).min }}</td><td>{{ featureStats(feature).max }}</td></tr></tbody></table></div>
              </section>
            </template>

            <section v-else-if="resultTab === 'table'" class="full-table-section">
              <header><div><h3>完整特征表</h3><p>{{ analyzedObjects.length }} 张切片 × {{ tableFeatures.length }} 个已选特征</p></div><span>横向滚动查看全部特征</span></header>
              <div class="table-scroll"><table class="full-feature-table"><thead><tr><th>切片</th><th v-for="feature in tableFeatures" :key="feature.id" :title="feature.name">{{ feature.name }}</th></tr></thead><tbody><tr v-for="(object, rowIndex) in analyzedObjects" :key="object.id"><th :title="object.name">{{ object.name }}</th><td v-for="feature in tableFeatures" :key="feature.id">{{ formattedValue(rowIndex, features.indexOf(feature)) }}</td></tr></tbody></table></div>
            </section>

            <section v-else class="spatial-section">
              <div class="spatial-control-bar">
                <label class="spatial-feature-select"><span>空间特征</span><select v-model="activeFeatureId"><option v-for="feature in spatialFeatures" :key="feature.id" :value="feature.id">{{ feature.name }}</option></select></label>
                <label class="spatial-overlay-toggle"><input v-model="spatialOverlay" type="checkbox" />叠加到切片</label>
                <label class="spatial-object-select"><span>切片</span><select v-model="activeObjectId"><option v-for="object in analyzedObjects" :key="object.id" :value="object.id">{{ object.name }}</option></select></label>
                <button @click="spatialRefreshSeed += 17"><RotateCcw :size="14" />刷新</button>
              </div>
              <div class="spatial-body">
                <aside><h3>空间特征</h3><p>{{ spatialFeatures.length }} 个已选特征支持空间结果，点击切换预览。</p><button v-for="feature in spatialFeatures" :key="feature.id" :class="activeFeatureId === feature.id && 'active'" @click="activeFeatureId = feature.id"><span>{{ feature.name }}</span><small>{{ feature.category }}</small></button><p v-if="!spatialFeatures.length">请先选择至少一个空间特征。</p></aside>
                <div class="spatial-viewer"><header><div><b>{{ selectedObject?.name }}</b><span>{{ activeFeature?.name }}</span></div><em>全量空间结果 · {{ spatialCells.length }} 个示例网格</em></header><div class="spatial-canvas"><img src="/wsi-cmu-region.jpg" alt="SPARK 空间热力图示例切片" /><div v-if="spatialOverlay" class="spatial-grid"><i v-for="(cell, index) in spatialCells" :key="index" :style="{ left: `${cell.x}%`, top: `${cell.y}%`, background: heatColor(cell.value) }" :title="cell.value.toFixed(3)" /></div><div class="spatial-legend"><span>低</span><i /><span>高</span></div></div></div>
              </div>
            </section>
          </main>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.tme-modal-backdrop{position:fixed;inset:0;z-index:120;display:grid;place-items:center;background:rgb(3 4 8 / .72);padding:28px}.tme-modal{display:flex;width:min(1500px,96vw);height:min(920px,92vh);overflow:hidden;flex-direction:column;border:1px solid #3b3550;border-radius:10px;background:#101119;color:#d8dee9;box-shadow:0 28px 90px rgb(0 0 0 / .65)}.tme-modal-header{display:flex;height:66px;flex:none;align-items:center;justify-content:space-between;border-bottom:1px solid #292b38;padding:0 16px}.tme-modal-header h2{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700}.tme-modal-header h2 svg{color:#c869eb}.tme-modal-header p{margin-top:4px;color:#778398;font-size:10px}.tme-modal-header>button{display:grid;width:32px;height:32px;place-items:center;border-radius:5px;color:#9aa6b8}.tme-modal-header>button:hover{background:#252733;color:white}.tme-modal-body{display:grid;min-height:0;flex:1;grid-template-columns:300px minmax(0,1fr)}.tme-sidebar{min-height:0;overflow:hidden;border-right:1px solid #292b38;padding:12px}.current-slide span,.current-slide b{display:block}.current-slide span{color:#778398;font-size:10px}.current-slide b{margin-top:5px;overflow:hidden;color:#b6c0d0;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.mode-switch{display:grid;height:34px;grid-template-columns:1fr 1fr;margin-top:12px;border:1px solid #373950;border-radius:5px;background:#171822;padding:2px}.mode-switch button{border-radius:3px;color:#8792a5;font-size:10px}.mode-switch button.active{background:#3f5fd0;color:white}.run-button,.rerun-button{display:flex;width:100%;align-items:center;justify-content:center;gap:7px;border-radius:5px;font-size:12px;font-weight:600}.run-button{height:38px;margin-top:9px;background:#3e63db;color:white}.run-button:disabled,.rerun-button:disabled{cursor:not-allowed;opacity:.45}.rerun-button{height:32px;margin-top:7px;border:1px solid #6e4a2c;background:#2a2018;color:#e3b77d}.run-summary{display:grid;gap:5px;margin-top:11px;border-top:1px solid #292b38;border-bottom:1px solid #292b38;padding:10px 0}.run-summary>div{display:flex;align-items:center;justify-content:space-between;font-size:10px}.run-summary dt{color:#737f93}.run-summary dd{font-weight:600}.run-summary small{color:#687489}.run-summary .fast{color:#64da91}.feature-selection-title{display:flex;align-items:center;justify-content:space-between;margin-top:10px;font-size:10px}.feature-selection-title span{color:#7d899d}.feature-selection-title b{color:#c0c9d7}.feature-search{display:flex;height:30px;align-items:center;gap:6px;margin-top:7px;border:1px solid #343748;border-radius:4px;background:#171822;padding:0 8px;color:#687489}.feature-search input{min-width:0;width:100%;background:transparent;font-size:10px;outline:none}.feature-filter-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;margin-top:6px}.feature-filter-row select{height:29px;border:1px solid #343748;border-radius:4px;background:#171822;padding:0 7px;color:#a6b0c0;font-size:10px}.feature-filter-row label{display:flex;align-items:center;gap:4px;color:#929daf;font-size:10px}.feature-filter-row input{accent-color:#4b6cdf}.quick-actions{display:flex;gap:5px;margin-top:7px}.quick-actions button{display:flex;height:27px;align-items:center;gap:3px;border:1px solid #343748;border-radius:4px;padding:0 7px;color:#a6b0c0;font-size:9px}.quick-actions button:hover{border-color:#59617a;color:white}.quick-actions svg{color:#e5bc49}.feature-options{height:calc(100% - 359px);min-height:120px;overflow-y:auto;margin-top:7px;border:1px solid #2b2e3c;border-radius:5px;background:#14151d}.feature-options button{display:grid;width:100%;min-height:35px;grid-template-columns:14px minmax(0,1fr) 14px;align-items:center;gap:6px;border-bottom:1px solid #242633;padding:4px 7px;text-align:left}.feature-options button:hover,.feature-options button.active{background:#202230}.feature-options button>i{display:grid;width:11px;height:11px;place-items:center;border:1px solid #546078;border-radius:2px}.feature-options button.selected>i{border-color:#5474e5;background:#5474e5;color:white}.feature-options button span{min-width:0}.feature-options b,.feature-options small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.feature-options b{color:#b7c1d1;font-size:9px}.feature-options small{margin-top:2px;color:#667287;font-size:8px}.feature-options>p{padding:20px;color:#667287;font-size:10px;text-align:center}.feature-options svg{color:#dbb94d}.tme-results{display:flex;min-width:0;min-height:0;flex-direction:column}.tme-tabs{display:flex;height:45px;flex:none;align-items:center;gap:3px;border-bottom:1px solid #292b38;padding:0 12px}.tme-tabs button{display:flex;height:32px;align-items:center;gap:6px;border-radius:4px;padding:0 11px;color:#8792a5;font-size:10px}.tme-tabs button.active{background:#292b45;color:#e2e6ed}.tme-tabs>span{margin-left:auto;color:#687489;font-size:9px}.analysis-progress{position:relative;height:32px;overflow:hidden;flex:none;border-bottom:1px solid #2c2e3b;background:#161721}.analysis-progress i{position:absolute;inset:0 auto 0 0;background:rgb(62 99 219 / .18);transition:width .12s}.analysis-progress span{position:relative;display:flex;height:100%;align-items:center;padding-left:13px;color:#92a6eb;font-size:10px}.empty-result{display:grid;min-height:0;flex:1;place-content:center;justify-items:center;color:#667287}.empty-result b{margin-top:9px;color:#aeb8c7;font-size:13px}.empty-result span{margin-top:4px;font-size:10px}.heatmap-section{display:flex;min-height:0;flex:1.35;flex-direction:column;padding:14px 14px 0}.heatmap-section>header,.full-table-section>header{display:flex;flex:none;align-items:flex-start;justify-content:space-between}.heatmap-section h3,.full-table-section h3,.statistics-section h3{font-size:11px;font-weight:700}.heatmap-section p,.full-table-section p{margin-top:3px;color:#677387;font-size:9px}.heatmap-section header>span,.full-table-section header>span{color:#69758a;font-size:9px}.table-scroll{min-width:0;overflow:auto;border:1px solid #292c3a;background:#12131b}.heatmap-scroll{min-height:150px;flex:1;margin-top:8px}.table-scroll table{border-collapse:collapse;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:9px}.table-scroll th,.table-scroll td{height:30px;border-right:1px solid #252836;border-bottom:1px solid #252836;padding:0 9px;white-space:nowrap}.table-scroll thead th{position:sticky;top:0;z-index:3;background:#1a1b27;color:#858fa3;font-weight:600}.table-scroll tr>th:first-child{position:sticky;left:0;z-index:2;max-width:190px;overflow:hidden;background:#1a1b27;color:#bbc4d2;text-overflow:ellipsis}.tme-heatmap-table td{min-width:90px;color:#eef2f7;text-align:center}.tme-heatmap-table td span{opacity:0;transition:opacity .12s}.tme-heatmap-table td:hover span{opacity:1}.tme-heatmap-table tr{cursor:pointer}.tme-heatmap-table tr.active>th:first-child{color:#efd264}.statistics-section{display:flex;min-height:190px;flex:1;flex-direction:column;padding:10px 14px 14px}.statistics-section>header{display:flex;height:24px;flex:none;align-items:center;justify-content:space-between}.statistics-section h3{display:flex;align-items:center;gap:6px}.statistics-section header span{color:#69758a;font-size:9px}.statistics-section .table-scroll{min-height:0;flex:1}.statistics-table{width:100%}.statistics-table th:first-child{width:230px;text-align:left}.statistics-table th,.statistics-table td{text-align:right}.statistics-table th:nth-child(2),.statistics-table td:nth-child(2){text-align:left}.full-table-section{display:flex;min-height:0;flex:1;flex-direction:column;padding:14px}.full-table-section>.table-scroll{min-height:0;flex:1;margin-top:10px}.full-feature-table td{min-width:88px;text-align:right}.spatial-section{display:grid;min-height:0;flex:1;grid-template-columns:250px minmax(0,1fr)}.spatial-section>aside{overflow-y:auto;border-right:1px solid #292b38;padding:12px}.spatial-section>aside h3{font-size:12px}.spatial-section>aside>p{margin:4px 0 9px;color:#69758a;font-size:9px}.spatial-section>aside button{display:block;width:100%;border-bottom:1px solid #262835;padding:7px 8px;text-align:left}.spatial-section>aside button:hover,.spatial-section>aside button.active{background:#222433}.spatial-section>aside span,.spatial-section>aside small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.spatial-section>aside span{font-size:9px}.spatial-section>aside small{margin-top:2px;color:#69758a;font-size:8px}.spatial-viewer{display:flex;min-width:0;min-height:0;flex-direction:column;padding:14px}.spatial-viewer>header{display:flex;height:42px;flex:none;align-items:flex-start;justify-content:space-between}.spatial-viewer header b,.spatial-viewer header span{display:block;max-width:460px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.spatial-viewer header b{font-size:11px}.spatial-viewer header span{margin-top:3px;color:#a975bf;font-size:9px}.spatial-viewer label{display:flex;align-items:center;gap:6px;color:#69758a;font-size:9px}.spatial-viewer select{max-width:240px;height:28px;border:1px solid #343748;border-radius:4px;background:#171822;padding:0 7px;color:#aeb8c7}.spatial-canvas{position:relative;min-height:0;flex:1;overflow:hidden;border:1px solid #292c3a;background:#08090d}.spatial-canvas>img{display:block;width:100%;height:100%;object-fit:contain}.spatial-grid{position:absolute;inset:4% 18%;opacity:.72}.spatial-grid i{position:absolute;width:8.5%;aspect-ratio:1;border:1px solid rgb(255 255 255 / .14)}.spatial-legend{position:absolute;right:15px;bottom:15px;display:flex;align-items:center;gap:6px;border:1px solid #343748;border-radius:4px;background:rgb(16 17 25 / .9);padding:7px 9px;color:#94a0b3;font-size:8px}.spatial-legend i{display:block;width:120px;height:6px;border-radius:3px;background:linear-gradient(90deg,#22558f,#2f8597,#3aca25,#45a68f,#e38a4b,#dce530)}
.full-mode-badge{display:flex;height:38px;align-items:center;gap:7px;margin-top:12px;border:1px solid #4d609f;border-radius:5px;background:#202640;padding:0 10px;color:#c1cdf4}.full-mode-badge span{font-size:13px;font-weight:600}.full-mode-badge b{margin-left:auto;color:#90a7f4;font-size:12px}.spatial-section{display:flex;min-height:0;flex:1;flex-direction:column}.spatial-control-bar{display:grid;min-height:58px;flex:none;grid-template-columns:minmax(0,1.5fr) auto minmax(220px,.7fr) auto;align-items:center;gap:9px;border-bottom:1px solid #292b38;padding:9px 12px}.spatial-control-bar label{display:flex;min-width:0;align-items:center;gap:7px;color:#8995a8;font-size:12px}.spatial-control-bar select{min-width:0;height:36px;flex:1;border:1px solid #3c4052;border-radius:5px;background:#171822;padding:0 9px;color:#d1d7e2;font-size:12px}.spatial-overlay-toggle{white-space:nowrap}.spatial-overlay-toggle input{accent-color:#5474e5}.spatial-control-bar>button{display:flex;height:36px;align-items:center;gap:6px;border:1px solid #3c4052;border-radius:5px;padding:0 10px;color:#aab5c5;font-size:12px}.spatial-control-bar>button:hover{border-color:#5474e5;color:white}.spatial-body{display:grid;min-height:0;flex:1;grid-template-columns:270px minmax(0,1fr)}.spatial-body>aside{min-height:0;overflow-y:auto;border-right:1px solid #292b38;padding:12px}.spatial-body>aside h3{font-size:15px}.spatial-body>aside>p{margin:4px 0 9px;color:#69758a;font-size:12px}.spatial-body>aside button{display:block;width:100%;border-bottom:1px solid #262835;padding:8px;text-align:left}.spatial-body>aside button:hover,.spatial-body>aside button.active{background:#222433}.spatial-body>aside span,.spatial-body>aside small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.spatial-body>aside span{font-size:12px}.spatial-body>aside small{margin-top:2px;color:#69758a;font-size:11px}.spatial-viewer header em{color:#78859a;font-size:11px;font-style:normal}
/* SPARK 面板承担密集数据阅读，统一提高文字和控件字号，避免只放大标题后表格仍难辨认。 */
.run-summary .full{color:#90a7f4}
.tme-modal-body{grid-template-columns:330px minmax(0,1fr)}.tme-modal-header h2{font-size:18px}.tme-modal-header p{font-size:13px}.current-slide span{font-size:13px}.current-slide b{font-size:15px}.mode-switch button{font-size:13px}.run-button,.rerun-button{font-size:14px}.run-summary>div,.feature-selection-title{font-size:13px}.run-summary small{font-size:11px}.feature-search input,.feature-filter-row select,.feature-filter-row label{font-size:13px}.quick-actions button{font-size:12px}.feature-options b{font-size:12px}.feature-options small{font-size:11px}.feature-options button{min-height:44px}.tme-tabs button{font-size:13px}.tme-tabs>span,.analysis-progress span{font-size:12px}.heatmap-section h3,.full-table-section h3,.statistics-section h3{font-size:14px}.heatmap-section p,.full-table-section p,.heatmap-section header>span,.full-table-section header>span,.statistics-section header span{font-size:12px}.table-scroll table{font-size:12px}.table-scroll th,.table-scroll td{height:38px}.spatial-section>aside h3{font-size:15px}.spatial-section>aside>p,.spatial-section>aside span,.spatial-viewer header span,.spatial-viewer label{font-size:12px}.spatial-section>aside small{font-size:11px}.spatial-viewer header b{font-size:14px}.spatial-legend{font-size:11px}
@media(max-width:1000px){.tme-modal-backdrop{padding:10px}.tme-modal{width:100%;height:96vh}.tme-modal-body{grid-template-columns:250px minmax(0,1fr)}.tme-tabs>span{display:none}}
</style>
