import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';

type AuthMode = 'login' | 'register';
type RegisterStep = 'form' | 'success';

type JoinRequestStatus = 'none' | 'pending' | 'approved' | 'rejected';

function LogoMark() {
  return (
    <div className="w-10 h-10 rounded-full border border-[#8f35b7]/60 bg-[#8f35b7]/10 flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border border-[#d292f4]/70 relative">
        <span className="absolute left-1/2 top-[-4px] -translate-x-1/2 w-2 h-2 rounded-full bg-[#8f35b7]" />
        <span className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#8f35b7]" />
        <span className="absolute left-1/2 bottom-[-4px] -translate-x-1/2 w-2 h-2 rounded-full bg-[#8f35b7]" />
        <span className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#8f35b7]" />
      </div>
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
      {required && <span className="text-[#ff8f8f] ml-1">*</span>}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]">
          {icon}
        </div>
      )}
      <input
        value={value}
        type={type}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full h-11 rounded-md border border-white/[0.08] bg-[#111217] px-3 text-sm text-[#e2e8f0] outline-none placeholder:text-[#64748b] focus:border-[#8f35b7] ${
          icon ? 'pl-10' : ''
        }`}
      />
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <KeyRound
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"
      />
      <input
        value={value}
        type={visible ? 'text' : 'password'}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full h-11 rounded-md border border-white/[0.08] bg-[#111217] pl-10 pr-10 text-sm text-[#e2e8f0] outline-none placeholder:text-[#64748b] focus:border-[#8f35b7]"
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#e2e8f0]"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}


function ForgotPasswordModal({
  email,
  code,
  newPassword,
  confirmPassword,
  result,
  codeSent,
  onEmailChange,
  onCodeChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSendCode,
  onSubmit,
  onClose,
}: {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
  result: string;
  codeSent: boolean;
  onEmailChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSendCode: () => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-[560px] rounded-2xl border border-white/[0.08] bg-[#202126] shadow-[0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden">
        <div className="h-16 px-6 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="text-[#f1f3f6] text-lg font-bold">找回密码</div>
            <div className="text-[#64748b] text-xs mt-1">
              通过邮箱验证码校验身份后重置密码。
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all inline-flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <FieldLabel label="邮箱" required />
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <TextInput
                value={email}
                onChange={onEmailChange}
                placeholder="请输入注册邮箱"
                icon={<Mail size={16} />}
              />
              <button
                type="button"
                onClick={onSendCode}
                className="h-11 px-4 rounded-md border border-[#8f35b7]/35 bg-[#8f35b7]/10 text-[#d292f4] text-sm hover:bg-[#8f35b7]/18 transition-all whitespace-nowrap"
              >
                {codeSent ? '重新发送' : '获取验证码'}
              </button>
            </div>
          </div>

          <div>
            <FieldLabel label="验证码" required />
            <TextInput
              value={code}
              onChange={onCodeChange}
              placeholder="请输入 6 位邮箱验证码"
              icon={<ShieldCheck size={16} />}
            />
          </div>

          <div>
            <FieldLabel label="新密码" required />
            <PasswordInput
              value={newPassword}
              onChange={onNewPasswordChange}
              placeholder="请输入新密码，不少于 6 位"
            />
          </div>

          <div>
            <FieldLabel label="确认新密码" required />
            <PasswordInput
              value={confirmPassword}
              onChange={onConfirmPasswordChange}
              placeholder="请再次输入新密码"
            />
          </div>

          {result && (
            <div className="rounded-lg border border-white/[0.08] bg-[#17181d] px-3 py-2 text-[#cbd5e1] text-sm">
              {result}
            </div>
          )}

          <div className="rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-4">
            <div className="text-[#d292f4] text-sm font-semibold mb-1">找回规则</div>
            <div className="text-[#94a3b8] text-xs leading-6">
              用户输入注册邮箱后获取验证码，验证码校验通过后才允许重置密码。正式系统需限制验证码有效期、发送频率和错误次数。
            </div>
          </div>
        </div>

        <div className="h-16 px-6 border-t border-white/[0.06] bg-[#17181d] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-md border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all"
          >
            取消
          </button>

          <button
            type="button"
            onClick={onSubmit}
            className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            重置密码
          </button>
        </div>
      </div>
    </div>
  );
}

function JoinOrganizationModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (payload: { inviteCode: string; realName: string; reason: string }) => void;
}) {
  const [inviteCode, setInviteCode] = useState('');
  const [realName, setRealName] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!inviteCode.trim()) {
      setError('请输入机构邀请码或机构编码。');
      return;
    }

    if (!realName.trim()) {
      setError('请输入真实姓名。');
      return;
    }

    onSubmit({
      inviteCode: inviteCode.trim(),
      realName: realName.trim(),
      reason: reason.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-[640px] rounded-2xl border border-white/[0.08] bg-[#202126] shadow-[0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden">
        <div className="h-16 px-6 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="text-[#f1f3f6] text-lg font-bold">申请加入机构</div>
            <div className="text-[#64748b] text-xs mt-1">
              提交后由机构管理员审核，通过后分配机构角色。
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all inline-flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-[#991b1b] bg-[#991b1b]/20 px-3 py-2 text-[#fca5a5] text-sm">
              {error}
            </div>
          )}

          <div>
            <FieldLabel label="机构邀请码 / 机构编码" required />
            <TextInput
              value={inviteCode}
              onChange={setInviteCode}
              placeholder="请输入机构邀请码或机构编码"
              icon={<ShieldCheck size={16} />}
            />
          </div>

          <div>
            <FieldLabel label="真实姓名" required />
            <TextInput
              value={realName}
              onChange={setRealName}
              placeholder="请输入真实姓名"
              icon={<User size={16} />}
            />
          </div>

          <div>
            <FieldLabel label="申请说明" />
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="可填写所属科室、用途或申请原因"
              className="w-full h-24 rounded-md border border-white/[0.08] bg-[#111217] px-3 py-2 text-sm text-[#e2e8f0] outline-none placeholder:text-[#64748b] resize-none focus:border-[#8f35b7]"
            />
          </div>

          <div className="rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-4">
            <div className="text-[#d292f4] text-sm font-semibold mb-1">机构绑定规则</div>
            <div className="text-[#94a3b8] text-xs leading-6">
              注册账号默认是个人账号，不允许注册时直接选择机构。加入机构必须通过邀请码或机构编码提交申请，并由机构管理员审核。
            </div>
          </div>
        </div>

        <div className="h-16 px-6 border-t border-white/[0.06] bg-[#17181d] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-md border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all"
          >
            取消
          </button>

          <button
            type="button"
            onClick={submit}
            className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            提交申请
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('form');
  const [joinStatus, setJoinStatus] = useState<JoinRequestStatus>('none');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotCodeSent, setForgotCodeSent] = useState(false);
  const [forgotResult, setForgotResult] = useState('');

  const [loginAccount, setLoginAccount] = useState('demo');
  const [loginPassword, setLoginPassword] = useState('demo123');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const pageTitle = useMemo(() => {
    if (mode === 'login') return '登录后继续分析';
    if (registerStep === 'success') return '注册成功';
    return '注册个人账号';
  }, [mode, registerStep]);

  const pageDesc = useMemo(() => {
    if (mode === 'login') {
      return '当前为演示登录，不进行真实账号密码校验。登录成功后将返回刚才的操作页面。';
    }

    if (registerStep === 'success') {
      return '账号已创建为个人账号，当前未绑定机构。你可以先使用个人数据和公开资源。';
    }

    return '注册后默认创建个人账号，不绑定任何机构。后续可通过邀请码申请加入机构。';
  }, [mode, registerStep]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setRegisterStep('form');
    setError('');
  };

  const submitLogin = () => {
  if (!loginAccount.trim()) {
    setError('请输入账号。');
    return;
  }

  if (!loginPassword.trim()) {
    setError('请输入密码。');
    return;
  }

  localStorage.setItem('isLoggedIn', 'true');
  window.dispatchEvent(new Event('authChange'));

  navigate('/workbench');
};

  const sendForgotCode = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!forgotEmail.trim()) {
      setForgotResult('请输入邮箱。');
      return;
    }

    if (!emailPattern.test(forgotEmail.trim())) {
      setForgotResult('邮箱格式不正确。');
      return;
    }

    setForgotCodeSent(true);
    setForgotResult('验证码已模拟发送至邮箱。');
  };

  const submitForgotPassword = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!forgotEmail.trim()) {
      setForgotResult('请输入邮箱。');
      return;
    }

    if (!emailPattern.test(forgotEmail.trim())) {
      setForgotResult('邮箱格式不正确。');
      return;
    }

    if (!forgotCode.trim()) {
      setForgotResult('请输入验证码。');
      return;
    }

    if (!/^\d{6}$/.test(forgotCode.trim())) {
      setForgotResult('验证码应为 6 位数字。');
      return;
    }

    if (!forgotNewPassword.trim()) {
      setForgotResult('请输入新密码。');
      return;
    }

    if (forgotNewPassword.length < 6) {
      setForgotResult('新密码长度不能少于 6 位。');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotResult('两次输入的新密码不一致。');
      return;
    }

    setForgotResult('密码已模拟重置，请返回登录。');
  };

  const submitRegister = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!registerName.trim()) {
      setError('请输入用户名。');
      return;
    }

    if (!registerEmail.trim()) {
      setError('请输入邮箱。');
      return;
    }

    if (!emailPattern.test(registerEmail.trim())) {
      setError('邮箱格式不正确。');
      return;
    }

    if (!registerPassword.trim()) {
      setError('请输入密码。');
      return;
    }

    if (registerPassword.length < 6) {
      setError('密码长度不能少于 6 位。');
      return;
    }

    if (registerPassword !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }

    setError('');
    localStorage.setItem('isLoggedIn', 'true');
window.dispatchEvent(new Event('authChange'));

setRegisterStep('success');
setJoinStatus('none');
  };

  const submitJoinRequest = () => {
    setJoinStatus('pending');
    setShowJoinModal(false);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0f1014] text-[#f1f3f6] relative overflow-hidden flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(143,53,183,0.22),transparent_36%),radial-gradient(circle_at_50%_85%,rgba(143,53,183,0.16),transparent_38%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,16,20,0.2),#0f1014_78%)]" />

      <div className="relative w-full max-w-[520px] rounded-2xl border border-white/[0.08] bg-[#202126]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)] overflow-hidden">
        <div className="p-8 border-b border-white/[0.06]">
          <div className="flex items-center gap-4 mb-8">
            <LogoMark />
            <div>
              <div className="text-[#f8fafc] text-2xl font-bold">HuggingPath</div>
              <div className="text-[#64748b] text-sm">IMS Demo Login</div>
            </div>
          </div>

          <div className="text-[#f1f3f6] text-2xl font-bold">{pageTitle}</div>
          <div className="text-[#94a3b8] text-sm leading-6 mt-3">{pageDesc}</div>
        </div>

        <div className="p-8 space-y-5">
          {error && (
            <div className="rounded-lg border border-[#991b1b] bg-[#991b1b]/20 px-3 py-2 text-[#fca5a5] text-sm">
              {error}
            </div>
          )}

          {mode === 'login' && (
            <>
              <div>
                <FieldLabel label="账号" required />
                <TextInput
                  value={loginAccount}
                  onChange={setLoginAccount}
                  placeholder="请输入账号或邮箱"
                  icon={<User size={16} />}
                />
              </div>

              <div>
                <FieldLabel label="密码" required />
                <PasswordInput
                  value={loginPassword}
                  onChange={setLoginPassword}
                  placeholder="请输入密码"
                />

                <div className="mt-3 flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-[#d292f4] hover:text-[#f0b7ff] transition-colors"
                  >
                    注册账号
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setForgotEmail(loginAccount.includes('@') ? loginAccount : '');
                      setForgotCode('');
                      setForgotNewPassword('');
                      setForgotConfirmPassword('');
                      setForgotCodeSent(false);
                      setForgotResult('');
                    }}
                    className="text-[#94a3b8] hover:text-[#e2e8f0] transition-colors"
                  >
                    找回密码
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={submitLogin}
                className="w-full h-11 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all"
              >
                登录
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full h-11 rounded-md border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all"
              >
                返回模型中心
              </button>
            </>
          )}

          {mode === 'register' && registerStep === 'form' && (
            <>
              <div>
                <FieldLabel label="用户名" required />
                <TextInput
                  value={registerName}
                  onChange={setRegisterName}
                  placeholder="请输入用户名"
                  icon={<User size={16} />}
                />
              </div>

              <div>
                <FieldLabel label="邮箱" required />
                <TextInput
                  value={registerEmail}
                  onChange={setRegisterEmail}
                  placeholder="example@domain.com"
                  icon={<Mail size={16} />}
                />
              </div>

              <div>
                <FieldLabel label="密码" required />
                <PasswordInput
                  value={registerPassword}
                  onChange={setRegisterPassword}
                  placeholder="不少于 6 位"
                />
              </div>

              <div>
                <FieldLabel label="确认密码" required />
                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="请再次输入密码"
                />
              </div>

              <div className="rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-4">
                <div className="text-[#d292f4] text-sm font-semibold mb-1">账号归属规则</div>
                <div className="text-[#94a3b8] text-xs leading-6">
                  注册后默认为个人账号，不直接绑定机构。个人账号仅可使用个人数据和公开资源，需通过邀请码申请加入机构。
                </div>
              </div>

              <button
                type="button"
                onClick={submitRegister}
                className="w-full h-11 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all"
              >
                注册个人账号
              </button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full h-11 rounded-md border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all"
              >
                已有账号，去登录
              </button>
            </>
          )}

          {mode === 'register' && registerStep === 'success' && (
            <>
              <div className="rounded-xl border border-[#3f6212] bg-[#3f6212]/20 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={22} className="text-[#84cc16] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[#f1f3f6] text-base font-semibold">个人账号已创建</div>
                    <div className="text-[#94a3b8] text-sm leading-6 mt-2">
                      当前账号未绑定机构。你可以先进入工作台使用个人数据，也可以提交机构加入申请。
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[#64748b] text-xs mb-1">账号类型</div>
                    <div className="text-[#e2e8f0]">个人账号</div>
                  </div>
                  <div>
                    <div className="text-[#64748b] text-xs mb-1">所属机构</div>
                    <div className="text-[#e2e8f0]">无</div>
                  </div>
                  <div>
                    <div className="text-[#64748b] text-xs mb-1">默认角色</div>
                    <div className="text-[#e2e8f0]">普通用户</div>
                  </div>
                  <div>
                    <div className="text-[#64748b] text-xs mb-1">机构认证</div>
                    <div className="text-[#e2e8f0]">
                      {joinStatus === 'pending' ? '待审核' : '未认证'}
                    </div>
                  </div>
                </div>
              </div>

              {joinStatus === 'pending' && (
                <div className="rounded-lg border border-[#8f35b7]/25 bg-[#8f35b7]/10 px-3 py-2 text-[#d292f4] text-sm">
                  机构加入申请已提交，请等待机构管理员审核。
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate('/workbench')}
                className="w-full h-11 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all"
              >
                进入个人工作台
              </button>

              <button
                type="button"
                onClick={() => setShowJoinModal(true)}
                className="w-full h-11 rounded-md border border-[#8f35b7]/35 bg-[#8f35b7]/10 text-[#d292f4] text-sm hover:bg-[#8f35b7]/18 transition-all inline-flex items-center justify-center gap-2"
              >
                <Users size={16} />
                申请加入机构
              </button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full h-11 rounded-md border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                返回登录
              </button>
            </>
          )}
        </div>
      </div>

      {showForgotPassword && (
        <ForgotPasswordModal
          email={forgotEmail}
          code={forgotCode}
          newPassword={forgotNewPassword}
          confirmPassword={forgotConfirmPassword}
          result={forgotResult}
          codeSent={forgotCodeSent}
          onEmailChange={setForgotEmail}
          onCodeChange={setForgotCode}
          onNewPasswordChange={setForgotNewPassword}
          onConfirmPasswordChange={setForgotConfirmPassword}
          onSendCode={sendForgotCode}
          onSubmit={submitForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      )}

      {showJoinModal && (
        <JoinOrganizationModal
          onClose={() => setShowJoinModal(false)}
          onSubmit={submitJoinRequest}
        />
      )}
    </div>
  );
}
