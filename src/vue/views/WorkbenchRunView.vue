<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Columns2,
  Grid3X3,
  History,
  Info,
  LayoutGrid,
  Layers,
  Link2,
  Maximize2,
  MousePointer2,
  Pin,
  Play,
  RotateCcw,
  ScanSearch,
  Search,
  Settings,
  Square,
  Trash2,
  Undo2,
  Unlink2,
  X,
  ZoomIn,
  ZoomOut,
} from '@lucide/vue'
import {
  AVAILABLE_ANALYSIS_MODELS,
  deletePendingObject,
  getCaseAnalysisHistory,
  getModelDefinition,
  getObjectRuns,
  getTaskDisplayName,
  getWsiAnalysisHistory,
  isModelCompatible,
  reanalyzeAnalysisObject,
  reanalyzeTask,
  setObjectModelSelection,
  startAnalysisTask,
  stopAnalysisObject,
  stopAnalysisTask,
  type AnalysisModelRunRecord,
  type AnalysisTaskObjectRecord,
  type AnalysisTaskRecord,
  type AnalysisTaskStatus,
} from '@/lib/analysisTasks'
import { useAnalysisTasks } from '../composables/useAnalysisTasks'
import { useWorkspaceData } from '../composables/useWorkspaceData'
import { getPathologySiteLabel, getSamplingMethodLabel } from '@/lib/pathologySpecimens'
import TmeFeatureAnalysisModal from '../components/TmeFeatureAnalysisModal.vue'
import {
  getSparkSlideSummary,
  SPARK_FEATURE_CATEGORIES,
  SPARK_FEATURES,
  type SparkFeatureDefinition,
} from '../data/sparkFeatures'

type ResultTab = 'quantitative' | 'features'
type ViewerLayout = '1x1' | '1x2' | '2x2'
type ViewerPanel = 'help' | 'settings' | 'info' | null
type InfoPanelTab = 'metadata' | 'labels'
type CountType = 'positive' | 'negative'
type Point = { x: number; y: number }
type RoiRect = { x: number; y: number; width: number; height: number }
type HeatmapCell = { x: number; y: number; value: number }
type CountMarker = { id: number; x: number; y: number; type: CountType }
type AnnotationLabel = { id: string; name: string; color: string; visible: boolean; opacity: number; count: number }
type NucleusAnnotation = { id: number; x: number; y: number; labelId: string }
type RegionAnnotation = { id: number; x: number; y: number; width: number; height: number; rotate: number; labelId: string }

const route = useRoute()
const router = useRouter()
const { tasks, refresh } = useAnalysisTasks(true)
const { cases } = useWorkspaceData()
const taskId = computed(() => String(route.params.taskId || ''))
const task = computed(() => tasks.value.find((item) => item.id === taskId.value) || null)

const selectedId = ref('')
const search = ref('')
const resultTab = ref<ResultTab>('quantitative')
const zoom = ref(20)
const viewerFrame = ref<HTMLElement | null>(null)
const slideStage = ref<HTMLElement | null>(null)
const pan = ref<Point>({ x: 0, y: 0 })
const dragStart = ref<{ pointer: Point; pan: Point } | null>(null)
const roiStart = ref<Point | null>(null)
const roiRect = ref<RoiRect | null>(null)
const roiMode = ref(false)
const magnifierMode = ref(false)
const magnifierPinned = ref(false)
const magnifierPoint = ref<Point | null>(null)
const magnifierZoom = ref(3)
const countMode = ref(false)
const countType = ref<CountType>('positive')
const countMarkersByObject = ref<Record<string, CountMarker[]>>({})
const markerSequence = ref(0)
const showNuclei = ref(true)
const showTissueRegions = ref(true)
const annotationOpacity = ref(100)
const nucleusOpacity = ref(100)
const regionOpacity = ref(100)
const showFeatureLayer = ref(false)
const opacity = ref(70)
const smoothNavigation = ref(true)
const viewerLayout = ref<ViewerLayout>('1x1')
const showLayoutMenu = ref(false)
const splitLinked = ref(true)
const splitObjectIds = ref<string[]>([])
const splitPaneZooms = ref<number[]>([])
const activeSplitPane = ref(0)
const viewerPanel = ref<ViewerPanel>(null)
const infoPanelTab = ref<InfoPanelTab>('metadata')
const pixelPosition = ref<Point | null>(null)
const featureCategory = ref('全部类别')
const featureSearch = ref('')
const selectedFeatureId = ref('spark-1')
const activeResultModelId = ref('')
const fileNameTip = ref<{ text: string; x: number; y: number } | null>(null)
const fileNameTipElement = ref<HTMLElement | null>(null)
const showTmeFeatureAnalysis = ref(false)
const caseInfoExpanded = ref(true)
const historyExpanded = ref(Boolean(route.query.historyScope))

const zoomLevels = [0.5, 1, 4, 10, 20, 40, 80]
const slidePixelSize = { width: 22200, height: 29670 }
const nucleusLabels = ref<AnnotationLabel[]>([
  { id: 'exclude', name: 'Exclude', color: '#111827', visible: true, opacity: 100, count: 18557 },
  { id: 'cancer', name: 'Cancer nucleus', color: '#ef4444', visible: true, opacity: 100, count: 1052 },
  { id: 'stromal', name: 'Stromal nucleus', color: '#22c55e', visible: true, opacity: 100, count: 674 },
  { id: 'large-stromal', name: 'Large stromal nucleus', color: '#b7ef16', visible: true, opacity: 100, count: 5067 },
  { id: 'lymphocyte', name: 'Lymphocyte nucleus', color: '#3847e8', visible: true, opacity: 100, count: 2359 },
  { id: 'plasma', name: 'Plasma cell / large TIL nucleus', color: '#4bdfe8', visible: true, opacity: 100, count: 19 },
  { id: 'normal-epithelial', name: 'Normal epithelial nucleus', color: '#3575a8', visible: true, opacity: 100, count: 18557 },
  { id: 'other', name: 'Other nucleus', color: '#98958a', visible: true, opacity: 100, count: 18557 },
  { id: 'ambiguous', name: 'Unknown/Ambiguous nucleus', color: '#4b5563', visible: true, opacity: 100, count: 9386 },
  { id: 'background', name: 'Background (non-nuclear material)', color: '#e5e7eb', visible: true, opacity: 100, count: 18557 },
])
const regionLabels = ref<AnnotationLabel[]>([
  { id: 'exclude', name: 'Exclude', color: '#111827', visible: true, opacity: 100, count: 1514 },
  { id: 'cancerous-epithelium', name: 'Cancerous epithelium', color: '#c038ed', visible: true, opacity: 100, count: 558 },
  { id: 'stroma', name: 'Stroma', color: '#e7b4ee', visible: true, opacity: 100, count: 3244 },
  { id: 'tils', name: 'TILs', color: '#697bd4', visible: true, opacity: 100, count: 2 },
  { id: 'normal-epithelium', name: 'Normal epithelium', color: '#e766bf', visible: true, opacity: 100, count: 1514 },
  { id: 'junk', name: 'Junk/Debris', color: '#f0f691', visible: true, opacity: 100, count: 1514 },
  { id: 'blood', name: 'Blood', color: '#9c5a10', visible: true, opacity: 100, count: 1514 },
  { id: 'other', name: 'Other', color: '#c9c9c9', visible: true, opacity: 100, count: 1514 },
  { id: 'whitespace', name: 'Whitespace/Empty', color: '#f3f4f6', visible: true, opacity: 100, count: 1514 },
])
const nucleusAnnotations: NucleusAnnotation[] = Array.from({ length: 88 }, (_, index) => ({
  id: index,
  x: 27 + ((index * 17) % 42) + Math.sin(index * 1.4) * 3,
  y: 24 + ((index * 23) % 56) + Math.cos(index * 1.1) * 3,
  labelId: nucleusLabels.value[1 + (index % (nucleusLabels.value.length - 1))].id,
}))
const regionAnnotations: RegionAnnotation[] = [
  { id: 1, x: 22, y: 17, width: 27, height: 25, rotate: -12, labelId: 'stroma' },
  { id: 2, x: 30, y: 35, width: 31, height: 24, rotate: 8, labelId: 'cancerous-epithelium' },
  { id: 3, x: 42, y: 54, width: 33, height: 24, rotate: 19, labelId: 'cancerous-epithelium' },
  { id: 4, x: 53, y: 68, width: 27, height: 17, rotate: 17, labelId: 'stroma' },
  { id: 5, x: 26, y: 29, width: 13, height: 11, rotate: -8, labelId: 'tils' },
  { id: 6, x: 58, y: 45, width: 12, height: 10, rotate: 22, labelId: 'normal-epithelium' },
]
const heatmapMask = [
  [2, 3], [2, 3, 4], [2, 3, 4], [2, 3, 4, 5],
  [1, 2, 3, 4, 5], [1, 2, 3, 4], [2, 3, 4], [2, 3, 4],
  [2, 3, 4, 5], [2, 3, 4, 5], [2, 3, 4, 5], [1, 2, 3, 4, 5],
]
const tmeFeatures = SPARK_FEATURES
const nucleiComposition = [
  { name: 'Stromal nucleus', value: '108,409', percent: 66 },
  { name: 'Lymphocyte nucleus', value: '41,447', percent: 23 },
  { name: 'Unknown nucleus', value: '25,096', percent: 8 },
  { name: 'Plasma cell nucleus', value: '1,892', percent: 2 },
  { name: 'Cancer nucleus', value: '1,211', percent: 1 },
]
const selectedObject = computed(() => task.value?.objects.find((item) => item.id === selectedId.value) || task.value?.objects[0] || null)
const selectedCase = computed(() => {
  const id = selectedObject.value?.caseId || selectedObject.value?.caseName
  return id ? cases.value.find((item) => item.id === id) || null : null
})
const showCaseContext = computed(() => (route.query.historyScope === 'case' || task.value?.objectType === 'Case') && Boolean(selectedCase.value))
const historyScope = computed(() => route.query.historyScope === 'case' || task.value?.objectType === 'Case' ? 'case' : 'wsi')
const analysisHistory = computed(() => {
  if (historyScope.value === 'case' && selectedCase.value) {
    return getCaseAnalysisHistory(selectedCase.value.id, tasks.value).filter((historyTask) => {
      const objectIds = new Set(historyTask.objects.filter((item) => item.caseId === selectedCase.value?.id).map((item) => item.id))
      return historyTask.models.some((run) => objectIds.has(run.objectId) && run.status === '分析完成')
    })
  }
  return selectedObject.value
    ? getWsiAnalysisHistory(selectedObject.value.id, tasks.value).filter((historyTask) => historyTask.models.some((run) => run.objectId === selectedObject.value?.id && run.status === '分析完成'))
    : []
})
const selectedObjectIndex = computed(() => task.value?.objects.findIndex((item) => item.id === selectedObject.value?.id) ?? -1)
const sparkSummary = computed(() => getSparkSlideSummary(selectedObjectIndex.value))
const activeCountMarkers = computed(() => countMarkersByObject.value[selectedObject.value?.id || ''] || [])
const visibleNucleusAnnotations = computed(() => {
  const labels = new Map(nucleusLabels.value.filter((label) => label.visible).map((label) => [label.id, label]))
  return nucleusAnnotations.flatMap((annotation) => {
    const label = labels.get(annotation.labelId)
    return label ? [{ ...annotation, color: colorWithOpacity(label.color, (label.opacity / 100) * (nucleusOpacity.value / 100)), name: label.name }] : []
  })
})
const visibleRegionAnnotations = computed(() => {
  const labels = new Map(regionLabels.value.filter((label) => label.visible).map((label) => [label.id, label]))
  return regionAnnotations.flatMap((annotation) => {
    const label = labels.get(annotation.labelId)
    return label ? [{ ...annotation, color: colorWithOpacity(label.color, (label.opacity / 100) * (regionOpacity.value / 100)), name: label.name }] : []
  })
})
const annotationLayerVisible = computed(() => showNuclei.value || showTissueRegions.value)
const positiveCount = computed(() => activeCountMarkers.value.filter((marker) => marker.type === 'positive').length)
const negativeCount = computed(() => activeCountMarkers.value.filter((marker) => marker.type === 'negative').length)
const splitPaneCount = computed(() => viewerLayout.value === '1x2' ? 2 : viewerLayout.value === '2x2' ? 4 : 1)
const splitPaneObjects = computed(() => {
  const objects = task.value?.objects || []
  return Array.from({ length: splitPaneCount.value }, (_, index) => {
    const objectId = splitObjectIds.value[index]
    return objects.find((item) => item.id === objectId) || objects[index % Math.max(1, objects.length)] || null
  })
})
const runs = computed(() => task.value && selectedObject.value ? getObjectRuns(task.value, selectedObject.value.id) : [])
const activeResultRun = computed(() => runs.value.find((run) => run.modelId === activeResultModelId.value) || runs.value[0] || null)
const isTmeResult = computed(() => activeResultRun.value?.modelId === 'mod-tme')
const modelSelectionLocked = computed(() => Boolean(task.value?.modelLocked || selectedObject.value?.status !== '待分析'))
const visibleAnalysisModels = computed(() => {
  if (!selectedObject.value || !modelSelectionLocked.value) return AVAILABLE_ANALYSIS_MODELS
  return selectedObject.value.modelIds.map((modelId) => {
    const run = runs.value.find((item) => item.modelId === modelId)
    return getModelDefinition(modelId, { name: run?.name, desc: run?.desc })
  })
})
const activeFeature = computed(() => tmeFeatures.find((item) => item.id === selectedFeatureId.value) || tmeFeatures[0])
const spatialHeatmapCells = computed<HeatmapCell[]>(() => {
  const seed = Math.max(1, tmeFeatures.findIndex((item) => item.id === selectedFeatureId.value) + 1)
  return heatmapMask.flatMap((columns, row) => columns.map((column, columnIndex) => {
    const index = row * 6 + column + columnIndex
    const wave = (Math.sin(index * 1.37 + seed * 0.83) + Math.cos(index * 0.61 - seed)) / 4 + 0.5
    return {
      x: 13 + column * 10.8,
      y: 4.5 + row * 7.7,
      value: Math.max(0.04, Math.min(0.96, wave)),
    }
  }))
})
const filteredFeatures = computed(() => {
  const query = featureSearch.value.trim().toLowerCase()
  return tmeFeatures.filter((item) =>
    (featureCategory.value === '全部类别' || item.category === featureCategory.value)
    && (!query || `${item.name} ${item.category}`.toLowerCase().includes(query)),
  )
})
const featureCategories = ['全部类别', ...SPARK_FEATURE_CATEGORIES]
const filteredObjects = computed(() => {
  const query = search.value.trim().toLowerCase()
  return task.value?.objects.filter((item) => !query || `${item.name} ${item.meta} ${item.caseName || ''} ${item.projectName || ''} ${item.status}`.toLowerCase().includes(query)) || []
})
const taskProgress = computed(() => {
  if (!task.value?.models.length) return 0
  return Math.round(task.value.models.reduce((total, run) => total + runProgress(run), 0) / task.value.models.length)
})
const viewerScale = computed(() => zoomScale(zoom.value))

watch(task, (value) => {
  if (!value) return
  const requestedObject = typeof route.query.object === 'string' ? route.query.object : ''
  if (requestedObject && value.objects.some((item) => item.id === requestedObject)) selectedId.value = requestedObject
  else if (!value.objects.some((item) => item.id === selectedId.value)) selectedId.value = value.objects[0]?.id || ''
}, { immediate: true })
watch(runs, (value) => {
  if (!value.some((run) => run.modelId === activeResultModelId.value)) {
    activeResultModelId.value = value[0]?.modelId || ''
    resultTab.value = 'quantitative'
  }
}, { immediate: true })
watch(selectedId, () => {
  if (viewerLayout.value === '1x1') resetViewer()
  else {
    roiRect.value = null
    roiStart.value = null
  }
})
watch(zoom, (value) => {
  if (viewerLayout.value === '1x1') return
  const next = [...splitPaneZooms.value]
  if (splitLinked.value) next.fill(value)
  else next[activeSplitPane.value] = value
  splitPaneZooms.value = next
})

onMounted(() => window.addEventListener('keydown', onViewerKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onViewerKeydown))

function runProgress(run: AnalysisModelRunRecord) {
  return run.status === '分析完成' ? 100 : Math.max(0, Math.min(100, run.progress ?? 0))
}
function objectRuns(item: AnalysisTaskObjectRecord) {
  return task.value ? getObjectRuns(task.value, item.id) : []
}
function historyRuns(historyTask: AnalysisTaskRecord) {
  if (historyScope.value === 'case' && selectedCase.value) {
    const objectIds = new Set(historyTask.objects.filter((item) => item.caseId === selectedCase.value?.id).map((item) => item.id))
    return historyTask.models.filter((run) => objectIds.has(run.objectId))
  }
  return historyTask.models.filter((run) => run.objectId === selectedObject.value?.id)
}
function openHistoryTask(historyTask: AnalysisTaskRecord) {
  const currentObjectId = selectedObject.value?.id
  const nextObject = historyTask.objects.find((item) => item.id === currentObjectId)
    || (selectedCase.value ? historyTask.objects.find((item) => item.caseId === selectedCase.value?.id) : undefined)
    || historyTask.objects[0]
  router.push({ path: `/workbench/run/${historyTask.id}`, query: { object: nextObject?.id, historyScope: historyScope.value } })
}
function fileNameParts(name: string) {
  const tailLength = 12
  return name.length > tailLength * 2
    ? { head: name.slice(0, -tailLength), tail: name.slice(-tailLength) }
    : { head: name, tail: '' }
}
async function positionFileNameTip(target: HTMLElement, text: string) {
  const rect = target.getBoundingClientRect()
  fileNameTip.value = { text, x: rect.left, y: rect.bottom + 7 }
  await nextTick()
  if (!fileNameTip.value) return

  const tipRect = fileNameTipElement.value?.getBoundingClientRect()
  const width = tipRect?.width || 0
  const height = tipRect?.height || 0
  fileNameTip.value = {
    text,
    x: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
    y: rect.bottom + height + 7 <= window.innerHeight - 12
      ? rect.bottom + 7
      : Math.max(12, rect.top - height - 7),
  }
}
async function showFileName(event: MouseEvent | FocusEvent, name: string) {
  const target = event.currentTarget as HTMLElement
  const head = target.querySelector('span')
  if (head && head.scrollWidth <= head.clientWidth) return
  await positionFileNameTip(target, name)
}
function hideFileName() {
  fileNameTip.value = null
}
function fileNameWithoutExtension(name: string) {
  return name.replace(/\.[^.]+$/, '')
}
async function copyFileName(event: MouseEvent, name: string) {
  const target = event.currentTarget as HTMLElement
  const text = fileNameWithoutExtension(name)
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }

  await positionFileNameTip(target, `已复制：${text}`)
}
function zoomScale(level: number) {
  return ({ 0.5: 0.44, 1: 0.52, 4: 0.68, 10: 0.82, 20: 1, 40: 1.55, 80: 2.35 }[level] || 1)
}
function objectProgress(item: AnalysisTaskObjectRecord) {
  const runs = objectRuns(item)
  return runs.length ? Math.round(runs.reduce((total, run) => total + runProgress(run), 0) / runs.length) : null
}
function selectResultModel(modelId: string) {
  activeResultModelId.value = modelId
  resultTab.value = 'quantitative'
  showFeatureLayer.value = false
}
function statusClass(status: AnalysisTaskStatus) {
  return { '待分析': 'border-[#8f35b7]/45 bg-[#8f35b7]/15 text-[#d292f4]', '排队中': 'border-[#8f35b7]/45 bg-[#8f35b7]/15 text-[#d292f4]', '正在分析': 'border-[#eab65b]/40 bg-[#eab65b]/10 text-[#f4c577]', '分析完成': 'border-[#84cc16]/35 bg-[#84cc16]/10 text-[#95d94e]', '失败': 'border-[#ff9c9c]/45 bg-[#ff9c9c]/10 text-[#ffb4b4]', '已停止': 'border-[#64748b]/45 bg-[#64748b]/10 text-[#cbd5e1]' }[status]
}
function objectAction(item: AnalysisTaskObjectRecord) {
  if (!task.value) return
  if (['正在分析', '排队中'].includes(item.status)) stopAnalysisObject(task.value.id, item.id)
  else if (['分析完成', '失败', '已停止'].includes(item.status)) reanalyzeAnalysisObject(task.value.id, item.id)
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
  setObjectModelSelection(task.value.id, selectedObject.value.id, modelId)
  refresh()
}
function startOrRestart() {
  if (!task.value) return
  if (task.value.status === '待分析') startAnalysisTask(task.value.id)
  else if (['分析完成', '失败', '已停止'].includes(task.value.status)) reanalyzeTask(task.value.id)
  refresh()
}
function stopAll() {
  if (!task.value) return
  stopAnalysisTask(task.value.id)
  refresh()
}
function selectObject(objectId: string) {
  if (viewerLayout.value !== '1x1') {
    const ids = [...splitObjectIds.value]
    ids[activeSplitPane.value] = objectId
    splitObjectIds.value = ids
  }
  selectedId.value = objectId
}
function navigateObject(direction: 1 | -1) {
  if (!task.value?.objects.length || viewerLayout.value !== '1x1') return
  const nextIndex = Math.max(0, Math.min(task.value.objects.length - 1, selectedObjectIndex.value + direction))
  const nextObject = task.value.objects[nextIndex]
  if (nextObject) selectedId.value = nextObject.id
}
function setViewerLayout(layout: ViewerLayout) {
  viewerLayout.value = layout
  showLayoutMenu.value = false
  activeSplitPane.value = 0
  roiMode.value = false
  countMode.value = false
  magnifierMode.value = false
  magnifierPoint.value = null
  resetViewer()
  if (layout === '1x1' || !task.value?.objects.length) return
  const startIndex = Math.max(0, selectedObjectIndex.value)
  splitObjectIds.value = Array.from({ length: layout === '1x2' ? 2 : 4 }, (_, index) => (
    task.value?.objects[(startIndex + index) % task.value.objects.length]?.id || ''
  ))
  splitPaneZooms.value = Array.from({ length: layout === '1x2' ? 2 : 4 }, () => zoom.value)
}
function selectSplitPane(index: number, objectId?: string) {
  activeSplitPane.value = index
  zoom.value = splitPaneZooms.value[index] ?? 20
  if (objectId) selectedId.value = objectId
}
function toggleSplitLinked() {
  splitLinked.value = !splitLinked.value
  if (!splitLinked.value) return
  splitPaneZooms.value = splitPaneZooms.value.map(() => zoom.value)
}
function resetViewer() {
  zoom.value = 20
  pan.value = { x: 0, y: 0 }
  roiRect.value = null
  roiStart.value = null
}
function changeZoom(direction: 1 | -1) {
  const current = zoomLevels.indexOf(zoom.value)
  zoom.value = zoomLevels[Math.max(0, Math.min(zoomLevels.length - 1, current + direction))]
}
function onViewerWheel(event: WheelEvent) { changeZoom(event.deltaY < 0 ? 1 : -1) }
function pointInViewer(event: PointerEvent): Point {
  const rect = viewerFrame.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }
  return {
    x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
  }
}
function onViewerPointerDown(event: PointerEvent) {
  const point = pointInViewer(event)
  if (countMode.value) {
    const slidePoint = pointInSlide(event)
    if (slidePoint && selectedObject.value) {
      const existing = countMarkersByObject.value[selectedObject.value.id] || []
      countMarkersByObject.value = {
        ...countMarkersByObject.value,
        [selectedObject.value.id]: [...existing, { id: ++markerSequence.value, ...slidePoint, type: countType.value }],
      }
    }
    return
  }
  viewerFrame.value?.setPointerCapture(event.pointerId)
  if (roiMode.value) {
    roiStart.value = point
    roiRect.value = { x: point.x, y: point.y, width: 0, height: 0 }
    return
  }
  dragStart.value = { pointer: point, pan: { ...pan.value } }
}
function onViewerPointerMove(event: PointerEvent) {
  const point = pointInViewer(event)
  const slidePoint = pointInSlide(event)
  pixelPosition.value = slidePoint ? {
    x: Math.round((slidePoint.x / 100) * slidePixelSize.width),
    y: Math.round((slidePoint.y / 100) * slidePixelSize.height),
  } : null
  if (magnifierMode.value && !magnifierPinned.value) magnifierPoint.value = point
  if (roiMode.value && roiStart.value) {
    roiRect.value = {
      x: Math.min(roiStart.value.x, point.x),
      y: Math.min(roiStart.value.y, point.y),
      width: Math.abs(point.x - roiStart.value.x),
      height: Math.abs(point.y - roiStart.value.y),
    }
    return
  }
  if (!dragStart.value) return
  pan.value = {
    x: dragStart.value.pan.x + point.x - dragStart.value.pointer.x,
    y: dragStart.value.pan.y + point.y - dragStart.value.pointer.y,
  }
}
function onViewerPointerLeave() {
  dragStart.value = null
  pixelPosition.value = null
  if (!magnifierPinned.value) magnifierPoint.value = null
}
function onViewerPointerUp(event: PointerEvent) {
  if (viewerFrame.value?.hasPointerCapture(event.pointerId)) viewerFrame.value.releasePointerCapture(event.pointerId)
  dragStart.value = null
  roiStart.value = null
  if (roiRect.value && (roiRect.value.width < 18 || roiRect.value.height < 18)) roiRect.value = null
}
function toggleRoiMode() {
  roiMode.value = !roiMode.value
  if (roiMode.value) countMode.value = false
  if (!roiMode.value) roiRect.value = null
}
function toggleMagnifier() {
  magnifierMode.value = !magnifierMode.value
  magnifierPinned.value = false
  if (!magnifierMode.value) magnifierPoint.value = null
}
function toggleCountMode() {
  countMode.value = !countMode.value
  if (countMode.value) roiMode.value = false
}
function pointInSlide(event: PointerEvent) {
  const rect = slideStage.value?.getBoundingClientRect()
  if (!rect || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return null
  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  }
}
function undoCountMarker() {
  if (!selectedObject.value) return
  const existing = activeCountMarkers.value
  countMarkersByObject.value = { ...countMarkersByObject.value, [selectedObject.value.id]: existing.slice(0, -1) }
}
function clearCountMarkers() {
  if (!selectedObject.value) return
  countMarkersByObject.value = { ...countMarkersByObject.value, [selectedObject.value.id]: [] }
}
function splitPaneScale(index: number) {
  return zoomScale(splitPaneZooms.value[index] ?? 20)
}
function magnifierStyle() {
  const point = magnifierPoint.value
  const frame = viewerFrame.value
  if (!point || !frame) return {}
  return {
    left: `${point.x}px`,
    top: `${point.y}px`,
    backgroundSize: `${magnifierZoom.value * 100}%`,
    backgroundPosition: `${(point.x / Math.max(1, frame.clientWidth)) * 100}% ${(point.y / Math.max(1, frame.clientHeight)) * 100}%`,
  }
}
function onViewerKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return
  if (event.key === 'Escape') {
    viewerPanel.value = null
    showLayoutMenu.value = false
    return
  }
  if (event.key === '?' || (event.shiftKey && event.key === '/')) viewerPanel.value = viewerPanel.value === 'help' ? null : 'help'
  if (event.key.toLowerCase() === 'f') resetViewer()
  if (event.key.toLowerCase() === 'k' && viewerLayout.value === '1x1') toggleCountMode()
  if (event.shiftKey && event.key.toLowerCase() === 's' && viewerLayout.value === '1x1') toggleMagnifier()
  if (event.key === 'ArrowLeft') navigateObject(-1)
  if (event.key === 'ArrowRight') navigateObject(1)
}
function selectFeature(feature: SparkFeatureDefinition) {
  selectedFeatureId.value = feature.id
  showFeatureLayer.value = feature.spatial
}
function toggleResultNuclei() {
  showNuclei.value = !showNuclei.value
}
function toggleResultHeatmap() {
  if (!activeFeature.value.spatial) {
    selectedFeatureId.value = tmeFeatures.find((feature) => feature.spatial)?.id || selectedFeatureId.value
  }
  showFeatureLayer.value = !showFeatureLayer.value
}
function spatialHeatColor(value: number) {
  if (value >= 0.8) return '#e76f51'
  if (value >= 0.64) return '#e9a33b'
  if (value >= 0.48) return '#91c94d'
  if (value >= 0.32) return '#42aa8b'
  if (value >= 0.16) return '#3487a9'
  return '#3f5f9f'
}
function toggleAllAnnotations() {
  const visible = !annotationLayerVisible.value
  showNuclei.value = visible
  showTissueRegions.value = visible
}
function annotationBarWidth(label: AnnotationLabel, labels: AnnotationLabel[]) {
  const maxCount = Math.max(...labels.map((item) => item.count), 1)
  return Math.max(2, Math.round((label.count / maxCount) * 100))
}
function colorWithOpacity(color: string, opacity: number) {
  const normalized = color.replace('#', '')
  const value = Number.parseInt(normalized.length === 3 ? normalized.split('').map((item) => item + item).join('') : normalized, 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  return `rgb(${red} ${green} ${blue} / ${Math.max(0, Math.min(1, opacity))})`
}
async function toggleFullscreen() {
  if (!viewerFrame.value) return
  if (document.fullscreenElement) await document.exitFullscreen()
  else await viewerFrame.value.requestFullscreen()
}
</script>

<template>
  <div v-if="task" class="workbench-shell">
    <aside class="workbench-left">
      <div class="border-b border-white/[0.08] p-3">
        <button class="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#8f35b7]/55 bg-[#8f35b7]/10 font-medium text-[#e8b8f8] hover:bg-[#8f35b7]/18" @click="router.push('/workbench/tasks')"><ArrowLeft :size="17" />返回分析任务列表</button>
        <div class="mt-3 flex items-start justify-between gap-3"><h1 class="min-w-0 truncate text-lg font-semibold">{{ getTaskDisplayName(task) }}</h1><span :class="['shrink-0 rounded-md border px-2 py-1 text-xs', statusClass(task.status)]">{{ task.status }}</span></div>
      </div>
      <section v-if="showCaseContext && selectedCase" class="case-context">
        <button class="case-context-toggle" :aria-expanded="caseInfoExpanded" @click="caseInfoExpanded=!caseInfoExpanded"><span><b>Case 信息</b><small>{{ selectedCase.id }}</small></span><ChevronDown :class="caseInfoExpanded&&'open'" :size="16" /></button>
        <div v-if="caseInfoExpanded" class="case-context-body"><div><span>脱敏患者</span><b>{{ selectedCase.patientCode }}</b></div><div><span>年龄 / 性别</span><b>{{ selectedCase.age ?? '未知' }} / {{ selectedCase.sex }}</b></div><div><span>取材</span><b>{{ getPathologySiteLabel(selectedCase.site) }} · {{ getSamplingMethodLabel(selectedCase.samplingMethod) }}</b></div><div><span>收样日期</span><b>{{ selectedCase.receivedAt }}</b></div><div class="wide"><span>临床诊断</span><b>{{ selectedCase.diagnosis }}</b></div><button @click="router.push(`/workbench/cases/${selectedCase.id}`)">查看完整 Case 详情</button></div>
      </section>
      <div class="border-b border-white/[0.08] p-3"><label class="flex h-10 items-center gap-2 rounded-md border border-white/[0.08] bg-[#17181d] px-3"><Search :size="16" class="text-[#64748b]" /><input v-model="search" class="w-full bg-transparent text-sm outline-none" placeholder="搜索 WSI / Case / 部位 / 染色" /></label></div>
      <div class="min-h-0 flex-1 space-y-2 overflow-y-auto p-3" @scroll.passive="hideFileName">
        <article v-for="item in filteredObjects" :key="item.id" :class="['rounded-lg border p-3 transition', selectedObject?.id === item.id ? 'border-[#8f35b7] bg-[#8f35b7]/7' : 'border-white/[0.08] bg-[#17181d] hover:border-white/[0.14]']" @click="selectObject(item.id)">
          <div class="flex gap-3"><img src="/wsi-cmu-region.jpg" alt="WSI" class="h-10 w-16 shrink-0 rounded object-cover" /><div class="min-w-0 flex-1"><button type="button" class="wsi-file-name text-sm" :aria-label="`复制切片名称：${fileNameWithoutExtension(item.name)}`" @mouseenter="showFileName($event, item.name)" @mouseleave="hideFileName" @focus="showFileName($event, item.name)" @blur="hideFileName" @click.stop="copyFileName($event, item.name)"><span>{{ fileNameParts(item.name).head }}</span><em v-if="fileNameParts(item.name).tail">{{ fileNameParts(item.name).tail }}</em></button><small class="mt-1 block truncate text-[#748095]" :title="item.meta">{{ item.meta }}</small></div></div>
          <div :class="['object-progress-summary mt-3 border-t border-white/[0.06] pt-2', objectRuns(item).length > 1 && 'has-multiple-models']"><div class="flex min-w-0 items-center justify-between gap-2 text-xs"><span v-if="!objectRuns(item).length" class="model-summary empty">未配置模型</span><span v-else-if="objectRuns(item).length === 1" class="model-summary" :title="objectRuns(item)[0].name">{{ objectRuns(item)[0].name }}</span><button v-else class="model-summary multiple" type="button" aria-haspopup="true" @click.stop>{{ objectRuns(item).length }} 个模型 <ChevronDown :size="12" /></button><span v-if="objectProgress(item) !== null" class="shrink-0 text-[#748095]">{{ objectProgress(item) }}%</span></div><div v-if="objectProgress(item) !== null" class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#353740]"><div class="h-full rounded-full bg-[#9c36c7]" :style="{ width: `${objectProgress(item)}%` }" /></div><div v-if="objectRuns(item).length > 1" class="model-progress-details"><b class="model-progress-title">模型分析进度</b><div v-for="run in objectRuns(item)" :key="run.id"><div><span :title="run.name">{{ run.name }}</span><small>{{ run.status }} · {{ runProgress(run) }}%</small></div><i><b :style="{ width: `${runProgress(run)}%` }" /></i></div></div></div>
          <div class="mt-3 flex items-center justify-between"><span :class="['rounded-md border px-2 py-1 text-xs', statusClass(item.status)]">{{ item.status }}</span><div class="flex gap-3"><button v-if="['待分析', '已停止'].includes(item.status)" class="text-xs text-[#ff9c9c]" @click.stop="deleteObject(item)">删除</button><button v-if="item.status !== '待分析'" class="text-xs text-[#f4c577]" @click.stop="objectAction(item)">{{ ['正在分析', '排队中'].includes(item.status) ? '停止' : '重新分析' }}</button></div></div>
        </article>
      </div>
      <Teleport to="body"><div v-if="fileNameTip" ref="fileNameTipElement" class="wsi-file-name-tip" :style="{ left: `${fileNameTip.x}px`, top: `${fileNameTip.y}px` }" role="tooltip">{{ fileNameTip.text }}</div></Teleport>
      <section v-if="selectedObject" :class="['model-selection', modelSelectionLocked && 'locked']"><div class="flex items-center justify-between"><h3>分析模型</h3><span v-if="modelSelectionLocked" class="text-[10px] text-[#748095]">已锁定</span></div><p>{{ modelSelectionLocked ? '当前任务使用的模型配置。' : '为当前 WSI 选择模型。' }}</p><div class="mt-3 grid gap-2"><button v-for="model in visibleAnalysisModels" :key="model.id" :disabled="modelSelectionLocked || !isModelCompatible(model, selectedObject.stain)" :class="['model-option', selectedObject.modelIds.includes(model.id) && 'active']" @click="toggleModel(model.id)"><span><b>{{ model.name }}</b><small>{{ model.desc }}</small></span><span>{{ !isModelCompatible(model, selectedObject.stain) ? '不适用' : selectedObject.modelIds.includes(model.id) ? '已选' : '可选' }}</span></button></div></section>
      <div class="border-t border-white/[0.08] p-3"><div class="mb-2 flex justify-between text-xs text-[#748095]"><span>{{ task.objects.filter(item => item.modelIds.length).length }}/{{ task.objects.length }} 张 WSI 已配置模型</span><span>{{ taskProgress }}%</span></div><button v-if="['正在分析', '排队中'].includes(task.status)" class="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#eab65b]/40 bg-[#eab65b]/10 font-medium text-[#f4c577]" @click="stopAll"><Square :size="14" class="fill-current" />停止全部</button><button v-else :disabled="!task.models.length" class="btn-primary h-10 w-full disabled:opacity-40" @click="startOrRestart"><Play :size="16" />{{ task.status === '待分析' ? '开始分析' : '重新分析任务' }}</button></div>
    </aside>

    <main class="workbench-center">
        <div class="viewer-toolbar">
          <div class="viewer-toolbar-primary">
            <div class="viewer-toolbar-actions">
              <span class="viewer-toolbar-group-label">阅片</span>
              <div v-if="viewerLayout === '1x1'" class="object-navigation">
                <button class="viewer-button viewer-icon-button" data-tooltip="上一张 WSI" :disabled="selectedObjectIndex <= 0" @click="navigateObject(-1)"><ChevronLeft :size="16" /></button>
                <span>{{ selectedObjectIndex + 1 }} / {{ task.objects.length }}</span>
                <button class="viewer-button viewer-icon-button" data-tooltip="下一张 WSI" :disabled="selectedObjectIndex >= task.objects.length - 1" @click="navigateObject(1)"><ChevronRight :size="16" /></button>
              </div>
              <div class="zoom-controls">
                <button class="viewer-button viewer-icon-button" data-tooltip="缩小" @click="changeZoom(-1)"><ZoomOut :size="15" /></button>
                <select v-model.number="zoom" aria-label="切片缩放倍率"><option v-for="value in zoomLevels" :key="value" :value="value">{{ value }}X</option></select>
                <button class="viewer-button viewer-icon-button" data-tooltip="放大" @click="changeZoom(1)"><ZoomIn :size="15" /></button>
                <button class="viewer-button viewer-icon-button" data-tooltip="适应视图" @click="resetViewer"><RotateCcw :size="15" /></button>
              </div>
              <div class="layout-picker"><button :class="['tool-toggle', viewerLayout !== '1x1' && 'active']" title="切换分屏布局" @click="showLayoutMenu = !showLayoutMenu"><LayoutGrid :size="14" />{{ viewerLayout }}<ChevronDown :size="13" /></button><div v-if="showLayoutMenu" class="layout-menu"><button :class="viewerLayout === '1x1' && 'active'" @click="setViewerLayout('1x1')"><Square :size="15" />单屏 1×1</button><button :class="viewerLayout === '1x2' && 'active'" @click="setViewerLayout('1x2')"><Columns2 :size="15" />分屏 1×2</button><button :class="viewerLayout === '2x2' && 'active'" @click="setViewerLayout('2x2')"><LayoutGrid :size="15" />分屏 2×2</button></div></div>
              <button v-if="viewerLayout === '1x1'" :class="['viewer-button viewer-icon-button', roiMode && 'active']" data-tooltip="框选定量" @click="toggleRoiMode"><Square :size="15" /></button>
              <div v-if="viewerLayout === '1x1'" class="toolbar-tool-pair">
                <button :class="['viewer-button viewer-icon-button', magnifierMode && 'active']" :data-tooltip="`放大镜 ${magnifierMode ? '已开启' : '已关闭'}`" @click="toggleMagnifier"><ScanSearch :size="15" /></button>
                <button v-if="magnifierMode" :class="['viewer-button viewer-icon-button', magnifierPinned && 'active']" :data-tooltip="magnifierPinned ? '取消钉住放大镜' : '钉住放大镜'" @click="magnifierPinned = !magnifierPinned"><Pin :size="15" /></button>
              </div>
              <div v-if="viewerLayout === '1x1'" class="toolbar-tool-anchor">
                <button :class="['viewer-button viewer-icon-button', countMode && 'active']" :data-tooltip="`细胞计数${positiveCount + negativeCount ? ` ${positiveCount + negativeCount}` : ''}`" @click="toggleCountMode"><MousePointer2 :size="15" /><span v-if="positiveCount + negativeCount" class="count-tool-badge">{{ positiveCount + negativeCount }}</span></button>
                <section v-if="countMode" class="viewer-tool-popover count-tool-popover" @pointerdown.stop @wheel.stop>
                  <header><b>细胞计数</b><span>{{ positiveCount + negativeCount }}</span></header>
                  <div class="count-types"><button :class="countType === 'positive' && 'active'" @click.stop="countType = 'positive'"><i class="positive" />阳性 {{ positiveCount }}</button><button :class="countType === 'negative' && 'active'" @click.stop="countType = 'negative'"><i class="negative" />阴性 {{ negativeCount }}</button></div>
                  <footer><button :disabled="!activeCountMarkers.length" @click.stop="undoCountMarker"><Undo2 :size="13" />撤销</button><button :disabled="!activeCountMarkers.length" @click.stop="clearCountMarkers"><Trash2 :size="13" />清空</button></footer>
                </section>
              </div>
              <button v-if="viewerLayout !== '1x1'" :class="['viewer-button viewer-icon-button', splitLinked && 'active']" :data-tooltip="splitLinked ? '分屏联动' : '分屏独立'" @click="toggleSplitLinked"><Link2 v-if="splitLinked" :size="15" /><Unlink2 v-else :size="15" /></button>
            </div>
            <div class="viewer-toolbar-utilities">
              <button :class="['viewer-button viewer-icon-button', viewerPanel === 'info' && 'active']" data-tooltip="切片信息" @click="viewerPanel = viewerPanel === 'info' ? null : 'info'"><Info :size="16" /></button>
              <button :class="['viewer-button viewer-icon-button', viewerPanel === 'help' && 'active']" data-tooltip="查看器帮助" @click="viewerPanel = viewerPanel === 'help' ? null : 'help'"><CircleHelp :size="16" /></button>
              <button :class="['viewer-button viewer-icon-button', viewerPanel === 'settings' && 'active']" data-tooltip="查看器设置" @click="viewerPanel = viewerPanel === 'settings' ? null : 'settings'"><Settings :size="16" /></button>
              <button class="viewer-button viewer-icon-button" data-tooltip="全屏查看" @click="toggleFullscreen"><Maximize2 :size="15" /></button>
            </div>
          </div>
        </div>
        <section v-if="viewerPanel" class="viewer-flyout">
          <header>
            <div><b>{{ viewerPanel === 'help' ? '查看器帮助' : viewerPanel === 'settings' ? '查看器设置' : '切片信息' }}</b><small>{{ viewerPanel === 'help' ? '常用操作与快捷键' : viewerPanel === 'settings' ? '当前浏览会话设置' : '像素、扫描与标签信息' }}</small></div>
            <button title="关闭" @click="viewerPanel = null"><X :size="16" /></button>
          </header>
          <div v-if="viewerPanel === 'help'" class="viewer-help-content"><dl><div><dt>拖动 / 滚轮</dt><dd>平移切片 / 调整倍率</dd></div><div><dt>← / →</dt><dd>上一张 / 下一张 WSI</dd></div><div><dt>Shift + S</dt><dd>切换放大镜</dd></div><div><dt>K</dt><dd>切换细胞计数</dd></div><div><dt>F</dt><dd>适应当前视图</dd></div><div><dt>Esc</dt><dd>关闭面板</dd></div></dl></div>
          <div v-else-if="viewerPanel === 'settings'" class="viewer-settings-content"><label><span>平滑缩放与平移</span><input v-model="smoothNavigation" type="checkbox" /></label><label class="viewer-setting-range"><span>放大镜倍数 <b>{{ magnifierZoom }}X</b></span><input v-model="magnifierZoom" type="range" min="2" max="6" /></label><label class="viewer-setting-range"><span>结果图层透明度 <b>{{ opacity }}%</b></span><input v-model="opacity" type="range" min="0" max="100" /></label></div>
          <div v-else class="viewer-info-content">
            <div class="viewer-info-tabs"><button :class="infoPanelTab === 'metadata' && 'active'" @click="infoPanelTab = 'metadata'">像素 / 扫描</button><button :class="infoPanelTab === 'labels' && 'active'" @click="infoPanelTab = 'labels'">标签 / 宏观图</button></div>
            <div v-if="infoPanelTab === 'metadata'" class="viewer-metadata">
              <div class="pixel-inspector"><span>当前像素</span><b>{{ pixelPosition ? `X ${pixelPosition.x.toLocaleString()} · Y ${pixelPosition.y.toLocaleString()}` : '移动鼠标至切片查看' }}</b></div>
              <dl><div><dt>文件</dt><dd :title="selectedObject?.name">{{ selectedObject?.name }}</dd></div><div><dt>尺寸 (px)</dt><dd>{{ slidePixelSize.width.toLocaleString() }} × {{ slidePixelSize.height.toLocaleString() }}</dd></div><div><dt>金字塔层级</dt><dd>9</dd></div><div><dt>扫描倍率</dt><dd>20X</dd></div><div><dt>分辨率 X</dt><dd>0.250 μm/px</dd></div><div><dt>分辨率 Y</dt><dd>0.250 μm/px</dd></div><div><dt>瓦片大小</dt><dd>768 × 768</dd></div><div><dt>绑定 Case</dt><dd>{{ selectedObject?.caseName || '未绑定' }}</dd></div></dl>
            </div>
            <div v-else class="viewer-labels">
              <article><header><b>标签图</b><span>当前切片</span></header><div class="slide-label-preview"><strong>{{ selectedObject?.caseName || 'S-20260517-1906' }}</strong><span>{{ selectedObject?.organ || '组织切片' }} · {{ selectedObject?.stain || 'H&E' }} · 20X</span><i /></div></article>
              <article><header><b>宏观图</b><span>示例</span></header><img src="/wsi-cmu-region.jpg" alt="当前切片宏观图" class="macro-preview" /></article>
              <article><header><b>缩略图</b><span>当前视野导航</span></header><img src="/wsi-cmu-region.jpg" alt="当前切片缩略图" class="thumbnail-preview" /></article>
            </div>
          </div>
        </section>
        <div v-if="viewerLayout === '1x1'" ref="viewerFrame" :class="['viewer-frame', roiMode ? 'roi-cursor' : countMode ? 'count-cursor' : dragStart ? 'dragging' : 'pan-cursor']" @wheel.prevent="onViewerWheel" @pointerdown="onViewerPointerDown" @pointermove="onViewerPointerMove" @pointerup="onViewerPointerUp" @pointercancel="onViewerPointerUp" @pointerleave="onViewerPointerLeave">
          <div v-if="showFeatureLayer" class="active-layer-banner"><Layers :size="14" /><b :title="activeFeature.name">{{ activeFeature.name }}</b><span>空间热力图 · 示例结果</span></div>
          <div ref="slideStage" :class="['slide-stage', !smoothNavigation && 'no-motion']" :style="{ transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${viewerScale})` }"><img src="/wsi-cmu-region.jpg" alt="公开病理示例切片" class="viewer-slide-image" draggable="false" /><div v-if="showTissueRegions" class="region-annotation-layer" :style="{ opacity: annotationOpacity / 100 }"><i v-for="region in visibleRegionAnnotations" :key="region.id" :title="region.name" :style="{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%`, background: region.color, transform: `rotate(${region.rotate}deg)` }" /></div><div v-if="showFeatureLayer && activeFeature.spatial" class="feature-heatmap-layer" :style="{ opacity: opacity / 100 }"><i v-for="(cell, index) in spatialHeatmapCells" :key="index" :style="{ left: `${cell.x}%`, top: `${cell.y}%`, background: spatialHeatColor(cell.value) }" /></div><div v-if="showNuclei" class="nuclei-layer" :style="{ opacity: annotationOpacity / 100 }"><i v-for="annotation in visibleNucleusAnnotations" :key="annotation.id" :title="annotation.name" :style="{ left: `${annotation.x}%`, top: `${annotation.y}%`, background: annotation.color }" /></div><div class="count-marker-layer"><i v-for="marker in activeCountMarkers" :key="marker.id" :class="marker.type" :style="{ left: `${marker.x}%`, top: `${marker.y}%` }" /></div></div>
          <div v-if="magnifierMode && magnifierPoint" :class="['magnifier-lens', magnifierPoint.x > (viewerFrame?.clientWidth || 0) - 210 && 'flip']" :style="magnifierStyle()"><span>{{ magnifierZoom }}X</span></div>
          <div v-if="roiRect" class="roi-selection" :style="{ left: `${roiRect.x}px`, top: `${roiRect.y}px`, width: `${roiRect.width}px`, height: `${roiRect.height}px` }" />
          <div v-if="roiRect && !roiStart" class="roi-result" :style="{ left: `${Math.min(roiRect.x + roiRect.width + 12, Math.max(12, (viewerFrame?.clientWidth || 0) - 250))}px`, top: `${Math.max(12, roiRect.y)}px` }" @pointerdown.stop @wheel.stop><div class="flex items-center justify-between"><b>ROI 定量</b><button @click.stop="roiRect = null">关闭</button></div><p>组织面积 <strong>8.20 mm²</strong> · 区域 <strong>43</strong></p><div><span><i class="bg-[#d66da2]" />Stroma</span><b>8.14 mm²</b></div><div><span><i class="bg-[#73a4ea]" />TILS</span><b>0.06 mm²</b></div></div>
          <div v-if="showFeatureLayer" class="heatmap-legend"><div><span>{{ activeFeature.name }}</span><b>示例空间结果</b></div><i /><div class="heatmap-legend-scale"><span>低</span><span>高</span></div></div><div class="viewer-minimap"><img src="/wsi-cmu-region.jpg" alt="切片导航图" draggable="false" /><span :style="{ width: `${Math.max(24, 68 / viewerScale)}%`, height: `${Math.max(20, 58 / viewerScale)}%` }" /></div>
        </div>
        <div v-else ref="viewerFrame" :class="['viewer-frame', 'split-viewer', `layout-${viewerLayout}`]" @wheel.prevent="onViewerWheel"><button v-for="(paneObject, index) in splitPaneObjects" :key="`${paneObject?.id}-${index}`" :class="['split-pane', activeSplitPane === index && 'active']" @click="selectSplitPane(index, paneObject?.id)"><header><span><b>{{ index + 1 }}</b>{{ paneObject?.name }}</span><em v-if="activeSplitPane === index">当前结果</em></header><div class="split-pane-body"><div class="split-slide-stage" :style="{ transform: `scale(${splitPaneScale(index)})` }"><img src="/wsi-cmu-region.jpg" alt="公开病理示例切片" draggable="false" /><div v-if="showTissueRegions" class="region-annotation-layer" :style="{ opacity: annotationOpacity / 100 }"><i v-for="region in visibleRegionAnnotations" :key="region.id" :style="{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%`, background: region.color, transform: `rotate(${region.rotate}deg)` }" /></div><div v-if="showFeatureLayer && activeFeature.spatial" class="feature-heatmap-layer" :style="{ opacity: opacity / 100 }"><i v-for="(cell, cellIndex) in spatialHeatmapCells" :key="cellIndex" :style="{ left: `${cell.x}%`, top: `${cell.y}%`, background: spatialHeatColor(cell.value) }" /></div><div v-if="showNuclei" class="nuclei-layer" :style="{ opacity: annotationOpacity / 100 }"><i v-for="annotation in visibleNucleusAnnotations" :key="annotation.id" :style="{ left: `${annotation.x}%`, top: `${annotation.y}%`, background: annotation.color }" /></div></div></div><footer><span>{{ paneObject?.meta }}</span><span>{{ zoom }}X</span></footer></button></div>
    </main>

    <aside class="workbench-results">
      <header class="results-header"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><h2>分析结果</h2><p class="truncate" :title="selectedObject?.name">{{ selectedObject?.name }}</p></div><span>示例结果</span></div><div v-if="activeResultRun" class="active-result-summary"><div class="min-w-0"><b>{{ activeResultRun.name }}</b><small>{{ getModelDefinition(activeResultRun.modelId).desc }}</small></div><em>{{ activeResultRun.status }} · {{ runProgress(activeResultRun) }}%</em></div><button v-if="analysisHistory.length" class="result-history-toggle" :aria-expanded="historyExpanded" @click="historyExpanded=!historyExpanded"><span><History :size="14" /><b>分析记录</b><small>{{ historyScope === 'case' ? `当前 Case · ${analysisHistory.length} 次` : `当前 WSI · ${analysisHistory.length} 次` }}</small></span><ChevronDown :class="historyExpanded&&'open'" :size="15" /></button></header>
      <section v-if="historyExpanded && analysisHistory.length" class="analysis-history" aria-label="分析记录时间轴">
        <button v-for="(historyTask,index) in analysisHistory" :key="historyTask.id" :class="historyTask.id===task.id&&'active'" @click="openHistoryTask(historyTask)">
          <i><span /></i><div><div><b>{{ index===0 ? '最近一次分析' : historyTask.createdAt }}</b><em :class="statusClass(historyTask.status)">{{ historyTask.status }}</em></div><p>{{ historyRuns(historyTask).map(run=>run.name).join('、') || '未配置模型' }}</p><small>{{ historyTask.createdAt }} · {{ getTaskDisplayName(historyTask) }}</small></div>
        </button>
      </section>
      <nav v-if="runs.length > 1" class="result-model-switcher" aria-label="分析结果模型"><button v-for="run in runs" :key="run.id" :class="activeResultRun?.modelId === run.modelId && 'active'" @click="selectResultModel(run.modelId)"><span>{{ run.name }}</span><small>{{ run.status }} · {{ runProgress(run) }}%</small></button></nav>
      <div v-if="!activeResultRun" class="results-empty"><BarChart3 :size="24" /><b>尚未选择分析模型</b><p>在左侧为当前 WSI 选择模型后，这里会分别显示各模型结果。</p></div>
      <template v-else>
        <nav class="result-tabs two-tabs"><button :class="resultTab === 'quantitative' && 'active'" @click="resultTab = 'quantitative'">{{ isTmeResult ? 'TME 定量' : '检测概览' }}</button><button :class="resultTab === 'features' && 'active'" @click="resultTab = 'features'">{{ isTmeResult ? '特征分析' : '细胞分类' }}</button></nav>
        <div v-if="resultTab === 'quantitative'" class="results-scroll">
          <template v-if="isTmeResult">
            <div class="metric-grid"><div><span>分类数</span><b>4</b></div><div><span>总计数</span><b>3,809</b></div><div><span>分析倍率</span><b>20<small>X</small></b></div></div>
            <section class="merged-annotation-card annotation-global-card">
              <header><h3>标注显示</h3><button :class="['annotation-switch', annotationLayerVisible && 'active']" role="switch" :aria-checked="annotationLayerVisible" :aria-label="annotationLayerVisible ? '隐藏全部标注' : '显示全部标注'" @click="toggleAllAnnotations"><i /></button></header>
              <label class="merged-opacity"><span>全局透明度</span><b>{{ annotationOpacity }}%</b><input v-model="annotationOpacity" type="range" min="0" max="100" /></label>
            </section>
            <section class="merged-annotation-card">
              <header class="annotation-group-heading"><h3>细胞核</h3><div><span>{{ nucleusLabels.length }} 个分类</span><b>{{ nucleusOpacity }}%</b><button :class="['annotation-switch', showNuclei && 'active']" role="switch" :aria-checked="showNuclei" :aria-label="showNuclei ? '隐藏细胞核标注' : '显示细胞核标注'" @click="showNuclei = !showNuclei"><i /></button></div></header>
              <label class="group-opacity"><span>细胞核透明度</span><input v-model="nucleusOpacity" type="range" min="0" max="100" /></label>
              <div class="merged-annotation-list">
                <article v-for="label in nucleusLabels" :key="label.id" class="annotation-class-row">
                  <div><button :class="['annotation-switch small', label.visible && 'active']" role="switch" :aria-checked="label.visible" :aria-label="`${label.visible ? '隐藏' : '显示'} ${label.name}`" @click="label.visible = !label.visible"><i /></button><i class="annotation-color" :style="{ background: label.color }" /><span :title="label.name">{{ label.name }}</span><strong>{{ label.count.toLocaleString() }}</strong><input v-model="label.opacity" class="label-opacity" type="range" min="0" max="100" :aria-label="`${label.name}透明度`" /></div>
                  <i class="annotation-count-track"><b :style="{ width: `${annotationBarWidth(label, nucleusLabels)}%`, background: label.color }" /></i>
                </article>
              </div>
            </section>
            <section class="merged-annotation-card">
              <header class="annotation-group-heading"><h3>区域</h3><div><span>{{ regionLabels.length }} 个分类</span><b>{{ regionOpacity }}%</b><button :class="['annotation-switch', showTissueRegions && 'active']" role="switch" :aria-checked="showTissueRegions" :aria-label="showTissueRegions ? '隐藏区域标注' : '显示区域标注'" @click="showTissueRegions = !showTissueRegions"><i /></button></div></header>
              <label class="group-opacity"><span>区域透明度</span><input v-model="regionOpacity" type="range" min="0" max="100" /></label>
              <div class="merged-annotation-list">
                <article v-for="label in regionLabels" :key="label.id" class="annotation-class-row">
                  <div><button :class="['annotation-switch small', label.visible && 'active']" role="switch" :aria-checked="label.visible" :aria-label="`${label.visible ? '隐藏' : '显示'} ${label.name}`" @click="label.visible = !label.visible"><i /></button><i class="annotation-color" :style="{ background: label.color }" /><span :title="label.name">{{ label.name }}</span><strong>{{ label.count.toLocaleString() }}</strong><input v-model="label.opacity" class="label-opacity" type="range" min="0" max="100" :aria-label="`${label.name}透明度`" /></div>
                  <i class="annotation-count-track"><b :style="{ width: `${annotationBarWidth(label, regionLabels)}%`, background: label.color }" /></i>
                </article>
              </div>
            </section>
          </template>
          <template v-else>
            <div class="metric-grid"><div><span>检测细胞核</span><b>178,055</b></div><div><span>有效实例</span><b>176,842</b></div><div><span>平均置信度</span><b>94.2<small>%</small></b></div></div>
            <section class="result-section"><div class="section-title"><h3>分割质量</h3><span>实例级结果</span></div><dl class="quality-list"><div><dt>边界完整率</dt><dd>96.1%</dd></div><div><dt>有效实例占比</dt><dd>99.3%</dd></div><div><dt>待复核实例</dt><dd>1,213</dd></div><div><dt>分析倍率</dt><dd>20X</dd></div></dl></section>
            <section class="result-section"><div class="section-title"><h3>细胞核分类摘要</h3><span>数量 · 占比</span></div><div class="nuclei-list"><div v-for="item in nucleiComposition" :key="item.name"><span>{{ item.name }}</span><i><b :style="{ width: `${item.percent}%` }" /></i><strong>{{ item.value }}</strong></div></div></section>
          </template>
        </div>
        <div v-else-if="resultTab === 'features'" class="results-scroll feature-results">
          <template v-if="isTmeResult">
            <div class="feature-summary">
              <div><span>特征数 · {{ sparkSummary.validCount }} 有效</span><b>{{ sparkSummary.featureCount }}</b></div>
              <div><span>细胞</span><b>{{ sparkSummary.cellCount.toLocaleString() }}</b></div>
              <div><span>ROI</span><b>{{ sparkSummary.roiCount }}</b></div>
              <div><span>耗时</span><b>{{ Math.round(sparkSummary.seconds) }}s</b></div>
            </div>
            <div class="tme-result-toolbox" aria-label="TME 查看工具">
              <button :class="showNuclei && 'active'" @click="toggleResultNuclei"><Grid3X3 :size="14" /><span>细胞核</span><em>{{ showNuclei ? 'ON' : 'OFF' }}</em></button>
              <button :class="showFeatureLayer && 'active'" @click="toggleResultHeatmap"><Layers :size="14" /><span>特征热力图</span><em>{{ showFeatureLayer ? 'ON' : 'OFF' }}</em></button>
              <button class="feature-analysis-button" @click="showTmeFeatureAnalysis = true"><BarChart3 :size="14" /><span>特征分析</span></button>
            </div>
            <div v-if="showNuclei || showTissueRegions || showFeatureLayer" class="tme-result-layer-settings">
              <label v-if="showNuclei || showTissueRegions"><span>标注透明度</span><input v-model="annotationOpacity" type="range" min="0" max="100" /><b>{{ annotationOpacity }}%</b></label>
              <label v-if="showFeatureLayer"><span>热力图透明度</span><input v-model="opacity" type="range" min="0" max="100" /><b>{{ opacity }}%</b></label>
            </div>
            <div class="feature-filters"><select v-model="featureCategory"><option v-for="category in featureCategories" :key="category">{{ category }}</option></select><label><Search :size="15" /><input v-model="featureSearch" placeholder="搜索特征名/类别" /></label></div>
            <div class="feature-overview-meta"><span>{{ filteredFeatures.length }} / {{ sparkSummary.featureCount }} 个特征</span></div>
            <div class="feature-list"><button v-for="feature in filteredFeatures" :key="feature.id" :class="selectedFeatureId === feature.id && 'active'" @click="selectFeature(feature)"><span class="min-w-0"><b :title="feature.name"><i v-if="feature.spatial" />{{ feature.name }}</b><small>{{ feature.category }}</small></span><strong>{{ feature.value }} <small>{{ feature.unit }}</small></strong><em v-if="feature.spatial">空间</em></button></div>
          </template>
          <template v-else><div class="feature-summary"><div><span>分类数</span><b>5</b></div><div><span>细胞核</span><b>178k</b></div><div><span>平均密度</span><b>4,577</b></div><div><span>耗时</span><b>18s</b></div></div><section class="result-section"><div class="section-title"><h3>分类明细</h3><span>模型独立输出</span></div><div class="classification-list"><div v-for="item in nucleiComposition" :key="item.name"><span>{{ item.name }}</span><strong>{{ item.value }}</strong><small>{{ item.percent }}%</small></div></div></section></template>
        </div>
      </template>
    </aside>
    <TmeFeatureAnalysisModal
      v-if="showTmeFeatureAnalysis && task"
      :objects="task.objects"
      :current-object-id="selectedObject?.id"
      @close="showTmeFeatureAnalysis = false"
      @select-object="selectObject"
    />
  </div>
  <div v-else class="section-container grid min-h-[60dvh] place-items-center"><div class="text-center"><h1 class="text-xl font-semibold">分析任务不存在或已清空</h1><p class="mt-2">返回任务列表选择其他任务。</p><button class="btn-primary mt-5" @click="router.replace('/workbench/tasks')">返回分析任务列表</button></div></div>
</template>

<style scoped>
.viewer-source-badge,.active-layer-banner,.viewer-minimap,.heatmap-legend{pointer-events:none}
.opacity-control span{white-space:nowrap}
.workbench-shell{display:grid;height:calc(100dvh - 64px);grid-template-columns:320px minmax(0,1fr) 380px;overflow:hidden;background:#0f1014;color:#e2e8f0}.workbench-left{display:flex;min-height:0;flex-direction:column;border-right:1px solid rgb(255 255 255 / .08);background:#202126}.workbench-center{position:relative;display:flex;min-width:0;flex-direction:column;overflow:hidden;background:#111217}.workbench-results{display:flex;min-height:0;flex-direction:column;border-left:1px solid rgb(255 255 255 / .08);background:#202126}.workspace-mode-bar{display:flex;height:52px;flex:none;align-items:center;justify-content:space-between;border-bottom:1px solid rgb(255 255 255 / .08);padding:0 14px;background:#17181d}.segmented-control{display:flex;height:34px;align-items:center;border-radius:6px;background:#0f1014;padding:3px}.segmented-control button{height:28px;border-radius:4px;padding:0 15px;color:#7f8a9e;font-size:13px}.segmented-control button.active{background:#3a2344;color:#e9c4f8}.viewer-toolbar{display:flex;min-height:50px;flex:none;flex-wrap:wrap;align-content:center;align-items:center;gap:5px;overflow:hidden;border-bottom:1px solid rgb(255 255 255 / .08);padding:7px 12px;background:#17181d}.viewer-button{display:grid;min-width:30px;height:30px;place-items:center;border-radius:5px;padding:0 6px;color:#94a3b8;font-size:11px}.viewer-button:hover,.viewer-button.active{background:#9c36c7;color:white}.tool-toggle{display:flex;height:32px;flex:none;align-items:center;gap:6px;border:1px solid rgb(255 255 255 / .1);border-radius:5px;padding:0 9px;color:#94a3b8;font-size:12px}.tool-toggle:hover,.tool-toggle.active{border-color:rgb(143 53 183 / .7);background:rgb(143 53 183 / .2);color:#e9b9fb}.opacity-control{display:flex;height:32px;min-width:162px;align-items:center;gap:7px;padding:0 7px;color:#94a3b8;font-size:11px}.opacity-control input{width:72px;accent-color:#9c36c7}.opacity-control b{width:30px;color:#cbd5e1;font-weight:500}.viewer-frame{position:relative;min-height:0;flex:1;overflow:hidden;touch-action:none;user-select:none;background:#0d0f13}.viewer-frame:fullscreen{background:#0d0f13}.pan-cursor{cursor:grab}.dragging{cursor:grabbing}.roi-cursor{cursor:crosshair}.slide-stage{position:absolute;left:50%;top:50%;transform-origin:center;transition:transform .16s ease-out}.dragging .slide-stage,.roi-cursor .slide-stage{transition:none}.viewer-slide-image{display:block;height:min(72vh,760px);max-height:none;max-width:none;border:1px solid #24363c;border-radius:4px;background:white;box-shadow:0 20px 55px rgb(0 0 0 / .38);pointer-events:none}.viewer-source-badge,.active-layer-banner,.viewer-help{position:absolute;z-index:8;display:flex;align-items:center;gap:7px;border:1px solid rgb(255 255 255 / .08);border-radius:5px;background:rgb(23 24 29 / .94);color:#94a3b8;font-size:11px;box-shadow:0 8px 22px rgb(0 0 0 / .22)}.viewer-source-badge{left:14px;top:14px;padding:7px 9px}.active-layer-banner{left:50%;top:14px;max-width:48%;transform:translateX(-50%);padding:7px 10px;color:#e2e8f0}.active-layer-banner span{color:#b86bdd}.viewer-help{bottom:16px;left:16px;padding:6px 8px}.nuclei-layer{position:absolute;inset:0;pointer-events:none}.nuclei-layer i{position:absolute;width:8px;height:8px;transform:translate(-50%,-50%);border:1px solid rgb(255 255 255 / .82);border-radius:50%;background:#5b8ff9;box-shadow:0 0 0 2px rgb(91 143 249 / .24)}.roi-selection{position:absolute;z-index:7;border:2px solid #d38cf0;background:rgb(143 53 183 / .12);box-shadow:0 0 0 1px rgb(0 0 0 / .35)}.roi-result{position:absolute;z-index:9;width:238px;border:1px solid rgb(255 255 255 / .12);border-radius:6px;background:#17181df5;padding:12px;box-shadow:0 18px 45px rgb(0 0 0 / .5);font-size:12px}.roi-result button{color:#94a3b8}.roi-result p{margin:8px 0 10px;font-size:11px}.roi-result>div:not(:first-child){display:flex;align-items:center;justify-content:space-between;margin-top:7px}.roi-result span{display:flex;align-items:center;gap:6px}.roi-result i{width:7px;height:7px;border-radius:50%}.viewer-minimap{position:absolute;right:16px;bottom:16px;z-index:6;width:112px;height:142px;overflow:hidden;border:1px solid #24414a;border-radius:5px;background:white;box-shadow:0 12px 32px rgb(0 0 0 / .35)}.viewer-minimap img{width:100%;height:100%;object-fit:cover}.viewer-minimap span{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border:1px solid #d277ed;background:rgb(143 53 183 / .08)}.viewer-meta{position:absolute;bottom:16px;left:50%;z-index:5;display:flex;transform:translateX(-50%);align-items:center;gap:16px;color:#64748b;font-size:11px}.scale-bar{border-top:2px solid #94a3b8;padding-top:4px}.comparison-panel{display:flex;min-height:0;flex:1;flex-direction:column;padding:16px}.comparison-header{display:flex;align-items:flex-start;justify-content:space-between}.comparison-header h2{font-size:18px;font-weight:600}.comparison-header p{font-size:12px}.comparison-header>span{color:#64748b;font-size:12px}.comparison-tabs{display:flex;gap:4px;margin-top:14px;border-bottom:1px solid rgb(255 255 255 / .08)}.comparison-tabs button{display:flex;height:38px;align-items:center;gap:6px;border-bottom:2px solid transparent;padding:0 13px;color:#8490a3;font-size:13px}.comparison-tabs button.active{border-color:#9c36c7;color:#e8b8f8}.comparison-filters{display:flex;gap:8px;padding:12px 0}.filter-button,.comparison-filters label{display:flex;height:36px;align-items:center;gap:7px;border:1px solid rgb(255 255 255 / .08);border-radius:5px;background:#17181d;padding:0 11px;color:#94a3b8;font-size:12px}.comparison-filters label{min-width:0;flex:1}.comparison-filters input{width:100%;background:transparent;outline:none}.heatmap-scroll,.feature-table-scroll{min-height:0;flex:1;overflow:auto;border:1px solid rgb(255 255 255 / .08);border-radius:6px;background:#15161b}.heatmap-table,.feature-table{width:max-content;min-width:100%;border-collapse:collapse;font-size:11px}.heatmap-table th,.heatmap-table td,.feature-table th,.feature-table td{height:54px;border-right:1px solid rgb(255 255 255 / .06);border-bottom:1px solid rgb(255 255 255 / .06);padding:0 10px}.heatmap-table thead th,.feature-table thead th{position:sticky;top:0;z-index:2;max-width:126px;overflow:hidden;background:#24262e;color:#8f9bae;text-align:left;text-overflow:ellipsis;white-space:nowrap}.heatmap-table thead th:first-child,.feature-table thead th:first-child{left:0;z-index:3;min-width:190px}.heatmap-table tbody th,.feature-table tbody th{position:sticky;left:0;z-index:1;min-width:190px;background:#1b1c22;text-align:left}.heatmap-table tbody th b,.heatmap-table tbody th small{display:block;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.heatmap-table tbody th small{margin-top:3px;color:#64748b;font-weight:400}.heatmap-table td{min-width:108px;color:rgb(255 255 255 / .74);text-align:center;cursor:pointer}.heatmap-table tbody tr:hover th{color:#e9c4f8}.feature-table td{min-width:126px;color:#cbd5e1;text-align:right}.distribution-list{min-height:0;flex:1;overflow-y:auto;border-top:1px solid rgb(255 255 255 / .08)}.distribution-list article{display:grid;grid-template-columns:240px 1fr;align-items:center;gap:24px;border-bottom:1px solid rgb(255 255 255 / .07);padding:15px 8px}.distribution-list article>div:first-child b,.distribution-list article>div:first-child span{display:block}.distribution-list article>div:first-child b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}.distribution-list article>div:first-child span{margin-top:3px;color:#64748b;font-size:11px}.distribution-track{position:relative;height:8px;border-radius:4px;background:#2b2d35}.distribution-track i{position:absolute;top:50%;width:12px;height:12px;transform:translate(-50%,-50%);border:2px solid #202126;border-radius:50%;background:#b45ed4}.results-header{flex:none;border-bottom:1px solid rgb(255 255 255 / .08);padding:14px}.results-header h2{font-size:17px;font-weight:600}.results-header p{margin-top:2px;color:#7c8799;font-size:12px}.results-header>div>span{flex:none;border:1px solid rgb(143 53 183 / .45);border-radius:4px;background:rgb(143 53 183 / .14);padding:3px 6px;color:#d292f4;font-size:10px}.results-header b{font-size:13px}.results-header small{color:#64748b;font-size:11px}.result-tabs{display:grid;height:48px;flex:none;grid-template-columns:repeat(3,1fr);border-bottom:1px solid rgb(255 255 255 / .08);padding:7px 10px}.result-tabs button{border-radius:5px;color:#8490a3;font-size:13px}.result-tabs button.active{background:#3a2344;color:#e7b7f8}.results-scroll{min-height:0;flex:1;overflow-y:auto;padding:12px}.metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.metric-grid>div,.feature-summary>div{border:1px solid rgb(255 255 255 / .07);border-radius:5px;background:#17181d;padding:9px}.metric-grid span,.feature-summary span{display:block;color:#697589;font-size:11.5px}.metric-grid b,.feature-summary b{display:block;margin-top:3px;font-size:19px}.metric-grid b small{margin-left:2px;color:#8490a3;font-size:11px;font-weight:400}.result-section{margin-top:14px;border-top:1px solid rgb(255 255 255 / .08);padding-top:13px}.section-title{display:flex;align-items:center;justify-content:space-between}.section-title h3{font-size:14px;font-weight:600}.section-title span{color:#64748b;font-size:11px}.composition-list{margin-top:11px}.composition-list>div{margin-bottom:10px}.composition-list>div>div:first-child{display:flex;align-items:center;justify-content:space-between;font-size:11px}.composition-list span{display:flex;align-items:center;gap:6px}.composition-list span i{width:7px;height:7px;border-radius:2px}.composition-list b{font-weight:500}.composition-track{height:4px;margin-top:5px;overflow:hidden;border-radius:2px;background:#2d2f36}.composition-track i{display:block;height:100%;border-radius:2px}.nuclei-list{margin-top:10px}.nuclei-list>div{display:grid;grid-template-columns:minmax(0,1fr) 84px 62px;align-items:center;gap:8px;margin-bottom:10px;font-size:12px}.nuclei-list>div>span{overflow:hidden;color:#9aa6b8;text-overflow:ellipsis;white-space:nowrap}.nuclei-list>div>i{height:5px;overflow:hidden;border-radius:2px;background:#2d2f36}.nuclei-list>div>i b{display:block;height:100%;border-radius:2px;background:#73a4ea}.nuclei-list strong{text-align:right;font-weight:500}.feature-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.feature-summary>div{padding:7px}.feature-summary b{font-size:14px}.feature-filters{display:grid;grid-template-columns:112px minmax(0,1fr);gap:6px;margin-top:10px}.feature-filters select,.feature-filters label{height:34px;border:1px solid rgb(255 255 255 / .08);border-radius:5px;background:#17181d;color:#cbd5e1;font-size:11px}.feature-filters select{padding:0 7px}.feature-filters label{display:flex;align-items:center;gap:6px;padding:0 8px}.feature-filters input{min-width:0;width:100%;background:transparent;outline:none}.feature-list{margin-top:8px;overflow:hidden;border:1px solid rgb(255 255 255 / .07);border-radius:6px}.feature-list button{display:grid;width:100%;min-height:42px;grid-template-columns:minmax(0,1fr) auto 34px;align-items:center;gap:7px;border-bottom:1px solid rgb(255 255 255 / .06);padding:6px 8px;text-align:left}.feature-list button:last-child{border-bottom:0}.feature-list button:hover,.feature-list button.active{background:rgb(143 53 183 / .12)}.feature-list b,.feature-list small{display:block}.feature-list b{overflow:hidden;color:#cbd5e1;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.feature-list b i{display:inline-block;width:7px;height:7px;margin-right:5px;border-radius:50%;background:#f87171}.feature-list span>small{margin-top:2px;color:#64748b;font-size:9px}.feature-list strong{color:#e2e8f0;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500}.feature-list strong small{display:inline;color:#64748b}.feature-list em{border-radius:4px;background:rgb(143 53 183 / .22);padding:2px 4px;color:#d292f4;font-size:9px;font-style:normal;text-align:center}.report-panel{display:flex;flex-direction:column;gap:12px}.report-status{display:flex;align-items:flex-start;gap:10px;border-bottom:1px solid rgb(255 255 255 / .08);padding-bottom:12px}.report-status b{font-size:13px}.report-status p{margin-top:3px;font-size:11px}.report-panel section{border-left:2px solid #8f35b7;padding:4px 0 4px 10px}.report-panel section h3{font-size:12px;font-weight:600}.report-panel section p,.report-panel section li{margin-top:6px;color:#94a3b8;font-size:11px;line-height:1.8}.model-selection{max-height:44%;overflow-y:auto;border-top:1px solid rgb(255 255 255 / .08);padding:13px}.model-selection h3{font-size:13px;font-weight:600}.model-selection p{font-size:11px}.model-option{display:flex;min-height:52px;align-items:center;justify-content:space-between;border:1px solid rgb(255 255 255 / .08);border-radius:6px;background:#17181d;padding:8px 10px;text-align:left;color:#94a3b8}.model-option b,.model-option small{display:block}.model-option b{color:#cbd5e1;font-size:13px}.model-option small{margin-top:2px;color:#64748b;font-size:11px}.model-option.active{border-color:rgb(143 53 183 / .65);background:rgb(143 53 183 / .17);color:#d292f4}.model-option:disabled{cursor:not-allowed;opacity:.35}
.viewer-toolbar{display:flex;min-height:92px;flex:none;flex-direction:column;flex-wrap:nowrap;align-items:stretch;gap:0;overflow:visible;padding:0}.viewer-toolbar-primary,.viewer-toolbar-secondary{display:flex;min-width:0;align-items:center;gap:5px;padding:6px 10px}.viewer-toolbar-primary{height:46px;border-bottom:1px solid rgb(255 255 255 / .06)}.viewer-toolbar-secondary{height:46px;overflow-x:auto;scrollbar-width:none}.viewer-toolbar-secondary::-webkit-scrollbar{display:none}.viewer-toolbar-spacer{min-width:6px;flex:1}.viewer-button:disabled{cursor:not-allowed;opacity:.3}.object-navigation,.zoom-controls{display:flex;height:32px;flex:none;align-items:center;gap:3px;border:1px solid rgb(255 255 255 / .08);border-radius:5px;background:#111217;padding:0 3px}.object-navigation span{min-width:42px;color:#94a3b8;font-size:11px;text-align:center}.zoom-controls select{width:64px;height:26px;border:0;background:#111217;color:#cbd5e1;font-size:11px;outline:none}.layout-picker{position:relative;flex:none}.layout-menu{position:absolute;right:0;top:38px;z-index:30;width:146px;border:1px solid rgb(255 255 255 / .1);border-radius:6px;background:#202126;padding:5px;box-shadow:0 16px 38px rgb(0 0 0 / .48)}.layout-menu button{display:flex;width:100%;height:34px;align-items:center;gap:8px;border-radius:4px;padding:0 9px;color:#94a3b8;font-size:12px}.layout-menu button:hover,.layout-menu button.active{background:rgb(143 53 183 / .18);color:#e6b7f7}.viewer-flyout{position:absolute;right:12px;top:150px;z-index:22;width:310px;border:1px solid rgb(255 255 255 / .1);border-radius:6px;background:#202126;box-shadow:0 18px 48px rgb(0 0 0 / .52)}.viewer-flyout>header{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1px solid rgb(255 255 255 / .08);padding:12px}.viewer-flyout>header b,.viewer-flyout>header small{display:block}.viewer-flyout>header b{font-size:13px}.viewer-flyout>header small{margin-top:2px;color:#64748b;font-size:10px}.viewer-flyout>header button{color:#94a3b8}.viewer-help-content,.viewer-settings-content{padding:12px}.viewer-help-content dl{display:grid;gap:2px}.viewer-help-content dl>div{display:grid;min-height:34px;grid-template-columns:92px 1fr;align-items:center;border-bottom:1px solid rgb(255 255 255 / .05);font-size:11px}.viewer-help-content dt{color:#d2d9e4}.viewer-help-content dd{color:#778398}.viewer-settings-content{display:grid;gap:12px}.viewer-settings-content>label{display:flex;align-items:center;justify-content:space-between;color:#b9c1ce;font-size:11px}.viewer-settings-content input[type=checkbox]{accent-color:#9c36c7}.viewer-setting-range{display:grid!important;grid-template-columns:1fr!important}.viewer-setting-range span{display:flex;justify-content:space-between}.viewer-setting-range span b{font-weight:500;color:#d292f4}.viewer-setting-range input{width:100%;margin-top:8px;accent-color:#9c36c7}.count-cursor{cursor:crosshair}.slide-stage.no-motion,.slide-stage.no-motion *{transition:none}.count-marker-layer{position:absolute;inset:0;z-index:4;pointer-events:none}.count-marker-layer i{position:absolute;width:12px;height:12px;transform:translate(-50%,-50%);border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgb(0 0 0 / .55)}.count-marker-layer i.positive{background:#ec4899}.count-marker-layer i.negative{background:#3b82f6}.magnifier-lens{position:absolute;z-index:12;width:176px;height:132px;transform:translate(18px,-50%);border:2px solid #d292f4;border-radius:6px;background-color:white;background-image:url('/wsi-cmu-region.jpg');background-repeat:no-repeat;box-shadow:0 16px 36px rgb(0 0 0 / .5);pointer-events:none}.magnifier-lens.flip{transform:translate(calc(-100% - 18px),-50%)}.magnifier-lens span{position:absolute;right:6px;top:6px;border-radius:4px;background:rgb(17 18 23 / .86);padding:2px 5px;color:#e8b8f8;font-size:10px}.count-summary{position:absolute;bottom:16px;left:14px;z-index:9;width:220px;border:1px solid rgb(255 255 255 / .1);border-radius:6px;background:rgb(23 24 29 / .96);padding:10px;box-shadow:0 12px 30px rgb(0 0 0 / .38)}.count-summary header{display:flex;align-items:center;justify-content:space-between;font-size:12px}.count-summary header span{color:#d292f4}.count-types{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:8px}.count-types button{display:flex;height:30px;align-items:center;justify-content:center;gap:5px;border:1px solid rgb(255 255 255 / .08);border-radius:4px;color:#94a3b8;font-size:10px}.count-types button.active{border-color:rgb(143 53 183 / .62);background:rgb(143 53 183 / .17);color:#e6b7f7}.count-types i{width:7px;height:7px;border-radius:50%}.count-types i.positive{background:#ec4899}.count-types i.negative{background:#3b82f6}.count-summary footer{display:flex;justify-content:flex-end;gap:12px;margin-top:8px;border-top:1px solid rgb(255 255 255 / .06);padding-top:8px}.count-summary footer button{display:flex;align-items:center;gap:4px;color:#94a3b8;font-size:10px}.count-summary footer button:disabled{opacity:.3}.split-viewer{display:grid;gap:8px;padding:8px}.split-viewer.layout-1x2{grid-template-columns:repeat(2,minmax(0,1fr))}.split-viewer.layout-2x2{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr))}.split-pane{display:flex;min-width:0;min-height:0;overflow:hidden;flex-direction:column;border:1px solid rgb(255 255 255 / .09);border-radius:5px;background:#111217;color:#cbd5e1;text-align:left}.split-pane.active{border-color:#9c36c7;box-shadow:0 0 0 1px rgb(156 54 199 / .24)}.split-pane>header,.split-pane>footer{display:flex;flex:none;align-items:center;justify-content:space-between;gap:8px;padding:0 9px}.split-pane>header{height:34px;border-bottom:1px solid rgb(255 255 255 / .07);background:#1b1c22}.split-pane>header span{display:flex;min-width:0;align-items:center;gap:7px;overflow:hidden;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.split-pane>header b{display:grid;width:18px;height:18px;flex:none;place-items:center;border-radius:3px;background:#2a2c34;color:#94a3b8;font-size:9px}.split-pane>header em{flex:none;color:#d292f4;font-size:9px;font-style:normal}.split-pane>footer{height:28px;border-top:1px solid rgb(255 255 255 / .06);color:#64748b;font-size:9px}.split-pane>footer span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.split-pane-body{display:grid;min-height:0;flex:1;overflow:hidden;place-items:center}.split-slide-stage{position:relative;height:88%;max-width:90%;aspect-ratio:2220/2967;transform-origin:center;transition:transform .16s ease-out}.split-slide-stage img{position:absolute;inset:0;width:100%;height:100%;border:1px solid #24363c;border-radius:3px;background:white}.tool-toggle b{font-size:10px;font-weight:600}.tool-toggle:disabled{cursor:not-allowed;opacity:.38}.feature-heatmap-layer{position:absolute;inset:0;z-index:2;overflow:hidden;border-radius:4px;pointer-events:none}.feature-heatmap-layer i{position:absolute;width:10.8%;aspect-ratio:1;border:1px solid rgb(255 255 255 / .16);box-shadow:inset 0 0 10px rgb(0 0 0 / .08)}.nuclei-layer{z-index:3}.heatmap-legend{position:absolute;right:140px;bottom:16px;z-index:8;display:block;width:202px;border:1px solid rgb(255 255 255 / .08);border-radius:5px;background:rgb(23 24 29 / .94);padding:9px 10px;color:#94a3b8;font-size:11px;box-shadow:0 8px 22px rgb(0 0 0 / .22)}.heatmap-legend>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:8px}.heatmap-legend>div:first-child span{overflow:hidden;color:#d8dee9;text-overflow:ellipsis;white-space:nowrap}.heatmap-legend>div:first-child b{flex:none;color:#8c98aa;font-size:9px;font-weight:500}.heatmap-legend>i{display:block;height:6px;margin-top:7px;border-radius:3px;background:linear-gradient(90deg,#3f5f9f,#3487a9,#42aa8b,#91c94d,#e9a33b,#e76f51)}.heatmap-legend-scale{display:flex;justify-content:space-between;margin-top:3px;color:#6f7b8e;font-size:9px}
.viewer-toolbar-primary{gap:8px}.viewer-toolbar-actions{display:flex;min-width:0;flex:1;align-items:center;gap:5px}.viewer-toolbar-utilities{display:flex;flex:none;align-items:center;gap:2px;border-left:1px solid rgb(255 255 255 / .08);padding-left:8px}.viewer-toolbar-group-label{flex:none;padding:0 3px;color:#64748b;font-size:10px;font-weight:600}.viewer-toolbar-primary .viewer-button{position:relative;flex:none}.count-tool-badge{position:absolute;right:1px;top:1px;display:grid;min-width:12px;height:12px;place-items:center;border-radius:6px;background:#d292f4;padding:0 3px;color:#17181d;font-size:8px;font-weight:700}.viewer-toolbar-secondary{justify-content:flex-start}.active-layer-banner{right:14px;left:auto;max-width:60%;transform:none;white-space:nowrap}.active-layer-banner b{min-width:0;overflow:hidden;text-overflow:ellipsis}.active-layer-banner span{flex:none}
.viewer-icon-button::after{position:absolute;left:50%;bottom:calc(100% + 7px);z-index:60;visibility:hidden;transform:translateX(-50%);border:1px solid rgb(255 255 255 / .12);border-radius:4px;background:#292b32;padding:5px 7px;color:#e2e8f0;box-shadow:0 8px 22px rgb(0 0 0 / .4);content:attr(data-tooltip);font-size:10px;line-height:1;opacity:0;pointer-events:none;white-space:nowrap}.viewer-icon-button:hover::after,.viewer-icon-button:focus-visible::after{visibility:visible;opacity:1}.viewer-icon-button:disabled::after{display:none}.viewer-toolbar-utilities .viewer-icon-button:last-child::after{right:0;left:auto;transform:none}.toolbar-tool-pair{display:flex;flex:none;align-items:center;gap:2px;border:1px solid rgb(255 255 255 / .07);border-radius:5px;background:#111217;padding:1px}.toolbar-tool-anchor{position:relative;flex:none}.viewer-tool-popover{position:absolute;left:50%;top:78px;z-index:45;width:220px;transform:translateX(-50%);border:1px solid rgb(255 255 255 / .12);border-radius:6px;background:#202126;padding:10px;box-shadow:0 18px 42px rgb(0 0 0 / .52)}.count-tool-popover header{display:flex;align-items:center;justify-content:space-between;font-size:12px}.count-tool-popover header span{color:#d292f4}.count-tool-popover footer{display:flex;justify-content:flex-end;gap:12px;margin-top:8px;border-top:1px solid rgb(255 255 255 / .06);padding-top:8px}.count-tool-popover footer button{display:flex;align-items:center;gap:4px;color:#94a3b8;font-size:10px}.count-tool-popover footer button:disabled{opacity:.3}
.viewer-flyout{max-height:calc(100% - 164px);overflow:hidden;display:flex;flex-direction:column}.viewer-info-content{min-height:0;overflow-y:auto;padding:12px}.viewer-info-tabs{display:grid;height:34px;grid-template-columns:1fr 1fr;border-radius:5px;background:#17181d;padding:3px}.viewer-info-tabs button{border-radius:4px;color:#7f8a9e;font-size:11px}.viewer-info-tabs button.active{background:#3a2344;color:#e9c4f8}.viewer-metadata{margin-top:10px}.pixel-inspector{display:grid;gap:4px;border:1px solid rgb(143 53 183 / .42);border-radius:5px;background:rgb(143 53 183 / .12);padding:10px}.pixel-inspector span{color:#a78bb3;font-size:10px}.pixel-inspector b{color:#e8b8f8;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500}.viewer-metadata dl{margin-top:10px}.viewer-metadata dl>div{display:grid;min-height:31px;grid-template-columns:88px minmax(0,1fr);align-items:center;border-bottom:1px solid rgb(255 255 255 / .06);font-size:10px}.viewer-metadata dt{color:#778398}.viewer-metadata dd{overflow:hidden;color:#d2d9e4;text-align:right;text-overflow:ellipsis;white-space:nowrap}.viewer-labels{display:grid;gap:12px;margin-top:10px}.viewer-labels article>header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}.viewer-labels article>header b{font-size:11px}.viewer-labels article>header span{color:#64748b;font-size:9px}.slide-label-preview{position:relative;display:flex;height:92px;overflow:hidden;flex-direction:column;justify-content:center;border:1px solid #d9d5ca;border-radius:4px;background:#ebe8dd;padding:12px;color:#24252b}.slide-label-preview::after{position:absolute;right:16px;bottom:13px;width:58px;height:25px;background:repeating-linear-gradient(90deg,#17181d 0 2px,transparent 2px 4px,#17181d 4px 5px,transparent 5px 7px);content:''}.slide-label-preview strong{max-width:190px;font-size:13px}.slide-label-preview span{margin-top:5px;color:#4b5563;font-size:10px}.slide-label-preview i{position:absolute;right:18px;top:14px;width:42px;height:18px;border:1px solid #7b8390;border-radius:9px}.viewer-labels img{display:block;width:100%;border:1px solid rgb(255 255 255 / .08);border-radius:4px;background:white}.macro-preview{height:128px;object-fit:cover;object-position:center}.thumbnail-preview{height:168px;object-fit:contain}
.wsi-file-name{display:flex;min-width:0;max-width:100%;align-items:baseline;color:inherit;font-weight:600;cursor:pointer;outline:none}.wsi-file-name:hover,.wsi-file-name:focus-visible{color:#e8b8f8}.wsi-file-name span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wsi-file-name em{flex:none;font-style:normal;white-space:nowrap}.wsi-file-name-tip{position:fixed;z-index:90;width:max-content;max-width:min(420px,calc(100vw - 24px));border:1px solid rgb(255 255 255 / .12);border-radius:5px;background:#292b32;padding:7px 9px;color:#e2e8f0;box-shadow:0 10px 28px rgb(0 0 0 / .42);font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;line-height:1.45;overflow-wrap:anywhere;pointer-events:none}.object-progress-summary{position:relative;min-height:31px}.model-summary{min-width:0;overflow:hidden;color:#cbd5e1;font-weight:600;text-overflow:ellipsis;white-space:nowrap}.model-summary.empty{color:#64748b;font-weight:500}.model-summary.multiple{display:flex;align-items:center;gap:3px;color:#d292f4}.model-summary.multiple:hover,.model-summary.multiple:focus-visible{color:#edc8fa;outline:none}.model-progress-details{position:absolute;left:-5px;right:-5px;top:calc(100% + 5px);z-index:60;display:none;gap:9px;border:1px solid rgb(255 255 255 / .12);border-radius:6px;background:rgb(17 18 23 / .98);padding:10px;box-shadow:0 16px 36px rgb(0 0 0 / .52)}.model-progress-details::before{position:absolute;right:0;bottom:100%;left:0;height:6px;content:''}.object-progress-summary.has-multiple-models:hover .model-progress-details,.object-progress-summary.has-multiple-models:focus-within .model-progress-details{display:grid}.model-progress-title{color:#cbd5e1;font-size:10px;font-weight:600}.model-progress-details>div>div{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:9px}.model-progress-details span{min-width:0;overflow:hidden;color:#b7c0ce;text-overflow:ellipsis;white-space:nowrap}.model-progress-details small{flex:none;color:#64748b}.model-progress-details i{display:block;height:3px;margin-top:4px;overflow:hidden;border-radius:2px;background:#30323a}.model-progress-details i b{display:block;height:100%;border-radius:2px;background:#b45ed4}
.case-context{flex:none;border-bottom:1px solid rgb(255 255 255 / .08);background:#191a20;padding:9px}.case-context-toggle{display:flex;width:100%;align-items:center;justify-content:space-between;border-radius:6px;padding:7px 8px;text-align:left}.case-context-toggle:hover{background:rgb(255 255 255 / .04)}.case-context-toggle span,.case-context-toggle b,.case-context-toggle small{display:block;min-width:0}.case-context-toggle b{color:#d8dee9;font-size:13px}.case-context-toggle small{margin-top:3px;color:#d292f4;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px}.case-context-toggle svg{color:#64748b;transition:transform .15s}.case-context-toggle svg.open{transform:rotate(180deg)}.case-context-body{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:5px;border:1px solid rgb(255 255 255 / .07);border-radius:6px;background:#15161b;padding:10px}.case-context-body>div{min-width:0}.case-context-body .wide{grid-column:1/-1}.case-context-body span,.case-context-body b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.case-context-body span{color:#7e8ca0;font-size:10px}.case-context-body b{margin-top:3px;color:#cbd5e1;font-size:11px;font-weight:500}.case-context-body>button{display:flex;grid-column:1/-1;align-items:center;gap:5px;border-top:1px solid rgb(255 255 255 / .06);padding-top:9px;color:#d292f4;font-size:10.5px;text-align:left}.case-context-body>button:hover{color:#edc8fa}
.active-result-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;border-top:1px solid rgb(255 255 255 / .07);padding-top:11px}.active-result-summary b,.active-result-summary small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.active-result-summary small{margin-top:2px;font-size:11.5px}.active-result-summary em{flex:none;color:#8490a3;font-size:11.5px;font-style:normal}.result-model-switcher{display:grid;flex:none;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:6px;border-bottom:1px solid rgb(255 255 255 / .08);padding:8px 10px;background:#191a20}.result-model-switcher button{min-width:0;height:48px;border:1px solid rgb(255 255 255 / .08);border-radius:5px;padding:7px 9px;text-align:left}.result-model-switcher span,.result-model-switcher small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.result-model-switcher span{color:#b7c0ce;font-size:12px;font-weight:600}.result-model-switcher small{margin-top:3px;color:#64748b;font-size:10.5px}.result-model-switcher button.active{border-color:rgb(143 53 183 / .72);background:rgb(143 53 183 / .18)}.result-model-switcher button.active span{color:#e9c4f8}.result-model-switcher button.active small{color:#b886ca}.results-empty{display:grid;min-height:0;flex:1;place-content:center;justify-items:center;padding:24px;color:#64748b;text-align:center}.results-empty b{margin-top:10px;color:#cbd5e1;font-size:14px}.results-empty p{margin-top:5px;max-width:240px;font-size:12px;line-height:1.7}
.result-history-toggle{display:flex;width:100%;height:39px;align-items:center;justify-content:space-between;margin-top:11px;border:1px solid rgb(255 255 255 / .07);border-radius:6px;background:#191a20;padding:0 9px;text-align:left}.result-history-toggle:hover{border-color:rgb(143 53 183 / .38);background:rgb(143 53 183 / .07)}.result-history-toggle>span{display:flex;min-width:0;align-items:center;gap:6px}.result-history-toggle svg{flex:none;color:#b86fd7}.result-history-toggle b{color:#cbd5e1;font-size:12.5px}.result-history-toggle small{overflow:hidden;color:#718096;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.result-history-toggle>svg{color:#64748b;transition:transform .15s}.result-history-toggle>svg.open{transform:rotate(180deg)}.analysis-history{max-height:255px;flex:none;overflow-y:auto;border-bottom:1px solid rgb(255 255 255 / .08);background:#17181d;padding:7px 10px}.analysis-history>button{display:grid;width:100%;grid-template-columns:16px minmax(0,1fr);gap:7px;padding:7px 4px;text-align:left}.analysis-history>button>i{position:relative;display:flex;justify-content:center}.analysis-history>button>i::after{position:absolute;top:13px;bottom:-14px;width:1px;background:#343642;content:''}.analysis-history>button:last-child>i::after{display:none}.analysis-history>button>i>span{position:relative;z-index:1;width:8px;height:8px;margin-top:4px;border:2px solid #5e6270;border-radius:50%;background:#17181d}.analysis-history>button.active>i>span{border-color:#c46ce6;background:#9c36c7;box-shadow:0 0 0 3px rgb(156 54 199 / .12)}.analysis-history>button>div{min-width:0}.analysis-history>button>div>div{display:flex;align-items:center;justify-content:space-between;gap:7px}.analysis-history b{overflow:hidden;color:#c3ccd8;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.analysis-history em{flex:none;border:1px solid;border-radius:9px;padding:3px 6px;font-size:9.5px;font-style:normal}.analysis-history p{margin-top:3px;overflow:hidden;color:#8d99aa;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.analysis-history small{display:block;margin-top:3px;overflow:hidden;color:#566477;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:9.5px;text-overflow:ellipsis;white-space:nowrap}.analysis-history>button.active>div{border-radius:5px;background:rgb(143 53 183 / .08);padding:5px 6px;margin:-5px -6px}.analysis-history>button:hover>div{color:#e8b8f8}
.tme-analysis-entry{border-color:rgb(88 112 210 / .5);background:rgb(64 89 190 / .12);color:#b9c7ff}.tme-analysis-entry:hover{border-color:#647fe4;background:rgb(64 89 190 / .24);color:#e0e7ff}
.metric-grid>div,.feature-summary>div{min-width:0}.metric-grid span,.feature-summary span,.metric-grid b,.feature-summary b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.quality-list{margin-top:8px}.quality-list>div{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgb(255 255 255 / .06);padding:9px 0;font-size:12.5px}.quality-list dt{color:#8490a3}.quality-list dd{color:#d8dee9}.classification-list{margin-top:9px}.classification-list>div{display:grid;grid-template-columns:minmax(0,1fr) 72px 34px;align-items:center;gap:8px;border-bottom:1px solid rgb(255 255 255 / .06);padding:9px 0;font-size:12px}.classification-list span{overflow:hidden;color:#9aa6b8;text-overflow:ellipsis;white-space:nowrap}.classification-list strong{font-weight:500;text-align:right}.classification-list small{color:#64748b;text-align:right}
.annotation-flyout{width:350px}.annotation-panel{min-height:0;overflow-y:auto;padding:12px}.annotation-master{width:100%;height:34px;border:1px solid #485a9d;border-radius:5px;background:#22283b;color:#aebbe9;font-size:12px;font-weight:600}.annotation-master.active{border-color:#5477e4;background:#355ec5;color:white}.annotation-opacity{display:grid;height:38px;grid-template-columns:54px minmax(0,1fr) 38px;align-items:center;gap:7px;color:#9aa6b8;font-size:10px}.annotation-opacity input{width:100%;accent-color:#4d79e6}.annotation-opacity b{color:#cbd5e1;text-align:right}.annotation-global-actions,.annotation-group-actions{display:grid;grid-template-columns:1fr 1fr;gap:5px}.annotation-global-actions button,.annotation-group-actions button{height:28px;border:1px solid rgb(255 255 255 / .09);border-radius:4px;background:#252733;color:#9aa6b8;font-size:10px}.annotation-global-actions button:hover,.annotation-group-actions button:hover{border-color:#5069c4;color:#d9e0ef}.annotation-quant{margin-top:12px;border-top:1px solid rgb(255 255 255 / .08);padding-top:11px}.annotation-quant header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.annotation-quant header b,.annotation-quant header small{display:block}.annotation-quant header b{font-size:12px}.annotation-quant header small{margin-top:3px;color:#6f7b8e;font-size:9px;line-height:1.45}.annotation-quant header em{flex:none;border-radius:8px;background:rgb(30 147 187 / .16);padding:3px 6px;color:#64cee8;font-size:8px;font-style:normal}.annotation-quant>button{display:flex;width:100%;height:32px;align-items:center;justify-content:center;gap:6px;margin-top:8px;border:1px solid #5071d9;border-radius:4px;background:#315fac;color:white;font-size:10px}.annotation-quant>button.active{border-color:#d08ced;background:#714088}.annotation-group{margin-top:12px}.annotation-group>header{display:flex;height:32px;align-items:center;justify-content:space-between;border:1px solid #3e55a4;border-radius:4px;background:#212641;padding:0 8px}.annotation-group>header b{font-size:11px}.annotation-group>header button{color:#b8c6ee;font-size:9px}.annotation-group-actions{margin-top:5px}.annotation-label-list{margin-top:6px;border:1px solid rgb(255 255 255 / .07);border-radius:5px;background:#17181d}.annotation-label-list label{display:grid;min-height:32px;grid-template-columns:14px 19px minmax(0,1fr) 7px 34px;align-items:center;gap:6px;border-bottom:1px solid rgb(255 255 255 / .06);padding:4px 6px}.annotation-label-list label:last-child{border-bottom:0}.annotation-label-list label:hover{background:rgb(81 103 177 / .09)}.annotation-label-list input[type=checkbox]{accent-color:#4f79e4}.annotation-label-list input[type=color]{width:18px;height:18px;overflow:hidden;border:1px solid #596274;border-radius:3px;background:transparent;padding:1px}.annotation-label-list span{overflow:hidden;color:#c0c8d5;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.annotation-label-list i{width:7px;height:7px;border-radius:50%}.annotation-label-list em{border:1px solid rgb(255 255 255 / .08);border-radius:3px;padding:2px 3px;color:#7f8a9e;font-size:8px;font-style:normal;text-align:center}.region-annotation-layer{position:absolute;inset:0;z-index:2;overflow:hidden;pointer-events:none}.region-annotation-layer i{position:absolute;transform-origin:center;border:1px solid rgb(255 255 255 / .24);border-radius:42% 58% 48% 52% / 53% 44% 56% 47%;mix-blend-mode:multiply;filter:saturate(1.15)}
.viewer-toolbar{min-height:46px}.viewer-toolbar-primary{width:100%}.tme-result-toolbox{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin-top:9px}.tme-result-toolbox button{display:flex;min-width:0;height:34px;align-items:center;gap:6px;border:1px solid rgb(255 255 255 / .09);border-radius:5px;background:#17181d;padding:0 8px;color:#94a3b8;font-size:10px}.tme-result-toolbox button:hover{border-color:rgb(143 53 183 / .4);background:rgb(143 53 183 / .08);color:#d8b6e8}.tme-result-toolbox button.active{border-color:rgb(143 53 183 / .65);background:rgb(143 53 183 / .17);color:#e9c4f8}.tme-result-toolbox button:focus{outline:none}.tme-result-toolbox button:focus-visible{outline:2px solid rgb(143 53 183 / .48);outline-offset:1px}.tme-result-toolbox span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tme-result-toolbox em{margin-left:auto;color:#748099;font-size:8px;font-style:normal}.tme-result-toolbox button.active em{color:#d292f4}.tme-result-layer-settings{display:grid;gap:6px;margin-top:7px;border:1px solid rgb(255 255 255 / .07);border-radius:5px;background:#17181d;padding:7px}.tme-result-layer-settings label{display:grid;grid-template-columns:76px minmax(0,1fr) 34px;align-items:center;gap:6px;color:#8490a3;font-size:9px}.tme-result-layer-settings input{min-width:0;width:100%;accent-color:#9c36c7}.tme-result-layer-settings b{color:#b7c2d3;font-size:9px;font-weight:500;text-align:right}.feature-overview-meta{display:flex;align-items:center;justify-content:space-between;margin-top:9px;color:#6f7b8e;font-size:10px}.feature-overview-meta button{border-radius:4px;background:rgb(143 53 183 / .17);padding:4px 7px;color:#d292f4}.feature-overview-meta button:hover{background:rgb(143 53 183 / .28);color:#efc9ff}
.result-tabs.two-tabs{grid-template-columns:repeat(2,1fr)}.tme-result-toolbox .feature-analysis-button{grid-column:1/-1;justify-content:center}
.merged-annotation-card{margin-top:12px;overflow:hidden;border:1px solid rgb(255 255 255 / .08);border-radius:12px;background:#202126}.merged-annotation-card>header{display:flex;height:49px;align-items:center;justify-content:space-between;padding:0 12px}.merged-annotation-card h3{font-size:13px;font-weight:600}.annotation-group-heading>div{display:flex;align-items:center;gap:8px}.annotation-group-heading span{color:#748095;font-size:10px}.annotation-group-heading b{color:#d292f4;font-size:10px;font-weight:500}.annotation-switch{position:relative;width:40px;height:22px;flex:none;border-radius:999px;background:#444650;transition:background .16s}.annotation-switch i{position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#f8fafc;box-shadow:0 1px 3px rgb(0 0 0 / .45);transition:transform .16s}.annotation-switch.active{background:#9c36c7}.annotation-switch.active i{transform:translateX(18px)}.annotation-switch.small{width:38px;height:22px}.annotation-switch.small.active i{transform:translateX(16px)}.merged-opacity{display:grid;grid-template-columns:1fr auto;gap:7px;padding:0 12px 13px;color:#8490a3;font-size:10px}.merged-opacity b{color:#d292f4;font-weight:500}.merged-opacity input{grid-column:1/-1}.group-opacity{display:block;border-top:1px solid rgb(255 255 255 / .05);padding:0 12px 10px}.group-opacity span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.merged-opacity input,.group-opacity input,.label-opacity{width:100%;accent-color:#9c36c7}.merged-annotation-list{border-top:1px solid rgb(255 255 255 / .07);padding:4px 12px 8px}.annotation-class-row{padding:6px 0 4px}.annotation-class-row>div{display:grid;grid-template-columns:38px 8px minmax(0,1fr) 54px 62px;align-items:center;gap:7px}.annotation-color{width:7px;height:7px;border-radius:50%}.annotation-class-row span{min-width:0;overflow:hidden;color:#aeb8c8;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.annotation-class-row strong{color:#e2e8f0;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;font-weight:600;text-align:right}.label-opacity{min-width:0}.annotation-count-track{display:block;height:4px;margin-top:4px;overflow:hidden;border-radius:2px;background:#34363e}.annotation-count-track b{display:block;height:100%;border-radius:2px}.merged-annotation-card input[type=range]{height:14px;cursor:pointer}
@media (max-width:1500px){.workbench-shell{grid-template-columns:292px minmax(0,1fr) 350px}.viewer-toolbar-primary,.viewer-toolbar-secondary{padding-inline:8px}.tool-toggle{padding-inline:7px}.opacity-control{min-width:148px}.viewer-meta{display:none}}
</style>
