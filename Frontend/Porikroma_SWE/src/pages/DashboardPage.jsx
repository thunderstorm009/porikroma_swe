import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Plus, Users, Calendar, LogOut, X,
  Compass, CreditCard, User, Menu, AlertCircle
} from 'lucide-react';
import LogoIcon from '../components/LogoIcon';

export default function DashboardPage({ onNavigate, trips }) {
  const shouldReduceMotion = useReducedMotion();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isEmptyState, setIsEmptyState] = useState(false);
  
  // Interactive Pending Request state
  const [pendingRequests, setPendingRequests] = useState([
    { id: 1, name: "Lucas Vance", avatar: "L", trip: "Kyoto Autumn Walk" },
    { id: 2, name: "Clara Thorne", avatar: "C", trip: "Kyoto Autumn Walk" }
  ]);

  // Sidebar Menu Items
  const menuItems = [
    { name: 'Dashboard', icon: <Compass size={18} />, active: true },
    { name: 'My Trips', icon: <Calendar size={18} />, active: false },
    { name: 'Browse Groups', icon: <Users size={18} />, active: false },
    { name: 'Expenses', icon: <CreditCard size={18} />, active: false },
    { name: 'Profile', icon: <User size={18} />, active: false }
  ];

  const handleApproveAllRequests = () => {
    setPendingRequests([]);
  };

  const handleCreateNewTrip = () => {
    onNavigate('create-trip');
  };

  const toggleEmptyState = () => {
    setIsEmptyState(!isEmptyState);
  };

  // Motion variants for container/stagger
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F4]/40 text-navy font-sans flex flex-col lg:flex-row relative">
      
      {/* Mobile Top Header */}
      <div className="lg:hidden w-full h-16 bg-white border-b border-border-custom px-6 flex items-center justify-between sticky top-0 z-40">
        <a href="#" className="flex items-center gap-2.5 font-serif text-xl font-semibold tracking-tight text-navy">
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
          {/* Logo brand */}
          <div className="flex items-center justify-between">
            <a href="#" className="flex items-center gap-2.5 font-serif text-2xl font-semibold tracking-tight text-navy focus-visible:outline-2 focus-visible:outline-teal-primary rounded">
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

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={`#${item.name.toLowerCase().replace(' ', '-')}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (item.name === 'Browse Groups') {
                    onNavigate('browse-groups');
                  } else if (item.name === 'Dashboard') {
                    onNavigate('dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else if (item.name === 'My Trips') {
                    onNavigate('dashboard');
                    const tripsElement = document.getElementById('your-trips-section');
                    if (tripsElement) {
                      tripsElement.scrollIntoView({ behavior: 'smooth' });
                    }
                  } else if (item.name === 'Expenses') {
                    onNavigate('expenses');
                  } else if (item.name === 'Profile') {
                    onNavigate('profile');
                  }
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

        {/* Internal Portals Quick-Switch & User Account */}
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
                onClick={() => onNavigate('author-plan', trips[0]?.id || 1)}
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
              <span className="text-sm font-bold text-navy block truncate">Sarah Jenkins</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-navy/40 block">Explorer</span>
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
        <div className="max-w-6xl mx-auto w-full px-6 py-8 md:py-12 flex-grow flex flex-col space-y-8">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-6">
            <div className="text-left">
              <h1 className="text-3xl font-serif text-navy">
                Welcome back, Sarah
              </h1>
              <p className="text-sm text-navy/60 font-normal mt-1 leading-none">
                Your corridor parameters and matching schedules are active.
              </p>
            </div>
            
            {/* Primary Action Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleEmptyState}
                className="inline-flex items-center justify-center border border-border-custom hover:border-teal-primary bg-white text-navy text-xs font-semibold px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
              >
                {isEmptyState ? "Load mock trips" : "Simulate empty state"}
              </button>
              <button
                onClick={handleCreateNewTrip}
                className="inline-flex items-center justify-center gap-2 bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-transform duration-150 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary focus-visible:outline-offset-2 shadow-sm"
              >
                <Plus size={16} />
                Plan a new trip
              </button>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stat 1 */}
            <div className="bg-white border border-border-custom rounded-xl p-5 text-left flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-navy/40 block">Upcoming trips</span>
              <span className="font-mono text-3xl font-bold text-navy mt-2 block">
                {isEmptyState ? "0" : trips.filter(t => t.status !== "Completed").length}
              </span>
            </div>
            
            {/* Stat 2 */}
            <div className="bg-white border border-border-custom rounded-xl p-5 text-left flex flex-col justify-between relative">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold uppercase tracking-wider text-navy/40">Pending join requests</span>
                {!isEmptyState && pendingRequests.length > 0 && (
                  <span className="font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-accent/10 border border-amber-accent/20 text-amber-accent uppercase tracking-wider">
                    Awaiting
                  </span>
                )}
              </div>
              <span className="font-mono text-3xl font-bold text-navy mt-2 block">
                {isEmptyState ? "0" : pendingRequests.length}
              </span>
            </div>

            {/* Stat 3 */}
            <div className="bg-white border border-border-custom rounded-xl p-5 text-left flex flex-col justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-navy/40 block">This month's group spend</span>
              <span className="font-mono text-3xl font-bold text-teal-primary mt-2 block">
                {isEmptyState ? "৳0.00" : "৳43,400"}
              </span>
            </div>
          </div>

          {/* Interactive Pending Join Requests Banner List */}
          {!isEmptyState && pendingRequests.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-accent/5 border border-amber-accent/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-accent/15 flex items-center justify-center text-amber-accent mt-0.5 sm:mt-0 flex-shrink-0">
                  <AlertCircle size={18} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-navy">Join requests pending approval</h4>
                  <p className="text-xs text-navy/70 font-normal">
                    {pendingRequests.map(p => p.name).join(' and ')} want to join your <strong className="font-semibold">Kyoto Autumn Walk</strong> itinerary.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold pl-12 sm:pl-0">
                <button
                  onClick={handleApproveAllRequests}
                  className="text-teal-primary hover:text-teal-hover hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded"
                >
                  Approve applicants
                </button>
                <span className="text-navy/20">|</span>
                <button
                  onClick={() => alert("Applicant profile audit logs loaded.")}
                  className="text-navy/55 hover:text-navy hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded"
                >
                  Review profiles
                </button>
              </div>
            </motion.div>
          )}

          {/* Trips Section Header */}
          <div id="your-trips-section" className="text-left scroll-mt-6">
            <h2 className="text-xl font-serif font-medium text-navy">Your trips</h2>
          </div>

          {/* Grid Layout (Trips / Empty state) */}
          {isEmptyState || trips.length === 0 ? (
            // EMPTY STATE
            <div className="flex-grow border border-dashed border-border-custom rounded-xl p-12 md:p-20 bg-white flex flex-col items-center justify-center text-center space-y-6">
              {/* Quiet Line-Art Suitcase Illustration */}
              <div className="w-16 h-16 rounded-full bg-fog flex items-center justify-center text-navy/30" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-none stroke-current" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="7" width="18" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  <line x1="12" y1="11" x2="12" y2="17" />
                  <line x1="9" y1="14" x2="15" y2="14" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-serif font-medium text-navy">No trips yet</h3>
                <p className="text-sm text-navy/60 max-w-sm font-normal leading-relaxed">
                  Your travel map is open. Create a new trip space to define dates, invite companions, and plan budgets.
                </p>
              </div>
              <button
                onClick={handleCreateNewTrip}
                className="inline-flex items-center justify-center gap-2 bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-transform duration-150 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary focus-visible:outline-offset-2 shadow-sm"
              >
                <Plus size={16} />
                Plan a new trip
              </button>
            </div>
          ) : (
            // YOUR TRIPS GRID
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {trips.map((trip) => (
                <motion.div
                  key={trip.id}
                  variants={cardVariants}
                  whileHover={shouldReduceMotion ? {} : { y: -3 }}
                  className="bg-white border border-border-custom rounded-xl p-6 flex flex-col justify-between shadow-none transition-colors hover:border-teal-primary focus-within:ring-2 focus-within:ring-teal-primary focus-within:ring-offset-2 outline-none group cursor-pointer"
                  tabIndex={0}
                  onClick={() => onNavigate('trip-detail', trip.id)}
                >
                  <div className="space-y-4">
                    {/* Badge and Title */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-navy/40 font-semibold px-2 py-0.5 bg-fog border border-border-custom rounded-md">
                        {trip.type}
                      </span>
                      <span className={`font-mono text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md border ${trip.statusColor}`}>
                        {trip.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl font-serif text-navy group-hover:text-teal-primary transition-colors">
                        {trip.destination}
                      </h3>
                      <span className="font-mono text-xs text-navy/55 block">
                        {trip.dates}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-border-custom space-y-4">
                    {/* Budget progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-navy/40">
                        <span>Corridor budget</span>
                        <span className="font-bold text-navy/70">{trip.budgetPercent}% allocated</span>
                      </div>
                      <div className="w-full h-1.5 bg-fog rounded-full overflow-hidden border border-border-custom/50">
                        <div 
                          className="h-full bg-teal-primary rounded-full transition-all duration-500" 
                          style={{ width: `${trip.budgetPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Member stack */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center -space-x-2">
                        {trip.members.map((member, i) => (
                          <div 
                            key={i}
                            className={`w-7 h-7 rounded-full border border-white flex items-center justify-center text-[10px] font-serif font-bold ${member.bg}`}
                          >
                            {member.initial}
                          </div>
                        ))}
                        {trip.extraMembers > 0 && (
                          <div className="w-7 h-7 rounded-full bg-fog border border-white flex items-center justify-center text-[9px] font-mono font-semibold text-navy/60">
                            +{trip.extraMembers}
                          </div>
                        )}
                      </div>
                      
                      <span className="text-[10px] font-mono text-navy/40 uppercase tracking-widest hidden group-hover:inline transition-opacity duration-200">
                        View Space ➜
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
