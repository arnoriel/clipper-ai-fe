import type { SVGProps } from "react";

export const BrandLogo = ({ size = 24, className = "", style, ...props }: { size?: number | string; className?: string; style?: React.CSSProperties } & SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      {...props}
    >
      <defs>
        <mask id="logo-cut">
          <rect width="100" height="100" fill="white" />
          {/* The slash cutting the left arm, parallel to the right arm */}
          <line x1="32" y1="33" x2="0" y2="55" stroke="black" strokeWidth="8" />
        </mask>
      </defs>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 10 20 L 90 20 L 50 85 Z M 32 35 L 68 35 L 50 63 Z"
        mask="url(#logo-cut)"
      />
    </svg>
  );
};
