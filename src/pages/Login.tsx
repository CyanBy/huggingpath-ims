import { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, Lock, Microscope, Shield, Sparkles, UserRound } from 'lucide-react';
import Logo from '../components/Logo';

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  navigate('/home');
};

  return (
    <div className="min-h-[100dvh] bg-[#0f1014] text-[#e2e8f0] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(143,53,183,0.22),transparent_34%),radial-gradient(circle_at_84%_68%,rgba(143,53,183,0.16),transparent_34%),linear-gradient(180deg,#111217_0%,#0b0c10_100%)]" />
      <div className="absolute inset-0 opacity-[0.08]" aria-hidden="true">
        <div className="absolute left-0 top-0 h-full w-full bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:52px_52px]" />
      </div>

      <main className="relative z-10 min-h-[100dvh] grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:flex flex-col justify-between px-16 py-12 border-r border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Logo size={38} />
            <div>
              <div className="text-xl font-semibold tracking-tight text-[#f1f3f6]">HuggingPath</div>
              <div className="text-xs text-[#64748b] mt-0.5">IMS Dark Theme</div>
            </div>
          </div>

          <div className="max-w-[560px]">
            <div className="inline-flex items-center gap-2 h-8 px-3 rounded bg-[rgba(143,53,183,0.18)] text-[#d292f4] text-xs font-semibold tracking-[0.12em] uppercase">
              <Sparkles size={14} />
              病理 AI 工作台
            </div>
            <h1 className="mt-7 text-[56px] leading-[1.08] font-bold tracking-[-1.6px] text-[#f1f3f6]">
              本地运行、数据安全、模型管理与 WSI 分析一体化平台
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#94a3b8] max-w-[520px]">
              登录后进入工作台，可继续浏览模型、运行分析任务、查看病理切片与 AI 结果。该登录页仅用于演示项目串联，不进行真实账号密码校验。
            </p>

            <div className="grid grid-cols-3 gap-4 mt-10">
              <div className="rounded-xl border border-white/[0.08] bg-[#202126]/80 p-4">
                <Shield className="text-[#b86bdd]" size={22} />
                <div className="text-sm font-semibold mt-3 text-[#f1f3f6]">数据安全</div>
                <div className="text-xs text-[#64748b] mt-1">本地分析</div>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#202126]/80 p-4">
                <Microscope className="text-[#b86bdd]" size={22} />
                <div className="text-sm font-semibold mt-3 text-[#f1f3f6]">WSI 阅片</div>
                <div className="text-xs text-[#64748b] mt-1">切片可视化</div>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#202126]/80 p-4">
                <Sparkles className="text-[#b86bdd]" size={22} />
                <div className="text-sm font-semibold mt-3 text-[#f1f3f6]">AI 分析</div>
                <div className="text-xs text-[#64748b] mt-1">模型运行</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-[#475569]">© 2026 HuggingPath. IMS 登录入口演示。</div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 lg:px-14">
          <div className="w-full max-w-[430px]">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <Logo size={36} />
              <div>
                <div className="text-xl font-semibold tracking-tight text-[#f1f3f6]">HuggingPath</div>
                <div className="text-xs text-[#64748b] mt-0.5">IMS 病理 AI 工作台</div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#202126]/92 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl overflow-hidden">
              <div className="px-8 pt-8 pb-6 border-b border-white/[0.06]">
                <div className="text-2xl font-bold text-[#f1f3f6]">登录系统</div>
                <div className="text-sm text-[#94a3b8] mt-2">输入任意账号和密码，点击登录进入工作台。</div>
              </div>

              <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
                <label className="block">
                  <span className="text-sm text-[#cbd5e1]">账号</span>
                  <div className="mt-2 h-12 rounded-lg border border-white/[0.08] bg-[#17181d] flex items-center px-3 gap-3 focus-within:border-[#8f35b7] transition-colors">
                    <UserRound size={18} className="text-[#64748b]" />
                    <input
                      className="w-full bg-transparent outline-none text-sm text-[#f1f3f6] placeholder:text-[#475569]"
                      placeholder="请输入账号"
                      autoComplete="username"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm text-[#cbd5e1]">密码</span>
                  <div className="mt-2 h-12 rounded-lg border border-white/[0.08] bg-[#17181d] flex items-center px-3 gap-3 focus-within:border-[#8f35b7] transition-colors">
                    <Lock size={18} className="text-[#64748b]" />
                    <input
                      type="password"
                      className="w-full bg-transparent outline-none text-sm text-[#f1f3f6] placeholder:text-[#475569]"
                      placeholder="请输入密码"
                      autoComplete="current-password"
                    />
                    <Eye size={18} className="text-[#64748b]" />
                  </div>
                </label>

                <div className="flex items-center justify-between text-sm">
                  <label className="inline-flex items-center gap-2 text-[#94a3b8] cursor-pointer select-none">
                    <input type="checkbox" className="accent-[#8f35b7]" />
                    记住账号
                  </label>
                  <button type="button" className="text-[#b86bdd] hover:text-[#d292f4] transition-colors">忘记密码？</button>
                </div>

                <button
                  type="submit"
                  className="w-full h-12 rounded-lg bg-[#8f35b7] hover:bg-[#a64ed0] text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(143,53,183,0.25)]"
                >
                  登录
                  <ArrowRight size={18} />
                </button>

                <div className="text-xs leading-relaxed text-[#64748b] bg-[#17181d] border border-white/[0.06] rounded-lg p-3">
                  当前登录页为演示入口，不进行真实账号密码验证；点击登录后直接进入工作台。
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}