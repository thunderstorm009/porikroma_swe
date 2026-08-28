import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Search, Plus, X, Bed, Car, Ticket, Check, ShieldCheck, LogOut, Map
} from 'lucide-react';
import LogoIcon from '../components/LogoIcon';
import { BANGLADESH_HOTELS, BANGLADESH_VEHICLES, BANGLADESH_TICKETS } from '../mockData';

// Pre-filtered ACTIVE inventory pool (from Bangladesh inventory database)
const ACTIVE_INVENTORY = {
  Hotels: BANGLADESH_HOTELS.filter(h => h.status === 'Active').map(h => ({ ...h, type: 'Hotel', icon: Bed })),
  Vehicles: BANGLADESH_VEHICLES.filter(v => v.status === 'Active').map(v => ({ ...v, type: 'Vehicle', icon: Car })),
  Tickets: BANGLADESH_TICKETS.filter(t => t.status === 'Active').map(t => ({ ...t, type: 'Ticket', icon: Ticket }))
};

export default function AuthorTourPlanPage({ onNavigate, trip = null, onSaveAgentPlan }) {
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState('Hotels');
  const [searchQuery, setSearchQuery] = useState('');

  // Trip context (default fallback if none passed)
  const activeTrip = trip || {
    id: 1,
    destination: "Cox's Bazar Sea Beach & Inani",
    dates: "06 OCT - 12 OCT 2026",
    travelerName: "Sarah Jenkins",
    travelerAvatar: "S",
    travelersCount: 3,
    budget: 25000.00
  };

  const travelerBudget = parseFloat(activeTrip.budget || 25000);

  // Selected plan items
  const [planItems, setPlanItems] = useState([]);
  const [noteToTraveler, setNoteToTraveler] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'

  // Calculations
  const planTotal = planItems.reduce((sum, item) => sum + item.price, 0);
  const deltaBudget = travelerBudget - planTotal;
  const isOverBudget = deltaBudget < 0;

  // Add Item to Plan
  const handleAddItem = (item) => {
    // Generate unique instance ID so same item can be added multiple times if needed
    const planItem = {
      ...item,
      instanceId: `${item.id}-${Date.now()}`
    };
    setPlanItems((prev) => [...prev, planItem]);
    setSaveStatus('idle');
  };

  // Remove Item from Plan
  const handleRemoveItem = (instanceId) => {
    setPlanItems((prev) => prev.filter((item) => item.instanceId !== instanceId));
    setSaveStatus('idle');
  };

  // Save Plan
  const handleSavePlan = (e) => {
    e.preventDefault();
    if (planItems.length === 0) return;

    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      if (onSaveAgentPlan) {
        onSaveAgentPlan({
          tripId: activeTrip.id,
          items: planItems,
          totalPrice: planTotal,
          note: noteToTraveler
        });
      }
    }, 400);
  };

  // Filtered inventory list
  const currentCategoryInventory = ACTIVE_INVENTORY[activeTab] || [];
  const filteredInventory = currentCategoryInventory.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.location && item.location.toLowerCase().includes(q)) ||
      (item.detail && item.detail.toLowerCase().includes(q)) ||
      item.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#F5F6F4]/40 text-navy font-sans flex flex-col antialiased">
      {/* Live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Current plan total is ${planTotal.toFixed(2)}. {planItems.length} items in plan.
      </div>

      {/* TRAVEL AGENT TOP BAR SHELL */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-border-custom px-6 h-16 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}
            className="flex items-center gap-2.5 font-serif text-xl font-semibold tracking-tight text-navy focus-visible:outline-2 focus-visible:outline-teal-primary rounded"
          >
            <LogoIcon />
            <span>Porikroma</span>
          </a>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-primary text-white text-[10px] font-mono font-semibold uppercase tracking-wider">
            <ShieldCheck size={11} /> Travel Agent
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 border-r border-border-custom pr-4">
            <div className="w-8 h-8 rounded-full bg-teal-primary/15 text-teal-primary flex items-center justify-center font-mono text-xs font-bold border border-teal-primary/30">
              TA
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-navy block leading-none">Custom Planner Agent</span>
              <span className="text-[10px] font-mono text-navy/40 block leading-none mt-0.5">agent@waypoint.internal</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-xs font-semibold text-navy/70 hover:text-navy px-2.5 py-1.5 rounded-lg hover:bg-fog focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary transition-colors"
          >
            <LogOut size={15} />
            <span>Exit Shell</span>
          </button>
        </div>
      </header>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <main className="max-w-6xl mx-auto w-full px-6 py-8 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Trip Context & Item Picker (Span 7) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* 1. Trip Context Card (Read-only) */}
            <div className="bg-white border border-border-custom rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-border-custom pb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-navy/40">
                  Target Trip Context
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-fog rounded border border-border-custom text-navy/60">
                  Read-only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-navy/40 block">Destination</span>
                  <h3 className="text-lg font-serif font-medium text-navy leading-snug">
                    {activeTrip.destination}
                  </h3>
                  <span className="text-xs font-mono text-navy/60 block">
                    {activeTrip.dates}
                  </span>
                </div>

                <div className="space-y-1 sm:text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-navy/40 block">Stated Budget</span>
                  <span className="font-mono text-xl font-bold text-navy block">
                    ৳{travelerBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <div className="flex items-center sm:justify-end gap-1.5 text-xs text-navy/60 pt-1">
                    <div className="w-5 h-5 rounded-full bg-teal-primary/20 text-teal-primary flex items-center justify-center font-serif text-[10px] font-bold">
                      {activeTrip.travelerAvatar || 'S'}
                    </div>
                    <span>{activeTrip.travelerName || 'Sarah Jenkins'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Tabbed Item Picker */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border-custom pb-2">
                <h2 className="text-lg font-serif font-medium text-navy">Inventory Catalog</h2>
                
                {/* Underline Tabs */}
                <div className="flex items-center gap-6" role="tablist" aria-label="Inventory Types">
                  {['Hotels', 'Vehicles', 'Tickets'].map((tab) => (
                    <button
                      key={tab}
                      role="tab"
                      aria-selected={activeTab === tab}
                      onClick={() => setActiveTab(tab)}
                      className={`
                        relative text-xs font-semibold pb-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded-xs
                        ${activeTab === tab ? 'text-teal-primary' : 'text-navy/60 hover:text-navy'}
                      `}
                    >
                      {tab}
                      {activeTab === tab && (
                        <motion.div
                          layoutId="agentTabUnderline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-primary"
                          transition={{ duration: 0.15 }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Search active ${activeTab.toLowerCase()} by name, location, or route...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-border-custom rounded-lg pl-9 pr-3 py-2 text-xs text-navy placeholder:text-navy/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                />
              </div>

              {/* Available Inventory Items List */}
              <div className="space-y-2.5">
                {filteredInventory.length === 0 ? (
                  <div className="bg-white border border-border-custom rounded-xl p-8 text-center text-xs text-navy/50">
                    No active {activeTab.toLowerCase()} found matching "{searchQuery}".
                  </div>
                ) : (
                  filteredInventory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-border-custom rounded-xl p-4 flex items-center justify-between gap-4 hover:border-navy/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-fog text-navy flex items-center justify-center flex-shrink-0">
                          <item.icon size={18} className="text-navy/70" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-semibold text-navy leading-snug">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-navy/60 font-mono">
                            <span>{item.location || item.detail}</span>
                            <span>•</span>
                            <span className="font-semibold text-navy">৳{item.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddItem(item)}
                        className="inline-flex items-center justify-center gap-1 bg-white border border-teal-primary text-teal-primary hover:bg-teal-primary hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary whitespace-nowrap"
                      >
                        <Plus size={14} />
                        <span>Add to plan</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Plan Builder (Span 5, Sticky Desktop) */}
          <div className="lg:col-span-5 text-left">
            <div className="sticky top-24 bg-white border border-border-custom rounded-xl p-6 shadow-2xs space-y-6">
              
              <div>
                <h2 className="text-xl font-serif text-navy">
                  Your plan for {activeTrip.destination}
                </h2>
                <p className="text-xs text-navy/50 font-normal mt-0.5">
                  Custom itinerary draft compiled by Travel Agent
                </p>
              </div>

              {/* Running List of Added Items / Empty State */}
              <div className="space-y-3 min-h-[160px]">
                {planItems.length === 0 ? (
                  /* Empty State */
                  <div className="border border-dashed border-border-custom rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-3 bg-fog/30">
                    <div className="w-12 h-12 rounded-full bg-fog flex items-center justify-center text-navy/30">
                      <Map size={24} strokeWidth={1.5} />
                    </div>
                    <p className="text-xs text-navy/60 max-w-xs font-normal leading-relaxed">
                      Add hotels, vehicles, or tickets from the left catalog to start building this plan.
                    </p>
                  </div>
                ) : (
                  /* Added Items List */
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {planItems.map((item) => {
                        const IconComp = item.icon || Map;
                        return (
                          <motion.div
                            key={item.instanceId}
                            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-between p-3 bg-fog/50 border border-border-custom/80 rounded-lg text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <IconComp size={15} className="text-navy/60 flex-shrink-0" />
                              <span className="font-semibold text-navy truncate">{item.name}</span>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="font-mono font-bold text-navy">৳{item.price.toFixed(2)}</span>
                              <button
                                onClick={() => handleRemoveItem(item.instanceId)}
                                className="p-1 text-navy/40 hover:text-red-600 rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                                title="Remove item"
                                aria-label={`Remove ${item.name} from plan`}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* DIVIDER & RUNNING TOTAL DELTA */}
              <div className="pt-4 border-t border-border-custom space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-mono uppercase tracking-widest text-navy/50">Total Plan Cost</span>
                  <div className="font-mono text-2xl font-bold text-navy">
                    ৳{planTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                {planItems.length > 0 && (
                  <div className="flex justify-end">
                    <span className={`
                      font-mono text-xs font-semibold px-2 py-0.5 rounded border
                      ${isOverBudget
                        ? 'bg-amber-accent/15 border-amber-accent/30 text-amber-accent'
                        : 'bg-teal-primary/10 border-teal-primary/30 text-teal-primary'}
                    `}>
                      {isOverBudget
                        ? `৳${Math.abs(deltaBudget).toFixed(2)} over budget`
                        : `৳${deltaBudget.toFixed(2)} under budget`}
                    </span>
                  </div>
                )}
              </div>

              {/* NOTE TO TRAVELER TEXTAREA */}
              <div className="space-y-1.5">
                <label htmlFor="agentNote" className="text-xs font-semibold text-navy/70 block">
                  Note to traveler (Optional)
                </label>
                <textarea
                  id="agentNote"
                  rows={3}
                  placeholder="Explain why this curated combination works well for their budget and dates..."
                  value={noteToTraveler}
                  onChange={(e) => setNoteToTraveler(e.target.value)}
                  className="w-full bg-fog/60 border border-border-custom rounded-lg p-2.5 text-xs text-navy placeholder:text-navy/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                />
              </div>

              {/* SAVE PLAN BUTTON */}
              <form onSubmit={handleSavePlan}>
                <button
                  type="submit"
                  disabled={planItems.length === 0}
                  className={`
                    w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary
                    ${planItems.length === 0
                      ? 'bg-fog text-navy/40 border border-border-custom cursor-not-allowed'
                      : saveStatus === 'saved'
                        ? 'bg-teal-primary text-white'
                        : 'bg-teal-primary hover:bg-teal-hover text-white active:scale-[0.99]'}
                  `}
                >
                  {saveStatus === 'saved' ? (
                    <>
                      <Check size={16} className="text-white" />
                      <span>Plan saved & published</span>
                    </>
                  ) : saveStatus === 'saving' ? (
                    <span>Saving plan...</span>
                  ) : (
                    <span>Save plan</span>
                  )}
                </button>
              </form>

              {saveStatus === 'saved' && (
                <p className="text-[11px] text-teal-primary font-mono text-center pt-1">
                  ✓ Visible on traveler's Plan Options page as "Agent-recommended"
                </p>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* MOBILE STICKY BOTTOM RUNNING TOTAL BAR */}
      <div className="lg:hidden sticky bottom-0 z-30 bg-white border-t border-border-custom p-4 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-[10px] font-mono uppercase text-navy/50 block">Plan Total</span>
          <span className="font-mono text-lg font-bold text-navy">${planTotal.toFixed(2)}</span>
        </div>

        <button
          onClick={handleSavePlan}
          disabled={planItems.length === 0}
          className={`
            px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary
            ${planItems.length === 0 ? 'bg-fog text-navy/40 border border-border-custom' : 'bg-teal-primary hover:bg-teal-hover'}
          `}
        >
          {saveStatus === 'saved' ? 'Saved' : 'Save plan'}
        </button>
      </div>

    </div>
  );
}
