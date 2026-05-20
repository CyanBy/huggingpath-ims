import { useState, useRef, useCallback, useEffect } from 'react';

import type { FC } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Play,
  Settings,
  Trash2,
  Download,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Slide {
  id: string;
  name: string;
  stain: string;
  magnification: string;
  size: string;
  status: 'analyzed' | 'pending';
}

interface CaseItem {
  id: string;
  pathologyNo: string;
  patientName: string;
  gender: string;
  age: number;
  organ: string;
  caseType: string;
  slideCount: number;
  date: string;
  slides: Slide[];
}

type CaseQueueItem = CaseItem & {
  queueType: 'case';
};

interface StandaloneSlideQueueItem {
  queueType: 'slide';
  id: string;
  fileName: string;
  size: string;
  progress: number;
  status: 'uploading' | 'ready';
}

interface ProjectQueueItem {
  queueType: 'project';
  id: string;
  projectNo: string;
  name: string;
  caseCount: number;
  wsiCount: number;
  modelCount: number;
  status: 'ready';
}

type QueueItem = CaseQueueItem | StandaloneSlideQueueItem | ProjectQueueItem;

interface ModelItem {
  id: string;
  name: string;
  status: 'active' | 'not_configured';
  tags: string[];
  summary: string;
}

interface TaskItem {
  id: string;
  modelName: string;
  status: 'completed' | 'running' | 'failed' | 'queued';
  progress: number;
  time: string;
  featureCount?: number;
  error?: string;
}

interface LayerItem {
  id: string;
  name: string;
  color: string;
  count: number;
  visible: boolean;
  opacity: number;
}

interface ClassificationRow {
  type: string;
  color: string;
  count: number;
  density: string;
  percentage: string;
}

/* ------------------------------------------------------------------ */
/* Mock Data                                                           */
/* ------------------------------------------------------------------ */

const toCaseQueueItem = (item: CaseItem): CaseQueueItem => ({
  ...item,
  queueType: 'case',
});

const MOCK_UPLOAD_FILES = [
  {
    fileName: 'Temporary_AI_Slide_001.svs',
    size: '1.4 GB',
  },
  {
    fileName: 'Temporary_AI_Slide_002.sdpc',
    size: '856 MB',
  },
];

const MOCK_LIBRARY_CASES = [
  {
    id: 'CAS-2025-003',
    pathologyNo: '25GA006219',
    patientName: '患者F',
    gender: '女',
    age: 52,
    organ: '胃',
    caseType: '活检',
    slideCount: 2,
    date: '2025.01.13',
    slides: [
      { id: 'SL-006', name: 'HE_gastric_02.svs', stain: 'HE', magnification: '40X', size: '1.3 GB', status: 'pending' as const },
      { id: 'SL-007', name: 'IHC_HER2_01.svs', stain: 'HER2', magnification: '40X', size: '1.0 GB', status: 'pending' as const },
    ],
  },
];
const MOCK_RESEARCH_PROJECTS: ProjectQueueItem[] = [
  {
    queueType: 'project',
    id: 'PRJ-2026-001',
    projectNo: 'PRJ-2026-001',
    name: '乳腺癌 HER2 队列研究',
    caseCount: 12,
    wsiCount: 33,
    modelCount: 3,
    status: 'ready',
  },
  {
    queueType: 'project',
    id: 'PRJ-2026-002',
    projectNo: 'PRJ-2026-002',
    name: '结直肠癌微环境多模态分析',
    caseCount: 9,
    wsiCount: 31,
    modelCount: 2,
    status: 'ready',
  },
];
const MOCK_MODELS: ModelItem[] = [
  { id: 'mod-1', name: 'CellViT++', status: 'active', tags: ['分割', '检测'], summary: '细胞核检测与分割模型' },
  { id: 'mod-2', name: 'TME Analyzer', status: 'active', tags: ['肿瘤微环境'], summary: '肿瘤微环境分析模型' },
  { id: 'mod-3', name: 'CellViT-SAM', status: 'not_configured', tags: ['分割'], summary: '基于SAM的细胞分割' },
];

const MOCK_TASKS: TaskItem[] = [
  { id: 'task-1', modelName: 'CellViT++', status: 'completed', progress: 100, time: '5m 23s', featureCount: 2456 },
  { id: 'task-2', modelName: 'TME Analyzer', status: 'running', progress: 45, time: '3m 12s' },
  { id: 'task-3', modelName: 'Cell Detection', status: 'failed', progress: 0, time: '—', error: '模型权重文件不存在' },
];

const MOCK_LAYERS: LayerItem[] = [
  { id: 'layer-1', name: 'CellViT++ 细胞核', color: '#22c55e', count: 2456, visible: true, opacity: 80 },
  { id: 'layer-2', name: 'TME 肿瘤区域', color: '#f87171', count: 12, visible: false, opacity: 60 },
  { id: 'layer-3', name: '炎症灶', color: '#f59e0b', count: 8, visible: false, opacity: 50 },
];

const CLASSIFICATION_DATA: ClassificationRow[] = [
  { type: '肿瘤细胞', color: '#22c55e', count: 25190, density: '12.5 /mm²', percentage: '50.2%' },
  { type: '炎性细胞', color: '#f59e0b', count: 7821, density: '3.7 /mm²', percentage: '15.6%' },
  { type: '间质细胞', color: '#06b6d4', count: 12456, density: '6.2 /mm²', percentage: '24.8%' },
  { type: '正常细胞', color: '#7c2bc6', count: 4712, density: '2.3 /mm²', percentage: '9.4%' },
];



const CLINICAL_PARAMS = [
  { id: 'roi', label: '分析区域', type: 'select' as const, default: 'auto', options: ['全片分析', '自动检测组织区域', '手动选择ROI'], description: '选择需要AI分析的组织区域范围' },
  { id: 'confidence', label: '置信度阈值', type: 'range' as const, default: 0.5, min: 0.1, max: 0.9, step: 0.01, description: '阈值越高，结果越严格' },
  { id: 'analysis_region', label: '分析区域选择', type: 'select' as const, default: 'auto', options: ['自动选择', '上皮区域', '全组织区域'], description: '自动或手动选择分析区域' },
];

const MAGNIFICATIONS = [0.5, 1, 4, 10, 20, 40, 80];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

const ToggleSwitch: FC<{ checked: boolean; onChange: (v: boolean) => void; size?: 'sm' | 'md' }> = ({
  checked,
  onChange,
  size = 'md',
}) => {
  const w = size === 'sm' ? 'w-10' : 'w-11';
  const h = size === 'sm' ? 'h-[22px]' : 'h-6';
  const thumb = size === 'sm' ? 'w-[18px] h-[18px]' : 'w-5 h-5';
  const translate = size === 'sm' ? 'translate-x-[18px]' : 'translate-x-5';
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors duration-200 cursor-pointer',
        w,
        h,
        checked ? 'bg-[#8f35b7]' : 'bg-[#374151]'
      )}
    >
      <span
        className={cn(
          'inline-block rounded-full bg-white transition-transform duration-200',
          thumb,
          checked ? translate : 'translate-x-0.5'
        )}
      />
    </button>
  );
};

const SectionHeader: FC<{ title: string; action?: React.ReactNode }> = ({ title, action }) => (
  <div className="flex items-center justify-between mb-3">
    <h4 className="text-[#e2e8f0] font-semibold text-[15px]">{title}</h4>
    {action && <div>{action}</div>}
  </div>
);

const PanelSection: FC<{ children: React.ReactNode; className?: string; last?: boolean }> = ({
  children,
  className,
  last,
}) => (
  <div className={cn('p-4', !last && 'border-b border-white/[0.06]', className)}>
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/* Pie Chart (SVG)                                                     */
/* ------------------------------------------------------------------ */

const PieChart: FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;
  const radius = 50;
  const center = 60;

  const paths = data.map((slice) => {
    const startAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;
    cumulative += slice.value;
    const endAngle = (cumulative / total) * Math.PI * 2 - Math.PI / 2;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const largeArc = slice.value / total > 0.5 ? 1 : 0;

    return (
      <path
        key={slice.label}
        d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={slice.color}
        stroke="#111217"
        strokeWidth={2}
        className="hover:opacity-80 transition-opacity cursor-pointer"
      />
    );
  });

  return (
    <svg viewBox="0 0 120 120" className="w-full h-[140px]">
      {paths}
      <text x={center} y={center - 4} textAnchor="middle" className="fill-[#e2e8f0] text-[13px] font-bold">
        {total.toLocaleString()}
      </text>
      <text x={center} y={center + 12} textAnchor="middle" className="fill-[#94a3b8] text-[10px]">
        总数
      </text>
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Main Component                                                      */
/* ------------------------------------------------------------------ */
const GUEST_ANALYSIS_LIMIT = 3;
const Workbench: FC = () => {
  /* ---- Mode ---- */
  const navigate = useNavigate();
const location = useLocation();

const [isLoggedIn, setIsLoggedIn] = useState(() => {
  return localStorage.getItem('isLoggedIn') === 'true';
});

const [guestAnalysisCount, setGuestAnalysisCount] = useState(() => {
  return Number(localStorage.getItem('guestAnalysisCount') || '0');
});

const [showLoginRequired, setShowLoginRequired] = useState(false);


  /* ---- Case / Slide ---- */
 
const [expandedCase, setExpandedCase] = useState<string>('');
const [selectedSlide, setSelectedSlide] = useState<string>('');
const [queueCases, setQueueCases] = useState<QueueItem[]>([]);

const [showAddTaskModal, setShowAddTaskModal] = useState(false);
const [addTaskType, setAddTaskType] = useState<'slide' | 'case' | 'project'>('slide');

  /* ---- Model ---- */
  const [selectedModel, setSelectedModel] = useState<string>('mod-1');

  /* ---- WSI Viewer ---- */
  const [zoom, setZoom] = useState(0.35);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentMag, setCurrentMag] = useState(20);
  const [showGrid, setShowGrid] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  /* ---- Tasks ---- */
  const [tasks, setTasks] = useState<TaskItem[]>(MOCK_TASKS);
  const [selectedTask, setSelectedTask] = useState<string>('task-1');

  /* ---- Layers ---- */
  const [layers, setLayers] = useState<LayerItem[]>(MOCK_LAYERS);
  const [viewMode, setViewMode] = useState<'single' | 'merge'>('single');
  const [overlayOpacity, setOverlayOpacity] = useState(70);

  /* ---- Report ---- */
  const [showReport, setShowReport] = useState(false);

  /* ---- Parameters ---- */
  const [paramValues, setParamValues] = useState<Record<string, any>>({
    batch_size: 16,
    confidence: 0.5,
    roi: 'auto',
    min_size: 5,
    gpu_accelerate: true,
    nms_threshold: 0.3,
    analysis_region: 'auto',
  });

  /* ---- WSI Mouse handlers ---- */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoomIn = () => {
    setZoom((z) => {
      const nz = Math.min(z * 1.4, 5);
      setCurrentMag(Math.round(20 * nz * 10) / 10);
      if (nz > 1) setShowGrid(true);
      return nz;
    });
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const nz = Math.max(z / 1.4, 0.1);
      setCurrentMag(Math.round(20 * nz * 10) / 10);
      if (nz <= 1) setShowGrid(false);
      return nz;
    });
  };

  const handleMagClick = (mag: number) => {
    const ratio = mag / 20;
    setZoom(ratio);
    setCurrentMag(mag);
    if (ratio > 1) setShowGrid(true);
    else setShowGrid(false);
  };

  const handleResetView = () => {
    setZoom(0.35);
    setPan({ x: 0, y: 0 });
    setCurrentMag(7);
    setShowGrid(false);
  };

  /* ---- Task simulation ---- */
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.status === 'running') {
            const np = Math.min(t.progress + 2, 100);
            return { ...t, progress: np, status: np >= 100 ? 'completed' : 'running', featureCount: np >= 100 ? 1823 : t.featureCount };
          }
          return t;
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);
/* ---- Upload simulation ---- */
useEffect(() => {
  const interval = setInterval(() => {
    setQueueCases((prev) =>
      prev.map((item) => {
        if (item.queueType !== 'slide' || item.status !== 'uploading') return item;

        const nextProgress = Math.min(item.progress + 12, 100);

        return {
          ...item,
          progress: nextProgress,
          status: nextProgress >= 100 ? 'ready' : 'uploading',
        };
      }),
    );
  }, 450);

  return () => clearInterval(interval);
}, []);
  /* ---- Derived ---- */
const activeCase = queueCases.find(
  (c): c is CaseQueueItem => c.queueType === 'case' && c.id === expandedCase,
);

const activeSlide = activeCase?.slides.find((s) => s.id === selectedSlide);

const selectedStandaloneSlide = queueCases.find(
  (item): item is StandaloneSlideQueueItem =>
    item.queueType === 'slide' && item.id === selectedSlide,
);
const handleOpenAddTaskModal = () => {
  setAddTaskType('slide');
  setShowAddTaskModal(true);
};

const handleConfirmAddTask = () => {
  if (addTaskType === 'slide') {
    const timestamp = Date.now();

    const newSlides: StandaloneSlideQueueItem[] = MOCK_UPLOAD_FILES.map((file, index) => ({
      queueType: 'slide',
      id: `standalone-slide-${timestamp}-${index}`,
      fileName: file.fileName,
      size: file.size,
      progress: 0,
      status: 'uploading',
    }));

    setQueueCases((prev) => [...newSlides, ...prev]);
    setSelectedSlide(newSlides[0].id);
    setExpandedCase('');
    setShowAddTaskModal(false);
    return;
  }

  if (addTaskType === 'case') {
    const newCases = MOCK_LIBRARY_CASES.map(toCaseQueueItem);

    setQueueCases((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const filtered = newCases.filter((item) => !existingIds.has(item.id));

      if (filtered.length === 0) return prev;

      return [...filtered, ...prev];
    });

    setExpandedCase(newCases[0].id);
    setSelectedSlide(newCases[0].slides[0]?.id || '');
    setShowAddTaskModal(false);
    return;
  }

  if (addTaskType === 'project') {
    const selectedProjects = MOCK_RESEARCH_PROJECTS;

    setQueueCases((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const filtered = selectedProjects.filter((item) => !existingIds.has(item.id));

      if (filtered.length === 0) return prev;

      return [...filtered, ...prev];
    });

    setExpandedCase('');
    setSelectedSlide('');
    setShowAddTaskModal(false);
  }
};

  const createAnalysisTask = () => {
  const selectedModelItem = MOCK_MODELS.find((model) => model.id === selectedModel);

  const newTask: TaskItem = {
    id: `task-${Date.now()}`,
    modelName: selectedModelItem?.name || 'AI Model',
    status: 'running',
    progress: 1,
    time: '刚刚',
    featureCount: 0,
  };

  setTasks((prev) => [newTask, ...prev]);
  setSelectedTask(newTask.id);
};

const handleSubmitAnalysisTask = () => {
  if (queueCases.length === 0) {
    return;
  }

  const loggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (loggedIn) {
    setIsLoggedIn(true);
    createAnalysisTask();
    return;
  }

  const currentCount = Number(localStorage.getItem('guestAnalysisCount') || '0');

  if (currentCount >= GUEST_ANALYSIS_LIMIT) {
    setShowLoginRequired(true);
    return;
  }

  const nextCount = currentCount + 1;
  localStorage.setItem('guestAnalysisCount', String(nextCount));
  setGuestAnalysisCount(nextCount);

  createAnalysisTask();
};

const goLogin = () => {
  const redirect = `${location.pathname}${location.search}`;
  navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
};
  const pieData = CLASSIFICATION_DATA.map((d) => ({
    label: d.type,
    value: d.count,
    color: d.color,
  }));

  /* ---- Parameter render helpers ---- */
  const renderParamInput = (param: any) => {
    const val = paramValues[param.id];
    const update = (v: any) => setParamValues((p) => ({ ...p, [param.id]: v }));

    switch (param.type) {
      case 'string':
        return (
          <input
            type="text"
            value={val}
            onChange={(e) => update(e.target.value)}
            className="input-field w-full h-10 text-sm"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={val}
            min={param.min}
            max={param.max}
            onChange={(e) => update(Number(e.target.value))}
            className="input-field w-full h-10 text-sm tab-nums"
          />
        );
      case 'range':
        return (
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step || 0.01}
              value={val}
              onChange={(e) => update(Number(e.target.value))}
              className="flex-1 accent-[#8f35b7] h-2"
            />
            <span className="text-[#8f35b7] font-mono text-sm tab-nums min-w-[48px] text-right">
              {val}
            </span>
          </div>
        );
      case 'select':
        return (
          <select
            value={val}
            onChange={(e) => update(e.target.value)}
            className="input-field w-full h-10 text-sm appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
          >
            {param.options.map((opt: string) => (
              <option key={opt} value={opt === '自动检测组织区域' ? 'auto' : opt === '全片分析' ? 'whole' : opt === '手动选择ROI' ? 'manual' : opt === '自动选择' ? 'auto' : opt === '上皮区域' ? 'epithelial' : opt === '全组织区域' ? 'whole_tissue' : opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <span className="text-[#94a3b8] text-sm">{param.description}</span>
            <ToggleSwitch checked={val} onChange={update} />
          </div>
        );
      default:
        return null;
    }
  };

  /* ---- Status helpers ---- */
  const statusBorder = (status: string) => {
    switch (status) {
      case 'running': return 'border-l-[#8f35b7]';
      case 'queued': return 'border-l-[#a64ed0]';
      case 'completed': return 'border-l-[#22c55e]';
      case 'failed': return 'border-l-[#f87171]';
      default: return 'border-l-transparent';
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <span className="status-badge status-running">
            <span className="w-2 h-2 rounded-full bg-[#8f35b7] animate-pulse" />
            运行中
          </span>
        );
      case 'queued':
        return <span className="status-badge status-queued">队列中</span>;
      case 'completed':
        return <span className="status-badge status-active">已完成</span>;
      case 'failed':
        return <span className="status-badge status-failed">失败</span>;
      default:
        return null;
    }
  };

  /* ================================================================ */
  /* Render                                                            */
  /* ================================================================ */

  return (
    <div className="h-[calc(100dvh-64px)] bg-[#0f1014] flex gap-4 overflow-hidden">
      {/* ============================================================= */}
      {/* LEFT PANEL                                                    */}
      {/* ============================================================= */}
      <aside className="w-[320px] min-w-[260px] max-w-[380px] flex flex-col bg-[#1f2024] rounded-xl border border-white/[0.06] overflow-hidden shrink-0">
        

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
         {/* Case Manager */}
<PanelSection>
  <SectionHeader
    title="分析队列"
    action={
      <div className="flex items-center gap-2">
        <button
          onClick={handleOpenAddTaskModal}
          className="h-8 px-3 rounded-lg bg-[#8f35b7] text-white text-xs font-medium hover:bg-[#a64ed0] transition-all cursor-pointer whitespace-nowrap"
        >
          添加分析任务
        </button>

        <button
          onClick={() => {
            setQueueCases([]);
            setExpandedCase('');
            setSelectedSlide('');
          }}
          title="清空队列"
          className="h-8 w-8 rounded-lg border border-white/[0.08] bg-[#202126] text-[#94a3b8] flex items-center justify-center hover:text-[#f87171] hover:bg-white/[0.06] transition-all cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    }
  />

  <div className="flex flex-col gap-2">
    {queueCases.map((item) => {
      if (item.queueType === 'slide') {
        const isSelected = selectedSlide === item.id;
        const isUploading = item.status === 'uploading';

        return (
          <div
            key={item.id}
            onClick={() => {
              setSelectedSlide(item.id);
              setExpandedCase('');
            }}
            className={cn(
              'p-3 rounded-lg cursor-pointer transition-all duration-150 border-l-[3px]',
              isSelected
                ? 'bg-[#2f3138] border-l-[#8f35b7]'
                : 'bg-[#1f2024] hover:bg-[#2f3138] border-l-transparent',
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#111217] border border-white/[0.06] flex items-center justify-center shrink-0">
                <FileText size={18} className="text-[#8f35b7]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[#e2e8f0] text-sm font-semibold truncate">
                  {item.fileName}
                </div>

                <div className="text-[#64748b] text-xs mt-1">
                  单切片 · {item.size}
                </div>

                <div className="text-[#64748b] text-xs mt-1">
                  {isUploading ? `上传中 ${item.progress}%` : '上传完成 · 待分析'}
                </div>

                {isUploading && (
                  <div className="h-1.5 bg-[#202228] rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-[#8f35b7] rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
              </div>

              <span
                className={cn(
                  'w-2 h-2 rounded-full shrink-0 mt-2',
                  isUploading ? 'bg-[#8f35b7] animate-pulse' : 'bg-[#22c55e]',
                )}
              />
            </div>
          </div>
        );
      }

      if (item.queueType === 'project') {
        return (
          <div
            key={item.id}
            className="p-3 rounded-lg cursor-pointer transition-all duration-150 border-l-[3px] bg-[#1f2024] hover:bg-[#2f3138] border-l-[#8f35b7]"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#111217] border border-white/[0.06] flex items-center justify-center shrink-0">
                <FolderOpen size={18} className="text-[#d292f4]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[#e2e8f0] text-sm font-semibold truncate">
                  {item.name}
                </div>

                <div className="text-[#64748b] text-xs mt-1 truncate">
                  {item.projectNo} · 项目分析
                </div>

                <div className="text-[#64748b] text-xs mt-1 truncate">
                  {item.caseCount} 个 Case · {item.wsiCount} 张 WSI · {item.modelCount} 个模型适用
                </div>
              </div>

              <span className="h-5 px-2 rounded-full bg-[#8f35b7]/20 text-[#d292f4] text-[11px] font-medium flex items-center justify-center shrink-0 mt-1">
                项目
              </span>
            </div>
          </div>
        );
      }

      const c = item;
      const isExpanded = expandedCase === c.id;

      return (
        <div key={c.id}>
          <div
            onClick={() => setExpandedCase(isExpanded ? '' : c.id)}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150',
              isExpanded
                ? 'bg-[#2f3138] border-l-[3px] border-l-[#8f35b7]'
                : 'bg-[#1f2024] hover:bg-[#2f3138] border-l-[3px] border-l-transparent',
            )}
          >
            <FolderOpen size={20} className="text-[#64748b] shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="text-[#e2e8f0] text-sm font-semibold truncate">
                {c.patientName}
              </div>
              <div className="text-[#64748b] text-xs truncate">
                {c.pathologyNo} · {c.gender} · {c.age}岁
              </div>
              <div className="text-[#64748b] text-xs truncate">
                {c.organ} · {c.caseType}
              </div>
            </div>

            <span className="w-5 h-5 rounded-full bg-[#8f35b7] text-white text-[11px] font-medium flex items-center justify-center shrink-0">
              {c.slideCount}
            </span>

            {isExpanded ? (
              <ChevronDown size={14} className="text-[#64748b]" />
            ) : (
              <ChevronRight size={14} className="text-[#64748b]" />
            )}
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: 0.25,
                  ease: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number],
                }}
                className="overflow-hidden"
              >
                <div className="pl-4 pt-1 pb-1 flex flex-col gap-1">
                  {c.slides.map((slide) => {
                    const isSelected = selectedSlide === slide.id;

                    return (
                      <div
                        key={slide.id}
                        onClick={() => setSelectedSlide(slide.id)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150',
                          isSelected
                            ? 'bg-[#2f3138] border border-[#8f35b7]/30'
                            : 'hover:bg-white/[0.02]',
                        )}
                      >
                        <div className="w-8 h-8 rounded bg-[#111217] flex items-center justify-center shrink-0 overflow-hidden">
                          <img src="/wsi-demo.jpg" alt="" className="w-full h-full object-cover opacity-60" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div
                            className={cn(
                              'text-[13px] truncate',
                              isSelected ? 'text-[#8f35b7]' : 'text-[#e2e8f0]',
                            )}
                          >
                            {slide.name}
                          </div>
                          <div className="text-[#64748b] text-[11px]">
                            {slide.stain} · {slide.magnification}
                          </div>
                        </div>

                        <span
                          className={cn(
                            'w-2 h-2 rounded-full shrink-0',
                            slide.status === 'analyzed' ? 'bg-[#22c55e]' : 'bg-[#64748b]',
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    })}

    {queueCases.length === 0 && (
      <div className="rounded-lg border border-dashed border-white/[0.12] bg-[#17181d] px-4 py-8 text-center">
        <div className="text-[#94a3b8] text-sm">当前分析队列为空</div>
        <div className="text-[#64748b] text-xs mt-1">
          点击“添加分析任务”添加切片、病例或项目
        </div>
      </div>
    )}
  </div>
</PanelSection>

          {/* Model Selection */}
          <PanelSection>
            <SectionHeader
              title="AI模型"
              action={
                <span className="text-[#8f35b7] text-xs cursor-pointer hover:underline">浏览更多 &rarr;</span>
              }
            />
            {/* Recommended banner */}
            <div className="mb-3 p-3 rounded-lg border border-[#8f35b7]/20 bg-gradient-to-r from-[#8f35b7]/10 to-[#a64ed0]/5">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#8f35b7] shrink-0" />
                <span className="text-[#b86bdd] text-[13px]">推荐: CellViT++、TME Analyzer 适用于胃部H&E切片</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1">
              {MOCK_MODELS.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 border',
                      isSelected
                        ? 'bg-[#2f3138] border-[#8f35b7]/30'
                        : 'bg-[#1f2024] border-white/[0.04] hover:bg-[#1a2332]'
                    )}
                  >
                    <span
                      className={cn(
                        'w-2.5 h-2.5 rounded-full shrink-0',
                        m.status === 'active' ? 'bg-[#22c55e]' : 'bg-[#f59e0b]'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[#e2e8f0] text-sm font-medium">{m.name}</div>
                      <div className="text-[#64748b] text-xs">{m.tags.join(' · ')}</div>
                    </div>
                    {isSelected && (
                      <span className="tag-function text-[11px]">已选</span>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="btn-secondary w-full mt-3 text-xs h-8">
              <Settings size={14} />
              进入模型中心
            </button>
          </PanelSection>

          {/* Parameters */}
          <PanelSection last>
            <SectionHeader title="分析参数" />
            <div className="flex flex-col">
              {CLINICAL_PARAMS.map((param) => (
                <div key={param.id} className="py-3 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[#e2e8f0] text-sm">{param.label}</label>
                   
                  </div>
                  <div className="mb-1">{renderParamInput(param)}</div>
                 
                </div>
              ))}
            </div>
          </PanelSection>
        </div>

        {/* Submit Task — sticky bottom */}
        <div className="p-4 bg-[#0f1014] border-t border-white/[0.08] shrink-0">
          <button onClick={handleSubmitAnalysisTask} className="btn-primary w-full h-11 text-sm">
  <Play size={16} />
  提交分析任务
</button>

{!isLoggedIn && (
  <div className="mt-2 rounded-lg border border-[#8f35b7]/20 bg-[#8f35b7]/10 px-3 py-2 text-[11px] leading-5 text-[#d292f4]">
    游客模式可体验 {GUEST_ANALYSIS_LIMIT} 次分析任务，当前已使用{' '}
    {Math.min(guestAnalysisCount, GUEST_ANALYSIS_LIMIT)} / {GUEST_ANALYSIS_LIMIT} 次。
  </div>
)}
         
        </div>
      </aside>

      {/* ============================================================= */}
      {/* CENTER PANEL — WSI Viewer                                      */}
      {/* ============================================================= */}
      <section className="flex-1 flex flex-col bg-[#111217] rounded-xl border border-white/[0.06] overflow-hidden relative min-w-[500px]">
        {/* Toolbar */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-[#111217]/85 backdrop-blur-lg border border-white/[0.08] rounded-[10px] px-1.5 py-1.5">
          {/* Zoom group */}
          <button onClick={handleZoomOut} className="icon-btn w-8 h-8 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all cursor-pointer">
            <ZoomOut size={16} />
          </button>
          <div className="flex flex-col items-center min-w-[48px]">
            <span className="text-[#e2e8f0] text-sm font-semibold">{currentMag}X</span>
            <span className="text-[#64748b] text-[10px] font-mono">zoom {zoom.toFixed(2)}</span>
          </div>
          <button onClick={handleZoomIn} className="icon-btn w-8 h-8 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all cursor-pointer">
            <ZoomIn size={16} />
          </button>
          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Magnification presets */}
          {MAGNIFICATIONS.map((mag) => (
            <button
              key={mag}
              onClick={() => handleMagClick(mag)}
              className={cn(
                'px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer',
                currentMag === mag
                  ? 'bg-[#8f35b7] text-white'
                  : 'text-[#64748b] hover:bg-white/[0.06]'
              )}
            >
              {mag}X
            </button>
          ))}
          <div className="w-px h-5 bg-white/10 mx-1" />

          <button onClick={handleResetView} className="icon-btn w-8 h-8 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all cursor-pointer" title="重置视图">
            <RotateCcw size={16} />
          </button>
          <button className="icon-btn w-8 h-8 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all cursor-pointer">
            <Maximize2 size={16} />
          </button>
          <button className="icon-btn w-8 h-8 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all cursor-pointer">
            <Settings size={16} />
          </button>
        </div>

        {/* Magnification sidebar */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 bg-[#111217]/80 backdrop-blur-sm border border-white/[0.08] rounded-lg p-1">
          {MAGNIFICATIONS.map((mag) => (
            <button
              key={mag}
              onClick={() => handleMagClick(mag)}
              className={cn(
                'px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer text-center min-w-[40px]',
                currentMag === mag
                  ? 'bg-[#8f35b7] text-white'
                  : 'text-[#64748b] hover:bg-white/[0.06]'
              )}
            >
              {mag}X
            </button>
          ))}
        </div>

        {/* WSI Canvas */}
        <div
          ref={viewerRef}
          className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <img
              src="/wsi-demo.jpg"
              alt="WSI"
              className="max-w-none object-contain select-none"
              style={{ width: '800px', height: '600px' }}
              draggable={false}
            />
            {/* Grid overlay */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `linear-gradient(rgba(143,53,183,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(143,53,183,0.3) 1px, transparent 1px)`,
                  backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                }}
              />
            )}
          </div>
        </div>

        {/* Scale bar */}
        <div className="absolute bottom-4 left-4 z-20 bg-[#111217]/80 backdrop-blur-sm border border-white/[0.08] rounded-md px-2.5 py-1.5">
          <div className="w-[60px] h-[3px] bg-[#e2e8f0] mb-1" />
          <div className="text-[#94a3b8] text-[11px] text-center font-mono">500 μm</div>
        </div>

        {/* Info label */}
        <div className="absolute bottom-4 left-28 z-20 bg-[#111217]/70 backdrop-blur-sm rounded-md px-2.5 py-1">
          <span className="text-[#64748b] text-xs font-mono">
            {selectedStandaloneSlide
  ? `${selectedStandaloneSlide.fileName} · 单切片 · 待分析`
  : activeSlide
    ? `${activeSlide.name} · ${activeCase?.organ} · ${activeSlide.stain}`
    : '19-38190.svs · 胃 · HE'}
          </span>
        </div>

        {/* Coordinates */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-[#111217]/80 backdrop-blur-sm rounded-md px-3 py-1">
          <span className="text-[#64748b] text-xs font-mono">
            x:{Math.round(1234 + pan.x)} y:{Math.round(5678 + pan.y)}
          </span>
        </div>

        {/* Mini Map */}
        <div className="absolute bottom-4 right-4 z-20 w-[180px] h-[140px] bg-black/70 border border-white/[0.15] rounded-lg overflow-hidden">
          <img src="/wsi-demo.jpg" alt="minimap" className="w-full h-full object-cover opacity-50" />
          <div
            className="absolute border-2 border-[#8f35b7] rounded-sm"
            style={{
              left: `${Math.max(0, Math.min(80, 40 + pan.x / 10))}%`,
              top: `${Math.max(0, Math.min(80, 30 + pan.y / 10))}%`,
              width: `${Math.max(10, 40 / zoom)}%`,
              height: `${Math.max(10, 30 / zoom)}%`,
            }}
          />
        </div>
      </section>

      {/* ============================================================= */}
      {/* RIGHT PANEL                                                   */}
      {/* ============================================================= */}
      <aside className="w-[420px] min-w-[340px] max-w-[440px] flex flex-col bg-[#1f2024] rounded-xl border border-white/[0.06] overflow-hidden shrink-0">
        <div className="flex-1 overflow-y-auto">
          {/* Analysis Tasks */}
          <PanelSection>
            <SectionHeader
              title={`分析任务 (${tasks.length})`}
              action={
                <button
                  onClick={() => setTasks([])}
                  className="text-[#f87171] text-xs hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  清除历史
                </button>
              }
            />
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <ClipboardList size={36} className="text-[#475569]" />
                <p className="text-[#64748b] text-sm">暂无分析任务</p>
                <p className="text-[#475569] text-xs">选择模型并提交分析</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task.id)}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-all duration-150 border border-white/[0.04] border-l-[3px]',
                      statusBorder(task.status),
                      selectedTask === task.id ? 'bg-[#2f3138]' : 'bg-[#1f2024] hover:bg-[#1a2332]'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#e2e8f0] text-sm font-medium">{task.modelName}</span>
                        {statusBadge(task.status)}
                      </div>
                      <span className="text-[#64748b] text-xs">{task.time}</span>
                    </div>
                    {task.status === 'running' && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[#94a3b8] text-xs">检测中 · {task.progress}%</span>
                        </div>
                        <div className="h-1 bg-[#202228] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-[#8f35b7] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${task.progress}%` }}
                            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
                          />
                        </div>
                      </div>
                    )}
                    {task.status === 'completed' && (
                      <div className="text-[#64748b] text-xs mt-1">
                        检出 {task.featureCount?.toLocaleString()} 个对象 · 耗时 {task.time}
                      </div>
                    )}
                    {task.status === 'failed' && (
                      <div className="text-[#f87171] text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        错误: {task.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </PanelSection>

          {/* Layer Control */}
          <PanelSection>
            <SectionHeader title="图层控制" />
            {/* Mode tabs */}
            <div className="flex bg-[#202228] rounded-lg p-[3px] mb-3">
              <button
                onClick={() => setViewMode('single')}
                className={cn(
                  'flex-1 py-1 text-[12px] font-medium rounded-md transition-all cursor-pointer',
                  viewMode === 'single' ? 'bg-[#24262c] text-[#e2e8f0] shadow-sm' : 'text-[#64748b] hover:text-[#94a3b8]'
                )}
              >
                单任务查看
              </button>
              <button
                onClick={() => setViewMode('merge')}
                className={cn(
                  'flex-1 py-1 text-[12px] font-medium rounded-md transition-all cursor-pointer',
                  viewMode === 'merge' ? 'bg-[#24262c] text-[#e2e8f0] shadow-sm' : 'text-[#64748b] hover:text-[#94a3b8]'
                )}
              >
                合并显示
              </button>
            </div>
            {/* Overlay toggles */}
            <div className="flex flex-col gap-3 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[#e2e8f0] text-sm">真实WSI标注</span>
                <ToggleSwitch checked={true} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#e2e8f0] text-sm">任务结果标注</span>
                <ToggleSwitch checked={true} onChange={() => {}} />
              </div>
            </div>
            {/* Opacity */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#94a3b8] text-xs">叠加透明度</span>
                <span className="text-[#8f35b7] text-xs font-mono">{overlayOpacity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                className="w-full h-1.5 accent-[#8f35b7]"
              />
            </div>
            {/* Layer list */}
            <div className="flex flex-col gap-2">
              {layers.map((layer) => (
                <div key={layer.id} className="flex items-center gap-3 py-2">
                  <ToggleSwitch
                    size="sm"
                    checked={layer.visible}
                    onChange={(v) =>
                      setLayers((prev) => prev.map((l) => (l.id === layer.id ? { ...l, visible: v } : l)))
                    }
                  />
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: layer.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[#e2e8f0] text-sm truncate">{layer.name}</div>
                    <div className="text-[#64748b] text-xs">{layer.count.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2 w-[80px]">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={layer.opacity}
                      onChange={(e) =>
                        setLayers((prev) =>
                          prev.map((l) => (l.id === layer.id ? { ...l, opacity: Number(e.target.value) } : l))
                        )
                      }
                      className="w-full h-1 accent-[#8f35b7]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </PanelSection>

          {/* Results Dashboard */}
          {/* Results Dashboard */}
<PanelSection>
  <SectionHeader title="AI结果展示样式说明" />

  <div className="mb-4 rounded-lg border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-3">
    <div className="text-[#d292f4] text-sm font-semibold mb-1">
      右侧展示版式协议 / Right Panel Layout Protocol
    </div>
    <div className="text-[#94a3b8] text-xs leading-6">
      以下区域用于向前端说明不同 AI 结果在右侧面板中的展示效果。当前仅为样式总览，不代表最终真实分析结果。
    </div>
  </div>

  {/* Text Card */}
  <div className="mb-4 rounded-xl border border-white/[0.06] bg-[#1f2024] overflow-hidden">
    <div className="px-3 py-3 border-b border-white/[0.06] bg-[#202228]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[#e2e8f0] text-sm font-semibold">1. AI诊断文本卡片</div>
        <span className="h-6 px-2.5 rounded-full bg-[#8f35b7]/20 text-[#d292f4] text-[11px] font-semibold inline-flex items-center">
          text_card
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1 text-[11px] leading-5">
        <div>
          <span className="text-[#64748b]">适用 AI 结果：</span>
          <span className="text-[#cbd5e1]">诊断结论 / 评分 / 置信度 / 建议</span>
        </div>
        <div>
          <span className="text-[#64748b]">数据来源：</span>
          <span className="text-[#cbd5e1] font-mono">results.diagnosis</span>
        </div>
      </div>
    </div>

    <div className="p-3">
      <div className="rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 p-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-[#e2e8f0] text-sm font-semibold">AI 诊断结果</div>
            <div className="text-[#64748b] text-xs mt-1">基于全切片分析的综合诊断</div>
          </div>
          <span className="h-6 px-2 rounded-full bg-[#f59e0b]/20 text-[#ffc274] text-[11px] font-semibold">
            warning
          </span>
        </div>

        <div className="space-y-2">
          <div className="rounded-md bg-[#111217] border border-white/[0.05] p-2.5">
            <div className="text-[#64748b] text-xs mb-1">诊断结论</div>
            <div className="text-[#ff8f8f] text-base font-bold">浸润性导管癌 II 级</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-[#111217] border border-white/[0.05] p-2.5">
              <div className="text-[#64748b] text-xs mb-1">置信度</div>
              <div className="text-[#e2e8f0] text-sm font-semibold">92.4%</div>
            </div>
            <div className="rounded-md bg-[#111217] border border-white/[0.05] p-2.5">
              <div className="text-[#64748b] text-xs mb-1">Nottingham 评分</div>
              <div className="text-[#e2e8f0] text-sm font-semibold">6 分</div>
            </div>
          </div>

          <div className="rounded-md bg-[#111217] border border-white/[0.05] p-2.5">
            <div className="text-[#64748b] text-xs mb-1">建议</div>
            <div className="text-[#94a3b8] text-xs leading-5 italic">
              行 ER/PR/HER2 检测及分子分型
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Bar Chart */}
  <div className="mb-4 rounded-xl border border-white/[0.06] bg-[#1f2024] overflow-hidden">
    <div className="px-3 py-3 border-b border-white/[0.06] bg-[#202228]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[#e2e8f0] text-sm font-semibold">2. 细胞类型分布柱状图</div>
        <span className="h-6 px-2.5 rounded-full bg-[#8f35b7]/20 text-[#d292f4] text-[11px] font-semibold inline-flex items-center">
          chart_bar
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1 text-[11px] leading-5">
        <div>
          <span className="text-[#64748b]">适用 AI 结果：</span>
          <span className="text-[#cbd5e1]">细胞分类统计 / 目标数量 / 阳性细胞计数</span>
        </div>
        <div>
          <span className="text-[#64748b]">数据来源：</span>
          <span className="text-[#cbd5e1] font-mono">results.statistics.cell_counts</span>
        </div>
      </div>
    </div>

    <div className="p-3">
      <div className="mb-3">
        <div className="text-[#e2e8f0] text-sm font-semibold">细胞类型分布</div>
        <div className="text-[#64748b] text-xs mt-1">AI 检出的各类细胞数量</div>
      </div>

      <div className="space-y-3">
        {CLASSIFICATION_DATA.map((row) => {
          const maxCount = Math.max(...CLASSIFICATION_DATA.map((item) => item.count));
          const percentage = Math.round((row.count / maxCount) * 100);

          return (
            <div key={row.type}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: row.color }} />
                  <span className="text-[#e2e8f0] text-xs">{row.type}</span>
                </div>
                <div className="text-[#94a3b8] text-xs tab-nums">
                  {row.count.toLocaleString()} · {row.percentage}
                </div>
              </div>
              <div className="h-2 rounded-full bg-[#111217] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${percentage}%`, background: row.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>

  {/* Pie Chart */}
  <div className="mb-4 rounded-xl border border-white/[0.06] bg-[#1f2024] overflow-hidden">
    <div className="px-3 py-3 border-b border-white/[0.06] bg-[#202228]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[#e2e8f0] text-sm font-semibold">3. 组织区域占比饼图</div>
        <span className="h-6 px-2.5 rounded-full bg-[#8f35b7]/20 text-[#d292f4] text-[11px] font-semibold inline-flex items-center">
          chart_pie
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1 text-[11px] leading-5">
        <div>
          <span className="text-[#64748b]">适用 AI 结果：</span>
          <span className="text-[#cbd5e1]">组织面积占比 / 成分比例 / 区域组成</span>
        </div>
        <div>
          <span className="text-[#64748b]">数据来源：</span>
          <span className="text-[#cbd5e1] font-mono">results.statistics.tissue_areas</span>
        </div>
      </div>
    </div>

    <div className="p-3">
      <div className="mb-3">
        <div className="text-[#e2e8f0] text-sm font-semibold">组织区域占比</div>
        <div className="text-[#64748b] text-xs mt-1">各组织类型面积占比，支持环形图展示</div>
      </div>

      <div className="bg-[#111217] border border-white/[0.04] rounded-lg p-3">
        <PieChart data={pieData} />
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {CLASSIFICATION_DATA.map((row) => (
            <div key={row.type} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: row.color }} />
              <span className="text-[#94a3b8] text-xs">{row.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>

  {/* Combined View */}
  <div className="rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 overflow-hidden">
    <div className="px-3 py-3 border-b border-[#8f35b7]/20">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[#e2e8f0] text-sm font-semibold">4. 综合视图示例</div>
        <span className="h-6 px-2.5 rounded-full bg-[#8f35b7]/25 text-[#d292f4] text-[11px] font-semibold inline-flex items-center">
          combined
        </span>
      </div>
      <div className="text-[#94a3b8] text-xs leading-6">
        综合视图表示一个 AI 分析结果可以同时由多个 block 组合渲染，例如：文本结论 + 柱状图 + 饼图。
      </div>
    </div>

    <div className="p-3 space-y-3">
      <div className="rounded-lg bg-[#111217] border border-white/[0.05] p-3">
        <div className="text-[#64748b] text-xs mb-1">展示组合</div>
        <div className="text-[#e2e8f0] text-sm leading-6">
          text_card + chart_bar + chart_pie
        </div>
      </div>

      <div className="rounded-lg bg-[#111217] border border-white/[0.05] p-3">
        <div className="text-[#64748b] text-xs mb-1">适用场景</div>
        <div className="text-[#94a3b8] text-xs leading-6">
          适合肿瘤微环境分析、IHC 定量分析、组织区域分析等需要同时展示结论、统计和比例图的 AI 模型。
        </div>
      </div>

      <div className="rounded-lg bg-[#111217] border border-white/[0.05] p-3">
        <div className="text-[#64748b] text-xs mb-2">前端实现说明</div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8f35b7]" />
            <span className="text-[#cbd5e1]">根据 layout.right_panel.blocks 顺序渲染</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8f35b7]" />
            <span className="text-[#cbd5e1]">根据 block.type 选择展示组件</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8f35b7]" />
            <span className="text-[#cbd5e1]">根据 data_source 从 results 中取数据</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</PanelSection>

          {/* Analysis Report */}
          <PanelSection last>
            <SectionHeader title="导出与报告" />
            <button
              onClick={() => setShowReport(!showReport)}
              className="btn-primary w-full h-10 text-sm mb-3"
            >
              <FileText size={16} />
              生成分析报告
            </button>
            <AnimatePresence>
              {showReport && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number] }}
                  className="overflow-hidden"
                >
                  <div className="bg-[#111217] border border-white/[0.06] rounded-lg p-4 mb-3">
                    <h5 className="text-[#e2e8f0] font-semibold text-sm mb-2">病理AI分析报告</h5>
                    <div className="space-y-2 text-[13px]">
                      <div>
                        <span className="text-[#64748b]">WSI:</span>{' '}
                        <span className="text-[#e2e8f0]">{activeSlide?.name || 'HE_stomach_01.svs'}</span>
                      </div>
                      <div>
                        <span className="text-[#64748b]">器官:</span>{' '}
                        <span className="text-[#e2e8f0]">{activeCase?.organ || '胃'}</span>
                      </div>
                      <div>
                        <span className="text-[#64748b]">染色:</span>{' '}
                        <span className="text-[#e2e8f0]">{activeSlide?.stain || 'H&E'}</span>
                      </div>
                      <div className="border-t border-white/[0.06] pt-2 mt-2">
                        <span className="text-[#64748b]">分析模型:</span>{' '}
                        <span className="text-[#e2e8f0]">CellViT++ v1.2.0</span>
                      </div>
                      <div>
                        <span className="text-[#64748b]">检出细胞:</span>{' '}
                        <span className="text-[#8f35b7] font-medium">50,179</span>
                      </div>
                      <div className="border-t border-white/[0.06] pt-2 mt-2 text-[#475569]">
                        <p>⚠️ 本报告仅供研究参考，不构成医疗建议。</p>
                        <p>最终诊断需由执业病理医师审核确认。</p>
                      </div>
                    </div>
                  </div>
                  <button className="btn-secondary w-full text-xs h-8 border border-[#8f35b7]/40 text-[#8f35b7] hover:bg-[#8f35b7]/10">
                    <Download size={14} />
                    下载 Markdown
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-3 flex items-start gap-2 text-[#f59e0b] text-xs">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>本平台的AI分析结果仅供研究参考，不构成医疗建议。最终诊断需由执业病理医师确认。</span>
            </div>
          </PanelSection>
        </div>
              {showLoginRequired && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-[460px] rounded-2xl border border-white/[0.08] bg-[#1f2024] shadow-[0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <div className="text-[#f1f3f6] text-lg font-bold">登录后继续分析</div>
              <div className="text-[#94a3b8] text-sm leading-6 mt-2">
                游客模式最多可提交 {GUEST_ANALYSIS_LIMIT} 次 AI 分析任务。当前游客额度已用完，登录后可继续提交分析任务。
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-4">
                <div className="text-[#d292f4] text-sm font-semibold mb-2">当前操作已暂停</div>
                <div className="text-[#94a3b8] text-xs leading-6">
                  点击“前往登录”后进入登录页。登录成功后将返回当前工作台页面，你可以再次点击“提交分析任务”继续。
                </div>
              </div>
            </div>

            <div className="h-14 px-6 border-t border-white/[0.06] bg-[#17181d] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowLoginRequired(false)}
                className="h-9 px-4 rounded-lg border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm hover:text-[#e2e8f0] transition-all"
              >
                稍后再说
              </button>
              <button
                onClick={goLogin}
                className="h-9 px-4 rounded-lg bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all"
              >
                前往登录
              </button>
            </div>
          </div>
        </div>
      )}
      </aside>
            {showAddTaskModal && (
        <div className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-[820px] rounded-2xl border border-white/[0.08] bg-[#1f2024] shadow-[0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="h-14 px-5 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-[#e2e8f0] text-base font-semibold">添加分析任务</div>
                <div className="text-[#64748b] text-xs mt-0.5">
                  选择要加入分析队列的对象类型
                </div>
              </div>

              <button
                onClick={() => setShowAddTaskModal(false)}
                className="w-8 h-8 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all"
              >
                ×
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-3 gap-3 mb-5">
                <button
                  onClick={() => setAddTaskType('slide')}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-all',
                    addTaskType === 'slide'
                      ? 'border-[#8f35b7] bg-[#8f35b7]/15'
                      : 'border-white/[0.08] bg-[#17181d] hover:bg-white/[0.04]',
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FileText size={20} className="text-[#8f35b7]" />
                    <span className="text-[#e2e8f0] text-sm font-semibold">添加切片</span>
                  </div>
                  <div className="text-[#64748b] text-xs leading-5">
                    模拟从本地选择切片文件，切片将作为独立分析对象加入队列，不进入病例库。
                  </div>
                </button>

                <button
                  onClick={() => setAddTaskType('case')}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-all',
                    addTaskType === 'case'
                      ? 'border-[#8f35b7] bg-[#8f35b7]/15'
                      : 'border-white/[0.08] bg-[#17181d] hover:bg-white/[0.04]',
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FolderOpen size={20} className="text-[#8f35b7]" />
                    <span className="text-[#e2e8f0] text-sm font-semibold">添加病例</span>
                  </div>
                  <div className="text-[#64748b] text-xs leading-5">
                    模拟从病例库选择病例，当前仅展示选择效果，不与病例库真实数据联动。
                  </div>
                </button>

                <button
                  onClick={() => setAddTaskType('project')}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-all',
                    addTaskType === 'project'
                      ? 'border-[#8f35b7] bg-[#8f35b7]/15'
                      : 'border-white/[0.08] bg-[#17181d] hover:bg-white/[0.04]',
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FolderOpen size={20} className="text-[#8f35b7]" />
                    <span className="text-[#e2e8f0] text-sm font-semibold">添加项目</span>
                  </div>
                  <div className="text-[#64748b] text-xs leading-5">
                    模拟从研究项目中选择项目，按项目下 Case / WSI 批量进入分析队列。
                  </div>
                </button>
              </div>

              {addTaskType === 'slide' && (
                <div className="rounded-xl border border-white/[0.08] bg-[#17181d] overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <div>
                      <div className="text-[#e2e8f0] text-sm font-semibold">本地切片选择效果</div>
                      <div className="text-[#64748b] text-xs mt-1">
                        当前不真实拉起系统文件框，仅模拟已选择切片文件。
                      </div>
                    </div>

                    <button className="h-8 px-3 rounded-lg bg-[#8f35b7] text-white text-xs font-medium">
                      选择切片
                    </button>
                  </div>

                  <div className="p-3">
                    {MOCK_UPLOAD_FILES.map((file) => (
                      <div
                        key={file.fileName}
                        className="h-12 rounded-lg border border-white/[0.06] bg-[#111217] px-3 flex items-center gap-3 mb-2 last:mb-0"
                      >
                        <FileText size={16} className="text-[#8f35b7] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[#e2e8f0] text-sm truncate">{file.fileName}</div>
                          <div className="text-[#64748b] text-xs">{file.size} · 待加入队列</div>
                        </div>
                        <span className="text-[#d292f4] text-xs">已选择</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {addTaskType === 'case' && (
                <div className="rounded-xl border border-white/[0.08] bg-[#17181d] overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <div className="text-[#e2e8f0] text-sm font-semibold">病例库选择效果</div>
                    <div className="text-[#64748b] text-xs mt-1">
                      当前模拟从病例库选择病例，不读取病例库页面真实状态。
                    </div>
                  </div>

                  <div className="p-3">
                    {MOCK_LIBRARY_CASES.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-[#8f35b7]/30 bg-[#8f35b7]/10 px-3 py-3 flex items-center gap-3"
                      >
                        <FolderOpen size={18} className="text-[#8f35b7] shrink-0" />

                        <div className="flex-1 min-w-0">
                          <div className="text-[#e2e8f0] text-sm font-semibold truncate">
                            {item.patientName}
                          </div>
                          <div className="text-[#64748b] text-xs mt-1 truncate">
                            {item.pathologyNo} · {item.gender} · {item.age}岁
                          </div>
                          <div className="text-[#64748b] text-xs mt-1 truncate">
                            {item.organ} · {item.caseType} · {item.slideCount}张切片
                          </div>
                        </div>

                        <span className="text-[#d292f4] text-xs">已选择</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {addTaskType === 'project' && (
                <div className="rounded-xl border border-white/[0.08] bg-[#17181d] overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <div>
                      <div className="text-[#e2e8f0] text-sm font-semibold">研究项目选择效果</div>
                      <div className="text-[#64748b] text-xs mt-1">
                        当前不真实联动研究项目管理，仅模拟已选择研究项目。
                      </div>
                    </div>

                    <button className="h-8 px-3 rounded-lg bg-[#8f35b7] text-white text-xs font-medium">
                      选择项目
                    </button>
                  </div>

                  <div className="p-3 space-y-2">
                    {MOCK_RESEARCH_PROJECTS.map((project) => (
                      <div
                        key={project.id}
                        className="rounded-lg border border-[#8f35b7]/30 bg-[#8f35b7]/10 px-3 py-3 flex items-center gap-3"
                      >
                        <FolderOpen size={18} className="text-[#8f35b7] shrink-0" />

                        <div className="flex-1 min-w-0">
                          <div className="text-[#e2e8f0] text-sm font-semibold truncate">
                            {project.name}
                          </div>
                          <div className="text-[#64748b] text-xs mt-1 truncate">
                            {project.projectNo} · {project.caseCount} 个 Case · {project.wsiCount} 张 WSI
                          </div>
                          <div className="text-[#64748b] text-xs mt-1 truncate">
                            {project.modelCount} 个模型适用 · 项目批量分析
                          </div>
                        </div>

                        <span className="text-[#d292f4] text-xs">已选择</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-14 px-5 border-t border-white/[0.06] bg-[#17181d] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="h-9 px-4 rounded-lg border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm hover:text-[#e2e8f0] transition-all"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAddTask}
                className="h-9 px-4 rounded-lg bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workbench;
