import React, { useState } from 'react';
import { ArrowLeft, Menu, X } from 'lucide-react';
import LogoIcon from './LogoIcon';
import ThemeToggle from './ThemeToggle';

export default function Header({ onNavigate, onGoBack, navLinks, theme, onToggleTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-border-custom transition-all duration-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-custom text-navy/80 hover:text-teal-primary hover:border-teal-primary transition-colors text-xs font-semibold"
              title="Go back to previous page"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          )}
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}
            className="flex items-center gap-2.5 font-serif text-2xl font-semibold tracking-tight text-navy focus-visible:outline-2 focus-visible:outline-teal-primary rounded"
          >
            <LogoIcon />
            <span><span className="text-teal-primary font-bold">P</span>orikroma</span>
          </a>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => {
                if (link.name === 'For Travel Agents') {
                  e.preventDefault();
                  onNavigate('author-plan');
                } else if (link.name === 'Admin Inventory') {
                  e.preventDefault();
                  onNavigate('admin-inventory');
                }
              }}
              className="text-sm font-medium text-navy/80 hover:text-teal-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary px-2 py-1 rounded"
            >
              {link.name}
            </a>
          ))}
          {theme && <ThemeToggle theme={theme} onToggle={onToggleTheme} />}
          <button
            onClick={() => onNavigate('auth', 'login')}
            className="text-sm font-medium text-navy/80 hover:text-teal-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary px-2 py-1 rounded"
          >
            Log in
          </button>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <button
            onClick={() => onNavigate('auth', 'signup')}
            className="inline-flex items-center justify-center bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-transform duration-150 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary focus-visible:outline-offset-2"
          >
            Get started
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-navy/80 hover:text-teal-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border-custom bg-white px-6 py-4 space-y-4">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-navy/80 hover:text-teal-primary py-1 block focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary px-1 rounded"
              >
                {link.name}
              </a>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); onNavigate('auth', 'login'); }}
              className="text-left text-base font-medium text-navy/80 hover:text-teal-primary py-1 block focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary px-1 rounded w-full"
            >
              Log in
            </button>
          </nav>
          <div className="pt-2 border-t border-border-custom">
            {theme && <div className="pb-3"><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div>}
            <button
              onClick={() => { setMobileMenuOpen(false); onNavigate('auth', 'signup'); }}
              className="block w-full text-center bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold py-2.5 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary focus-visible:outline-offset-2"
            >
              Get started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
