import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

const ROLE_LABELS = {
  platform_admin: 'Admin',
  provider: 'Tour provider',
  provider_reviewer: 'Reviewer',
  catalog_staff: 'Catalog staff',
  moderator: 'Moderator',
  support: 'Support',
  traveler: 'Explorer',
};

// Sidebar footer shared by the pages that don't use TravelShell: the signed-in
// user's initials and role, portal shortcuts only for roles that can open them
// (same rules as TravelShell and the routes), and a real sign-out.
export default function SidebarAccount({ onNavigate }) {
  const { user, profile, roles = [], logout } = useAuth();
  const normalizedRoles = roles.map((item) => String(item).toLowerCase());
  const canManageInventory = normalizedRoles.some((item) => ['platform_admin', 'catalog_staff', 'provider_reviewer'].includes(item));
  const canManageAgentPlans = normalizedRoles.some((item) => ['provider', 'platform_admin'].includes(item));
  const displayName = profile?.full_name || user?.user_metadata?.full_name || profile?.username || user?.email?.split('@')[0] || 'Traveler';
  const initials = displayName.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'T';
  const primaryRole = ['platform_admin', 'provider', 'provider_reviewer', 'catalog_staff', 'moderator', 'support'].find((item) => normalizedRoles.includes(item)) || 'traveler';

  const handleLogout = async () => {
    await logout();
    onNavigate('auth', 'login');
  };

  return (
    <div className="border-t border-border-custom pt-4 px-6 space-y-4">
      {(canManageInventory || canManageAgentPlans) && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-navy/40 block text-left">Internal Portals</span>
          <div className="grid grid-cols-2 gap-2">
            {canManageInventory && (
              <button
                onClick={() => onNavigate('admin-inventory')}
                className="w-full text-center px-2 py-1.5 bg-navy text-white font-mono text-[11px] font-semibold rounded hover:bg-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
              >
                Admin
              </button>
            )}
            {canManageAgentPlans && (
              <button
                onClick={() => onNavigate('author-plan')}
                className="w-full text-center px-2 py-1.5 bg-teal-primary text-white font-mono text-[11px] font-semibold rounded hover:bg-teal-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
              >
                Agent Plan
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-border-custom/50">
        <div className="w-10 h-10 rounded-full bg-teal-primary/15 border border-teal-primary/20 text-teal-primary font-bold flex items-center justify-center text-sm font-serif">
          {initials}
        </div>
        <div className="text-left overflow-hidden">
          <span className="text-sm font-bold text-navy block truncate">{displayName}</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-navy/40 block">{ROLE_LABELS[primaryRole]}</span>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-navy/75 hover:text-red-600 rounded-lg hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary transition-colors text-left"
      >
        <LogOut size={18} />
        Log out
      </button>
    </div>
  );
}
