import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import {
  Play,
  ChevronRight,
  CheckCircle2,
  FileText,
  Database,
  Star,
  Copy,
  Check,
  Download,
  Github,
  ExternalLink,
  Zap,
  Lock,
  Laptop,
  ArrowRight,
  TrendingUp,
  Layers,
  Microscope,
  MessageSquare,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const modelData = {
  id: 'cellvit-pp',
  name: 'CellViT++ 细胞分割与分类',
  version: 'v1.2.0',
  status: 'active' as const,
  verified: true,
  author: 'Medical Imaging Lab, Stanford',
  updatedAt: '3 days ago',
  popularity: 1240,
  rating: 4.8,
  reviewCount: 12,
  downloads: 1200,
  description:
    '基于Vision Transformer架构的细胞核检测与分类模型，支持多种器官类型的H&E染色切片。采用分层特征提取策略，在PanNuke、MoNuSAC等数据集上达到SOTA性能。\n\n该模型使用改进的CellViT架构，引入了多尺度特征融合模块和自适应注意力机制，能够在保持高精度的同时实现更快的推理速度。支持GPU加速和批量处理，适用于大规模病理切片分析工作流。',
  organs: ['胃', '肠', '乳腺', '肺', '肝', '肾', '前列腺'],
  functions: ['分割', '检测', '分类'],
  paper: 'Nature Methods 2024',
  validationDataset: 'TCGA-STAD n=400',
  f1Score: 0.94,
  license: 'MIT License',
  lastUpdated: '2025.01.15',
  deploymentType: '本地部署',
  suiteCount: 3,
  parameters: [
    { name: 'model_weights_path', type: 'path', default: 'auto-detect', description: '模型权重文件路径' },
    { name: 'batch_size', type: 'number', default: '16', description: '推理批次大小' },
    { name: 'confidence_threshold', type: 'range(0-1)', default: '0.5', description: '置信度阈值' },
    { name: 'magnification', type: 'select', default: '40X', description: '分析倍率' },
    { name: 'use_gpu', type: 'boolean', default: 'true', description: '使用GPU加速' },
    { name: 'analysis_region', type: 'select', default: '全片', description: '分析区域范围' },
    { name: 'tile_size', type: 'number', default: '512', description: '瓦片大小（像素）' },
    { name: 'overlap_ratio', type: 'range(0-1)', default: '0.2', description: '瓦片重叠比例' },
    { name: 'nms_threshold', type: 'range(0-1)', default: '0.3', description: '非极大值抑制阈值' },
    { name: 'num_classes', type: 'number', default: '5', description: '细胞类别数量' },
  ],
  benchmarks: [
    { dataset: 'PanNuke', organ: '胃、肠、乳腺', f1: 0.89, dice: 0.85, auc: 0.92, speed: 12.5 },
    { dataset: 'MoNuSAC', organ: '多种', f1: 0.87, dice: 0.82, auc: 0.88, speed: 10.2 },
    { dataset: 'TNBC', organ: '乳腺', f1: 0.91, dice: 0.88, auc: 0.94, speed: 14.1 },
    { dataset: 'Lizard', organ: '结肠', f1: 0.85, dice: 0.80, auc: 0.86, speed: 11.8 },
  ],
  reviews: [
    {
      id: 1,
      name: '张医生',
      avatar: 'Z',
      rating: 5,
      date: '2025-01-10',
      content: '这个模型在胃部切片上的表现非常出色，细胞核检测准确率很高。与QuPath的集成也很顺畅。',
      verified: true,
      version: 'CellViT++ v1.2.0',
    },
    {
      id: 2,
      name: '李研究员',
      avatar: 'L',
      rating: 5,
      date: '2025-01-08',
      content: '在乳腺癌切片测试中，分割精度明显优于传统方法。推理速度也很快，RTX 4090上能达到15 patches/sec。',
      verified: true,
      version: 'CellViT++ v1.1.5',
    },
    {
      id: 3,
      name: '王病理师',
      avatar: 'W',
      rating: 4,
      date: '2025-01-05',
      content: '整体效果满意，但在某些重叠区域的细胞分割上还有提升空间。希望能增加对HE以外染色的支持。',
      verified: false,
      version: 'CellViT++ v1.2.0',
    },
  ],
  examples: [
    { label: '胃切片 - 细胞核检测', cells: 2456, magnification: '40X' },
    { label: '乳腺切片 - 肿瘤区域分割', cells: 1892, magnification: '40X' },
    { label: '肠切片 - 炎症细胞分类', cells: 3201, magnification: '20X' },
  ],
};

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0, 0, 0.2, 1] as [number, number, number, number] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as [number, number, number, number] } },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getTypeColor(type: string) {
  if (type === 'string') return { bg: 'rgba(166,78,208,0.10)', text: '#a64ed0' };
  if (type === 'number') return { bg: 'rgba(34,197,94,0.10)', text: '#22c55e' };
  if (type === 'boolean') return { bg: 'rgba(168,85,247,0.10)', text: '#a855f7' };
  if (type === 'select') return { bg: 'rgba(245,158,11,0.10)', text: '#f59e0b' };
  if (type.includes('range')) return { bg: 'rgba(143,53,183,0.10)', text: '#8f35b7' };
  if (type === 'path') return { bg: 'rgba(248,113,113,0.10)', text: '#f87171' };
  return { bg: 'rgba(255,255,255,0.06)', text: '#94a3b8' };
}

function getTypeShort(type: string) {
  if (type.includes('range')) return 'range';
  return type;
}

/* ------------------------------------------------------------------ */
/*  Sub-Components                                                     */
/* ------------------------------------------------------------------ */

function Breadcrumb() {
  return (
    <nav className="flex items-center gap-2 text-xs text-[#64748b] mb-4">
      <Link to="/" className="hover:text-[#94a3b8] transition-colors">
        首页
      </Link>
      <ChevronRight size={14} />
      <Link to="/explore" className="hover:text-[#94a3b8] transition-colors">
        探索
      </Link>
      <ChevronRight size={14} />
      <span className="text-[#94a3b8]">{modelData.name}</span>
    </nav>
  );
}

function TrustSignalBar() {
  const signals = [
    { icon: FileText, label: modelData.paper, color: '#a64ed0' },
    { icon: Database, label: modelData.validationDataset, color: '#a855f7' },
    { icon: TargetIcon, label: `F1 ${modelData.f1Score}`, color: '#8f35b7' },
    { icon: Lock, label: '数据不出院', color: '#22c55e', badge: true },
    { icon: Laptop, label: '本地运行', color: '#f59e0b', badge: true },
  ];

  return (
    <motion.div
      className="bg-[#1f2024] border-b border-white/[0.06] py-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <div className="section-container">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
          {signals.map((s, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2 shrink-0"
              variants={staggerItem}
            >
              {s.badge ? (
                <span
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                  style={{
                    background: `${s.color}20`,
                    color: s.color,
                    borderColor: `${s.color}40`,
                  }}
                >
                  <s.icon size={14} />
                  {s.label}
                </span>
              ) : (
                <>
                  <s.icon size={16} style={{ color: s.color }} />
                  <span className="text-xs text-[#94a3b8] whitespace-nowrap">{s.label}</span>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function TargetIcon({ size, color }: { size: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center justify-center w-8 h-8 rounded-lg text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all duration-150"
      aria-label="复制"
    >
      {copied ? <Check size={16} className="text-[#22c55e]" /> : <Copy size={16} />}
    </button>
  );
}

function Sidebar() {
  const depList = [
    'python >= 3.9',
    'torch >= 2.0.0',
    'opencv-python >= 4.8',
    'openslide-python >= 1.3',
  ];

  return (
    <aside className="flex flex-col gap-4 sticky top-[100px] h-fit">
      {/* Model Info Card */}
      <div className="bg-[#24262c] border border-white/[0.06] rounded-xl p-5">
        <h4 className="text-[#e2e8f0] font-semibold text-base mb-3">模型信息</h4>
        <div className="space-y-2.5">
          {[
            { label: '模型ID', value: modelData.id },
            { label: '部署类型', value: modelData.deploymentType },
            { label: '状态', value: (
              <span className="status-badge status-active">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] inline-block" />
                运行中
              </span>
            ) },
            { label: '套件数量', value: `${modelData.suiteCount} 个` },
            { label: '版本', value: modelData.version },
            { label: '协议', value: modelData.license },
            { label: '框架', value: 'PyTorch 2.0' },
            { label: 'CUDA', value: '11.8+' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
              <span className="text-xs text-[#64748b]">{row.label}</span>
              <span className="text-sm text-[#e2e8f0]">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Parameters Overview */}
      <div className="bg-[#24262c] border border-white/[0.06] rounded-xl p-5">
        <h4 className="text-[#e2e8f0] font-semibold text-base mb-3">参数概览</h4>
        <div className="space-y-2">
          {modelData.parameters.slice(0, 5).map((p) => {
            const tc = getTypeColor(p.type);
            return (
              <div key={p.name} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium"
                    style={{ background: tc.bg, color: tc.text }}
                  >
                    {getTypeShort(p.type)}
                  </span>
                  <span className="text-xs text-[#94a3b8]">{p.name}</span>
                </div>
                <span className="text-xs font-mono text-[#e2e8f0]">{p.default}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Config */}
      <div className="bg-[#24262c] border border-white/[0.06] rounded-xl p-5">
        <h4 className="text-[#e2e8f0] font-semibold text-base mb-3">快速配置</h4>
        <div className="space-y-3">
          {modelData.parameters.slice(0, 3).map((p) => (
            <div key={p.name}>
              <label className="text-xs text-[#64748b] block mb-1.5">{p.description}</label>
              <input
                type="text"
                defaultValue={p.default}
                className="input-field w-full text-sm h-9"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dependencies */}
      <div className="bg-[#24262c] border border-white/[0.06] rounded-xl p-5">
        <h4 className="text-[#e2e8f0] font-semibold text-base mb-3">依赖环境</h4>
        <div className="space-y-2">
          {depList.map((dep) => (
            <div key={dep} className="flex items-center justify-between">
              <code className="text-xs text-[#94a3b8] font-mono">{dep}</code>
              <CopyButton text={dep} />
            </div>
          ))}
        </div>
      </div>

      {/* CTA Card */}
      <div
        className="rounded-xl p-5 border"
        style={{
          background: 'linear-gradient(135deg, rgba(143,53,183,0.08) 0%, rgba(166,78,208,0.05) 100%)',
          borderColor: 'rgba(143,53,183,0.20)',
        }}
      >
        <h4 className="text-[#e2e8f0] font-semibold text-base">准备好体验了吗？</h4>
        <p className="text-sm text-[#94a3b8] mt-2">在工作台中一键加载并运行此模型</p>
        <Link
          to={`/workbench?model=${modelData.id}`}
          className="btn-primary w-full mt-4"
        >
          <Play size={16} />
          打开工作台
        </Link>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab Contents                                                       */
/* ------------------------------------------------------------------ */

function TabOverview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Model Description Card */}
      <div className="bg-[#24262c] border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-[#e2e8f0] font-semibold text-lg mb-4">模型说明</h3>
        <div className="text-[#94a3b8] text-[15px] leading-relaxed space-y-4">
          <p>
            CellViT++ 是基于Vision Transformer的细胞核检测与分类模型，采用分层特征提取策略，
            在保持高精度的同时实现更快的推理速度。该模型支持多种器官类型的H&E染色切片分析，
            包括胃、肠、乳腺、肺、肝、肾、前列腺等常见器官。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="text-[#e2e8f0] font-medium text-sm mb-2">支持的器官类型</h4>
              <div className="flex flex-wrap gap-2">
                {modelData.organs.map((o) => (
                  <span key={o} className="tag-organ">
                    <Microscope size={12} />
                    {o}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[#e2e8f0] font-medium text-sm mb-2">支持的功能</h4>
              <div className="flex flex-wrap gap-2">
                {modelData.functions.map((f) => (
                  <span key={f} className="tag-function">
                    <Zap size={12} />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-white/[0.06]">
            <h4 className="text-[#e2e8f0] font-medium text-sm mb-2">技术规格</h4>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#8f35b7] mt-0.5">•</span>
                <span>输入规格：WSI patch (512×512 pixels), 40X magnification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#8f35b7] mt-0.5">•</span>
                <span>输出格式：GeoJSON FeatureCollection，包含细胞核边界多边形和分类标签</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#8f35b7] mt-0.5">•</span>
                <span>硬件要求：NVIDIA GPU, 8GB+ VRAM, CUDA 11.8+</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#8f35b7] mt-0.5">•</span>
                <span>支持的染色类型：H&E、IHC（Ki-67、PD-L1、ER/PR/Her2）</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Key Parameters Preview */}
      <div className="bg-[#24262c] border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#e2e8f0] font-semibold text-lg">关键参数</h3>
          <button className="text-xs text-[#8f35b7] hover:text-[#b86bdd] flex items-center gap-1 transition-colors">
            查看全部 <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modelData.parameters.slice(0, 4).map((p) => (
            <div key={p.name} className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
              <span className="text-sm text-[#94a3b8]">{p.description}</span>
              <span className="text-sm font-medium text-[#e2e8f0]">{p.default}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Preview */}
      <div className="bg-[#24262c] border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-[#e2e8f0] font-semibold text-lg mb-4">演示效果</h3>
        <div className="relative rounded-lg overflow-hidden bg-[#111217] aspect-[4/3]">
          {/* Simulated WSI image with overlays */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-[#1a1025] via-[#2d1b3d] to-[#1a1025] relative overflow-hidden">
              {/* Simulated tissue pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 400 300">
                {Array.from({ length: 30 }).map((_, i) => (
                  <ellipse
                    key={i}
                    cx={Math.random() * 400}
                    cy={Math.random() * 300}
                    rx={20 + Math.random() * 40}
                    ry={15 + Math.random() * 30}
                    fill={['#8b5a6b', '#a67b8b', '#7a4e5e', '#9b6a7a'][i % 4]}
                    opacity={0.3 + Math.random() * 0.3}
                  />
                ))}
                {/* Annotation overlays - simulated cells */}
                {Array.from({ length: 20 }).map((_, i) => (
                  <g key={`cell-${i}`}>
                    <circle
                      cx={50 + (i % 5) * 70 + Math.random() * 20}
                      cy={40 + Math.floor(i / 5) * 60 + Math.random() * 20}
                      r={8 + Math.random() * 6}
                      fill="none"
                      stroke={['#22c55e', '#7c2bc6', '#f59e0b', '#a855f7'][i % 4]}
                      strokeWidth="1.5"
                      opacity={0.8}
                    />
                  </g>
                ))}
              </svg>
            </div>
          </div>
          {/* Overlay badges */}
          <div className="absolute top-3 left-3 bg-[#24262c] border border-white/[0.08] rounded-md px-2 py-1 text-[10px] text-[#94a3b8] font-mono">
            40X
          </div>
          <div className="absolute bottom-3 right-3 bg-[#24262c] border border-white/[0.08] rounded-md px-2 py-1 text-[10px] text-[#94a3b8]">
            2,456 cells detected
          </div>
        </div>
        <p className="text-xs text-[#64748b] mt-3 text-center">H&E胃切片细胞核检测与分类结果</p>
      </div>
    </motion.div>
  );
}

function TabParameters() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-[#24262c] border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[1.2fr_0.8fr_1.5fr_1fr] gap-4 px-5 py-3 bg-white/[0.02] text-[11px] uppercase tracking-wider text-[#64748b] font-medium border-b border-white/[0.04]">
          <span>参数名称</span>
          <span>类型</span>
          <span>说明</span>
          <span>默认值</span>
        </div>
        {/* Table Rows */}
        {modelData.parameters.map((p, i) => {
          const tc = getTypeColor(p.type);
          return (
            <div
              key={p.name}
              className={`grid grid-cols-[1.2fr_0.8fr_1.5fr_1fr] gap-4 px-5 py-3.5 items-center border-b border-white/[0.04] ${
                i % 2 === 1 ? 'bg-white/[0.015]' : ''
              }`}
            >
              <span className="text-sm text-[#e2e8f0] font-medium font-mono">{p.name}</span>
              <span
                className="text-xs px-2 py-0.5 rounded font-mono font-medium w-fit"
                style={{ background: tc.bg, color: tc.text }}
              >
                {getTypeShort(p.type)}
              </span>
              <span className="text-sm text-[#94a3b8]">{p.description}</span>
              <span className="text-sm text-[#e2e8f0] font-mono">{p.default}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function TabBenchmarks() {
  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#2f3239',
      borderColor: 'rgba(255,255,255,0.08)',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
    },
    legend: {
      data: ['F1 Score', 'Dice Score', 'AUC'],
      textStyle: { color: '#94a3b8', fontSize: 12 },
      bottom: 0,
    },
    grid: { left: 50, right: 20, top: 30, bottom: 50 },
    xAxis: {
      type: 'category',
      data: modelData.benchmarks.map((b) => b.dataset),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: { color: '#94a3b8', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      min: 0.7,
      max: 1.0,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      axisLabel: { color: '#64748b', fontSize: 12 },
    },
    series: [
      {
        name: 'F1 Score',
        type: 'bar',
        data: modelData.benchmarks.map((b) => b.f1),
        itemStyle: { color: '#8f35b7', borderRadius: [4, 4, 0, 0] },
        barWidth: '20%',
      },
      {
        name: 'Dice Score',
        type: 'bar',
        data: modelData.benchmarks.map((b) => b.dice),
        itemStyle: { color: '#a64ed0', borderRadius: [4, 4, 0, 0] },
        barWidth: '20%',
      },
      {
        name: 'AUC',
        type: 'bar',
        data: modelData.benchmarks.map((b) => b.auc),
        itemStyle: { color: '#a855f7', borderRadius: [4, 4, 0, 0] },
        barWidth: '20%',
      },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { value: '0.89', label: 'F1 Score (PanNuke)', trend: '↑ +0.03 vs v1.1', color: '#8f35b7' },
          { value: '0.82', label: 'Dice Score (MoNuSAC)', trend: '↑ +0.02 vs v1.1', color: '#a64ed0' },
          { value: '12.5', label: 'Inference Speed (patches/sec)', trend: '↑ +2.1 vs v1.1', color: '#a855f7' },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-[#24262c] border border-white/[0.06] rounded-xl p-6 text-center"
          >
            <div className="text-4xl font-bold tab-nums" style={{ color: m.color }}>
              {m.value}
            </div>
            <div className="text-sm text-[#94a3b8] mt-2">{m.label}</div>
            <div className="text-xs text-[#22c55e] mt-1">{m.trend}</div>
          </div>
        ))}
      </div>

      {/* Benchmark Chart */}
      <div className="bg-[#24262c] border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-[#e2e8f0] font-semibold text-lg mb-4">性能对比</h3>
        <ReactECharts option={chartOption} style={{ height: 320 }} />
      </div>

      {/* Benchmark Details Table */}
      <div className="bg-[#24262c] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-3 bg-white/[0.02] text-[11px] uppercase tracking-wider text-[#64748b] font-medium border-b border-white/[0.04]">
          <span>数据集</span>
          <span>器官类型</span>
          <span className="text-center">F1</span>
          <span className="text-center">Dice</span>
          <span className="text-center">AUC</span>
          <span className="text-center">速度</span>
        </div>
        {modelData.benchmarks.map((b, i) => (
          <div
            key={b.dataset}
            className={`grid grid-cols-[1fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 px-5 py-3.5 items-center border-b border-white/[0.04] ${
              i % 2 === 1 ? 'bg-white/[0.015]' : ''
            }`}
          >
            <span className="text-sm text-[#e2e8f0] font-medium">{b.dataset}</span>
            <span className="text-sm text-[#94a3b8]">{b.organ}</span>
            <span className="text-sm text-[#e2e8f0] font-mono text-center">{b.f1.toFixed(2)}</span>
            <span className="text-sm text-[#e2e8f0] font-mono text-center">{b.dice.toFixed(2)}</span>
            <span className="text-sm text-[#e2e8f0] font-mono text-center">{b.auc.toFixed(2)}</span>
            <span className="text-sm text-[#e2e8f0] font-mono text-center">{b.speed} p/s</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function TabExamples() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      // ignore
    }
  };

  const pythonCode = `from huggingpath import ModelRunner

# 加载模型
model = ModelRunner.load("cellvit-pp")

# 运行分析
results = model.infer(
    wsi_path="/path/to/slide.svs",
    organ="stomach",
    confidence_threshold=0.5
)

# 导出结果
results.export_geojson("/output/annotations.json")`;

  const cliCode = `$ huggingpath run cellvit-pp \\
    --wsi /path/to/slide.svs \\
    --organ stomach \\
    --output /path/to/results/`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Demo Results */}
      <div className="bg-[#24262c] border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-[#e2e8f0] font-semibold text-lg mb-4">示例输出</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {modelData.examples.map((ex, i) => (
            <div key={i} className="relative rounded-lg overflow-hidden bg-[#111217] aspect-[4/3] group">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-[#1a1025] via-[#2d1b3d] to-[#1a1025] relative overflow-hidden">
                  <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 200 150">
                    {Array.from({ length: 20 }).map((_, j) => (
                      <ellipse
                        key={j}
                        cx={Math.random() * 200}
                        cy={Math.random() * 150}
                        rx={15 + Math.random() * 25}
                        ry={10 + Math.random() * 20}
                        fill={['#8b5a6b', '#a67b8b', '#7a4e5e'][j % 3]}
                        opacity={0.3 + Math.random() * 0.3}
                      />
                    ))}
                    {Array.from({ length: 12 }).map((_, j) => (
                      <circle
                        key={`cell-${j}`}
                        cx={30 + (j % 4) * 40 + Math.random() * 10}
                        cy={25 + Math.floor(j / 4) * 40 + Math.random() * 10}
                        r={6 + Math.random() * 5}
                        fill="none"
                        stroke={['#22c55e', '#7c2bc6', '#f59e0b'][j % 3]}
                        strokeWidth="1.5"
                        opacity={0.8}
                      />
                    ))}
                  </svg>
                </div>
              </div>
              <div className="absolute top-2 left-2 bg-[#24262c]/90 border border-white/[0.08] rounded px-1.5 py-0.5 text-[10px] text-[#94a3b8] font-mono">
                {ex.magnification}
              </div>
              <div className="absolute bottom-2 right-2 bg-[#24262c]/90 border border-white/[0.08] rounded px-1.5 py-0.5 text-[10px] text-[#94a3b8]">
                {ex.cells.toLocaleString()} cells
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                <p className="text-xs text-white/90">{ex.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Python API Example */}
      <div className="bg-[#24262c] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-white/[0.02] border-b border-white/[0.04]">
          <span className="text-sm text-[#e2e8f0] font-medium">Python API 调用示例</span>
          <button
            onClick={() => handleCopy(pythonCode, 0)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all duration-150"
          >
            {copiedIdx === 0 ? <Check size={16} className="text-[#22c55e]" /> : <Copy size={16} />}
          </button>
        </div>
        <pre className="p-5 overflow-x-auto text-[13px] leading-relaxed font-mono bg-[#111217]">
          <code className="text-[#abb2bf]">
            <span className="text-[#c678dd]">from</span>{' '}
            <span className="text-[#e2e8f0]">huggingpath</span>{' '}
            <span className="text-[#c678dd]">import</span>{' '}
            <span className="text-[#e2e8f0]">ModelRunner</span>
            {'\n'}
            {'\n'}
            <span className="text-[#5c6370]"># 加载模型</span>
            {'\n'}
            <span className="text-[#e2e8f0]">model</span>{' '}
            <span className="text-[#c678dd]">=</span>{' '}
            <span className="text-[#61afef]">ModelRunner.load</span>
            <span className="text-[#e2e8f0]">(</span>
            <span className="text-[#98c379]">&quot;cellvit-pp&quot;</span>
            <span className="text-[#e2e8f0]">)</span>
            {'\n'}
            {'\n'}
            <span className="text-[#5c6370]"># 运行分析</span>
            {'\n'}
            <span className="text-[#e2e8f0]">results</span>{' '}
            <span className="text-[#c678dd]">=</span>{' '}
            <span className="text-[#61afef]">model.infer</span>
            <span className="text-[#e2e8f0]">(</span>
            {'\n'}
            {'    '}<span className="text-[#e06c75]">wsi_path</span>
            <span className="text-[#c678dd]">=</span>
            <span className="text-[#98c379]">&quot;/path/to/slide.svs&quot;</span>
            <span className="text-[#e2e8f0]">,</span>
            {'\n'}
            {'    '}<span className="text-[#e06c75]">organ</span>
            <span className="text-[#c678dd]">=</span>
            <span className="text-[#98c379]">&quot;stomach&quot;</span>
            <span className="text-[#e2e8f0]">,</span>
            {'\n'}
            {'    '}<span className="text-[#e06c75]">confidence_threshold</span>
            <span className="text-[#c678dd]">=</span>
            <span className="text-[#d19a66]">0.5</span>
            {'\n'}
            <span className="text-[#e2e8f0]">)</span>
            {'\n'}
            {'\n'}
            <span className="text-[#5c6370]"># 导出结果</span>
            {'\n'}
            <span className="text-[#61afef]">results.export_geojson</span>
            <span className="text-[#e2e8f0]">(</span>
            <span className="text-[#98c379]">&quot;/output/annotations.json&quot;</span>
            <span className="text-[#e2e8f0]">)</span>
          </code>
        </pre>
      </div>

      {/* CLI Example */}
      <div className="bg-[#24262c] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-white/[0.02] border-b border-white/[0.04]">
          <span className="text-sm text-[#e2e8f0] font-medium">命令行调用示例</span>
          <button
            onClick={() => handleCopy(cliCode, 1)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all duration-150"
          >
            {copiedIdx === 1 ? <Check size={16} className="text-[#22c55e]" /> : <Copy size={16} />}
          </button>
        </div>
        <pre className="p-5 overflow-x-auto text-[13px] leading-relaxed font-mono bg-[#111217]">
          <code className="text-[#abb2bf]">
            <span className="text-[#c678dd]">$</span>{' '}
            <span className="text-[#e2e8f0]">huggingpath run cellvit-pp \</span>
            {'\n'}
            {'    '}<span className="text-[#e06c75]">--wsi</span>{' '}
            <span className="text-[#98c379]">/path/to/slide.svs</span>{' '}
            <span className="text-[#e2e8f0]">\</span>
            {'\n'}
            {'    '}<span className="text-[#e06c75]">--organ</span>{' '}
            <span className="text-[#98c379]">stomach</span>{' '}
            <span className="text-[#e2e8f0]">\</span>
            {'\n'}
            {'    '}<span className="text-[#e06c75]">--output</span>{' '}
            <span className="text-[#98c379]">/path/to/results/</span>
          </code>
        </pre>
      </div>
    </motion.div>
  );
}

function TabReviews() {
  const ratingBreakdown = [
    { stars: 5, count: 8 },
    { stars: 4, count: 2 },
    { stars: 3, count: 1 },
    { stars: 2, count: 0 },
    { stars: 1, count: 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Rating Summary */}
      <div className="bg-[#24262c] border border-white/[0.06] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Big Rating */}
          <div className="text-center">
            <div className="text-5xl font-bold text-[#8f35b7]">{modelData.rating}</div>
            <div className="flex items-center justify-center gap-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={i < Math.floor(modelData.rating) ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-[#475569]'}
                />
              ))}
            </div>
            <p className="text-xs text-[#64748b] mt-2">基于 {modelData.reviewCount} 条评价</p>
          </div>
          {/* Rating Breakdown */}
          <div className="flex-1 w-full max-w-xs space-y-2">
            {ratingBreakdown.map((r) => (
              <div key={r.stars} className="flex items-center gap-3">
                <span className="text-xs text-[#94a3b8] w-6">{r.stars}★</span>
                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#f59e0b] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(r.count / modelData.reviewCount) * 100}%` }}
                    transition={{ duration: 0.6, delay: r.stars * 0.08, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
                  />
                </div>
                <span className="text-xs text-[#64748b] w-4">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Cards */}
      <div className="space-y-4">
        {modelData.reviews.map((review, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
            className="bg-[#24262c] border border-white/[0.06] rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#8f35b7]/20 flex items-center justify-center text-sm font-medium text-[#8f35b7]">
                  {review.avatar}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#e2e8f0]">{review.name}</div>
                  <div className="text-xs text-[#64748b]">{review.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    size={14}
                    className={j < review.rating ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-[#475569]'}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-[#94a3b8] leading-relaxed">{review.content}</p>
            <div className="flex items-center gap-3 mt-3">
              {review.verified && (
                <span className="status-badge status-active text-[10px]">
                  <CheckCircle2 size={12} />
                  已验证使用
                </span>
              )}
              <span className="text-xs text-[#64748b]">{review.version}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const tabs = [
  { key: 'overview', label: '模型说明' },
  { key: 'parameters', label: '参数配置' },
  { key: 'benchmarks', label: '基准测试' },
  { key: 'examples', label: '示例输出' },
  { key: 'reviews', label: '用户评价' },
];

export default function ModelDetail() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-[60dvh]">
      {/* Header Section */}
      <section className="bg-[#0f1014] border-b border-white/[0.06] pt-24 pb-10">
        <div className="section-container">
          <Breadcrumb />

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
            {/* Left: Model Info */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.12 } },
              }}
            >
              {/* Status row */}
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-3">
                <span className="status-badge status-active">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] inline-block" />
                  运行中
                </span>
                <span className="text-xs text-[#64748b]">{modelData.version}</span>
                <span className="text-xs text-[#64748b]">·</span>
                <span className="text-xs text-[#64748b] flex items-center gap-1">
                  <TrendingUp size={12} />
                  {modelData.popularity.toLocaleString()} 次使用
                </span>
              </motion.div>

              {/* Model Name */}
              <motion.h1
                variants={fadeUp}
                className="text-[28px] font-semibold text-[#e2e8f0] leading-tight tracking-tight"
              >
                {modelData.name}
              </motion.h1>

              {/* Model ID */}
              <motion.div variants={fadeUp} className="flex items-center gap-2 mt-2">
                <code className="text-[13px] text-[#475569] font-mono">
                  {modelData.id} / {modelData.version}
                </code>
                <CopyButton text={`${modelData.id} / ${modelData.version}`} />
              </motion.div>

              {/* Author */}
              <motion.div variants={fadeUp} className="flex items-center gap-2 mt-3 text-sm text-[#94a3b8]">
                <div className="w-7 h-7 rounded-full bg-[#8f35b7]/20 flex items-center justify-center text-xs font-medium text-[#8f35b7]">
                  S
                </div>
                <span>{modelData.author}</span>
                <span>·</span>
                <span>Updated {modelData.updatedAt}</span>
              </motion.div>

              {/* Description */}
              <motion.p
                variants={fadeUp}
                className="text-[15px] text-[#94a3b8] leading-relaxed mt-4 max-w-[600px]"
              >
                {modelData.description}
              </motion.p>

              {/* Tags */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mt-4">
                {modelData.organs.map((o) => (
                  <span key={o} className="tag-organ">
                    <Microscope size={12} />
                    {o}
                  </span>
                ))}
                {modelData.functions.map((f) => (
                  <span key={f} className="tag-function">
                    <Zap size={12} />
                    {f}
                  </span>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div variants={fadeUp} className="flex items-center gap-3 mt-6">
                <Link
                  to={`/workbench?model=${modelData.id}`}
                  className="btn-primary"
                >
                  <Play size={16} />
                  在工作台中运行
                </Link>
                <Link to="/explore" className="btn-secondary">
                  <Layers size={16} />
                  查看模型目录
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: Quick Actions */}
            <motion.div
              className="flex flex-col gap-3 lg:items-end"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
            >
              <div className="flex items-center gap-2">
                <button className="flex items-center justify-center w-10 h-10 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all duration-150 border border-white/[0.06]">
                  <Copy size={18} />
                </button>
                <button className="flex items-center justify-center w-10 h-10 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all duration-150 border border-white/[0.06]">
                  <Download size={18} />
                </button>
                <button className="flex items-center justify-center w-10 h-10 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all duration-150 border border-white/[0.06]">
                  <Github size={18} />
                </button>
                <button className="flex items-center justify-center w-10 h-10 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all duration-150 border border-white/[0.06]">
                  <ExternalLink size={18} />
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#64748b] mt-1">
                <span className="flex items-center gap-1">
                  <Download size={12} />
                  {(modelData.downloads / 1000).toFixed(1)}k
                </span>
                <span className="flex items-center gap-1">
                  <Star size={12} className="text-[#f59e0b] fill-[#f59e0b]" />
                  {modelData.rating}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} />
                  {modelData.reviewCount}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Signal Bar */}
      <TrustSignalBar />

      {/* Main Content — Two Column */}
      <section className="bg-[#0f1014] py-8 pb-20">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            {/* Left Column — Tabs + Content */}
            <div>
              {/* Tab Navigation */}
              <div className="flex items-center gap-0 border-b border-white/[0.06] mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 -mb-px ${
                      activeTab === tab.key
                        ? 'text-[#8f35b7] border-[#8f35b7]'
                        : 'text-[#94a3b8] border-transparent hover:text-[#e2e8f0]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div key="overview">
                    <TabOverview />
                  </motion.div>
                )}
                {activeTab === 'parameters' && (
                  <motion.div key="parameters">
                    <TabParameters />
                  </motion.div>
                )}
                {activeTab === 'benchmarks' && (
                  <motion.div key="benchmarks">
                    <TabBenchmarks />
                  </motion.div>
                )}
                {activeTab === 'examples' && (
                  <motion.div key="examples">
                    <TabExamples />
                  </motion.div>
                )}
                {activeTab === 'reviews' && (
                  <motion.div key="reviews">
                    <TabReviews />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column — Sticky Sidebar */}
            <div className="hidden lg:block">
              <Sidebar />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
