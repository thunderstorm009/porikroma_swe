import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  ArrowLeft, Edit, Users, Calendar, Check, X, ShieldAlert,
  Compass, CreditCard, User, LogOut, ArrowRight, Loader2, Sparkles
} from 'lucide-react';
import LogoIcon from '../components/LogoIcon';

export default function TripDetailPage({ onNavigate, trip, onUpdateTrip }) {
  const shouldReduceMotion = useReducedMotion();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Local state copy for edits to prevent side-effects until saved
  const [budgetInput, setBudgetInput] = useState(trip.budget || '');
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Edit Trip Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    destination: trip.destination || '',
    dates: trip.dates || '',
    type: trip.type || 'Group'
  });

  const handleSaveTripDetails = (e) => {
    e.preventDefault();
    onUpdateTrip({
      ...trip,
      destination: editForm.destination,
      dates: editForm.dates,
      type: editForm.type
    });
    setShowEditModal(false);
  };

  // Deletion confirmation state
  const [deletingMemberId, setDeletingMemberId] = useState(null);

  // Sidebar Menu Items
  const menuItems = [
    { name: 'Dashboard', icon: <Compass size={18} />, active: false },
    { name: 'My Trips', icon: <Calendar size={18} />, active: true },
    { name: 'Browse Groups', icon: <Users size={18} />, active: false },
    { name: 'Expenses', icon: <CreditCard size={18} />, active: false },
    { name: 'Profile', icon: <User size={18} />, active: false }
  ];

  if (!trip) {
    return (
      <div className="min-h-screen bg-[#F5F6F4]/40 flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <p className="text-sm text-navy/60">No trip selected or active.</p>
          <button onClick={() => onNavigate('dashboard')} className="text-teal-primary text-sm font-semibold hover:underline">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Derived Values
  const showJoinRequestsTab = trip.type === 'Group' && trip.joinRequests && trip.joinRequests.length > 0;
  const showRejoinRequests = trip.rejoinRequests && trip.rejoinRequests.length > 0;

  // Actions
  const handleApproveJoin = (request) => {
    // Add to members list
    const updatedMembers = [
      ...trip.members,
      {
        id: request.id,
        name: request.name,
        initial: request.initial,
        role: "Member",
        bg: request.bg
      }
    ];
    // Remove from join requests
    const updatedRequests = trip.joinRequests.filter(r => r.id !== request.id);
    
    onUpdateTrip({
      ...trip,
      members: updatedMembers,
      joinRequests: updatedRequests
    });

    // Speak announcement if accessibility enabled
    const msg = `Approved ${request.name}'s request to join.`;
    const utterance = new SpeechSynthesisUtterance(msg);
    window.speechSynthesis?.speak(utterance);
  };

  const handleRejectJoin = (request) => {
    const updatedRequests = trip.joinRequests.filter(r => r.id !== request.id);
    onUpdateTrip({
      ...trip,
      joinRequests: updatedRequests
    });

    const msg = `Rejected ${request.name}'s request to join.`;
    const utterance = new SpeechSynthesisUtterance(msg);
    window.speechSynthesis?.speak(utterance);
  };

  const handleRemoveMember = (memberId) => {
    const memberToRemove = trip.members.find(m => m.id === memberId);
    const updatedMembers = trip.members.filter(m => m.id !== memberId);
    // Add to rejoin requests for testing
    const updatedRejoin = [
      ...(trip.rejoinRequests || []),
      {
        id: memberToRemove.id,
        name: memberToRemove.name,
        initial: memberToRemove.initial,
        bg: memberToRemove.bg
      }
    ];

    onUpdateTrip({
      ...trip,
      members: updatedMembers,
      rejoinRequests: updatedRejoin
    });
    setDeletingMemberId(null);
  };

  const handleApproveRejoin = (request) => {
    const updatedMembers = [
      ...trip.members,
      {
        id: request.id,
        name: request.name,
        initial: request.initial,
        role: "Member",
        bg: request.bg
      }
    ];
    const updatedRejoin = trip.rejoinRequests.filter(r => r.id !== request.id);
    onUpdateTrip({
      ...trip,
      members: updatedMembers,
      rejoinRequests: updatedRejoin
    });
  };

  const handleRejectRejoin = (request) => {
    const updatedRejoin = trip.rejoinRequests.filter(r => r.id !== request.id);
    onUpdateTrip({
      ...trip,
      rejoinRequests: updatedRejoin
    });
  };

  const handleSaveBudget = (e) => {
    e.preventDefault();
    if (!budgetInput.trim()) return;

    setIsSavingBudget(true);
    setTimeout(() => {
      setIsSavingBudget(false);
      setBudgetSaved(true);
      onUpdateTrip({
        ...trip,
        budget: budgetInput,
        budgetPercent: 100 // Fully planned budget once user defines total
      });
      setTimeout(() => setBudgetSaved(false), 2500);
    }, 1200);
  };

  const handleGeneratePlan = () => {
    setIsGeneratingPlan(true);
    setTimeout(() => {
      setIsGeneratingPlan(false);
      onNavigate('plan-options', trip.id);
    }, 1200);
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
          <X size={20} />
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
                  if (item.name === 'Dashboard') {
                    onNavigate('dashboard');
                  } else if (item.name === 'Browse Groups') {
                    onNavigate('browse-groups');
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

        <div className="border-t border-border-custom pt-6 px-6 space-y-4">
          <div className="flex items-center gap-3">
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
        <div className="max-w-4xl mx-auto w-full px-6 py-8 md:py-12 flex-grow flex flex-col space-y-8">
          
          {/* Back Action button */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy/60 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded py-1 self-start transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>

          {/* Header Block */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-6 text-left">
            <div className="space-y-2">
              <div className="flex items-center flex-wrap gap-2.5">
                <h1 className="text-3xl sm:text-4xl font-serif text-navy tracking-tight">{trip.destination}</h1>
                <span className="font-mono text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-fog border border-border-custom rounded-md mt-1">
                  {trip.type}
                </span>
              </div>
              <span className="font-mono text-sm text-navy/55 block">
                {trip.dates}
              </span>
            </div>
            
            <button
              onClick={() => {
                setEditForm({
                  destination: trip.destination,
                  dates: trip.dates,
                  type: trip.type
                });
                setShowEditModal(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 border border-border-custom hover:border-teal-primary bg-white text-navy text-xs font-semibold px-3.5 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary shadow-2xs transition-colors cursor-pointer"
            >
              <Edit size={14} />
              Edit trip
            </button>
          </div>

          {/* Horizontal Scrollable Tabs bar */}
          <div className="w-full border-b border-border-custom overflow-x-auto scrollbar-none flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-xs font-semibold tracking-wider uppercase px-4 border-b-2 relative transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary ${
                activeTab === 'overview' ? 'border-teal-primary text-teal-primary font-bold' : 'border-transparent text-navy/55 hover:text-navy'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-3 text-xs font-semibold tracking-wider uppercase px-4 border-b-2 relative transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary ${
                activeTab === 'members' ? 'border-teal-primary text-teal-primary font-bold' : 'border-transparent text-navy/55 hover:text-navy'
              }`}
            >
              Members
            </button>
            
            {showJoinRequestsTab && (
              <button
                onClick={() => setActiveTab('requests')}
                className={`pb-3 text-xs font-semibold tracking-wider uppercase px-4 border-b-2 relative transition-colors flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary ${
                  activeTab === 'requests' ? 'border-teal-primary text-teal-primary font-bold' : 'border-transparent text-navy/55 hover:text-navy'
                }`}
              >
                Join Requests
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-accent/10 border border-amber-accent/20 text-amber-accent font-bold">
                  {trip.joinRequests.length}
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('budget')}
              className={`pb-3 text-xs font-semibold tracking-wider uppercase px-4 border-b-2 relative transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary ${
                activeTab === 'budget' ? 'border-teal-primary text-teal-primary font-bold' : 'border-transparent text-navy/55 hover:text-navy'
              }`}
            >
              Budget
            </button>
          </div>

          {/* TAB CONTENTS */}
          <div className="w-full py-4">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6 text-left"
                >
                  {/* Quiet Summary Card */}
                  <div className="bg-white border border-border-custom rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-navy/40 block">Trip Status</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-accent animate-pulse"></div>
                        <span className="font-bold text-navy text-lg uppercase tracking-wide">
                          {trip.status === "Planning" ? "Corridor Planning" : trip.status}
                        </span>
                      </div>
                      <p className="text-xs text-navy/60 font-normal leading-normal max-w-sm pt-0.5">
                        {trip.status === "Planning" 
                          ? "Defining dates, budget ceilings, and screening group join requests before finalizing optimal transit corridor plans."
                          : "This corridor planning has concluded."}
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('budget')}
                      className="inline-flex items-center gap-1.5 bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary shadow-sm w-full sm:w-auto text-center justify-center"
                    >
                      Continue to budget
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  {/* Auto Match layout for Solos */}
                  {trip.type === 'Solo' && trip.matchedCompanions && (
                    <div className="bg-teal-primary/5 border border-teal-primary/20 rounded-xl p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-primary/10 flex items-center justify-center text-teal-primary mt-0.5 flex-shrink-0">
                          <Sparkles size={16} />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-navy">Auto-match active</h4>
                          <p className="text-xs text-navy/70 leading-relaxed font-normal">
                            You've been matched with <strong className="font-semibold text-navy">2 other travelers</strong> heading to {trip.destination} on the same dates.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-11">
                        {trip.matchedCompanions.map((comp) => (
                          <div key={comp.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-border-custom rounded-full">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${comp.bg}`}>
                              {comp.initial}
                            </div>
                            <span className="text-[10px] font-semibold text-navy/75">{comp.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'members' && (
                <motion.div
                  key="members"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6 text-left"
                >
                  {/* Members list */}
                  <div className="bg-white border border-border-custom rounded-xl overflow-hidden divide-y divide-border-custom">
                    {trip.members.map((member) => (
                      <div key={member.id} className="px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-serif ${member.bg}`}>
                            {member.initial}
                          </div>
                          <div className="text-left">
                            <span className="text-sm font-bold text-navy block">{member.name}</span>
                            <span className="font-mono text-[9px] uppercase tracking-wider text-navy/40 block mt-0.5">
                              {member.role}
                            </span>
                          </div>
                        </div>

                        {/* Remove Action with confirm wrapper */}
                        {member.role !== "Creator" && member.id !== 1 && (
                          <div className="text-xs">
                            {deletingMemberId === member.id ? (
                              <div className="flex items-center gap-3 bg-red-50 border border-red-200/50 rounded-lg p-1.5">
                                <span className="font-semibold text-red-600 px-1 text-[11px]">Remove {member.name}?</span>
                                <button
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-2.5 py-1 rounded text-[10px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeletingMemberId(null)}
                                  className="text-navy/55 hover:text-navy px-1.5 py-1 text-[10px]"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingMemberId(member.id)}
                                className="text-red-600 hover:underline hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 rounded px-1"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Rejoin section */}
                  {showRejoinRequests && (
                    <div className="space-y-3 pt-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-navy/40">Rejoin Requests</h3>
                      <div className="bg-white border border-border-custom rounded-xl divide-y divide-border-custom">
                        {trip.rejoinRequests.map((request) => (
                          <div key={request.id} className="px-6 py-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-serif ${request.bg}`}>
                                {request.initial}
                              </div>
                              <div className="text-left">
                                <span className="text-sm font-bold text-navy block">{request.name}</span>
                                <span className="font-mono text-[9px] uppercase tracking-wider text-navy/40 block">Previous Member</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveRejoin(request)}
                                className="bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold px-3 py-1.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectRejoin(request)}
                                className="border border-border-custom hover:bg-fog text-navy text-xs font-semibold px-3 py-1.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </motion.div>
              )}

              {activeTab === 'requests' && showJoinRequestsTab && (
                <motion.div
                  key="requests"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4 text-left"
                >
                  {trip.joinRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      exit={{ opacity: 0, x: -80, transition: { duration: 0.25 } }}
                      className="bg-white border border-border-custom rounded-xl p-5 space-y-4 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-serif ${request.bg}`}>
                            {request.initial}
                          </div>
                          <span className="text-sm font-bold text-navy">{request.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveJoin(request)}
                            className="bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectJoin(request)}
                            className="border border-border-custom hover:bg-fog text-navy text-xs font-semibold px-3.5 py-1.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                          >
                            Reject
                          </button>
                        </div>
                      </div>

                      {/* Screen question answer quoted */}
                      <div className="bg-fog border border-border-custom/50 rounded-lg p-4">
                        <span className="font-mono text-[8px] uppercase tracking-wider text-navy/40 block mb-1">Answer to Screening Question</span>
                        <p className="font-serif italic text-sm text-navy/80 leading-relaxed">
                          "{request.answer}"
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'budget' && (
                <motion.div
                  key="budget"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6 text-left"
                >
                  <div className="bg-white border border-border-custom rounded-xl p-6 sm:p-8 space-y-6">
                    <div className="text-left space-y-1">
                      <h3 className="text-lg font-serif text-navy">Trip Budget Ceiling</h3>
                      <p className="text-xs text-navy/60">Set the total budget constraints for booking coordinates.</p>
                    </div>

                    <form onSubmit={handleSaveBudget} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 max-w-md">
                      <div className="space-y-1.5 flex-grow relative">
                        <label htmlFor="budget-ceiling" className="block text-xs font-semibold uppercase tracking-wider text-navy/70">
                          Total Budget
                        </label>
                        <div className="relative">
                          <input
                            id="budget-ceiling"
                            type="text"
                            value={budgetInput}
                            onChange={(e) => setBudgetInput(e.target.value)}
                            placeholder="25000.00"
                            disabled={isSavingBudget}
                            className="w-full pl-8 pr-4 py-2 border border-border-custom rounded-lg text-sm bg-white text-navy focus:outline-none focus:border-teal-primary focus:ring-1 focus:ring-teal-primary transition-all font-mono"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40 font-mono text-sm">৳</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingBudget || !budgetInput.trim()}
                        className="inline-flex items-center justify-center bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold py-2 px-5 rounded-lg disabled:opacity-40 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary h-10 shadow-sm"
                      >
                        {isSavingBudget ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={14} />
                            Saving...
                          </span>
                        ) : (
                          "Save budget"
                        )}
                      </button>
                    </form>

                    {budgetSaved && (
                      <div className="p-3 bg-teal-primary/10 border border-teal-primary/20 text-teal-primary text-xs rounded-lg font-medium flex items-center gap-1.5 max-w-sm">
                        <Check size={14} strokeWidth={3} /> Budget allocations updated successfully.
                      </div>
                    )}
                  </div>

                  {/* Plan Generator CTA */}
                  {trip.budget && (
                    <motion.div
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-border-custom rounded-xl p-6 sm:p-8 text-center space-y-4"
                    >
                      <div className="space-y-1">
                        <h4 className="font-serif text-lg text-navy">Budget targets active</h4>
                        <p className="text-xs text-navy/60 max-w-md mx-auto leading-relaxed">
                          Your budget ceiling of <strong className="font-mono text-teal-primary">৳{Number(trip.budget).toLocaleString()}</strong> is loaded. Sourcing optimal hotel, flight, and transit schedules.
                        </p>
                      </div>

                      <button
                        onClick={handleGeneratePlan}
                        disabled={isGeneratingPlan}
                        className="inline-flex items-center justify-center gap-2 bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-transform duration-150 hover:-translate-y-[0.5px] active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary shadow-sm"
                      >
                        {isGeneratingPlan ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={14} />
                            Sourcing corridors...
                          </span>
                        ) : (
                          "Generate plan options"
                        )}
                      </button>
                    </motion.div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* EDIT TRIP MODAL */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-navy/40 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white border border-border-custom rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-xl space-y-6 text-left z-10"
            >
              <div className="flex items-center justify-between border-b border-border-custom pb-4">
                <div>
                  <h3 className="text-xl font-serif text-navy">Edit Trip Space</h3>
                  <p className="text-xs text-navy/50">Update destination corridor details and dates.</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 text-navy/40 hover:text-navy rounded-full hover:bg-fog focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTripDetails} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="eDest" className="text-xs font-semibold text-navy/70 block">
                    Destination / Corridor Name
                  </label>
                  <input
                    id="eDest"
                    type="text"
                    required
                    value={editForm.destination}
                    onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                    className="w-full bg-fog border border-border-custom text-navy text-sm px-3.5 py-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="eDates" className="text-xs font-semibold text-navy/70 block">
                    Travel Dates
                  </label>
                  <input
                    id="eDates"
                    type="text"
                    required
                    placeholder="e.g. 06 OCT - 12 OCT 2026"
                    value={editForm.dates}
                    onChange={(e) => setEditForm({ ...editForm, dates: e.target.value })}
                    className="w-full bg-fog border border-border-custom text-navy font-mono text-sm px-3.5 py-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="eType" className="text-xs font-semibold text-navy/70 block">
                    Trip Arrangement
                  </label>
                  <select
                    id="eType"
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="w-full bg-fog border border-border-custom text-navy text-sm px-3.5 py-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  >
                    <option value="Group">Group</option>
                    <option value="Solo">Solo</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-navy/70 hover:text-navy border border-border-custom rounded-lg hover:bg-fog transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-teal-primary hover:bg-teal-hover rounded-lg transition-transform duration-150 active:scale-95 shadow-2xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
