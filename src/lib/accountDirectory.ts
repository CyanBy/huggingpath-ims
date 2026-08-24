export type AccountStatus = 'active' | 'disabled';
export type RoleStatus = 'active' | 'disabled';
export type MembershipRequestStatus = 'pending' | 'approved' | 'rejected';

export type Permission =
  | 'workbench:use'
  | 'analysis:manage'
  | 'projects:manage'
  | 'wsi:manage'
  | 'cases:manage'
  | 'workbench-models:manage'
  | 'models:manage'
  | 'users:manage'
  | 'roles:manage'
  | 'organizations:manage'
  | 'settings:manage';

export type DirectoryRole = {
  id: string;
  name: string;
  description: string;
  type: 'system' | 'custom';
  status: RoleStatus;
  permissions: Permission[];
  updatedAt: string;
};

export type DirectoryOrganization = {
  id: string;
  name: string;
  code: string;
  type: string;
  quota: string;
  status: AccountStatus;
  caseCount: number;
  wsiCount: number;
};

export type DirectoryAccount = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
  phone: string;
  phoneVerified: boolean;
  organizationId: string | null;
  roleId: string;
  status: AccountStatus;
  createdAt: string;
  lastLoginAt: string | null;
};

export type MembershipRequest = {
  id: string;
  accountId: string;
  organizationId: string;
  realName: string;
  reason: string;
  status: MembershipRequestStatus;
  createdAt: string;
  handledAt: string | null;
  handledBy: string | null;
  note: string;
};

export type DirectorySnapshot = {
  accounts: DirectoryAccount[];
  roles: DirectoryRole[];
  organizations: DirectoryOrganization[];
  membershipRequests: MembershipRequest[];
};

export type SessionAccount = {
  account: DirectoryAccount;
  role: DirectoryRole;
  organization: DirectoryOrganization | null;
};

const DIRECTORY_KEY = 'huggingpath.accountDirectory.v2';
const SESSION_KEY = 'huggingpath.accountSession.v2';
const DIRECTORY_EVENT = 'huggingpath-account-directory-change';
let cachedDirectoryRaw: string | null | undefined;
let cachedDirectory: DirectorySnapshot | null = null;

const now = () => new Date().toISOString();

// This is only used by the local prototype store, never as production credential storage.
function localPasswordHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `hp-${(hash >>> 0).toString(16)}`;
}

const permissionGroups: { label: string; values: Permission[] }[] = [
  { label: '工作台与分析', values: ['workbench:use', 'analysis:manage'] },
  { label: '研究与数据', values: ['projects:manage', 'wsi:manage', 'cases:manage'] },
  { label: '模型管理', values: ['workbench-models:manage', 'models:manage'] },
  { label: '平台与系统', values: ['users:manage', 'roles:manage', 'organizations:manage', 'settings:manage'] },
];

export const directoryPermissionGroups = permissionGroups;
export const allDirectoryPermissions = permissionGroups.flatMap((group) => group.values);

const systemRolePermissions: Record<string, Permission[]> = {
  'role-platform-admin': allDirectoryPermissions,
  'role-org-admin': [
    'workbench:use',
    'analysis:manage',
    'projects:manage',
    'wsi:manage',
    'cases:manage',
    'workbench-models:manage',
    'users:manage',
  ],
  'role-standard-user': ['workbench:use', 'analysis:manage', 'projects:manage', 'wsi:manage', 'cases:manage'],
  'role-data-qc': ['workbench:use', 'wsi:manage', 'cases:manage'],
};

const systemRoleDescriptions: Record<string, string> = {
  'role-platform-admin': '管理全平台的用户、角色、机构、模型与系统设置。',
  'role-org-admin': '管理所属机构的用户申请、项目、Case、WSI 与分析任务。',
  'role-standard-user': '使用工作台完成分析任务并管理个人项目、Case 与 WSI。',
};

function seedDirectory(): DirectorySnapshot {
  const seededAt = '2026-08-01T09:00:00.000Z';
  const roles: DirectoryRole[] = [
    {
      id: 'role-platform-admin',
      name: '平台管理员',
      description: systemRoleDescriptions['role-platform-admin'],
      type: 'system',
      status: 'active',
      permissions: systemRolePermissions['role-platform-admin'],
      updatedAt: seededAt,
    },
    {
      id: 'role-org-admin',
      name: '机构管理员',
      description: systemRoleDescriptions['role-org-admin'],
      type: 'system',
      status: 'active',
      permissions: systemRolePermissions['role-org-admin'],
      updatedAt: seededAt,
    },
    {
      id: 'role-standard-user',
      name: '普通用户',
      description: systemRoleDescriptions['role-standard-user'],
      type: 'system',
      status: 'active',
      permissions: systemRolePermissions['role-standard-user'],
      updatedAt: seededAt,
    },
    {
      id: 'role-data-qc',
      name: '数据质控员',
      description: '查看并维护所属机构的 Case 与 WSI 数据质量。',
      type: 'custom',
      status: 'active',
      permissions: systemRolePermissions['role-data-qc'],
      updatedAt: seededAt,
    },
  ];

  const organizations: DirectoryOrganization[] = [
    {
      id: 'org-renda',
      name: '仁达病理中心',
      code: 'RENDA-2026',
      type: '病理中心',
      quota: '10 TB',
      status: 'active',
      caseCount: 1240,
      wsiCount: 8500,
    },
    {
      id: 'org-ai-lab',
      name: 'AI Lab',
      code: 'AILAB-2026',
      type: '科研机构',
      quota: '5 TB',
      status: 'active',
      caseCount: 620,
      wsiCount: 3100,
    },
    {
      id: 'org-testing',
      name: '测试机构',
      code: 'TEST-2026',
      type: '企业',
      quota: '1 TB',
      status: 'active',
      caseCount: 80,
      wsiCount: 480,
    },
  ];

  const accounts: DirectoryAccount[] = [
    {
      id: 'account-demo',
      username: 'demo',
      displayName: '演示管理员',
      email: 'demo@example.com',
      passwordHash: localPasswordHash('demo123'),
      phone: '',
      phoneVerified: false,
      organizationId: 'org-renda',
      roleId: 'role-platform-admin',
      status: 'active',
      createdAt: seededAt,
      lastLoginAt: seededAt,
    },
    {
      id: 'account-zhangsan',
      username: 'zhangsan',
      displayName: 'Zhang San',
      email: 'zhangsan@example.com',
      passwordHash: localPasswordHash('welcome123'),
      phone: '',
      phoneVerified: false,
      organizationId: 'org-renda',
      roleId: 'role-org-admin',
      status: 'active',
      createdAt: seededAt,
      lastLoginAt: '2026-08-10T07:30:00.000Z',
    },
    {
      id: 'account-liming',
      username: 'liming',
      displayName: 'Li Ming',
      email: 'liming@example.com',
      passwordHash: localPasswordHash('welcome123'),
      phone: '',
      phoneVerified: false,
      organizationId: 'org-ai-lab',
      roleId: 'role-standard-user',
      status: 'active',
      createdAt: seededAt,
      lastLoginAt: '2026-08-09T14:12:00.000Z',
    },
    {
      id: 'account-wangyu',
      username: 'wangyu',
      displayName: 'Wang Yu',
      email: 'wangyu@example.com',
      passwordHash: localPasswordHash('welcome123'),
      phone: '',
      phoneVerified: false,
      organizationId: 'org-testing',
      roleId: 'role-standard-user',
      status: 'disabled',
      createdAt: seededAt,
      lastLoginAt: '2026-08-02T01:18:00.000Z',
    },
  ];

  return { accounts, roles, organizations, membershipRequests: [] };
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isDirectorySnapshot(value: unknown): value is DirectorySnapshot {
  return Boolean(
    value &&
      typeof value === 'object' &&
      Array.isArray((value as DirectorySnapshot).accounts) &&
      Array.isArray((value as DirectorySnapshot).roles) &&
      Array.isArray((value as DirectorySnapshot).organizations) &&
      Array.isArray((value as DirectorySnapshot).membershipRequests),
  );
}

function writeDirectory(snapshot: DirectorySnapshot) {
  if (!canUseStorage()) return;
  const serialized = JSON.stringify(snapshot);
  cachedDirectoryRaw = serialized;
  cachedDirectory = snapshot;
  window.localStorage.setItem(DIRECTORY_KEY, serialized);
  window.dispatchEvent(new Event(DIRECTORY_EVENT));
}

function hasSamePermissions(left: Permission[], right: Permission[]) {
  return left.length === right.length && left.every((permission, index) => permission === right[index]);
}

function normalizeStoredPermissions(permissions: unknown): Permission[] {
  const stored = Array.isArray(permissions)
    ? permissions.filter((permission): permission is string => typeof permission === 'string')
    : [];
  const migrated = stored.flatMap((permission) =>
    permission === 'data:manage' ? ['wsi:manage', 'cases:manage'] : [permission],
  );

  return [...new Set(migrated.filter((permission): permission is Permission => allDirectoryPermissions.includes(permission as Permission)))];
}

function upgradeDirectoryPermissions(snapshot: DirectorySnapshot) {
  let changed = false;
  const roles = snapshot.roles.map((role) => {
    const target = role.type === 'system' ? systemRolePermissions[role.id] : undefined;
    const description = role.type === 'system' ? systemRoleDescriptions[role.id] || role.description : role.description;
    const permissions = target ? [...target] : normalizeStoredPermissions(role.permissions);

    if (role.description === description && hasSamePermissions(role.permissions, permissions)) return role;
    changed = true;
    return { ...role, description, permissions };
  });

  return changed ? { ...snapshot, roles } : snapshot;
}

export function getDirectory(): DirectorySnapshot {
  if (!canUseStorage()) return seedDirectory();

  const raw = window.localStorage.getItem(DIRECTORY_KEY);
  if (raw === cachedDirectoryRaw && cachedDirectory) return cachedDirectory;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (isDirectorySnapshot(parsed)) {
        const upgraded = upgradeDirectoryPermissions(parsed);
        if (upgraded !== parsed) {
          writeDirectory(upgraded);
          return upgraded;
        }
        cachedDirectoryRaw = raw;
        cachedDirectory = parsed;
        return parsed;
      }
    } catch {
      // Fall through to a clean local directory when a stale prototype value cannot be read.
    }
  }

  const seeded = seedDirectory();
  writeDirectory(seeded);
  return seeded;
}

function updateDirectory(mutator: (snapshot: DirectorySnapshot) => void) {
  const snapshot = structuredClone(getDirectory());
  mutator(snapshot);
  writeDirectory(snapshot);
  return snapshot;
}

function getSessionId() {
  if (!canUseStorage()) return null;

  const sessionId = window.localStorage.getItem(SESSION_KEY);
  if (sessionId) return sessionId;

  // Preserve an existing demo session created before account sessions were introduced.
  if (window.localStorage.getItem('isLoggedIn') === 'true') {
    window.localStorage.setItem(SESSION_KEY, 'account-demo');
    return 'account-demo';
  }

  return null;
}

export function getSessionAccount(snapshot = getDirectory()): SessionAccount | null {
  const sessionId = getSessionId();
  if (!sessionId) return null;

  const account = snapshot.accounts.find((item) => item.id === sessionId);
  const role = account ? snapshot.roles.find((item) => item.id === account.roleId) : null;
  if (!account || !role || account.status !== 'active' || role.status !== 'active') return null;

  return {
    account,
    role,
    organization: account.organizationId
      ? snapshot.organizations.find((item) => item.id === account.organizationId) || null
      : null,
  };
}

export function hasDirectoryPermission(
  session: SessionAccount | null,
  permission: Permission,
) {
  return Boolean(session?.role.permissions.includes(permission));
}

export function canAccessAdmin(session: SessionAccount | null) {
  return Boolean(
    session &&
    ['users:manage', 'roles:manage', 'organizations:manage', 'models:manage', 'settings:manage'].some((permission) =>
        session.role.permissions.includes(permission as Permission),
      ),
  );
}

export function isPlatformAdministrator(session: SessionAccount | null) {
  return session?.account.roleId === 'role-platform-admin';
}

export function signIn(accountOrEmail: string, password: string) {
  const directory = getDirectory();
  const lookup = accountOrEmail.trim().toLocaleLowerCase();
  const account = directory.accounts.find(
    (item) =>
      item.username.toLocaleLowerCase() === lookup || item.email.toLocaleLowerCase() === lookup,
  );

  if (!account || account.passwordHash !== localPasswordHash(password)) {
    return { ok: false as const, message: '账号或密码不正确。' };
  }

  const role = directory.roles.find((item) => item.id === account.roleId);
  if (account.status !== 'active' || role?.status !== 'active') {
    return { ok: false as const, message: '该账号或所属角色已停用，请联系管理员。' };
  }

  updateDirectory((snapshot) => {
    const target = snapshot.accounts.find((item) => item.id === account.id);
    if (target) target.lastLoginAt = now();
  });
  window.localStorage.setItem(SESSION_KEY, account.id);
  window.localStorage.setItem('isLoggedIn', 'true');
  window.dispatchEvent(new Event(DIRECTORY_EVENT));
  window.dispatchEvent(new Event('authChange'));
  return { ok: true as const, accountId: account.id };
}

export function signOut() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem('isLoggedIn');
  window.dispatchEvent(new Event(DIRECTORY_EVENT));
  window.dispatchEvent(new Event('authChange'));
}

export function registerAccount(input: {
  username: string;
  email: string;
  password: string;
}) {
  const username = input.username.trim();
  const email = input.email.trim().toLocaleLowerCase();
  const directory = getDirectory();

  if (directory.accounts.some((item) => item.username.toLocaleLowerCase() === username.toLocaleLowerCase())) {
    return { ok: false as const, message: '用户名已被使用，请更换后再试。' };
  }
  if (directory.accounts.some((item) => item.email.toLocaleLowerCase() === email)) {
    return { ok: false as const, message: '该邮箱已经注册，请直接登录。' };
  }

  const account: DirectoryAccount = {
    id: `account-${crypto.randomUUID()}`,
    username,
    displayName: username,
    email,
    passwordHash: localPasswordHash(input.password),
    phone: '',
    phoneVerified: false,
    organizationId: null,
    roleId: 'role-standard-user',
    status: 'active',
    createdAt: now(),
    lastLoginAt: now(),
  };

  updateDirectory((snapshot) => {
    snapshot.accounts.unshift(account);
  });
  window.localStorage.setItem(SESSION_KEY, account.id);
  window.localStorage.setItem('isLoggedIn', 'true');
  window.dispatchEvent(new Event(DIRECTORY_EVENT));
  window.dispatchEvent(new Event('authChange'));
  return { ok: true as const, account };
}

export function updateMyProfile(accountId: string, input: { displayName: string; phone: string }) {
  updateDirectory((snapshot) => {
    const account = snapshot.accounts.find((item) => item.id === accountId);
    if (!account) throw new Error('账号不存在。');
    account.displayName = input.displayName.trim();
    account.phone = input.phone.trim();
  });
}

export function updateMyPassword(accountId: string, currentPassword: string, nextPassword: string) {
  const directory = getDirectory();
  const account = directory.accounts.find((item) => item.id === accountId);
  if (!account || account.passwordHash !== localPasswordHash(currentPassword)) {
    return { ok: false as const, message: '当前密码不正确。' };
  }

  updateDirectory((snapshot) => {
    const target = snapshot.accounts.find((item) => item.id === accountId);
    if (target) target.passwordHash = localPasswordHash(nextPassword);
  });
  return { ok: true as const };
}

export function applyForOrganization(
  accountId: string,
  input: { organizationCode: string; realName: string; reason: string },
) {
  const directory = getDirectory();
  const account = directory.accounts.find((item) => item.id === accountId);
  const organization = directory.organizations.find(
    (item) => item.code.toLocaleLowerCase() === input.organizationCode.trim().toLocaleLowerCase(),
  );
  if (!account || !organization) return { ok: false as const, message: '机构编码不存在，请核对后重试。' };
  if (organization.status !== 'active') return { ok: false as const, message: '该机构当前不可加入。' };
  if (account.organizationId) return { ok: false as const, message: '当前账号已绑定机构。' };
  if (
    directory.membershipRequests.some(
      (item) => item.accountId === accountId && item.status === 'pending',
    )
  ) {
    return { ok: false as const, message: '已有待审核申请，请等待处理。' };
  }

  updateDirectory((snapshot) => {
    snapshot.membershipRequests.unshift({
      id: `request-${crypto.randomUUID()}`,
      accountId,
      organizationId: organization.id,
      realName: input.realName.trim(),
      reason: input.reason.trim(),
      status: 'pending',
      createdAt: now(),
      handledAt: null,
      handledBy: null,
      note: '',
    });
  });
  return { ok: true as const };
}

export function reviewMembershipRequest(
  requestId: string,
  reviewer: SessionAccount,
  decision: 'approved' | 'rejected',
  note = '',
) {
  const directory = getDirectory();
  const request = directory.membershipRequests.find((item) => item.id === requestId);
  if (!request || request.status !== 'pending') return { ok: false as const, message: '该申请已处理。' };
  if (!hasDirectoryPermission(reviewer, 'organizations:manage') && request.organizationId !== reviewer.account.organizationId) {
    return { ok: false as const, message: '只能处理所属机构的申请。' };
  }

  updateDirectory((snapshot) => {
    const target = snapshot.membershipRequests.find((item) => item.id === requestId);
    if (!target) return;
    target.status = decision;
    target.note = note.trim();
    target.handledAt = now();
    target.handledBy = reviewer.account.id;
    if (decision === 'approved') {
      const account = snapshot.accounts.find((item) => item.id === target.accountId);
      if (account) {
        account.organizationId = target.organizationId;
        account.roleId = 'role-standard-user';
      }
    }
  });
  return { ok: true as const };
}

export function createDirectoryAccount(input: {
  username: string;
  displayName: string;
  email: string;
  password: string;
  organizationId: string | null;
  roleId: string;
  status: AccountStatus;
}) {
  const directory = getDirectory();
  const username = input.username.trim();
  const email = input.email.trim().toLocaleLowerCase();
  if (directory.accounts.some((item) => item.username.toLocaleLowerCase() === username.toLocaleLowerCase())) {
    return { ok: false as const, message: '用户名已被使用，请更换后再试。' };
  }
  if (directory.accounts.some((item) => item.email.toLocaleLowerCase() === email)) {
    return { ok: false as const, message: '该邮箱已经注册。' };
  }
  const account: DirectoryAccount = {
    id: `account-${crypto.randomUUID()}`,
    username,
    displayName: input.displayName.trim(),
    email,
    passwordHash: localPasswordHash(input.password),
    phone: '',
    phoneVerified: false,
    organizationId: input.organizationId,
    roleId: input.roleId,
    status: input.status,
    createdAt: now(),
    lastLoginAt: null,
  };
  updateDirectory((snapshot) => {
    snapshot.accounts.unshift(account);
  });
  return { ok: true as const, account };
}

export function updateDirectoryAccount(
  accountId: string,
  input: Pick<DirectoryAccount, 'displayName' | 'organizationId' | 'roleId' | 'status'>,
) {
  updateDirectory((snapshot) => {
    const account = snapshot.accounts.find((item) => item.id === accountId);
    if (!account) throw new Error('账号不存在。');
    account.displayName = input.displayName.trim();
    account.organizationId = input.organizationId;
    account.roleId = input.roleId;
    account.status = input.status;
  });
}

export function setDirectoryAccountStatus(accountId: string, status: AccountStatus) {
  const directory = getDirectory();
  const target = directory.accounts.find((item) => item.id === accountId);
  if (!target) return { ok: false as const, message: '账号不存在。' };
  if (status === 'disabled' && target.roleId === 'role-platform-admin') {
    const activePlatformAdmins = directory.accounts.filter(
      (item) => item.roleId === 'role-platform-admin' && item.status === 'active',
    );
    if (activePlatformAdmins.length <= 1) {
      return { ok: false as const, message: '至少需要保留一个启用的平台管理员。' };
    }
  }

  updateDirectory((snapshot) => {
    const account = snapshot.accounts.find((item) => item.id === accountId);
    if (account) account.status = status;
  });
  return { ok: true as const };
}

export function removeDirectoryAccount(accountId: string) {
  const directory = getDirectory();
  const target = directory.accounts.find((item) => item.id === accountId);
  if (!target) return { ok: false as const, message: '账号不存在。' };
  if (target.roleId === 'role-platform-admin') {
    const platformAdmins = directory.accounts.filter((item) => item.roleId === 'role-platform-admin');
    if (platformAdmins.length <= 1) {
      return { ok: false as const, message: '至少需要保留一个平台管理员账号。' };
    }
  }

  updateDirectory((snapshot) => {
    snapshot.accounts = snapshot.accounts.filter((item) => item.id !== accountId);
    snapshot.membershipRequests = snapshot.membershipRequests.filter((item) => item.accountId !== accountId);
  });
  return { ok: true as const };
}

export function createDirectoryRole(input: Omit<DirectoryRole, 'id' | 'type' | 'updatedAt'>) {
  const directory = getDirectory();
  if (directory.roles.some((item) => item.name.toLocaleLowerCase() === input.name.trim().toLocaleLowerCase())) {
    return { ok: false as const, message: '角色名称已存在。' };
  }
  const role: DirectoryRole = {
    ...input,
    id: `role-${crypto.randomUUID()}`,
    type: 'custom',
    updatedAt: now(),
    name: input.name.trim(),
  };
  updateDirectory((snapshot) => snapshot.roles.unshift(role));
  return { ok: true as const, role };
}

export function updateDirectoryRole(roleId: string, input: Pick<DirectoryRole, 'name' | 'description' | 'status' | 'permissions'>) {
  const directory = getDirectory();
  const target = directory.roles.find((item) => item.id === roleId);
  if (!target || target.type !== 'custom') return { ok: false as const, message: '系统内置角色不可编辑。' };
  if (directory.roles.some((item) => item.id !== roleId && item.name.toLocaleLowerCase() === input.name.trim().toLocaleLowerCase())) {
    return { ok: false as const, message: '角色名称已存在。' };
  }
  updateDirectory((snapshot) => {
    const role = snapshot.roles.find((item) => item.id === roleId);
    if (!role) return;
    role.name = input.name.trim();
    role.description = input.description.trim();
    role.status = input.status;
    role.permissions = input.permissions;
    role.updatedAt = now();
  });
  return { ok: true as const };
}

export function setDirectoryRoleStatus(roleId: string, status: RoleStatus) {
  const directory = getDirectory();
  if (!directory.roles.some((item) => item.id === roleId)) return { ok: false as const, message: '角色不存在。' };
  updateDirectory((snapshot) => {
    const role = snapshot.roles.find((item) => item.id === roleId);
    if (role) {
      role.status = status;
      role.updatedAt = now();
    }
  });
  return { ok: true as const };
}

export function removeDirectoryRole(roleId: string) {
  const directory = getDirectory();
  const role = directory.roles.find((item) => item.id === roleId);
  if (!role || role.type !== 'custom') return { ok: false as const, message: '系统内置角色不可删除。' };
  if (directory.accounts.some((item) => item.roleId === roleId)) {
    return { ok: false as const, message: '该角色仍有成员，无法删除。' };
  }
  updateDirectory((snapshot) => {
    snapshot.roles = snapshot.roles.filter((item) => item.id !== roleId);
  });
  return { ok: true as const };
}

export function createDirectoryOrganization(input: Omit<DirectoryOrganization, 'id' | 'caseCount' | 'wsiCount'>) {
  const directory = getDirectory();
  const name = input.name.trim();
  const code = input.code.trim().toLocaleUpperCase();
  if (directory.organizations.some((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    return { ok: false as const, message: '机构名称已存在。' };
  }
  if (directory.organizations.some((item) => item.code.toLocaleLowerCase() === code.toLocaleLowerCase())) {
    return { ok: false as const, message: '机构编码已存在。' };
  }
  const organization: DirectoryOrganization = { ...input, id: `org-${crypto.randomUUID()}`, name, code, caseCount: 0, wsiCount: 0 };
  updateDirectory((snapshot) => snapshot.organizations.unshift(organization));
  return { ok: true as const, organization };
}

export function updateDirectoryOrganization(
  organizationId: string,
  input: Pick<DirectoryOrganization, 'name' | 'code' | 'type' | 'quota' | 'status'>,
) {
  const directory = getDirectory();
  const name = input.name.trim();
  const code = input.code.trim().toLocaleUpperCase();
  if (directory.organizations.some((item) => item.id !== organizationId && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    return { ok: false as const, message: '机构名称已存在。' };
  }
  if (directory.organizations.some((item) => item.id !== organizationId && item.code.toLocaleLowerCase() === code.toLocaleLowerCase())) {
    return { ok: false as const, message: '机构编码已存在。' };
  }
  updateDirectory((snapshot) => {
    const organization = snapshot.organizations.find((item) => item.id === organizationId);
    if (!organization) return;
    organization.name = name;
    organization.code = code;
    organization.type = input.type.trim();
    organization.quota = input.quota.trim();
    organization.status = input.status;
  });
  return { ok: true as const };
}

export function setDirectoryOrganizationStatus(organizationId: string, status: AccountStatus) {
  const directory = getDirectory();
  if (!directory.organizations.some((item) => item.id === organizationId)) return { ok: false as const, message: '机构不存在。' };
  updateDirectory((snapshot) => {
    const organization = snapshot.organizations.find((item) => item.id === organizationId);
    if (organization) organization.status = status;
  });
  return { ok: true as const };
}

export function removeUnusedDirectoryOrganization(organizationId: string) {
  const directory = getDirectory();
  const organization = directory.organizations.find((item) => item.id === organizationId);
  if (!organization) return { ok: false as const, message: '机构不存在。' };
  if (directory.accounts.some((item) => item.organizationId === organizationId)) {
    return { ok: false as const, message: '该机构仍有关联成员，请先完成迁移或停用。' };
  }
  if (directory.membershipRequests.some((item) => item.organizationId === organizationId && item.status === 'pending')) {
    return { ok: false as const, message: '该机构仍有待处理申请。' };
  }
  if (organization.caseCount > 0 || organization.wsiCount > 0) {
    return { ok: false as const, message: '该机构仍有关联 Case 或 WSI，不能删除。' };
  }
  updateDirectory((snapshot) => {
    snapshot.organizations = snapshot.organizations.filter((item) => item.id !== organizationId);
  });
  return { ok: true as const };
}

export function subscribeDirectory(onStoreChange: () => void) {
  if (!canUseStorage()) return () => undefined;
  const handleChange = () => onStoreChange();
  window.addEventListener(DIRECTORY_EVENT, handleChange);
  window.addEventListener('storage', handleChange);
  return () => {
    window.removeEventListener(DIRECTORY_EVENT, handleChange);
    window.removeEventListener('storage', handleChange);
  };
}
