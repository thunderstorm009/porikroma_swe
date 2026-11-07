import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Check, Lock, Camera
} from 'lucide-react';
import TravelShell from '../components/TravelShell';
import { useAuth } from '../contexts/useAuth';
import { apiClient } from '../services/apiClient';

export default function ProfilePage({ theme, onToggleTheme, onNavigate }) {
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'preferences' | 'security'
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // User Profile Form State
  const [userProfile, setUserProfile] = useState({
    fullName: "",
    email: "",
    // Start empty: these used to be sample values, and Save would write the sample bio to the account.
    phone: "",
    location: "",
    bio: "",
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
  const initials = displayName.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'T';
  const memberSince = authProfile?.created_at ? new Date(authProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null;
  React.useEffect(() => {
    if (!authProfile && !user) return;
    setUserProfile((current) => ({ ...current, fullName: authProfile?.full_name || user?.user_metadata?.full_name || current.fullName, email: authProfile?.email || user?.email || current.email, bio: authProfile?.bio ?? current.bio }));
  }, [authProfile, user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      await apiClient.patch('/api/v1/users/me', {
        full_name: userProfile.fullName,
        bio: userProfile.bio
      });
      if (refreshProfile) await refreshProfile();
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setSaveError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Sidebar Menu Items

  return (
    <TravelShell onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} active="Profile" title="Profile & settings">
      

      {/* Main Content Area */}
      <div className="text-navy font-sans text-left">
        <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col space-y-8 text-left">
          
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
                    {initials}
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
                {userProfile.location && <span className="text-xs text-navy/60 block">{userProfile.location}</span>}
              </div>
            </div>

            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end border-t sm:border-t-0 border-border-custom/50 pt-4 sm:pt-0">
              <span className="text-xs font-mono text-navy/50 uppercase tracking-widest">
                {memberSince ? `Member since ${memberSince}` : ''}
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
                    readOnly
                    title="Your sign-in email can't be changed here"
                    value={userProfile.email}
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
                    placeholder="+880 1XXX-XXXXXX"
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
                    placeholder="e.g. Chattogram"
                    onChange={(e) => setUserProfile({ ...userProfile, location: e.target.value })}
                    className="w-full bg-fog border border-border-custom text-navy text-sm px-3.5 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  />
                </div>
              </div>
              <p className="text-[11px] text-navy/50">Phone number and home location are not saved to your account yet; name and bio are.</p>

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

              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {saveError}
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom">
                {isSaved && (
                  <span className="text-xs font-mono text-teal-primary font-semibold flex items-center gap-1">
                    <Check size={14} /> Changes saved successfully
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary disabled:opacity-50"
                >
                  {isSaving ? 'Saving…' : 'Save changes'}
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
                    <Check size={14} /> Name and bio saved
                  </span>
                )}
                <span className="text-[11px] text-navy/50 mr-auto">Travel preferences and notification choices are not saved to your account yet.</span>
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
                      <p className="text-xs text-navy/60">Passport/ID verification for solo companion matching is not available yet.</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-navy/5 border border-border-custom text-navy/60 text-xs font-mono font-bold rounded">
                    Not available
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
                    onClick={() => alert("Two-factor authentication isn't available yet. We'll let you know when it ships.")}
                    className="px-3 py-1.5 border border-border-custom hover:border-teal-primary text-xs font-semibold text-navy bg-white rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  >
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </TravelShell>
  );
}
