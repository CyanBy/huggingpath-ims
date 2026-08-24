export type AnalysisTargetType = 'wsi' | 'case' | 'project'
export type WsiSourceType = 'existing' | 'upload'

export interface SelectedModelInfo {
  id: string
  name: string
  desc?: string
}

export interface WsiSelectionItem {
  id: string
  name: string
  organ: string
  stain: string
  size: string
  caseId?: string
  uploadedAt: string
}

export interface UploadWsiRow {
  id: string
  name: string
  organ: string
  stain: string
  size: string
  caseId?: string
}

export interface CaseWsiSelectionItem {
  id: string
  name: string
  organ: string
  stain: string
  magnification: string
  size: string
}

export interface CaseSelectionItem {
  id: string
  name: string
  organ: string
  wsiCount: number
  createdAt: string
  wsis?: CaseWsiSelectionItem[]
  selectedWsiIds?: string[]
}

export interface ProjectSelectionItem {
  id: string
  name: string
  caseCount: number
  wsiCount: number
  memberCount: number
  cases?: CaseSelectionItem[]
  standaloneWsis?: CaseWsiSelectionItem[]
  selectedWsiIds?: string[]
}

export interface AnalysisTaskSelection {
  targetType: AnalysisTargetType
  wsiSource: WsiSourceType
  selectedWsiItems: WsiSelectionItem[]
  uploadRows: UploadWsiRow[]
  selectedCaseItems: CaseSelectionItem[]
  selectedProjectItems: ProjectSelectionItem[]
  modelId?: string
  modelName?: string
}
