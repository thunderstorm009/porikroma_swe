import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Compass, Calendar, Users, CreditCard, User, LogOut, Menu, X,
  Shield, Check, Lock, Camera
} from 'lucide-react';
import LogoIcon from '../components/LogoIcon';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage({ onNavigate }) {
  const { user, profile: authProfile } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'preferences' | 'security'
  const [isSaved, setIsSaved] = useState(false);

  // User Profile Form State
  const [userProfile, setUserProfile] = useState({
    fullName: "",
    email: "",
    phone: "+1 (555) 234-5678",
    location: "Munich, Germany",
    bio: "Avid hiker and cultural photographer. Learning Japanese for 2 years and looking to explore scenic walking corridors.",
    travelStyle: "Moderate / Scenic Walking",
    currency: "BDT (৳)",
    notifications: {
      emailInvites: true,
      groupMessages: true,
      budgetAlerts: true,
      agentUpdates: false
    }
  });

  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInputRef = React.useRef(null);
  const displayName = authProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler';
  const displayEmail = authProfile?.email || user?.email || userProfile.email;
  const displayRole = authProfile?.role || 'Traveler';
  React.useEffect(() => {
    if (!authProfile && !user) return;
    setUserProfile((current) => ({ ...current, fullName: authProfile?.full_name || user?.user_metadata?.full_name || current.fullName, email: authProfile?.email || user?.email || current.email, bio: authProfile?.bio || current.bio }));
  }, [authProfile, user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2500);
  };

  // Sidebar Menu Items
  const menuItems = [
    { name: 'Dashboard', icon: <Compass size={18} />, active: false, action: () => onNavigate('dashboard') },
    { name: 'My Trips', icon: <Calendar size={18} />, active: false, action: () => onNavigate('dashboard') },
    { name: 'Browse Groups', icon: <Users size={18} />, active: false, action: () => onNavigate('browse-groups') },
    { name: 'Expenses', icon: <CreditCard size={18} />, active: false, action: () => onNavigate('expenses') },
    { name: 'Profile', icon: <User size={18} />, active: true, action: () => {} }
  ];

  return (
    <div className="min-h-screen bg-[#F5F6F4]/40 text-navy font-sans flex flex-col lg:flex-row relative">
      
      {/* Mobile Top Header */}
      <div className="lg:hidden w-full h-16 bg-white border-b border-border-custom px-6 flex items-center justify-between sticky top-0 z-40">
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}
          className="flex items-center gap-2.5 font-serif text-xl font-semibold tracking-tight text-navy"
        >
          <LogoIcon />
          <span>Porikroma</span>
        </a>
        <button 
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 text-navy/80 hover:text-teal-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded"
          aria-label="Toggle navigation drawer"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Persistent Left Sidebar (Desktop) */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r border-border-custom py-8 flex flex-col justify-between z-30 transition-transform duration-300 lg:translate-x-0
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="space-y-8 px-6">
          <div className="flex items-center justify-between">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}
              className="flex items-center gap-2.5 font-serif text-2xl font-semibold tracking-tight text-navy focus-visible:outline-2 focus-visible:outline-teal-primary rounded"
            >
              <LogoIcon />
              <span>Porikroma</span>
            </a>
            {mobileSidebarOpen && (
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden p-1.5 text-navy/50 hover:text-navy rounded-full hover:bg-fog focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={`#${item.name.toLowerCase().replace(' ', '-')}`}
                onClick={(e) => {
                  e.preventDefault();
                  item.action();
                  if (mobileSidebarOpen) setMobileSidebarOpen(false);
                }}
                className={`
                  flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary
                  ${item.active 
                    ? 'bg-teal-primary/10 text-teal-primary' 
                    : 'text-navy/70 hover:text-teal-primary hover:bg-fog'}
                `}
              >
                {item.icon}
                {item.name}
              </a>
            ))}
          </nav>
        </div>

        {/* Internal Portals Quick-Switch & Logout */}
        <div className="border-t border-border-custom pt-4 px-6 space-y-4">
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-navy/40 block text-left">Internal Portals</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('admin-inventory')}
                className="w-full text-center px-2 py-1.5 bg-navy text-white font-mono text-[11px] font-semibold rounded hover:bg-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
              >
                Admin
              </button>
              <button
                onClick={() => onNavigate('author-plan')}
                className="w-full text-center px-2 py-1.5 bg-teal-primary text-white font-mono text-[11px] font-semibold rounded hover:bg-teal-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
              >
                Agent Plan
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-border-custom/50">
            <div className="w-10 h-10 rounded-full bg-teal-primary/15 border border-teal-primary/20 text-teal-primary font-bold flex items-center justify-center text-sm font-serif">
              SJ
            </div>
            <div className="text-left overflow-hidden">
              <span className="text-sm font-bold text-navy block truncate">{displayName}</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-navy/40 block">{displayRole}</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('landing')}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-navy/75 hover:text-red-600 rounded-lg hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary transition-colors text-left"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow lg:pl-64 min-h-screen flex flex-col">
        <div className="max-w-4xl mx-auto w-full px-6 py-8 md:py-12 flex-grow flex flex-col space-y-8 text-left">
          
          {/* Header */}
          <div className="border-b border-border-custom pb-6 space-y-2">
            <h1 className="text-3xl md:text-4xl font-serif text-navy">
              Account Profile & Settings
            </h1>
            <p className="text-sm text-navy/60 font-normal leading-relaxed">
              Manage your explorer identity, verification status, and group matching preferences.
            </p>
          </div>

          {/* User Profile Header Card */}
          <div className="bg-white border border-border-custom rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xs">
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="User avatar preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-teal-primary"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-teal-primary/15 border-2 border-teal-primary/30 text-teal-primary flex items-center justify-center font-serif text-2xl font-bold">
                    SJ
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 bg-white border border-border-custom rounded-full text-navy/70 hover:text-teal-primary shadow-2xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  title="Upload profile photo"
                  aria-label="Upload profile photo"
                >
                  <Camera size={12} />
                </button>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-serif text-navy">{displayName}</h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-primary/10 text-teal-primary border border-teal-primary/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                    <Shield size={10} /> {displayRole}
                  </span>
                </div>
                <span className="text-xs font-mono text-navy/50 block">{displayEmail}</span>
                <span className="text-xs text-navy/60 block">{userProfile.location}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end border-t sm:border-t-0 border-border-custom/50 pt-4 sm:pt-0">
              <span className="text-xs font-mono text-navy/50 uppercase tracking-widest">
                Member since July 2026
              </span>
            </div>
          </div>

          {/* Sub-navigation Tabs */}
          <div className="flex items-center gap-8 border-b border-border-custom pb-2" role="tablist">
            {[
              { id: 'profile', label: 'Personal Information' },
              { id: 'preferences', label: 'Matching & Travel Preferences' },
              { id: 'security', label: 'Security & Verification' }
            ].map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative text-xs font-semibold pb-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded-xs
                  ${activeTab === tab.id ? 'text-teal-primary' : 'text-navy/60 hover:text-navy'}
                `}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="profileTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-primary"
                  />
                )}
              </button>
            ))}
          </div>

          {/* TAB 1: PERSONAL INFO */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="bg-white border border-border-custom rounded-xl p-6 space-y-6 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="pName" className="text-xs font-semibold text-navy/70 block">
                    Full Name
                  </label>
                  <input
                    id="pName"
                    type="text"
                    required
                    value={userProfile.fullName}
                    onChange={(e) => setUserProfile({ ...userProfile, fullName: e.target.value })}
                    className="w-full bg-fog border border-border-custom text-navy text-sm px-3.5 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="pEmail" className="text-xs font-semibold text-navy/70 block">
                    Email Address
                  </label>
                  <input
                    id="pEmail"
                    type="email"
                    required
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                    className="w-full bg-fog border border-border-custom text-navy text-sm px-3.5 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="pPhone" className="text-xs font-semibold text-navy/70 block">
                    Phone Number
                  </label>
                  <input
                    id="pPhone"
                    type="tel"
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                    className="w-full bg-fog border border-border-custom text-navy font-mono text-sm px-3.5 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="pLoc" className="text-xs font-semibold text-navy/70 block">
                    Home Location
                  </label>
                  <input
                    id="pLoc"
                    type="text"
                    value={userProfile.location}
                    onChange={(e) => setUserProfile({ ...userProfile, location: e.target.value })}
                    className="w-full bg-fog border border-border-custom text-navy text-sm px-3.5 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="pBio" className="text-xs font-semibold text-navy/70 block">
                  Bio / Traveler Statement
                </label>
                <textarea
                  id="pBio"
                  rows={3}
                  value={userProfile.bio}
                  onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                  className="w-full bg-fog border border-border-custom text-navy text-sm px-3.5 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                />
                <p className="text-[11px] text-navy/50">
                  This bio is shown to group creators when you request to join discoverable trips.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom">
                {isSaved && (
                  <span className="text-xs font-mono text-teal-primary font-semibold flex items-center gap-1">
                    <Check size={14} /> Changes saved successfully
                  </span>
                )}
                <button
                  type="submit"
                  className="bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                >
                  Save changes
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PREFERENCES */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSaveProfile} className="bg-white border border-border-custom rounded-xl p-6 space-y-6 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="pStyle" className="text-xs font-semibold text-navy/70 block">
                    Preferred Travel Pace
                  </label>
                  <select
                    id="pStyle"
                    value={userProfile.travelStyle}
                    onChange={(e) => setUserProfile({ ...userProfile, travelStyle: e.target.value })}
                    className="w-full bg-fog border border-border-custom text-navy text-sm px-3.5 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  >
                    <option value="Relaxed / Leisure">Relaxed / Leisure</option>
                    <option value="Moderate / Scenic Walking">Moderate / Scenic Walking</option>
                    <option value="Active / Fast Pace">Active / Fast Pace</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="pCurr" className="text-xs font-semibold text-navy/70 block">
                    Default Currency
                  </label>
                  <select
                    id="pCurr"
                    value={userProfile.currency}
                    onChange={(e) => setUserProfile({ ...userProfile, currency: e.target.value })}
                    className="w-full bg-fog border border-border-custom text-navy text-sm px-3.5 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  >
                    <option value="BDT (৳)">BDT (৳)</option>
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Checkbox Preferences */}
              <div className="space-y-3 pt-2 border-t border-border-custom">
                <span className="text-xs font-mono uppercase tracking-wider text-navy/50 block">Notifications & Alerts</span>
                
                {[
                  { key: 'emailInvites', label: 'Email alerts when invited to join group trips' },
                  { key: 'groupMessages', label: 'Group message notifications and join request updates' },
                  { key: 'budgetAlerts', label: 'Budget over-run alerts in expense tracker' },
                  { key: 'agentUpdates', label: 'Travel agent plan publishing notifications' }
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-3 text-xs text-navy cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userProfile.notifications[item.key]}
                      onChange={(e) => setUserProfile({
                        ...userProfile,
                        notifications: { ...userProfile.notifications, [item.key]: e.target.checked }
                      })}
                      className="w-4 h-4 text-teal-primary border-border-custom rounded focus:ring-teal-primary"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom">
                {isSaved && (
                  <span className="text-xs font-mono text-teal-primary font-semibold flex items-center gap-1">
                    <Check size={14} /> Preferences updated
                  </span>
                )}
                <button
                  type="submit"
                  className="bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                >
                  Save preferences
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <div className="bg-white border border-border-custom rounded-xl p-6 space-y-6 shadow-2xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-fog rounded-lg border border-border-custom">
                  <div className="flex items-center gap-3">
                    <Shield className="text-teal-primary" size={20} />
                    <div>
                      <h4 className="text-sm font-semibold text-navy">Identity Verification</h4>
                      <p className="text-xs text-navy/60">Passport/ID verified for solo companion matching eligibility.</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-teal-primary/10 border border-teal-primary/20 text-teal-primary text-xs font-mono font-bold rounded">
                    Verified
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-fog rounded-lg border border-border-custom">
                  <div className="flex items-center gap-3">
                    <Lock className="text-navy/70" size={20} />
                    <div>
                      <h4 className="text-sm font-semibold text-navy">Two-Factor Authentication</h4>
                      <p className="text-xs text-navy/60">Add an extra layer of security to your traveler account.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => alert("Two-factor authentication setup initialized.")}
                    className="px-3 py-1.5 border border-border-custom hover:border-teal-primary text-xs font-semibold text-navy bg-white rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  >
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
