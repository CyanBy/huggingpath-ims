import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FlaskConical,
  PlayCircle,
  Search,
} from 'lucide-react';

type TaskStatus = '排队中' | '运行中' | '成功' | '失败';

type AnalysisTask = {
  id: string;
  name: string;
  targetType: '切片' | 'Case' | '研究项目';
  target: string;
  model: string;
  status: TaskStatus;
  submittedAt: string;
  duration: string;
  progress: number;
};

const initialTasks: AnalysisTask[] = [
  {
    id: 'TASK-20260520-001',
    name: '乳腺癌 HER2 队列分析',
    targetType: '研究项目',
    target: 'PRJ-2026-001 · 12 Case · 33 WSI',
    model: 'CellViT++',
    status: '运行中',
    submittedAt: '2026-05-20 14:25',
    duration: '-',
    progress: 62,
  },
  {
    id: 'TASK-20260520-002',
    name: '胃部 HE 切片细胞分割',
    targetType: '切片',
    target: 'Temporary_AI_Slide_001.svs',
    model: 'Hover-Net 胃部分割',
    status: '成功',
    submittedAt: '2026-05-20 14:10',
    duration: '42.6s',
    progress: 100,
  },
  {
    id: 'TASK-20260520-003',
    name: '结直肠癌微环境分析',
    targetType: '研究项目',
    target: 'PRJ-2026-002 · 9 Case · 31 WSI',
    model: 'TME Analyzer',
    status: '排队中',
    submittedAt: '2026-05-20 14:05',
    duration: '-',
    progress: 0,
  },
  {
    id: 'TASK-20260519-004',
    name: '肾小球检测任务',
    targetType: 'Case',
    target: 'S-20260209-6099 · 2 WSI',
    model: '肾小球检测模型',
    status: '成功',
    submittedAt: '2026-05-19 16:40',
    duration: '58.3s',
    progress: 100,
  },
  {
    id: 'TASK-20260519-005',
    name: '前列腺癌分级测试',
    targetType: 'Case',
    target: 'S-20260402-9407 · 3 WSI',
    model: 'ProtoMIL',
    status: '失败',
    submittedAt: '2026-05-19 15:30',
    duration: '12.8s',
    progress: 34,
  },
];

function StatusBadge({ status }: { status: TaskStatus }) {
  const className =
    status === '成功'
      ? 'border-[#3f6212] bg-[#3f6212]/35 text-[#84cc16]'
      : status === '运行中'
        ? 'border-[#8f35b7]/40 bg-[#8f35b7]/20 text-[#d292f4]'
        : status === '失败'
          ? 'border-[#991b1b] bg-[#991b1b]/30 text-[#fca5a5]'
          : 'border-white/[0.08] bg-white/[0.05] text-[#94a3b8]';

  const icon =
    status === '成功' ? (
      <CheckCircle2 size={13} />
    ) : status === '运行中' ? (
      <Activity size={13} />
    ) : status === '失败' ? (
      <AlertTriangle size={13} />
    ) : (
      <Clock3 size={13} />
    );

  return (
    <span className={`h-6 px-2 rounded border text-xs inline-flex items-center gap-1.5 ${className}`}>
      {icon}
      {status}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
      <div
        className="h-full rounded-full bg-[#8f35b7]"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

export default function WorkbenchTaskQueue() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'全部' | TaskStatus>('全部');

  const filteredTasks = useMemo(() => {
    return initialTasks.filter((task) => {
      const keywordMatched = keyword.trim()
        ? `${task.id} ${task.name} ${task.target} ${task.model}`
            .toLowerCase()
            .includes(keyword.trim().toLowerCase())
        : true;

      const statusMatched = statusFilter === '全部' || task.status === statusFilter;

      return keywordMatched && statusMatched;
    });
  }, [keyword, statusFilter]);

  const runningCount = initialTasks.filter((item) => item.status === '运行中').length;
  const queuedCount = initialTasks.filter((item) => item.status === '排队中').length;
  const successCount = initialTasks.filter((item) => item.status === '成功').length;
  const failedCount = initialTasks.filter((item) => item.status === '失败').length;

 const goWorkbenchDetail = (taskId: string) => {
  navigate(`/workbench/tasks/${encodeURIComponent(taskId)}`);
};

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#0f1014] text-[#f1f3f6] px-6 py-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-8 font-bold">分析队列</h1>
          <p className="text-sm text-[#64748b] mt-1">
            查看当前提交的 AI 分析任务、运行状态、进度和结果入口。
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/workbench')}
          className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
        >
          <PlayCircle size={16} />
          进入 AI 工作台
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">运行中</div>
          <div className="flex items-center gap-2 text-[#f1f3f6] text-2xl font-bold">
            <Activity size={24} className="text-[#d292f4]" />
            {runningCount}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">排队中</div>
          <div className="flex items-center gap-2 text-[#f1f3f6] text-2xl font-bold">
            <Clock3 size={24} className="text-[#d292f4]" />
            {queuedCount}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">成功</div>
          <div className="flex items-center gap-2 text-[#f1f3f6] text-2xl font-bold">
            <CheckCircle2 size={24} className="text-[#84cc16]" />
            {successCount}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">失败</div>
          <div className="flex items-center gap-2 text-[#f1f3f6] text-2xl font-bold">
            <AlertTriangle size={24} className="text-[#fca5a5]" />
            {failedCount}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
        <div className="h-16 px-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
          <div>
            <div className="text-[#f1f3f6] text-base font-semibold">任务列表</div>
            <div className="text-[#64748b] text-xs mt-0.5">
              点击详情进入 AI 工作台查看当前任务的模型、参数与分析结果。
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-9 w-[260px] rounded-md border border-white/[0.08] bg-[#17181d] px-3 flex items-center gap-2">
              <Search size={15} className="text-[#64748b]" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="w-full bg-transparent outline-none text-sm text-[#cbd5e1] placeholder:text-[#64748b]"
                placeholder="搜索任务 / 模型 / 对象"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as '全部' | TaskStatus)}
              className="h-9 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#cbd5e1] outline-none focus:border-[#8f35b7]"
            >
              <option value="全部">全部状态</option>
              <option value="排队中">排队中</option>
              <option value="运行中">运行中</option>
              <option value="成功">成功</option>
              <option value="失败">失败</option>
            </select>
          </div>
        </div>

        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="bg-[#252730] text-[#cbd5e1]">
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '15%' }}>
                任务编号
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '18%' }}>
                任务名称
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '10%' }}>
                对象类型
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '18%' }}>
                分析对象
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '12%' }}>
                模型
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '10%' }}>
                状态
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '8%' }}>
                进度
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '9%' }}>
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
                <td className="h-12 px-3 font-mono text-[#e5e7eb]">{task.id}</td>
                <td className="h-12 px-3 text-[#e5e7eb] font-medium">{task.name}</td>
                <td className="h-12 px-3">
                  <span className="h-6 px-2 rounded border border-white/[0.08] bg-white/[0.05] text-[#94a3b8] text-xs inline-flex items-center">
                    {task.targetType}
                  </span>
                </td>
                <td className="h-12 px-3 text-[#94a3b8] truncate">{task.target}</td>
                <td className="h-12 px-3">{task.model}</td>
                <td className="h-12 px-3">
                  <StatusBadge status={task.status} />
                </td>
                <td className="h-12 px-3">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={task.progress} />
                    <span className="text-xs text-[#64748b] w-9">{task.progress}%</span>
                  </div>
                </td>
                <td className="h-12 px-3">
                  <button
                    type="button"
                    onClick={() => goWorkbenchDetail(task.id)}
                    className="text-[#d292f4] hover:text-[#f0b7ff] text-sm inline-flex items-center gap-1.5"
                  >
                    <Eye size={14} />
                    详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTasks.length === 0 && (
          <div className="h-[280px] flex flex-col items-center justify-center text-center text-[#64748b]">
            <FlaskConical size={42} className="mb-3 opacity-60" />
            <div className="text-[#94a3b8] text-sm">暂无匹配任务</div>
            <div className="text-[#64748b] text-xs mt-1">请调整搜索关键词或状态筛选。</div>
          </div>
        )}
      </div>
    </div>
  );
}