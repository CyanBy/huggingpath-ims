import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  CalendarDays,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Search,
  Users,
  X,
  FlaskConical,
  Database,
  BarChart3,
  ShieldCheck,
  Lock,
  Clock3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DownloadPolicy = '可直接下载' | '申请下载' | '仅查看';
type ProjectDataType = 'HE' | 'IHC' | 'IF' | '多模态';
type ProjectDisease = 'Breast Cancer' | 'Lung Cancer' | 'Gastric Cancer' | 'Lymph Node' | 'Cervical Cancer';

type PublicProject = {
  id: string;
  name: string;
  summary: string;
  organization: string;
  owner: string;
  members: number;
  disease: ProjectDisease;
  dataType: ProjectDataType;
  tags: string[];
  caseCount: number;
  wsiCount: number;
  analysisCount: number;
  downloadPolicy: DownloadPolicy;
  updatedAt: string;
  views: string;
  downloads: string;
  publicContent: string[];
};

const PUBLIC_PROJECTS: PublicProject[] = [
  {
    id: 'PRJ-PUB-2026-001',
    name: '乳腺癌 HER2 队列研究',
    summary:
      '面向乳腺癌 HER2 IHC 定量分析的公开研究项目，包含多中心 Case、WSI 与 AI 分析结果摘要。',
    organization: '仁达病理中心',
    owner: 'Zhang San',
    members: 8,
    disease: 'Breast Cancer',
    dataType: 'IHC',
    tags: ['HER2', 'IHC', 'Breast Cancer', 'AI Quantification'],
    caseCount: 128,
    wsiCount: 356,
    analysisCount: 24,
    downloadPolicy: '申请下载',
    updatedAt: '2026-05-20',
    views: '2.8k',
    downloads: '186',
    publicContent: ['项目概览', '公开数据摘要', 'AI 分析结果', '项目成员', '引用信息'],
  },
  {
    id: 'PRJ-PUB-2026-002',
    name: '胃癌活检组织区域分割项目',
    summary:
      '公开展示胃癌活检 HE 切片中的肿瘤区、间质区、坏死样区域分割结果，可用于算法对比和可视化验证。',
    organization: 'AI Lab',
    owner: 'Li Ming',
    members: 5,
    disease: 'Gastric Cancer',
    dataType: 'HE',
    tags: ['Gastric Cancer', 'HE', 'Segmentation', 'Biopsy'],
    caseCount: 96,
    wsiCount: 214,
    analysisCount: 18,
    downloadPolicy: '可直接下载',
    updatedAt: '2026-05-18',
    views: '1.9k',
    downloads: '432',
    publicContent: ['项目概览', '公开 WSI 摘要', '组织分割结果', '引用信息'],
  },
  {
    id: 'PRJ-PUB-2026-003',
    name: '肺癌肿瘤微环境分析项目',
    summary:
      '围绕肺癌 HE 与 IHC 多模态切片，公开展示免疫细胞空间分布、热点区域与 TME 相关统计结果。',
    organization: '示例医院',
    owner: 'Dr. Chen',
    members: 11,
    disease: 'Lung Cancer',
    dataType: '多模态',
    tags: ['Lung Cancer', 'TME', 'IHC', 'Spatial Analysis'],
    caseCount: 72,
    wsiCount: 188,
    analysisCount: 31,
    downloadPolicy: '仅查看',
    updatedAt: '2026-05-16',
    views: '3.4k',
    downloads: '0',
    publicContent: ['项目概览', 'AI 分析结果', '项目成员'],
  },
  {
    id: 'PRJ-PUB-2026-004',
    name: '淋巴结转移癌检测验证项目',
    summary:
      '面向淋巴结转移灶检测的公开验证项目，展示 WSI 级别检测结果、疑似病灶区域和模型输出摘要。',
    organization: '科研团队',
    owner: 'Wang Yu',
    members: 6,
    disease: 'Lymph Node',
    dataType: 'HE',
    tags: ['Lymph Node', 'Metastasis', 'Detection', 'WSI'],
    caseCount: 64,
    wsiCount: 148,
    analysisCount: 16,
    downloadPolicy: '申请下载',
    updatedAt: '2026-05-14',
    views: '1.2k',
    downloads: '74',
    publicContent: ['项目概览', '公开数据摘要', '检测结果', '下载申请'],
  },
  {
    id: 'PRJ-PUB-2026-005',
    name: '宫颈活检病变识别项目',
    summary:
      '公开展示宫颈活检切片中上皮区域、可疑病变区域和 AI 辅助识别结果，用于教学和模型能力展示。',
    organization: '联合病理实验室',
    owner: 'Liu Fang',
    members: 9,
    disease: 'Cervical Cancer',
    dataType: 'HE',
    tags: ['Cervical', 'Biopsy', 'Lesion Detection', 'Education'],
    caseCount: 83,
    wsiCount: 201,
    analysisCount: 22,
    downloadPolicy: '仅查看',
    updatedAt: '2026-05-10',
    views: '980',
    downloads: '0',
    publicContent: ['项目概览', 'AI 分析结果', '项目成员'],
  },
  {
    id: 'PRJ-PUB-2026-006',
    name: '多中心 IHC Ki67 定量分析项目',
    summary:
      '汇总多中心 Ki67 IHC 切片的阳性率、热点区域和质控提示，支持在线查看与结果文件下载。',
    organization: 'Innosensia Research',
    owner: 'Project Team',
    members: 14,
    disease: 'Breast Cancer',
    dataType: 'IHC',
    tags: ['Ki67', 'IHC', 'Hotspot', 'Quantification'],
    caseCount: 156,
    wsiCount: 412,
    analysisCount: 46,
    downloadPolicy: '可直接下载',
    updatedAt: '2026-05-06',
    views: '4.1k',
    downloads: '620',
    publicContent: ['项目概览', '公开数据摘要', 'AI 分析结果', '下载与引用'],
  },
];

const diseaseOptions = ['全部疾病', 'Breast Cancer', 'Lung Cancer', 'Gastric Cancer', 'Lymph Node', 'Cervical Cancer'];
const dataTypeOptions = ['全部数据类型', 'HE', 'IHC', 'IF', '多模态'];
const downloadOptions = ['全部下载权限', '可直接下载', '申请下载', '仅查看'];
const organizationOptions = ['全部机构', '仁达病理中心', 'AI Lab', '示例医院', '科研团队', '联合病理实验室', 'Innosensia Research'];

function policyClass(policy: DownloadPolicy) {
  switch (policy) {
    case '可直接下载':
      return 'border-[#3f6212] bg-[#3f6212]/35 text-[#84cc16]';
    case '申请下载':
      return 'border-[#8f35b7]/40 bg-[#8f35b7]/20 text-[#d292f4]';
    case '仅查看':
      return 'border-white/[0.08] bg-white/[0.05] text-[#94a3b8]';
    default:
      return 'border-white/[0.08] bg-white/[0.05] text-[#94a3b8]';
  }
}

function PolicyIcon({ policy }: { policy: DownloadPolicy }) {
  if (policy === '可直接下载') return <Download size={13} />;
  if (policy === '申请下载') return <ShieldCheck size={13} />;
  return <Lock size={13} />;
}

function StatCard({
  label,
  value,
  desc,
  icon,
}: {
  label: string;
  value: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-[#64748b] text-sm">{label}</div>
        <div className="w-8 h-8 rounded-lg bg-[#8f35b7]/15 border border-[#8f35b7]/30 text-[#d292f4] flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-[#f1f3f6] text-2xl font-bold">{value}</div>
      <div className="text-[#64748b] text-xs mt-2">{desc}</div>
    </div>
  );
}

function SelectFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-field h-9 min-w-[150px] pl-3 pr-8 text-sm appearance-none cursor-pointer"
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none"
      />
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
}: {
  project: PublicProject;
  onOpen: (project: PublicProject) => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.08] bg-[#202126] overflow-hidden hover:border-[#8f35b7]/35 hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="h-36 bg-[#111217] border-b border-white/[0.06] relative overflow-hidden">
        <div className="absolute inset-0 opacity-45">
          <div className="grid grid-cols-8 gap-2 p-4 rotate-[-4deg] scale-110">
            {Array.from({ length: 32 }).map((_, index) => (
              <div
                key={index}
                className="h-10 rounded-md border border-white/[0.06] bg-[#2f3138]"
              />
            ))}
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

        <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] text-[#94a3b8]">{project.id}</div>
            <div className="text-[#f8fafc] text-lg font-bold mt-1 line-clamp-1">
              {project.name}
            </div>
          </div>

          <span className={`h-7 px-2.5 rounded-md border text-xs inline-flex items-center gap-1.5 shrink-0 ${policyClass(project.downloadPolicy)}`}>
            <PolicyIcon policy={project.downloadPolicy} />
            {project.downloadPolicy}
          </span>
        </div>
      </div>

      <div className="p-5">
        <p className="text-[#94a3b8] text-sm leading-6 line-clamp-2 min-h-[48px]">
          {project.summary}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {project.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="h-6 px-2 rounded-md border border-[#8f35b7]/25 bg-[#8f35b7]/10 text-[#d292f4] text-xs inline-flex items-center"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2 mt-5">
          <div className="rounded-lg border border-white/[0.06] bg-[#17181d] p-3">
            <div className="text-[#64748b] text-xs">Case</div>
            <div className="text-[#f1f3f6] text-lg font-bold mt-1">{project.caseCount}</div>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-[#17181d] p-3">
            <div className="text-[#64748b] text-xs">WSI</div>
            <div className="text-[#f1f3f6] text-lg font-bold mt-1">{project.wsiCount}</div>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-[#17181d] p-3">
            <div className="text-[#64748b] text-xs">AI 分析</div>
            <div className="text-[#f1f3f6] text-lg font-bold mt-1">{project.analysisCount}</div>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-[#17181d] p-3">
            <div className="text-[#64748b] text-xs">成员</div>
            <div className="text-[#f1f3f6] text-lg font-bold mt-1">{project.members}</div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-4 text-xs text-[#64748b]">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[#94a3b8]">
              <Building2 size={13} />
              <span className="truncate">{project.organization}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <CalendarDays size={13} />
              <span>更新于 {project.updatedAt}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="inline-flex items-center gap-1">
              <Eye size={13} />
              {project.views}
            </span>
            <span className="inline-flex items-center gap-1">
              <Download size={13} />
              {project.downloads}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-5">
          <button
            type="button"
            onClick={() => onOpen(project)}
            className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
          >
            <Eye size={15} />
            查看项目
          </button>

          {project.downloadPolicy === '可直接下载' && (
            <button
              type="button"
              className="h-9 px-4 rounded-md border border-white/[0.08] bg-[#17181d] text-[#cbd5e1] text-sm hover:text-[#f1f3f6] hover:bg-white/[0.04] transition-all inline-flex items-center gap-2"
            >
              <Download size={15} />
              下载数据
            </button>
          )}

          {project.downloadPolicy === '申请下载' && (
            <button
              type="button"
              className="h-9 px-4 rounded-md border border-[#8f35b7]/35 bg-[#8f35b7]/10 text-[#d292f4] text-sm hover:bg-[#8f35b7]/18 transition-all inline-flex items-center gap-2"
            >
              <ShieldCheck size={15} />
              申请下载
            </button>
          )}

          {project.downloadPolicy === '仅查看' && (
            <button
              type="button"
              disabled
              className="h-9 px-4 rounded-md border border-white/[0.08] bg-white/[0.03] text-[#64748b] text-sm cursor-not-allowed inline-flex items-center gap-2"
            >
              <Lock size={15} />
              仅查看
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function ProjectDetailDrawer({
  project,
  onClose,
}: {
  project: PublicProject | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {project && (
        <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex justify-end">
          <motion.div
            initial={{ x: 520, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 520, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="w-[720px] h-full bg-[#202126] border-l border-white/[0.08] shadow-[0_0_80px_rgba(0,0,0,0.55)] flex flex-col"
          >
            <div className="h-16 px-6 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div>
                <div className="text-[#f1f3f6] text-lg font-bold">{project.name}</div>
                <div className="text-[#64748b] text-xs mt-1 font-mono">{project.id}</div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all inline-flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-5">
              <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="text-[#f1f3f6] text-base font-semibold">项目概览</div>
                    <div className="text-[#64748b] text-xs mt-1">
                      公开只读详情，不提供项目编辑、成员管理或数据新增操作。
                    </div>
                  </div>

                  <span className={`h-7 px-2.5 rounded-md border text-xs inline-flex items-center gap-1.5 ${policyClass(project.downloadPolicy)}`}>
                    <PolicyIcon policy={project.downloadPolicy} />
                    {project.downloadPolicy}
                  </span>
                </div>

                <p className="text-[#94a3b8] text-sm leading-6">{project.summary}</p>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="rounded-lg border border-white/[0.06] bg-[#202126] p-3">
                    <div className="text-[#64748b] text-xs mb-1">发起机构</div>
                    <div className="text-[#e2e8f0] text-sm">{project.organization}</div>
                  </div>

                  <div className="rounded-lg border border-white/[0.06] bg-[#202126] p-3">
                    <div className="text-[#64748b] text-xs mb-1">负责人</div>
                    <div className="text-[#e2e8f0] text-sm">{project.owner}</div>
                  </div>

                  <div className="rounded-lg border border-white/[0.06] bg-[#202126] p-3">
                    <div className="text-[#64748b] text-xs mb-1">疾病方向</div>
                    <div className="text-[#e2e8f0] text-sm">{project.disease}</div>
                  </div>

                  <div className="rounded-lg border border-white/[0.06] bg-[#202126] p-3">
                    <div className="text-[#64748b] text-xs mb-1">数据类型</div>
                    <div className="text-[#e2e8f0] text-sm">{project.dataType}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
                  <div className="text-[#64748b] text-xs">Case</div>
                  <div className="text-[#f1f3f6] text-2xl font-bold mt-1">{project.caseCount}</div>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
                  <div className="text-[#64748b] text-xs">WSI</div>
                  <div className="text-[#f1f3f6] text-2xl font-bold mt-1">{project.wsiCount}</div>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
                  <div className="text-[#64748b] text-xs">AI 分析</div>
                  <div className="text-[#f1f3f6] text-2xl font-bold mt-1">{project.analysisCount}</div>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
                  <div className="text-[#64748b] text-xs">成员</div>
                  <div className="text-[#f1f3f6] text-2xl font-bold mt-1">{project.members}</div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-5">
                <div className="text-[#f1f3f6] text-base font-semibold mb-4">公开内容</div>
                <div className="grid grid-cols-2 gap-3">
                  {project.publicContent.map((item) => (
                    <div
                      key={item}
                      className="h-10 px-3 rounded-lg border border-[#8f35b7]/25 bg-[#8f35b7]/10 text-[#d292f4] text-sm flex items-center gap-2"
                    >
                      <FileText size={15} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-5">
                <div className="text-[#f1f3f6] text-base font-semibold mb-4">公开详情页建议 Tab</div>

                <div className="space-y-3">
                  {[
                    ['项目概览', '项目介绍、发起机构、研究方向和统计数据。'],
                    ['公开数据', '展示可公开查看的 Case / WSI 摘要。'],
                    ['AI 分析结果', '展示公开的分析时间线、图表和结果摘要。'],
                    ['项目成员', '展示项目负责人、参与成员与机构信息。'],
                    ['下载与引用', '展示下载策略、数据协议、引用格式和申请入口。'],
                  ].map(([title, desc]) => (
                    <div
                      key={title}
                      className="rounded-lg border border-white/[0.06] bg-[#202126] p-3"
                    >
                      <div className="text-[#e2e8f0] text-sm font-semibold">{title}</div>
                      <div className="text-[#64748b] text-xs mt-1">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-16 px-6 border-t border-white/[0.06] bg-[#17181d] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-md border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all"
              >
                关闭
              </button>

              {project.downloadPolicy === '可直接下载' && (
                <button
                  type="button"
                  className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
                >
                  <Download size={15} />
                  下载开放内容
                </button>
              )}

              {project.downloadPolicy === '申请下载' && (
                <button
                  type="button"
                  className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
                >
                  <ShieldCheck size={15} />
                  申请下载权限
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function Datasets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [diseaseFilter, setDiseaseFilter] = useState('全部疾病');
  const [dataTypeFilter, setDataTypeFilter] = useState('全部数据类型');
  const [downloadFilter, setDownloadFilter] = useState('全部下载权限');
  const [organizationFilter, setOrganizationFilter] = useState('全部机构');
  const [sortBy, setSortBy] = useState('综合推荐');
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);

  const filteredProjects = useMemo(() => {
    let list = [...PUBLIC_PROJECTS];

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      list = list.filter((project) =>
        `${project.name} ${project.summary} ${project.organization} ${project.owner} ${project.tags.join(' ')}`
          .toLowerCase()
          .includes(query)
      );
    }

    if (diseaseFilter !== '全部疾病') {
      list = list.filter((project) => project.disease === diseaseFilter);
    }

    if (dataTypeFilter !== '全部数据类型') {
      list = list.filter((project) => project.dataType === dataTypeFilter);
    }

    if (downloadFilter !== '全部下载权限') {
      list = list.filter((project) => project.downloadPolicy === downloadFilter);
    }

    if (organizationFilter !== '全部机构') {
      list = list.filter((project) => project.organization === organizationFilter);
    }

    switch (sortBy) {
      case '最近更新':
        return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      case 'WSI 数最多':
        return list.sort((a, b) => b.wsiCount - a.wsiCount);
      case '下载最多':
        return list.sort((a, b) => Number(b.downloads.replace(/[^\d]/g, '')) - Number(a.downloads.replace(/[^\d]/g, '')));
      default:
        return list;
    }
  }, [searchQuery, diseaseFilter, dataTypeFilter, downloadFilter, organizationFilter, sortBy]);

  const publicCaseCount = PUBLIC_PROJECTS.reduce((sum, item) => sum + item.caseCount, 0);
  const publicWsiCount = PUBLIC_PROJECTS.reduce((sum, item) => sum + item.wsiCount, 0);
  const organizationCount = new Set(PUBLIC_PROJECTS.map((item) => item.organization)).size;

  const activeFilterCount = [
    diseaseFilter !== '全部疾病',
    dataTypeFilter !== '全部数据类型',
    downloadFilter !== '全部下载权限',
    organizationFilter !== '全部机构',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setDiseaseFilter('全部疾病');
    setDataTypeFilter('全部数据类型');
    setDownloadFilter('全部下载权限');
    setOrganizationFilter('全部机构');
    setSortBy('综合推荐');
  };

  return (
    <div className="min-h-[60dvh]">
      <section className="pt-24 pb-10 border-b border-white/[0.06]">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="grid grid-cols-[1fr_0.8fr] gap-8 items-end"
          >
            <div>
              <span className="text-eyebrow uppercase text-[#64748b] tracking-widest">
                PROJECT SQUARE
              </span>
              <h1 className="text-h1 text-[#e2e8f0] mt-2">项目广场</h1>
              <p className="text-body-lg text-[#94a3b8] mt-3 max-w-3xl leading-8">
                浏览公开研究项目，查看项目数据、成员与 AI 分析结果，并按权限下载开放内容。
              </p>

              <div className="relative mt-6 max-w-xl">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none"
                />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="input-field h-12 w-full pl-11 pr-10 text-base"
                  placeholder="搜索项目名称、疾病类型、机构或标签..."
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#e2e8f0] transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="公开项目"
                value={String(PUBLIC_PROJECTS.length)}
                desc="已公开展示的研究项目"
                icon={<FlaskConical size={17} />}
              />
              <StatCard
                label="公开 Case"
                value={publicCaseCount.toLocaleString()}
                desc="公开项目关联病例数"
                icon={<FileText size={17} />}
              />
              <StatCard
                label="公开 WSI"
                value={publicWsiCount.toLocaleString()}
                desc="公开项目关联切片数"
                icon={<Database size={17} />}
              />
              <StatCard
                label="参与机构"
                value={String(organizationCount)}
                desc="参与公开项目的机构数"
                icon={<Building2 size={17} />}
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="sticky top-16 z-40 bg-[#0f1014]/95 backdrop-blur-md border-b border-white/[0.06] py-4">
        <div className="section-container">
          <div className="flex flex-wrap items-center gap-3">
            <SelectFilter value={diseaseFilter} onChange={setDiseaseFilter} options={diseaseOptions} />
            <SelectFilter value={dataTypeFilter} onChange={setDataTypeFilter} options={dataTypeOptions} />
            <SelectFilter value={downloadFilter} onChange={setDownloadFilter} options={downloadOptions} />
            <SelectFilter value={organizationFilter} onChange={setOrganizationFilter} options={organizationOptions} />

            <div className="relative ml-auto">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="input-field h-9 w-36 pl-3 pr-7 text-sm appearance-none cursor-pointer"
              >
                <option value="综合推荐">综合推荐</option>
                <option value="最近更新">最近更新</option>
                <option value="WSI 数最多">WSI 数最多</option>
                <option value="下载最多">下载最多</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none"
              />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[#64748b] text-xs">已启用 {activeFilterCount} 个筛选条件</span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-[#d292f4] hover:text-[#f0b7ff] hover:underline underline-offset-4 transition-all"
              >
                清空筛选
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="py-8 pb-20">
        <div className="section-container">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-[#f1f3f6] text-lg font-semibold">公开研究项目</div>
              <div className="text-[#64748b] text-sm mt-1">
                当前显示 {filteredProjects.length} / {PUBLIC_PROJECTS.length} 个公开项目
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-[#64748b]">
              <Clock3 size={14} />
              项目广场仅展示已公开项目，编辑管理请进入工作台。
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="h-[320px] rounded-2xl border border-dashed border-white/[0.10] bg-[#202126] flex flex-col items-center justify-center text-center">
              <FlaskConical size={52} className="text-[#475569] mb-4" />
              <div className="text-[#e2e8f0] text-lg font-semibold">未找到匹配的公开项目</div>
              <div className="text-[#64748b] text-sm mt-2">请调整搜索关键词或筛选条件。</div>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 h-9 px-4 rounded-md border border-white/[0.08] bg-[#17181d] text-[#cbd5e1] text-sm hover:text-[#f1f3f6] hover:bg-white/[0.04] transition-all"
              >
                查看全部项目
              </button>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={setSelectedProject}
                />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <ProjectDetailDrawer
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}
