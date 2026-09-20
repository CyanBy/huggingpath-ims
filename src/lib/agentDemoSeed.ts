/**
 * AI 助手演示种子：首次使用（无会话存储）时预置几条带关联任务的示例会话，
 * 让状态徽标、未读提醒、完成回话等机制开箱可见。全部为示例数据。
 */
import { appendAgentMessage, createAgentSession, listAgentSessions } from './agentSessions';
import { createAgentAnalysisTask, startAnalysisTask, updateAnalysisTask, type AnalysisTaskStatus } from './analysisTasks';
import { getStadDemoScript, STAD_PROJECT_ID } from './stadScript';
import { readWorkspaceProjects, readWorkspaceWsis, writeWorkspaceProjects } from '@/vue/data/pathologyWorkspace';

const SEED_FLAG_KEY = 'huggingpath.agentSessions.v1';

function isoHoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

function setTaskStatus(taskId: string, status: AnalysisTaskStatus, error?: string) {
  updateAnalysisTask(taskId, (task) => ({
    ...task,
    status,
    models: task.models.map((run) => ({
      ...run,
      status,
      progress: status === '分析完成' ? 100 : undefined,
      error: status === '失败' ? error : undefined,
      desc: status === '分析完成' ? '分析完成' : status === '失败' ? '失败' : run.desc,
    })),
    objects: task.objects.map((object) => ({ ...object, status })),
  }));
}

export function ensureAgentDemoSeed() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SEED_FLAG_KEY) !== null) return;
  if (listAgentSessions().length) return;

  const wsis = readWorkspaceWsis();
  const project = readWorkspaceProjects().find((item) => item.tags.includes('TME')) ?? readWorkspaceProjects()[0];
  const pick = (index: number) => wsis[index % Math.max(wsis.length, 1)];
  const toObjects = (indexes: number[]) =>
    indexes.map((i) => {
      const wsi = pick(i);
      return {
        id: wsi.id,
        name: wsi.fileName,
        stain: wsi.stain,
        size: wsi.size,
        projectId: project?.id,
        projectName: project?.name,
      };
    });

  // 1. 项目会话：TME 批量分析进行中（徽标紫色呼吸点）
  const s1 = createAgentSession(project?.id, 'TME 未分析切片批量处理');
  appendAgentMessage(s1.id, 'user', '把项目里没跑过 TME 的切片都分析一遍');
  appendAgentMessage(s1.id, 'assistant', '好的，已为你发起批量分析。', {
    card: {
      type: 'analysis-proposal',
      modelId: 'mod-tme',
      modelName: 'TME Analyzer',
      objects: toObjects([0, 1]).map((item) => ({ id: item.id, name: item.name })),
      status: 'confirmed',
    },
  });
  const runningTask = createAgentAnalysisTask({ agentSessionId: s1.id, modelId: 'mod-tme', objects: toObjects([0, 1]) });
  startAnalysisTask(runningTask.id);

  // 2. 自由会话：失败任务（徽标红点 + 未读）
  const s2 = createAgentSession(undefined, '切片分类失败原因排查');
  appendAgentMessage(s2.id, 'user', '帮我看看这次分类分析为什么失败');
  const failedTask = createAgentAnalysisTask({ agentSessionId: s2.id, modelId: 'mod-tme', objects: toObjects([2]) });
  setTaskStatus(failedTask.id, '失败', '示例：切片扫描区域不完整');
  appendAgentMessage(s2.id, 'assistant', '你发起的分析任务「**TME Analyzer · 对话发起**」失败了，可以到任务列表查看详情，或让我换个思路再试一次。', {
    card: { type: 'task-result', taskId: failedTask.id, taskName: failedTask.taskName, status: '失败', objectCount: failedTask.objectCount },
  });

  // 3. 自由会话：已完成任务（徽标绿点，昨天更新）
  const s3 = createAgentSession(undefined, '胃癌切片结果汇报摘要');
  appendAgentMessage(s3.id, 'user', '把这次分析结果整理成可以汇报的摘要');
  const doneTask = createAgentAnalysisTask({ agentSessionId: s3.id, modelId: 'mod-tme', objects: toObjects([3]) });
  setTaskStatus(doneTask.id, '分析完成');
  appendAgentMessage(s3.id, 'assistant', '你发起的分析任务「**TME Analyzer · 对话发起**」已完成，可以在工作台查看结果。', {
    card: { type: 'task-result', taskId: doneTask.id, taskName: doneTask.taskName, status: '分析完成', objectCount: doneTask.objectCount },
  });

  // 时间分组演示：s2 昨天、s3 三天前
  const sessions = listAgentSessions();
  const remap = new Map([
    [s1.id, isoHoursAgo(1)],
    [s2.id, isoHoursAgo(26)],
    [s3.id, isoHoursAgo(72)],
  ]);
  localStorage.setItem(
    SEED_FLAG_KEY,
    JSON.stringify(
      sessions.map((session) => {
        const at = remap.get(session.id);
        return at ? { ...session, createdAt: at, updatedAt: at } : session;
      }),
    ),
  );

  // 运行中任务排队，由全局 runtime 的 ticker 推进
  void runningTask;
}

/**
 * STAD 队列科研演示种子：独立研究项目 + 一条完整的 5 轮演示会话。
 * 与 ensureAgentDemoSeed 独立幂等，老用户首次打开也会补种。
 */
export function ensureStadDemoSeed() {
  if (typeof window === 'undefined') return;
  const STAD_SESSION_TITLE = 'STAD 队列 TME 科研演示';
  if (listAgentSessions().some((s) => s.title === STAD_SESSION_TITLE)) return;

  const projects = readWorkspaceProjects();
  if (!projects.some((p) => p.id === STAD_PROJECT_ID)) {
    writeWorkspaceProjects([
      {
        id: STAD_PROJECT_ID,
        name: 'STAD 队列 TME 研究',
        description: 'TCGA-STAD 375 例胃腺癌队列的肿瘤微环境科研演示（素材来自科研交付包）。',
        tags: ['STAD', 'TME', 'TCGA'],
        caseIds: [],
        standaloneWsiIds: [],
        memberCount: 1,
        updatedAt: new Date().toISOString().slice(0, 10),
        visibility: 'private',
      },
      ...projects,
    ]);
  }

  const session = createAgentSession(STAD_PROJECT_ID, STAD_SESSION_TITLE);
  for (const { q, a } of getStadDemoScript()) {
    appendAgentMessage(session.id, 'user', q);
    appendAgentMessage(session.id, 'assistant', a.text, { thinking: a.thinking, artifacts: a.artifacts });
  }
}
