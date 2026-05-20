import { useState } from 'react';
import {
  BarChart3,
  Building2,
  Database,
  FileText,
  Settings,
  ShieldCheck,
  Users,
  Brain,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'organizations' | 'models' | 'data' | 'settings';

type ReviewStatus = '待审核' | '已通过' | '已拒绝';
type CommonStatus = '正常' | '停用' | '异常';

const menuItems: {
  key: AdminTab;
  label: string;
  icon: React.ReactNode;
}[] = [
  { key: 'overview', label: '总览', icon: <BarChart3 size={17} /> },
  { key: 'users', label: '用户管理', icon: <Users size={17} /> },
  { key: 'organizations', label: '机构管理', icon: <Building2 size={17} /> },
  { key: 'models', label: '模型审核', icon: <Brain size={17} /> },
  { key: 'data', label: '数据管理', icon: <Database size={17} /> },
  { key: 'settings', label: '系统配置', icon: <Settings size={17} /> },
];

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

const users = [
  {
    name: 'Zhang San',
    email: 'zhangsan@example.com',
    organization: '仁达病理中心',
    role: '机构管理员',
    status: '正常' as CommonStatus,
    lastLogin: '2026-05-20 15:30',
  },
  {
    name: 'Li Ming',
    email: 'liming@example.com',
    organization: 'AI Lab',
    role: '普通用户',
    status: '正常' as CommonStatus,
    lastLogin: '2026-05-20 13:12',
  },
  {
    name: 'Wang Yu',
    email: 'wangyu@example.com',
    organization: '测试机构',
    role: '普通用户',
    status: '停用' as CommonStatus,
    lastLogin: '2026-05-12 09:18',
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

const dataRows = [
  {
    type: 'Research Project',
    name: '乳腺癌 HER2 队列研究',
    organization: '仁达病理中心',
    owner: 'Zhang San',
    amount: '12 Case · 33 WSI',
    status: '正常' as CommonStatus,
    createdAt: '2026-05-20',
  },
  {
    type: 'Case',
    name: 'S-20260517-1906',
    organization: 'AI Lab',
    owner: 'Li Ming',
    amount: '2 WSI',
    status: '正常' as CommonStatus,
    createdAt: '2026-05-17',
  },
  {
    type: 'WSI',
    name: 'HE_lung_001.svs',
    organization: '仁达病理中心',
    owner: 'Zhang San',
    amount: '1.24 GB',
    status: '异常' as CommonStatus,
    createdAt: '2026-05-16',
  },
];

const settingsRows = [
  { name: '游客分析次数', value: '3 次', desc: '游客模式最多可提交的 AI 分析任务次数' },
  { name: '单个 WSI 上传大小限制', value: '5 GB', desc: '超过限制的切片需要走大文件上传流程' },
  { name: '支持文件格式', value: 'svs / sdpc / dcm / tiff', desc: '平台允许上传的切片格式' },
  { name: '模型公开审核', value: '开启', desc: '用户模型公开前需要后台审核' },
  { name: '模型中心展示规则', value: '仅展示审核通过模型', desc: '控制模型中心可见模型范围' },
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

function SectionTitle({
  title,
  desc,
  action,
}: {
  title: string;
  desc: string;
  action?: React.ReactNode;
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
              ['TASK-20260520-003', '模型权重文件不存在', '失败'],
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
  return (
    <>
      <SectionTitle
        title="用户管理"
        desc="管理平台用户、角色、状态和所属机构。"
        action={
          <button className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all">
            新增用户
          </button>
        }
      />

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
            {users.map((item) => (
              <tr key={item.email} className="border-b border-white/[0.06] text-[#d1d5db] hover:bg-white/[0.025]">
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
      </div>
    </>
  );
}

function OrganizationsPanel() {
  return (
    <>
      <SectionTitle
        title="机构管理"
        desc="管理医院、实验室、科研机构和企业组织。"
        action={
          <button className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all">
            新增机构
          </button>
        }
      />

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
            {organizations.map((item) => (
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
      </div>
    </>
  );
}

function ModelReviewPanel() {
  return (
    <>
      <SectionTitle
        title="模型审核"
        desc="审核用户提交公开的模型，通过后可展示到模型中心。"
      />

      <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="bg-[#252730] text-[#cbd5e1]">
              <th className="h-11 px-3 text-left">模型名称</th>
              <th className="h-11 px-3 text-left">提交人</th>
              <th className="h-11 px-3 text-left">所属机构</th>
              <th className="h-11 px-3 text-left">类型</th>
              <th className="h-11 px-3 text-left">版本</th>
              <th className="h-11 px-3 text-left">状态</th>
              <th className="h-11 px-3 text-left">提交时间</th>
              <th className="h-11 px-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {modelReviews.map((item) => (
              <tr key={item.name} className="border-b border-white/[0.06] text-[#d1d5db] hover:bg-white/[0.025]">
                <td className="h-11 px-3">{item.name}</td>
                <td className="h-11 px-3">{item.submitter}</td>
                <td className="h-11 px-3">{item.organization}</td>
                <td className="h-11 px-3">{item.type}</td>
                <td className="h-11 px-3">{item.version}</td>
                <td className="h-11 px-3"><StatusBadge status={item.status} /></td>
                <td className="h-11 px-3">{item.submittedAt}</td>
                <td className="h-11 px-3">
                  <div className="flex gap-2">
                    <button className="text-[#84cc16] hover:text-[#bef264]">通过</button>
                    <button className="text-[#fca5a5] hover:text-[#fecaca]">拒绝</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function DataPanel() {
  return (
    <>
      <SectionTitle
        title="数据管理"
        desc="查看平台脱敏数据资源，包括项目、Case 和 WSI 元数据。"
      />

      <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="bg-[#252730] text-[#cbd5e1]">
              <th className="h-11 px-3 text-left">数据类型</th>
              <th className="h-11 px-3 text-left">名称 / 编号</th>
              <th className="h-11 px-3 text-left">所属机构</th>
              <th className="h-11 px-3 text-left">创建人</th>
              <th className="h-11 px-3 text-left">数据量</th>
              <th className="h-11 px-3 text-left">状态</th>
              <th className="h-11 px-3 text-left">创建时间</th>
              <th className="h-11 px-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {dataRows.map((item) => (
              <tr key={item.name} className="border-b border-white/[0.06] text-[#d1d5db] hover:bg-white/[0.025]">
                <td className="h-11 px-3">{item.type}</td>
                <td className="h-11 px-3 font-mono">{item.name}</td>
                <td className="h-11 px-3">{item.organization}</td>
                <td className="h-11 px-3">{item.owner}</td>
                <td className="h-11 px-3">{item.amount}</td>
                <td className="h-11 px-3"><StatusBadge status={item.status} /></td>
                <td className="h-11 px-3">{item.createdAt}</td>
                <td className="h-11 px-3">
                  <button className="text-[#d292f4] hover:text-[#f0b7ff]">查看</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SettingsPanel() {
  return (
    <>
      <SectionTitle
        title="系统配置"
        desc="配置平台级规则、上传限制、模型公开审核和模型中心展示策略。"
      />

      <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
        {settingsRows.map((item) => (
          <div
            key={item.name}
            className="px-5 py-4 border-b border-white/[0.06] last:border-0 flex items-center justify-between gap-6"
          >
            <div>
              <div className="text-[#f1f3f6] text-sm font-semibold">{item.name}</div>
              <div className="text-[#64748b] text-xs mt-1">{item.desc}</div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-8 px-3 rounded-md border border-white/[0.08] bg-[#17181d] text-[#e2e8f0] text-sm flex items-center">
                {item.value}
              </div>
              <button className="h-8 px-3 rounded-md border border-[#8f35b7]/35 bg-[#8f35b7]/10 text-[#d292f4] text-xs hover:bg-[#8f35b7]/18 transition-all">
                编辑
              </button>
            </div>
          </div>
        ))}
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
      case 'organizations':
        return <OrganizationsPanel />;
      case 'models':
        return <ModelReviewPanel />;
      case 'data':
        return <DataPanel />;
      case 'settings':
        return <SettingsPanel />;
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
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
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