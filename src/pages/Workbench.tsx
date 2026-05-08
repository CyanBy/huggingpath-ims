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

const MOCK_CASES: CaseItem[] = [
  {
    id: 'CAS-2025-001',
    pathologyNo: '25AH032093',
    patientName: '患者A',
    gender: '男',
    age: 58,
    organ: '胃',
    caseType: '活检',
    slideCount: 3,
    date: '2025.01.15',
    slides: [
      { id: 'SL-001', name: 'HE_stomach_01.svs', stain: 'HE', magnification: '40X', size: '1.2 GB', status: 'analyzed' },
      { id: 'SL-002', name: 'IHC_Ki67_01.svs', stain: 'Ki67', magnification: '40X', size: '980 MB', status: 'pending' },
      { id: 'SL-003', name: 'IHC_PDL1_01.svs', stain: 'PD-L1', magnification: '40X', size: '1.1 GB', status: 'pending' },
    ],
  },
  {
    id: 'CAS-2025-002',
    pathologyNo: '25BR018762',
    patientName: '患者B',
    gender: '女',
    age: 46,
    organ: '乳腺',
    caseType: '活检',
    slideCount: 2,
    date: '2025.01.14',
    slides: [
      { id: 'SL-004', name: 'HE_breast_01.svs', stain: 'HE', magnification: '40X', size: '2.3 GB', status: 'pending' },
      { id: 'SL-005', name: 'HE_breast_02.svs', stain: 'HE', magnification: '40X', size: '2.1 GB', status: 'pending' },
    ],
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

const EXPERT_PARAMS = [
  { id: 'batch_size', label: '推理批次大小', type: 'number' as const, default: 16, min: 1, max: 64, description: '每次送入GPU的图像patch数量' },
  { id: 'confidence', label: '置信度阈值', type: 'range' as const, default: 0.5, min: 0.1, max: 0.9, step: 0.01, description: '阈值越高，结果越严格' },
  { id: 'roi', label: '分析区域', type: 'select' as const, default: 'auto', options: ['全片分析', '自动检测组织区域', '手动选择ROI'], description: '选择需要AI分析的组织区域范围' },
  { id: 'min_size', label: '最小细胞尺寸', type: 'number' as const, default: 5, min: 1, max: 50, description: '小于此尺寸的目标将被忽略 (μm)' },
  { id: 'gpu_accelerate', label: 'GPU加速', type: 'boolean' as const, default: true, description: '使用GPU进行推理加速' },
  { id: 'nms_threshold', label: 'NMS阈值', type: 'range' as const, default: 0.3, min: 0, max: 1, step: 0.05, description: '非极大值抑制阈值' },
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

const Workbench: FC = () => {
  /* ---- Mode ---- */
  const [mode, setMode] = useState<'clinical' | 'expert'>('clinical');

  /* ---- Case / Slide ---- */
  const [expandedCase, setExpandedCase] = useState<string>('CAS-2025-001');
  const [selectedSlide, setSelectedSlide] = useState<string>('SL-001');
  const [queueCases, setQueueCases] = useState<CaseItem[]>(MOCK_CASES);

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

  /* ---- Derived ---- */
 const activeCase = queueCases.find((c) => c.id === expandedCase);
  const activeSlide = activeCase?.slides.find((s) => s.id === selectedSlide);
  const activeTask = tasks.find((t) => t.id === selectedTask);

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
        {/* Mode Toggle */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex bg-[#202228] rounded-lg p-[3px]">
            <button
              onClick={() => setMode('clinical')}
              className={cn(
                'flex-1 py-1.5 text-[13px] font-medium rounded-md transition-all duration-200 cursor-pointer',
                mode === 'clinical' ? 'bg-[#8f35b7] text-white' : 'text-[#94a3b8] hover:text-[#e2e8f0]'
              )}
            >
              临床模式
            </button>
            <button
              onClick={() => setMode('expert')}
              className={cn(
                'flex-1 py-1.5 text-[13px] font-medium rounded-md transition-all duration-200 cursor-pointer',
                mode === 'expert' ? 'bg-[#8f35b7] text-white' : 'text-[#94a3b8] hover:text-[#e2e8f0]'
              )}
            >
              专家模式
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Case Manager */}
          <PanelSection>
            <SectionHeader
  title="分析队列"
  action={
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          setQueueCases(MOCK_CASES);
          setExpandedCase('CAS-2025-001');
          setSelectedSlide('SL-001');
        }}
        className="h-8 px-3 rounded-lg bg-[#8f35b7] text-white text-xs font-medium hover:bg-[#a64ed0] transition-all cursor-pointer whitespace-nowrap"
      >
        添加病例
      </button>
      <button
        onClick={() => {
          setQueueCases([]);
          setExpandedCase('');
          setSelectedSlide('');
        }}
        className="h-8 px-3 rounded-lg border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-xs font-medium hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all cursor-pointer whitespace-nowrap"
      >
        清空队列
      </button>
    </div>
  }
/>
            <div className="flex flex-col gap-2">
              {queueCases.map((c) => {
                const isExpanded = expandedCase === c.id;
                return (
                  <div key={c.id}>
                    <div
                      onClick={() => setExpandedCase(isExpanded ? '' : c.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150',
                        isExpanded
                          ? 'bg-[#2f3138] border-l-[3px] border-l-[#8f35b7]'
                          : 'bg-[#1f2024] hover:bg-[#2f3138] border-l-[3px] border-l-transparent'
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
                      {isExpanded ? <ChevronDown size={14} className="text-[#64748b]" /> : <ChevronRight size={14} className="text-[#64748b]" />}
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number] }}
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
                                      : 'hover:bg-white/[0.02]'
                                  )}
                                >
                                  <div className="w-8 h-8 rounded bg-[#111217] flex items-center justify-center shrink-0 overflow-hidden">
                                    <img src="/wsi-demo.jpg" alt="" className="w-full h-full object-cover opacity-60" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className={cn('text-[13px] truncate', isSelected ? 'text-[#8f35b7]' : 'text-[#e2e8f0]')}>{slide.name}</div>
                                    <div className="text-[#64748b] text-[11px]">{slide.stain} · {slide.magnification}</div>
                                  </div>
                                  <span
                                    className={cn(
                                      'w-2 h-2 rounded-full shrink-0',
                                      slide.status === 'analyzed' ? 'bg-[#22c55e]' : 'bg-[#64748b]'
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
              })}{queueCases.length === 0 && (
  <div className="rounded-lg border border-dashed border-white/[0.12] bg-[#17181d] px-4 py-8 text-center">
    <div className="text-[#94a3b8] text-sm">当前分析队列为空</div>
    <div className="text-[#64748b] text-xs mt-1">
      点击“添加病例”从病例库选择需要分析的病例
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
              {(mode === 'clinical' ? CLINICAL_PARAMS : EXPERT_PARAMS).map((param) => (
                <div key={param.id} className="py-3 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[#e2e8f0] text-sm">{param.label}</label>
                    {mode === 'expert' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#a64ed0]/10 text-[#a64ed0] border border-[#a64ed0]/20">
                        {param.type}
                      </span>
                    )}
                  </div>
                  <div className="mb-1">{renderParamInput(param)}</div>
                  {mode === 'expert' && (
                    <p className="text-[#64748b] text-xs">{param.description}</p>
                  )}
                </div>
              ))}
            </div>
          </PanelSection>
        </div>

        {/* Submit Task — sticky bottom */}
        <div className="p-4 bg-[#0f1014] border-t border-white/[0.08] shrink-0">
          <button className="btn-primary w-full h-11 text-sm">
            <Play size={16} />
            提交分析任务
          </button>
          <div className="flex gap-2 mt-2">
            <button className="btn-secondary flex-1 text-xs h-8">保存配置</button>
            <button className="btn-secondary flex-1 text-xs h-8">加载配置</button>
          </div>
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
            {activeSlide ? `${activeSlide.name} · ${activeCase?.organ} · ${activeSlide.stain}` : '19-38190.svs · 胃 · HE'}
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
          <PanelSection>
            <SectionHeader title="分析结果" />
            {/* Source tag */}
            <div className="mb-3">
              <span className="tag-function text-xs">
                {activeTask?.modelName || 'CellViT++'} · {activeTask?.featureCount?.toLocaleString() || '2,456'} 个检出对象
              </span>
            </div>
            {/* Statistics cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {CLASSIFICATION_DATA.map((row) => (
                <div
                  key={row.type}
                  className="bg-[#1f2024] border border-white/[0.04] rounded-lg p-3 text-center hover:bg-[#1a2332] transition-colors cursor-pointer"
                >
                  <div className="text-[22px] font-bold tab-nums" style={{ color: row.color }}>
                    {row.count.toLocaleString()}
                  </div>
                  <div className="text-[#94a3b8] text-xs mt-1">{row.type}</div>
                </div>
              ))}
            </div>
            {/* Pie chart */}
            <div className="bg-[#1f2024] border border-white/[0.04] rounded-lg p-3 mb-4">
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
            {/* Classification table */}
            <div className="mb-3">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr] gap-2 px-2.5 py-2 bg-white/[0.02] rounded-t-lg">
                <span className="text-[#64748b] text-[11px] font-medium uppercase tracking-wider">分类</span>
                <span className="text-[#64748b] text-[11px] font-medium uppercase tracking-wider">数量</span>
                <span className="text-[#64748b] text-[11px] font-medium uppercase tracking-wider">密度</span>
                <span className="text-[#64748b] text-[11px] font-medium uppercase tracking-wider">占比</span>
              </div>
              {CLASSIFICATION_DATA.map((row) => (
                <div
                  key={row.type}
                  className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr] gap-2 px-2.5 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
                    <span className="text-[#e2e8f0] text-sm">{row.type}</span>
                  </div>
                  <span className="text-[#e2e8f0] text-sm font-medium tab-nums">{row.count.toLocaleString()}</span>
                  <span className="text-[#94a3b8] text-sm">{row.density}</span>
                  <span className="text-[#94a3b8] text-sm">{row.percentage}</span>
                </div>
              ))}
            </div>
            <button className="btn-secondary w-full text-xs h-9">
              <Download size={14} />
              导出 GeoJSON
            </button>
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
      </aside>
    </div>
  );
};

export default Workbench;
