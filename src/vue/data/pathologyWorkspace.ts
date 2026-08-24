import { readPathologyEntityDeletions } from '@/lib/pathologyEntityLinks'

export type WorkspaceWsi = {
  id: string
  fileName: string
  size: string
  site: string
  samplingMethod: string
  stain: string
  boundCase: string
  uploadedAt: string
  source?: 'file' | 'dicom-series'
  dicomPath?: string
  dicomInstanceCount?: number
}

export type WorkspaceCase = {
  id: string
  site: string
  samplingMethod: string
  ageGroup: string
  sex: '男' | '女' | '未知'
  status: '就绪' | '处理中' | '异常' | '待处理'
  remark: string
}

export type WorkspaceProject = {
  id: string
  name: string
  description: string
  tags: string[]
  caseIds: string[]
  standaloneWsiIds: string[]
  memberCount: number
  updatedAt: string
  visibility: 'private' | 'public'
}

const WSI_KEY = 'huggingpath.vue.wsis.v1'
const CASE_KEY = 'huggingpath.vue.cases.v1'
const PROJECT_KEY = 'huggingpath.vue.projects.v1'
export const WORKSPACE_CHANGE_EVENT = 'huggingpathWorkspaceChange'

export const seedWsis: WorkspaceWsi[] = [
  { id: 'wsi-001', fileName: 'S-20260517-1906_HE_001.svs', size: '1.4 GB', site: 'lung', samplingMethod: 'biopsy', stain: 'HE', boundCase: 'S-20260517-1906', uploadedAt: '2026-05-20' },
  { id: 'wsi-002', fileName: 'S-20260517-1906_IHC_HER2_001.sdpc', size: '856 MB', site: 'lung', samplingMethod: 'biopsy', stain: 'IHC', boundCase: 'S-20260517-1906', uploadedAt: '2026-05-20' },
  { id: 'wsi-003', fileName: 'Temporary_AI_Slide_001.svs', size: '1.1 GB', site: 'breast', samplingMethod: 'biopsy', stain: 'HE', boundCase: '未绑定', uploadedAt: '2026-05-19' },
  { id: 'wsi-004', fileName: 'kidney_pas_002.tiff', size: '620 MB', site: 'kidney', samplingMethod: 'surgical', stain: 'PAS', boundCase: 'S-20260209-6099', uploadedAt: '2026-05-18' },
  { id: 'wsi-005', fileName: 'gastric_HE_20260602_001.svs', size: '1.6 GB', site: 'stomach', samplingMethod: 'biopsy', stain: 'HE', boundCase: '未绑定', uploadedAt: '2026-06-02' },
  { id: 'wsi-006', fileName: 'cervix_HE_091.svs', size: '1.7 GB', site: 'cervix', samplingMethod: 'biopsy', stain: 'HE', boundCase: '未绑定', uploadedAt: '2026-06-12' },
  { id: 'wsi-007', fileName: 'breast_IHC_HER2_003.sdpc', size: '884 MB', site: 'breast', samplingMethod: 'biopsy', stain: 'IHC', boundCase: '未绑定', uploadedAt: '2026-06-16' },
]

export const seedCases: WorkspaceCase[] = [
  { id: 'S-20260517-1906', site: 'lung', samplingMethod: 'biopsy', ageGroup: '41-60', sex: '女', status: '就绪', remark: '肺腺癌研究样本' },
  { id: 'S-20260209-6099', site: 'kidney', samplingMethod: 'surgical', ageGroup: '19-40', sex: '男', status: '就绪', remark: '肾脏手术切除样本' },
  { id: 'S-20260114-3036', site: 'thyroid', samplingMethod: 'surgical', ageGroup: '41-60', sex: '男', status: '处理中', remark: '甲状腺样本' },
  { id: 'S-20260402-9407', site: 'breast', samplingMethod: 'biopsy', ageGroup: '41-60', sex: '女', status: '待处理', remark: 'HER2 队列' },
  { id: 'S-20251122-5123', site: 'stomach', samplingMethod: 'biopsy', ageGroup: '61+', sex: '男', status: '就绪', remark: '胃癌活检' },
]

export const seedProjects: WorkspaceProject[] = [
  { id: 'PRJ-2026-001', name: '乳腺癌 HER2 队列研究', description: '用于乳腺癌 HER2 表达评估、IHC 定量与分型分析。', tags: ['HER2', 'IHC'], caseIds: ['S-20260402-9407'], standaloneWsiIds: ['wsi-003'], memberCount: 4, updatedAt: '2026-05-05', visibility: 'public' },
  { id: 'PRJ-2026-002', name: '结直肠癌微环境多模态分析', description: '围绕肿瘤微环境进行细胞组成与空间特征分析。', tags: ['TME', '多模态'], caseIds: ['S-20260517-1906', 'S-20260114-3036'], standaloneWsiIds: [], memberCount: 3, updatedAt: '2026-05-10', visibility: 'private' },
  { id: 'PRJ-2026-003', name: '肺腺癌核分裂指数研究', description: '肺腺癌核分裂象识别、计数与高危区域筛选。', tags: ['Lung', 'CellViT'], caseIds: ['S-20260517-1906'], standaloneWsiIds: [], memberCount: 5, updatedAt: '2026-05-20', visibility: 'public' },
  { id: 'PRJ-2026-004', name: '胃癌组织分类基线评测', description: '用于胃癌组织区域分类与模型基线验证。', tags: ['Gastric', 'Benchmark'], caseIds: ['S-20251122-5123'], standaloneWsiIds: ['wsi-005'], memberCount: 2, updatedAt: '2026-04-23', visibility: 'public' },
]

function readValue<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return structuredClone(seed)
    const value = JSON.parse(raw)
    return Array.isArray(value) ? value : structuredClone(seed)
  } catch {
    return structuredClone(seed)
  }
}

function writeValue<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new Event(WORKSPACE_CHANGE_EVENT))
}

export function readWorkspaceWsis() {
  const deleted = readPathologyEntityDeletions().deletedWsiIds
  return readValue(WSI_KEY, seedWsis).filter((item) => !deleted.includes(item.id))
}

export function writeWorkspaceWsis(value: WorkspaceWsi[]) { writeValue(WSI_KEY, value) }

export function readWorkspaceCases() {
  const deleted = readPathologyEntityDeletions().deletedCaseIds
  return readValue(CASE_KEY, seedCases).filter((item) => !deleted.includes(item.id))
}

export function writeWorkspaceCases(value: WorkspaceCase[]) { writeValue(CASE_KEY, value) }

export function readWorkspaceProjects() {
  const deleted = readPathologyEntityDeletions().deletedProjectIds
  return readValue(PROJECT_KEY, seedProjects).filter((item) => !deleted.includes(item.id))
}

export function writeWorkspaceProjects(value: WorkspaceProject[]) { writeValue(PROJECT_KEY, value) }

export function subscribeWorkspace(listener: () => void) {
  window.addEventListener(WORKSPACE_CHANGE_EVENT, listener)
  window.addEventListener('pathologyEntityDeletionsChange', listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(WORKSPACE_CHANGE_EVENT, listener)
    window.removeEventListener('pathologyEntityDeletionsChange', listener)
    window.removeEventListener('storage', listener)
  }
}
