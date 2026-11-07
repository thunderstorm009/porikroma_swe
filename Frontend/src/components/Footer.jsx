import React from 'react';
import LogoIcon from './LogoIcon';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border-custom py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <LogoIcon />
          <span className="font-serif text-xl font-semibold tracking-tight text-navy">
            <span className="text-teal-primary font-bold">P</span>orikroma
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          <a href="#how-it-works" className="text-sm text-navy/60 hover:text-teal-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded px-1">How it works</a>
          <a href="#privacy" className="text-sm text-navy/60 hover:text-teal-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded px-1">Privacy Policy</a>
          <a href="#terms" className="text-sm text-navy/60 hover:text-teal-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded px-1">Terms of Service</a>
          <a href="#security" className="text-sm text-navy/60 hover:text-teal-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded px-1">Security Operations</a>
        </div>

        <div className="font-mono text-[10px] text-navy/40 tracking-wider">
          &copy; 2026 PORIKROMA TECHNOLOGIES, INC.
        </div>
      </div>
    </footer>
  );
}
