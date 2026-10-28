import React from "react";

interface MCBCartIconProps {
  className?: string;
  iconClassName?: string;
  count?: number;
  badgeClassName?: string;
}

export const MCBCartIcon: React.FC<MCBCartIconProps> = ({
  className = "relative inline-flex items-center justify-center",
  iconClassName = "w-6 h-6 text-gray-800 dark:text-white",
  count = 0,
  badgeClassName = "absolute -top-2 -right-2.5 bg-[#FF5500] text-white text-[9px] font-black tracking-tight w-[20px] h-[20px] rounded-full aspect-square flex items-center justify-center p-0 shadow-xs pointer-events-none select-none z-10 shrink-0 border border-white dark:border-card",
}) => {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={iconClassName}
      >
        {/* Cart handle & basket */}
        <path d="M3 4h3l2.2 10.2a1.8 1.8 0 0 0 1.75 1.4h8.8a1.8 1.8 0 0 0 1.75-1.4l1.5-6.5H7.5" />
        {/* Wheels */}
        <circle cx="10" cy="19.5" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="17.5" cy="19.5" r="1.2" fill="currentColor" stroke="none" />
      </svg>
      {/* Orange Badge */}
      <span className={badgeClassName}>
        <span className="leading-none text-center flex items-center justify-center">{count}</span>
      </span>
    </div>
  );
};

export default MCBCartIcon;
