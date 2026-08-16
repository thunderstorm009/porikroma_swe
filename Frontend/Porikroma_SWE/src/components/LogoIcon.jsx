import React from 'react';

export default function LogoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 text-teal-primary fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" className="stroke-border-custom" strokeWidth="1.5" />
      <path d="M12 3a9 9 0 0 1 6.5 15.2M5.5 18.2A9 9 0 0 1 12 3" className="stroke-teal-primary" strokeWidth="2.5" />
      <line x1="12" y1="8" x2="12" y2="16" className="stroke-navy/30" strokeWidth="1" />
      <line x1="8" y1="12" x2="16" y2="12" className="stroke-navy/30" strokeWidth="1" />
      <circle cx="12" cy="3" r="2" fill="#D98E3D" stroke="none" />
      <circle cx="18.5" cy="12" r="1.5" fill="#2D6A4F" stroke="none" />
    </svg>
  );
}
