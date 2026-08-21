import React from "react";

interface UnimallVerifiedBadgeProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  className?: string;
  title?: string;
}

export const UnimallVerifiedBadge: React.FC<UnimallVerifiedBadgeProps> = ({
  size = 16,
  color = "#FF5500",
  className = "",
  title = "Verified Campus Merchant",
  ...props
}) => {
  const badgeColor = color || "#FF5500";

  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      aria-label={title}
      {...props}
    >
      <title>{title}</title>
      {/* Exact 12-lobed scalloped verified seal in pure vibrant Orange */}
      <path
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.2.39-1.39-.02-2.92-1.1-3.99-1.07-1.08-2.6-1.49-3.99-1.1C14.44 2.4 13.2 1.52 11.77 1.52s-2.67.88-3.2 2.19c-1.39-.39-2.92.02-3.99 1.1-1.08 1.07-1.49 2.6-1.1 3.99C2.17 9.33 1.29 10.57 1.29 12s.88 2.67 2.19 3.2c-.39 1.39.02 2.92 1.1 3.99 1.07 1.08 2.6 1.49 3.99 1.1.53 1.31 1.77 2.19 3.2 2.19s2.67-.88 3.2-2.19c1.39.39 2.92-.02 3.99-1.1 1.08-1.07 1.49-2.6 1.1-3.99 1.31-.53 2.19-1.77 2.19-3.2z"
        fill={badgeColor}
      />
      {/* Crisp White Centered Checkmark */}
      <path
        d="M10.2 16.2l-3.5-3.5 1.42-1.42 2.08 2.08 6.08-6.08 1.42 1.42-7.5 7.5z"
        fill="#FFFFFF"
      />
    </svg>
  );
};

export default UnimallVerifiedBadge;
