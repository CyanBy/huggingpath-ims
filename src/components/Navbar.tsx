import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Github, Menu, X } from 'lucide-react';
import Logo from './Logo';

const navLinks = [
  { label: '主页', path: '/home' },
  { label: '病例库', path: '/cases' },
  { label: '工作台', path: '/workbench' },
  { label: '探索', path: '/explore' },
  { label: '数据集', path: '/datasets' },
  { label: '关于', path: '/about' },
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
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Logo size={32} />
          <span className="text-[#e2e8f0] font-semibold text-lg tracking-tight hidden sm:block">
            HuggingPath
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
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
              placeholder="搜索模型、数据集..."
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
                placeholder="搜索模型、数据集..."
                className="input-field h-10 w-full pl-9 pr-3 text-sm"
              />
            </div>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white/[0.08] text-[#e2e8f0]'
                      : 'text-[#94a3b8] hover:text-[#e2e8f0]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
