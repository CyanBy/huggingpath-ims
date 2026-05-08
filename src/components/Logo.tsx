import type { FC } from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

const Logo: FC<LogoProps> = ({ size = 32, showText = false, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer lens circle */}
        <circle cx="16" cy="16" r="14" stroke="#8f35b7" strokeWidth="1.5" fill="rgba(143,53,183,0.08)" />
        {/* Inner lens ring */}
        <circle cx="16" cy="16" r="9" stroke="#8f35b7" strokeWidth="1" strokeOpacity="0.5" fill="none" />
        {/* Central lens */}
        <circle cx="16" cy="16" r="5" fill="#8f35b7" fillOpacity="0.15" stroke="#8f35b7" strokeWidth="1" />
        {/* Neural nodes - top */}
        <circle cx="16" cy="5" r="2" fill="#8f35b7" />
        {/* Neural nodes - right */}
        <circle cx="25" cy="12" r="1.5" fill="#b86bdd" />
        {/* Neural nodes - bottom right */}
        <circle cx="22" cy="24" r="1.5" fill="#b86bdd" />
        {/* Neural nodes - bottom left */}
        <circle cx="10" cy="24" r="1.5" fill="#b86bdd" />
        {/* Neural nodes - left */}
        <circle cx="7" cy="12" r="1.5" fill="#b86bdd" />
        {/* Connection lines */}
        <line x1="16" y1="7" x2="16" y2="11" stroke="#8f35b7" strokeWidth="0.75" strokeOpacity="0.6" />
        <line x1="23.5" y1="13" x2="20" y2="15" stroke="#8f35b7" strokeWidth="0.75" strokeOpacity="0.6" />
        <line x1="20.5" y1="22.5" x2="19" y2="19.5" stroke="#8f35b7" strokeWidth="0.75" strokeOpacity="0.6" />
        <line x1="11.5" y1="22.5" x2="13" y2="19.5" stroke="#8f35b7" strokeWidth="0.75" strokeOpacity="0.6" />
        <line x1="8.5" y1="13" x2="12" y2="15" stroke="#8f35b7" strokeWidth="0.75" strokeOpacity="0.6" />
      </svg>
      {showText && (
        <span className="text-[#e2e8f0] font-semibold text-lg tracking-tight">HuggingPath</span>
      )}
    </div>
  );
};

export default Logo;
