import type {
  AnalysisTaskSelection,
  CaseSelectionItem,
  ProjectSelectionItem,
  UploadWsiRow,
  WsiSelectionItem,
} from './analysisSelection';
import { MODEL_CATALOG } from './modelCatalog';

export type AnalysisTaskSourceType = 'model_center' | 'wsi' | 'case' | 'project';
export type AnalysisTaskSourceLabel = '模型中心' | 'WSI 管理' | 'Case 管理' | '研究项目管理';
export type AnalysisObjectType = 'WSI' | 'Case' | '研究项目';
export type AnalysisTaskStatus = '待分析' | '排队中' | '正在分析' | '分析完成' | '失败' | '已停止';

export interface AnalysisModelDefinition {
  id: string;
  name: string;
  desc: string;
  stains: string[];
}

export const AVAILABLE_ANALYSIS_MODELS: AnalysisModelDefinition[] = MODEL_CATALOG.map((model) => ({
  id: model.id,
  name: model.name,
  desc: model.analysisDescription,
  stains: model.supportedStains,
}));

const AVAILABLE_ANALYSIS_MODEL_IDS = new Set(AVAILABLE_ANALYSIS_MODELS.map((model) => model.id));
const LEGACY_PENDING_MODEL_IDS: Record<string, string> = {
  'mod-cellvit': 'ai4path/cellvit-v2',
};

export interface AnalysisTaskObjectRecord {
  id: string;
  name: string;
  meta: string;
  status: AnalysisTaskStatus;
  caseId?: string;
  caseName?: string;
  projectId?: string;
  projectName?: string;
  stain?: string;
  organ?: string;
  size?: string;
  modelIds: string[];
}

/**
 * 一条记录代表一次真正的 WSI × Model 模型运行。
 * 同一个模型应用到 3 张 WSI 时，会生成 3 条独立运行记录。
 */
export interface AnalysisModelRunRecord {
  id: string;
  modelId: string;
  objectId: string;
  objectName: string;
  name: string;
  desc: string;
  status: AnalysisTaskStatus;
  progress?: number;
  error?: string;
}

export interface AnalysisTaskRecord {
  id: string;
  taskNumber: string;
  taskName: string;
  sourceType: AnalysisTaskSourceType;
  sourceLabel: AnalysisTaskSourceLabel;
  objectType: AnalysisObjectType;
  objectCount: string;
  status: AnalysisTaskStatus;
  createdAt: string;
  modelLocked: boolean;
  caseCount?: number;
  projectCount?: number;
  models: AnalysisModelRunRecord[];
  objects: AnalysisTaskObjectRecord[];
}

export interface ProjectTaskCaseInput {
  id: string;
  sampleId: string;
  site?: string;
  wsiCount: number;
}

export interface ProjectTaskWsiInput {
  id: string;
  name: string;
  caseId?: string;
  stain?: string;
  size?: string;
  site?: string;
}

const STORAGE_KEY = 'huggingpath.analysisTasks.v1';
const PROGRESS_STEP = 7;
const STAIN_SEQUENCE = ['H&E', 'Ki-67', 'HER2', 'PAS'];
const SIZE_SEQUENCE = ['1.24 GB', '982 MB', '1.05 GB', '756 MB'];

function newId(prefix = 'task') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowText() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildTaskNumber(taskId: string, createdAt: string) {
  const timestamp = createdAt.replace(/\D/g, '').slice(0, 12).padEnd(12, '0');
  const suffix = taskId.replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase().padStart(4, '0');
  return `AT-${timestamp.slice(0, 8)}-${timestamp.slice(8)}-${suffix}`;
}

function dispatchTaskChange() {
  window.dispatchEvent(new Event('analysisTasksChange'));
}

function normalizeStain(value?: string) {
  const text = (value || '').trim();
  if (!text) return 'H&E';
  if (/^HE$/i.test(text)) return 'H&E';
  if (/ki\s*-?\s*67/i.test(text)) return 'Ki-67';
  return text;
}

function inferObjectFields(meta: string, index: number) {
  const parts = meta.split('·').map((item) => item.trim()).filter(Boolean);
  const recognized = parts.find((item) => ['HE', 'H&E', 'Ki67', 'Ki-67', 'HER2', 'PAS', 'IHC'].includes(item));
  return {
    organ: parts[0] || '未知部位',
    stain: normalizeStain(recognized || STAIN_SEQUENCE[index % STAIN_SEQUENCE.length]),
    size: parts.find((item) => /(?:GB|MB)$/i.test(item)) || SIZE_SEQUENCE[index % SIZE_SEQUENCE.length],
  };
}

export function getModelDefinition(modelId: string, fallback?: Partial<AnalysisModelDefinition>): AnalysisModelDefinition {
  return AVAILABLE_ANALYSIS_MODELS.find((item) => item.id === modelId) || {
    id: modelId,
    name: fallback?.name || modelId,
    desc: fallback?.desc || 'AI 分析模型',
    stains: fallback?.stains || ['H&E', 'HE', 'Ki-67', 'Ki67', 'HER2', 'PAS', 'IHC'],
  };
}

export function isModelCompatible(model: AnalysisModelDefinition, stain?: string) {
  if (!stain) return true;
  const normalized = normalizeStain(stain);
  return model.stains.some((item) => normalizeStain(item) === normalized || item === 'IHC' && ['Ki-67', 'HER2', 'IHC'].includes(normalized));
}

function buildRunId(objectId: string, modelId: string) {
  return `${objectId}::${modelId}`;
}

function buildRun(
  object: AnalysisTaskObjectRecord,
  modelId: string,
  previous?: Partial<AnalysisModelRunRecord>,
): AnalysisModelRunRecord {
  const definition = getModelDefinition(modelId, {
    name: previous?.name,
    desc: previous?.desc,
  });

  return {
    id: previous?.id || buildRunId(object.id, modelId),
    modelId,
    objectId: object.id,
    objectName: object.name,
    name: definition.name,
    desc: previous?.desc || definition.desc,
    status: previous?.status || '待分析',
    progress: previous?.progress,
    error: previous?.error,
  };
}

function rebuildRuns(objects: AnalysisTaskObjectRecord[], previousRuns: AnalysisModelRunRecord[] = []) {
  const previousMap = new Map<string, AnalysisModelRunRecord>();
  previousRuns.forEach((run) => previousMap.set(buildRunId(run.objectId, run.modelId), run));

  return objects.flatMap((object) =>
    object.modelIds.map((modelId) => buildRun(object, modelId, previousMap.get(buildRunId(object.id, modelId)))),
  );
}

function deriveObjectStatus(object: AnalysisTaskObjectRecord, runs: AnalysisModelRunRecord[], _taskStatus: AnalysisTaskStatus): AnalysisTaskStatus {
  const objectRuns = runs.filter((run) => run.objectId === object.id);
  // WSI 状态只由该 WSI 自己的模型运行决定，不能因为父任务被停止而把其他 WSI 一起标成“已停止”。
  if (!objectRuns.length) return object.status === '已停止' ? '已停止' : '待分析';
  if (objectRuns.some((run) => run.status === '正在分析')) return '正在分析';
  if (objectRuns.every((run) => run.status === '分析完成')) return '分析完成';

  const allTerminal = objectRuns.every((run) => ['分析完成', '失败', '已停止'].includes(run.status));
  if (allTerminal && objectRuns.some((run) => run.status === '失败')) return '失败';
  if (allTerminal && objectRuns.some((run) => run.status === '已停止')) return '已停止';

  if (objectRuns.some((run) => run.status === '排队中')) return '排队中';
  return '待分析';
}

function syncObjectStatuses(task: AnalysisTaskRecord, models = task.models, taskStatus = task.status) {
  return task.objects.map((object) => ({
    ...object,
    status: deriveObjectStatus(object, models, taskStatus),
  }));
}


function uniqueLabels(values: Array<string | undefined>) {
  return [...new Set(values.map((item) => item?.trim()).filter((item): item is string => Boolean(item)))];
}

type TaskDisplayContext = {
  objectType?: AnalysisObjectType;
  caseCount?: number;
  projectCount?: number;
};

export function buildTaskDisplayName(objects: AnalysisTaskObjectRecord[], context: TaskDisplayContext = {}) {
  if (!objects.length) return '未命名任务';
  if (objects.length === 1) return objects[0].name;

  const caseIds = uniqueLabels(objects.map((item) => item.caseId));
  const projectNames = uniqueLabels(objects.map((item) => item.projectName || item.projectId));

  if (context.objectType === '研究项目') {
    const projectCount = context.projectCount || projectNames.length;
    if (projectCount === 1 && projectNames[0]) return projectNames[0];
    if (projectCount > 1) return projectNames[0] ? `${projectNames[0]} 等 ${projectCount} 个项目` : `${projectCount} 个研究项目`;
    return '研究项目分析';
  }

  if (context.objectType === 'Case') {
    const caseCount = context.caseCount || caseIds.length;
    if (caseCount === 1 && caseIds[0]) return caseIds[0];
    if (caseCount > 1) return caseIds[0] ? `${caseIds[0]} 等 ${caseCount} 个 Case` : `${caseCount} 个 Case`;
    return 'Case 分析';
  }

  return `${objects[0].name} 等 ${objects.length} 张 WSI`;
}

export function getTaskDisplayName(task: Pick<AnalysisTaskRecord, 'id' | 'createdAt'> & Partial<Pick<AnalysisTaskRecord, 'taskNumber'>>) {
  return task.taskNumber || buildTaskNumber(task.id, task.createdAt);
}

export function getTaskDisplaySubtitle(task: Pick<AnalysisTaskRecord, 'objects' | 'objectType' | 'caseCount' | 'projectCount'>) {
  if (task.objectType === '研究项目') return '研究项目分析';
  if (task.objectType === 'Case') return (task.caseCount || 0) > 1 ? '批量 Case 分析' : 'Case 分析';
  return task.objects.length === 1 ? '单张 WSI 分析' : '批量 WSI 分析';
}

export type TaskObjectSummary = {
  primary: string;
  secondary?: string;
};

export function getTaskObjectSummary(task: Pick<AnalysisTaskRecord, 'objects' | 'objectType' | 'caseCount' | 'projectCount'>): TaskObjectSummary {
  const wsiCount = task.objects.length;
  const caseCount = task.caseCount ?? uniqueLabels(task.objects.map((item) => item.caseId)).length;
  const projectCount = task.projectCount ?? uniqueLabels(task.objects.map((item) => item.projectId)).length;

  if (task.objectType === '研究项目') {
    const parents = [projectCount ? `${projectCount} 个项目` : '', caseCount ? `${caseCount} 个 Case` : ''].filter(Boolean);
    return { primary: `${wsiCount} 张 WSI`, secondary: parents.length ? `来自 ${parents.join(' · ')}` : undefined };
  }
  if (task.objectType === 'Case') {
    return { primary: `${wsiCount} 张 WSI`, secondary: caseCount ? `来自 ${caseCount} 个 Case` : undefined };
  }
  return { primary: `${wsiCount} 张 WSI` };
}

export type TaskCaseSlideGroup = {
  caseLabel: string;
  slideCount: number;
  slides: string[];
};

export type TaskNameDetails = {
  scopeType: AnalysisObjectType;
  slideCount: number;
  caseCount: number;
  unboundSlideCount: number;
  caseGroups: TaskCaseSlideGroup[];
  projects: string[];
  slides: string[];
};

export function getTaskNameDetails(task: Pick<AnalysisTaskRecord, 'objects' | 'objectType'>): TaskNameDetails | null {
  const objects = task.objects || [];
  if (objects.length <= 1) return null;

  if (task.objectType === 'WSI') {
    return {
      scopeType: 'WSI',
      slideCount: objects.length,
      caseCount: 0,
      unboundSlideCount: 0,
      caseGroups: [],
      projects: [],
      slides: uniqueLabels(objects.map((item) => item.name)),
    };
  }

  const groups = new Map<string, { slideCount: number; slides: string[] }>();
  objects.forEach((object) => {
    const caseLabel = object.caseId?.trim() || object.caseName?.trim() || '未绑定 Case';
    const group = groups.get(caseLabel) || { slideCount: 0, slides: [] };
    group.slideCount += 1;
    if (object.name && !group.slides.includes(object.name)) group.slides.push(object.name);
    groups.set(caseLabel, group);
  });

  const caseGroups = [...groups.entries()].map(([caseLabel, group]) => ({ caseLabel, ...group }));
  const unboundSlideCount = groups.get('未绑定 Case')?.slideCount || 0;
  return {
    scopeType: task.objectType,
    slideCount: objects.length,
    caseCount: caseGroups.filter((group) => group.caseLabel !== '未绑定 Case').length,
    unboundSlideCount,
    caseGroups,
    projects: uniqueLabels(objects.map((item) => item.projectName || item.projectId)),
    slides: [],
  };
}

function objectCountText(objectCount: number) {
  return `${objectCount} 张 WSI`;
}

function normalizeConfiguredModelIds(modelIds: string[], status: AnalysisTaskStatus) {
  const uniqueIds = [...new Set(modelIds.filter(Boolean))];
  if (status !== '待分析') return uniqueIds;

  return [...new Set(uniqueIds.map((modelId) => LEGACY_PENDING_MODEL_IDS[modelId] || modelId))]
    .filter((modelId) => AVAILABLE_ANALYSIS_MODEL_IDS.has(modelId));
}

function normalizeTask(raw: unknown): AnalysisTaskRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const task = raw as Partial<AnalysisTaskRecord> & {
    models?: Array<Partial<AnalysisModelRunRecord> & { id?: string }>;
    objects?: Array<Partial<AnalysisTaskObjectRecord>>;
  };

  const sourceType = task.sourceType || 'wsi';
  const status = task.status || '待分析';
  const oldModels = Array.isArray(task.models) ? task.models : [];
  const legacyModelIds = [...new Set(oldModels.map((model) => model.modelId || model.id).filter(Boolean) as string[])];

  const objects: AnalysisTaskObjectRecord[] = (Array.isArray(task.objects) ? task.objects : []).map((object, index) => {
    const inferred = inferObjectFields(object.meta || '', index);
    const storedModelIds = Array.isArray(object.modelIds)
      ? object.modelIds.filter(Boolean)
      : legacyModelIds;
    const modelIds = normalizeConfiguredModelIds(storedModelIds, status);

    const legacyProjectId = task.objectType === '研究项目'
      ? object.caseId?.match(/^(project-[^-]+)-case-/)?.[1]
        || object.id?.match(/^(project-[^-]+)-(?:case|wsi)-/)?.[1]
      : undefined;
    const legacyProjectName = task.objectType === '研究项目' && object.caseName?.includes(' / Case ')
      ? object.caseName.split(' / Case ')[0]
      : undefined;

    return {
      id: object.id || newId('obj'),
      name: object.name || `WSI_${index + 1}.svs`,
      meta: object.meta || `${inferred.organ} · ${inferred.stain} · ${inferred.size}`,
      status: object.status || '待分析',
      caseId: object.caseId || (sourceType === 'case' ? task.id : undefined),
      caseName: object.caseName || (sourceType === 'case' ? task.taskName?.replace(/\s*病例分析$/, '') : undefined),
      projectId: object.projectId || legacyProjectId,
      projectName: object.projectName || legacyProjectName,
      stain: normalizeStain(object.stain || inferred.stain),
      organ: object.organ || inferred.organ,
      size: object.size || inferred.size,
      modelIds,
    };
  });

  const oldRunMap = new Map<string, AnalysisModelRunRecord>();
  oldModels.forEach((model, index) => {
    const storedModelId = model.modelId || model.id;
    if (!storedModelId) return;
    const modelId = status === '待分析' ? LEGACY_PENDING_MODEL_IDS[storedModelId] || storedModelId : storedModelId;
    const objectId = model.objectId || objects[Math.min(index, Math.max(objects.length - 1, 0))]?.id || objects[0]?.id;
    if (!objectId) return;
    const object = objects.find((item) => item.id === objectId) || objects[0];
    if (!object) return;

    oldRunMap.set(buildRunId(object.id, modelId), {
      id: model.id || buildRunId(object.id, modelId),
      modelId,
      objectId: object.id,
      objectName: model.objectName || object.name,
      name: model.name || getModelDefinition(modelId).name,
      desc: model.desc || getModelDefinition(modelId).desc,
      status: model.status || '待分析',
      progress: model.progress,
      error: model.error,
    });
  });

  let models = rebuildRuns(objects, [...oldRunMap.values()]);

  if (status === '正在分析' && models.length && !models.some((model) => model.status === '正在分析')) {
    models = models.map((model, index) => ({
      ...model,
      status: index === 0 ? '正在分析' : model.status === '分析完成' ? '分析完成' : '排队中',
      progress: index === 0 ? model.progress || 1 : model.progress,
    }));
  }

  const resolvedObjectType = task.objectType || (sourceType === 'case' ? 'Case' : sourceType === 'project' ? '研究项目' : 'WSI');
  const resolvedCaseCount = resolvedObjectType === 'WSI'
    ? undefined
    : task.caseCount ?? new Set(objects.map((object) => object.caseId).filter(Boolean)).size;
  const resolvedProjectCount = task.projectCount ?? new Set(objects.map((object) => object.projectId).filter(Boolean)).size;

  const id = task.id || newId('task');
  const createdAt = task.createdAt || nowText();
  const normalized: AnalysisTaskRecord = {
    id,
    taskNumber: task.taskNumber || buildTaskNumber(id, createdAt),
    taskName: task.taskName || '未命名分析任务',
    sourceType,
    sourceLabel: task.sourceLabel || (sourceType === 'case' ? 'Case 管理' : sourceType === 'project' ? '研究项目管理' : sourceType === 'model_center' ? '模型中心' : 'WSI 管理'),
    objectType: resolvedObjectType,
    objectCount: objectCountText(objects.length),
    status,
    createdAt,
    modelLocked: Boolean(task.modelLocked),
    caseCount: resolvedCaseCount,
    projectCount: resolvedProjectCount || task.projectCount,
    models,
    objects,
  };

  normalized.objects = syncObjectStatuses(normalized, models, status);
  return normalized;
}

function safeParseTasks(raw: string | null): AnalysisTaskRecord[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeTask)
      .filter((item): item is AnalysisTaskRecord => Boolean(item && item.objects.length));
  } catch {
    return [];
  }
}

export function readAnalysisTasks(): AnalysisTaskRecord[] {
  if (typeof window === 'undefined') return [];
  return safeParseTasks(window.localStorage.getItem(STORAGE_KEY));
}

export function countCaseAnalysisTasks(
  caseId: string,
  tasks: AnalysisTaskRecord[] = readAnalysisTasks(),
) {
  const normalizedCaseId = caseId.trim();
  if (!normalizedCaseId) return 0;

  return tasks.filter((task) =>
    task.objects.some((object) => object.caseId === normalizedCaseId),
  ).length;
}

export function countWsiSuccessfulAnalyses(
  wsiId: string,
  tasks: AnalysisTaskRecord[] = readAnalysisTasks(),
) {
  const normalizedWsiId = wsiId.trim();
  if (!normalizedWsiId) return 0;

  return tasks.reduce(
    (count, task) => count + task.models.filter(
      (run) => run.objectId === normalizedWsiId && run.status === '分析完成',
    ).length,
    0,
  );
}

export function writeAnalysisTasks(tasks: AnalysisTaskRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  dispatchTaskChange();
}

export function saveAnalysisTask(task: AnalysisTaskRecord) {
  const normalized = normalizeTask(task) || task;
  const tasks = readAnalysisTasks();
  const existingIndex = tasks.findIndex((item) => item.id === normalized.id);

  if (existingIndex >= 0) {
    tasks[existingIndex] = normalized;
    writeAnalysisTasks(tasks);
    return normalized;
  }

  writeAnalysisTasks([normalized, ...tasks]);
  return normalized;
}

export function getAnalysisTask(taskId?: string | null) {
  if (!taskId) return null;
  return readAnalysisTasks().find((item) => item.id === taskId) || null;
}

export function deleteAnalysisTask(taskId: string) {
  writeAnalysisTasks(readAnalysisTasks().filter((item) => item.id !== taskId));
}

export function updateAnalysisTask(taskId: string, updater: (task: AnalysisTaskRecord) => AnalysisTaskRecord) {
  const tasks = readAnalysisTasks();
  const next = tasks.map((task) => {
    if (task.id !== taskId) return task;
    return normalizeTask(updater(task)) || updater(task);
  });
  writeAnalysisTasks(next);
  return next.find((task) => task.id === taskId) || null;
}

export function getObjectRuns(task: AnalysisTaskRecord, objectId?: string) {
  if (!objectId) return [];
  return task.models.filter((run) => run.objectId === objectId);
}

export function getUniqueTaskModels(task: AnalysisTaskRecord) {
  const map = new Map<string, AnalysisModelDefinition>();
  task.models.forEach((run) => {
    if (!map.has(run.modelId)) map.set(run.modelId, getModelDefinition(run.modelId, run));
  });
  return [...map.values()];
}

function canConfigureTaskModels(task: AnalysisTaskRecord, object?: AnalysisTaskObjectRecord) {
  if (!task.modelLocked) return true;
  // 模型中心发起时只锁定首次运行。单张 WSI 停止/完成/失败后允许重新选择模型，再从 0 发起新的运行。
  return Boolean(object && ['已停止', '分析完成', '失败'].includes(object.status));
}

function canRemoveRun(run?: AnalysisModelRunRecord, allowTerminalReset = false) {
  if (!run) return true;
  if (['待分析', '排队中'].includes(run.status)) return true;
  return allowTerminalReset && ['已停止', '分析完成', '失败'].includes(run.status);
}

function statusForNewRun(task: AnalysisTaskRecord, object?: AnalysisTaskObjectRecord): AnalysisTaskStatus {
  if (object && ['已停止', '分析完成', '失败'].includes(object.status)) return '已停止';
  return task.status === '待分析' ? '待分析' : '排队中';
}

function rebuildRunsAfterModelChange(task: AnalysisTaskRecord, objects: AnalysisTaskObjectRecord[]) {
  const previousKeys = new Set(task.models.map((run) => buildRunId(run.objectId, run.modelId)));
  return rebuildRuns(objects, task.models).map((run) => {
    const existed = previousKeys.has(buildRunId(run.objectId, run.modelId));
    if (existed) return run;

    const object = objects.find((item) => item.id === run.objectId);
    const status = statusForNewRun(task, object);
    return {
      ...run,
      status,
      progress: undefined,
      error: undefined,
      desc: status === '已停止'
        ? '待重新分析'
        : task.status === '待分析'
          ? getModelDefinition(run.modelId, run).desc
          : '等待当前任务内前序模型运行完成',
    };
  });
}



export function setObjectModelIds(taskId: string, objectId: string, modelIds: string[]) {
  return updateAnalysisTask(taskId, (task) => {
    const target = task.objects.find((object) => object.id === objectId);
    if (!target || !canConfigureTaskModels(task, target)) return task;

    const compatibleModelIds = [...new Set(modelIds)].filter((modelId) => isModelCompatible(getModelDefinition(modelId), target.stain));
    const protectedModelIds = target.modelIds.filter((modelId) => {
      if (compatibleModelIds.includes(modelId)) return false;
      const existingRun = task.models.find((run) => run.objectId === objectId && run.modelId === modelId);
      return !canRemoveRun(existingRun, ['已停止', '分析完成', '失败'].includes(target.status));
    });
    const nextModelIds = [...new Set([...compatibleModelIds, ...protectedModelIds])];

    const objects = task.objects.map((object) => object.id === objectId ? {
      ...object,
      modelIds: nextModelIds,
    } : object);

    const models = rebuildRunsAfterModelChange(task, objects);
    const next = { ...task, objects, models };
    return { ...next, objects: syncObjectStatuses(next, models, next.status) };
  });
}

export function setCaseModelIds(taskId: string, caseId: string, modelIds: string[]) {
  return updateAnalysisTask(taskId, (task) => {
    if (!['project', 'case'].includes(task.sourceType) || !canConfigureTaskModels(task)) return task;

    const normalizedModelIds = [...new Set(modelIds)];
    const objects = task.objects.map((object) => {
      if (object.caseId !== caseId) return object;

      const compatibleModelIds = normalizedModelIds.filter((modelId) => isModelCompatible(getModelDefinition(modelId), object.stain));
      const protectedModelIds = object.modelIds.filter((modelId) => {
        if (compatibleModelIds.includes(modelId)) return false;
        const existingRun = task.models.find((run) => run.objectId === object.id && run.modelId === modelId);
        return !canRemoveRun(existingRun, ['已停止', '分析完成', '失败'].includes(object.status));
      });

      return {
        ...object,
        modelIds: [...new Set([...compatibleModelIds, ...protectedModelIds])],
      };
    });

    const models = rebuildRunsAfterModelChange(task, objects);
    const next = { ...task, objects, models };
    return { ...next, objects: syncObjectStatuses(next, models, next.status) };
  });
}
export function setObjectModelSelection(taskId: string, objectId: string, modelId: string) {
  return updateAnalysisTask(taskId, (task) => {
    const target = task.objects.find((object) => object.id === objectId);
    const definition = getModelDefinition(modelId);
    if (!target || !canConfigureTaskModels(task, target) || !isModelCompatible(definition, target.stain)) return task;

    const selected = target.modelIds.includes(modelId);
    const existingRun = task.models.find((run) => run.objectId === objectId && run.modelId === modelId);
    if (selected && !canRemoveRun(existingRun, ['已停止', '分析完成', '失败'].includes(target.status))) return task;

    const objects = task.objects.map((object) => {
      if (object.id !== objectId) return object;
      return {
        ...object,
        modelIds: selected ? object.modelIds.filter((id) => id !== modelId) : [...object.modelIds, modelId],
      };
    });

    const models = rebuildRunsAfterModelChange(task, objects);
    const next = { ...task, objects, models };
    return { ...next, objects: syncObjectStatuses(next, models, next.status) };
  });
}

export function setCaseModelSelection(taskId: string, caseId: string, modelId: string) {
  return updateAnalysisTask(taskId, (task) => {
    if (!['project', 'case'].includes(task.sourceType) || !canConfigureTaskModels(task)) return task;

    const definition = getModelDefinition(modelId);
    const compatibleObjects = task.objects.filter((object) => object.caseId === caseId && isModelCompatible(definition, object.stain));
    if (!compatibleObjects.length) return task;

    const allSelected = compatibleObjects.every((object) => object.modelIds.includes(modelId));
    const objectIdSet = new Set(compatibleObjects.map((object) => object.id));

    const objects = task.objects.map((object) => {
      if (!objectIdSet.has(object.id)) return object;

      if (allSelected) {
        const existingRun = task.models.find((run) => run.objectId === object.id && run.modelId === modelId);
        if (!canRemoveRun(existingRun, ['已停止', '分析完成', '失败'].includes(object.status))) return object;
        return { ...object, modelIds: object.modelIds.filter((id) => id !== modelId) };
      }

      return { ...object, modelIds: [...new Set([...object.modelIds, modelId])] };
    });

    const models = rebuildRunsAfterModelChange(task, objects);
    const next = { ...task, objects, models };
    return { ...next, objects: syncObjectStatuses(next, models, next.status) };
  });
}

function hasRunningTask(tasks: AnalysisTaskRecord[], exceptTaskId?: string) {
  return tasks.some((task) => task.id !== exceptTaskId && task.status === '正在分析');
}

function isRunnableRun(run: AnalysisModelRunRecord) {
  return run.status === '待分析' || run.status === '排队中';
}

function deriveTerminalTaskStatus(task: AnalysisTaskRecord): AnalysisTaskStatus {
  if (!task.objects.length) return '已停止';
  if (!task.models.length) return task.status === '待分析' ? '待分析' : '已停止';
  if (task.models.every((run) => run.status === '分析完成')) return '分析完成';

  const allTerminal = task.models.every((run) => ['分析完成', '失败', '已停止'].includes(run.status));
  if (allTerminal && task.models.some((run) => run.status === '失败')) return '失败';
  if (allTerminal && task.models.some((run) => run.status === '已停止')) return '已停止';
  return task.status;
}

function markTaskAsRunning(task: AnalysisTaskRecord): AnalysisTaskRecord {
  const nextRunIndex = task.models.findIndex(isRunnableRun);
  if (nextRunIndex < 0) {
    const status = deriveTerminalTaskStatus(task);
    const next = { ...task, status };
    return { ...next, objects: syncObjectStatuses(next, task.models, status) };
  }

  const models = task.models.map((run, index) => {
    if (['分析完成', '失败', '已停止'].includes(run.status)) return run;
    if (index === nextRunIndex) {
      return {
        ...run,
        status: '正在分析' as AnalysisTaskStatus,
        progress: typeof run.progress === 'number' ? Math.max(run.progress, 1) : 1,
        error: undefined,
        desc: '分析中',
      };
    }
    return {
      ...run,
      status: '排队中' as AnalysisTaskStatus,
      progress: undefined,
      error: undefined,
      desc: '等待前序模型运行完成',
    };
  });

  const next = { ...task, status: '正在分析' as AnalysisTaskStatus, models };
  return { ...next, objects: syncObjectStatuses(next, models, '正在分析') };
}

function markTaskAsQueued(task: AnalysisTaskRecord): AnalysisTaskRecord {
  const models = task.models.map((run) => {
    if (['分析完成', '失败', '已停止'].includes(run.status)) return run;
    return {
      ...run,
      status: '排队中' as AnalysisTaskStatus,
      progress: undefined,
      error: undefined,
      desc: '等待前序任务完成',
    };
  });

  const hasRunnable = models.some(isRunnableRun);
  const status = hasRunnable ? '排队中' : deriveTerminalTaskStatus({ ...task, models });
  const next = { ...task, status, models };
  return { ...next, objects: syncObjectStatuses(next, models, status) };
}

function startNextQueuedTask(tasks: AnalysisTaskRecord[]): AnalysisTaskRecord[] {
  if (hasRunningTask(tasks)) return tasks;
  const nextIndex = tasks.findIndex(
    (task) => task.status === '排队中' && task.models.some(isRunnableRun),
  );
  if (nextIndex < 0) return tasks;
  return tasks.map((task, index) => index === nextIndex ? markTaskAsRunning(task) : task);
}

export function startAnalysisTask(taskId: string) {
  const tasks = readAnalysisTasks();
  const target = tasks.find((task) => task.id === taskId);
  if (!target || target.models.length === 0 || target.status !== '待分析') return target || null;

  const next = tasks.map((task) => {
    if (task.id !== taskId) return task;
    return hasRunningTask(tasks, taskId) ? markTaskAsQueued(task) : markTaskAsRunning(task);
  });

  writeAnalysisTasks(next);
  return next.find((task) => task.id === taskId) || null;
}

export function tickAnalysisTasks(step = PROGRESS_STEP) {
  const tasks = readAnalysisTasks();
  if (!tasks.length) return [];

  let next = [...tasks];
  const runningIndex = next.findIndex((task) => task.status === '正在分析');

  if (runningIndex < 0) {
    const started = startNextQueuedTask(next);
    if (JSON.stringify(started) !== JSON.stringify(next)) writeAnalysisTasks(started);
    return started;
  }

  const runningTask = next[runningIndex];
  let models = [...runningTask.models];
  const runningRunIndex = models.findIndex((run) => run.status === '正在分析');

  if (runningRunIndex < 0) {
    next[runningIndex] = markTaskAsRunning(runningTask);
    next = startNextQueuedTask(next);
    writeAnalysisTasks(next);
    return next;
  }

  const currentRun = models[runningRunIndex];
  const progress = Math.min(100, (typeof currentRun.progress === 'number' ? currentRun.progress : 1) + step);
  models[runningRunIndex] = {
    ...currentRun,
    progress,
    status: progress >= 100 ? '分析完成' : '正在分析',
    desc: progress >= 100 ? '分析完成' : '分析中',
  };

  if (progress >= 100) {
    const nextRunIndex = models.findIndex(isRunnableRun);
    if (nextRunIndex >= 0) {
      models = models.map((run, index) => {
        if (run.status === '分析完成') return run;
        if (index === nextRunIndex) return { ...run, status: '正在分析' as AnalysisTaskStatus, progress: 1, error: undefined, desc: '分析中' };
        return { ...run, status: '排队中' as AnalysisTaskStatus, progress: undefined, error: undefined, desc: '等待前序模型运行完成' };
      });
      const updated = { ...runningTask, status: '正在分析' as AnalysisTaskStatus, models };
      next[runningIndex] = { ...updated, objects: syncObjectStatuses(updated, models, '正在分析') };
    } else {
      const terminalTask = { ...runningTask, models };
      const status = deriveTerminalTaskStatus(terminalTask);
      const updated = { ...terminalTask, status };
      next[runningIndex] = { ...updated, objects: syncObjectStatuses(updated, models, status) };
      next = startNextQueuedTask(next);
    }
  } else {
    const updated = { ...runningTask, status: '正在分析' as AnalysisTaskStatus, models };
    next[runningIndex] = { ...updated, objects: syncObjectStatuses(updated, models, '正在分析') };
  }

  writeAnalysisTasks(next);
  return next;
}

function objectFromData(args: {
  id: string;
  name: string;
  organ?: string;
  stain?: string;
  size?: string;
  caseId?: string;
  caseName?: string;
  projectId?: string;
  projectName?: string;
  modelIds?: string[];
}): AnalysisTaskObjectRecord {
  const stain = normalizeStain(args.stain);
  const organ = args.organ || '未知部位';
  const size = args.size || '1.00 GB';
  return {
    id: args.id,
    name: args.name,
    meta: `${organ} · ${stain} · ${size}`,
    status: '待分析',
    caseId: args.caseId,
    caseName: args.caseName,
    projectId: args.projectId,
    projectName: args.projectName,
    stain,
    organ,
    size,
    modelIds: args.modelIds || [],
  };
}

function objectsFromWsiItems(items: WsiSelectionItem[], modelIds: string[] = []) {
  return items.map((item) => objectFromData({
    id: item.id,
    name: item.name,
    organ: item.organ,
    stain: item.stain,
    size: item.size,
    caseId: item.caseId,
    caseName: item.caseId,
    modelIds,
  }));
}

function objectsFromUploadRows(items: UploadWsiRow[], modelIds: string[] = []) {
  return items.map((item, index) => objectFromData({
    id: `${item.id || 'upload'}-${Date.now()}-${index}`,
    name: item.name,
    organ: item.organ,
    stain: item.stain,
    size: item.size,
    caseId: item.caseId,
    caseName: item.caseId,
    modelIds,
  }));
}

function objectsFromCases(items: CaseSelectionItem[], modelIds: string[] = []) {
  return items.flatMap((item) => {
    const sourceWsis = item.wsis?.length
      ? item.wsis
      : Array.from({ length: Math.max(item.wsiCount, 1) }).map((_, index) => ({
          id: `${item.id}-wsi-${index + 1}`,
          name: `${item.name}_WSI_${index + 1}.svs`,
          organ: item.organ,
          stain: STAIN_SEQUENCE[index % STAIN_SEQUENCE.length],
          magnification: '40X',
          size: SIZE_SEQUENCE[index % SIZE_SEQUENCE.length],
        }));

    const selectedIdSet = Array.isArray(item.selectedWsiIds)
      ? new Set(item.selectedWsiIds)
      : null;
    const selectedWsis = selectedIdSet
      ? sourceWsis.filter((wsi) => selectedIdSet.has(wsi.id))
      : sourceWsis;

    return selectedWsis.map((wsi) => objectFromData({
      id: wsi.id,
      name: wsi.name,
      organ: wsi.organ || item.organ,
      stain: wsi.stain,
      size: wsi.size,
      caseId: item.id,
      caseName: item.name,
      modelIds,
    }));
  });
}

function objectsFromProjects(items: ProjectSelectionItem[], modelIds: string[] = []) {
  return items.flatMap((project) => {
    const detailedCases = project.cases || [];
    const selectedProjectIds = project.selectedWsiIds ? new Set(project.selectedWsiIds) : null;

    const caseObjects = detailedCases.flatMap((caseItem) => {
      const sourceWsis = caseItem.wsis || [];
      const selectedCaseIds = caseItem.selectedWsiIds
        ? new Set(caseItem.selectedWsiIds)
        : selectedProjectIds;
      const selectedWsis = selectedCaseIds
        ? sourceWsis.filter((wsi) => selectedCaseIds.has(wsi.id))
        : sourceWsis;

      return selectedWsis.map((wsi) => objectFromData({
        id: wsi.id,
        name: wsi.name,
        organ: wsi.organ || caseItem.organ,
        stain: wsi.stain,
        size: wsi.size,
        caseId: caseItem.id,
        caseName: caseItem.name,
        projectId: project.id,
        projectName: project.name,
        modelIds,
      }));
    });

    const standaloneObjects = (project.standaloneWsis || [])
      .filter((wsi) => !selectedProjectIds || selectedProjectIds.has(wsi.id))
      .map((wsi) => objectFromData({
        id: wsi.id,
        name: wsi.name,
        organ: wsi.organ,
        stain: wsi.stain,
        size: wsi.size,
        projectId: project.id,
        projectName: project.name,
        modelIds,
      }));

    const detailedObjects = [...caseObjects, ...standaloneObjects];
    if (detailedObjects.length > 0 || detailedCases.length > 0 || (project.standaloneWsis || []).length > 0) {
      return detailedObjects;
    }

    // 兼容旧任务选择数据：没有带详细 Case / WSI 时仍可生成对象，但必须保留 Project 父级。
    const caseCount = Math.max(project.caseCount, 1);
    const wsiCount = Math.max(project.wsiCount, caseCount);
    return Array.from({ length: wsiCount }).map((_, index) => {
      const caseIndex = index % caseCount;
      const caseId = `${project.id}-case-${caseIndex + 1}`;
      const caseName = `${project.name} / Case ${String(caseIndex + 1).padStart(2, '0')}`;
      return objectFromData({
        id: `${project.id}-wsi-${index + 1}`,
        name: `${project.id}_WSI_${String(index + 1).padStart(2, '0')}.svs`,
        organ: 'research',
        stain: STAIN_SEQUENCE[index % STAIN_SEQUENCE.length],
        size: SIZE_SEQUENCE[index % SIZE_SEQUENCE.length],
        caseId,
        caseName,
        projectId: project.id,
        projectName: project.name,
        modelIds,
      });
    });
  });
}

function buildTask(args: {
  taskName?: string;
  sourceType: AnalysisTaskSourceType;
  sourceLabel: AnalysisTaskSourceLabel;
  objectType: AnalysisObjectType;
  modelLocked: boolean;
  objects: AnalysisTaskObjectRecord[];
  caseCount?: number;
  projectCount?: number;
}) {
  const id = newId('task');
  const createdAt = nowText();
  const task: AnalysisTaskRecord = {
    id,
    taskNumber: buildTaskNumber(id, createdAt),
    taskName: args.taskName || buildTaskDisplayName(args.objects, args),
    sourceType: args.sourceType,
    sourceLabel: args.sourceLabel,
    objectType: args.objectType,
    objectCount: objectCountText(args.objects.length),
    status: '待分析',
    createdAt,
    modelLocked: args.modelLocked,
    caseCount: args.caseCount,
    projectCount: args.projectCount,
    models: rebuildRuns(args.objects),
    objects: args.objects,
  };
  return saveAnalysisTask(task);
}

export function createTaskFromSelection(args: {
  sourceType: AnalysisTaskSourceType;
  sourceLabel: AnalysisTaskSourceLabel;
  selectedModel: { id: string; name: string };
  selection: AnalysisTaskSelection;
  taskName?: string;
}) {
  const { sourceType, sourceLabel, selectedModel, selection } = args;
  const selectedDefinition = getModelDefinition(selectedModel.id, selectedModel);
  const lockedModelIds = sourceType === 'model_center' ? [selectedDefinition.id] : [];
  let objectType: AnalysisObjectType = 'WSI';
  let objects: AnalysisTaskObjectRecord[] = [];
  let caseCount = 0;
  let projectCount = 0;

  if (selection.targetType === 'wsi') {
    objectType = 'WSI';
    objects = selection.wsiSource === 'existing'
      ? objectsFromWsiItems(selection.selectedWsiItems, lockedModelIds)
      : objectsFromUploadRows(selection.uploadRows, lockedModelIds);
    caseCount = new Set(objects.map((item) => item.caseId).filter(Boolean)).size;
  } else if (selection.targetType === 'case') {
    objectType = 'Case';
    objects = objectsFromCases(selection.selectedCaseItems, lockedModelIds);
    caseCount = new Set(objects.map((item) => item.caseId).filter(Boolean)).size;
  } else {
    objectType = '研究项目';
    objects = objectsFromProjects(selection.selectedProjectItems, lockedModelIds);
    caseCount = new Set(objects.map((item) => item.caseId).filter(Boolean)).size;
    projectCount = new Set(objects.map((item) => item.projectId).filter(Boolean)).size || selection.selectedProjectItems.length;
  }

  const task = buildTask({
    taskName: args.taskName,
    sourceType,
    sourceLabel,
    objectType,
    modelLocked: sourceType === 'model_center',
    objects,
    caseCount: objectType === 'WSI' ? undefined : caseCount,
    projectCount: objectType === '研究项目' ? projectCount : undefined,
  });

  return task;
}

export function createTaskFromWsis(args: {
  wsis: Array<{
    id?: string;
    fileName: string;
    size: string;
    organPart?: string;
    stain?: string;
    boundCase?: string;
  }>;
}) {
  const wsis = args.wsis.filter((item) => Boolean(item?.fileName));
  if (!wsis.length) throw new Error('至少需要选择 1 张 WSI');

  const objects = wsis.map((item) => objectFromData({
    id: item.id || newId('obj'),
    name: item.fileName,
    organ: item.organPart,
    stain: item.stain,
    size: item.size,
    caseId: item.boundCase && item.boundCase !== '未绑定' ? item.boundCase : undefined,
    caseName: item.boundCase && item.boundCase !== '未绑定' ? item.boundCase : undefined,
  }));

  return buildTask({
    sourceType: 'wsi',
    sourceLabel: 'WSI 管理',
    objectType: 'WSI',
    modelLocked: false,
    objects,
  });
}

export function createTaskFromWsi(args: {
  id?: string;
  fileName: string;
  size: string;
  organPart?: string;
  stain?: string;
  boundCase?: string;
}) {
  return createTaskFromWsis({ wsis: [args] });
}

export function createTaskFromCases(args: {
  cases: Array<{
    caseId: string;
    organ?: string;
    wsiCount: number;
    wsis?: Array<{
      id?: string;
      fileName: string;
      stain?: string;
      size?: string;
    }>;
  }>;
}) {
  const cases = args.cases.filter((item) => Boolean(item?.caseId));
  if (!cases.length) throw new Error('至少需要选择 1 个 Case');

  const caseObjects = cases.map((caseItem) => {
    const selectedWsis = Array.isArray(caseItem.wsis) ? caseItem.wsis.filter((item) => Boolean(item?.fileName)) : [];

    const objects = selectedWsis.length > 0
      ? selectedWsis.map((wsi, index) => objectFromData({
          id: wsi.id || `${caseItem.caseId}-wsi-${index + 1}`,
          name: wsi.fileName,
          organ: caseItem.organ,
          stain: wsi.stain || STAIN_SEQUENCE[index % STAIN_SEQUENCE.length],
          size: wsi.size || SIZE_SEQUENCE[index % SIZE_SEQUENCE.length],
          caseId: caseItem.caseId,
          caseName: caseItem.caseId,
        }))
      : Array.from({ length: Math.max(caseItem.wsiCount, 1) }).map((_, index) => objectFromData({
          id: `${caseItem.caseId}-wsi-${index + 1}`,
          name: `${caseItem.caseId}_WSI_${index + 1}.svs`,
          organ: caseItem.organ,
          stain: STAIN_SEQUENCE[index % STAIN_SEQUENCE.length],
          size: SIZE_SEQUENCE[index % SIZE_SEQUENCE.length],
          caseId: caseItem.caseId,
          caseName: caseItem.caseId,
        }));

    return { caseItem, objects };
  }).filter((item) => item.objects.length > 0);

  if (!caseObjects.length) throw new Error('至少需要选择 1 张 WSI');

  const objects = caseObjects.flatMap((item) => item.objects);
  const activeCases = caseObjects.map((item) => item.caseItem);

  return buildTask({
    sourceType: 'case',
    sourceLabel: 'Case 管理',
    objectType: 'Case',
    modelLocked: false,
    objects,
    caseCount: activeCases.length,
  });
}

export function createTaskFromCase(args: {
  caseId: string;
  organ?: string;
  wsiCount: number;
}) {
  return createTaskFromCases({ cases: [args] });
}

export function createTaskFromProject(args: {
  projectId: string;
  projectName: string;
  cases: ProjectTaskCaseInput[];
  wsis: ProjectTaskWsiInput[];
}) {
  const caseIds = new Set(args.cases.flatMap((item) => [item.id, item.sampleId]));

  const caseObjects = args.cases.flatMap((caseItem) => {
    const existing = args.wsis.filter((wsi) => wsi.caseId === caseItem.sampleId || wsi.caseId === caseItem.id);
    const count = Math.max(caseItem.wsiCount, existing.length);

    return Array.from({ length: count }).map((_, index) => {
      const existingWsi = existing[index];
      return objectFromData({
        id: existingWsi?.id || `${caseItem.id}-wsi-${index + 1}`,
        name: existingWsi?.name || `${caseItem.sampleId}_WSI_${index + 1}.svs`,
        organ: existingWsi?.site || caseItem.site,
        stain: existingWsi?.stain || STAIN_SEQUENCE[index % STAIN_SEQUENCE.length],
        size: existingWsi?.size || SIZE_SEQUENCE[index % SIZE_SEQUENCE.length],
        caseId: caseItem.id,
        caseName: caseItem.sampleId,
        projectId: args.projectId,
        projectName: args.projectName,
      });
    });
  });

  const standaloneObjects = args.wsis
    .filter((wsi) => !wsi.caseId || !caseIds.has(wsi.caseId))
    .map((wsi) => objectFromData({
      id: wsi.id,
      name: wsi.name,
      organ: wsi.site,
      stain: wsi.stain,
      size: wsi.size,
      projectId: args.projectId,
      projectName: args.projectName,
    }));

  return buildTask({
    sourceType: 'project',
    sourceLabel: '研究项目管理',
    objectType: '研究项目',
    modelLocked: false,
    objects: [...caseObjects, ...standaloneObjects],
    caseCount: args.cases.length,
    projectCount: 1,
  });
}

export function stopAnalysisObject(taskId: string, objectId: string) {
  const tasks = readAnalysisTasks();
  const targetTask = tasks.find((task) => task.id === taskId);
  const targetObject = targetTask?.objects.find((object) => object.id === objectId);
  if (!targetTask || !targetObject || !['正在分析', '排队中'].includes(targetObject.status)) {
    return targetTask || null;
  }

  let next = tasks.map((task) => {
    if (task.id !== taskId) return task;

    const models = task.models.map((run) => {
      if (run.objectId !== objectId || !['待分析', '排队中', '正在分析'].includes(run.status)) return run;
      return {
        ...run,
        status: '已停止' as AnalysisTaskStatus,
        desc: '已停止，不能恢复；可重新分析',
      };
    });

    let updated: AnalysisTaskRecord = { ...task, models };

    if (task.status === '正在分析') {
      updated = markTaskAsRunning(updated);
    } else if (task.status === '排队中') {
      updated = markTaskAsQueued(updated);
    } else {
      const status = deriveTerminalTaskStatus(updated);
      updated = {
        ...updated,
        status,
        objects: syncObjectStatuses(updated, models, status),
      };
    }

    return updated;
  });

  next = startNextQueuedTask(next);
  writeAnalysisTasks(next);
  return next.find((task) => task.id === taskId) || null;
}

export function stopAnalysisTask(taskId: string) {
  const tasks = readAnalysisTasks();
  const targetTask = tasks.find((task) => task.id === taskId);
  if (!targetTask || !['正在分析', '排队中'].includes(targetTask.status)) {
    return targetTask || null;
  }

  let next = tasks.map((task) => {
    if (task.id !== taskId) return task;

    const models = task.models.map((run) => {
      if (!['待分析', '排队中', '正在分析'].includes(run.status)) return run;
      return {
        ...run,
        status: '已停止' as AnalysisTaskStatus,
        desc: '任务已停止，不能恢复；可重新分析',
      };
    });

    const updated = { ...task, status: '已停止' as AnalysisTaskStatus, models };
    return { ...updated, objects: syncObjectStatuses(updated, models, '已停止') };
  });

  // 只释放当前任务占用的运行位；其余排队任务顺序和状态不做重置。
  next = startNextQueuedTask(next);
  writeAnalysisTasks(next);
  return next.find((task) => task.id === taskId) || null;
}

export function reanalyzeAnalysisObject(taskId: string, objectId: string) {
  const tasks = readAnalysisTasks();
  const sourceTask = tasks.find((task) => task.id === taskId);
  const sourceObject = sourceTask?.objects.find((object) => object.id === objectId);
  if (!sourceTask || !sourceObject || !['已停止', '分析完成', '失败'].includes(sourceObject.status) || sourceObject.modelIds.length === 0) {
    return sourceTask || null;
  }

  const taskWasActive = sourceTask.status === '正在分析' || sourceTask.status === '排队中';
  const next = tasks.map((task) => {
    if (task.id !== taskId) return task;
    const object = task.objects.find((item) => item.id === objectId);
    if (!object) return task;

    // 单张 WSI 重新分析永远从 0 开始，不续接旧 progress。
    // 若当前任务仍在运行，则重新分析的 WSI 追加到本任务队列尾部，不打断其他 WSI。
    const resetStatus: AnalysisTaskStatus = task.status === '正在分析' || task.status === '排队中' ? '排队中' : '待分析';
    const otherRuns = task.models.filter((run) => run.objectId !== objectId);
    const resetRuns = object.modelIds.map((modelId) => {
      const definition = getModelDefinition(modelId);
      return {
        id: buildRunId(object.id, modelId),
        modelId,
        objectId: object.id,
        objectName: object.name,
        name: definition.name,
        desc: resetStatus === '排队中' ? '等待当前任务内前序模型运行完成' : definition.desc,
        status: resetStatus,
        progress: undefined,
        error: undefined,
      } as AnalysisModelRunRecord;
    });

    const models = [...otherRuns, ...resetRuns];
    const status: AnalysisTaskStatus = task.status === '正在分析'
      ? '正在分析'
      : task.status === '排队中'
        ? '排队中'
        : '待分析';
    const updated = { ...task, status, models };
    return { ...updated, objects: syncObjectStatuses(updated, models, status) };
  });

  writeAnalysisTasks(next);
  if (taskWasActive) return next.find((task) => task.id === taskId) || null;
  return startAnalysisTask(taskId);
}

export function reanalyzeTask(taskId: string) {
  const source = getAnalysisTask(taskId);
  if (!source || !['已停止', '分析完成', '失败'].includes(source.status)) return source;

  const configuredObjects = source.objects.filter((object) => object.modelIds.length > 0);
  if (!configuredObjects.length) return source;

  // 整体重新分析不是“恢复”：所有当前已配置的 WSI × Model 都从 0 重新开始。
  const reset = updateAnalysisTask(taskId, (task) => {
    const models = rebuildRuns(task.objects, []).map((run) => ({
      ...run,
      status: '待分析' as AnalysisTaskStatus,
      progress: undefined,
      error: undefined,
      desc: getModelDefinition(run.modelId, run).desc,
    }));
    const next = { ...task, status: '待分析' as AnalysisTaskStatus, models };
    return { ...next, objects: syncObjectStatuses(next, models, '待分析') };
  });

  if (!reset || !reset.models.length) return reset;
  return startAnalysisTask(taskId);
}

export function deletePendingObject(taskId: string, objectId: string) {
  const sourceTask = getAnalysisTask(taskId);
  const sourceObject = sourceTask?.objects.find((item) => item.id === objectId);
  if (!sourceTask || !sourceObject || !['待分析', '已停止'].includes(sourceObject.status)) return sourceTask || null;

  if (sourceTask.objects.length === 1) {
    deleteAnalysisTask(taskId);
    return null;
  }

  return updateAnalysisTask(taskId, (task) => {
    const object = task.objects.find((item) => item.id === objectId);
    if (!object) return task;

    const objects = task.objects.filter((item) => item.id !== objectId);
    const models = task.models.filter((run) => run.objectId !== objectId);
    const caseCount = new Set(objects.map((item) => item.caseId).filter(Boolean)).size;
    const projectCount = new Set(objects.map((item) => item.projectId).filter(Boolean)).size;

    let status = task.status;
    if (models.some((run) => run.status === '正在分析')) {
      status = '正在分析';
    } else if (task.status === '排队中' && models.some(isRunnableRun)) {
      status = '排队中';
    } else if (task.status === '待分析') {
      status = '待分析';
    } else {
      status = deriveTerminalTaskStatus({ ...task, objects, models });
    }

    const next = {
      ...task,
      status,
      objects,
      models,
      caseCount,
      projectCount: task.objectType === '研究项目' ? projectCount : task.projectCount,
      objectCount: objectCountText(objects.length),
    };
    return { ...next, objects: syncObjectStatuses(next, models, status) };
  });
}
