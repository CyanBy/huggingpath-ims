export const PATHOLOGY_ENTITY_DELETIONS_EVENT = 'pathologyEntityDeletionsChange';

const STORAGE_KEY = 'huggingpath.pathologyEntityDeletions.v1';

export type PathologyDeletionScope = 'wsi' | 'chain';

export type PathologyEntityDeletionState = {
  deletedWsiIds: string[];
  deletedCaseIds: string[];
  deletedProjectIds: string[];
};

export type ResearchProjectLink = {
  id: string;
  name: string;
};

export type WsiRelationship = {
  wsiId: string;
  caseId?: string;
  caseProjects: ResearchProjectLink[];
  directProjects: ResearchProjectLink[];
};

export type WsiDeletionImpact = {
  relationship: WsiRelationship;
  wsiIds: string[];
  caseIds: string[];
  projects: ResearchProjectLink[];
};

const PROJECTS: Record<string, ResearchProjectLink> = {
  'PRJ-2026-001': {
    id: 'PRJ-2026-001',
    name: '乳腺癌 HER2 队列研究',
  },
  'PRJ-2026-002': {
    id: 'PRJ-2026-002',
    name: '结直肠癌微环境多模态分析',
  },
  'PRJ-2026-003': {
    id: 'PRJ-2026-003',
    name: '肺腺癌核分裂指数研究',
  },
  'PRJ-2026-004': {
    id: 'PRJ-2026-004',
    name: '胃癌组织分类基线评测',
  },
};

const CASE_PROJECT_RELATIONSHIPS: Record<string, string[]> = {
  'S-20260517-1906': ['PRJ-2026-003'],
  'S-20260209-6099': [],
  'S-20260114-3036': ['PRJ-2026-002'],
  'S-20260402-9407': ['PRJ-2026-001'],
  'S-20251122-5123': ['PRJ-2026-004'],
};

const WSI_RELATIONSHIPS: Record<
  string,
  { caseId?: string; directProjectIds?: string[] }
> = {
  'wsi-001': { caseId: 'S-20260517-1906' },
  'wsi-002': { caseId: 'S-20260517-1906' },
  'wsi-003': { directProjectIds: ['PRJ-2026-001'] },
  'wsi-004': { caseId: 'S-20260209-6099' },
  'wsi-005': { caseId: 'S-20251122-5123' },
  'wsi-006': { caseId: 'S-20260114-3036' },
  'wsi-007': { caseId: 'S-20260402-9407' },
};

const EMPTY_STATE: PathologyEntityDeletionState = {
  deletedWsiIds: [],
  deletedCaseIds: [],
  deletedProjectIds: [],
};

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return unique(value.filter((item): item is string => typeof item === 'string'));
}

function resolveProjects(projectIds: string[] = []) {
  return projectIds
    .map((id) => PROJECTS[id])
    .filter((item): item is ResearchProjectLink => Boolean(item));
}

export function getResearchProjects() {
  const deletions = readPathologyEntityDeletions();
  return Object.values(PROJECTS).filter(
    (project) => !deletions.deletedProjectIds.includes(project.id),
  );
}

export function getCaseResearchProjects(caseId: string) {
  const deletions = readPathologyEntityDeletions();
  return resolveProjects(CASE_PROJECT_RELATIONSHIPS[caseId]).filter(
    (project) => !deletions.deletedProjectIds.includes(project.id),
  );
}

export function readPathologyEntityDeletions(): PathologyEntityDeletionState {
  if (typeof window === 'undefined') return EMPTY_STATE;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;

    const parsed = JSON.parse(raw) as Partial<PathologyEntityDeletionState>;
    return {
      deletedWsiIds: toStringArray(parsed.deletedWsiIds),
      deletedCaseIds: toStringArray(parsed.deletedCaseIds),
      deletedProjectIds: toStringArray(parsed.deletedProjectIds),
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function getWsiRelationship(wsiId: string): WsiRelationship {
  const relationship = WSI_RELATIONSHIPS[wsiId];

  return {
    wsiId,
    caseId: relationship?.caseId,
    caseProjects: resolveProjects(
      relationship?.caseId ? CASE_PROJECT_RELATIONSHIPS[relationship.caseId] : [],
    ),
    directProjects: resolveProjects(relationship?.directProjectIds),
  };
}

export function getWsiDeletionImpact(wsiId: string): WsiDeletionImpact {
  const deletions = readPathologyEntityDeletions();
  const relationship = getWsiRelationship(wsiId);
  const caseIds =
    relationship.caseId && !deletions.deletedCaseIds.includes(relationship.caseId)
      ? [relationship.caseId]
      : [];
  const linkedProjects = [...relationship.caseProjects, ...relationship.directProjects];
  const projectIds = linkedProjects.map((project) => project.id);
  const projects = linkedProjects.filter(
    (project) => !deletions.deletedProjectIds.includes(project.id),
  );

  const wsiIds = Object.keys(WSI_RELATIONSHIPS).filter((candidateWsiId) => {
    const candidate = getWsiRelationship(candidateWsiId);
    const sharesCase = Boolean(candidate.caseId && caseIds.includes(candidate.caseId));
    const candidateProjectIds = [...candidate.caseProjects, ...candidate.directProjects].map(
      (project) => project.id,
    );
    const sharesProject = candidateProjectIds.some((projectId) => projectIds.includes(projectId));
    return (
      !deletions.deletedWsiIds.includes(candidateWsiId) &&
      (candidateWsiId === wsiId || sharesCase || sharesProject)
    );
  });

  return {
    relationship,
    wsiIds: unique(wsiIds),
    caseIds,
    projects,
  };
}

export function hasWsiRelationship(wsiId: string) {
  const relationship = getWsiRelationship(wsiId);
  return Boolean(
    relationship.caseId ||
      relationship.caseProjects.length ||
      relationship.directProjects.length,
  );
}

export function deleteWsiWithScope(wsiId: string, scope: PathologyDeletionScope) {
  const current = readPathologyEntityDeletions();
  const impact = getWsiDeletionImpact(wsiId);
  const next: PathologyEntityDeletionState = {
    deletedWsiIds: unique([
      ...current.deletedWsiIds,
      ...(scope === 'chain' ? impact.wsiIds : [wsiId]),
    ]),
    deletedCaseIds: unique([
      ...current.deletedCaseIds,
      ...(scope === 'chain' ? impact.caseIds : []),
    ]),
    deletedProjectIds: unique([
      ...current.deletedProjectIds,
      ...(scope === 'chain' ? impact.projects.map((project) => project.id) : []),
    ]),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(PATHOLOGY_ENTITY_DELETIONS_EVENT, { detail: next }));
  return next;
}

export function subscribePathologyEntityDeletions(listener: () => void) {
  window.addEventListener(PATHOLOGY_ENTITY_DELETIONS_EVENT, listener);
  window.addEventListener('storage', listener);

  return () => {
    window.removeEventListener(PATHOLOGY_ENTITY_DELETIONS_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}
