import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Github, Menu, X, ChevronDown } from 'lucide-react';
import Logo from './Logo';

const navLinks = [
  { label: '模型中心', path: '/explore' },
  { label: '研究项目', path: '/datasets' },
  { label: '关于', path: '/about' },
];

const workbenchLinks = [
  { label: '分析队列', path: '/workbench' },
  { label: '病例库', path: '/workbench/other' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isModelCenterActive =
    location.pathname === '/explore' || location.pathname.startsWith('/model/');

  const isWorkbenchActive = location.pathname.startsWith('/workbench');

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${
        scrolled
          ? 'bg-[#1f2024]/85 backdrop-blur-xl border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="section-container h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2 shrink-0">
          <Logo size={32} />
          <span className="text-[#e2e8f0] font-semibold text-lg tracking-tight hidden sm:block">
            HuggingPath
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {/* 模型中心 */}
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

          {/* 工作台 dropdown */}
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

          {/* 研究项目 / 关于 */}
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

        {/* Right side: Search + GitHub + Mobile toggle */}
        <div className="flex items-center gap-3">
          {/* Search box - desktop */}
          <div className="hidden md:flex items-center relative">
            <Search size={16} className="absolute left-3 text-[#64748b] pointer-events-none" />
            <input
              type="text"
              placeholder="搜索模型、研究项目..."
              className="input-field h-10 w-[280px] pl-9 pr-3 text-sm"
            />
          </div>

          {/* GitHub link */}
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

          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all duration-150"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#1f2024]/95 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="section-container py-4 flex flex-col gap-1">
            {/* Mobile search */}
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
          </div>
        </div>
      )}
    </header>
  );
}