import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  LayoutGrid,
  Shield,
  Zap,
  Database,
  BarChart3,
  Upload,
  Box,
  Layers,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Lock,
  Star,
  GitFork,
  Users,
  Download,
  BookOpen,
  ChevronRight,
  Microscope,
  Search,
  MessageCircle,
  Github,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */
const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as [number, number, number, number] },
  },
};

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.floor(eased * target);
      setCount(start);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */
const stats = [
  { number: 50, suffix: '+', label: '开源AI模型', trend: '↑ 较上月 +12' },
  { number: 200, suffix: '+', label: '公开数据集', trend: '↑ 较上月 +8' },
  { number: 30, suffix: '+', label: '发表论文', trend: '' },
  { number: 0, suffix: '', label: '数据上传云端', trend: '纯本地运行' },
];

const steps = [
  {
    icon: Upload,
    title: '① 加载WSI',
    desc: '上传或登记本地SVS、TIFF、NDPI等格式的数字病理切片。',
  },
  {
    icon: Box,
    title: '② 选择模型',
    desc: '从模型库中选择适合器官和染色类型的AI分析模型。',
  },
  {
    icon: Zap,
    title: '③ 运行分析',
    desc: '一键提交分析任务，GPU自动调度，实时追踪进度。',
  },
  {
    icon: BarChart3,
    title: '④ 查看结果',
    desc: '在WSI上叠加标注结果，统计仪表盘展示关键指标。',
  },
];

const models = [
  {
    name: 'CellViT++ 细胞分割与分类',
    id: 'cellvit-pp',
    version: '1.2.0',
    desc: '基于ViT架构的细胞核检测与分类模型',
    organs: ['胃', '肠', '乳腺'],
    functions: ['分割', '检测', '分类'],
    status: 'active',
    metric: 'F1: 0.89',
    deployment: '本地容器',
    verified: true,
  },
  {
    name: 'Hover-Net 细胞核检测',
    id: 'hover-net',
    version: '2.1.0',
    desc: '快速精准的细胞核检测与分类框架',
    organs: ['肺', '肝', '肾'],
    functions: ['检测', '分类'],
    status: 'active',
    metric: 'F1: 0.85',
    deployment: '本地容器',
    verified: true,
  },
  {
    name: 'DeepLIIF 多重免疫组化分析',
    id: 'deepliif',
    version: '1.0.3',
    desc: '多重免疫组化染色分离与定量分析',
    organs: ['乳腺', '前列腺'],
    functions: ['分割', '分类'],
    status: 'active',
    metric: 'Dice: 0.82',
    deployment: '本地容器',
    verified: true,
  },
  {
    name: 'TME Analyzer 肿瘤微环境',
    id: 'tme-analyzer',
    version: '0.9.1',
    desc: '肿瘤浸润淋巴细胞分析与生信指标计算',
    organs: ['胃', '肠', '肺'],
    functions: ['检测', '分析'],
    status: 'verified',
    metric: 'AUC: 0.91',
    deployment: '本地容器',
    verified: true,
  },
  {
    name: 'StainNet 染色标准化',
    id: 'stainnet',
    version: '1.1.0',
    desc: '跨实验室染色标准化与颜色归一化',
    organs: ['通用'],
    functions: ['预处理'],
    status: 'verified',
    metric: 'SSIM: 0.94',
    deployment: '本地容器',
    verified: true,
  },
  {
    name: 'NuClick 交互式分割',
    id: 'nuclick',
    version: '0.8.2',
    desc: '基于点击引导的交互式细胞与组织结构分割',
    organs: ['通用'],
    functions: ['分割'],
    status: 'community',
    metric: 'IoU: 0.78',
    deployment: '本地容器',
    verified: false,
  },
];

const capabilities = [
  {
    icon: Layers,
    title: '一站式分析工作流',
    desc: '从WSI加载到结果导出，所有步骤在一个界面完成。无需在QuPath、Python脚本和Excel之间来回切换。',
  },
  {
    icon: Zap,
    title: '一键运行开源模型',
    desc: '预置50+开源病理AI模型，自动容器化部署。选择模型、配置参数、提交任务，三步完成分析。',
  },
  {
    icon: ShieldCheck,
    title: '数据本地安全处理',
    desc: '所有计算在本地完成，WSI数据不出院。符合医院信息安全要求，支持离线环境运行。',
  },
];

const trustCards = [
  {
    icon: CheckCircle2,
    title: '模型验证体系',
    desc: '每个模型经过标准数据集基准测试，提供F1、Dice、AUC等性能指标，帮助您选择最可靠的模型。',
  },
  {
    icon: FileCheck,
    title: '标准化分析报告',
    desc: '生成符合CAP标准的结构化病理报告，支持PDF、DICOM SR导出，包含AI免责声明与审核签名。',
  },
  {
    icon: Lock,
    title: '隐私优先设计',
    desc: '纯本地部署架构，患者数据永不离开医院网络。支持审计日志，满足等保与HIPAA合规要求。',
  },
];

const communityFeatures = [
  { icon: Microscope, text: '模型发布: 一键打包发布模型，自动生成模型卡片' },
  { icon: BarChart3, text: '基准测试: 在标准数据集上评估模型性能，生成排行榜' },
  { icon: MessageCircle, text: '社区反馈: 评分、评论、使用心得，帮助后来者选择' },
  { icon: Box, text: 'HuggingFace集成: 直接拉取HF上的病理模型，自动适配' },
];

const recentActivity = [
  'CellViT++ v2.0 发布',
  '新增胃部WSI基准测试',
  '社区贡献: 甲状腺分割模型',
];

/* ------------------------------------------------------------------ */
/*  Helper components                                                  */
/* ------------------------------------------------------------------ */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; dot?: boolean; label: string }> = {
    active: { cls: 'status-active', label: '已就绪' },
    verified: { cls: 'status-queued', label: '已验证' },
    community: { cls: 'status-running', dot: true, label: '社区版' },
  };
  const s = map[status] || map.active;
  return (
    <span className={`status-badge ${s.cls}`}>
      {s.dot && <span className="w-2 h-2 rounded-full bg-[#8f35b7] animate-pulse" />}
      {s.label}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  centered = true,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  centered?: boolean;
}) {
  return (
    <div className={`mb-12 ${centered ? 'text-center' : ''}`}>
      <span className="inline-block text-eyebrow uppercase tracking-widest text-[#8f35b7] bg-[rgba(143,53,183,0.10)] px-3 py-1 rounded mb-4">
        {eyebrow}
      </span>
      <h2 className="text-h1 text-[#e2e8f0] mb-3">{title}</h2>
      <p className="text-body-lg text-[#94a3b8] max-w-[600px] mx-auto">{subtitle}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Home page                                                     */
/* ------------------------------------------------------------------ */
export default function Home() {
  return (
    <div className="bg-[#0f1014]">
      {/* ============================================================ */}
      {/* 1. Hero                                                      */}
      {/* ============================================================ */}
      <section className="relative min-h-[700px] lg:min-h-[100dvh] overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cell-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="20" fill="none" stroke="#8f35b7" strokeWidth="0.5" />
                <circle cx="30" cy="30" r="8" fill="none" stroke="#8f35b7" strokeWidth="0.5" />
                <circle cx="10" cy="10" r="4" fill="#8f35b7" opacity="0.3" />
                <circle cx="50" cy="50" r="4" fill="#8f35b7" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cell-pattern)" />
          </svg>
        </div>

        <div className="section-container relative z-10 grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 items-center min-h-[700px] lg:min-h-[100dvh] py-20 lg:py-0">
          {/* Left content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-[640px]"
          >
            <motion.span
              variants={staggerItem}
              className="inline-block text-eyebrow uppercase tracking-widest text-[#8f35b7] bg-[rgba(143,53,183,0.10)] px-3 py-1 rounded"
            >
              开源病理AI · 本地运行 · 数据安全
            </motion.span>

            <motion.h1
              variants={staggerItem}
              className="text-display-xl text-[#e2e8f0] mt-6 max-w-[520px] leading-[1.1]"
            >
              发现、运行、评估
              <br />
              病理AI模型，
              <br />
              就在本地。
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="text-body-lg text-[#94a3b8] mt-5 max-w-[480px] leading-relaxed"
            >
              HuggingPath 是面向病理AI研究者与临床医生的统一工作台。无需编程，即可在本地运行最前沿的病理分割、检测、分类模型，全切片影像一键分析，结果实时可视化。
            </motion.p>

            <motion.div variants={staggerItem} className="flex flex-wrap gap-3 mt-8">
              <Link to="/workbench" className="btn-primary">
                立即开始分析
                <ArrowRight size={18} />
              </Link>
              <Link to="/explore" className="btn-secondary">
                <LayoutGrid size={16} />
                浏览模型目录
              </Link>
            </motion.div>

            <motion.div variants={staggerItem} className="flex items-center gap-6 mt-10">
              {[
                { icon: Shield, label: '数据不出院' },
                { icon: Zap, label: '一键运行' },
                { icon: Database, label: '50+ 开源模型' },
                { icon: BarChart3, label: 'WSI可视化' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-caption text-[#64748b]">
                  <item.icon size={16} />
                  <span className="hidden sm:inline">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number] }}
            className="relative hidden lg:flex items-center justify-center"
          >
            {/* Glow orbs */}
            <div className="absolute inset-0 animate-glow-pulse">
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(143,53,183,0.15) 0%, transparent 70%)' }}
              />
              <div
                className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(166,78,208,0.10) 0%, transparent 70%)' }}
              />
            </div>

            {/* Mockup image */}
            <div className="relative animate-float">
              <img
                src="/hero-mockup.png"
                alt="HuggingPath 工作台界面预览"
                className="rounded-xl max-w-[90%] mx-auto"
                style={{
                  transform: 'perspective(1000px) rotateY(-8deg) rotateX(5deg)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
                }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. Platform Stats                                            */}
      {/* ============================================================ */}
      <section className="py-20 bg-gradient-to-b from-[#0f1014] to-[#18191e]">
        <div className="section-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="card-base text-center py-6"
              >
                <div className="text-display text-[#8f35b7] tab-nums">
                  <AnimatedCounter target={stat.number} suffix={stat.suffix} />
                </div>
                <div className="text-body text-[#94a3b8] mt-2 font-medium">{stat.label}</div>
                {stat.trend && (
                  <div
                    className={`text-caption mt-2 ${
                      stat.trend.startsWith('↑') ? 'text-[#22c55e]' : 'text-[#94a3b8]'
                    }`}
                  >
                    {stat.trend}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. How It Works                                              */}
      {/* ============================================================ */}
      <section className="py-24">
        <div className="section-container">
          <SectionHeader
            eyebrow="使用流程"
            title="四步完成病理AI分析"
            subtitle="从加载切片到获取可视化结果，无需编写任何代码"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connector lines - desktop only */}
            <div className="hidden lg:block absolute top-[60px] left-[calc(12.5%+8px)] right-[calc(12.5%+8px)] h-[1px]">
              <div className="w-full h-full border-t border-dashed border-white/10" />
            </div>

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
                className="card-base p-6 pt-8 relative"
              >
                {/* Step number badge */}
                <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-[#8f35b7] text-white flex items-center justify-center text-sm font-bold border-[3px] border-[#0f1014]">
                  {i + 1}
                </div>

                <div className="w-12 h-12 rounded-xl bg-[rgba(143,53,183,0.10)] flex items-center justify-center mb-5">
                  <step.icon size={24} className="text-[#8f35b7]" />
                </div>

                <h3 className="text-h3 text-[#e2e8f0] mb-2">{step.title}</h3>
                <p className="text-body text-[#94a3b8]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. Featured Models                                           */}
      {/* ============================================================ */}
      <section className="py-24 bg-gradient-to-b from-[#0f1014] via-[#18191e] to-[#0f1014]">
        <div className="section-container">
          {/* Section header with view all link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
          >
            <div>
              <span className="inline-block text-eyebrow uppercase tracking-widest text-[#8f35b7] bg-[rgba(143,53,183,0.10)] px-3 py-1 rounded mb-4">
                热门模型
              </span>
              <h2 className="text-h1 text-[#e2e8f0]">精选病理AI模型</h2>
              <p className="text-body text-[#94a3b8] mt-2">经过社区验证的高性能模型，开箱即用</p>
            </div>
            <Link
              to="/explore"
              className="text-[#8f35b7] hover:text-[#b86bdd] text-sm font-medium inline-flex items-center gap-1 shrink-0"
            >
              查看全部模型
              <ChevronRight size={16} />
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {models.map((model) => (
              <motion.div
                key={model.id}
                variants={staggerItem}
                className="card-base p-4 overflow-hidden group"
              >
                {/* Top row: status + verified */}
                <div className="flex items-center justify-between mb-3">
                  <StatusBadge status={model.status} />
                  {model.verified && (
                    <span className="status-badge status-queued">
                      <CheckCircle2 size={12} />
                      已验证
                    </span>
                  )}
                </div>

                {/* Model name */}
                <h3 className="text-h3 text-[#e2e8f0] mb-1">{model.name}</h3>
                <p className="font-mono text-xs text-[#475569] mb-3">
                  {model.id} · {model.version}
                </p>

                {/* Description */}
                <p className="text-body text-[#94a3b8] line-clamp-2 mb-3">{model.desc}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {model.organs.map((organ) => (
                    <span key={organ} className="tag-organ">
                      <Search size={10} />
                      {organ}
                    </span>
                  ))}
                  {model.functions.map((fn) => (
                    <span key={fn} className="tag-function">
                      {fn}
                    </span>
                  ))}
                </div>

                {/* Preview thumbnail */}
                <div className="h-[120px] rounded-lg bg-[#111217] overflow-hidden mb-3 border border-white/[0.06]">
                  <img
                    src="/wsi-demo.jpg"
                    alt="模型预览"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-between text-caption text-[#64748b] mb-3">
                  <span>部署: {model.deployment}</span>
                  <span>{model.metric}</span>
                </div>

                {/* Action row */}
                <div className="flex items-center justify-between">
                  <Link
                    to={`/model/${model.id}`}
                    className="text-sm text-[#8f35b7] hover:text-[#b86bdd] hover:underline underline-offset-4 transition-colors"
                  >
                    查看详情
                  </Link>
                  <Link
                    to={`/workbench?model=${model.id}`}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-transparent border border-[#8f35b7] text-[#8f35b7] text-sm font-medium hover:bg-[rgba(143,53,183,0.10)] hover:border-[#b86bdd] transition-all duration-150"
                  >
                    运行模型
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. Platform Capabilities                                     */}
      {/* ============================================================ */}
      <section className="py-24">
        <div className="section-container">
          <SectionHeader
            eyebrow="核心能力"
            title="为病理AI量身打造的工作台"
            subtitle="集成模型管理、WSI查看、分析执行、结果可视化于一体"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left column: feature list */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
              className="flex flex-col gap-8"
            >
              {capabilities.map((cap, i) => (
                <motion.div
                  key={i}
                  variants={staggerItem}
                  className="flex gap-4 items-start"
                >
                  <div className="w-12 h-12 rounded-xl bg-[rgba(143,53,183,0.10)] flex items-center justify-center shrink-0">
                    <cap.icon size={24} className="text-[#8f35b7]" />
                  </div>
                  <div>
                    <h3 className="text-h3 text-[#e2e8f0] mb-1">{cap.title}</h3>
                    <p className="text-body text-[#94a3b8] max-w-[360px]">{cap.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Right column: illustration */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number] }}
              className="relative"
            >
              <div
                className="absolute inset-0 rounded-xl"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(143,53,183,0.12) 0%, transparent 70%)',
                  filter: 'blur(60px)',
                  transform: 'scale(1.2)',
                }}
              />
              <div className="relative rounded-xl border border-white/[0.06] overflow-hidden shadow-card-hover" style={{ perspective: '1000px' }}>
                <img
                  src="/hero-mockup.png"
                  alt="工作台能力展示"
                  className="w-full rounded-xl"
                  style={{ transform: 'rotateY(3deg)' }}
                />
                {/* Floating badges */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="absolute top-4 left-4 bg-[#24262c] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-[#e2e8f0] font-medium"
                >
                  WSI Viewer
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                  className="absolute bottom-4 right-4 bg-[#24262c] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-[#e2e8f0] font-medium"
                >
                  实时分析
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. Trust & Verification                                      */}
      {/* ============================================================ */}
      <section className="py-20 bg-gradient-to-b from-[#0f1014] to-[#1c1d22]">
        <div className="section-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {trustCards.map((card, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="card-base p-8 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-[rgba(143,53,183,0.08)] flex items-center justify-center mx-auto mb-5">
                  <card.icon size={28} className="text-[#8f35b7]" />
                </div>
                <h3 className="text-h3 text-[#e2e8f0] mb-2">{card.title}</h3>
                <p className="text-body text-[#94a3b8]">{card.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. Community & Ecosystem                                       */}
      {/* ============================================================ */}
      <section className="py-24">
        <div className="section-container">
          <SectionHeader
            eyebrow="开放生态"
            title="共建病理AI社区"
            subtitle="开源、开放、协作 — 让优秀的病理AI模型被更多人发现和使用"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="max-w-[520px]"
            >
              <p className="text-body-lg text-[#e2e8f0] leading-relaxed">
                HuggingPath 不仅是一个工具，更是一个开放的病理AI生态。研究者可以发布自己的模型，临床医生可以验证和反馈，共同推动病理AI的发展。
              </p>

              <div className="mt-6 flex flex-col gap-3">
                {communityFeatures.map((feat, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(143,53,183,0.10)] flex items-center justify-center shrink-0 mt-0.5">
                      <feat.icon size={16} className="text-[#8f35b7]" />
                    </div>
                    <p className="text-body text-[#94a3b8]">{feat.text}</p>
                  </div>
                ))}
              </div>

              <a
                href="https://github.com/AI4DigitalPathology"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-8 inline-flex"
              >
                加入社区
                <ArrowRight size={18} />
              </a>
            </motion.div>

            {/* Right column - GitHub preview card */}
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.97 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number] }}
              className="card-base p-6"
            >
              {/* GitHub header */}
              <div className="flex items-center gap-2 mb-4">
                <Github size={20} className="text-[#94a3b8]" />
                <span className="text-sm font-medium text-[#e2e8f0]">Awesome-AI4DigitalPathology</span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-caption text-[#94a3b8] mb-5">
                <span className="inline-flex items-center gap-1">
                  <Star size={14} className="text-[#f59e0b]" /> 1.2k stars
                </span>
                <span className="inline-flex items-center gap-1">
                  <GitFork size={14} /> 180 forks
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users size={14} /> 45 contributors
                </span>
              </div>

              {/* Activity list */}
              <div className="flex flex-col gap-2 mb-5">
                {recentActivity.map((act, i) => (
                  <div key={i} className="flex items-center gap-2 text-caption text-[#94a3b8]">
                    <span className="w-2 h-2 rounded-full bg-[#8f35b7] shrink-0" />
                    {act}
                  </div>
                ))}
              </div>

              {/* Contribution graph */}
              <div className="grid grid-cols-12 gap-1">
                {Array.from({ length: 84 }).map((_, i) => {
                  const intensity = Math.random();
                  let bg = '#0e3b2f';
                  if (intensity > 0.7) bg = '#8f35b7';
                  else if (intensity > 0.4) bg = '#7c2bc6';
                  else if (intensity > 0.15) bg = '#0f5c4a';
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.01 }}
                      className="w-full aspect-square rounded-sm"
                      style={{ background: bg, opacity: intensity > 0.15 ? 1 : 0.3 }}
                    />
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. CTA Banner                                                */}
      {/* ============================================================ */}
      <section className="py-20 border-t border-b border-white/[0.06] animate-gradient-shift">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #23182b 0%, #0f1014 50%, #1c1d22 100%)',
          }}
        />
        <div className="section-container relative z-10 text-center max-w-[800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-display text-[#e2e8f0]">准备好开始您的病理AI分析了吗？</h2>
            <p className="text-body-lg text-[#94a3b8] mt-4">
              本地部署，开箱即用。支持Windows、Linux和macOS。
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <a
                href="https://github.com/AI4DigitalPathology"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <Download size={18} />
                免费下载使用
              </a>
              <Link to="/about" className="btn-secondary">
                <BookOpen size={16} />
                阅读文档
              </Link>
            </div>

            <p className="text-caption text-[#475569] mt-6">
              仅供研究参考，不构成医疗建议。
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
