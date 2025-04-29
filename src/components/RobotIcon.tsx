import React from 'react';

interface RobotIconProps {
  className?: string;
}

const RobotIcon: React.FC<RobotIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Head Outer */}
      <path
        d="M15 40 C15 20 35 10 50 10 C65 10 85 20 85 40 V50 C85 70 65 80 50 80 C35 80 15 70 15 50 V40Z"
        fill="#E5E7EB"
      />
      
      {/* Screen Background */}
      <path
        d="M20 40 C20 25 35 15 50 15 C65 15 80 25 80 40 V45 C80 60 65 70 50 70 C35 70 20 60 20 45 V40Z"
        fill="#1E293B"
      />

      {/* Eyes and Smile - Glowing Effect */}
      <g filter="url(#glow)">
        {/* Left Eye */}
        <path
          d="M35 35 C35 32 38 30 40 30 C42 30 45 32 45 35 V35 C45 35 42 37 40 37 C38 37 35 35 35 35Z"
          fill="#5EEAD4"
        />
        
        {/* Right Eye */}
        <path
          d="M55 35 C55 32 58 30 60 30 C62 30 65 32 65 35 V35 C65 35 62 37 60 37 C58 37 55 35 55 35Z"
          fill="#5EEAD4"
        />
        
        {/* Smile */}
        <path
          d="M45 50 Q50 53 55 50"
          stroke="#5EEAD4"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>

      {/* Ears */}
      <rect x="5" y="30" width="10" height="25" rx="5" fill="#E5E7EB" />
      <rect x="85" y="30" width="10" height="25" rx="5" fill="#E5E7EB" />

      {/* Body */}
      <path
        d="M25 75 Q50 85 75 75 L75 105 Q50 115 25 105 Z"
        fill="#E5E7EB"
      />

      {/* Body Line Detail */}
      <path
        d="M35 90 L65 90"
        stroke="#D1D5DB"
        strokeWidth="2"
      />

      {/* Glow Filter */}
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.368627451   
                    0 0 0 0 0.917647059   
                    0 0 0 0 0.831372549  
                    0 0 0 1 0"
          />
        </filter>
      </defs>
    </svg>
  );
};

export default RobotIcon; 