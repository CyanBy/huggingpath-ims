import { Github, Twitter, MessageCircle } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-[#111217] border-t border-white/[0.06]">
      <div className="section-container py-12">
        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1 - Brand */}
          <div className="flex flex-col gap-4">
            <Logo size={32} showText />
            <p className="text-[#94a3b8] text-sm leading-relaxed max-w-[260px]">
              开源病理AI模型的统一运行与评估工作台
            </p>
            <div className="flex items-center gap-3 mt-1">
              <a
                href="https://github.com/AI4DigitalPathology"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-lg text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all duration-150"
                aria-label="GitHub"
              >
                <Github size={18} />
              </a>
              <a
                href="#"
                className="flex items-center justify-center w-9 h-9 rounded-lg text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all duration-150"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="flex items-center justify-center w-9 h-9 rounded-lg text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all duration-150"
                aria-label="Discord"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Column 2 - Product */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[#e2e8f0] font-semibold text-sm mb-1">产品</h4>
            <a href="#/explore" className="text-[#94a3b8] hover:text-[#e2e8f0] text-sm transition-colors duration-150">
              探索模型
            </a>
            <a href="#/workbench" className="text-[#94a3b8] hover:text-[#e2e8f0] text-sm transition-colors duration-150">
              工作台
            </a>
            <a href="#/datasets" className="text-[#94a3b8] hover:text-[#e2e8f0] text-sm transition-colors duration-150">
              数据集
            </a>
            <a href="#" className="text-[#94a3b8] hover:text-[#e2e8f0] text-sm transition-colors duration-150">
              文档
            </a>
          </div>

          {/* Column 3 - Resources */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[#e2e8f0] font-semibold text-sm mb-1">资源</h4>
            <a href="#" className="text-[#94a3b8] hover:text-[#e2e8f0] text-sm transition-colors duration-150">
              API文档
            </a>
            <a href="#" className="text-[#94a3b8] hover:text-[#e2e8f0] text-sm transition-colors duration-150">
              模型接入指南
            </a>
            <a href="#" className="text-[#94a3b8] hover:text-[#e2e8f0] text-sm transition-colors duration-150">
              社区论坛
            </a>
            <a href="#" className="text-[#94a3b8] hover:text-[#e2e8f0] text-sm transition-colors duration-150">
              基准测试
            </a>
          </div>

          {/* Column 4 - Legal */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[#e2e8f0] font-semibold text-sm mb-1">法律</h4>
            <a href="#" className="text-[#94a3b8] hover:text-[#e2e8f0] text-sm transition-colors duration-150">
              隐私政策
            </a>
            <a href="#" className="text-[#94a3b8] hover:text-[#e2e8f0] text-sm transition-colors duration-150">
              用户协议
            </a>
            <a href="#" className="text-[#94a3b8] hover:text-[#e2e8f0] text-sm transition-colors duration-150">
              免责声明
            </a>
            <a href="#" className="text-[#94a3b8] hover:text-[#e2e8f0] text-sm transition-colors duration-150">
              合规声明
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[#475569] text-xs text-center sm:text-left">
            © 2025 HuggingPath. 仅供研究参考，不构成医疗建议。
          </p>
          <p className="text-[#475569] text-xs">
            开源项目 · MIT License
          </p>
        </div>
      </div>
    </footer>
  );
}
