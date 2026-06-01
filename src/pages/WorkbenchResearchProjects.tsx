import { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  FlaskConical,
  FolderOpen,
  Plus,
  Search,
  Users,
} from 'lucide-react';

type ProjectVisibility = 'private' | 'public';

type ResearchProject = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  caseCount: number;
  wsiCount: number;
  inferenceCount: number;
  updatedAt: string;
  visibility: ProjectVisibility;
};
type ProjectCaseRow = {
  id: string;
  sampleId: string;
  site: string;
  category: string;
  samplingMethod: string;
  ageGroup: string;
  sex: '男' | '女';
  wsiCount: number;
  status: '就绪' | '待处理';
};

type ProjectWsiRow = {
  id: string;
  name: string;
  caseId: string;
  stain: string;
  magnification: string;
  status: '已上传' | '待分析' | '分析完成';
  createdAt: string;
};
type ProjectInferenceRow = {
  id: string;
  model: string;
  modelType: string;
  status: '排队中' | '运行中' | '成功' | '失败';
  queuedAt: string;
  duration: string;
};

type AnalysisVersionStatus = '分析中' | '分析失败' | '分析完成';

type AnalysisVersion = {
  id: string;
  time: string;
  title: string;
  status: AnalysisVersionStatus;
  description: string;
  wsiCount: number;
  aiFindingCount: number;
  detectedNuclei: string;
  positiveCells: string;
  positiveRate: string;
  tmeHotspots: number;
  qcTips: number;
  confidence: string;
  summary: string;
  inferenceRows: ProjectInferenceRow[];
};

const initialProjectInferenceRows: ProjectInferenceRow[] = [
  {
    id: 'infer-001',
    model: 'CellViT++',
    modelType: '分割 · 检测',
    status: '成功',
    queuedAt: '05-20 14:25',
    duration: '42.6s',
  },
  {
    id: 'infer-002',
    model: 'TME Analyzer',
    modelType: '肿瘤微环境',
    status: '成功',
    queuedAt: '05-20 14:20',
    duration: '58.3s',
  },
  {
    id: 'infer-003',
    model: 'CellViT-SAM',
    modelType: '分割',
    status: '运行中',
    queuedAt: '05-20 14:15',
    duration: '-',
  },
  {
    id: 'infer-004',
    model: 'HistoQC',
    modelType: '切片质控',
    status: '排队中',
    queuedAt: '05-20 14:10',
    duration: '-',
  },
];

const initialProjectCases: ProjectCaseRow[] = [
  {
    id: 'case-001',
    sampleId: 'S-20260517-1906',
    site: 'lung',
    category: '炎性病变',
    samplingMethod: 'biopsy',
    ageGroup: '41-60',
    sex: '女',
    wsiCount: 2,
    status: '就绪',
  },
  {
    id: 'case-002',
    sampleId: 'S-20260209-6099',
    site: 'kidney',
    category: '浸润性导管癌',
    samplingMethod: 'surgical',
    ageGroup: '19-40',
    sex: '男',
    wsiCount: 2,
    status: '就绪',
  },
  {
    id: 'case-003',
    sampleId: 'S-20260114-3036',
    site: 'thyroid',
    category: '良性病变',
    samplingMethod: 'surgical',
    ageGroup: '41-60',
    sex: '男',
    wsiCount: 4,
    status: '待处理',
  },
];

const initialProjectWsi: ProjectWsiRow[] = [
  {
    id: 'wsi-001',
    name: 'HE_lung_001.svs',
    caseId: 'S-20260517-1906',
    stain: 'HE',
    magnification: '40X',
    status: '已上传',
    createdAt: '2026-05-17',
  },
  {
    id: 'wsi-002',
    name: 'IHC_Ki67_lung_001.svs',
    caseId: 'S-20260517-1906',
    stain: 'Ki67',
    magnification: '40X',
    status: '待分析',
    createdAt: '2026-05-17',
  },
  {
    id: 'wsi-003',
    name: 'HE_kidney_001.svs',
    caseId: 'S-20260209-6099',
    stain: 'HE',
    magnification: '20X',
    status: '分析完成',
    createdAt: '2026-05-18',
  },
];

const initialProjects: ResearchProject[] = [
  {
    id: 'PRJ-2026-001',
    name: '乳腺癌 HER2 队列研究',
    description: '用于乳腺癌 HER2 表达评估、IHC 定量与分型分析的研究项目。',
    tags: ['乳腺', 'HER2', 'IHC'],
    caseCount: 12,
    wsiCount: 33,
    inferenceCount: 4,
    updatedAt: '2026-05-05',
    visibility: 'private',
  },
  {
    id: 'PRJ-2026-002',
    name: '结直肠癌微环境多模态分析',
    description: '围绕结直肠癌肿瘤微环境，进行细胞组成、区域占比与空间特征分析。',
    tags: ['结直肠', 'TME', '多模态'],
    caseCount: 9,
    wsiCount: 31,
    inferenceCount: 3,
    updatedAt: '2026-05-10',
    visibility: 'public',
  },
  {
    id: 'PRJ-2026-003',
    name: '肺腺癌核分裂指数研究',
    description: '用于肺腺癌核分裂象识别、计数与高危区域筛选。',
    tags: ['肺', '核分裂', '预后'],
    caseCount: 11,
    wsiCount: 32,
    inferenceCount: 5,
    updatedAt: '2026-05-20',
    visibility: 'private',
  },
  {
    id: 'PRJ-2026-004',
    name: '胃癌组织分类基线评测',
    description: '用于胃癌组织区域分类、模型基线验证与结果复核。',
    tags: ['胃', '分类', '基线'],
    caseCount: 10,
    wsiCount: 33,
    inferenceCount: 2,
    updatedAt: '2026-04-23',
    visibility: 'private',
  },
];

function Tag({ children }: { children: string }) {
  return (
    <span className="h-6 px-2.5 rounded-md border border-[#8f35b7]/30 bg-[#8f35b7]/12 text-[#d292f4] text-xs inline-flex items-center">
      {children}
    </span>
  );
}

function VisibilityText({ value }: { value: ProjectVisibility }) {
  return (
    <span className="ml-3 text-[#e2e8f0]">
      {value === 'private' ? '私有' : '公开'}
    </span>
  );
}

function VisibilityToggle({
  value,
  onChange,
}: {
  value: ProjectVisibility;
  onChange: (value: ProjectVisibility) => void;
}) {
  return (
    <div className="ml-3 inline-flex items-center rounded-md border border-white/[0.08] bg-[#17181d] p-1 align-middle">
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

function ProjectDetail({
  project,
  onBack,
}: {
  project: ResearchProject;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'wsi' | 'records'>('overview');

  const [isEditing, setIsEditing] = useState(false);
  const [editableDescription, setEditableDescription] = useState(project.description);
  const [visibility, setVisibility] = useState<ProjectVisibility>(project.visibility);

  const [caseRows, setCaseRows] = useState<ProjectCaseRow[]>(initialProjectCases);
  const [wsiRows, setWsiRows] = useState<ProjectWsiRow[]>(initialProjectWsi);
  const [inferenceRows] = useState<ProjectInferenceRow[]>(initialProjectInferenceRows);

  const [selectedInferenceRecord, setSelectedInferenceRecord] = useState<ProjectInferenceRow | null>(null);
  const [inferenceDrawerMode, setInferenceDrawerMode] = useState<'detail' | 'result'>('detail');
  const [selectedAnalysisVersionId, setSelectedAnalysisVersionId] = useState('analysis-003');

  const tabs = [
    { key: 'overview' as const, label: '概览' },
    { key: 'cases' as const, label: `Case (${caseRows.length})` },
    { key: 'wsi' as const, label: `WSI (${wsiRows.length})` },
    { key: 'records' as const, label: '推理记录' },
  ];

  const cancelEdit = () => {
    setEditableDescription(project.description);
    setVisibility(project.visibility);
    setIsEditing(false);
  };

  const saveEdit = () => {
    setIsEditing(false);
  };

  const addCase = () => {
    const nextIndex = caseRows.length + 1;

    const newCase: ProjectCaseRow = {
      id: `case-${Date.now()}`,
      sampleId: `S-20260520-${String(7000 + nextIndex).padStart(4, '0')}`,
      site: 'stomach',
      category: '新增研究分类',
      samplingMethod: 'biopsy',
      ageGroup: '41-60',
      sex: nextIndex % 2 === 0 ? '女' : '男',
      wsiCount: 0,
      status: '待处理',
    };

    setCaseRows((prev) => [newCase, ...prev]);
  };

  const addWsi = () => {
    const nextIndex = wsiRows.length + 1;

    const newWsi: ProjectWsiRow = {
      id: `wsi-${Date.now()}`,
      name: `New_slide_${String(nextIndex).padStart(3, '0')}.svs`,
      caseId: caseRows[0]?.sampleId || '未绑定 Case',
      stain: 'HE',
      magnification: '40X',
      status: '待分析',
      createdAt: '2026-05-20',
    };

    setWsiRows((prev) => [newWsi, ...prev]);
  };

  const openInferenceDetail = (record: ProjectInferenceRow) => {
    setSelectedInferenceRecord(record);
    setInferenceDrawerMode('detail');
  };

  const closeInferenceDrawer = () => {
    setSelectedInferenceRecord(null);
    setInferenceDrawerMode('detail');
  };

  const renderInferenceStatus = (status: ProjectInferenceRow['status']) => {
    const className =
      status === '成功'
        ? 'border-[#3f6212] bg-[#3f6212]/35 text-[#84cc16]'
        : status === '运行中'
          ? 'border-[#8f35b7]/40 bg-[#8f35b7]/20 text-[#d292f4]'
          : status === '失败'
            ? 'border-[#991b1b] bg-[#991b1b]/30 text-[#fca5a5]'
            : 'border-white/[0.08] bg-white/[0.05] text-[#94a3b8]';

    return (
      <span className={`h-6 px-2 rounded border text-xs inline-flex items-center ${className}`}>
        {status}
      </span>
    );
  };

  const renderAnalysisStatus = (status: AnalysisVersionStatus) => {
    const className =
      status === '分析完成'
        ? 'border-[#3f6212] bg-[#3f6212]/35 text-[#84cc16]'
        : status === '分析中'
          ? 'border-[#8f35b7]/40 bg-[#8f35b7]/20 text-[#d292f4]'
          : 'border-[#991b1b] bg-[#991b1b]/30 text-[#fca5a5]';

    return (
      <span className={`h-6 px-2 rounded border text-xs inline-flex items-center ${className}`}>
        {status}
      </span>
    );
  };

  const detectedNucleiCount = '18,236';
  const positiveCellCount = '4,281';
  const positiveRate = '23.5%';
  const tmeHotspotCount = 8;

  const inferenceSummaryItems = [
    {
      title: '细胞核检测 / 分割',
      model: 'CellViT++',
      content: `检出细胞核 ${detectedNucleiCount} 个，疑似阳性细胞 ${positiveCellCount} 个，阳性率 ${positiveRate}。`,
      status: '分析完成',
    },
    {
      title: '肿瘤微环境分析',
      model: 'TME Analyzer',
      content: `识别 ${tmeHotspotCount} 个免疫细胞高密度热点，提示肿瘤区与间质区分布存在空间异质性。`,
      status: '分析完成',
    },
    {
      title: '组织区域分割',
      model: 'CellViT-SAM',
      content: '正在生成肿瘤区、间质区与坏死样区域边界，后续可用于区域级统计。',
      status: '运行中',
    },
    {
      title: '切片质控',
      model: 'HistoQC',
      content: '等待检测模糊、折叠、气泡、污染与空白区域，质控结果建议作为人工复核参考。',
      status: '排队中',
    },
  ];


  const analysisVersions: AnalysisVersion[] = [
    {
      id: 'analysis-001',
      time: '05-20 14:10',
      title: '初次整体分析',
      status: '分析完成',
      description: '首次纳入 3 张 WSI，完成基础细胞核检测、组织区域分割和初步 TME 分析。',
      wsiCount: 3,
      aiFindingCount: 126,
      detectedNuclei: '18,236',
      positiveCells: '4,281',
      positiveRate: '23.5%',
      tmeHotspots: 8,
      qcTips: 2,
      confidence: '0.91',
      summary: '初次分析提示疑似阳性细胞比例较高，肿瘤区域周边存在 8 个免疫细胞高密度热点，建议进入下一轮参数复跑确认。',
      inferenceRows: initialProjectInferenceRows,
    },
    {
      id: 'analysis-002',
      time: '05-20 15:30',
      title: '参数调整后复跑',
      status: '分析完成',
      description: '将置信度阈值从 0.50 调整到 0.60 后重新运行，减少低置信度细胞和边缘区域误检。',
      wsiCount: 3,
      aiFindingCount: 104,
      detectedNuclei: '17,904',
      positiveCells: '3,545',
      positiveRate: '19.8%',
      tmeHotspots: 6,
      qcTips: 1,
      confidence: '0.94',
      summary: '复跑后疑似阳性细胞数下降，模型输出更加集中，部分低置信度边缘区域被过滤，结果更适合进入项目统计。',
      inferenceRows: [
        { id: 'infer-101', model: 'CellViT++', modelType: '分割 · 检测', status: '成功', queuedAt: '05-20 15:31', duration: '39.8s' },
        { id: 'infer-102', model: 'TME Analyzer', modelType: '肿瘤微环境', status: '成功', queuedAt: '05-20 15:33', duration: '55.1s' },
        { id: 'infer-103', model: 'CellViT-SAM', modelType: '分割', status: '成功', queuedAt: '05-20 15:35', duration: '48.4s' },
        { id: 'infer-104', model: 'HistoQC', modelType: '切片质控', status: '成功', queuedAt: '05-20 15:36', duration: '18.6s' },
      ],
    },
    {
      id: 'analysis-003',
      time: '05-21 09:20',
      title: '新增 WSI 后分析',
      status: '分析完成',
      description: '新增 2 张 IHC / Ki67 WSI 后进行项目级整体分析，补充阳性率、热点区域和质控提示。',
      wsiCount: 5,
      aiFindingCount: 168,
      detectedNuclei: '25,712',
      positiveCells: '5,451',
      positiveRate: '21.2%',
      tmeHotspots: 11,
      qcTips: 3,
      confidence: '0.92',
      summary: '新增切片后，AI 发现数和免疫热点数量增加，Ki67 相关区域提示需要人工复核。当前版本可作为项目阶段性结果。',
      inferenceRows: [
        { id: 'infer-201', model: 'CellViT++', modelType: '分割 · 检测', status: '成功', queuedAt: '05-21 09:22', duration: '52.4s' },
        { id: 'infer-202', model: 'TME Analyzer', modelType: '肿瘤微环境', status: '成功', queuedAt: '05-21 09:24', duration: '71.2s' },
        { id: 'infer-203', model: 'CellViT-SAM', modelType: '分割', status: '成功', queuedAt: '05-21 09:26', duration: '63.5s' },
        { id: 'infer-204', model: 'HistoQC', modelType: '切片质控', status: '成功', queuedAt: '05-21 09:28', duration: '24.1s' },
      ],
    },
    {
      id: 'analysis-004',
      time: '05-22 16:45',
      title: '人工复核版本',
      status: '分析中',
      description: '系统已生成阶段性结果，等待研究人员对 AI 标注、热点区域和质控提示进行确认。',
      wsiCount: 5,
      aiFindingCount: 168,
      detectedNuclei: '25,712',
      positiveCells: '5,451',
      positiveRate: '21.2%',
      tmeHotspots: 11,
      qcTips: 3,
      confidence: '0.92',
      summary: '当前版本进入人工复核阶段，AI 结果仅作为辅助提示，不等同于病理诊断结论。复核后可生成最终项目分析版本。',
      inferenceRows: [
        { id: 'infer-301', model: 'CellViT++', modelType: '分割 · 检测', status: '成功', queuedAt: '05-22 16:45', duration: '52.4s' },
        { id: 'infer-302', model: 'TME Analyzer', modelType: '肿瘤微环境', status: '成功', queuedAt: '05-22 16:45', duration: '71.2s' },
        { id: 'infer-303', model: 'CellViT-SAM', modelType: '分割', status: '成功', queuedAt: '05-22 16:46', duration: '63.5s' },
        { id: 'infer-304', model: 'HistoQC', modelType: '切片质控', status: '排队中', queuedAt: '05-22 16:47', duration: '-' },
      ],
    },
  ];

  const selectedAnalysisVersion =
    analysisVersions.find((item) => item.id === selectedAnalysisVersionId) || analysisVersions[0];

  const selectedInferenceRows = selectedAnalysisVersion.inferenceRows;
  const selectedCompletedCount = selectedInferenceRows.filter((row) => row.status === '成功').length;
  const selectedRunningCount = selectedInferenceRows.filter((row) => row.status === '运行中').length;
  const selectedQueuedCount = selectedInferenceRows.filter((row) => row.status === '排队中').length;
  const selectedFailedCount = selectedInferenceRows.filter((row) => row.status === '失败').length;
  const modelTypeStats = [
    { label: '细胞核检测', value: 1 },
    { label: 'TME 分析', value: 1 },
    { label: '组织分割', value: 1 },
    { label: '切片质控', value: 1 },
  ];
  const findingStats = [
    { label: '细胞核', value: Number(selectedAnalysisVersion.detectedNuclei.replace(/,/g, '')), display: selectedAnalysisVersion.detectedNuclei },
    { label: '阳性细胞', value: Number(selectedAnalysisVersion.positiveCells.replace(/,/g, '')), display: selectedAnalysisVersion.positiveCells },
    { label: 'AI 区域', value: selectedAnalysisVersion.aiFindingCount, display: String(selectedAnalysisVersion.aiFindingCount) },
    { label: '免疫热点', value: selectedAnalysisVersion.tmeHotspots, display: String(selectedAnalysisVersion.tmeHotspots) },
    { label: '质控提示', value: selectedAnalysisVersion.qcTips, display: String(selectedAnalysisVersion.qcTips) },
  ];
  const maxFindingValue = Math.max(...findingStats.map((item) => item.value));

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="h-9 px-3 rounded-md text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all inline-flex items-center gap-2 text-sm mb-3"
        >
          <ArrowLeft size={16} />
          返回项目列表
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="h-6 px-2.5 rounded-md border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-xs font-mono inline-flex items-center">
            {project.id}
          </span>

          {project.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>

        <h1 className="text-[28px] leading-9 font-bold text-[#f8fafc]">{project.name}</h1>
        <p className="text-sm text-[#94a3b8] leading-6 mt-2 max-w-[920px]">
          {editableDescription}
        </p>
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
              <span className="text-[#64748b]">项目编号</span>
              <span className="ml-3 text-[#e2e8f0] font-mono">{project.id}</span>
            </div>

            <div>
              <span className="text-[#64748b]">可见性</span>
              {isEditing ? (
                <VisibilityToggle value={visibility} onChange={setVisibility} />
              ) : (
                <VisibilityText value={visibility} />
              )}
            </div>

            <div>
              <span className="text-[#64748b]">创建时间</span>
              <span className="ml-3 text-[#e2e8f0]">2025-10-04 04:29</span>
            </div>

            <div>
              <span className="text-[#64748b]">更新时间</span>
              <span className="ml-3 text-[#e2e8f0]">{project.updatedAt} 05:54</span>
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

      {activeTab === 'cases' && (
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
          <div className="h-14 px-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[#f1f3f6] text-base font-semibold">项目 Case 列表</div>
              <div className="text-[#64748b] text-xs mt-0.5">当前项目下已纳入的 Case 对象。</div>
            </div>

            <button
              type="button"
              onClick={addCase}
              className="h-8 px-3 rounded-md bg-[#8f35b7] text-white text-xs font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              添加 Case
            </button>
          </div>

          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="bg-[#252730] text-[#cbd5e1]">
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '17%' }}>样本编号</th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '10%' }}>取材部位</th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '16%' }}>研究分类</th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '12%' }}>取材方式</th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '10%' }}>年龄段</th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '8%' }}>性别</th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '9%' }}>WSI 数</th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '10%' }}>状态</th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '8%' }}>操作</th>
              </tr>
            </thead>

            <tbody>
              {caseRows.map((row) => (
                <tr key={row.id} className="border-b border-white/[0.06] text-[#d1d5db] hover:bg-white/[0.025]">
                  <td className="h-11 px-3 font-mono text-[#e5e7eb]">{row.sampleId}</td>
                  <td className="h-11 px-3">{row.site}</td>
                  <td className="h-11 px-3">{row.category}</td>
                  <td className="h-11 px-3">{row.samplingMethod}</td>
                  <td className="h-11 px-3">{row.ageGroup}</td>
                  <td className="h-11 px-3">{row.sex}</td>
                  <td className="h-11 px-3">
                    <span className="h-6 min-w-6 px-2 rounded border border-[#8f35b7]/35 bg-[#8f35b7]/15 text-[#d292f4] inline-flex items-center justify-center text-xs">
                      {row.wsiCount}
                    </span>
                  </td>
                  <td className="h-11 px-3">
                    <span className="h-6 px-2 rounded border border-[#3f6212] bg-[#3f6212]/35 text-[#84cc16] text-xs inline-flex items-center">
                      {row.status}
                    </span>
                  </td>
                  <td className="h-11 px-3">
                    <button type="button" className="text-[#d292f4] hover:text-[#f0b7ff] text-sm">
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'wsi' && (
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
          <div className="h-14 px-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[#f1f3f6] text-base font-semibold">项目 WSI 列表</div>
              <div className="text-[#64748b] text-xs mt-0.5">当前项目下已纳入的 WSI 切片对象。</div>
            </div>

            <button
              type="button"
              onClick={addWsi}
              className="h-8 px-3 rounded-md bg-[#8f35b7] text-white text-xs font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              添加 WSI
            </button>
          </div>

          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="bg-[#252730] text-[#cbd5e1]">
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '24%' }}>WSI 名称</th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '18%' }}>所属 Case</th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '12%' }}>染色</th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '12%' }}>倍率</th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '14%' }}>状态</th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '12%' }}>创建时间</th>
                <th className="h-11 px-3 text-left font-semibold" style={{ width: '8%' }}>操作</th>
              </tr>
            </thead>

            <tbody>
              {wsiRows.map((row) => (
                <tr key={row.id} className="border-b border-white/[0.06] text-[#d1d5db] hover:bg-white/[0.025]">
                  <td className="h-11 px-3 font-mono text-[#e5e7eb]">{row.name}</td>
                  <td className="h-11 px-3">{row.caseId}</td>
                  <td className="h-11 px-3">{row.stain}</td>
                  <td className="h-11 px-3">{row.magnification}</td>
                  <td className="h-11 px-3">
                    <span className="h-6 px-2 rounded border border-[#8f35b7]/35 bg-[#8f35b7]/15 text-[#d292f4] text-xs inline-flex items-center">
                      {row.status}
                    </span>
                  </td>
                  <td className="h-11 px-3">{row.createdAt}</td>
                  <td className="h-11 px-3">
                    <button type="button" className="text-[#d292f4] hover:text-[#f0b7ff] text-sm">
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
              <div className="text-[#64748b] text-sm mb-3">当前分析版本</div>
              <div className="text-[#f1f3f6] text-xl font-bold truncate">{selectedAnalysisVersion.title}</div>
              <div className="text-[#64748b] text-xs mt-2">{selectedAnalysisVersion.time}</div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
              <div className="text-[#64748b] text-sm mb-3">分析 WSI 数</div>
              <div className="text-[#f1f3f6] text-2xl font-bold">{selectedAnalysisVersion.wsiCount}</div>
              <div className="text-[#64748b] text-xs mt-2">当前时间点纳入分析的切片数。</div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
              <div className="text-[#64748b] text-sm mb-3">AI 发现数</div>
              <div className="text-[#f1f3f6] text-2xl font-bold">{selectedAnalysisVersion.aiFindingCount}</div>
              <div className="text-[#64748b] text-xs mt-2">区域、热点、质控提示等聚合发现。</div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
              <div className="text-[#64748b] text-sm mb-3">分析状态</div>
              <div>{renderAnalysisStatus(selectedAnalysisVersion.status)}</div>
              <div className="text-[#64748b] text-xs mt-2">
                成功 {selectedCompletedCount} · 运行中 {selectedRunningCount} · 排队中 {selectedQueuedCount} · 失败 {selectedFailedCount}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-5">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="text-[#f1f3f6] text-base font-semibold">项目分析时间轴</div>
                <div className="text-[#64748b] text-xs mt-1">
                  按项目级整体分析版本排列。点击时间点后，下方图表、摘要和推理记录会切换到该时间点的分析结果。
                </div>
              </div>

              <span className="h-7 px-3 rounded-full border border-[#8f35b7]/35 bg-[#8f35b7]/15 text-[#d292f4] text-xs inline-flex items-center">
                当前：{selectedAnalysisVersion.status}
              </span>
            </div>

            <div className="relative px-2 pb-1">
              <div className="absolute left-8 right-8 top-[18px] h-px bg-white/[0.08]" />
              <div className="grid grid-cols-4 gap-4 relative">
                {analysisVersions.map((version) => {
                  const isSelected = selectedAnalysisVersion.id === version.id;

                  return (
                    <button
                      key={version.id}
                      type="button"
                      onClick={() => setSelectedAnalysisVersionId(version.id)}
                      className={`relative text-left rounded-xl border p-4 transition-all ${
                        isSelected
                          ? 'border-[#8f35b7]/55 bg-[#8f35b7]/15 shadow-[0_0_0_1px_rgba(143,53,183,0.15)]'
                          : 'border-white/[0.08] bg-[#17181d] hover:border-[#8f35b7]/35 hover:bg-[#1f2024]'
                      }`}
                    >
                      <div
                        className={`absolute -top-[2px] left-4 w-4 h-4 rounded-full border-2 ${
                          isSelected
                            ? 'border-[#d292f4] bg-[#8f35b7]'
                            : version.status === '分析完成'
                              ? 'border-[#84cc16] bg-[#3f6212]'
                              : version.status === '分析中'
                                ? 'border-[#d292f4] bg-[#8f35b7]'
                                : 'border-[#fca5a5] bg-[#991b1b]'
                        }`}
                      />

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="text-[#d292f4] text-xs font-mono">{version.time}</div>
                        {renderAnalysisStatus(version.status)}
                      </div>

                
                     
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-5">
              <div className="text-[#f1f3f6] text-base font-semibold mb-1">任务状态分布</div>
              <div className="text-[#64748b] text-xs mb-5">当前时间点下模型执行状态。</div>

              <div className="flex items-center gap-5">
                <div className="relative w-[132px] h-[132px] rounded-full bg-[#17181d] border border-white/[0.08] flex items-center justify-center">
                  <div className="absolute inset-3 rounded-full border-[12px] border-[#8f35b7]/60" />
                  <div className="absolute inset-3 rounded-full border-[12px] border-t-[#84cc16] border-r-[#84cc16] border-b-transparent border-l-transparent rotate-45" />
                  <div className="w-[72px] h-[72px] rounded-full bg-[#202126] border border-white/[0.08] flex flex-col items-center justify-center z-10">
                    <div className="text-[#f1f3f6] text-xl font-bold">{selectedInferenceRows.length}</div>
                    <div className="text-[#64748b] text-xs">任务</div>
                  </div>
                </div>

                <div className="flex-1 space-y-3 text-sm">
                  {[
                    ['成功', selectedCompletedCount, 'bg-[#84cc16]'],
                    ['运行中', selectedRunningCount, 'bg-[#d292f4]'],
                    ['排队中', selectedQueuedCount, 'bg-[#64748b]'],
                    ['失败', selectedFailedCount, 'bg-[#fca5a5]'],
                  ].map(([label, value, dotClass]) => (
                    <div key={label as string} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#94a3b8]">
                        <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                        {label as string}
                      </div>
                      <div className="text-[#e2e8f0] font-medium">{value as number}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-5">
              <div className="text-[#f1f3f6] text-base font-semibold mb-1">模型类型使用分布</div>
              <div className="text-[#64748b] text-xs mb-5">当前版本使用的模型能力组合。</div>

              <div className="space-y-4">
                {modelTypeStats.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-[#94a3b8]">{item.label}</span>
                      <span className="text-[#e2e8f0]">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full bg-[#8f35b7]" style={{ width: `${item.value * 25}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-5">
              <div className="text-[#f1f3f6] text-base font-semibold mb-1">关键发现分布</div>
              <div className="text-[#64748b] text-xs mb-5">当前时间点聚合的 AI 发现结构。</div>

              <div className="space-y-3">
                {findingStats.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-[#94a3b8]">{item.label}</span>
                      <span className="text-[#e2e8f0] font-medium">{item.display}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#d292f4]"
                        style={{ width: `${Math.max((item.value / maxFindingValue) * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-5">
              <div className="text-[#f1f3f6] text-base font-semibold mb-1">当前版本结果快照</div>
              <div className="text-[#64748b] text-xs mb-5">点击时间轴后，此处同步切换。</div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-white/[0.08] bg-[#17181d] p-3">
                  <div className="text-[#64748b] mb-1">细胞核</div>
                  <div className="text-[#e2e8f0] text-lg font-bold">{selectedAnalysisVersion.detectedNuclei}</div>
                </div>
                <div className="rounded-lg border border-white/[0.08] bg-[#17181d] p-3">
                  <div className="text-[#64748b] mb-1">阳性细胞</div>
                  <div className="text-[#e2e8f0] text-lg font-bold">{selectedAnalysisVersion.positiveCells}</div>
                </div>
                <div className="rounded-lg border border-white/[0.08] bg-[#17181d] p-3">
                  <div className="text-[#64748b] mb-1">阳性率</div>
                  <div className="text-[#e2e8f0] text-lg font-bold">{selectedAnalysisVersion.positiveRate}</div>
                </div>
                <div className="rounded-lg border border-white/[0.08] bg-[#17181d] p-3">
                  <div className="text-[#64748b] mb-1">平均置信度</div>
                  <div className="text-[#e2e8f0] text-lg font-bold">{selectedAnalysisVersion.confidence}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-[#f1f3f6] text-base font-semibold">当前时间点分析摘要</div>
                <div className="text-[#64748b] text-xs mt-1">
                  以下内容为该时间点下的 AI 分析提示，不等同于病理诊断结论。
                </div>
              </div>

              <span className="h-7 px-3 rounded-full border border-[#8f35b7]/35 bg-[#8f35b7]/15 text-[#d292f4] text-xs inline-flex items-center">
                {selectedAnalysisVersion.status === '分析中' ? '分析进行中' : '建议人工复核'}
              </span>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4 mb-3">
              <div className="text-[#f1f3f6] text-sm font-semibold mb-2">{selectedAnalysisVersion.title}</div>
              <div className="text-[#94a3b8] text-sm leading-6">{selectedAnalysisVersion.summary}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {inferenceSummaryItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="text-[#f1f3f6] text-sm font-semibold">{item.title}</div>
                      <div className="text-[#64748b] text-xs mt-1">{item.model}</div>
                    </div>

                    <span
                      className={`h-6 px-2 rounded border text-xs inline-flex items-center ${
                        item.status === '已完成'
                          ? 'border-[#3f6212] bg-[#3f6212]/35 text-[#84cc16]'
                          : item.status === '运行中'
                            ? 'border-[#8f35b7]/40 bg-[#8f35b7]/20 text-[#d292f4]'
                            : 'border-white/[0.08] bg-white/[0.05] text-[#94a3b8]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="text-[#94a3b8] text-sm leading-6">{item.content}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
            <div className="h-14 px-4 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-[#f1f3f6] text-base font-semibold">当前时间点推理记录</div>
                <div className="text-[#64748b] text-xs mt-0.5">
                  展示当前分析时间点下已提交的 AI 分析模型、执行状态、排队时间与耗时。
                </div>
              </div>
            </div>

            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="bg-[#252730] text-[#cbd5e1]">
                  <th className="h-11 px-3 text-left font-semibold" style={{ width: '20%' }}>模型</th>
                  <th className="h-11 px-3 text-left font-semibold" style={{ width: '18%' }}>类型</th>
                  <th className="h-11 px-3 text-left font-semibold" style={{ width: '12%' }}>状态</th>
                  <th className="h-11 px-3 text-left font-semibold" style={{ width: '16%' }}>核心发现</th>
                  <th className="h-11 px-3 text-left font-semibold" style={{ width: '14%' }}>排队时间</th>
                  <th className="h-11 px-3 text-left font-semibold" style={{ width: '10%' }}>耗时</th>
                  <th className="h-11 px-3 text-left font-semibold" style={{ width: '10%' }}>操作</th>
                </tr>
              </thead>

              <tbody>
                {selectedInferenceRows.map((row) => {
                  const finding =
                    row.model === 'CellViT++'
                      ? `细胞核 ${selectedAnalysisVersion.detectedNuclei} · 阳性率 ${selectedAnalysisVersion.positiveRate}`
                      : row.model === 'TME Analyzer'
                        ? `免疫热点 ${selectedAnalysisVersion.tmeHotspots} · 空间异质性提示`
                        : row.model === 'CellViT-SAM'
                          ? selectedAnalysisVersion.status === '分析中' ? '组织边界分析中' : '组织边界已生成'
                          : selectedAnalysisVersion.qcTips > 0 ? `质控提示 ${selectedAnalysisVersion.qcTips}` : '无明显质控异常';

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-white/[0.06] text-[#d1d5db] hover:bg-white/[0.025]"
                    >
                      <td className="h-11 px-3 text-[#e5e7eb] font-medium">{row.model}</td>
                      <td className="h-11 px-3">
                        <span className="h-6 px-2 rounded border border-white/[0.08] bg-white/[0.05] text-[#94a3b8] text-xs inline-flex items-center">
                          {row.modelType}
                        </span>
                      </td>
                      <td className="h-11 px-3">{renderInferenceStatus(row.status)}</td>
                      <td className="h-11 px-3 text-[#94a3b8] truncate">{finding}</td>
                      <td className="h-11 px-3">{row.queuedAt}</td>
                      <td className="h-11 px-3">{row.duration}</td>
                      <td className="h-11 px-3">
                        <button
                          type="button"
                          onClick={() => openInferenceDetail(row)}
                          className="text-[#d292f4] hover:text-[#f0b7ff] text-sm"
                        >
                          详情
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedInferenceRecord && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="h-full w-[560px] border-l border-white/[0.08] bg-[#202126] shadow-[0_0_60px_rgba(0,0,0,0.45)] flex flex-col">
            <div className="h-16 px-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div>
                <div className="text-[#f1f3f6] text-lg font-bold">
                  {inferenceDrawerMode === 'detail' ? '推理任务详情' : 'AI 结果查看'}
                </div>
                <div className="text-[#64748b] text-xs mt-1">{selectedInferenceRecord.id}</div>
              </div>

              <button
                type="button"
                onClick={closeInferenceDrawer}
                className="w-8 h-8 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all"
              >
                ×
              </button>
            </div>

            {inferenceDrawerMode === 'detail' ? (
              <>
                <div className="flex-1 overflow-auto p-5 space-y-5">
                  <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
                    <div className="text-[#f1f3f6] text-sm font-semibold mb-3">任务信息</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-[#64748b] mb-1">模型</div>
                        <div className="text-[#e2e8f0]">{selectedInferenceRecord.model}</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">类型</div>
                        <div className="text-[#e2e8f0]">{selectedInferenceRecord.modelType}</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">状态</div>
                        <div>{renderInferenceStatus(selectedInferenceRecord.status)}</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">耗时</div>
                        <div className="text-[#e2e8f0]">{selectedInferenceRecord.duration}</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">排队时间</div>
                        <div className="text-[#e2e8f0]">{selectedInferenceRecord.queuedAt}</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">模型版本</div>
                        <div className="text-[#e2e8f0]">v1.2.0</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
                    <div className="text-[#f1f3f6] text-sm font-semibold mb-3">输入对象</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-[#64748b] mb-1">研究项目</div>
                        <div className="text-[#e2e8f0]">{project.name}</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">分析范围</div>
                        <div className="text-[#e2e8f0]">全切片</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">Case 数</div>
                        <div className="text-[#e2e8f0]">{caseRows.length}</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">WSI 数</div>
                        <div className="text-[#e2e8f0]">{wsiRows.length}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
                    <div className="text-[#f1f3f6] text-sm font-semibold mb-3">参数配置</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-[#64748b] mb-1">分析区域</div>
                        <div className="text-[#e2e8f0]">自动检测组织区域</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">置信度阈值</div>
                        <div className="text-[#e2e8f0]">0.5</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">区域选择</div>
                        <div className="text-[#e2e8f0]">自动选择</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">输出内容</div>
                        <div className="text-[#e2e8f0]">图层 / 统计摘要</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
                    <div className="text-[#f1f3f6] text-sm font-semibold mb-3">结果摘要</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-[#64748b] mb-1">检出细胞数</div>
                        <div className="text-[#e2e8f0]">18,236</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">阳性区域</div>
                        <div className="text-[#e2e8f0]">8</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">平均置信度</div>
                        <div className="text-[#e2e8f0]">0.91</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">结果状态</div>
                        <div className="text-[#e2e8f0]">已生成</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-16 px-5 border-t border-white/[0.06] bg-[#17181d] flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    className="h-9 px-4 rounded-md border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all"
                  >
                    重新推理
                  </button>

                  <button
                    type="button"
                    onClick={() => setInferenceDrawerMode('result')}
                    className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all"
                  >
                    查看结果
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 overflow-auto p-5 space-y-5">
                  <button
                    type="button"
                    onClick={() => setInferenceDrawerMode('detail')}
                    className="h-8 px-3 rounded-md text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all inline-flex items-center gap-2 text-sm"
                  >
                    <ArrowLeft size={15} />
                    返回任务详情
                  </button>

                  <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
                    <div className="text-[#f1f3f6] text-sm font-semibold mb-3">AI 结果摘要</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-[#64748b] mb-1">模型</div>
                        <div className="text-[#e2e8f0]">{selectedInferenceRecord.model}</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">结果状态</div>
                        <div className="text-[#e2e8f0]">已生成</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">分析对象</div>
                        <div className="text-[#e2e8f0]">{wsiRows.length} 张 WSI</div>
                      </div>

                      <div>
                        <div className="text-[#64748b] mb-1">平均置信度</div>
                        <div className="text-[#e2e8f0]">0.91</div>
                      </div>
                    </div>
                  </div>

                  <div className="h-[220px] rounded-xl border border-dashed border-[#8f35b7]/45 bg-[#8f35b7]/10 flex items-center justify-center text-center text-[#d292f4] leading-7">
                    WSI 结果预览占位
                    <br />
                    后续展示 AI 标注图层、热力图、区域边界、细胞检测框。
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
                    <div className="text-[#f1f3f6] text-sm font-semibold mb-3">统计结果</div>
                    <div className="space-y-3 text-sm">
                      {[
                        ['检出细胞数', '18,236'],
                        ['阳性细胞数', '4,281'],
                        ['阳性率', '23.5%'],
                        ['检出区域数', '126'],
                        ['高风险区域', '8'],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between border-b border-white/[0.06] pb-2 last:border-0 last:pb-0">
                          <span className="text-[#94a3b8]">{label}</span>
                          <span className="text-[#e2e8f0] font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
                    <div className="text-[#f1f3f6] text-sm font-semibold mb-3">输出内容</div>
                    <div className="grid grid-cols-2 gap-2">
                      {['标注图层', '统计 CSV', '结果 JSON', '缩略图快照'].map((item) => (
                        <div
                          key={item}
                          className="h-9 rounded-md border border-white/[0.08] bg-[#202126] text-[#cbd5e1] text-sm flex items-center justify-center"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="h-16 px-5 border-t border-white/[0.06] bg-[#17181d] flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    className="h-9 px-4 rounded-md border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all"
                  >
                    下载结果
                  </button>

                  <button
                    type="button"
                    className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all"
                  >
                    打开工作台
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
function ProjectCard({
  project,
  onView,
}: {
  project: ResearchProject;
  onView: (project: ResearchProject) => void;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-5 hover:border-[#8f35b7]/45 hover:bg-[#24252b] transition-all duration-150">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[#64748b] text-xs mb-3">
            <FolderOpen size={14} className="text-[#d292f4]" />
            <span className="font-mono">{project.id}</span>
          </div>

          <h2 className="text-[#f1f3f6] text-lg font-bold truncate">
            {project.name}
          </h2>
        </div>

        <span className="h-7 px-2.5 rounded-full bg-[#35c96d]/15 text-[#83e5a8] text-xs font-semibold inline-flex items-center shrink-0">
          公开
        </span>
      </div>

      <p className="text-[#94a3b8] text-sm leading-6 line-clamp-2 mb-4">
        {project.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {project.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 border-t border-white/[0.06] pt-4">
        <div>
          <div className="text-[#64748b] text-xs mb-1">Case</div>
          <div className="flex items-center gap-1.5 text-[#e2e8f0] text-base font-semibold">
            <FolderOpen size={15} className="text-[#94a3b8]" />
            {project.caseCount}
          </div>
        </div>

        <div>
          <div className="text-[#64748b] text-xs mb-1">WSI</div>
          <div className="flex items-center gap-1.5 text-[#e2e8f0] text-base font-semibold">
            <FileText size={15} className="text-[#94a3b8]" />
            {project.wsiCount}
          </div>
        </div>

        <div>
          <div className="text-[#64748b] text-xs mb-1">推理</div>
          <div className="flex items-center gap-1.5 text-[#e2e8f0] text-base font-semibold">
            <FlaskConical size={15} className="text-[#94a3b8]" />
            {project.inferenceCount}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.06]">
        <div className="text-[#64748b] text-xs">更新于 {project.updatedAt}</div>

        <button
          type="button"
          onClick={() => onView(project)}
          className="h-8 px-3 rounded-md border border-[#8f35b7]/35 bg-[#8f35b7]/10 text-[#d292f4] text-xs font-medium hover:bg-[#8f35b7]/18 transition-all"
        >
          查看项目
        </button>
      </div>
    </div>
  );
}

export default function WorkbenchResearchProjects() {
  const [keyword, setKeyword] = useState('');
  const [projectList, setProjectList] = useState<ResearchProject[]>(initialProjects);
  const [selectedProject, setSelectedProject] = useState<ResearchProject | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectTags, setNewProjectTags] = useState('');
  const [newProjectVisibility, setNewProjectVisibility] = useState<ProjectVisibility>('private');

  const filteredProjects = projectList.filter((project) => {
    if (!keyword.trim()) return true;

    const text = `${project.id} ${project.name} ${project.tags.join(' ')}`.toLowerCase();
    return text.includes(keyword.trim().toLowerCase());
  });

  const resetCreateForm = () => {
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectTags('');
    setNewProjectVisibility('private');
  };

  const closeCreateModal = () => {
    resetCreateForm();
    setShowCreateModal(false);
  };

  const createProject = () => {
    if (!newProjectName.trim()) return;

    const nextIndex = projectList.length + 1;

    const nextProject: ResearchProject = {
      id: `PRJ-2026-${String(nextIndex).padStart(3, '0')}`,
      name: newProjectName.trim(),
      description: newProjectDescription.trim() || '暂无项目描述。',
      tags: newProjectTags
        .split(/[，,]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      caseCount: 0,
      wsiCount: 0,
      inferenceCount: 0,
      updatedAt: '2026-05-20',
      visibility: newProjectVisibility,
    };

    setProjectList((prev) => [nextProject, ...prev]);
    setSelectedProject(nextProject);
    closeCreateModal();
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#0f1014] text-[#f1f3f6] px-6 py-5">
      {selectedProject ? (
        <ProjectDetail
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
        />
      ) : (
        <>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[26px] leading-8 font-bold">研究项目管理</h1>
              <p className="text-sm text-[#64748b] mt-1">
                用于管理研究项目，并组织 Case 与 WSI；研究项目仅作为研究维度，不直接绑定临床诊断流程。
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="h-9 w-[260px] rounded-md border border-white/[0.08] bg-[#17181d] px-3 flex items-center gap-2">
                <Search size={15} className="text-[#64748b]" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  className="w-full bg-transparent outline-none text-sm text-[#cbd5e1] placeholder:text-[#64748b]"
                  placeholder="搜索项目名 / 编号"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
              >
                <Plus size={16} />
                新建项目
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onView={setSelectedProject}
              />
            ))}
          </div>
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-[640px] rounded-2xl border border-white/[0.08] bg-[#202126] shadow-[0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="h-16 px-6 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-[#f1f3f6] text-lg font-bold">新建研究项目</div>
                <div className="text-[#64748b] text-xs mt-1">
                  创建后项目会进入研究项目管理列表，当前仅为前端演示。
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
                  项目名称 <span className="text-[#ff8f8f]">*</span>
                </label>
                <input
                  value={newProjectName}
                  onChange={(event) => setNewProjectName(event.target.value)}
                  className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  placeholder="请输入研究项目名称"
                />
              </div>

              <div>
                <label className="block text-sm text-[#cbd5e1] mb-2">项目描述</label>
                <textarea
                  value={newProjectDescription}
                  onChange={(event) => setNewProjectDescription(event.target.value)}
                  className="w-full min-h-[96px] rounded-md border border-white/[0.08] bg-[#17181d] px-3 py-2 text-sm leading-6 text-[#e2e8f0] outline-none focus:border-[#8f35b7] resize-none"
                  placeholder="请输入项目研究目的、纳入范围或说明"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">项目标签</label>
                  <input
                    value={newProjectTags}
                    onChange={(event) => setNewProjectTags(event.target.value)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                    placeholder="例如：乳腺, HER2, IHC"
                  />
                  <div className="text-[#64748b] text-xs mt-1">
                    多个标签可用逗号分隔。
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">可见性</label>
                  <div className="inline-flex items-center rounded-md border border-white/[0.08] bg-[#17181d] p-1">
                    <button
                      type="button"
                      onClick={() => setNewProjectVisibility('private')}
                      className={`h-8 px-4 rounded text-sm font-medium transition-all ${
                        newProjectVisibility === 'private'
                          ? 'bg-[#8f35b7] text-white'
                          : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04]'
                      }`}
                    >
                      私有
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewProjectVisibility('public')}
                      className={`h-8 px-4 rounded text-sm font-medium transition-all ${
                        newProjectVisibility === 'public'
                          ? 'bg-[#8f35b7] text-white'
                          : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04]'
                      }`}
                    >
                      公开
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-4">
                <div className="text-[#d292f4] text-sm font-semibold mb-1">
                  创建规则说明
                </div>
                <div className="text-[#94a3b8] text-xs leading-6">
                  研究项目用于组织 Case 与 WSI。项目创建后不会自动绑定 Case，需要后续在项目详情中的 Case 页签进行添加。
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
                onClick={createProject}
                disabled={!newProjectName.trim()}
                className={`h-9 px-4 rounded-md text-sm font-medium transition-all ${
                  newProjectName.trim()
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