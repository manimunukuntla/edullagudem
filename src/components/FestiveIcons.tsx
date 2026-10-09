import React from 'react';

export function DiyaIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Flame glow */}
      <path
        d="M24 4C24 4 19 12 19 17C19 20 21 22 24 22C27 22 29 20 29 17C29 12 24 4 24 4Z"
        fill="url(#flame_gradient)"
      />
      {/* Inner flame */}
      <path
        d="M24 10C24 10 21 14 21 17C21 18.5 22.3 20 24 20C25.7 20 27 18.5 27 17C27 14 24 10 24 10Z"
        fill="#FEF08A"
      />
      {/* Lamp bowl */}
      <path
        d="M8 25C8 33.8 15.2 41 24 41C32.8 41 40 33.8 40 25C40 24 39.5 24 38 25C34 27.5 29 28.5 24 28.5C19 28.5 14 27.5 10 25C8.5 24 8 24 8 25Z"
        fill="url(#diya_brass_gradient)"
      />
      {/* Base */}
      <path
        d="M17 41C17 41 18 45 24 45C30 45 31 41 31 41H17Z"
        fill="#92400E"
      />
      <defs>
        <linearGradient id="flame_gradient" x1="24" y1="4" x2="24" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="0.6" stopColor="#EA580C" />
          <stop offset="1" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id="diya_brass_gradient" x1="8" y1="24" x2="40" y2="41" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="0.5" stopColor="#D97706" />
          <stop offset="1" stopColor="#78350F" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function KalasamIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Coconut */}
      <circle cx="24" cy="14" r="8" fill="#78350F" />
      {/* Mango Leaves */}
      <path d="M16 18C13 14 12 8 18 10C18 13 17 16 16 18Z" fill="#15803D" />
      <path d="M32 18C35 14 36 8 30 10C30 13 31 16 32 18Z" fill="#15803D" />
      <path d="M24 12C21 8 24 3 27 5C26 8 25 10 24 12Z" fill="#22C55E" />
      {/* Pot */}
      <path
        d="M14 22H34L37 28C38 34 33 42 24 42C15 42 10 34 11 28L14 22Z"
        fill="url(#kalasam_gold)"
      />
      {/* Red sacred thread / kumkum */}
      <path d="M12 28C16 32 32 32 36 28" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M15 34C18 37 30 37 33 34" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="kalasam_gold" x1="10" y1="22" x2="38" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function TempleArchIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4L34 16H14L24 4Z" fill="#D97706" />
      <path d="M24 2V6" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round" />
      <rect x="12" y="16" width="24" height="6" fill="#B45309" rx="1" />
      <path d="M15 22V42H20V29C20 26.8 21.8 25 24 25C26.2 25 28 26.8 28 29V42H33V22H15Z" fill="#991B1B" />
      <rect x="8" y="42" width="32" height="4" fill="#78350F" rx="1" />
    </svg>
  );
}

export function OmSymbol({ className = "w-6 h-6 text-amber-500" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center font-bold text-lg select-none ${className}`} style={{ fontFamily: 'sans-serif' }}>
      ॐ
    </span>
  );
}
