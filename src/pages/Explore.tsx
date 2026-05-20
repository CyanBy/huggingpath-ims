import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutGrid,
  List,
  X,
  ChevronDown,
  Play,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Ban,
  Star,
  Download,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */


type ViewMode = 'card' | 'list';

type ModelStatus = 'Active' | 'Testing' | 'Not Configured' | 'Unavailable';

interface Model {
  id: string;
  name: string;
  status: ModelStatus;
  organs: string[];
  functions: string[];
  summary: string;
  deployment: string;
  popularity: number;
  author: string;
  updatedAt: string;
  downloads: string;
  rating: number;
  reviews: number;
  verified: boolean;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                           */
/* ------------------------------------------------------------------ */

const MODELS: Model[] = [
  {
    id: 'ai4path/cellvit-v2',
    name: 'CellViT V2',
    status: 'Active',
    organs: ['胃', '肠', '乳腺'],
    functions: ['分割', '分类'],
    summary: '基于Vision Transformer的细胞核分割与分类模型，支持多种组织类型的H&E染色切片分析。',
    deployment: '本地部署',
    popularity: 98,
    author: 'AI4Path Team',
    updatedAt: '3天前',
    downloads: '2.1k',
    rating: 4.8,
    reviews: 36,
    verified: true,
  },
  {
    id: 'patho/hover-net-gastric',
    name: 'Hover-Net 胃部分割',
    status: 'Active',
    organs: ['胃'],
    functions: ['分割', '检测'],
    summary: '针对胃部病理切片的细胞核实例分割模型，在DigestPath数据集上达到SOTA性能。',
    deployment: '云端API',
    popularity: 87,
    author: 'PathoAI Lab',
    updatedAt: '1周前',
    downloads: '1.5k',
    rating: 4.6,
    reviews: 24,
    verified: true,
  },
  {
    id: 'uni/tiatoolbox-seg',
    name: 'TIAToolbox 通用分割',
    status: 'Testing',
    organs: ['肠', '肺', '肝'],
    functions: ['分割', '预处理'],
    summary: '通用的病理图像分割工具箱，集成多种经典分割算法，支持快速迁移学习。',
    deployment: '本地部署',
    popularity: 72,
    author: 'TIA Centre',
    updatedAt: '2周前',
    downloads: '890',
    rating: 4.3,
    reviews: 15,
    verified: false,
  },
  {
    id: 'deeppath/lung-tumor-cls',
    name: '肺癌分类模型',
    status: 'Active',
    organs: ['肺'],
    functions: ['分类', '肿瘤微环境'],
    summary: '基于ResNet-50的肺腺癌与鳞癌分类模型，准确率96.2%，支持WSI级推理。',
    deployment: '云端API',
    popularity: 91,
    author: 'DeepPath Research',
    updatedAt: '5天前',
    downloads: '3.2k',
    rating: 4.9,
    reviews: 42,
    verified: true,
  },
  {
    id: 'oppen/prostate-grade',
    name: '前列腺癌分级',
    status: 'Not Configured',
    organs: ['前列腺'],
    functions: ['分类', '分析'],
    summary: 'Gleason评分自动分级模型，识别前列腺癌组织的分级模式，支持ISUP 2014标准。',
    deployment: '本地部署',
    popularity: 45,
    author: 'OpenPathology',
    updatedAt: '1月前',
    downloads: '420',
    rating: 4.1,
    reviews: 8,
    verified: false,
  },
  {
    id: 'brainpath/glioma-seg',
    name: '胶质瘤分割模型',
    status: 'Active',
    organs: ['脑'],
    functions: ['分割', '检测'],
    summary: '针对H&E染色脑组织切片的胶质瘤区域分割，支持坏死、强化及非强化肿瘤区域识别。',
    deployment: '本地部署',
    popularity: 76,
    author: 'BrainPath Institute',
    updatedAt: '2天前',
    downloads: '1.1k',
    rating: 4.5,
    reviews: 19,
    verified: true,
  },
  {
    id: 'spatial/slide-analysis-v1',
    name: '空间蛋白组分析',
    status: 'Unavailable',
    organs: ['乳腺', '淋巴结'],
    functions: ['空间蛋白组', '分析'],
    summary: '多重免疫荧光(MxIF)图像的空间蛋白组分析套件，支持细胞邻域分析和通路富集。',
    deployment: '云端API',
    popularity: 33,
    author: 'SpatialOmics Lab',
    updatedAt: '3月前',
    downloads: '210',
    rating: 3.9,
    reviews: 5,
    verified: false,
  },
  {
    id: 'kidney-ai/glomeruli-detect',
    name: '肾小球检测模型',
    status: 'Testing',
    organs: ['肾'],
    functions: ['检测', '分割'],
    summary: '肾脏病理切片中肾小球自动检测与分割，支持PAS染色，输出形态学量化指标。',
    deployment: '本地部署',
    popularity: 58,
    author: 'KidneyAI Consortium',
    updatedAt: '3周前',
    downloads: '650',
    rating: 4.4,
    reviews: 12,
    verified: false,
  },
];

const ORGAN_OPTIONS = ['胃', '肠', '脑', '乳腺', '肺', '肝', '肾', '前列腺'];
const FUNCTION_OPTIONS = ['分割', '检测', '分类', '肿瘤微环境', '空间蛋白组'];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function statusColor(status: ModelStatus) {
  switch (status) {
    case 'Active':
      return 'status-active';
    case 'Testing':
      return 'status-running';
    case 'Not Configured':
      return 'status-queued';
    case 'Unavailable':
      return 'status-failed';
    default:
      return 'status-queued';
  }
}

function statusIcon(status: ModelStatus) {
  switch (status) {
    case 'Active':
      return <CheckCircle2 size={12} />;
    case 'Testing':
      return <Clock size={12} />;
    case 'Not Configured':
      return <AlertCircle size={12} />;
    case 'Unavailable':
      return <Ban size={12} />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Stagger animation variants                                          */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as [number, number, number, number] },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as [number, number, number, number] } },
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                      */
/* ------------------------------------------------------------------ */

export default function Explore() {
  /* State */
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgans, setSelectedOrgans] = useState<string[]>([]);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [sortBy, setSortBy] = useState<string>('热度');
  const [showAllOrgans, setShowAllOrgans] = useState(false);

  /* Derived filter data */
  const visibleOrgans = showAllOrgans ? ORGAN_OPTIONS : ORGAN_OPTIONS.slice(0, 6);
  const hasMoreOrgans = ORGAN_OPTIONS.length > 6;

  /* Toggle helpers */
  const toggleOrgan = useCallback((organ: string) => {
    setSelectedOrgans((prev) =>
      prev.includes(organ) ? prev.filter((o) => o !== organ) : [...prev, organ]
    );
  }, []);

  const toggleFunction = useCallback((fn: string) => {
    setSelectedFunctions((prev) =>
      prev.includes(fn) ? prev.filter((f) => f !== fn) : [...prev, fn]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedOrgans([]);
    setSelectedFunctions([]);
    setStatusFilter('全部');
    setSortBy('热度');
  }, []);

  const activeFilterCount =
    selectedOrgans.length +
    selectedFunctions.length +
    (statusFilter !== '全部' ? 1 : 0);

  /* Filtering & sorting */
  const filteredModels = useMemo(() => {
    let data = [...MODELS];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.summary.toLowerCase().includes(q) ||
          m.author.toLowerCase().includes(q)
      );
    }

    // Organ filter (OR within category)
    if (selectedOrgans.length > 0) {
      data = data.filter((m) => m.organs.some((o) => selectedOrgans.includes(o)));
    }

    // Function filter (OR within category)
    if (selectedFunctions.length > 0) {
      data = data.filter((m) => m.functions.some((f) => selectedFunctions.includes(f)));
    }

    // Status filter
    if (statusFilter !== '全部') {
      data = data.filter((m) => m.status === statusFilter);
    }

    // Sort
    switch (sortBy) {
      case '热度':
        data.sort((a, b) => b.popularity - a.popularity);
        break;
      case '名称':
        data.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
        break;
      case '状态':
        data.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }

    return data;
  }, [searchQuery, selectedOrgans, selectedFunctions, statusFilter, sortBy]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-[60dvh]">
      {/* ==================== Page Header ==================== */}
      <section className="pt-24 pb-12 border-b border-white/[0.06]">
        <div className="section-container">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.1 } },
            }}
            className="flex flex-col gap-6"
          >
            {/* Eyebrow + Title */}
            <motion.div variants={headerVariants}>
              <span className="text-eyebrow uppercase text-[#64748b] tracking-widest">
                MODEL HUB
              </span>
              <h1 className="text-h1 text-[#e2e8f0] mt-2">探索模型</h1>
              <p className="text-body-lg text-[#94a3b8] mt-2">
                浏览、搜索并运行开源病理分割、检测、分类模型
              </p>
            </motion.div>

            {/* View Toggle + Result Count */}
            <motion.div
              variants={headerVariants}
              className="flex items-center justify-between"
            >
              <p className="text-caption text-[#64748b]">
                共 {filteredModels.length} 个模型
                {activeFilterCount > 0 && (
                  <span className="ml-2 text-brand-500">
                    （已筛选 {activeFilterCount} 项）
                  </span>
                )}
              </p>

              <div className="flex items-center bg-[#202228] rounded-lg p-1 gap-1">
                <button
                  onClick={() => setViewMode('card')}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150',
                    viewMode === 'card'
                      ? 'bg-[#24262c] text-[#e2e8f0] shadow-sm'
                      : 'text-[#64748b] hover:text-[#e2e8f0]'
                  )}
                  aria-label="卡片视图"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150',
                    viewMode === 'list'
                      ? 'bg-[#24262c] text-[#e2e8f0] shadow-sm'
                      : 'text-[#64748b] hover:text-[#e2e8f0]'
                  )}
                  aria-label="列表视图"
                >
                  <List size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ==================== Filter Toolbar ==================== */}
      <section className="sticky top-16 z-40 bg-[#0f1014]/95 backdrop-blur-md border-b border-white/[0.06] py-5">
        <div className="section-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索模型名称、作者、标签..."
                className="input-field h-10 w-full pl-9 pr-3 text-sm"
              />
            </div>

            {/* Organ Filter */}
            <div>
              <label className="text-caption text-[#64748b] block mb-1.5">器官</label>
              <div className="flex flex-wrap gap-1.5">
                {visibleOrgans.map((organ) => {
                  const selected = selectedOrgans.includes(organ);
                  return (
                    <button
                      key={organ}
                      onClick={() => toggleOrgan(organ)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150',
                        selected
                          ? 'bg-[rgba(166,78,208,0.15)] border-[rgba(166,78,208,0.40)] text-[#d292f4]'
                          : 'bg-transparent border-white/[0.08] text-[#94a3b8] hover:border-white/[0.15] hover:text-[#e2e8f0]'
                      )}
                    >
                      {organ}
                    </button>
                  );
                })}
                {hasMoreOrgans && (
                  <button
                    onClick={() => setShowAllOrgans((v) => !v)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border border-white/[0.08] text-[#94a3b8] hover:border-white/[0.15] hover:text-[#e2e8f0] transition-all duration-150"
                  >
                    {showAllOrgans ? '收起' : `+${ORGAN_OPTIONS.length - 6} 更多`}
                  </button>
                )}
              </div>
            </div>

            {/* Function Filter */}
            <div>
              <label className="text-caption text-[#64748b] block mb-1.5">功能</label>
              <div className="flex flex-wrap gap-1.5">
                {FUNCTION_OPTIONS.map((fn) => {
                  const selected = selectedFunctions.includes(fn);
                  return (
                    <button
                      key={fn}
                      onClick={() => toggleFunction(fn)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150',
                        selected
                          ? 'bg-[rgba(143,53,183,0.15)] border-[rgba(143,53,183,0.40)] text-[#b86bdd]'
                          : 'bg-transparent border-white/[0.08] text-[#94a3b8] hover:border-white/[0.15] hover:text-[#e2e8f0]'
                      )}
                    >
                      {fn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-caption text-[#64748b] block mb-1.5">状态</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field h-10 w-full pl-3 pr-8 text-sm appearance-none cursor-pointer"
                >
                  <option value="全部">全部状态</option>
                  <option value="Active">可用 (Active)</option>
                  <option value="Testing">测试中 (Testing)</option>
                  <option value="Not Configured">未配置 (Not Configured)</option>
                  <option value="Unavailable">不可用 (Unavailable)</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="text-caption text-[#64748b] block mb-1.5">排序</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field h-10 w-full pl-3 pr-8 text-sm appearance-none cursor-pointer"
                >
                  <option value="热度">按热度</option>
                  <option value="名称">按名称</option>
                  <option value="状态">按状态</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Active filters + clear */}
          {activeFilterCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-wrap items-center gap-2 mt-4"
            >
              {selectedOrgans.map((organ) => (
                <span
                  key={organ}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-[rgba(143,53,183,0.10)] border border-[rgba(143,53,183,0.25)] text-[#b86bdd]"
                >
                  器官: {organ}
                  <button
                    onClick={() => toggleOrgan(organ)}
                    className="hover:text-[#e2e8f0] transition-colors"
                    aria-label={`移除 ${organ} 筛选`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {selectedFunctions.map((fn) => (
                <span
                  key={fn}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-[rgba(143,53,183,0.10)] border border-[rgba(143,53,183,0.25)] text-[#b86bdd]"
                >
                  功能: {fn}
                  <button
                    onClick={() => toggleFunction(fn)}
                    className="hover:text-[#e2e8f0] transition-colors"
                    aria-label={`移除 ${fn} 筛选`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {statusFilter !== '全部' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-[rgba(143,53,183,0.10)] border border-[rgba(143,53,183,0.25)] text-[#b86bdd]">
                  状态: {statusFilter}
                  <button
                    onClick={() => setStatusFilter('全部')}
                    className="hover:text-[#e2e8f0] transition-colors"
                    aria-label="移除状态筛选"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-[#8f35b7] hover:text-[#b86bdd] hover:underline underline-offset-4 transition-all ml-1"
              >
                清空筛选
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* ==================== Results ==================== */}
      <section className="py-8 pb-20">
        <div className="section-container">
          {filteredModels.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Search className="w-16 h-16 text-[#475569] mb-4" />
              <h3 className="text-h3 text-[#e2e8f0] mb-2">未找到匹配的模型</h3>
              <p className="text-body text-[#64748b] mb-6">
                尝试调整筛选条件或搜索关键词
              </p>
              <button onClick={clearAllFilters} className="btn-secondary">
                清除筛选
              </button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {viewMode === 'card' ? (
                <motion.div
                  key="card"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {filteredModels.map((model) => (
                    <ModelCard key={model.id} model={model} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-3"
                >
                  {filteredModels.map((model) => (
                    <ModelListRow key={model.id} model={model} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ModelCard (Grid View)                                               */
/* ------------------------------------------------------------------ */

function ModelCard({ model }: { model: Model }) {
  return (
    <motion.article
      variants={itemVariants}
      className="card-base flex flex-col gap-4 group"
      whileTap={{ scale: 0.98 }}
    >
      {/* Top row: status + trust badges */}
      <div className="flex items-center justify-between">
        <span className={cn('status-badge', statusColor(model.status))}>
          {statusIcon(model.status)}
          {model.status}
        </span>
        <div className="flex items-center gap-1.5">
          {model.verified && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[rgba(166,78,208,0.12)] text-[#d292f4] border border-[rgba(166,78,208,0.20)]"
              title="已验证模型"
            >
              <CheckCircle2 size={10} />
              Verified
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[rgba(168,85,247,0.12)] text-[#c084fc] border border-[rgba(168,85,247,0.20)]">
            <Heart size={10} />
            {model.popularity}
          </span>
        </div>
      </div>

      {/* Name + ID */}
      <div>
        <h3 className="text-h3 text-[#e2e8f0] group-hover:text-[#b86bdd] transition-colors duration-150">
          {model.name}
        </h3>
        <p className="font-mono text-mono-sm text-[#475569] mt-1">{model.id}</p>
      </div>

      {/* Summary */}
      <p className="text-body text-[#94a3b8] line-clamp-2">{model.summary}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {model.organs.map((o) => (
          <span key={o} className="tag-organ">
            {o}
          </span>
        ))}
        {model.functions.map((f) => (
          <span key={f} className="tag-function">
            {f}
          </span>
        ))}
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between text-caption text-[#64748b]">
        <span>{model.deployment}</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Download size={12} />
            {model.downloads}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star size={12} className="text-[#f59e0b]" />
            {model.rating}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-auto pt-2 border-t border-white/[0.05]">
        <button className="btn-secondary h-9 px-4 text-sm gap-1.5">
          <Eye size={14} />
          查看详情
        </button>
        <button className="btn-primary h-9 px-4 text-sm gap-1.5">
          <Play size={14} />
          运行模型
        </button>
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/*  ModelListRow (List View)                                            */
/* ------------------------------------------------------------------ */

function ModelListRow({ model }: { model: Model }) {
  return (
    <motion.article
      variants={itemVariants}
      className="bg-[#24262c] border border-white/[0.06] rounded-xl px-5 py-4 flex flex-col sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_0.8fr] sm:items-center gap-3 sm:gap-4 group hover:border-[rgba(143,53,183,0.30)] hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200"
      whileTap={{ scale: 0.99 }}
    >
      {/* Column 1: Status + Name */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('status-badge text-[11px]', statusColor(model.status))}>
            {statusIcon(model.status)}
            {model.status}
          </span>
          {model.verified && (
            <CheckCircle2 size={12} className="text-[#a64ed0]" />
          )}
        </div>
        <h4 className="text-h4 text-[#e2e8f0] truncate group-hover:text-[#b86bdd] transition-colors">
          {model.name}
        </h4>
        <p className="font-mono text-[11px] text-[#475569] truncate">{model.id}</p>
      </div>

      {/* Column 2: Organs */}
      <div className="flex flex-wrap gap-1">
        {model.organs.slice(0, 3).map((o) => (
          <span key={o} className="tag-organ text-[11px] py-0.5 px-2">
            {o}
          </span>
        ))}
        {model.organs.length > 3 && (
          <span className="text-caption text-[#64748b]">+{model.organs.length - 3}</span>
        )}
      </div>

      {/* Column 3: Functions */}
      <div className="flex flex-wrap gap-1">
        {model.functions.slice(0, 3).map((f) => (
          <span key={f} className="tag-function text-[11px] py-0.5 px-2">
            {f}
          </span>
        ))}
        {model.functions.length > 3 && (
          <span className="text-caption text-[#64748b]">+{model.functions.length - 3}</span>
        )}
      </div>

      {/* Column 4: Stats */}
      <div className="flex flex-col gap-0.5 text-caption text-[#64748b]">
        <span className="inline-flex items-center gap-1">
          <Download size={12} />
          {model.downloads}
        </span>
        <span className="inline-flex items-center gap-1">
          <Star size={12} className="text-[#f59e0b]" />
          {model.rating}
        </span>
        <span>{model.updatedAt}</span>
      </div>

      {/* Column 5: Actions */}
      <div className="flex items-center gap-2 sm:justify-end">
        <button className="text-sm text-[#8f35b7] hover:text-[#b86bdd] hover:underline underline-offset-4 transition-all">
          查看
        </button>
        <button className="h-8 px-3 bg-transparent border border-[#8f35b7] text-[#8f35b7] rounded-lg text-xs font-medium inline-flex items-center gap-1 hover:bg-[rgba(143,53,183,0.10)] hover:border-[#b86bdd] transition-all duration-150">
          <Play size={12} />
          运行
        </button>
      </div>
    </motion.article>
  );
}
