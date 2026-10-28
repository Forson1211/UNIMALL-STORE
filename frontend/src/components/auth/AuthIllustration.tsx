import React from "react";

export const AuthIllustration = ({ accentColor = "#FF5500" }: { accentColor?: string }) => {
  return (
    <div className="relative w-full max-w-[300px] lg:max-w-[340px] aspect-square flex items-center justify-center select-none">
      <svg
        viewBox="0 0 360 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        {/* Soft background glow circles */}
        <circle cx="180" cy="180" r="140" fill="#FFF7ED" fillOpacity="0.8" />
        <circle cx="280" cy="120" r="40" fill="#FED7AA" fillOpacity="0.4" />

        {/* Dotted curved path */}
        <path
          d="M 115 140 C 125 90, 245 80, 265 150 C 275 190, 265 210, 285 230"
          stroke="#FDBA74"
          strokeWidth="2.5"
          strokeDasharray="4 4"
          fill="none"
        />

        {/* Floating Passcode Dots Box */}
        <g transform="translate(105, 105)">
          <rect
            x="0"
            y="0"
            width="84"
            height="26"
            fill="#FFFFFF"
            stroke="#FDBA74"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <circle cx="20" cy="13" r="3.5" fill="#FF5500" />
          <circle cx="33" cy="13" r="3.5" fill="#FF5500" />
          <circle cx="46" cy="13" r="3.5" fill="#FF5500" />
          <circle cx="59" cy="13" r="3.5" fill="#FF5500" />
          <circle cx="71" cy="13" r="3.5" fill="#FF5500" />
        </g>

        {/* Floating Key badge */}
        <g transform="translate(250, 120)">
          <rect x="0" y="0" width="34" height="34" fill="#FFFFFF" stroke="#FDBA74" strokeWidth="1.5" />
          <circle cx="14" cy="14" r="5.5" fill="none" stroke="#EA580C" strokeWidth="2.5" />
          <path d="M18 18 L26 26 M23 23 L25 21 M25 25 L27 23" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Floating decorative dot */}
        <circle cx="235" cy="155" r="5" fill="#FF5500" />

        {/* Main Tablet / Card Device */}
        <g transform="translate(105, 155)">
          <rect
            x="0"
            y="0"
            width="185"
            height="120"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="2"
          />
          <rect x="0" y="0" width="185" height="18" fill="#F8FAFC" />

          {/* Form placeholder bars */}
          <rect x="20" y="32" width="110" height="14" fill="#F1F5F9" />
          <rect x="20" y="55" width="110" height="14" fill="#F1F5F9" />

          {/* Action button inside tablet */}
          <rect x="20" y="82" width="75" height="15" fill="#FF5500" />

          {/* Right badge: Lock Box */}
          <g transform="translate(140, 44)">
            <rect x="0" y="0" width="34" height="34" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
            <rect x="11" y="15" width="12" height="10" fill="#FF5500" />
            <path
              d="M13 15 V11 C13 8.8 14.8 7 17 7 C19.2 7 21 8.8 21 11 V15"
              stroke="#FF5500"
              strokeWidth="2"
              fill="none"
            />
          </g>
        </g>

        {/* Person standing on the left */}
        <g transform="translate(78, 150)">
          {/* Head & Hair */}
          <circle cx="28" cy="22" r="14" fill="#0F172A" />
          <circle cx="28" cy="23" r="11" fill="#FFE0BD" />
          <path
            d="M 17 22 Q 22 9 32 9 Q 39 9 41 20 Q 34 16 25 22 Z"
            fill="#0F172A"
          />

          {/* Torso / Suit */}
          <path
            d="M 14 44 L 20 90 L 38 90 L 44 44 Q 29 38 14 44 Z"
            fill="#0F172A"
          />
          <path d="M 26 42 L 29 50 L 32 42 Z" fill="#FFFFFF" />

          {/* Legs */}
          <rect x="20" y="90" width="8" height="42" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
          <rect x="30" y="90" width="8" height="42" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />

          {/* Shoes */}
          <rect x="17" y="132" width="12" height="4" fill="#0F172A" />
          <rect x="30" y="132" width="12" height="4" fill="#0F172A" />

          {/* Left Accent Shape behind person */}
          <path
            d="M 3 60 C -7 80, -4 110, 6 115 C 13 110, 15 85, 3 60 Z"
            fill="#FED7AA"
          />
        </g>

        {/* Small desktop plant on the right */}
        <g transform="translate(270, 230)">
          <path d="M 15 15 Q 12 0 0 5 Q 8 15 15 15 Z" fill="#FF5500" />
          <path d="M 15 15 Q 18 0 30 5 Q 22 15 15 15 Z" fill="#EA580C" />
          <path
            d="M 6 16 L 24 16 L 21 34 L 9 34 Z"
            fill="#0F172A"
          />
          <rect x="4" y="14" width="22" height="4" fill="#FF5500" />
        </g>

        {/* Ground Baseline */}
        <line x1="60" y1="288" x2="320" y2="288" stroke="#E2E8F0" strokeWidth="2" />

        {/* Small ground shadow/accent */}
        <rect x="210" y="286" width="18" height="4" fill="#FF5500" />
      </svg>
    </div>
  );
};

export default AuthIllustration;
