import { useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'roles' | 'organizations' | 'settings-basic' | 'settings-smtp';

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
  return (
    <>
      <SectionTitle
        title="后台总览"
        desc="用于查看平台运行状态、资源规模、异常任务和待审核内容。"
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        {overviewStats.map((item) => (
          <div key={item.label} className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
            <div className="text-[#64748b] text-sm mb-3">{item.label}</div>
            <div className="text-[#f1f3f6] text-2xl font-bold">{item.value}</div>
            <div className="text-[#64748b] text-xs mt-2">{item.desc}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-[#f59e0b]" />
            <div className="text-[#f1f3f6] font-semibold">最近异常任务</div>
          </div>

          <div className="space-y-3">
            {[
              ['TASK-20260520-003', '模型权重文件不存在', '异常'],
              ['TASK-20260520-006', 'WSI 文件读取异常', '异常'],
              ['TASK-20260519-011', '推理超时', '异常'],
            ].map(([id, reason, status]) => (
              <div key={id} className="rounded-lg border border-white/[0.06] bg-[#17181d] p-3 flex items-center justify-between">
                <div>
                  <div className="text-[#e2e8f0] text-sm font-mono">{id}</div>
                  <div className="text-[#64748b] text-xs mt-1">{reason}</div>
                </div>
                <StatusBadge status={status as CommonStatus} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-[#d292f4]" />
            <div className="text-[#f1f3f6] font-semibold">待审核模型</div>
          </div>

          <div className="space-y-3">
            {modelReviews
              .filter((item) => item.status === '待审核')
              .map((item) => (
                <div key={item.name} className="rounded-lg border border-white/[0.06] bg-[#17181d] p-3 flex items-center justify-between">
                  <div>
                    <div className="text-[#e2e8f0] text-sm font-semibold">{item.name}</div>
                    <div className="text-[#64748b] text-xs mt-1">
                      {item.submitter} · {item.organization}
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
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

        <div className="text-[#64748b] text-xs">
          当前共 {users.length} 个用户，筛选结果 {filteredUsers.length} 条
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
                <td className="h-11 px-3"><StatusBadge status={item.status} /></td>
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
  const [draftDescription, setDraftDescription] = useState('');
  const [draftStatus, setDraftStatus] = useState<RoleStatus>('启用');
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);
  const [draftError, setDraftError] = useState('');

  const filteredRoles = roles.filter((role) => {
    if (!keyword.trim()) return true;

    const text = `${role.name} ${role.type} ${role.description} ${role.status}`.toLowerCase();
    return text.includes(keyword.trim().toLowerCase());
  });

  const openCreateRole = () => {
    setIsCreatingRole(true);
    setEditingRole(null);
    setDraftName('');
    setDraftDescription('');
    setDraftStatus('启用');
    setDraftPermissions([]);
    setDraftError('');
  };

  const openEditRole = (role: RoleRow) => {
    setIsCreatingRole(false);
    setEditingRole(role);
    setDraftName(role.name);
    setDraftDescription(role.description);
    setDraftStatus(role.status);
    setDraftPermissions(role.permissions);
    setDraftError('');
  };

  const closeRoleDrawer = () => {
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

    if (!draftDescription.trim()) {
      setDraftError('请输入角色说明。');
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
        description: draftDescription.trim(),
        userCount: 0,
        status: draftStatus,
        updatedAt: '2026-05-20',
        permissions: draftPermissions,
      };

      setRoles((prev) => [nextRole, ...prev]);
      closeRoleDrawer();
      return;
    }

    if (editingRole) {
      setRoles((prev) =>
        prev.map((role) =>
          role.id === editingRole.id
            ? {
                ...role,
                name: draftName.trim(),
                description: draftDescription.trim(),
                status: draftStatus,
                updatedAt: '2026-05-20',
                permissions: draftPermissions,
              }
            : role
        )
      );
      closeRoleDrawer();
    }
  };

  const activeDrawerRoleType: RoleType = isCreatingRole ? '自定义' : editingRole?.type || '自定义';
  const canEditName = isCreatingRole || activeDrawerRoleType === '自定义';
  const drawerOpen = isCreatingRole || Boolean(editingRole);

  return (
    <>
      <SectionTitle
        title="角色管理"
        desc="管理平台角色与权限模板。角色管理作为独立后台菜单，权限配置在点击编辑后进入抽屉完成。"
        action={
          <button
            type="button"
            onClick={openCreateRole}
            className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
          >
            <Plus size={16} />
            新增角色
          </button>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">角色总数</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">{roles.length}</div>
          <div className="text-[#64748b] text-xs mt-2">系统角色与自定义角色合计。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">系统内置角色</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">
            {roles.filter((item) => item.type === '系统内置').length}
          </div>
          <div className="text-[#64748b] text-xs mt-2">不可删除，仅建议调整启用状态。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">自定义角色</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">
            {roles.filter((item) => item.type === '自定义').length}
          </div>
          <div className="text-[#64748b] text-xs mt-2">用于细化机构或平台权限。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">停用角色</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">
            {roles.filter((item) => item.status === '停用').length}
          </div>
          <div className="text-[#64748b] text-xs mt-2">停用后不可继续分配给用户。</div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="h-9 w-[320px] rounded-md border border-white/[0.08] bg-[#17181d] px-3 flex items-center gap-2">
          <Search size={15} className="text-[#64748b]" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="w-full bg-transparent outline-none text-sm text-[#cbd5e1] placeholder:text-[#64748b]"
            placeholder="搜索角色名称 / 类型 / 状态"
          />
        </div>

        <div className="text-[#64748b] text-xs">
          当前共 {roles.length} 个角色，筛选结果 {filteredRoles.length} 条
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="bg-[#252730] text-[#cbd5e1]">
              <th className="h-11 px-3 text-left" style={{ width: '16%' }}>角色名称</th>
              <th className="h-11 px-3 text-left" style={{ width: '10%' }}>类型</th>
              <th className="h-11 px-3 text-left" style={{ width: '30%' }}>说明</th>
              <th className="h-11 px-3 text-left" style={{ width: '10%' }}>用户数</th>
              <th className="h-11 px-3 text-left" style={{ width: '10%' }}>权限数</th>
              <th className="h-11 px-3 text-left" style={{ width: '10%' }}>状态</th>
              <th className="h-11 px-3 text-left" style={{ width: '8%' }}>更新时间</th>
              <th className="h-11 px-3 text-left" style={{ width: '6%' }}>操作</th>
            </tr>
          </thead>

          <tbody>
            {filteredRoles.map((role) => (
              <tr
                key={role.id}
                className="border-b border-white/[0.06] text-[#d1d5db] hover:bg-white/[0.025]"
              >
                <td className="h-12 px-3 text-[#e2e8f0] font-medium">{role.name}</td>
                <td className="h-12 px-3">
                  <span
                    className={`h-6 px-2 rounded border text-xs inline-flex items-center ${
                      role.type === '系统内置'
                        ? 'border-[#8f35b7]/35 bg-[#8f35b7]/15 text-[#d292f4]'
                        : 'border-white/[0.08] bg-white/[0.05] text-[#94a3b8]'
                    }`}
                  >
                    {role.type}
                  </span>
                </td>
                <td className="h-12 px-3 text-[#94a3b8] truncate">{role.description}</td>
                <td className="h-12 px-3">{role.userCount}</td>
                <td className="h-12 px-3">{role.permissions.length}</td>
                <td className="h-12 px-3"><RoleStatusBadge status={role.status} /></td>
                <td className="h-12 px-3">{role.updatedAt}</td>
                <td className="h-12 px-3">
                  <button
                    type="button"
                    onClick={() => openEditRole(role)}
                    className="text-[#d292f4] hover:text-[#f0b7ff]"
                  >
                    编辑
                  </button>
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

      {drawerOpen && (
        <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="h-full w-[680px] border-l border-white/[0.08] bg-[#202126] shadow-[0_0_60px_rgba(0,0,0,0.45)] flex flex-col">
            <div className="h-16 px-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div>
                <div className="text-[#f1f3f6] text-lg font-bold">
                  {isCreatingRole ? '新增角色' : '编辑角色权限'}
                </div>
                <div className="text-[#64748b] text-xs mt-1">
                  {isCreatingRole ? '创建自定义角色，并配置权限范围。' : '调整当前角色的权限范围。'}
                </div>
              </div>

              <button
                type="button"
                onClick={closeRoleDrawer}
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

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#cbd5e1] mb-2">
                      角色名称 <span className="text-[#ff8f8f]">*</span>
                    </label>
                    <input
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      disabled={!canEditName}
                      className={`w-full h-10 rounded-md border border-white/[0.08] bg-[#202126] px-3 text-sm outline-none focus:border-[#8f35b7] ${
                        canEditName ? 'text-[#e2e8f0]' : 'text-[#64748b] cursor-not-allowed'
                      }`}
                      placeholder="请输入角色名称"
                    />
                    {!canEditName && (
                      <div className="text-[#64748b] text-xs mt-1">
                        系统内置角色名称不可修改。
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-[#cbd5e1] mb-2">
                      角色说明 <span className="text-[#ff8f8f]">*</span>
                    </label>
                    <textarea
                      value={draftDescription}
                      onChange={(event) => setDraftDescription(event.target.value)}
                      className="w-full min-h-[88px] rounded-md border border-white/[0.08] bg-[#202126] px-3 py-2 text-sm leading-6 text-[#e2e8f0] outline-none focus:border-[#8f35b7] resize-none"
                      placeholder="请输入角色说明"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-[#cbd5e1] mb-2">角色类型</div>
                      <div className="h-10 px-3 rounded-md border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm flex items-center">
                        {activeDrawerRoleType}
                      </div>
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
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="text-[#f1f3f6] text-sm font-semibold">权限配置</div>
                    <div className="text-[#64748b] text-xs mt-1">
                      选择该角色可使用的功能权限。当前为前端演示，不做真实鉴权。
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

              <div className="rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-4">
                <div className="text-[#d292f4] text-sm font-semibold mb-1">权限配置说明</div>
                <div className="text-[#94a3b8] text-xs leading-6">
                  当前页面只用于展示后台角色与权限配置方式。正式系统中，权限应由后端统一返回，并在菜单、按钮、数据范围和接口层进行统一控制。
                </div>
              </div>
            </div>

            <div className="h-16 px-5 border-t border-white/[0.06] bg-[#17181d] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={closeRoleDrawer}
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
                保存
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
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState('病理中心');
  const [newOrgUserCount, setNewOrgUserCount] = useState('0');
  const [newOrgQuota, setNewOrgQuota] = useState('1 TB');
  const [newOrgStatus, setNewOrgStatus] = useState<CommonStatus>('正常');
  const [error, setError] = useState('');

  const filteredOrganizations = organizationRows.filter((item) => {
    if (!keyword.trim()) return true;

    const text = `${item.name} ${item.type} ${item.status}`.toLowerCase();
    return text.includes(keyword.trim().toLowerCase());
  });

  const resetForm = () => {
    setNewOrgName('');
    setNewOrgType('病理中心');
    setNewOrgUserCount('0');
    setNewOrgQuota('1 TB');
    setNewOrgStatus('正常');
    setError('');
  };

  const closeModal = () => {
    resetForm();
    setShowCreateModal(false);
  };

  const parseCount = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return Math.floor(parsed);
  };

  const createOrganization = () => {
    if (!newOrgName.trim()) {
      setError('请输入机构名称。');
      return;
    }

    const duplicatedName = organizationRows.some(
      (item) => item.name.trim().toLowerCase() === newOrgName.trim().toLowerCase()
    );

    if (duplicatedName) {
      setError('该机构名称已存在，请更换机构名称。');
      return;
    }

    if (!newOrgType.trim()) {
      setError('请输入机构类型。');
      return;
    }

    if (!newOrgQuota.trim()) {
      setError('请输入存储配额。');
      return;
    }

    const userCount = parseCount(newOrgUserCount);

    if (userCount === null) {
      setError('用户数必须为大于等于 0 的数字。');
      return;
    }

    const nextOrganization = {
      name: newOrgName.trim(),
      type: newOrgType.trim(),
      userCount,
      caseCount: 0,
      wsiCount: 0,
      quota: newOrgQuota.trim(),
      status: newOrgStatus,
    };

    setOrganizationRows((prev) => [nextOrganization, ...prev]);
    closeModal();
  };

  return (
    <>
      <SectionTitle
        title="机构管理"
        desc="管理医院、实验室、科研机构和企业组织。"
        action={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
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

        <div className="text-[#64748b] text-xs">
          当前共 {organizationRows.length} 个机构，筛选结果 {filteredOrganizations.length} 条
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="bg-[#252730] text-[#cbd5e1]">
              <th className="h-11 px-3 text-left">机构名称</th>
              <th className="h-11 px-3 text-left">机构类型</th>
              <th className="h-11 px-3 text-left">用户数</th>
              <th className="h-11 px-3 text-left">Case 数</th>
              <th className="h-11 px-3 text-left">WSI 数</th>
              <th className="h-11 px-3 text-left">存储配额</th>
              <th className="h-11 px-3 text-left">状态</th>
              <th className="h-11 px-3 text-left">操作</th>
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
                <td className="h-11 px-3"><StatusBadge status={item.status} /></td>
                <td className="h-11 px-3">
                  <button className="text-[#d292f4] hover:text-[#f0b7ff]">配置</button>
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

      {showCreateModal && (
        <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-[720px] rounded-2xl border border-white/[0.08] bg-[#202126] shadow-[0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="h-16 px-6 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-[#f1f3f6] text-lg font-bold">新增机构</div>
                <div className="text-[#64748b] text-xs mt-1">
                  创建机构基础信息，Case 数与 WSI 数由平台数据自动统计。
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
                    value={newOrgName}
                    onChange={(event) => setNewOrgName(event.target.value)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                    placeholder="请输入机构名称"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">
                    机构类型 <span className="text-[#ff8f8f]">*</span>
                  </label>
                  <select
                    value={newOrgType}
                    onChange={(event) => setNewOrgType(event.target.value)}
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
                  <label className="block text-sm text-[#cbd5e1] mb-2">用户数</label>
                  <input
                    value={newOrgUserCount}
                    onChange={(event) => setNewOrgUserCount(event.target.value)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                    placeholder="默认 0"
                    type="number"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">
                    存储配额 <span className="text-[#ff8f8f]">*</span>
                  </label>
                  <input
                    value={newOrgQuota}
                    onChange={(event) => setNewOrgQuota(event.target.value)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                    placeholder="例如：1 TB / 5 TB / 500 GB"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#cbd5e1] mb-2">状态</label>
                  <select
                    value={newOrgStatus}
                    onChange={(event) => setNewOrgStatus(event.target.value as CommonStatus)}
                    className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                  >
                    <option value="正常">正常</option>
                    <option value="停用">停用</option>
                    <option value="异常">异常</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-4">
                <div className="text-[#d292f4] text-sm font-semibold mb-1">新增规则说明</div>
                <div className="text-[#94a3b8] text-xs leading-6">
                  当前为前端原型：新增机构只会插入当前页面机构列表，不会真实创建组织或初始化成员。Case 数与 WSI 数应由平台根据该机构下已有数据自动统计，不应在新增机构时手动输入。正式系统中应接入机构编码、管理员绑定、存储配额校验和机构级数据权限。
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
                onClick={createOrganization}
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


function BasicSettingsPanel() {
  const [guestAnalysisLimit, setGuestAnalysisLimit] = useState('3');
  const [maxWsiSize, setMaxWsiSize] = useState('5');
  const [supportedFormats, setSupportedFormats] = useState('svs, sdpc, dcm, tiff');
  const [defaultTheme, setDefaultTheme] = useState('dark');
  const [uploadReview, setUploadReview] = useState('关闭');
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
        desc="配置平台通用规则，包括游客分析次数、上传限制、支持格式、默认主题和存储预警等。"
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">游客分析次数</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">{guestAnalysisLimit} 次</div>
          <div className="text-[#64748b] text-xs mt-2">游客模式可提交的分析任务次数。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">WSI 上传限制</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">{maxWsiSize} GB</div>
          <div className="text-[#64748b] text-xs mt-2">单个切片文件大小上限。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">默认主题</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">{defaultTheme === 'dark' ? '暗色' : '亮色'}</div>
          <div className="text-[#64748b] text-xs mt-2">新用户首次进入的默认主题。</div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">存储预警</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">{storageWarning}%</div>
          <div className="text-[#64748b] text-xs mt-2">达到阈值后触发平台提醒。</div>
        </div>
      </div>

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
              <label className="block text-sm text-[#cbd5e1] mb-2">默认主题</label>
              <select
                value={defaultTheme}
                onChange={(event) => setDefaultTheme(event.target.value)}
                className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
              >
                <option value="dark">暗色</option>
                <option value="light">亮色</option>
              </select>
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
      <aside className="w-[240px] shrink-0 border-r border-white/[0.08] bg-[#17181d] px-3 py-4">
        <div className="px-3 mb-5">
          <div className="text-[#f8fafc] text-lg font-bold">后台管理</div>
          <div className="text-[#64748b] text-xs mt-1">Admin Console</div>
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
                  <div
                    className={`w-full h-10 rounded-lg px-3 flex items-center gap-3 text-sm border transition-all ${
                      isParentActive
                        ? 'bg-[#8f35b7]/12 text-[#d292f4] border-[#8f35b7]/25'
                        : 'text-[#94a3b8] border-transparent'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </div>

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
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-3">
          <div className="text-[#d292f4] text-xs font-semibold mb-1">权限说明</div>
          <div className="text-[#94a3b8] text-xs leading-5">
            当前为后台管理原型页面，暂不接真实权限与接口。
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-6 py-5 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
