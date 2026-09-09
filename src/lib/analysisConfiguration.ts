export type AnalysisConfigurationItem = {
  id: string
  name: string
  organ: string
  stain: string
  size: string
  caseId?: string
  caseName?: string
  projectId?: string
  projectName?: string
}

export type AnalysisModelAssignments = Record<string, string[]>
