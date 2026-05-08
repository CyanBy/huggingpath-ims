import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Database,
  X,
  Link2,
  Microscope,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type DatasetSize = 'Large' | 'Medium' | 'Small' | 'Custom';
type Modality = 'WSI' | 'Patch';
type StainType = 'HE' | 'IHC' | 'IF';

interface Dataset {
  id: string;
  name: string;
  summary: string;
  organs: string[];
  tasks: string[];
  modality: Modality;
  stainType: StainType;
  size: DatasetSize;
  slides: string;
  license: string;
  downloads: string;
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                           */
/* ------------------------------------------------------------------ */

const DATASETS: Dataset[] = [
  {
    id: 'datasets/pannuke-v2',
    name: 'PanNuke',
    summary:
      '大规模多器官细胞核分割与分类数据集，包含19种组织类型的H&E染色切片，适用于细胞级病理分析研究。',
    organs: ['胃', '肠', '乳腺'],
    tasks: ['分割', '分类'],
    modality: 'WSI',
    stainType: 'HE',
    size: 'Large',
    slides: '12,500',
    license: 'CC BY 4.0',
    downloads: '5.2k',
  },
  {
    id: 'datasets/monusac',
    name: 'MoNuSAC',
    summary:
      '多器官细胞核分割与属性注释数据集，覆盖胃、肺等多个器官，提供丰富的细胞形态标注。',
    organs: ['胃', '肺'],
    tasks: ['分割', '检测'],
    modality: 'Patch',
    stainType: 'HE',
    size: 'Medium',
    slides: '3,000',
    license: 'CC BY 4.0',
    downloads: '2.8k',
  },
  {
    id: 'datasets/tnbc',
    name: 'TNBC',
    summary:
      '三阴性乳腺癌病理切片数据集，专注于乳腺组织的H&E染色分析，支持肿瘤区域分割研究。',
    organs: ['乳腺'],
    tasks: ['分割', '分类'],
    modality: 'WSI',
    stainType: 'HE',
    size: 'Small',
    slides: '500',
    license: 'CC BY 4.0',
    downloads: '1.2k',
  },
  {
    id: 'datasets/digestpath',
    name: 'DigestPath',
    summary:
      '消化道病理数据集，覆盖胃、肠等多个器官，提供大规模H&E染色切片及详细的病灶标注。',
    organs: ['胃', '肠'],
    tasks: ['分割', '检测', '分类'],
    modality: 'WSI',
    stainType: 'HE',
    size: 'Large',
    slides: '10,000',
    license: 'CC BY-NC',
    downloads: '3.6k',
  },
  {
    id: 'datasets/lyon19',
    name: 'LYON19',
    summary:
      '淋巴结转移检测基准数据集，包含H&E染色切片，广泛用于淋巴结病理AI模型训练与评估。',
    organs: ['淋巴结'],
    tasks: ['检测', '分类'],
    modality: 'Patch',
    stainType: 'HE',
    size: 'Medium',
    slides: '3,600',
    license: 'CC BY 4.0',
    downloads: '2.1k',
  },
  {
    id: 'datasets/bach',
    name: 'BACH',
    summary:
      '乳腺癌组织学图像数据集，提供400张H&E染色切片，支持正常/良性/原位癌/浸润癌分类。',
    organs: ['乳腺'],
    tasks: ['分类'],
    modality: 'Patch',
    stainType: 'HE',
    size: 'Small',
    slides: '400',
    license: 'CC BY 4.0',
    downloads: '890',
  },
];

/* ------------------------------------------------------------------ */
/*  Size badge color helper                                             */
/* ------------------------------------------------------------------ */

function sizeBadgeClasses(size: DatasetSize) {
  switch (size) {
    case 'Large':
      return 'bg-[rgba(168,85,247,0.15)] text-[#c084fc] border-[rgba(168,85,247,0.30)]';
    case 'Medium':
      return 'bg-[rgba(168,85,247,0.10)] text-[#a855f7] border-[rgba(168,85,247,0.25)]';
    case 'Small':
      return 'bg-[rgba(168,85,247,0.08)] text-[#d8b4fe] border-[rgba(168,85,247,0.20)]';
    default:
      return 'bg-[rgba(168,85,247,0.15)] text-[#c084fc] border-[rgba(168,85,247,0.30)]';
  }
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                  */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
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

export default function Datasets() {
  /* State */
  const [searchQuery, setSearchQuery] = useState('');
  const [organFilter, setOrganFilter] = useState<string>('全部');
  const [stainFilter, setStainFilter] = useState<string>('全部');
  const [sizeFilter, setSizeFilter] = useState<string>('全部');
  const [sortBy, setSortBy] = useState<string>('综合推荐');

  /* Filtering & sorting */
  const filteredDatasets = useMemo(() => {
    let data = [...DATASETS];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          d.summary.toLowerCase().includes(q)
      );
    }

    if (organFilter !== '全部') {
      data = data.filter((d) => d.organs.includes(organFilter));
    }

    if (stainFilter !== '全部') {
      data = data.filter((d) => d.stainType === stainFilter);
    }

    if (sizeFilter !== '全部') {
      data = data.filter((d) => d.size === sizeFilter);
    }

    switch (sortBy) {
      case '最新发布':
        data.sort((a, b) => a.id.localeCompare(b.id));
        break;
      case '最多下载':
        data.sort((a, b) => parseFloat(b.downloads) - parseFloat(a.downloads));
        break;
      case '切片数量':
        data.sort(
          (a, b) => parseInt(b.slides.replace(/,/g, '')) - parseInt(a.slides.replace(/,/g, ''))
        );
        break;
      default:
        break;
    }

    return data;
  }, [searchQuery, organFilter, stainFilter, sizeFilter, sortBy]);

  const activeFilterCount =
    (organFilter !== '全部' ? 1 : 0) +
    (stainFilter !== '全部' ? 1 : 0) +
    (sizeFilter !== '全部' ? 1 : 0);

  const clearAll = () => {
    setSearchQuery('');
    setOrganFilter('全部');
    setStainFilter('全部');
    setSizeFilter('全部');
    setSortBy('综合推荐');
  };

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
            className="flex flex-col gap-5"
          >
            <motion.div variants={headerVariants}>
              <span className="text-eyebrow uppercase text-[#64748b] tracking-widest">
                DATASET REGISTRY
              </span>
              <h1 className="text-h1 text-[#e2e8f0] mt-2">数据集目录</h1>
              <p className="text-body-lg text-[#94a3b8] mt-2">
                发现公开病理数据集，用于模型训练、验证和基准测试
              </p>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={headerVariants}
              className="flex items-center gap-6 text-caption text-[#94a3b8]"
            >
              <span>200+ 数据集</span>
              <span>50+ 器官类型</span>
              <span>100k+ 切片</span>
            </motion.div>

            {/* Search bar in header */}
            <motion.div variants={headerVariants} className="max-w-xl mt-2">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索数据集..."
                  className="input-field h-12 w-full pl-11 pr-4 text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#e2e8f0] transition-colors"
                    aria-label="清除搜索"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ==================== Filter Toolbar ==================== */}
      <section className="sticky top-16 z-40 bg-[#0f1014]/95 backdrop-blur-md border-b border-white/[0.06] py-4">
        <div className="section-container">
          <div className="flex flex-wrap items-center gap-3">
            {/* Organ filter */}
            <div className="relative">
              <select
                value={organFilter}
                onChange={(e) => setOrganFilter(e.target.value)}
                className="input-field h-9 w-36 pl-3 pr-7 text-sm appearance-none cursor-pointer"
              >
                <option value="全部">器官类型</option>
                <option value="胃">胃</option>
                <option value="肠">肠</option>
                <option value="乳腺">乳腺</option>
                <option value="肺">肺</option>
                <option value="淋巴结">淋巴结</option>
                <option value="前列腺">前列腺</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none"
              />
            </div>

            {/* Stain filter */}
            <div className="relative">
              <select
                value={stainFilter}
                onChange={(e) => setStainFilter(e.target.value)}
                className="input-field h-9 w-32 pl-3 pr-7 text-sm appearance-none cursor-pointer"
              >
                <option value="全部">染色类型</option>
                <option value="HE">H&E</option>
                <option value="IHC">IHC</option>
                <option value="IF">IF</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none"
              />
            </div>

            {/* Size filter */}
            <div className="relative">
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="input-field h-9 w-32 pl-3 pr-7 text-sm appearance-none cursor-pointer"
              >
                <option value="全部">数据规模</option>
                <option value="Large">Large</option>
                <option value="Medium">Medium</option>
                <option value="Small">Small</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none"
              />
            </div>

            {/* Sort */}
            <div className="relative ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field h-9 w-36 pl-3 pr-7 text-sm appearance-none cursor-pointer"
              >
                <option value="综合推荐">综合推荐</option>
                <option value="最新发布">最新发布</option>
                <option value="最多下载">最多下载</option>
                <option value="切片数量">切片数量</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none"
              />
            </div>
          </div>

          {/* Active filters */}
          {activeFilterCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-2 mt-3"
            >
              {organFilter !== '全部' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-[rgba(143,53,183,0.10)] border border-[rgba(143,53,183,0.25)] text-[#b86bdd]">
                  器官: {organFilter}
                  <button
                    onClick={() => setOrganFilter('全部')}
                    className="hover:text-[#e2e8f0] transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {stainFilter !== '全部' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-[rgba(143,53,183,0.10)] border border-[rgba(143,53,183,0.25)] text-[#b86bdd]">
                  染色: {stainFilter}
                  <button
                    onClick={() => setStainFilter('全部')}
                    className="hover:text-[#e2e8f0] transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              {sizeFilter !== '全部' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-[rgba(143,53,183,0.10)] border border-[rgba(143,53,183,0.25)] text-[#b86bdd]">
                  规模: {sizeFilter}
                  <button
                    onClick={() => setSizeFilter('全部')}
                    className="hover:text-[#e2e8f0] transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                onClick={clearAll}
                className="text-xs text-[#8f35b7] hover:text-[#b86bdd] hover:underline underline-offset-4 transition-all ml-1"
              >
                清空筛选
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* ==================== Dataset Grid ==================== */}
      <section className="py-8 pb-20">
        <div className="section-container">
          {filteredDatasets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Database className="w-16 h-16 text-[#475569] mb-4" />
              <h3 className="text-h3 text-[#e2e8f0] mb-2">未找到匹配的数据集</h3>
              <p className="text-body text-[#64748b] mb-6">尝试调整筛选条件</p>
              <button onClick={clearAll} className="btn-secondary">
                查看全部数据集
              </button>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {filteredDatasets.map((dataset) => (
                <DatasetCard key={dataset.id} dataset={dataset} />
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DatasetCard                                                         */
/* ------------------------------------------------------------------ */

function DatasetCard({ dataset }: { dataset: Dataset }) {
  return (
    <motion.article
      variants={itemVariants}
      className="bg-[#24262c] border border-white/[0.06] rounded-xl overflow-hidden group hover:border-[rgba(143,53,183,0.30)] hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200"
      whileTap={{ scale: 0.99 }}
    >
      {/* Thumbnail area */}
      <div className="relative h-40 bg-[#111217] overflow-hidden">
        {/* Placeholder pattern */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-1.5 p-4 opacity-40 group-hover:opacity-60 transition-opacity">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-14 h-14 rounded-md bg-[#2f3138] border border-white/[0.06]"
              />
            ))}
          </div>
        </div>

        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border',
                sizeBadgeClasses(dataset.size)
              )}
            >
              {dataset.size} · {dataset.slides} 切片
            </span>
            <span className="text-caption text-[#94a3b8]">
              {dataset.downloads} 下载
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        {/* Header: ID + Name */}
        <div>
          <p className="font-mono text-[11px] text-[#475569] mb-1">{dataset.id}</p>
          <h3 className="text-h3 text-[#e2e8f0] group-hover:text-[#b86bdd] transition-colors duration-150">
            {dataset.name}
          </h3>
        </div>

        {/* Summary */}
        <p className="text-body text-[#94a3b8] line-clamp-2">{dataset.summary}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {dataset.organs.map((o) => (
            <span key={o} className="tag-organ">
              {o}
            </span>
          ))}
          {dataset.tasks.map((t) => (
            <span key={t} className="tag-function">
              {t}
            </span>
          ))}
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-caption text-[#64748b] pt-2 border-t border-white/[0.05]">
          <span>
            {dataset.modality} · {dataset.stainType}
          </span>
          <span className="text-[#a64ed0]">{dataset.license}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button className="btn-secondary h-8 px-3 text-xs gap-1.5">
            <Link2 size={12} />
            关联模型
          </button>
          <button className="btn-primary h-8 px-3 text-xs gap-1.5">
            <Microscope size={12} />
            进入工作台
          </button>
        </div>
      </div>
    </motion.article>
  );
}
