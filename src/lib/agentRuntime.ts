/**
 * AI 助手全局运行时（设计图工程的模拟引擎）：
 * - 周期性推进分析任务进度（tickAnalysisTasks），让对话发起的任务在任何页面都会跑完；
 * - 监听任务状态，AI 助手发起的任务到达终态时往来源会话追加「任务结果卡」回话；
 * - 派发页面内 toast 事件，由 AgentToasts 组件统一展示。
 */
import { appendAgentMessage, getAgentSession } from './agentSessions';
import { readAnalysisTasks, tickAnalysisTasks, type AnalysisTaskStatus } from './analysisTasks';
import { logAgentEvent } from './eventLog';

export const AGENT_TOAST_EVENT = 'huggingpathAgentToast';

export type AgentToastPayload = { text: string; sessionId?: string };

/** 任意页面派发 AI 助手 toast 通知 */
export function dispatchAgentToast(text: string, sessionId?: string) {
  window.dispatchEvent(new CustomEvent<AgentToastPayload>(AGENT_TOAST_EVENT, { detail: { text, sessionId } }));
}

const TERMINAL_STATUSES: AnalysisTaskStatus[] = ['分析完成', '失败'];

/** 已回话过的任务，避免重复追加结果卡 */
const repliedTaskIds = new Set<string>();
/** 上次见到的任务状态，用于识别终态跃迁 */
let lastStatuses = new Map<string, AnalysisTaskStatus>();

let started = false;

function watchTaskCompletion() {
  const tasks = readAnalysisTasks();
  const nextStatuses = new Map<string, AnalysisTaskStatus>();
  for (const task of tasks) {
    nextStatuses.set(task.id, task.status);
    if (!task.agentSessionId || repliedTaskIds.has(task.id)) continue;
    const previous = lastStatuses.get(task.id);
    const reachedTerminal = TERMINAL_STATUSES.includes(task.status) && previous !== task.status;
    if (!reachedTerminal) continue;
    if (task.status !== '分析完成' && task.status !== '失败') continue;

    repliedTaskIds.add(task.id);
    const session = getAgentSession(task.agentSessionId);
    if (!session) continue;

    const succeeded = task.status === '分析完成';
    appendAgentMessage(task.agentSessionId, 'assistant',
      succeeded
        ? `你发起的分析任务「**${task.taskName}**」已完成，可以在工作台查看结果。`
        : `你发起的分析任务「**${task.taskName}**」失败了，可以到任务列表查看详情，或让我换个思路再试一次。`,
      {
        card: {
          type: 'task-result',
          taskId: task.id,
          taskName: task.taskName,
          status: task.status,
          objectCount: task.objectCount,
        },
      },
    );
    logAgentEvent('task.complete', `${task.taskName} · ${task.status}`, task.agentSessionId);
    dispatchAgentToast(
      succeeded ? `分析任务「${task.taskName}」已完成` : `分析任务「${task.taskName}」失败`,
      task.agentSessionId,
    );
  }
  lastStatuses = nextStatuses;
}

/** 应用启动时调用一次（App.vue），重复调用安全 */
export function initAgentRuntime() {
  if (started || typeof window === 'undefined') return;
  started = true;
  // 初始化状态基线，避免把历史任务误判为新完成
  lastStatuses = new Map(readAnalysisTasks().map((task) => [task.id, task.status]));
  window.setInterval(() => tickAnalysisTasks(), 1000);
  window.addEventListener('analysisTasksChange', watchTaskCompletion);
}
