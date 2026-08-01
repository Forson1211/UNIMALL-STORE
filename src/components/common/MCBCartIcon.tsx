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
  badgeClassName = "absolute -top-1.5 -right-2 bg-[#FF5500] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs leading-none pointer-events-none select-none",
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
        {count}
      </span>
    </div>
  );
};

export default MCBCartIcon;
