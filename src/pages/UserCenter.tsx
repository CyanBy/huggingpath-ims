import { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';

type UserCenterTab = 'profile' | 'security' | 'organization';

function SectionHeader({
  title,
  desc,
}: {
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-[#f1f3f6] text-xl font-semibold">{title}</h2>
      {desc && <p className="text-[#64748b] text-sm mt-1">{desc}</p>}
    </div>
  );
}

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm text-[#cbd5e1] mb-2">
      {label}
      {required && <span className="ml-1 text-[#ff8f8f]">*</span>}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  readOnly,
  type = 'text',
}: {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      className={`w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none placeholder:text-[#64748b] ${
        readOnly ? 'opacity-70 cursor-not-allowed' : 'focus:border-[#8f35b7]'
      }`}
    />
  );
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
      <div className="flex items-center gap-2 text-[#64748b] text-sm mb-3">
        {icon}
        {label}
      </div>
      <div className="text-[#f1f3f6] text-lg font-semibold">{value}</div>
    </div>
  );
}

export default function UserCenter() {
  const [activeTab, setActiveTab] = useState<UserCenterTab>('profile');

  const [avatarName] = useState('演示用户');
  const [displayName, setDisplayName] = useState('演示用户');
  const [email] = useState('demo@example.com');
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [saveResult, setSaveResult] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityResult, setSecurityResult] = useState('');

  const [joinCode, setJoinCode] = useState('');
  const [realName, setRealName] = useState('');
  const [joinReason, setJoinReason] = useState('');
  const [joinStatus, setJoinStatus] = useState<'none' | 'pending'>('none');

  const tabs: { key: UserCenterTab; label: string }[] = [
    { key: 'profile', label: '个人资料' },
    { key: 'security', label: '账号安全' },
    { key: 'organization', label: '机构信息' },
  ];

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const sendPhoneCode = () => {
    if (!phone.trim()) {
      setSaveResult('请先输入手机号。');
      return;
    }

    setSaveResult('');
    setPhoneCodeSent(true);
    setPhoneVerified(false);
    showSuccessToast('验证码已发送');
  };

  const verifyPhone = () => {
    if (!phone.trim()) {
      setSaveResult('请先输入手机号。');
      return;
    }

    if (!phoneCode.trim()) {
      setSaveResult('请输入短信验证码。');
      return;
    }

    if (!/^\d{6}$/.test(phoneCode.trim())) {
      setSaveResult('短信验证码应为 6 位数字。');
      return;
    }

    setSaveResult('');
    setPhoneVerified(true);
    showSuccessToast('手机号绑定成功');
  };

  const saveProfile = () => {
    if (!displayName.trim()) {
      setSaveResult('用户名不能为空。');
      return;
    }

    setSaveResult('个人资料已模拟保存。');
  };

  const changePassword = () => {
    if (!currentPassword.trim()) {
      setSecurityResult('请输入当前密码。');
      return;
    }

    if (newPassword.length < 6) {
      setSecurityResult('新密码长度不能少于 6 位。');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityResult('两次输入的新密码不一致。');
      return;
    }

    setSecurityResult('密码已模拟修改。');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const submitJoinRequest = () => {
    if (!joinCode.trim() || !realName.trim()) return;
    setJoinStatus('pending');
  };

  return (
    <div className="min-h-screen bg-[#0f1014] text-[#f1f3f6] pt-24 pb-12">
      {toastMessage && (
        <div className="fixed left-1/2 top-24 z-[120] -translate-x-1/2 rounded-lg border border-[#3f6212] bg-[#3f6212]/90 px-5 py-2.5 text-sm font-medium text-[#ecfccb] shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          {toastMessage}
        </div>
      )}

      <div className="section-container">
        <div className="mb-8">
          <h1 className="text-[#f1f3f6] text-3xl font-bold">个人资料</h1>
          <p className="text-[#64748b] text-sm mt-2">
            管理个人资料、账号安全和机构加入状态。
          </p>
        </div>

        <div className="grid grid-cols-[280px_1fr] gap-6">
          <aside className="rounded-xl border border-white/[0.08] bg-[#202126] h-fit overflow-hidden">
            <div className="p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full border border-[#8f35b7]/50 bg-[#8f35b7]/20 text-[#d292f4] flex items-center justify-center text-xl font-bold">
                  {avatarName.slice(0, 1)}
                </div>
                <div>
                  <div className="text-[#f1f3f6] text-base font-semibold">{displayName}</div>
                  <div className="text-[#64748b] text-xs mt-1">{email}</div>
                </div>
              </div>
            </div>

            <nav className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full h-10 px-3 rounded-md text-sm text-left transition-all ${
                    activeTab === tab.key
                      ? 'bg-[#8f35b7]/25 text-[#d292f4]'
                      : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="min-w-0">
            {activeTab === 'profile' && (
              <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
                <div className="h-14 px-5 border-b border-white/[0.06] flex items-center">
                  <div>
                    <div className="text-[#f1f3f6] text-base font-semibold">个人资料</div>
                    <div className="text-[#64748b] text-xs mt-0.5">维护账号展示信息。</div>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-3 gap-4">
                    <InfoCard label="账号类型" value="个人账号" icon={<User size={16} />} />
                    <InfoCard label="默认角色" value="普通用户" icon={<ShieldCheck size={16} />} />
                    <InfoCard label="机构认证" value="未认证" icon={<Building2 size={16} />} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel label="用户名" required />
                      <TextInput value={displayName} onChange={setDisplayName} />
                    </div>

                    <div>
                      <FieldLabel label="邮箱" />
                      <TextInput value={email} readOnly />
                    </div>

                    <div>
                      <FieldLabel label="手机号" />
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <TextInput
                          value={phone}
                          onChange={(value) => {
                            setPhone(value);
                            setPhoneCode('');
                            setPhoneCodeSent(false);
                            setPhoneVerified(false);
                          }}
                          placeholder="请输入手机号"
                        />
                        <button
                          type="button"
                          onClick={sendPhoneCode}
                          disabled={phoneVerified}
                          className={`h-10 px-4 rounded-md text-sm transition-all whitespace-nowrap ${
                            phoneVerified
                              ? 'border border-[#3f6212] bg-[#3f6212]/25 text-[#84cc16] cursor-default'
                              : 'border border-[#8f35b7]/35 bg-[#8f35b7]/10 text-[#d292f4] hover:bg-[#8f35b7]/18'
                          }`}
                        >
                          {phoneVerified ? '已绑定' : phoneCodeSent ? '重新发送' : '获取验证码'}
                        </button>
                      </div>
                    </div>

                    {phoneCodeSent && !phoneVerified && (
                      <div>
                        <FieldLabel label="短信验证码" />
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <TextInput value={phoneCode} onChange={setPhoneCode} placeholder="请输入 6 位验证码" />
                          <button
                            type="button"
                            onClick={verifyPhone}
                            className="h-10 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all whitespace-nowrap"
                          >
                            验证绑定
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {saveResult && (
                    <div className="rounded-lg border border-white/[0.08] bg-[#17181d] px-3 py-2 text-[#cbd5e1] text-sm">
                      {saveResult}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={saveProfile}
                      className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all"
                    >
                      保存个人资料
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
                <div className="h-14 px-5 border-b border-white/[0.06] flex items-center">
                  <div>
                    <div className="text-[#f1f3f6] text-base font-semibold">账号安全</div>
                    <div className="text-[#64748b] text-xs mt-0.5">修改登录密码和查看账号安全状态。</div>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 gap-4 max-w-[520px]">
                    <div>
                      <FieldLabel label="当前密码" required />
                      <TextInput value={currentPassword} onChange={setCurrentPassword} type="password" placeholder="请输入当前密码" />
                    </div>

                    <div>
                      <FieldLabel label="新密码" required />
                      <TextInput value={newPassword} onChange={setNewPassword} type="password" placeholder="请输入新密码，不少于 6 位" />
                    </div>

                    <div>
                      <FieldLabel label="确认新密码" required />
                      <TextInput value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="请再次输入新密码" />
                    </div>
                  </div>

                  {securityResult && (
                    <div className="rounded-lg border border-white/[0.08] bg-[#17181d] px-3 py-2 text-[#cbd5e1] text-sm">
                      {securityResult}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={changePassword}
                      className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all"
                    >
                      保存密码
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'organization' && (
              <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
                <div className="h-14 px-5 border-b border-white/[0.06] flex items-center">
                  <div>
                    <div className="text-[#f1f3f6] text-base font-semibold">机构信息</div>
                    <div className="text-[#64748b] text-xs mt-0.5">查看机构绑定状态，提交加入机构申请。</div>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoCard label="所属机构" value="无" icon={<Building2 size={16} />} />
                    <InfoCard label="机构角色" value="无" icon={<Users size={16} />} />
                  </div>

                  {joinStatus === 'pending' ? (
                    <div className="rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-4">
                      <div className="text-[#d292f4] text-sm font-semibold mb-1">申请已提交</div>
                      <div className="text-[#94a3b8] text-xs leading-6">
                        机构加入申请已提交，请等待机构管理员审核。审核通过后，账号将绑定机构并获得机构角色。
                      </div>
                    </div>
                  ) : (
                    <>
                      <SectionHeader
                        title="申请加入机构"
                        desc="个人账号不能自行绑定机构，需通过邀请码或机构编码提交申请。"
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <FieldLabel label="机构邀请码 / 机构编码" required />
                          <TextInput value={joinCode} onChange={setJoinCode} placeholder="请输入机构邀请码或机构编码" />
                        </div>

                        <div>
                          <FieldLabel label="真实姓名" required />
                          <TextInput value={realName} onChange={setRealName} placeholder="请输入真实姓名" />
                        </div>

                        <div className="col-span-2">
                          <FieldLabel label="申请说明" />
                          <textarea
                            value={joinReason}
                            onChange={(event) => setJoinReason(event.target.value)}
                            placeholder="可填写所属科室、用途或申请原因"
                            className="w-full h-24 rounded-md border border-white/[0.08] bg-[#17181d] px-3 py-2 text-sm text-[#e2e8f0] outline-none placeholder:text-[#64748b] resize-none focus:border-[#8f35b7]"
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-4">
                        <div className="text-[#d292f4] text-sm font-semibold mb-1">机构绑定规则</div>
                        <div className="text-[#94a3b8] text-xs leading-6">
                          注册账号默认是个人账号，不允许注册时直接选择机构。加入机构必须通过申请并由机构管理员审核。
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={submitJoinRequest}
                          className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all"
                        >
                          提交机构申请
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
