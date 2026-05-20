import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Github,
  Menu,
  X,
  ChevronDown,
  UserCircle,
  LogOut,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import Logo from './Logo';

const navLinks = [
  { label: '模型中心', path: '/explore' },
  { label: '研究项目', path: '/datasets' },
  { label: '关于', path: '/about' },
];

const workbenchLinks = [
  { label: '分析队列', path: '/workbench' },
  { label: 'Case 管理', path: '/workbench/cases' },
  { label: '研究项目管理', path: '/workbench/projects' },
  { label: '模型管理', path: '/workbench/models' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    return 'dark';
  });

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const syncLoginState = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    };

    window.addEventListener('storage', syncLoginState);
    window.addEventListener('authChange', syncLoginState);

    return () => {
      window.removeEventListener('storage', syncLoginState);
      window.removeEventListener('authChange', syncLoginState);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const isModelCenterActive =
    location.pathname === '/explore' || location.pathname.startsWith('/model/');

  const isWorkbenchActive = location.pathname.startsWith('/workbench');
  const isAdminActive = location.pathname.startsWith('/admin');

  const goLogin = () => {
    const redirect = `${location.pathname}${location.search}`;
    navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
  };

  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setUserMenuOpen(false);
    window.dispatchEvent(new Event('authChange'));
  };

  const resetGuestUsage = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('guestAnalysisCount');
    setIsLoggedIn(false);
    setUserMenuOpen(false);
    window.dispatchEvent(new Event('authChange'));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
        scrolled
          ? 'bg-[#1f2024]/85 backdrop-blur-xl border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="section-container h-full flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2 shrink-0">
          <Logo size={32} />
          <span className="text-[#e2e8f0] font-semibold text-lg tracking-tight hidden sm:block">
            HuggingPath
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          <Link
            to="/explore"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
              isModelCenterActive
                ? 'bg-white/[0.08] text-[#e2e8f0]'
                : 'text-[#94a3b8] hover:text-[#e2e8f0]'
            }`}
          >
            模型中心
          </Link>

          <div className="relative group">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 inline-flex items-center gap-1 ${
                isWorkbenchActive
                  ? 'bg-white/[0.08] text-[#e2e8f0]'
                  : 'text-[#94a3b8] hover:text-[#e2e8f0]'
              }`}
            >
              工作台
              <ChevronDown size={14} className="opacity-80" />
            </button>

            <div className="absolute left-0 top-full pt-2 hidden group-hover:block">
              <div className="w-[148px] rounded-lg border border-white/[0.08] bg-[#1f2024]/98 backdrop-blur-xl shadow-[0_18px_48px_rgba(0,0,0,0.38)] p-1.5">
                {workbenchLinks.map((link) => {
                  const isActive = location.pathname === link.path;

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`h-9 px-3 rounded-md text-sm flex items-center transition-all duration-150 ${
                        isActive
                          ? 'bg-[#8f35b7]/25 text-[#e2e8f0]'
                          : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06]'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {navLinks
            .filter((link) => link.label !== '模型中心')
            .map((link) => {
              const isActive = location.pathname === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white/[0.08] text-[#e2e8f0]'
                      : 'text-[#94a3b8] hover:text-[#e2e8f0]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center relative">
            <Search size={16} className="absolute left-3 text-[#64748b] pointer-events-none" />
            <input
              type="text"
              placeholder="搜索模型、研究项目..."
              className="input-field h-10 w-[280px] pl-9 pr-3 text-sm"
            />
          </div>

          <a
            href="https://github.com/AI4DigitalPathology"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all duration-150"
            aria-label="GitHub"
            title="GitHub: AI4DigitalPathology"
          >
            <Github size={20} />
          </a>

          <Link
            to="/admin"
            className={`hidden xl:inline-flex h-9 px-3 rounded-lg border text-sm font-medium transition-all duration-150 items-center gap-2 ${
              isAdminActive
                ? 'border-[#8f35b7]/45 bg-[#8f35b7]/18 text-[#d292f4]'
                : 'border-white/[0.08] bg-[#202126] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06]'
            }`}
          >
            <ShieldCheck size={15} />
            后台管理
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="hidden xl:inline-flex h-9 px-3 rounded-lg border border-white/[0.08] bg-[#202126] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all duration-150 items-center gap-2 text-sm"
            title={theme === 'dark' ? '切换到明亮模式' : '切换到暗黑模式'}
          >
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
            {theme === 'dark' ? '暗色' : '亮色'}
          </button>

          {!isLoggedIn ? (
            <button
              onClick={goLogin}
              className="h-9 px-4 rounded-lg bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all duration-150"
            >
              登录
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="w-9 h-9 rounded-full border border-[#8f35b7]/40 bg-[#8f35b7]/20 text-[#d292f4] flex items-center justify-center hover:bg-[#8f35b7]/30 transition-all duration-150"
                title="用户菜单"
              >
                <UserCircle size={22} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-[44px] w-[150px] rounded-lg border border-white/[0.08] bg-[#1f2024]/98 backdrop-blur-xl shadow-[0_18px_48px_rgba(0,0,0,0.38)] p-1.5 z-[80]">
                  <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                    <div className="text-[#e2e8f0] text-sm font-medium">演示用户</div>
                    <div className="text-[#64748b] text-xs mt-0.5">已登录</div>
                  </div>

                  <button
                    onClick={logout}
                    className="w-full h-9 px-3 rounded-md text-sm text-[#94a3b8] hover:text-[#ff9c9c] hover:bg-white/[0.06] flex items-center gap-2 transition-all duration-150"
                  >
                    <LogOut size={15} />
                    退出登录
                  </button>

                  <button
                    onClick={resetGuestUsage}
                    className="w-full h-9 px-3 rounded-md text-sm text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] flex items-center gap-2 transition-all duration-150"
                  >
                    <LogOut size={15} />
                    重置游客次数
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all duration-150"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-[#1f2024]/95 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="section-container py-4 flex flex-col gap-1">
            <div className="flex items-center relative mb-3">
              <Search size={16} className="absolute left-3 text-[#64748b] pointer-events-none" />
              <input
                type="text"
                placeholder="搜索模型、研究项目..."
                className="input-field h-10 w-full pl-9 pr-3 text-sm"
              />
            </div>

            <Link
              to="/explore"
              className={`px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                isModelCenterActive
                  ? 'bg-white/[0.08] text-[#e2e8f0]'
                  : 'text-[#94a3b8] hover:text-[#e2e8f0]'
              }`}
            >
              模型中心
            </Link>

            <div className="px-3 pt-3 pb-1 text-xs text-[#64748b]">工作台</div>

            {workbenchLinks.map((link) => {
              const isActive = location.pathname === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`ml-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white/[0.08] text-[#e2e8f0]'
                      : 'text-[#94a3b8] hover:text-[#e2e8f0]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <Link
              to="/datasets"
              className={`px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                location.pathname === '/datasets'
                  ? 'bg-white/[0.08] text-[#e2e8f0]'
                  : 'text-[#94a3b8] hover:text-[#e2e8f0]'
              }`}
            >
              研究项目
            </Link>

            <Link
              to="/about"
              className={`px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                location.pathname === '/about'
                  ? 'bg-white/[0.08] text-[#e2e8f0]'
                  : 'text-[#94a3b8] hover:text-[#e2e8f0]'
              }`}
            >
              关于
            </Link>

            <Link
              to="/admin"
              className={`px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                isAdminActive
                  ? 'bg-white/[0.08] text-[#e2e8f0]'
                  : 'text-[#94a3b8] hover:text-[#e2e8f0]'
              }`}
            >
              后台管理
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="px-3 py-2.5 rounded-md text-sm font-medium text-left text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all duration-150 inline-flex items-center gap-2"
            >
              {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
              {theme === 'dark' ? '暗色模式' : '亮色模式'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}