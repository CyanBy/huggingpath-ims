import { useState, type ReactNode } from 'react';
import {
  BarChart3,
  Brain,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  CheckCircle2,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'roles' | 'organizations' | 'models' | 'settings-basic' | 'settings-smtp';

type ReviewStatus = '待审核' | '已通过' | '已拒绝';
type CommonStatus = '正常' | '停用' | '异常';
type UserRole = '普通用户' | '机构管理员' | '平台管理员';
type RoleStatus = '启用' | '停用';
type RoleType = '系统内置' | '自定义';

type UserRow = {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: UserRole;
  status: CommonStatus;
  lastLogin: string;
};

type RoleRow = {
  id: string;
  name: string;
  type: RoleType;
  description: string;
  userCount: number;
  status: RoleStatus;
  updatedAt: string;
  permissions: string[];
};

type AdminModelStatus = '启用' | '停用';
type AdminModelVisibility = '公开' | '隐藏';

type AdminModelRow = {
  id: string;
  name: string;
  owner: string;
  organization: string;
  modelType: string;
  version: string;
  status: AdminModelStatus;
  visibility: AdminModelVisibility;
  runCount: number;
  updatedAt: string;
};

const menuItems: {
  key?: AdminTab;
  label: string;
  icon: ReactNode;
  children?: {
    key: AdminTab;
    label: string;
  }[];
}[] = [
  { key: 'overview', label: '总览', icon: <BarChart3 size={17} /> },
  { key: 'users', label: '用户管理', icon: <Users size={17} /> },
  { key: 'roles', label: '角色管理', icon: <ShieldCheck size={17} /> },
  { key: 'organizations', label: '机构管理', icon: <Building2 size={17} /> },
  { key: 'models', label: '模型管理', icon: <Brain size={17} /> },
  {
    label: '系统设置',
    icon: <Settings size={17} />,
    children: [
      { key: 'settings-basic', label: '基础设置' },
      { key: 'settings-smtp', label: 'SMTP 设置' },
    ],
  },
];

const organizationOptions = ['仁达病理中心', 'AI Lab', '测试机构', '示例医院', '科研团队'];

const permissionGroups = [
  {
    group: '模型权限',
    permissions: ['查看模型', '运行模型', '创建模型', '编辑模型', '公开模型'],
  },
  {
    group: '研究项目权限',
    permissions: ['查看公开项目', '创建项目', '编辑项目', '公开项目', '管理项目成员'],
  },
  {
    group: '数据权限',
    permissions: ['上传 WSI', '管理 WSI', '管理 Case', '删除数据', '查看异常数据'],
  },
  {
    group: '分析权限',
    permissions: ['创建分析任务', '查看分析结果', '下载分析结果', '重新推理'],
  },
  {
    group: '后台权限',
    permissions: ['用户管理', '角色管理', '机构管理', '模型审核', '数据管理'],
  },
  {
    group: '系统权限',
    permissions: ['系统配置', '游客规则配置', '上传限制配置', '存储配置'],
  },
];

const allPermissions = permissionGroups.flatMap((group) => group.permissions);

const overviewStats = [
  { label: '用户数', value: '128', desc: '平台注册用户' },
  { label: '机构数', value: '12', desc: '医院 / 实验室 / 科研团队' },
  { label: '模型数', value: '36', desc: '平台模型与用户模型' },
  { label: '公开模型', value: '18', desc: '模型中心展示模型' },
  { label: '今日分析任务', value: '246', desc: '今日提交推理任务' },
  { label: '异常任务', value: '3', desc: '需要管理员关注' },
  { label: 'WSI 总量', value: '12,430', desc: '平台切片总量' },
  { label: '存储占用', value: '8.6 TB', desc: '当前存储消耗' },
];

const initialUsers: UserRow[] = [
  {
    id: 'user-001',
    name: 'Zhang San',
    email: 'zhangsan@example.com',
    organization: '仁达病理中心',
    role: '机构管理员',
    status: '正常',
    lastLogin: '2026-05-20 15:30',
  },
  {
    id: 'user-002',
    name: 'Li Ming',
    email: 'liming@example.com',
    organization: 'AI Lab',
    role: '普通用户',
    status: '正常',
    lastLogin: '2026-05-20 13:12',
  },
  {
    id: 'user-003',
    name: 'Wang Yu',
    email: 'wangyu@example.com',
    organization: '测试机构',
    role: '普通用户',
    status: '停用',
    lastLogin: '2026-05-12 09:18',
  },
];

const initialRoles: RoleRow[] = [
  {
    id: 'role-001',
    name: '平台管理员',
    type: '系统内置',
    description: '拥有后台管理、系统配置、模型审核、用户与机构管理等全部权限。',
    userCount: 3,
    status: '启用',
    updatedAt: '2026-05-20',
    permissions: allPermissions,
  },
  {
    id: 'role-002',
    name: '机构管理员',
    type: '系统内置',
    description: '管理本机构用户、研究项目、Case、WSI 与分析任务，不具备平台级系统配置权限。',
    userCount: 12,
    status: '启用',
    updatedAt: '2026-05-18',
    permissions: [
      '查看模型',
      '运行模型',
      '创建模型',
      '编辑模型',
      '查看公开项目',
      '创建项目',
      '编辑项目',
      '公开项目',
      '管理项目成员',
      '上传 WSI',
      '管理 WSI',
      '管理 Case',
      '查看异常数据',
      '创建分析任务',
      '查看分析结果',
      '下载分析结果',
      '重新推理',
    ],
  },
  {
    id: 'role-003',
    name: '普通用户',
    type: '系统内置',
    description: '可使用模型中心、创建个人项目、上传 WSI、管理个人 Case 与查看分析结果。',
    userCount: 108,
    status: '启用',
    updatedAt: '2026-05-16',
    permissions: [
      '查看模型',
      '运行模型',
      '查看公开项目',
      '创建项目',
      '编辑项目',
      '上传 WSI',
      '管理 WSI',
      '管理 Case',
      '创建分析任务',
      '查看分析结果',
      '下载分析结果',
    ],
  },
  {
    id: 'role-004',
    name: '模型审核员',
    type: '自定义',
    description: '负责审核用户提交的公开模型，可通过、拒绝或要求补充模型信息。',
    userCount: 5,
    status: '启用',
    updatedAt: '2026-05-14',
    permissions: ['查看模型', '模型审核', '数据管理'],
  },
  {
    id: 'role-005',
    name: '数据质控员',
    type: '自定义',
    description: '负责查看平台数据异常、WSI 文件状态、Case 数据完整性与质控提示。',
    userCount: 4,
    status: '停用',
    updatedAt: '2026-05-10',
    permissions: ['查看异常数据', '管理 WSI', '管理 Case', '查看分析结果', '下载分析结果'],
  },
];

const organizations = [
  {
    name: '仁达病理中心',
    type: '病理中心',
    userCount: 32,
    caseCount: 1240,
    wsiCount: 8500,
    quota: '10 TB',
    status: '正常' as CommonStatus,
  },
  {
    name: 'AI Lab',
    type: '科研机构',
    userCount: 18,
    caseCount: 620,
    wsiCount: 3100,
    quota: '5 TB',
    status: '正常' as CommonStatus,
  },
  {
    name: '测试机构',
    type: '企业',
    userCount: 6,
    caseCount: 80,
    wsiCount: 260,
    quota: '1 TB',
    status: '停用' as CommonStatus,
  },
];

const modelReviews = [
  {
    name: 'CellViT++',
    submitter: 'Zhang San',
    organization: '仁达病理中心',
    type: '分割 · 检测',
    version: 'v1.2.0',
    status: '待审核' as ReviewStatus,
    submittedAt: '2026-05-20 14:25',
  },
  {
    name: 'TME Analyzer',
    submitter: 'Li Ming',
    organization: 'AI Lab',
    type: '肿瘤微环境',
    version: 'v0.9.5',
    status: '已通过' as ReviewStatus,
    submittedAt: '2026-05-18 11:10',
  },
  {
    name: 'ProtoMIL',
    submitter: 'Wang Yu',
    organization: '测试机构',
    type: '多示例学习',
    version: 'v0.8.2',
    status: '已拒绝' as ReviewStatus,
    submittedAt: '2026-05-15 16:40',
  },
];


const initialAdminModels: AdminModelRow[] = [
  {
    id: 'model-001',
    name: 'CellViT++',
    owner: 'Zhang San',
    organization: '仁达病理中心',
    modelType: '细胞核分割 · 检测',
    version: 'v1.2.0',
    status: '启用',
    visibility: '公开',
    runCount: 1286,
    updatedAt: '2026-05-20',
  },
  {
    id: 'model-002',
    name: 'TME Analyzer',
    owner: 'Li Ming',
    organization: 'AI Lab',
    modelType: '肿瘤微环境分析',
    version: 'v0.9.5',
    status: '启用',
    visibility: '公开',
    runCount: 842,
    updatedAt: '2026-05-18',
  },
  {
    id: 'model-003',
    name: 'HistoQC',
    owner: 'Platform',
    organization: 'HuggingPath',
    modelType: '切片质控',
    version: 'v2.1.0',
    status: '启用',
    visibility: '公开',
    runCount: 2416,
    updatedAt: '2026-05-12',
  },
  {
    id: 'model-004',
    name: 'ProtoMIL',
    owner: 'Wang Yu',
    organization: '测试机构',
    modelType: '多示例学习',
    version: 'v0.8.2',
    status: '启用',
    visibility: '隐藏',
    runCount: 56,
    updatedAt: '2026-05-15',
  },
  {
    id: 'model-005',
    name: 'CellViT-SAM',
    owner: 'Liu Fang',
    organization: '仁达病理中心',
    modelType: '组织区域分割',
    version: 'v0.6.1',
    status: '停用',
    visibility: '隐藏',
    runCount: 37,
    updatedAt: '2026-05-10',
  },
];

const settingsRows = [
  { name: 'SMTP 服务状态', value: '开启', desc: '控制系统是否允许通过 SMTP 发送通知邮件。' },
  { name: 'SMTP Host', value: 'smtp.example.com', desc: '邮件服务器地址，例如 smtp.company.com。' },
  { name: 'SMTP Port', value: '465', desc: 'SMTP 端口，常见端口为 465 / 587 / 25。' },
  { name: '加密方式', value: 'SSL', desc: '支持 SSL / TLS / None，需与邮件服务商配置一致。' },
  { name: '发件邮箱', value: 'noreply@huggingpath.com', desc: '系统通知邮件的默认发件邮箱。' },
  { name: '发件人名称', value: 'HuggingPath', desc: '用户收到邮件时展示的发件人名称。' },
  { name: '认证账号', value: 'noreply@huggingpath.com', desc: 'SMTP 登录账号，通常与发件邮箱一致。' },
  { name: '认证密码', value: '••••••••••••', desc: 'SMTP 授权码或密码，前端仅做脱敏展示。' },
  { name: '测试收件人', value: 'admin@example.com', desc: '用于发送测试邮件，验证 SMTP 配置是否可用。' },
];

function StatusBadge({ status }: { status: CommonStatus | ReviewStatus }) {
  const className =
    status === '正常' || status === '已通过'
      ? 'border-[#3f6212] bg-[#3f6212]/35 text-[#84cc16]'
      : status === '待审核'
        ? 'border-[#8f35b7]/40 bg-[#8f35b7]/20 text-[#d292f4]'
        : status === '停用' || status === '已拒绝'
          ? 'border-white/[0.08] bg-white/[0.05] text-[#94a3b8]'
          : 'border-[#991b1b] bg-[#991b1b]/30 text-[#fca5a5]';

  return (
    <span className={`h-6 px-2 rounded border text-xs inline-flex items-center ${className}`}>
      {status}
    </span>
  );
}

function RoleStatusBadge({ status }: { status: RoleStatus }) {
  const className =
    status === '启用'
      ? 'border-[#3f6212] bg-[#3f6212]/35 text-[#84cc16]'
      : 'border-white/[0.08] bg-white/[0.05] text-[#94a3b8]';

  return (
    <span className={`h-6 px-2 rounded border text-xs inline-flex items-center ${className}`}>
      {status}
    </span>
  );
}

function StatusToggle({
  checked,
  onClick,
  title,
}: {
  checked: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`relative h-[28px] w-[56px] rounded-full transition-all duration-200 ${
        checked ? 'bg-[#8f35b7]' : 'bg-[#303139]'
      }`}
    >
      <span
        className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-all duration-200 ${
          checked ? 'left-[30px]' : 'left-[4px]'
        }`}
      />
    </button>
  );
}

function SectionTitle({
  title,
  desc,
  action,
}: {
  title: string;
  desc: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[26px] leading-8 font-bold text-[#f8fafc]">{title}</h1>
        <p className="text-sm text-[#64748b] mt-1">{desc}</p>
      </div>
      {action}
    </div>
  );
}

function OverviewPanel() {
  const gpuRows = [
    {
      name: 'GPU 1',
      model: 'NVIDIA RTX 4090',
      usage: 72,
      memory: '18.6 / 24 GB',
      temperature: '64°C',
      runningTask: 'CellViT++ · TASK-20260520-001',
    },
    {
      name: 'GPU 2',
      model: 'NVIDIA RTX 4090',
      usage: 38,
      memory: '9.2 / 24 GB',
      temperature: '51°C',
      runningTask: 'TME Analyzer · TASK-20260520-004',
    },
  ];

  const serviceRows = [
    {
      name: 'Redis',
      status: '正常' as CommonStatus,
      desc: '缓存 / 队列状态正常',
      metric: '内存 1.8GB · 命中率 98.6%',
    },
    {
      name: 'PostgreSQL',
      status: '正常' as CommonStatus,
      desc: '业务数据库连接正常',
      metric: '连接 42 / 200',
    },
    {
      name: 'Object Storage',
      status: '正常' as CommonStatus,
      desc: 'WSI 文件存储可用',
      metric: '已用 8.6TB / 20TB',
    },
    {
      name: 'Inference Worker',
      status: '正常' as CommonStatus,
      desc: 'AI 推理 Worker 在线',
      metric: '在线 6 / 6',
    },
  ];

  return (
    <>
      <SectionTitle
        title="后台总览"
        desc="用于查看平台资源规模、服务器资源、GPU 负载、核心服务状态和系统运行情况。"
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">今日分析任务</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">246</div>
          <div className="text-[#64748b] text-xs mt-2">今日提交的 AI 推理任务。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">排队任务</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">12</div>
          <div className="text-[#64748b] text-xs mt-2">等待空闲 GPU 资源。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">WSI 总量</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">12,430</div>
          <div className="text-[#64748b] text-xs mt-2">平台切片文件总数。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">存储占用</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">8.6 TB</div>
          <div className="text-[#64748b] text-xs mt-2">对象存储当前占用。</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">CPU 型号</div>
          <div className="text-[#f1f3f6] text-lg font-bold leading-6">Intel Xeon Silver 4314</div>
          <div className="text-[#64748b] text-xs mt-2">16 Core / 32 Thread</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">CPU 频率</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">2.80 GHz</div>
          <div className="text-[#64748b] text-xs mt-2">当前平均频率，负载 46%。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">系统内存</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">86 / 256 GB</div>
          <div className="text-[#64748b] text-xs mt-2">当前内存占用 33.6%。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">服务运行时间</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">18d 06h</div>
          <div className="text-[#64748b] text-xs mt-2">最近一次重启：2026-05-02。</div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_0.85fr] gap-4">
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
          <div className="h-14 px-5 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[#f1f3f6] text-base font-semibold">GPU 资源占用</div>
              <div className="text-[#64748b] text-xs mt-0.5">
                展示当前推理服务器 GPU 使用率、显存占用、温度与运行任务。
              </div>
            </div>

            <span className="h-7 px-3 rounded-full border border-[#3f6212] bg-[#3f6212]/35 text-[#84cc16] text-xs inline-flex items-center">
              2 / 2 在线
            </span>
          </div>

          <div className="p-5 space-y-4">
            {gpuRows.map((gpu) => (
              <div key={gpu.name} className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="text-[#f1f3f6] text-sm font-semibold">
                      {gpu.name} · {gpu.model}
                    </div>
                    <div className="text-[#64748b] text-xs mt-1">{gpu.runningTask}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-[#f1f3f6] text-lg font-bold">{gpu.usage}%</div>
                    <div className="text-[#64748b] text-xs mt-1">GPU 使用率</div>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-[#8f35b7]"
                    style={{ width: `${gpu.usage}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg border border-white/[0.06] bg-[#202126] p-3">
                    <div className="text-[#64748b] text-xs mb-1">显存</div>
                    <div className="text-[#e2e8f0] font-medium">{gpu.memory}</div>
                  </div>

                  <div className="rounded-lg border border-white/[0.06] bg-[#202126] p-3">
                    <div className="text-[#64748b] text-xs mb-1">温度</div>
                    <div className="text-[#e2e8f0] font-medium">{gpu.temperature}</div>
                  </div>

                  <div className="rounded-lg border border-white/[0.06] bg-[#202126] p-3">
                    <div className="text-[#64748b] text-xs mb-1">状态</div>
                    <div className="text-[#84cc16] font-medium">运行中</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
          <div className="h-14 px-5 border-b border-white/[0.06] flex items-center">
            <div>
              <div className="text-[#f1f3f6] text-base font-semibold">核心服务状态</div>
              <div className="text-[#64748b] text-xs mt-0.5">
                Redis、数据库、存储与推理 Worker 状态。
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3">
            {serviceRows.map((service) => (
              <div
                key={service.name}
                className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-[#f1f3f6] text-sm font-semibold">{service.name}</div>
                  <div className="text-[#64748b] text-xs mt-1">{service.desc}</div>
                  <div className="text-[#94a3b8] text-xs mt-2">{service.metric}</div>
                </div>

                <StatusBadge status={service.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [keyword, setKeyword] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newOrganization, setNewOrganization] = useState(organizationOptions[0]);
  const [newRole, setNewRole] = useState<UserRole>('普通用户');
  const [newStatus, setNewStatus] = useState<CommonStatus>('正常');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');

  const filteredUsers = users.filter((item) => {
    if (!keyword.trim()) return true;

    const text = `${item.name} ${item.email} ${item.organization} ${item.role}`.toLowerCase();
    return text.includes(keyword.trim().toLowerCase());
  });

  const resetForm = () => {
    setNewName('');
    setNewEmail('');
    setNewOrganization(organizationOptions[0]);
    setNewRole('普通用户');
    setNewStatus('正常');
    setNewPassword('');
    setError('');
  };

  const closeModal = () => {
    resetForm();
    setShowCreateModal(false);
  };

  const createUser = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!newName.trim()) {
      setError('请输入用户名。');
      return;
    }

    if (!newEmail.trim()) {
      setError('请输入邮箱。');
      return;
    }

    if (!emailPattern.test(newEmail.trim())) {
      setError('邮箱格式不正确。');
      return;
    }

    const duplicatedEmail = users.some(
      (item) => item.email.toLowerCase() === newEmail.trim().toLowerCase()
    );

    if (duplicatedEmail) {
      setError('该邮箱已存在，请更换邮箱。');
      return;
    }

    const nextUser: UserRow = {
      id: `user-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      organization: newOrganization,
      role: newRole,
      status: newStatus,
      lastLogin: '暂未登录',
    };

    setUsers((prev) => [nextUser, ...prev]);
    closeModal();
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((item) =>
        item.id === userId
          ? {
              ...item,
              status: item.status === '正常' ? '停用' : '正常',
            }
          : item
      )
    );
  };

  return (
    <>
      <SectionTitle
        title="用户管理"
        desc="管理平台用户、角色、状态和所属机构。"
        action={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
          >
            <Plus size={16} />
            新增用户
          </button>
        }
      />

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="h-9 w-[320px] rounded-md border border-white/[0.08] bg-[#17181d] px-3 flex items-center gap-2">
          <Search size={15} className="text-[#64748b]" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="w-full bg-transparent outline-none text-sm text-[#cbd5e1] placeholder:text-[#64748b]"
            placeholder="搜索用户名 / 邮箱 / 机构 / 角色"
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="bg-[#252730] text-[#cbd5e1]">
              <th className="h-11 px-3 text-left" style={{ width: '16%' }}>用户名</th>
              <th className="h-11 px-3 text-left" style={{ width: '22%' }}>邮箱</th>
              <th className="h-11 px-3 text-left" style={{ width: '18%' }}>所属机构</th>
              <th className="h-11 px-3 text-left" style={{ width: '14%' }}>角色</th>
              <th className="h-11 px-3 text-left" style={{ width: '10%' }}>状态</th>
              <th className="h-11 px-3 text-left" style={{ width: '14%' }}>最近登录</th>
              <th className="h-11 px-3 text-left" style={{ width: '6%' }}>操作</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((item) => (
              <tr key={item.id} className="border-b border-white/[0.06] text-[#d1d5db] hover:bg-white/[0.025]">
                <td className="h-11 px-3">{item.name}</td>
                <td className="h-11 px-3 font-mono">{item.email}</td>
                <td className="h-11 px-3">{item.organization}</td>
                <td className="h-11 px-3">{item.role}</td>
                <td className="h-11 px-3">
                  <StatusToggle
                    checked={item.status === '正常'}
                    onClick={() => toggleUserStatus(item.id)}
                    title={item.status === '正常' ? '点击停用' : '点击启用'}
                  />
                </td>
                <td className="h-11 px-3">{item.lastLogin}</td>
                <td className="h-11 px-3">
                  <button className="text-[#d292f4] hover:text-[#f0b7ff]">编辑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="h-[220px] flex flex-col items-center justify-center text-center text-[#64748b]">
            <Users size={42} className="mb-3 opacity-60" />
            <div className="text-[#94a3b8] text-sm">暂无匹配用户</div>
            <div className="text-[#64748b] text-xs mt-1">请调整搜索关键词。</div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-[680px] rounded-2xl border border-white/[0.08] bg-[#202126] shadow-[0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="h-16 px-6 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-[#f1f3f6] text-lg font-bold">新增用户</div>
                <div className="text-[#64748b] text-xs mt-1">
                  新增后用户会进入后台用户列表，当前为前端原型演示。
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all inline-flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="rounded-lg border border-[#991b1b] bg-[#991b1b]/20 px-3 py-2 text-[#fca5a5] text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">
                    用户名 <span className="text-[#ff8f8f]">*</span>
                  </label>
                  <input
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                    placeholder="请输入用户名"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">
                    邮箱 <span className="text-[#ff8f8f]">*</span>
                  </label>
                  <input
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                    placeholder="example@domain.com"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">所属机构</label>
                  <select
                    value={newOrganization}
                    onChange={(event) => setNewOrganization(event.target.value)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  >
                    {organizationOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">角色</label>
                  <select
                    value={newRole}
                    onChange={(event) => setNewRole(event.target.value as UserRole)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  >
                    <option value="普通用户">普通用户</option>
                    <option value="机构管理员">机构管理员</option>
                    <option value="平台管理员">平台管理员</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">账号状态</label>
                  <select
                    value={newStatus}
                    onChange={(event) => setNewStatus(event.target.value as CommonStatus)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  >
                    <option value="正常">正常</option>
                    <option value="停用">停用</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">初始密码</label>
                  <input
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                    placeholder="可选，原型暂不校验"
                    type="text"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-4">
                <div className="text-[#d292f4] text-sm font-semibold mb-1">新增规则说明</div>
                <div className="text-[#94a3b8] text-xs leading-6">
                  当前为前端原型：新增用户只会插入当前页面列表，不会真实创建账号。正式系统中应接入账号邀请、初始密码策略、邮箱验证和角色权限控制。
                </div>
              </div>
            </div>

            <div className="h-16 px-6 border-t border-white/[0.06] bg-[#17181d] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="h-9 px-4 rounded-md border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all"
              >
                取消
              </button>

              <button
                type="button"
                onClick={createUser}
                className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                确定新增
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RolesPanel() {
  const [roles, setRoles] = useState<RoleRow[]>(initialRoles);
  const [keyword, setKeyword] = useState('');
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  const [draftName, setDraftName] = useState('');
  const [draftStatus, setDraftStatus] = useState<RoleStatus>('启用');
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);
  const [draftError, setDraftError] = useState('');

  const filteredRoles = roles.filter((role) => {
    if (!keyword.trim()) return true;

    const text = `${role.name} ${role.status}`.toLowerCase();
    return text.includes(keyword.trim().toLowerCase());
  });

  const openCreateRole = () => {
    setIsCreatingRole(true);
    setEditingRole(null);
    setDraftName('');
    setDraftStatus('启用');
    setDraftPermissions([]);
    setDraftError('');
  };

  const openEditRole = (role: RoleRow) => {
    setIsCreatingRole(false);
    setEditingRole(role);
    setDraftName(role.name);
    setDraftStatus(role.status);
    setDraftPermissions(role.permissions);
    setDraftError('');
  };

  const closeRoleModal = () => {
    setIsCreatingRole(false);
    setEditingRole(null);
    setDraftError('');
  };

  const togglePermission = (permission: string) => {
    setDraftPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission]
    );
  };

  const togglePermissionGroup = (permissions: string[]) => {
    const hasAll = permissions.every((permission) => draftPermissions.includes(permission));

    if (hasAll) {
      setDraftPermissions((prev) => prev.filter((item) => !permissions.includes(item)));
      return;
    }

    setDraftPermissions((prev) => Array.from(new Set([...prev, ...permissions])));
  };

  const saveRole = () => {
    if (!draftName.trim()) {
      setDraftError('请输入角色名称。');
      return;
    }

    if (draftPermissions.length === 0) {
      setDraftError('请至少选择一个权限。');
      return;
    }

    if (isCreatingRole) {
      const nextRole: RoleRow = {
        id: `role-${Date.now()}`,
        name: draftName.trim(),
        type: '自定义',
        description: '',
        userCount: 0,
        status: draftStatus,
        updatedAt: '2026-05-20',
        permissions: draftPermissions,
      };

      setRoles((prev) => [nextRole, ...prev]);
      closeRoleModal();
      return;
    }

    if (editingRole) {
      setRoles((prev) =>
        prev.map((role) =>
          role.id === editingRole.id
            ? {
                ...role,
                name: draftName.trim(),
                status: draftStatus,
                updatedAt: '2026-05-20',
                permissions: draftPermissions,
              }
            : role
        )
      );
      closeRoleModal();
    }
  };

  const toggleRoleStatus = (roleId: string) => {
    setRoles((prev) =>
      prev.map((role) =>
        role.id === roleId
          ? {
              ...role,
              status: role.status === '启用' ? '停用' : '启用',
              updatedAt: '2026-05-20',
            }
          : role
      )
    );
  };

  const deleteRole = (roleId: string) => {
    setRoles((prev) => prev.filter((role) => role.id !== roleId));
  };

  const roleModalOpen = isCreatingRole || Boolean(editingRole);

  return (
    <>
      <SectionTitle
        title="角色管理"
        desc="管理平台角色与权限模板，支持新增、编辑、删除和启用状态控制。"
      />

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="h-9 w-[360px] rounded-md border border-white/[0.08] bg-[#17181d] px-3 flex items-center gap-2">
          <Search size={15} className="text-[#64748b]" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="w-full bg-transparent outline-none text-sm text-[#cbd5e1] placeholder:text-[#64748b]"
            placeholder="搜索角色名称 / 状态"
          />
        </div>

        <button
          type="button"
          onClick={openCreateRole}
          className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
        >
          <Plus size={16} />
          新增角色
        </button>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="bg-[#252730] text-[#cbd5e1]">
              <th className="h-11 px-4 text-left">角色名称</th>
              <th className="h-11 px-3 text-left" style={{ width: 120 }}>状态</th>
              <th className="h-11 px-4 text-left" style={{ width: 180 }}>操作</th>
            </tr>
          </thead>

          <tbody>
            {filteredRoles.map((role) => (
              <tr
                key={role.id}
                className="border-b border-white/[0.06] text-[#d1d5db] hover:bg-white/[0.025]"
              >
                <td className="h-12 px-4 text-[#e2e8f0] font-medium">{role.name}</td>
                <td className="h-12 px-3">
                  <StatusToggle
                    checked={role.status === '启用'}
                    onClick={() => toggleRoleStatus(role.id)}
                    title={role.status === '启用' ? '点击停用' : '点击启用'}
                  />
                </td>
                <td className="h-12 px-4">
                  <div className="flex items-center gap-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEditRole(role)}
                      className="text-[#d292f4] hover:text-[#f0b7ff]"
                    >
                      编辑
                    </button>

                    {role.type === '自定义' && (
                      <button
                        type="button"
                        onClick={() => deleteRole(role.id)}
                        className="text-[#fca5a5] hover:text-[#fecaca]"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRoles.length === 0 && (
          <div className="h-[220px] flex flex-col items-center justify-center text-center text-[#64748b]">
            <ShieldCheck size={42} className="mb-3 opacity-60" />
            <div className="text-[#94a3b8] text-sm">暂无匹配角色</div>
            <div className="text-[#64748b] text-xs mt-1">请调整搜索关键词。</div>
          </div>
        )}

      </div>

      {roleModalOpen && (
        <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-[820px] max-w-[calc(100vw-48px)] max-h-[calc(100dvh-48px)] rounded-2xl border border-white/[0.08] bg-[#202126] shadow-[0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden flex flex-col">
            <div className="h-16 px-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div>
                <div className="text-[#f1f3f6] text-lg font-bold">
                  {isCreatingRole ? '新增角色' : '编辑角色'}
                </div>
                <div className="text-[#64748b] text-xs mt-1">
                  {isCreatingRole ? '创建角色并配置权限范围。' : '编辑当前角色名称、状态和权限范围。'}
                </div>
              </div>

              <button
                type="button"
                onClick={closeRoleModal}
                className="w-8 h-8 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all inline-flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-5">
              {draftError && (
                <div className="rounded-lg border border-[#991b1b] bg-[#991b1b]/20 px-3 py-2 text-[#fca5a5] text-sm">
                  {draftError}
                </div>
              )}

              <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
                <div className="text-[#f1f3f6] text-sm font-semibold mb-4">角色基础信息</div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#cbd5e1] mb-2">
                      角色名称 <span className="text-[#ff8f8f]">*</span>
                    </label>
                    <input
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      className="w-full h-10 rounded-md border border-white/[0.08] bg-[#202126] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                      placeholder="请输入角色名称"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[#cbd5e1] mb-2">角色状态</label>
                    <select
                      value={draftStatus}
                      onChange={(event) => setDraftStatus(event.target.value as RoleStatus)}
                      className="w-full h-10 rounded-md border border-white/[0.08] bg-[#202126] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                    >
                      <option value="启用">启用</option>
                      <option value="停用">停用</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="text-[#f1f3f6] text-sm font-semibold">权限配置</div>
                    <div className="text-[#64748b] text-xs mt-1">
                      选择该角色可使用的功能权限。正式系统中应由后端返回可配置权限树。
                    </div>
                  </div>

                  <div className="h-7 px-3 rounded-full border border-[#8f35b7]/35 bg-[#8f35b7]/15 text-[#d292f4] text-xs inline-flex items-center">
                    已选 {draftPermissions.length}
                  </div>
                </div>

                <div className="space-y-4">
                  {permissionGroups.map((group) => {
                    const checkedCount = group.permissions.filter((permission) =>
                      draftPermissions.includes(permission)
                    ).length;
                    const groupChecked = checkedCount === group.permissions.length;

                    return (
                      <div
                        key={group.group}
                        className="rounded-xl border border-white/[0.08] bg-[#202126] p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-[#f1f3f6] text-sm font-semibold">{group.group}</div>
                            <div className="text-[#64748b] text-xs mt-1">
                              已选 {checkedCount}/{group.permissions.length}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => togglePermissionGroup(group.permissions)}
                            className="h-7 px-2.5 rounded-md border border-[#8f35b7]/35 bg-[#8f35b7]/10 text-[#d292f4] text-xs hover:bg-[#8f35b7]/18 transition-all"
                          >
                            {groupChecked ? '取消全选' : '全选'}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {group.permissions.map((permission) => {
                            const checked = draftPermissions.includes(permission);

                            return (
                              <button
                                key={permission}
                                type="button"
                                onClick={() => togglePermission(permission)}
                                className={`h-9 rounded-md border px-3 text-sm text-left transition-all ${
                                  checked
                                    ? 'border-[#8f35b7]/45 bg-[#8f35b7]/18 text-[#d292f4]'
                                    : 'border-white/[0.08] bg-[#17181d] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04]'
                                }`}
                              >
                                {checked ? '✓ ' : ''}
                                {permission}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="h-16 px-5 border-t border-white/[0.06] bg-[#17181d] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={closeRoleModal}
                className="h-9 px-4 rounded-md border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all"
              >
                取消
              </button>

              <button
                type="button"
                onClick={saveRole}
                className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                {isCreatingRole ? '确认新增' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function OrganizationsPanel() {
  const [organizationRows, setOrganizationRows] = useState(organizations);
  const [keyword, setKeyword] = useState('');
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgModalMode, setOrgModalMode] = useState<'create' | 'edit'>('create');
  const [editingOrgName, setEditingOrgName] = useState<string | null>(null);

  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('病理中心');
  const [orgQuota, setOrgQuota] = useState('1 TB');
  const [orgStatus, setOrgStatus] = useState<CommonStatus>('正常');
  const [error, setError] = useState('');

  const filteredOrganizations = organizationRows.filter((item) => {
    if (!keyword.trim()) return true;

    const text = `${item.name} ${item.type} ${item.status}`.toLowerCase();
    return text.includes(keyword.trim().toLowerCase());
  });

  const resetForm = () => {
    setOrgName('');
    setOrgType('病理中心');
    setOrgQuota('1 TB');
    setOrgStatus('正常');
    setError('');
    setEditingOrgName(null);
  };

  const openCreateModal = () => {
    resetForm();
    setOrgModalMode('create');
    setShowOrgModal(true);
  };

  const openEditModal = (organization: (typeof organizations)[number]) => {
    setOrgModalMode('edit');
    setEditingOrgName(organization.name);
    setOrgName(organization.name);
    setOrgType(organization.type);
    setOrgQuota(organization.quota);
    setOrgStatus(organization.status);
    setError('');
    setShowOrgModal(true);
  };

  const closeModal = () => {
    resetForm();
    setShowOrgModal(false);
  };

  const validateOrgForm = () => {
    if (!orgName.trim()) {
      setError('请输入机构名称。');
      return false;
    }

    if (!orgType.trim()) {
      setError('请选择机构类型。');
      return false;
    }

    if (!orgQuota.trim()) {
      setError('请输入存储配额。');
      return false;
    }

    const duplicatedName = organizationRows.some(
      (item) =>
        item.name.trim().toLowerCase() === orgName.trim().toLowerCase() &&
        item.name !== editingOrgName
    );

    if (duplicatedName) {
      setError('该机构名称已存在，请更换机构名称。');
      return false;
    }

    return true;
  };

  const saveOrganization = () => {
    if (!validateOrgForm()) return;

    if (orgModalMode === 'create') {
      const nextOrganization = {
        name: orgName.trim(),
        type: orgType.trim(),
        userCount: 0,
        caseCount: 0,
        wsiCount: 0,
        quota: orgQuota.trim(),
        status: orgStatus,
      };

      setOrganizationRows((prev) => [nextOrganization, ...prev]);
      closeModal();
      return;
    }

    setOrganizationRows((prev) =>
      prev.map((item) =>
        item.name === editingOrgName
          ? {
              ...item,
              name: orgName.trim(),
              type: orgType.trim(),
              quota: orgQuota.trim(),
              status: orgStatus,
            }
          : item
      )
    );
    closeModal();
  };

  const toggleOrganizationStatus = (organizationName: string) => {
    setOrganizationRows((prev) =>
      prev.map((item) =>
        item.name === organizationName
          ? {
              ...item,
              status: item.status === '正常' ? '停用' : '正常',
            }
          : item
      )
    );
  };

  const deleteOrganization = (organizationName: string) => {
    setOrganizationRows((prev) => prev.filter((item) => item.name !== organizationName));
  };

  return (
    <>
      <SectionTitle
        title="机构管理"
        desc="管理医院、实验室、科研机构和企业组织。支持新增、编辑、删除，以及通过开关控制机构启用状态。"
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
          >
            <Plus size={16} />
            新增机构
          </button>
        }
      />

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="h-9 w-[320px] rounded-md border border-white/[0.08] bg-[#17181d] px-3 flex items-center gap-2">
          <Search size={15} className="text-[#64748b]" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="w-full bg-transparent outline-none text-sm text-[#cbd5e1] placeholder:text-[#64748b]"
            placeholder="搜索机构名称 / 类型 / 状态"
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="bg-[#252730] text-[#cbd5e1]">
              <th className="h-11 px-3 text-left" style={{ width: '18%' }}>机构名称</th>
              <th className="h-11 px-3 text-left" style={{ width: '13%' }}>机构类型</th>
              <th className="h-11 px-3 text-left" style={{ width: '9%' }}>用户数</th>
              <th className="h-11 px-3 text-left" style={{ width: '10%' }}>Case 数</th>
              <th className="h-11 px-3 text-left" style={{ width: '10%' }}>WSI 数</th>
              <th className="h-11 px-3 text-left" style={{ width: '14%' }}>存储配额</th>
              <th className="h-11 px-3 text-left" style={{ width: '10%' }}>状态</th>
              <th className="h-11 px-3 text-left" style={{ width: '16%' }}>操作</th>
            </tr>
          </thead>

          <tbody>
            {filteredOrganizations.map((item) => (
              <tr key={item.name} className="border-b border-white/[0.06] text-[#d1d5db] hover:bg-white/[0.025]">
                <td className="h-11 px-3">{item.name}</td>
                <td className="h-11 px-3">{item.type}</td>
                <td className="h-11 px-3">{item.userCount}</td>
                <td className="h-11 px-3">{item.caseCount}</td>
                <td className="h-11 px-3">{item.wsiCount}</td>
                <td className="h-11 px-3">{item.quota}</td>
                <td className="h-11 px-3">
                  <StatusToggle
                    checked={item.status === '正常'}
                    onClick={() => toggleOrganizationStatus(item.name)}
                    title={item.status === '正常' ? '点击停用' : '点击启用'}
                  />
                </td>
                <td className="h-11 px-3">
                  <div className="flex items-center gap-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="text-[#d292f4] hover:text-[#f0b7ff]"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteOrganization(item.name)}
                      className="text-[#fca5a5] hover:text-[#fecaca]"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrganizations.length === 0 && (
          <div className="h-[220px] flex flex-col items-center justify-center text-center text-[#64748b]">
            <Building2 size={42} className="mb-3 opacity-60" />
            <div className="text-[#94a3b8] text-sm">暂无匹配机构</div>
            <div className="text-[#64748b] text-xs mt-1">请调整搜索关键词。</div>
          </div>
        )}
      </div>

      {showOrgModal && (
        <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-[720px] rounded-2xl border border-white/[0.08] bg-[#202126] shadow-[0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="h-16 px-6 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-[#f1f3f6] text-lg font-bold">
                  {orgModalMode === 'create' ? '新增机构' : '编辑机构'}
                </div>
                <div className="text-[#64748b] text-xs mt-1">
                  {orgModalMode === 'create'
                    ? '创建机构基础信息，Case 数与 WSI 数由平台数据自动统计。'
                    : '编辑机构基础信息，用户数、Case 数与 WSI 数由平台数据自动统计。'}
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all inline-flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="rounded-lg border border-[#991b1b] bg-[#991b1b]/20 px-3 py-2 text-[#fca5a5] text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">
                    机构名称 <span className="text-[#ff8f8f]">*</span>
                  </label>
                  <input
                    value={orgName}
                    onChange={(event) => setOrgName(event.target.value)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                    placeholder="请输入机构名称"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">
                    机构类型 <span className="text-[#ff8f8f]">*</span>
                  </label>
                  <select
                    value={orgType}
                    onChange={(event) => setOrgType(event.target.value)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  >
                    <option value="病理中心">病理中心</option>
                    <option value="医院">医院</option>
                    <option value="科研机构">科研机构</option>
                    <option value="实验室">实验室</option>
                    <option value="企业">企业</option>
                    <option value="其他">其他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">
                    存储配额 <span className="text-[#ff8f8f]">*</span>
                  </label>
                  <input
                    value={orgQuota}
                    onChange={(event) => setOrgQuota(event.target.value)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                    placeholder="例如：1 TB / 5 TB / 500 GB"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">状态</label>
                  <select
                    value={orgStatus}
                    onChange={(event) => setOrgStatus(event.target.value as CommonStatus)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  >
                    <option value="正常">正常</option>
                    <option value="停用">停用</option>
                    <option value="异常">异常</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-4">
                <div className="text-[#d292f4] text-sm font-semibold mb-1">机构配置说明</div>
                <div className="text-[#94a3b8] text-xs leading-6">
                  Case 数、WSI 数与用户数应由平台根据该机构下已有数据自动统计，不应在新增或编辑机构时手动输入。正式系统中应接入机构编码、管理员绑定、存储配额校验和机构级数据权限。
                </div>
              </div>
            </div>

            <div className="h-16 px-6 border-t border-white/[0.06] bg-[#17181d] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="h-9 px-4 rounded-md border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all"
              >
                取消
              </button>

              <button
                type="button"
                onClick={saveOrganization}
                className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                {orgModalMode === 'create' ? '确定新增' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



function ModelStatusBadge({ status }: { status: AdminModelStatus }) {
  const className =
    status === '启用'
      ? 'border-[#3f6212] bg-[#3f6212]/35 text-[#84cc16]'
      : 'border-white/[0.08] bg-white/[0.05] text-[#94a3b8]';

  return (
    <span className={`h-6 px-2 rounded border text-xs inline-flex items-center ${className}`}>
      {status}
    </span>
  );
}

function ModelVisibilityBadge({ visibility }: { visibility: AdminModelVisibility }) {
  const className =
    visibility === '公开'
      ? 'border-[#8f35b7]/40 bg-[#8f35b7]/20 text-[#d292f4]'
      : 'border-white/[0.08] bg-white/[0.05] text-[#94a3b8]';

  return (
    <span className={`h-6 px-2 rounded border text-xs inline-flex items-center ${className}`}>
      {visibility}
    </span>
  );
}

function ModelManagementPanel() {
  const [models, setModels] = useState<AdminModelRow[]>(initialAdminModels);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'全部' | AdminModelStatus>('全部');
  const [visibilityFilter, setVisibilityFilter] = useState<'全部' | AdminModelVisibility>('全部');

  const filteredModels = models.filter((model) => {
    const keywordMatched = keyword.trim()
      ? `${model.name} ${model.owner} ${model.organization} ${model.modelType}`.toLowerCase().includes(keyword.trim().toLowerCase())
      : true;

    const statusMatched = statusFilter === '全部' || model.status === statusFilter;
    const visibilityMatched = visibilityFilter === '全部' || model.visibility === visibilityFilter;

    return keywordMatched && statusMatched && visibilityMatched;
  });

  const updateModelStatus = (id: string, status: AdminModelStatus) => {
    setModels((prev) =>
      prev.map((model) =>
        model.id === id
          ? {
              ...model,
              status,
              updatedAt: '2026-05-20',
            }
          : model
      )
    );
  };

  const updateModelVisibility = (id: string, visibility: AdminModelVisibility) => {
    setModels((prev) =>
      prev.map((model) =>
        model.id === id
          ? {
              ...model,
              visibility,
              updatedAt: '2026-05-20',
            }
          : model
      )
    );
  };

  const deleteModel = (id: string) => {
    setModels((prev) => prev.filter((model) => model.id !== id));
  };

  const createMockModel = () => {
    const nextIndex = models.length + 1;

    const nextModel: AdminModelRow = {
      id: `model-${Date.now()}`,
      name: `New Pathology Model ${String(nextIndex).padStart(2, '0')}`,
      owner: 'Admin',
      organization: 'HuggingPath',
      modelType: '病理 AI 分析',
      version: 'v0.1.0',
      status: '启用',
      visibility: '隐藏',
      runCount: 0,
      updatedAt: '2026-05-20',
    };

    setModels((prev) => [nextModel, ...prev]);
  };

  return (
    <>
      <SectionTitle
        title="模型管理"
        desc="后台统一管理平台内模型资源，包括启用状态、公开展示、编辑和删除等操作。"
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">模型总数</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">{models.length}</div>
          <div className="text-[#64748b] text-xs mt-2">平台模型与用户模型合计。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">公开模型</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">
            {models.filter((item) => item.visibility === '公开').length}
          </div>
          <div className="text-[#64748b] text-xs mt-2">会展示到模型中心。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">停用模型</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">
            {models.filter((item) => item.status === '停用').length}
          </div>
          <div className="text-[#64748b] text-xs mt-2">停用后不可被运行。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">累计运行</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">
            {models.reduce((total, item) => total + item.runCount, 0).toLocaleString()}
          </div>
          <div className="text-[#64748b] text-xs mt-2">所有模型累计调用次数。</div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-[320px] rounded-md border border-white/[0.08] bg-[#17181d] px-3 flex items-center gap-2">
            <Search size={15} className="text-[#64748b]" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="w-full bg-transparent outline-none text-sm text-[#cbd5e1] placeholder:text-[#64748b]"
              placeholder="搜索模型名 / 创建人 / 机构 / 类型"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as '全部' | AdminModelStatus)}
            className="h-9 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#cbd5e1] outline-none focus:border-[#8f35b7]"
          >
            <option value="全部">全部状态</option>
            <option value="启用">启用</option>
            <option value="停用">停用</option>
          </select>

          <select
            value={visibilityFilter}
            onChange={(event) => setVisibilityFilter(event.target.value as '全部' | AdminModelVisibility)}
            className="h-9 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#cbd5e1] outline-none focus:border-[#8f35b7]"
          >
            <option value="全部">全部可见性</option>
            <option value="公开">公开</option>
            <option value="隐藏">隐藏</option>
          </select>
        </div>

        <button
          type="button"
          onClick={createMockModel}
          className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
        >
          <Plus size={16} />
          新增模型
        </button>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="bg-[#252730] text-[#cbd5e1]">
              <th className="h-11 px-3 text-left" style={{ width: '14%' }}>模型名称</th>
              <th className="h-11 px-3 text-left" style={{ width: '10%' }}>创建人</th>
              <th className="h-11 px-3 text-left" style={{ width: '13%' }}>所属机构</th>
              <th className="h-11 px-3 text-left" style={{ width: '15%' }}>模型类型</th>
              <th className="h-11 px-3 text-left" style={{ width: '8%' }}>版本</th>
              <th className="h-11 px-3 text-left" style={{ width: '9%' }}>状态</th>
              <th className="h-11 px-3 text-left" style={{ width: '9%' }}>可见性</th>
              <th className="h-11 px-3 text-left" style={{ width: '8%' }}>运行次数</th>
              <th className="h-11 px-3 text-left" style={{ width: '14%' }}>操作</th>
            </tr>
          </thead>

          <tbody>
            {filteredModels.map((model) => (
              <tr key={model.id} className="border-b border-white/[0.06] text-[#d1d5db] hover:bg-white/[0.025]">
                <td className="h-12 px-3 text-[#e2e8f0] font-medium">{model.name}</td>
                <td className="h-12 px-3">{model.owner}</td>
                <td className="h-12 px-3">{model.organization}</td>
                <td className="h-12 px-3">{model.modelType}</td>
                <td className="h-12 px-3 font-mono">{model.version}</td>
                <td className="h-12 px-3">
                  <StatusToggle
                    checked={model.status === '启用'}
                    onClick={() => updateModelStatus(model.id, model.status === '启用' ? '停用' : '启用')}
                    title={model.status === '启用' ? '点击停用' : '点击启用'}
                  />
                </td>
                <td className="h-12 px-3"><ModelVisibilityBadge visibility={model.visibility} /></td>
                <td className="h-12 px-3">{model.runCount.toLocaleString()}</td>
                <td className="h-12 px-3">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => updateModelVisibility(model.id, model.visibility === '公开' ? '隐藏' : '公开')}
                      className={model.visibility === '公开' ? 'text-[#94a3b8] hover:text-[#e2e8f0]' : 'text-[#d292f4] hover:text-[#f0b7ff]'}
                    >
                      {model.visibility === '公开' ? '隐藏' : '公开'}
                    </button>

                    <button
                      type="button"
                      className="text-[#d292f4] hover:text-[#f0b7ff]"
                    >
                      编辑
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteModel(model.id)}
                      className="text-[#fca5a5] hover:text-[#fecaca]"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredModels.length === 0 && (
          <div className="h-[220px] flex flex-col items-center justify-center text-center text-[#64748b]">
            <Brain size={42} className="mb-3 opacity-60" />
            <div className="text-[#94a3b8] text-sm">暂无匹配模型</div>
            <div className="text-[#64748b] text-xs mt-1">请调整搜索条件。</div>
          </div>
        )}
      </div>
    </>
  );
}

function BasicSettingsPanel() {
  const [guestAnalysisLimit, setGuestAnalysisLimit] = useState('3');
  const [maxWsiSize, setMaxWsiSize] = useState('5');
  const [supportedFormats, setSupportedFormats] = useState('svs, sdpc, dcm, tiff');
  const [storageWarning, setStorageWarning] = useState('80');
  const [saveResult, setSaveResult] = useState('');

  const saveBasicSettings = () => {
    if (!guestAnalysisLimit.trim() || Number(guestAnalysisLimit) < 0) {
      setSaveResult('游客分析次数必须为大于等于 0 的数字。');
      return;
    }

    if (!maxWsiSize.trim() || Number(maxWsiSize) <= 0) {
      setSaveResult('单个 WSI 上传大小限制必须为大于 0 的数字。');
      return;
    }

    if (!storageWarning.trim() || Number(storageWarning) <= 0 || Number(storageWarning) > 100) {
      setSaveResult('存储预警阈值必须为 1-100 之间的数字。');
      return;
    }

    setSaveResult('基础设置已模拟保存。当前为前端原型，未真实写入后台配置。');
  };

  return (
    <>
      <SectionTitle
        title="基础设置"
        desc="配置平台通用规则，包括游客分析次数、上传限制、支持格式和存储预警等。"
      />

      <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
        <div className="h-14 px-5 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="text-[#f1f3f6] text-base font-semibold">平台基础配置</div>
            <div className="text-[#64748b] text-xs mt-0.5">
              当前为前端原型，保存动作只做页面反馈。
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#cbd5e1] mb-2">
                游客分析次数 <span className="text-[#ff8f8f]">*</span>
              </label>
              <input
                value={guestAnalysisLimit}
                onChange={(event) => setGuestAnalysisLimit(event.target.value)}
                className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                type="number"
                min={0}
              />
            </div>

            <div>
              <label className="block text-sm text-[#cbd5e1] mb-2">
                单个 WSI 上传大小限制（GB） <span className="text-[#ff8f8f]">*</span>
              </label>
              <input
                value={maxWsiSize}
                onChange={(event) => setMaxWsiSize(event.target.value)}
                className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                type="number"
                min={1}
              />
            </div>

            <div>
              <label className="block text-sm text-[#cbd5e1] mb-2">支持文件格式</label>
              <input
                value={supportedFormats}
                onChange={(event) => setSupportedFormats(event.target.value)}
                className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                placeholder="svs, sdpc, dcm, tiff"
              />
            </div>

            <div>
              <label className="block text-sm text-[#cbd5e1] mb-2">
                存储预警阈值（%）
              </label>
              <input
                value={storageWarning}
                onChange={(event) => setStorageWarning(event.target.value)}
                className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                type="number"
                min={1}
                max={100}
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-4">
            <div className="text-[#d292f4] text-sm font-semibold mb-1">基础设置说明</div>
            <div className="text-[#94a3b8] text-xs leading-6">
              基础设置用于控制平台级通用规则。正式系统中应结合租户、机构、用户角色和部署环境区分默认值与覆盖值。
            </div>
          </div>

          {saveResult && (
            <div className="rounded-lg border border-white/[0.08] bg-[#17181d] px-3 py-2 text-[#cbd5e1] text-sm">
              {saveResult}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={saveBasicSettings}
              className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all"
            >
              保存基础设置
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function SmtpSettingsPanel() {
  const [smtpEnabled, setSmtpEnabled] = useState(true);
  const [smtpHost, setSmtpHost] = useState('smtp.example.com');
  const [smtpPort, setSmtpPort] = useState('465');
  const [encryption, setEncryption] = useState('SSL');
  const [senderEmail, setSenderEmail] = useState('noreply@huggingpath.com');
  const [senderName, setSenderName] = useState('HuggingPath');
  const [authAccount, setAuthAccount] = useState('noreply@huggingpath.com');
  const [authPassword, setAuthPassword] = useState('••••••••••••');
  const [testEmail, setTestEmail] = useState('admin@example.com');
  const [testResult, setTestResult] = useState('');

  const sendTestEmail = () => {
    if (!smtpHost.trim() || !smtpPort.trim() || !senderEmail.trim() || !authAccount.trim()) {
      setTestResult('请先补全 SMTP Host、端口、发件邮箱和认证账号。');
      return;
    }

    if (!testEmail.includes('@')) {
      setTestResult('测试收件人邮箱格式不正确。');
      return;
    }

    setTestResult('测试邮件已模拟发送。当前为前端原型，未真实调用邮件服务。');
  };

  return (
    <>
      <SectionTitle
        title="SMTP 设置"
        desc="配置平台级 SMTP 邮件服务，用于账号通知、任务状态和系统告警等消息发送。"
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">SMTP 状态</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">{smtpEnabled ? '开启' : '关闭'}</div>
          <div className="text-[#64748b] text-xs mt-2">控制平台是否发送系统邮件。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">邮件服务器</div>
          <div className="text-[#f1f3f6] text-lg font-bold truncate">{smtpHost}</div>
          <div className="text-[#64748b] text-xs mt-2">当前 SMTP Host。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">端口 / 加密</div>
          <div className="text-[#f1f3f6] text-lg font-bold">{smtpPort} · {encryption}</div>
          <div className="text-[#64748b] text-xs mt-2">需与邮件服务商配置一致。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">发件邮箱</div>
          <div className="text-[#f1f3f6] text-lg font-bold truncate">{senderEmail}</div>
          <div className="text-[#64748b] text-xs mt-2">用于系统通知邮件。</div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_0.8fr] gap-4">
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
          <div className="h-14 px-5 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[#f1f3f6] text-base font-semibold">SMTP 配置</div>
              <div className="text-[#64748b] text-xs mt-0.5">
                配置后可用于账号邀请、密码重置、模型审核结果、分析任务完成提醒等邮件通知。
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSmtpEnabled((prev) => !prev)}
              className={`h-8 px-3 rounded-md border text-xs transition-all ${
                smtpEnabled
                  ? 'border-[#3f6212] bg-[#3f6212]/35 text-[#84cc16]'
                  : 'border-white/[0.08] bg-white/[0.05] text-[#94a3b8]'
              }`}
            >
              {smtpEnabled ? '已开启' : '已关闭'}
            </button>
          </div>

          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#cbd5e1] mb-2">
                  SMTP Host <span className="text-[#ff8f8f]">*</span>
                </label>
                <input
                  value={smtpHost}
                  onChange={(event) => setSmtpHost(event.target.value)}
                  className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  placeholder="smtp.example.com"
                />
              </div>

              <div>
                <label className="block text-sm text-[#cbd5e1] mb-2">
                  SMTP Port <span className="text-[#ff8f8f]">*</span>
                </label>
                <input
                  value={smtpPort}
                  onChange={(event) => setSmtpPort(event.target.value)}
                  className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  placeholder="465 / 587"
                />
              </div>

              <div>
                <label className="block text-sm text-[#cbd5e1] mb-2">加密方式</label>
                <select
                  value={encryption}
                  onChange={(event) => setEncryption(event.target.value)}
                  className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                >
                  <option value="SSL">SSL</option>
                  <option value="TLS">TLS</option>
                  <option value="None">None</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#cbd5e1] mb-2">
                  发件人名称
                </label>
                <input
                  value={senderName}
                  onChange={(event) => setSenderName(event.target.value)}
                  className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  placeholder="HuggingPath"
                />
              </div>

              <div>
                <label className="block text-sm text-[#cbd5e1] mb-2">
                  发件邮箱 <span className="text-[#ff8f8f]">*</span>
                </label>
                <input
                  value={senderEmail}
                  onChange={(event) => setSenderEmail(event.target.value)}
                  className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  placeholder="noreply@example.com"
                />
              </div>

              <div>
                <label className="block text-sm text-[#cbd5e1] mb-2">
                  认证账号 <span className="text-[#ff8f8f]">*</span>
                </label>
                <input
                  value={authAccount}
                  onChange={(event) => setAuthAccount(event.target.value)}
                  className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  placeholder="SMTP 登录账号"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm text-[#cbd5e1] mb-2">
                  认证密码 / 授权码
                </label>
                <input
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  placeholder="请输入 SMTP 授权码或密码"
                  type="text"
                />
                <div className="text-[#64748b] text-xs mt-1">
                  正式系统中应做密文存储，前端不应回显真实密码。
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-4">
              <div className="text-[#d292f4] text-sm font-semibold mb-1">SMTP 使用场景</div>
              <div className="text-[#94a3b8] text-xs leading-6">
                可用于用户注册邀请、密码重置、模型审核通过/驳回通知、AI 分析任务完成提醒、失败任务告警与平台运维通知。
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-5">
            <div className="text-[#f1f3f6] text-base font-semibold mb-1">测试邮件</div>
            <div className="text-[#64748b] text-xs mb-5">
              用于验证 SMTP 配置是否可用，当前仅做前端模拟。
            </div>

            <label className="block text-sm text-[#cbd5e1] mb-2">测试收件人</label>
            <input
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
              className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
              placeholder="admin@example.com"
            />

            <button
              type="button"
              onClick={sendTestEmail}
              className="mt-4 h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all"
            >
              发送测试邮件
            </button>

            {testResult && (
              <div className="mt-4 rounded-lg border border-white/[0.08] bg-[#17181d] px-3 py-2 text-[#cbd5e1] text-sm">
                {testResult}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
            <div className="h-12 px-5 border-b border-white/[0.06] flex items-center">
              <div className="text-[#f1f3f6] text-base font-semibold">配置摘要</div>
            </div>

            {settingsRows.map((item) => (
              <div
                key={item.name}
                className="px-5 py-4 border-b border-white/[0.06] last:border-0 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="text-[#f1f3f6] text-sm font-semibold">{item.name}</div>
                  <div className="text-[#64748b] text-xs mt-1 line-clamp-1">{item.desc}</div>
                </div>

                <div className="h-8 max-w-[190px] px-3 rounded-md border border-white/[0.08] bg-[#17181d] text-[#e2e8f0] text-sm flex items-center truncate shrink-0">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminConsole() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPanel />;
      case 'users':
        return <UsersPanel />;
      case 'roles':
        return <RolesPanel />;
      case 'organizations':
        return <OrganizationsPanel />;
      case 'models':
        return <ModelManagementPanel />;
      case 'settings-basic':
        return <BasicSettingsPanel />;
      case 'settings-smtp':
        return <SmtpSettingsPanel />;
      default:
        return <OverviewPanel />;
    }
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#0f1014] text-[#f1f3f6] flex">
      <aside
        className={`shrink-0 border-r border-white/[0.08] bg-[#17181d] px-3 py-4 transition-all duration-200 ${
          sidebarCollapsed ? 'w-[76px]' : 'w-[240px]'
        }`}
      >
        <div className={`mb-5 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between px-3'}`}>
          {!sidebarCollapsed && (
            <div>
              <div className="text-[#f8fafc] text-lg font-bold">后台管理</div>
              <div className="text-[#64748b] text-xs mt-1">Admin Console</div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="w-9 h-9 rounded-lg border border-white/[0.08] bg-[#202126] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all inline-flex items-center justify-center"
            title={sidebarCollapsed ? '展开菜单' : '收起菜单'}
          >
            {sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
        </div>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const isParentActive =
              hasChildren && item.children?.some((child) => child.key === activeTab);
            const isActive = !hasChildren && item.key === activeTab;

            if (hasChildren) {
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => {
                      if (sidebarCollapsed) {
                        const firstChild = item.children?.[0]?.key;
                        if (firstChild) setActiveTab(firstChild);
                        return;
                      }

                      setSettingsExpanded((prev) => !prev);
                    }}
                    className={`w-full h-10 rounded-lg px-3 flex items-center gap-3 text-sm border transition-all ${
                      isParentActive
                        ? 'bg-[#8f35b7]/12 text-[#d292f4] border-[#8f35b7]/25'
                        : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04] border-transparent'
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          size={15}
                          className={`transition-transform ${settingsExpanded ? 'rotate-180' : ''}`}
                        />
                      </>
                    )}
                  </button>

                  {!sidebarCollapsed && settingsExpanded && (
                    <div className="ml-6 mt-1 space-y-1 border-l border-white/[0.08] pl-3">
                      {item.children?.map((child) => {
                        const childActive = activeTab === child.key;

                        return (
                          <button
                            key={child.key}
                            type="button"
                            onClick={() => setActiveTab(child.key)}
                            className={`w-full h-8 rounded-md px-3 flex items-center text-left text-xs transition-all ${
                              childActive
                                ? 'bg-[#8f35b7]/20 text-[#d292f4] border border-[#8f35b7]/35'
                                : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04] border border-transparent'
                            }`}
                          >
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => item.key && setActiveTab(item.key)}
                className={`w-full h-10 rounded-lg px-3 flex items-center gap-3 text-sm transition-all ${
                  isActive
                    ? 'bg-[#8f35b7]/20 text-[#d292f4] border border-[#8f35b7]/35'
                    : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04] border border-transparent'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {!sidebarCollapsed && (
          <div className="mt-6 rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-3">
            <div className="text-[#d292f4] text-xs font-semibold mb-1">权限说明</div>
            <div className="text-[#94a3b8] text-xs leading-5">
              当前为后台管理原型页面，暂不接真实权限与接口。
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 min-w-0 px-6 py-5 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
