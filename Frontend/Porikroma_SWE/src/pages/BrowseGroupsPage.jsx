import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Users, Calendar, Compass, CreditCard, User, LogOut, Search, Filter,
  X, Check, AlertCircle, Loader2, ArrowRight, Menu
} from 'lucide-react';
import LogoIcon from '../components/LogoIcon';
import { BANGLADESH_OPEN_GROUPS } from '../mockData';

export default function BrowseGroupsPage({ onNavigate }) {
  const shouldReduceMotion = useReducedMotion();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Form Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [openSlotsOnly, setOpenSlotsOnly] = useState(false);
  const [dateFilter, setDateFilter] = useState(''); // E.g., 'summer', 'autumn'

  // Modal State
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Modal Focus Trap Ref
  const modalRef = useRef(null);
  const textareaRef = useRef(null);

  // Bangladesh open group trips dataset
  const [trips, setTrips] = useState(BANGLADESH_OPEN_GROUPS);

  // Sidebar Menu Items
  const menuItems = [
    { name: 'Dashboard', icon: <Compass size={18} />, active: false, action: () => onNavigate('dashboard') },
    { name: 'My Trips', icon: <Calendar size={18} />, active: false, action: () => onNavigate('dashboard') },
    { name: 'Browse Groups', icon: <Users size={18} />, active: true, action: () => onNavigate('browse-groups') },
    { name: 'Expenses', icon: <CreditCard size={18} />, active: false, action: () => onNavigate('expenses') },
    { name: 'Profile', icon: <User size={18} />, active: false, action: () => onNavigate('profile') }
  ];

  // Filtering Logic
  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSlots = !openSlotsOnly || trip.openSlots;
    const matchesDate = !dateFilter || trip.dateKey === dateFilter;
    return matchesSearch && matchesSlots && matchesDate;
  });

  // Modal Keyboard Dismissal & Focus Lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedTrip) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTrip]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (selectedTrip && textareaRef.current) {
      setTimeout(() => textareaRef.current.focus(), 150);
    }
  }, [selectedTrip]);

  const handleOpenModal = (trip) => {
    setSelectedTrip(trip);
    setAnswer('');
    setShowConfirmation(false);
  };

  const handleCloseModal = () => {
    setSelectedTrip(null);
    setAnswer('');
  };

  const handleSendRequest = (e) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowConfirmation(true);
      
      // Auto dismiss after a brief confirmation
      setTimeout(() => {
        handleCloseModal();
      }, 2000);
    }, 1500);
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

      {/* Persistent Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r border-border-custom py-8 flex flex-col justify-between z-30 transition-transform duration-300 lg:translate-x-0
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="space-y-8 px-6">
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

      {/* Main Content */}
      <main className="flex-grow lg:pl-64 min-h-screen flex flex-col">
        <div className="max-w-6xl mx-auto w-full px-6 py-8 md:py-12 flex-grow flex flex-col space-y-8">
          
          {/* Page Header */}
          <div className="text-left space-y-1">
            <h1 className="text-3xl font-serif text-navy">Browse group trips</h1>
            <p className="text-sm text-navy/60 font-normal">Join a trip already in motion.</p>
          </div>

          {/* Sticky Compact Filter Bar */}
          <div className="sticky top-0 lg:top-0 bg-white/95 backdrop-blur-md border border-border-custom rounded-xl px-5 py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 z-10">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-grow max-w-xl">
              {/* Search */}
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search destination..."
                  className="w-full pl-9 pr-4 py-2 border border-border-custom rounded-lg text-sm bg-white text-navy focus:outline-none focus:border-teal-primary focus:ring-1 focus:ring-teal-primary transition-all font-sans"
                />
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
              </div>

              {/* Date Filters Select */}
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full sm:w-[160px] pl-3 pr-8 py-2 border border-border-custom rounded-lg text-sm bg-white text-navy focus:outline-none focus:border-teal-primary focus:ring-1 focus:ring-teal-primary transition-all font-sans appearance-none"
                >
                  <option value="">Any Season</option>
                  <option value="spring">Spring 2026</option>
                  <option value="summer">Summer 2026</option>
                  <option value="autumn">Autumn 2026</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-navy/50 text-[10px]">▼</div>
              </div>
            </div>

            {/* Slots Toggle */}
            <div className="flex items-center gap-2.5 justify-end">
              <label htmlFor="open-slots-toggle" className="text-xs font-semibold text-navy/70 select-none cursor-pointer">
                Open slots only
              </label>
              <input
                id="open-slots-toggle"
                type="checkbox"
                checked={openSlotsOnly}
                onChange={(e) => setOpenSlotsOnly(e.target.checked)}
                className="w-4 h-4 text-teal-primary border-border-custom rounded focus:ring-teal-primary cursor-pointer"
              />
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-grow">
            <AnimatePresence mode="wait">
              {filteredTrips.length === 0 ? (
                // EMPTY STATE
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border border-dashed border-border-custom rounded-xl p-16 bg-white flex flex-col items-center justify-center text-center space-y-5"
                >
                  <div className="w-14 h-14 rounded-full bg-fog flex items-center justify-center text-navy/35">
                    <Search size={22} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-serif font-medium text-navy">No open trips match yet</h3>
                    <p className="text-sm text-navy/60 max-w-sm mx-auto">
                      Adjust your query variables or season parameters, or initialize your own travel space.
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('create-trip')}
                    className="inline-flex items-center gap-1.5 bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold px-4.5 py-2 rounded-lg transition-transform duration-150 hover:-translate-y-[0.5px] active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  >
                    Create your own trip instead
                    <ArrowRight size={14} />
                  </button>
                </motion.div>
              ) : (
                // RESULTS GRID
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left"
                >
                  {filteredTrips.map((trip, idx) => (
                    <motion.div
                      key={trip.id}
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 15 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0, 
                        transition: { delay: shouldReduceMotion ? 0 : idx * 0.05, duration: 0.4 } 
                      }}
                      whileHover={shouldReduceMotion ? {} : { y: -3 }}
                      className="bg-white border border-border-custom rounded-xl p-6 flex flex-col justify-between shadow-none transition-colors hover:border-teal-primary group"
                    >
                      <div className="space-y-4">
                        {/* Header Details */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-navy/40 font-semibold px-2 py-0.5 bg-fog border border-border-custom rounded-md">
                            Group
                          </span>
                          {trip.openSlots ? (
                            <span className="font-mono text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-teal-primary/10 border border-teal-primary/20 text-teal-primary rounded-md">
                              {trip.slotsLeft} {trip.slotsLeft === 1 ? 'slot' : 'slots'} open
                            </span>
                          ) : (
                            <span className="font-mono text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-navy/10 border border-navy/20 text-navy/60 rounded-md">
                              Closed
                            </span>
                          )}
                        </div>

                        {/* Title and Dates */}
                        <div className="space-y-1">
                          <h3 className="text-xl font-serif text-navy group-hover:text-teal-primary transition-colors">
                            {trip.destination}
                          </h3>
                          <span className="font-mono text-xs text-navy/55 block">
                            {trip.dates}
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-8 pt-4 border-t border-border-custom space-y-4">
                        {/* Creator & Cohort Avatar Stack */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border border-white font-serif ${trip.creatorBg}`}>
                              {trip.creator[0]}
                            </div>
                            <span className="text-xs text-navy/60 font-semibold">By {trip.creator}</span>
                          </div>

                          <div className="flex items-center -space-x-1.5">
                            {trip.members.map((m, i) => (
                              <div
                                key={i}
                                className={`w-6 h-6 rounded-full border border-white flex items-center justify-center text-[8px] font-serif font-bold ${m.bg}`}
                              >
                                {m.initial}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Trigger Join Button */}
                        <button
                          onClick={() => handleOpenModal(trip)}
                          disabled={!trip.openSlots}
                          className={`
                            w-full text-center text-xs font-semibold py-2 px-3 rounded-lg border transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary
                            ${trip.openSlots
                              ? 'border-teal-primary text-teal-primary hover:bg-teal-primary hover:text-white cursor-pointer'
                              : 'border-border-custom text-navy/40 cursor-not-allowed bg-fog'}
                          `}
                        >
                          {trip.openSlots ? "Request to join" : "Corridor full"}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* REQUEST TO JOIN MODAL OVERLAY */}
      <AnimatePresence>
        {selectedTrip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-navy"
            />

            {/* Modal Card Box */}
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-heading"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white border border-border-custom rounded-xl p-6 sm:p-8 w-full max-w-md relative z-10 shadow-lg text-left space-y-6"
            >
              
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 p-1.5 text-navy/50 hover:text-navy rounded-full hover:bg-fog focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                aria-label="Close details"
              >
                <X size={16} />
              </button>

              {showConfirmation ? (
                // SUCCESS STATE
                <div className="py-8 text-center space-y-5">
                  <div className="w-12 h-12 rounded-full bg-teal-primary/10 flex items-center justify-center mx-auto text-teal-primary">
                    <Check size={24} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 id="modal-heading" className="text-xl font-serif font-medium text-navy">Request sent</h3>
                    <p className="text-xs text-navy/60 max-w-[280px] mx-auto leading-relaxed">
                      The trip creator ({selectedTrip.creator}) will review your application parameters.
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="inline-flex justify-center bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold px-6 py-2 rounded-lg transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  >
                    Done
                  </button>
                </div>
              ) : (
                // FORM STATE
                <form onSubmit={handleSendRequest} className="space-y-6">
                  
                  {/* Screening Question heading */}
                  <div className="space-y-2.5">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-teal-primary font-bold block">Screening Question</span>
                    <h3 id="modal-heading" className="text-lg font-serif text-navy font-semibold leading-snug">
                      "{selectedTrip.question}"
                    </h3>
                  </div>

                  {/* Textarea answer */}
                  <div className="space-y-1.5 text-left relative">
                    <label htmlFor="screening-answer" className="block text-xs font-semibold uppercase tracking-wider text-navy/60">
                      Your answer
                    </label>
                    <textarea
                      ref={textareaRef}
                      id="screening-answer"
                      rows={4}
                      maxLength={180}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Share details about your availability and style..."
                      className="w-full px-3.5 py-2.5 border border-border-custom rounded-lg text-sm bg-white text-navy focus:outline-none focus:border-teal-primary focus:ring-1 focus:ring-teal-primary transition-all font-sans"
                    />
                    
                    {/* Character counter */}
                    <div className="text-[10px] font-mono text-navy/40 text-right">
                      {answer.length}/180 characters
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-border-custom gap-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="text-xs font-semibold text-navy/55 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!answer.trim() || isSubmitting}
                      className="inline-flex items-center justify-center bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold px-5 py-2.5 rounded-lg disabled:opacity-40 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary focus-visible:outline-offset-2 transition-all shadow-sm"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="animate-spin" size={12} />
                          Sending...
                        </span>
                      ) : (
                        "Send request"
                      )}
                    </button>
                  </div>

                </form>
              )}

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
