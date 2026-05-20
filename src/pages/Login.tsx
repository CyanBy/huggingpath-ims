import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

   localStorage.setItem('isLoggedIn', 'true');
window.dispatchEvent(new Event('authChange'));

const redirect = searchParams.get('redirect') || '/explore';
navigate(redirect, { replace: true });
  };

  return (
    <div className="min-h-[100dvh] bg-[#0f1014] text-[#e2e8f0] relative overflow-hidden flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(143,53,183,0.18),transparent_36%),radial-gradient(circle_at_80%_80%,rgba(143,53,183,0.12),transparent_32%)]" />

      <div className="relative z-10 w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-[#1f2024]/95 shadow-[0_24px_80px_rgba(0,0,0,0.48)] overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 mb-6">
            <Logo size={36} />
            <div>
              <div className="text-xl font-bold">HuggingPath</div>
              <div className="text-xs text-[#64748b] mt-1">IMS Demo Login</div>
            </div>
          </div>

          <div className="text-2xl font-extrabold mb-2">登录后继续分析</div>
          <div className="text-sm text-[#94a3b8] leading-6">
            当前为演示登录页，不进行真实账号密码校验。登录成功后将返回刚才的操作页面。
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-7">
          <div className="mb-4">
            <label className="block text-sm text-[#cbd5e1] mb-2">账号</label>
            <input
              type="text"
              defaultValue="demo"
              className="w-full h-11 rounded-lg border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
              placeholder="请输入账号"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-[#cbd5e1] mb-2">密码</label>
            <input
              type="password"
              defaultValue="123456"
              className="w-full h-11 rounded-lg border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
              placeholder="请输入密码"
            />
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-lg bg-[#8f35b7] text-white text-sm font-semibold hover:bg-[#a64ed0] transition-all"
          >
            登录
          </button>

          <button
            type="button"
            onClick={() => navigate('/explore')}
            className="w-full h-10 mt-3 rounded-lg border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm hover:text-[#e2e8f0] transition-all"
          >
            返回模型中心
          </button>
        </form>
      </div>
    </div>
  );
}