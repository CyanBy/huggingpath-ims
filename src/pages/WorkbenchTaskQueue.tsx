import { useMemo, useState } from 'react';
import { ClipboardList, Play, RotateCcw, Search, Square, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type AnalysisObjectType = 'Case' | 'WSI' | '研究项目';
type AnalysisTaskStatus = '排队中' | '分析中' | '已停止' | '分析完成' | '失败';

type AnalysisTask = {
  id: string;
  taskName: string;
  objectType: AnalysisObjectType;
  models: string[];
  status: AnalysisTaskStatus;
  createdAt: string;
};

const initialTasks: AnalysisTask[] = [
  {
    id: 'TASK-20260520-001',
    taskName: 'S-20260517-1906',
    objectType: 'Case',
    models: ['CellViT++', 'TME Analyzer'],
    status: '分析中',
    createdAt: '2026-05-20 14:10',
  },
  {
    id: 'TASK-20260520-002',
    taskName: 'HE_lung_001.svs',
    objectType: 'WSI',
    models: ['CellViT++'],
    status: '排队中',
    createdAt: '2026-05-20 14:20',
  },
  {
    id: 'TASK-20260520-003',
    taskName: '乳腺癌 HER2 队列研究',
    objectType: '研究项目',
    models: ['CellViT++', 'TME Analyzer', 'HistoQC', 'CellViT-SAM', 'GastricNet'],
    status: '已停止',
    createdAt: '2026-05-20 15:00',
  },
  {
    id: 'TASK-20260520-004',
    taskName: 'kidney_pas_002.tiff',
    objectType: 'WSI',
    models: ['HistoQC', 'CellViT-SAM', 'TME Analyzer'],
    status: '分析完成',
    createdAt: '2026-05-20 15:30',
  },
  {
    id: 'TASK-20260520-005',
    taskName: 'S-20260209-6099',
    objectType: 'Case',
    models: ['CellViT++', 'TME Analyzer', 'HistoQC', 'CellViT-SAM'],
    status: '失败',
    createdAt: '2026-05-20 16:05',
  },
];

function ObjectTypeBadge({ type }: { type: AnalysisObjectType }) {
  return (
    <span className="h-6 px-2 rounded border border-[#8f35b7]/35 bg-[#8f35b7]/15 text-[#d292f4] text-xs inline-flex items-center">
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: AnalysisTaskStatus }) {
  const className =
    status === '分析完成'
      ? 'border-[#3f6212] bg-[#3f6212]/35 text-[#84cc16]'
      : status === '分析中'
        ? 'border-[#8f35b7]/40 bg-[#8f35b7]/20 text-[#d292f4]'
        : status === '排队中'
          ? 'border-[#334155] bg-[#334155]/45 text-[#cbd5e1]'
          : status === '已停止'
            ? 'border-[#92400e] bg-[#92400e]/25 text-[#fbbf24]'
            : 'border-[#991b1b] bg-[#991b1b]/30 text-[#fca5a5]';

  return (
    <span className={`h-6 px-2 rounded border text-xs inline-flex items-center ${className}`}>
      {status}
    </span>
  );
}

function ModelList({ models }: { models: string[] }) {
  const visibleModels = models.slice(0, 3);
  const hiddenCount = Math.max(models.length - visibleModels.length, 0);

  return (
    <div
      className="flex items-center gap-1.5 min-w-0"
      title={models.join('、')}
    >
      {visibleModels.map((model) => (
        <span
          key={model}
          className="max-w-[132px] truncate h-6 px-2 rounded border border-white/[0.08] bg-white/[0.04] text-[#cbd5e1] text-xs inline-flex items-center"
        >
          {model}
        </span>
      ))}

      {hiddenCount > 0 && (
        <span className="h-6 px-2 rounded border border-[#8f35b7]/35 bg-[#8f35b7]/15 text-[#d292f4] text-xs inline-flex items-center">
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

export default function WorkbenchTaskQueue() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [tasks, setTasks] = useState<AnalysisTask[]>(initialTasks);

  const filteredTasks = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return tasks;

    return tasks.filter((task) => {
      const text = `${task.taskName} ${task.objectType} ${task.models.join(' ')} ${task.status}`.toLowerCase();
      return text.includes(normalizedKeyword);
    });
  }, [keyword, tasks]);

  const taskSummary = useMemo(() => {
    return {
      total: tasks.length,
      queued: tasks.filter((task) => task.status === '排队中').length,
      running: tasks.filter((task) => task.status === '分析中').length,
      stopped: tasks.filter((task) => task.status === '已停止').length,
      completed: tasks.filter((task) => task.status === '分析完成').length,
    };
  }, [tasks]);

  const toggleTaskRunningState = (task: AnalysisTask) => {
    setTasks((prev) =>
      prev.map((item) => {
        if (item.id !== task.id) return item;

        if (item.status === '排队中' || item.status === '分析中') {
          return { ...item, status: '已停止' };
        }

        if (item.status === '已停止') {
          return { ...item, status: '排队中' };
        }

        return item;
      }),
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((item) => item.id !== taskId));
  };

  const canToggleTask = (status: AnalysisTaskStatus) => {
    return status === '排队中' || status === '分析中' || status === '已停止';
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#0f1014] text-[#f1f3f6] px-6 py-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-8 font-bold">分析队列</h1>
          <p className="text-sm text-[#64748b] mt-1">
            管理 Case、WSI 和研究项目发起的 AI 分析任务。
          </p>
        </div>

        <div className="h-9 w-[320px] rounded-md border border-white/[0.08] bg-[#17181d] px-3 flex items-center gap-2 shrink-0">
          <Search size={15} className="text-[#64748b]" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="w-full bg-transparent outline-none text-sm text-[#cbd5e1] placeholder:text-[#64748b]"
            placeholder="搜索任务名称 / 对象类型 / 模型"
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-5">
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">任务总数</div>
          <div className="flex items-center gap-2 text-[#f1f3f6] text-2xl font-bold">
            <ClipboardList size={22} className="text-[#d292f4]" />
            {taskSummary.total}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">排队中</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">{taskSummary.queued}</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">分析中</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">{taskSummary.running}</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">已停止</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">{taskSummary.stopped}</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">分析完成</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">{taskSummary.completed}</div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
        <div className="h-14 px-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="text-[#f1f3f6] text-base font-semibold">任务列表</div>
            <div className="text-[#64748b] text-xs mt-0.5">
              按任务名称、对象类型和使用模型查看分析任务。
            </div>
          </div>
        </div>

        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="bg-[#252730] text-[#cbd5e1]">
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '24%' }}>
                任务名称
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '11%' }}>
                对象类型
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '28%' }}>
                AI 模型
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '10%' }}>
                状态
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '13%' }}>
                创建时间
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '14%' }}>
                操作
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredTasks.map((task) => (
              <tr
                key={task.id}
                className="border-b border-white/[0.06] text-[#d1d5db] hover:bg-white/[0.025]"
              >
                <td className="h-12 px-3">
                  <div className="font-medium text-[#e5e7eb] truncate">{task.taskName}</div>
                </td>

                <td className="h-12 px-3">
                  <ObjectTypeBadge type={task.objectType} />
                </td>

                <td className="h-12 px-3">
                  <ModelList models={task.models} />
                </td>

                <td className="h-12 px-3">
                  <StatusBadge status={task.status} />
                </td>

                <td className="h-12 px-3 text-[#cbd5e1] font-mono text-xs">
                  {task.createdAt}
                </td>

                <td className="h-12 px-3">
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => navigate(`/workbench/tasks/${task.id}`)}
                      className="text-[#d292f4] hover:text-[#f0b7ff] text-sm"
                    >
                      查看详情
                    </button>

                    {canToggleTask(task.status) && (
                      <button
                        type="button"
                        onClick={() => toggleTaskRunningState(task)}
                        className="text-[#d292f4] hover:text-[#f0b7ff] text-sm inline-flex items-center gap-1"
                      >
                        {task.status === '已停止' ? (
                          <>
                            <RotateCcw size={13} />
                            恢复
                          </>
                        ) : (
                          <>
                            <Square size={13} />
                            停止
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="text-[#ff9c9c] hover:text-[#fecaca] text-sm inline-flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={6} className="h-24 text-center text-[#64748b]">
                  暂无匹配的分析任务
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
