import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, type Variants } from 'framer-motion';
import {
  Users,
  Github,
  ArrowRight,
  MessageCircle,
  Box,
  Microscope,
  BarChart3,
  Check,
  Circle,
  Star,
  GitFork,
  Shield,
  Code,
  Server,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as [number, number, number, number] } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

/* ------------------------------------------------------------------ */
/*  AnimatedCounter                                                    */
/* ------------------------------------------------------------------ */

function AnimatedCounter({ target, suffix = '', prefix = '', duration = 1200 }: { target: number; suffix?: string; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      if (current !== start) {
        start = current;
        setCount(current);
      }
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, target, duration]);

  return (
    <span ref={ref} className="tab-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const stats = [
  { value: 50, suffix: '+', label: '开源AI模型' },
  { value: 200, suffix: '+', label: '公开数据集' },
  { value: 1000, suffix: '+', label: '社区用户' },
  { value: 30, suffix: '+', label: '贡献者' },
];

const features = [
  {
    icon: Box,
    title: '模型统一管理',
    desc: '预置50+开源病理AI模型，自动容器化部署，一键运行。支持从HuggingFace Hub直接导入模型。',
  },
  {
    icon: Microscope,
    title: 'WSI分析工作台',
    desc: '集成OpenSeadragon全切片查看器，支持多层级缩放、标注叠加、测量工具，结果实时可视化。',
  },
  {
    icon: BarChart3,
    title: '标准化评估体系',
    desc: '提供标准数据集基准测试，自动生成性能排行榜。F1、Dice、AUC等指标一目了然。',
  },
];

type LeaderboardRow = {
  rank: number;
  name: string;
  author: string;
  organ: string;
  f1: number | null;
  dice: number | null;
  auc: number | null;
  speed: number;
  verified: boolean;
};

const leaderboardData: LeaderboardRow[] = [
  { rank: 1, name: 'CellViT++', author: 'AI4DigitalPathology', organ: '胃,肠,乳腺', f1: 0.89, dice: 0.85, auc: 0.92, speed: 12.5, verified: true },
  { rank: 2, name: 'Hover-Net', author: 'vqdang', organ: '肺,肝,肾', f1: 0.85, dice: 0.82, auc: 0.88, speed: 15.2, verified: true },
  { rank: 3, name: 'DeepLIIF', author: 'bmildner', organ: '乳腺,前列腺', f1: 0.82, dice: 0.88, auc: null, speed: 8.3, verified: true },
  { rank: 4, name: 'TME Analyzer', author: 'pathoLab', organ: '胃,肠,肺', f1: 0.78, dice: null, auc: 0.91, speed: 6.7, verified: false },
  { rank: 5, name: 'StainNet', author: 'reinhardLab', organ: '通用', f1: null, dice: 0.94, auc: null, speed: 45.0, verified: true },
  { rank: 6, name: 'NuClick', author: 'najafiLab', organ: '肺,乳腺', f1: 0.76, dice: 0.79, auc: 0.84, speed: 9.2, verified: false },
  { rank: 7, name: 'PathoNet', author: 'mhabbas', organ: '乳腺,结肠', f1: 0.74, dice: 0.77, auc: 0.82, speed: 11.0, verified: true },
];

const datasets = ['PanNuke', 'MoNuSAC', 'TNBC', 'DigestPath', 'LYON19'];

const roadmap = [
  {
    phase: 'Phase 1 · 核心工作台',
    date: '2025 Q1',
    status: 'current',
    desc: '构建基础的WSI加载、模型运行、结果可视化能力。支持5-10个核心模型开箱即用。',
    items: [
      { label: 'WSI查看器集成', done: true },
      { label: '模型注册中心', done: true },
      { label: '基础任务调度', done: true },
      { label: 'GeoJSON叠加', done: false },
    ],
  },
  {
    phase: 'Phase 2 · 模型生态',
    date: '2025 Q2',
    status: 'future',
    desc: '引入模型验证基准测试，建立排行榜体系。支持模型贡献者注册和发布模型。',
    items: [
      { label: 'Benchmark系统', done: false },
      { label: '排行榜', done: false },
      { label: '社区评价', done: false },
      { label: 'HF Hub集成', done: false },
    ],
  },
  {
    phase: 'Phase 3 · 临床套件',
    date: '2025 Q3-Q4',
    status: 'future',
    desc: '推出临床模式UI，支持病例管理、标准化报告、Agent编排工作流。',
    items: [
      { label: '临床模式', done: false },
      { label: '病例管理', done: false },
      { label: 'Agent套件', done: false },
      { label: '结构化报告', done: false },
    ],
  },
];

const contributors = [
  { name: '张伟', role: '项目负责人', commits: 142 },
  { name: 'Linda Chen', role: 'AI研究员', commits: 89 },
  { name: '王明', role: '全栈工程师', commits: 76 },
  { name: 'Dr. Johnson', role: '病理顾问', commits: 45 },
  { name: '李芳', role: '前端工程师', commits: 62 },
  { name: 'Alex Kim', role: 'DevOps', commits: 38 },
  { name: '陈浩', role: '算法工程师', commits: 55 },
  { name: 'Sarah Lee', role: 'UX设计师', commits: 27 },
  { name: '刘洋', role: '测试工程师', commits: 33 },
  { name: 'Tom Brown', role: '文档维护', commits: 19 },
  { name: '赵敏', role: '社区运营', commits: 14 },
  { name: 'Rachel Wu', role: '数据工程师', commits: 41 },
];

/* ------------------------------------------------------------------ */
/*  Helper: Rank badge style                                           */
/* ------------------------------------------------------------------ */

function getRankStyle(rank: number) {
  if (rank === 1) return { bg: 'rgba(255,215,0,0.10)', text: '#ffd700', icon: '🥇' };
  if (rank === 2) return { bg: 'rgba(192,192,192,0.10)', text: '#c0c0c0', icon: '🥈' };
  if (rank === 3) return { bg: 'rgba(205,127,50,0.10)', text: '#cd7f32', icon: '🥉' };
  return { bg: 'transparent', text: '#94a3b8', icon: String(rank) };
}

/* ------------------------------------------------------------------ */
/*  Sortable Leaderboard                                               */
/* ------------------------------------------------------------------ */

type SortKey = 'rank' | 'f1' | 'dice' | 'auc' | 'speed';

function Leaderboard() {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [activeDataset, setActiveDataset] = useState('PanNuke');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'rank' || key === 'speed' ? 'asc' : 'desc');
    }
  };

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...leaderboardData].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return (av - bv) * dir;
    });
  }, [sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp size={12} className="text-[#475569] opacity-0 group-hover:opacity-50" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-brand-500" /> : <ChevronDown size={12} className="text-brand-500" />;
  };

  return (
    <div>
      {/* Dataset pills */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        {datasets.map((ds) => (
          <button
            key={ds}
            onClick={() => setActiveDataset(ds)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              activeDataset === ds
                ? 'bg-brand-500 text-bg-primary'
                : 'bg-bg-input text-text-secondary hover:text-text-primary'
            }`}
          >
            {ds}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card-base overflow-hidden p-0">
        {/* Header */}
        <div className="grid grid-cols-[0.5fr_2fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-5 py-3.5 bg-white/[0.02] border-b border-white/[0.06]">
          {([
            { key: 'rank' as SortKey, label: '排名' },
            { key: 'rank' as SortKey, label: '模型' },
            { key: 'rank' as SortKey, label: '器官' },
            { key: 'f1' as SortKey, label: 'F1' },
            { key: 'dice' as SortKey, label: 'Dice' },
            { key: 'auc' as SortKey, label: 'AUC' },
            { key: 'speed' as SortKey, label: '速度' },
          ]).map((col, i) => (
            <button
              key={i}
              onClick={() => handleSort(col.key)}
              className={`group flex items-center gap-1 text-eyebrow uppercase tracking-wider ${
                i === 1 || i === 2 ? 'cursor-default pointer-events-none' : 'cursor-pointer hover:text-text-primary'
              } ${sortKey === col.key && (i === 0 || i > 2) ? 'text-brand-500' : 'text-text-tertiary'}`}
            >
              {col.label}
              {i !== 1 && i !== 2 && <SortIcon col={col.key} />}
            </button>
          ))}
        </div>

        {/* Rows */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {sorted.map((row, idx) => {
            const rankStyle = getRankStyle(row.rank);
            return (
              <motion.div
                key={row.name}
                variants={fadeUp}
                className={`grid grid-cols-[0.5fr_2fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-5 py-3.5 items-center border-b border-white/[0.03] transition-colors duration-150 hover:bg-white/[0.02] cursor-pointer ${
                  idx % 2 === 1 ? 'bg-white/[0.01]' : ''
                }`}
              >
                {/* Rank */}
                <div className="flex items-center">
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold"
                    style={{ background: rankStyle.bg, color: rankStyle.text }}
                  >
                    {rankStyle.icon}
                  </span>
                </div>

                {/* Model */}
                <div className="flex flex-col">
                  <span className="text-body font-medium text-text-primary">{row.name}</span>
                  <span className="text-caption text-text-tertiary">{row.author}</span>
                </div>

                {/* Organ */}
                <div>
                  <span className="tag-organ">{row.organ}</span>
                </div>

                {/* Metrics */}
                <span className="font-mono text-body text-text-primary font-medium">
                  {row.f1 !== null ? row.f1.toFixed(2) : '—'}
                </span>
                <span className="font-mono text-body text-text-primary">
                  {row.dice !== null ? row.dice.toFixed(2) : '—'}
                </span>
                <span className="font-mono text-body text-text-primary">
                  {row.auc !== null ? row.auc.toFixed(2) : '—'}
                </span>
                <span className="font-mono text-body text-text-secondary">
                  {row.speed.toFixed(1)}
                  <span className="text-caption ml-1">p/s</span>
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function About() {
  return (
    <div className="bg-bg-primary">
      {/* ====== HERO ====== */}
      <section className="relative overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, #8f35b7 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-primary" />

        <div className="section-container relative z-10 pt-32 pb-20 text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-[800px] mx-auto"
          >
            <motion.span
              variants={fadeIn}
              className="inline-block text-eyebrow uppercase tracking-widest text-brand-500 mb-4"
            >
              关于我们
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="text-display text-text-primary mb-6"
            >
              让病理AI触手可及
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-body-lg text-text-secondary leading-[1.8] max-w-[640px] mx-auto"
            >
              HuggingPath 致力于构建开放的病理AI生态。我们相信，通过降低技术门槛、提供统一的标准化平台，可以让每一位病理医生和AI研究者都能便捷地使用最前沿的病理分析模型，加速病理诊断的智能化进程。
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center justify-center gap-3 mt-8"
            >
              <a
                href="https://github.com/AI4DigitalPathology"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <Users size={18} />
                加入社区
              </a>
              <a
                href="https://github.com/AI4DigitalPathology"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <Github size={18} />
                GitHub
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ====== PLATFORM STATS ====== */}
      <section className="bg-gradient-to-b from-bg-primary to-[#18191e] py-16">
        <div className="section-container">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="card-base text-center py-8"
              >
                <div className="text-display-xl text-brand-500 mb-2">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-body text-text-secondary">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== WHAT WE OFFER ====== */}
      <section className="py-24">
        <div className="section-container">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="text-center mb-16"
          >
            <motion.span variants={fadeIn} className="text-eyebrow uppercase tracking-widest text-brand-500 block mb-3">
              平台能力
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-h1 text-text-primary">
              为病理AI打造的基础设施
            </motion.h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={fadeUp} className="card-base text-center py-8 px-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-glow mb-5">
                  <f.icon size={24} className="text-brand-500" />
                </div>
                <h3 className="text-h3 text-text-primary mb-3">{f.title}</h3>
                <p className="text-body text-text-secondary leading-[1.7]">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== BENCHMARK LEADERBOARD ====== */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="section-container">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="text-center mb-12"
          >
            <motion.span variants={fadeIn} className="text-eyebrow uppercase tracking-widest text-brand-500 block mb-3">
              基准测试
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-h1 text-text-primary mb-3">
              模型性能排行榜
            </motion.h2>
            <motion.p variants={fadeUp} className="text-body-lg text-text-secondary">
              在标准数据集上的客观性能对比
            </motion.p>
          </motion.div>

          <Leaderboard />
        </div>
      </section>

      {/* ====== ROADMAP ====== */}
      <section className="py-24">
        <div className="section-container max-w-[1000px]">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="text-center mb-16"
          >
            <motion.span variants={fadeIn} className="text-eyebrow uppercase tracking-widest text-brand-500 block mb-3">
              发展路线
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-h1 text-text-primary mb-3">
              Roadmap
            </motion.h2>
            <motion.p variants={fadeUp} className="text-body-lg text-text-secondary">
              HuggingPath 的演进计划
            </motion.p>
          </motion.div>

          <div className="flex flex-col gap-0">
            {roadmap.map((item, idx) => (
              <RoadmapItem key={item.phase} item={item} isLast={idx === roadmap.length - 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ====== CONTRIBUTORS ====== */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="section-container">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="text-center mb-12"
          >
            <motion.span variants={fadeIn} className="text-eyebrow uppercase tracking-widest text-brand-500 block mb-3">
              社区
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-h1 text-text-primary">
              贡献者与合作伙伴
            </motion.h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {contributors.map((c) => (
              <motion.div
                key={c.name}
                variants={fadeUp}
                className="card-base text-center p-4 hover:border-brand-500/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-16 h-16 rounded-full bg-bg-elevated mx-auto mb-3 flex items-center justify-center">
                  <Users size={24} className="text-text-tertiary" />
                </div>
                <p className="text-body font-medium text-text-primary">{c.name}</p>
                <p className="text-caption text-text-tertiary mt-1">{c.role}</p>
                <p className="text-caption text-text-disabled mt-1">{c.commits} commits</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Partner logos placeholder */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-6 mt-12"
          >
            {['Partner A', 'Partner B', 'Partner C', 'Partner D'].map((p) => (
              <div
                key={p}
                className="w-[120px] h-12 rounded-lg bg-bg-card border border-white/[0.06] flex items-center justify-center text-caption text-text-tertiary hover:border-white/[0.12] transition-colors duration-150"
              >
                {p}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== TRUST & COMPLIANCE ====== */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="section-container">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="text-center mb-12"
          >
            <motion.span variants={fadeIn} className="text-eyebrow uppercase tracking-widest text-brand-500 block mb-3">
              信任与合规
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-h1 text-text-primary">
              安全、透明、可信赖
            </motion.h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <TrustCard
              icon={Shield}
              title="数据隐私保护"
              desc="所有病理切片数据均在本地处理，不会上传至远程服务器。支持本地GPU加速，确保数据不出院。"
            />
            <TrustCard
              icon={Server}
              title="本地优先架构"
              desc="HuggingPath 采用完全本地化的运行架构。模型下载后本地运行，无需担心网络延迟或隐私泄露。"
            />
            <TrustCard
              icon={Code}
              title="开源哲学"
              desc="项目采用 MIT 协议开源。模型接口、基准测试、评估工具全部开放，推动病理AI的透明化与标准化。"
            />
          </motion.div>
        </div>
      </section>

      {/* ====== CTA BANNER ====== */}
      <section className="relative overflow-hidden py-20 border-t border-white/[0.06]">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(135deg, #23182b 0%, #0f1014 50%, #1c1d22 100%)',
          }}
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="section-container relative z-10 text-center"
        >
          <motion.h2 variants={fadeUp} className="text-display text-text-primary mb-4">
            一起构建病理AI的未来
          </motion.h2>
          <motion.p variants={fadeUp} className="text-body-lg text-text-secondary max-w-[560px] mx-auto mb-8">
            无论您是病理医生、AI研究者还是开发者，都欢迎加入我们的社区。
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Link to="/workbench" className="btn-primary">
              <ArrowRight size={18} />
              开始使用
            </Link>
            <a
              href="https://github.com/AI4DigitalPathology"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <Github size={18} />
              GitHub
            </a>
            <a
              href="#"
              className="btn-secondary border-brand-500/30 text-brand-500 hover:bg-brand-500/10 hover:border-brand-400/40"
            >
              <MessageCircle size={18} />
              加入讨论
            </a>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-8">
            <span className="flex items-center gap-2 text-body text-text-secondary">
              <Star size={16} className="text-warning" />
              1.2k Stars
            </span>
            <span className="flex items-center gap-2 text-body text-text-secondary">
              <GitFork size={16} className="text-text-tertiary" />
              180 Forks
            </span>
            <span className="flex items-center gap-2 text-body text-text-secondary">
              <Users size={16} className="text-text-tertiary" />
              45 Contributors
            </span>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RoadmapItem sub-component                                          */
/* ------------------------------------------------------------------ */

function RoadmapItem({ item, isLast }: { item: typeof roadmap[0]; isLast: boolean }) {
  const isCurrent = item.status === 'current';

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="flex gap-6"
    >
      {/* Left: Date */}
      <div className="w-[120px] shrink-0 text-right pt-6 hidden sm:block">
        <p className="text-h4 text-brand-500 font-semibold">{item.date}</p>
        {isCurrent && (
          <span className="inline-flex items-center gap-1.5 mt-1 text-caption text-success">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            进行中
          </span>
        )}
      </div>

      {/* Center: Connector */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-4 h-4 rounded-full border-[3px] z-10 mt-7 ${
            isCurrent
              ? 'bg-brand-500 border-bg-primary shadow-[0_0_12px_rgba(143,53,183,0.4)]'
              : 'bg-bg-primary border-[#374151]'
          }`}
        />
        {!isLast && (
          <div
            className="w-px flex-1 min-h-[40px] mt-1"
            style={{ background: isCurrent ? 'linear-gradient(to bottom, #8f35b7, #374151)' : '#374151' }}
          />
        )}
      </div>

      {/* Right: Content */}
      <div className="flex-1 pb-10">
        <div className="card-base p-6">
          {/* Mobile date */}
          <div className="sm:hidden mb-3">
            <p className="text-h4 text-brand-500 font-semibold">{item.date}</p>
            {isCurrent && (
              <span className="inline-flex items-center gap-1.5 mt-1 text-caption text-success">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                进行中
              </span>
            )}
          </div>

          <h3 className="text-h3 text-text-primary mb-2">{item.phase}</h3>
          <p className="text-body text-text-secondary leading-[1.7] mb-4">{item.desc}</p>

          <div className="flex flex-col gap-2">
            {item.items.map((sub) => (
              <div key={sub.label} className="flex items-center gap-2.5">
                {sub.done ? (
                  <Check size={16} className="text-success shrink-0" />
                ) : (
                  <Circle size={16} className="text-warning shrink-0" />
                )}
                <span className={`text-body ${sub.done ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                  {sub.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  TrustCard sub-component                                            */
/* ------------------------------------------------------------------ */

function TrustCard({ icon: Icon, title, desc }: { icon: typeof Shield; title: string; desc: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className="card-base p-6 text-center"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-glow mb-4">
        <Icon size={24} className="text-brand-500" />
      </div>
      <h3 className="text-h3 text-text-primary mb-2">{title}</h3>
      <p className="text-body text-text-secondary leading-[1.7]">{desc}</p>
    </motion.div>
  );
}
