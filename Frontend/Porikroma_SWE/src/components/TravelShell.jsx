import { useState } from 'react';
import { ArrowLeft, Bot, Calendar, Compass, CreditCard, LogOut, Menu, MessageCircle, Settings, User, Users, X } from 'lucide-react';
import LogoIcon from './LogoIcon';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';

export default function TravelShell({ children, onNavigate, onGoBack, theme, onToggleTheme, active = 'Dashboard', title = 'Your travel map' }) {
  const [open, setOpen] = useState(false);
  const { logout, user, profile, roles = [] } = useAuth();
  const normalizedRoles = roles.map((item) => String(item).toLowerCase());
  const canManageInventory = normalizedRoles.some((item) => ['platform_admin', 'catalog_staff', 'provider_reviewer'].includes(item));
  const canManageAgentPlans = normalizedRoles.some((item) => ['provider', 'platform_admin'].includes(item));
  const displayName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  
  const handleLogout = async () => {
    await logout();
    // onAuthStateChange in AuthContext will handle state, we just navigate to login
    onNavigate('auth');
  };

  const links = [
    { name: 'Dashboard', icon: <Compass size={17} />, view: 'dashboard' },
    { name: 'My Trips', icon: <Calendar size={17} />, view: 'dashboard' },
    { name: 'AI Assistant', icon: <Bot size={17} />, view: 'ai-chat' },
    { name: 'Community', icon: <MessageCircle size={17} />, view: 'community' },
    { name: 'Browse Groups', icon: <Users size={17} />, view: 'browse-groups' },
    { name: 'Expenses', icon: <CreditCard size={17} />, view: 'expenses' },
    { name: 'Profile', icon: <User size={17} />, view: 'profile' }
  ];

  const go = (view) => { setOpen(false); onNavigate(view); };

  return (
    <div className="travel-app">
      <div className="travel-mobile-topbar">
        <div className="flex items-center gap-2">
          <button className="travel-icon-button" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
          {onGoBack && (
            <button className="travel-icon-button" onClick={onGoBack} aria-label="Go back" title="Go back">
              <ArrowLeft size={16} />
            </button>
          )}
        </div>
        <button className="travel-brand" onClick={() => go('dashboard')}><LogoIcon /><span><b>P</b>orikroma</span></button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      {open && <button className="travel-scrim" onClick={() => setOpen(false)} aria-label="Close navigation" />}
      <aside className={`travel-sidebar ${open ? 'is-open' : ''}`}>
        <div>
          <div className="travel-sidebar-brand-row">
            <button className="travel-brand" onClick={() => go('dashboard')}><LogoIcon /><span><b>P</b>orikroma</span></button>
            <button className="travel-icon-button mobile-only" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={18} /></button>
          </div>
          <div className="travel-overline">Workspace</div>
          <nav className="travel-nav" aria-label="Main navigation">
            {links.map((link) => <button key={link.name} className={active === link.name ? 'active' : ''} onClick={() => go(link.view)}>{link.icon}<span>{link.name}</span></button>)}
          </nav>
          {(canManageInventory || canManageAgentPlans) && <><div className="travel-sidebar-divider" />
          <div className="travel-overline">Planning tools</div>
          {canManageInventory && <button className="travel-nav-secondary" onClick={() => go('admin-inventory')}><Settings size={16} /> Inventory</button>}
          {canManageAgentPlans && <button className="travel-nav-secondary" onClick={() => go('author-plan')}><Compass size={16} /> Agent plans</button>}</>}
        </div>
        <div className="travel-sidebar-footer">
          <div className="travel-user-chip"><span className="avatar avatar-teal">{profile?.username?.[0]?.toUpperCase() || 'U'}</span><span><strong>{profile?.full_name || 'User'}</strong><small>{user?.email}</small></span></div>
          <button className="travel-nav-secondary" onClick={handleLogout}><LogOut size={16} /> Log out</button>
        </div>
      </aside>
      <main className="travel-main">
        <header className="travel-header">
          <div className="flex items-center gap-3">
            {onGoBack && (
              <button 
                onClick={onGoBack} 
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-custom bg-travel-surface text-navy/80 hover:text-teal-primary hover:border-teal-primary transition-colors text-xs font-semibold"
                title="Go back to previous page"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            )}
            <div><span className="travel-kicker">Porikroma / {active}</span><h1>{title}</h1></div>
          </div>
          <div className="travel-header-actions"><ThemeToggle theme={theme} onToggle={onToggleTheme} /><button className="travel-avatar-button" onClick={() => go('profile')} aria-label="Open profile">{initials}</button></div>
        </header>
        <div className="travel-content">{children}</div>
      </main>
    </div>
  );
}
