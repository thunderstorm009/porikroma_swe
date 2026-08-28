import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  ArrowLeft, Compass, Calendar, Users, CreditCard, User, LogOut, Check,
  Hotel, Car, Ticket, RefreshCw, X, ArrowRight, Menu
} from 'lucide-react';
import LogoIcon from '../components/LogoIcon';

export default function PlanOptionsPage({ onNavigate, trip, agentPlan = null }) {
  const shouldReduceMotion = useReducedMotion();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const loadingPhrases = [
    "Checking available hotels...",
    "Matching vehicles to your route...",
    "Finalizing ticket options..."
  ];

  // Auto-rotate loading text
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loadingPhrases.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Simulate loading state on entry
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3800);
    return () => clearTimeout(timer);
  }, []);

  const handleRegenerate = () => {
    setIsLoading(true);
    setLoadingTextIndex(0);
    setSelectedPlanId(null);
    setTimeout(() => {
      setIsLoading(false);
    }, 3200);
  };

  const handleBack = () => {
    if (trip) {
      onNavigate('trip-detail', trip.id);
    } else {
      onNavigate('dashboard');
    }
  };

  // Mock Plan Options based on budget
  const budgetVal = trip?.budget ? parseFloat(trip.budget) : 4500;
  const basePlans = [
    {
      id: "plan-a",
      name: "Standard Comfort",
      cost: Math.round(budgetVal * 0.92),
      delta: Math.round(budgetVal - (budgetVal * 0.92)),
      deltaStatus: "under",
      hotel: "Central Premium Stay",
      hotelPrice: Math.round(budgetVal * 0.04),
      vehicle: "Sedan Premium",
      vehiclePrice: Math.round(budgetVal * 0.015),
      ticket: "Express Entry Passes",
      ticketPrice: Math.round(budgetVal * 0.05)
    },
    {
      id: "plan-b",
      name: "Optimized Budget",
      cost: Math.round(budgetVal * 0.81),
      delta: Math.round(budgetVal - (budgetVal * 0.81)),
      deltaStatus: "under",
      hotel: "Cozy Garden Rooms",
      hotelPrice: Math.round(budgetVal * 0.025),
      vehicle: "Hatchback Utility",
      vehiclePrice: Math.round(budgetVal * 0.01),
      ticket: "General Admission Passes",
      ticketPrice: Math.round(budgetVal * 0.035)
    },
    {
      id: "plan-c",
      name: "Luxury Corridor",
      cost: Math.round(budgetVal * 1.05),
      delta: Math.round((budgetVal * 1.05) - budgetVal),
      deltaStatus: "over",
      hotel: "Grand Resort & Spa",
      hotelPrice: Math.round(budgetVal * 0.065),
      vehicle: "SUV Executive",
      vehiclePrice: Math.round(budgetVal * 0.025),
      ticket: "VIP Priority Access",
      ticketPrice: Math.round(budgetVal * 0.08)
    }
  ];

  // Insert Agent Plan option if present
  const plans = agentPlan ? [
    {
      id: "plan-agent",
      name: "Agent-recommended",
      isAgent: true,
      cost: agentPlan.totalPrice,
      delta: Math.abs(budgetVal - agentPlan.totalPrice),
      deltaStatus: agentPlan.totalPrice <= budgetVal ? "under" : "over",
      hotel: agentPlan.items.find(i => i.type === 'Hotel')?.name || 'Curated Accommodation',
      hotelPrice: agentPlan.items.find(i => i.type === 'Hotel')?.price || 0,
      vehicle: agentPlan.items.find(i => i.type === 'Vehicle')?.name || 'Curated Transit',
      vehiclePrice: agentPlan.items.find(i => i.type === 'Vehicle')?.price || 0,
      ticket: agentPlan.items.find(i => i.type === 'Ticket')?.name || 'Curated Experience Ticket',
      ticketPrice: agentPlan.items.find(i => i.type === 'Ticket')?.price || 0,
      note: agentPlan.note
    },
    ...basePlans
  ] : basePlans;

  // Sidebar Menu Items
  const menuItems = [
    { name: 'Dashboard', icon: <Compass size={18} />, active: false, action: () => onNavigate('dashboard') },
    { name: 'My Trips', icon: <Calendar size={18} />, active: true, action: () => onNavigate('dashboard') },
    { name: 'Browse Groups', icon: <Users size={18} />, active: false, action: () => onNavigate('browse-groups') },
    { name: 'Expenses', icon: <CreditCard size={18} />, active: false, action: () => onNavigate('expenses') },
    { name: 'Profile', icon: <User size={18} />, active: false, action: () => onNavigate('profile') }
  ];

  // Path for loop drawing SVG route
  const pathD = "M 20,40 C 80,10 120,70 180,40 C 240,10 280,70 340,40";

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

      {/* Main Content Area */}
      <main className="flex-grow lg:pl-64 min-h-screen flex flex-col justify-between">
        <div className="max-w-5xl mx-auto w-full px-6 py-8 md:py-12 flex-grow flex flex-col space-y-8">
          
          {/* Back Action button */}
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy/60 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded py-1 self-start transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Trip Details
          </button>

          <AnimatePresence mode="wait">
            {isLoading ? (
              // 1. LOADING STATE with signature route-line animation
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="my-auto py-16 flex flex-col items-center justify-center text-center space-y-8"
              >
                {/* SVG Route Line Animating on Loop */}
                <div className="w-[360px] h-[100px] overflow-visible flex items-center justify-center relative">
                  <svg viewBox="0 0 360 80" className="w-full h-auto overflow-visible select-none" aria-hidden="true">
                    {/* Background path line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#DDE1DE"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                    />
                    
                    {/* Animated Solid Overlay line */}
                    <motion.path
                      d={pathD}
                      fill="none"
                      stroke="#2D6A4F"
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      initial={shouldReduceMotion ? { strokeDashoffset: 0 } : { strokeDashoffset: 40 }}
                      animate={shouldReduceMotion ? {} : { strokeDashoffset: -40 }}
                      transition={shouldReduceMotion ? {} : {
                        repeat: Infinity,
                        duration: 2.0,
                        ease: "linear"
                      }}
                    />

                    {/* Waypoint circle markers */}
                    <circle cx="20" cy="40" r="4.5" fill="#D98E3D" stroke="white" strokeWidth="1.5" />
                    <circle cx="180" cy="40" r="4.5" fill="#D98E3D" stroke="white" strokeWidth="1.5" />
                    <circle cx="340" cy="40" r="4.5" fill="#D98E3D" stroke="white" strokeWidth="1.5" />
                  </svg>
                </div>

                {/* Rotating Phrases */}
                <div className="h-[24px]">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingTextIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.25 }}
                      className="text-sm font-semibold text-teal-primary tracking-wide"
                    >
                      {loadingPhrases[loadingTextIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              // 2. LOADED STATE
              <motion.div
                key="loaded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* Header block */}
                <div className="text-left space-y-1">
                  <h2 className="text-3xl font-serif text-navy">Choose your plan</h2>
                  <p className="text-xs text-navy/60 font-semibold flex items-center flex-wrap gap-1">
                    Target Budget: <span className="font-mono text-teal-primary font-bold">৳{trip?.budget ? Number(trip.budget).toLocaleString() : "25,000"}</span> • 
                    <span className="text-navy/40">Built from our own verified inventory</span>
                  </p>
                </div>

                {/* Side-by-Side Plans List */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left items-stretch">
                  {plans.map((plan, idx) => {
                    const isSelected = selectedPlanId === plan.id;
                    const isAnySelected = selectedPlanId !== null;

                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                        animate={{ 
                          opacity: isAnySelected ? (isSelected ? 1 : 0.8) : 1, 
                          y: 0,
                          transition: { delay: shouldReduceMotion ? 0 : idx * 0.08, duration: 0.4 }
                        }}
                        className={`bg-white border rounded-xl p-6 flex flex-col justify-between shadow-none transition-all outline-none ${
                          isSelected
                            ? 'border-teal-primary ring-2 ring-teal-primary scale-[1.01]'
                            : 'border-border-custom hover:border-teal-primary'
                        }`}
                      >
                        <div className="space-y-6">
                          {/* Title and Badge check */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-navy/60 uppercase tracking-wider">{plan.name}</span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-teal-primary text-white flex items-center justify-center">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                          </div>

                          {/* Large Cost Monospace */}
                          <div className="space-y-1">
                            <span className="font-mono text-3xl font-bold text-navy block">
                              ৳{plan.cost.toLocaleString()}
                            </span>
                            <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold block ${
                              plan.deltaStatus === 'under' ? 'text-teal-primary' : 'text-amber-accent'
                            }`}>
                              {plan.deltaStatus === 'under' 
                                ? `৳${plan.delta.toLocaleString()} under budget` 
                                : `৳${plan.delta.toLocaleString()} over budget`}
                            </span>
                          </div>

                          {/* Itemized breakdown compact list */}
                          <div className="space-y-3 pt-4 border-t border-border-custom/50">
                            {/* Hotel */}
                            <div className="flex items-start gap-3">
                              <Hotel size={16} className="text-navy/40 mt-0.5" />
                              <div className="text-xs">
                                <span className="font-semibold text-navy block leading-normal">{plan.hotel}</span>
                                <span className="font-mono text-navy/55 text-[10px] block mt-0.5">৳{plan.hotelPrice}/night</span>
                              </div>
                            </div>

                            {/* Vehicle */}
                            <div className="flex items-start gap-3">
                              <Car size={16} className="text-navy/40 mt-0.5" />
                              <div className="text-xs">
                                <span className="font-semibold text-navy block leading-normal">{plan.vehicle}</span>
                                <span className="font-mono text-navy/55 text-[10px] block mt-0.5">৳{plan.vehiclePrice}/day</span>
                              </div>
                            </div>

                            {/* Ticket */}
                            <div className="flex items-start gap-3">
                              <Ticket size={16} className="text-navy/40 mt-0.5" />
                              <div className="text-xs">
                                <span className="font-semibold text-navy block leading-normal">{plan.ticket}</span>
                                <span className="font-mono text-navy/55 text-[10px] block mt-0.5">৳{plan.ticketPrice} total</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Selection Button */}
                        <div className="pt-8 mt-6 border-t border-border-custom/50">
                          <button
                            onClick={() => setSelectedPlanId(isSelected ? null : plan.id)}
                            className={`
                              w-full text-center text-xs font-semibold py-2 px-3 rounded-lg border transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary cursor-pointer
                              ${isSelected
                                ? 'bg-teal-primary border-teal-primary text-white hover:bg-teal-hover'
                                : 'border-teal-primary text-teal-primary hover:bg-teal-primary hover:text-white'}
                            `}
                          >
                            {isSelected ? "Plan Selected" : "Select this plan"}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 flex flex-col items-center gap-4 text-center">
                  <button
                    onClick={handleRegenerate}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-navy/60 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded px-2.5 py-1.5 transition-colors"
                  >
                    <RefreshCw size={13} />
                    Regenerate options
                  </button>
                  <button
                    onClick={() => alert("Human agent planner desk notified. We'll contact you within 2 hours.")}
                    className="text-[11px] text-navy/55 hover:text-teal-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded"
                  >
                    Prefer a human touch? Request a Travel Agent plan instead
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* STICKY BOTTOM BAR (slides up when a plan is selected) */}
      <AnimatePresence>
        {selectedPlanId && !isLoading && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white border-t border-border-custom px-6 py-4 flex items-center justify-between gap-4 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]"
          >
            <div className="text-left">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-navy/40 block">Selected Option Cost</span>
              <span className="font-mono text-lg font-bold text-navy">
                ৳{plans.find(p => p.id === selectedPlanId)?.cost.toLocaleString()}
              </span>
            </div>
            
            <button
              onClick={() => onNavigate('booking', trip.id)}
              className="inline-flex items-center justify-center gap-1.5 bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-transform duration-150 hover:-translate-y-[0.5px] active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary shadow-sm"
            >
              Continue to booking
              <ArrowRight size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
