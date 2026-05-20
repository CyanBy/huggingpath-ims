import { useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Brain,
  CheckCircle2,
  FileText,
  Plus,
  Search,
} from 'lucide-react';

type ModelVisibility = 'private' | 'public';
type ModelStatus = 'configured' | 'not_configured' | 'testing';

type ManagedModel = {
  id: string;
  name: string;
  type: string;
  version: string;
  description: string;
  tags: string[];
  visibility: ModelVisibility;
  status: ModelStatus;
  organs: string[];
  stains: string[];
  tasks: string[];
  updatedAt: string;
  usageCount: number;
};

type ModelParam = {
  id: string;
  label: string;
  value: string | number | boolean;
  description: string;
};

type ModelUsageRecord = {
  id: string;
  projectName: string;
  input: string;
  status: '成功' | '运行中' | '失败';
  duration: string;
  createdAt: string;
};

const initialModels: ManagedModel[] = [
  {
    id: 'MOD-2026-001',
    name: 'CellViT++',
    type: '分割 · 检测',
    version: 'v1.2.0',
    description: '用于细胞核检测、细胞分割与基础形态学统计的 AI 模型。',
    tags: ['分割', '检测', '细胞核'],
    visibility: 'public',
    status: 'configured',
    organs: ['胃', '乳腺', '肺'],
    stains: ['HE', 'IHC', 'Ki67'],
    tasks: ['细胞检测', '核分割', '阳性细胞统计'],
    updatedAt: '2026-05-20',
    usageCount: 18,
  },
  {
    id: 'MOD-2026-002',
    name: 'TME Analyzer',
    type: '肿瘤微环境',
    version: 'v0.9.5',
    description: '用于肿瘤区域、间质区域、免疫细胞密度和空间分布分析。',
    tags: ['TME', '微环境', '区域分析'],
    visibility: 'private',
    status: 'configured',
    organs: ['结直肠', '胃', '肺'],
    stains: ['HE', 'mIHC'],
    tasks: ['肿瘤区域占比', '间质分析', '免疫细胞密度'],
    updatedAt: '2026-05-18',
    usageCount: 11,
  },
  {
    id: 'MOD-2026-003',
    name: 'HistoQC',
    type: '切片质控',
    version: 'v2.1.0',
    description: '用于识别模糊、折叠、气泡、污染和空白区域，评估切片质量。',
    tags: ['质控', '模糊检测', '折叠检测'],
    visibility: 'public',
    status: 'testing',
    organs: ['通用'],
    stains: ['HE', 'IHC'],
    tasks: ['切片质控', '问题区域识别', '重扫建议'],
    updatedAt: '2026-05-16',
    usageCount: 7,
  },
  {
    id: 'MOD-2026-004',
    name: 'ProtoMIL',
    type: '多示例学习（MIL）',
    version: 'v0.8.2',
    description: '用于 WSI 级别分类、队列筛查和项目级别基线评测。',
    tags: ['MIL', '分类', 'WSI'],
    visibility: 'private',
    status: 'not_configured',
    organs: ['乳腺', '肺'],
    stains: ['HE'],
    tasks: ['WSI 分类', '风险分层', '队列筛查'],
    updatedAt: '2026-05-11',
    usageCount: 0,
  },
];

const defaultParams: ModelParam[] = [
  {
    id: 'roi',
    label: '分析区域',
    value: '自动检测组织区域',
    description: '控制模型推理时使用全片、组织区域或手动 ROI。',
  },
  {
    id: 'confidence',
    label: '置信度阈值',
    value: 0.5,
    description: '低于该阈值的模型输出结果将被过滤。',
  },
  {
    id: 'batchSize',
    label: '推理批次大小',
    value: 16,
    description: '每次送入 GPU 的图像 patch 数量。',
  },
  {
    id: 'output',
    label: '输出内容',
    value: '图层 / 统计摘要',
    description: '控制模型推理后生成的结果内容。',
  },
  {
    id: 'gpu',
    label: 'GPU 加速',
    value: true,
    description: '是否使用 GPU 进行推理加速。',
  },
  {
    id: 'nms',
    label: 'NMS 阈值',
    value: 0.3,
    description: '用于检测结果去重的非极大值抑制阈值。',
  },
];

const usageRecords: ModelUsageRecord[] = [
  {
    id: 'TASK-20260520-001',
    projectName: '乳腺癌 HER2 队列研究',
    input: '12 个 Case · 33 张 WSI',
    status: '成功',
    duration: '42.6s',
    createdAt: '2026-05-20 14:25',
  },
  {
    id: 'TASK-20260520-002',
    projectName: '结直肠癌微环境多模态分析',
    input: '9 个 Case · 31 张 WSI',
    status: '运行中',
    duration: '-',
    createdAt: '2026-05-20 14:20',
  },
  {
    id: 'TASK-20260519-004',
    projectName: '胃癌组织分类基线评测',
    input: '10 个 Case · 33 张 WSI',
    status: '成功',
    duration: '58.3s',
    createdAt: '2026-05-19 16:40',
  },
];

function Tag({ children }: { children: string }) {
  return (
    <span className="h-6 px-2.5 rounded-md border border-[#8f35b7]/30 bg-[#8f35b7]/12 text-[#d292f4] text-xs inline-flex items-center">
      {children}
    </span>
  );
}

function VisibilityText({ value }: { value: ModelVisibility }) {
  return <span className="text-[#e2e8f0]">{value === 'private' ? '私有' : '公开'}</span>;
}

function VisibilityToggle({
  value,
  onChange,
}: {
  value: ModelVisibility;
  onChange: (value: ModelVisibility) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-white/[0.08] bg-[#17181d] p-1">
      <button
        type="button"
        onClick={() => onChange('private')}
        className={`h-7 px-3 rounded text-xs font-medium transition-all ${
          value === 'private'
            ? 'bg-[#8f35b7] text-white'
            : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04]'
        }`}
      >
        私有
      </button>

      <button
        type="button"
        onClick={() => onChange('public')}
        className={`h-7 px-3 rounded text-xs font-medium transition-all ${
          value === 'public'
            ? 'bg-[#8f35b7] text-white'
            : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04]'
        }`}
      >
        公开
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: ModelStatus }) {
  const className =
    status === 'configured'
      ? 'border-[#3f6212] bg-[#3f6212]/35 text-[#84cc16]'
      : status === 'testing'
        ? 'border-[#8f35b7]/40 bg-[#8f35b7]/20 text-[#d292f4]'
        : 'border-white/[0.08] bg-white/[0.05] text-[#94a3b8]';

  const label =
    status === 'configured' ? '已配置' : status === 'testing' ? '测试中' : '未配置';

  return (
    <span className={`h-6 px-2 rounded border text-xs inline-flex items-center ${className}`}>
      {label}
    </span>
  );
}

function UsageStatusBadge({ status }: { status: ModelUsageRecord['status'] }) {
  const className =
    status === '成功'
      ? 'border-[#3f6212] bg-[#3f6212]/35 text-[#84cc16]'
      : status === '运行中'
        ? 'border-[#8f35b7]/40 bg-[#8f35b7]/20 text-[#d292f4]'
        : 'border-[#991b1b] bg-[#991b1b]/30 text-[#fca5a5]';

  return (
    <span className={`h-6 px-2 rounded border text-xs inline-flex items-center ${className}`}>
      {status}
    </span>
  );
}

function ModelCard({
  model,
  onView,
}: {
  model: ManagedModel;
  onView: (model: ManagedModel) => void;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-5 hover:border-[#8f35b7]/45 hover:bg-[#24252b] transition-all duration-150">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[#64748b] text-xs mb-3">
            <Brain size={14} className="text-[#d292f4]" />
            <span className="font-mono">{model.id}</span>
          </div>

          <h2 className="text-[#f1f3f6] text-lg font-bold truncate">{model.name}</h2>
        </div>

        <span
          className={`h-7 px-2.5 rounded-full text-xs font-semibold inline-flex items-center shrink-0 ${
            model.visibility === 'public'
              ? 'bg-[#8f35b7]/18 text-[#d292f4]'
              : 'bg-white/[0.05] text-[#94a3b8]'
          }`}
        >
          {model.visibility === 'public' ? '公开' : '私有'}
        </span>
      </div>

      <p className="text-[#94a3b8] text-sm leading-6 line-clamp-2 mb-4">
        {model.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {model.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 border-t border-white/[0.06] pt-4">
        <div>
          <div className="text-[#64748b] text-xs mb-1">类型</div>
          <div className="text-[#e2e8f0] text-sm font-semibold truncate">{model.type}</div>
        </div>

        <div>
          <div className="text-[#64748b] text-xs mb-1">版本</div>
          <div className="text-[#e2e8f0] text-sm font-semibold">{model.version}</div>
        </div>

        <div>
          <div className="text-[#64748b] text-xs mb-1">使用次数</div>
          <div className="text-[#e2e8f0] text-sm font-semibold">{model.usageCount}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.06]">
        <div className="text-[#64748b] text-xs">更新于 {model.updatedAt}</div>

        <button
          type="button"
          onClick={() => onView(model)}
          className="h-8 px-3 rounded-md border border-[#8f35b7]/35 bg-[#8f35b7]/10 text-[#d292f4] text-xs font-medium hover:bg-[#8f35b7]/18 transition-all"
        >
          查看模型
        </button>
      </div>
    </div>
  );
}

function ModelDetail({
  model,
  onBack,
}: {
  model: ManagedModel;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'params' | 'scope' | 'records'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editableDescription, setEditableDescription] = useState(model.description);
  const [visibility, setVisibility] = useState<ModelVisibility>(model.visibility);
  const [params, setParams] = useState<ModelParam[]>(defaultParams);

  const tabs = [
    { key: 'overview' as const, label: '概览' },
    { key: 'params' as const, label: '参数配置' },
    { key: 'scope' as const, label: '适用范围' },
    { key: 'records' as const, label: '使用记录' },
  ];

  const cancelEdit = () => {
    setEditableDescription(model.description);
    setVisibility(model.visibility);
    setIsEditing(false);
  };

  const saveEdit = () => {
    setIsEditing(false);
  };

  const updateParam = (id: string, value: string | number | boolean) => {
    setParams((prev) => prev.map((item) => (item.id === id ? { ...item, value } : item)));
  };

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="h-9 px-3 rounded-md text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all inline-flex items-center gap-2 text-sm mb-3"
        >
          <ArrowLeft size={16} />
          返回模型列表
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="h-6 px-2.5 rounded-md border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-xs font-mono inline-flex items-center">
            {model.id}
          </span>

          {model.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>

        <h1 className="text-[28px] leading-9 font-bold text-[#f8fafc]">{model.name}</h1>
        <p className="text-sm text-[#94a3b8] leading-6 mt-2 max-w-[920px]">
          {editableDescription}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">模型类型</div>
          <div className="flex items-center gap-2 text-[#f1f3f6] text-xl font-bold">
            <Brain size={24} className="text-[#d292f4]" />
            {model.type}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">模型版本</div>
          <div className="flex items-center gap-2 text-[#f1f3f6] text-xl font-bold">
            <FileText size={24} className="text-[#d292f4]" />
            {model.version}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">使用次数</div>
          <div className="flex items-center gap-2 text-[#f1f3f6] text-xl font-bold">
            <BarChart3 size={24} className="text-[#d292f4]" />
            {model.usageCount}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">模型状态</div>
          <div className="flex items-center gap-2 text-[#f1f3f6] text-xl font-bold">
            <CheckCircle2 size={24} className="text-[#d292f4]" />
            <StatusBadge status={model.status} />
          </div>
        </div>
      </div>

      <div className="border-b border-white/[0.08] mb-4">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setIsEditing(false);
                }}
                className={`h-11 text-sm font-medium border-b-2 transition-all ${
                  isActive
                    ? 'border-[#8f35b7] text-[#d292f4]'
                    : 'border-transparent text-[#94a3b8] hover:text-[#e2e8f0]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-5">
          <div className="grid grid-cols-2 gap-x-10 gap-y-5 text-sm">
            <div>
              <span className="text-[#64748b]">模型编号</span>
              <span className="ml-3 text-[#e2e8f0] font-mono">{model.id}</span>
            </div>

            <div>
              <span className="text-[#64748b]">可见性</span>
              <span className="ml-3">
                {isEditing ? (
                  <VisibilityToggle value={visibility} onChange={setVisibility} />
                ) : (
                  <VisibilityText value={visibility} />
                )}
              </span>
            </div>

            <div>
              <span className="text-[#64748b]">模型类型</span>
              <span className="ml-3 text-[#e2e8f0]">{model.type}</span>
            </div>

            <div>
              <span className="text-[#64748b]">模型版本</span>
              <span className="ml-3 text-[#e2e8f0]">{model.version}</span>
            </div>

            <div>
              <span className="text-[#64748b]">更新时间</span>
              <span className="ml-3 text-[#e2e8f0]">{model.updatedAt}</span>
            </div>

            <div>
              <span className="text-[#64748b]">模型中心展示</span>
              <span className="ml-3 text-[#e2e8f0]">
                {visibility === 'public' ? '已展示' : '不展示'}
              </span>
            </div>

            <div className="col-span-2">
              <span className="text-[#64748b]">描述</span>

              {isEditing ? (
                <textarea
                  value={editableDescription}
                  onChange={(event) => setEditableDescription(event.target.value)}
                  className="mt-2 block w-full min-h-[88px] rounded-md border border-white/[0.08] bg-[#17181d] px-3 py-2 text-sm leading-6 text-[#cbd5e1] outline-none focus:border-[#8f35b7] resize-none"
                />
              ) : (
                <span className="ml-3 text-[#e2e8f0]">{editableDescription}</span>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="h-8 px-3 rounded-md border border-white/[0.08] bg-[#17181d] text-[#94a3b8] text-xs hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all"
                >
                  取消
                </button>

                <button
                  type="button"
                  onClick={saveEdit}
                  className="h-8 px-3 rounded-md bg-[#8f35b7] text-white text-xs font-medium hover:bg-[#a64ed0] transition-all"
                >
                  保存
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="h-8 px-3 rounded-md border border-[#8f35b7]/35 bg-[#8f35b7]/10 text-[#d292f4] text-xs font-medium hover:bg-[#8f35b7]/18 transition-all"
              >
                编辑
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'params' && (
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
          <div className="h-14 px-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[#f1f3f6] text-base font-semibold">模型参数配置</div>
              <div className="text-[#64748b] text-xs mt-0.5">
                当前为通用推理参数示例，后续可扩展为模型专属参数 Schema。
              </div>
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 gap-4">
            {params.map((param) => (
              <div
                key={param.id}
                className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-[#e2e8f0] text-sm font-semibold">{param.label}</div>
                    <div className="text-[#64748b] text-xs leading-5 mt-1">{param.description}</div>
                  </div>
                </div>

                {typeof param.value === 'boolean' ? (
                  <button
                    type="button"
                    onClick={() => updateParam(param.id, !param.value)}
                    className={`mt-3 h-8 px-3 rounded-md text-xs font-medium transition-all ${
                      param.value
                        ? 'bg-[#8f35b7] text-white'
                        : 'bg-white/[0.06] text-[#94a3b8]'
                    }`}
                  >
                    {param.value ? '开启' : '关闭'}
                  </button>
                ) : typeof param.value === 'number' ? (
                  <input
                    type="number"
                    value={param.value}
                    onChange={(event) => updateParam(param.id, Number(event.target.value))}
                    className="mt-3 h-9 w-full rounded-md border border-white/[0.08] bg-[#202126] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  />
                ) : (
                  <input
                    value={param.value}
                    onChange={(event) => updateParam(param.id, event.target.value)}
                    className="mt-3 h-9 w-full rounded-md border border-white/[0.08] bg-[#202126] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'scope' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-5">
            <div className="text-[#f1f3f6] text-base font-semibold mb-4">适用器官</div>
            <div className="flex flex-wrap gap-2">
              {model.organs.map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-5">
            <div className="text-[#f1f3f6] text-base font-semibold mb-4">适用染色</div>
            <div className="flex flex-wrap gap-2">
              {model.stains.map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-5">
            <div className="text-[#f1f3f6] text-base font-semibold mb-4">适用任务</div>
            <div className="flex flex-wrap gap-2">
              {model.tasks.map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
            </div>
          </div>

          <div className="col-span-3 rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-5">
            <div className="text-[#d292f4] text-sm font-semibold mb-2">模型中心展示规则</div>
            <div className="text-[#94a3b8] text-sm leading-6">
              当模型设置为“公开”时，后续可在模型中心作为公开模型展示；当模型设置为“私有”时，仅在当前工作台的模型管理中可见。
            </div>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
          <div className="h-14 px-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[#f1f3f6] text-base font-semibold">模型使用记录</div>
              <div className="text-[#64748b] text-xs mt-0.5">
                展示该模型被用于研究项目或分析队列的历史记录。
              </div>
            </div>
          </div>

          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="bg-[#252730] text-[#cbd5e1]">
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '18%' }}>
                  任务编号
                </th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '26%' }}>
                  研究项目
                </th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '18%' }}>
                  输入对象
                </th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '12%' }}>
                  状态
                </th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '10%' }}>
                  耗时
                </th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '16%' }}>
                  时间
                </th>
              </tr>
            </thead>

            <tbody>
              {usageRecords.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-white/[0.06] text-[#d1d5db] hover:bg-white/[0.025]"
                >
                  <td className="h-11 px-3 font-mono text-[#e5e7eb]">{record.id}</td>
                  <td className="h-11 px-3">{record.projectName}</td>
                  <td className="h-11 px-3">{record.input}</td>
                  <td className="h-11 px-3">
                    <UsageStatusBadge status={record.status} />
                  </td>
                  <td className="h-11 px-3">{record.duration}</td>
                  <td className="h-11 px-3">{record.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function WorkbenchModelManagement() {
  const [keyword, setKeyword] = useState('');
  const [modelList, setModelList] = useState<ManagedModel[]>(initialModels);
  const [selectedModel, setSelectedModel] = useState<ManagedModel | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelType, setNewModelType] = useState('分割');
  const [newModelDescription, setNewModelDescription] = useState('');
  const [newModelTags, setNewModelTags] = useState('');
  const [newModelVisibility, setNewModelVisibility] = useState<ModelVisibility>('private');
  const [newModelStatus, setNewModelStatus] = useState<ModelStatus>('configured');

  const filteredModels = modelList.filter((model) => {
    if (!keyword.trim()) return true;

    const text = `${model.id} ${model.name} ${model.type} ${model.tags.join(' ')}`.toLowerCase();
    return text.includes(keyword.trim().toLowerCase());
  });

  const resetCreateForm = () => {
    setNewModelName('');
    setNewModelType('分割');
    setNewModelDescription('');
    setNewModelTags('');
    setNewModelVisibility('private');
    setNewModelStatus('configured');
  };

  const closeCreateModal = () => {
    resetCreateForm();
    setShowCreateModal(false);
  };

  const createModel = () => {
    if (!newModelName.trim()) return;

    const nextIndex = modelList.length + 1;

    const nextModel: ManagedModel = {
      id: `MOD-2026-${String(nextIndex).padStart(3, '0')}`,
      name: newModelName.trim(),
      type: newModelType,
      version: 'v1.0.0',
      description: newModelDescription.trim() || '暂无模型描述。',
      tags: newModelTags
        .split(/[，,]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      visibility: newModelVisibility,
      status: newModelStatus,
      organs: ['通用'],
      stains: ['HE'],
      tasks: [newModelType],
      updatedAt: '2026-05-20',
      usageCount: 0,
    };

    setModelList((prev) => [nextModel, ...prev]);
    setSelectedModel(nextModel);
    closeCreateModal();
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#0f1014] text-[#f1f3f6] px-6 py-5">
      {selectedModel ? (
        <ModelDetail model={selectedModel} onBack={() => setSelectedModel(null)} />
      ) : (
        <>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[26px] leading-8 font-bold">模型管理</h1>
              <p className="text-sm text-[#64748b] mt-1">
                用于创建、配置和维护自定义 AI 模型；公开模型后续可展示到模型中心。
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="h-9 w-[260px] rounded-md border border-white/[0.08] bg-[#17181d] px-3 flex items-center gap-2">
                <Search size={15} className="text-[#64748b]" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  className="w-full bg-transparent outline-none text-sm text-[#cbd5e1] placeholder:text-[#64748b]"
                  placeholder="搜索模型名 / 编号"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
              >
                <Plus size={16} />
                新建模型
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {filteredModels.map((model) => (
              <ModelCard key={model.id} model={model} onView={setSelectedModel} />
            ))}
          </div>
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-[680px] rounded-2xl border border-white/[0.08] bg-[#202126] shadow-[0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="h-16 px-6 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-[#f1f3f6] text-lg font-bold">新建模型</div>
                <div className="text-[#64748b] text-xs mt-1">
                  当前仅模拟模型创建和管理，不涉及真实模型上传或推理接口绑定。
                </div>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                className="w-8 h-8 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-[#cbd5e1] mb-2">
                  模型名称 <span className="text-[#ff8f8f]">*</span>
                </label>
                <input
                  value={newModelName}
                  onChange={(event) => setNewModelName(event.target.value)}
                  className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  placeholder="请输入模型名称"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">模型类型</label>
                  <select
                    value={newModelType}
                    onChange={(event) => setNewModelType(event.target.value)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  >
                    <option>分割</option>
                    <option>检测</option>
                    <option>分类</option>
                    <option>肿瘤微环境</option>
                    <option>切片质控</option>
                    <option>生成模型</option>
                    <option>多示例学习（MIL）</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">模型状态</label>
                  <select
                    value={newModelStatus}
                    onChange={(event) => setNewModelStatus(event.target.value as ModelStatus)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  >
                    <option value="configured">已配置</option>
                    <option value="not_configured">未配置</option>
                    <option value="testing">测试中</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#cbd5e1] mb-2">模型描述</label>
                <textarea
                  value={newModelDescription}
                  onChange={(event) => setNewModelDescription(event.target.value)}
                  className="w-full min-h-[96px] rounded-md border border-white/[0.08] bg-[#17181d] px-3 py-2 text-sm leading-6 text-[#e2e8f0] outline-none focus:border-[#8f35b7] resize-none"
                  placeholder="请输入模型用途、适用场景或输出内容说明"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">模型标签</label>
                  <input
                    value={newModelTags}
                    onChange={(event) => setNewModelTags(event.target.value)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                    placeholder="例如：分割, 检测, HE"
                  />
                  <div className="text-[#64748b] text-xs mt-1">多个标签可用逗号分隔。</div>
                </div>

                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">可见性</label>
                  <VisibilityToggle value={newModelVisibility} onChange={setNewModelVisibility} />
                  <div className="text-[#64748b] text-xs mt-2">
                    公开后，该模型后续可展示在模型中心。
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-4">
                <div className="text-[#d292f4] text-sm font-semibold mb-1">创建规则说明</div>
                <div className="text-[#94a3b8] text-xs leading-6">
                  模型管理用于维护自定义模型基础信息、参数配置与公开状态。当前版本不处理真实权重文件、模型服务地址或推理接口。
                </div>
              </div>
            </div>

            <div className="h-16 px-6 border-t border-white/[0.06] bg-[#17181d] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeCreateModal}
                className="h-9 px-4 rounded-md border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all"
              >
                取消
              </button>

              <button
                type="button"
                onClick={createModel}
                disabled={!newModelName.trim()}
                className={`h-9 px-4 rounded-md text-sm font-medium transition-all ${
                  newModelName.trim()
                    ? 'bg-[#8f35b7] text-white hover:bg-[#a64ed0]'
                    : 'bg-white/[0.06] text-[#64748b] cursor-not-allowed'
                }`}
              >
                确定创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}