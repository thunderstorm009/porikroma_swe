import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  ArrowLeft, Compass, Calendar, Users, CreditCard, User, LogOut, Check, X,
  Hotel, Car, Ticket, Loader2, ArrowRight, CheckCircle2, ShieldCheck, Menu
} from 'lucide-react';
import LogoIcon from '../components/LogoIcon';

export default function BookingPage({ onNavigate, trip }) {
  const shouldReduceMotion = useReducedMotion();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);

  // Initialize booking items in state
  const budgetVal = trip?.budget ? parseFloat(trip.budget) : 4500;
  const initialItems = [
    {
      id: "hotel",
      type: "Hotel",
      name: "Central Premium Stay",
      details: "14 nights • 1 Room • Double Bed",
      price: Math.round(budgetVal * 0.56),
      status: "Not booked", // "Not booked" | "Booking" | "Pending"
      icon: <Hotel size={18} />
    },
    {
      id: "vehicle",
      type: "Vehicle",
      name: "Sedan Premium Auto",
      details: "14 days • Unlimited KM • Fuel A+",
      price: Math.round(budgetVal * 0.21),
      status: "Not booked",
      icon: <Car size={18} />
    },
    {
      id: "ticket",
      type: "Ticket",
      name: "Express Entry Passes",
      details: "Standard Access • All Venues included",
      price: Math.round(budgetVal * 0.15),
      status: "Not booked",
      icon: <Ticket size={18} />
    }
  ];

  const [items, setItems] = useState(initialItems);

  const handleBookItem = (itemId) => {
    setItems((prev) => 
      prev.map((item) => (item.id === itemId ? { ...item, status: "Booking" } : item))
    );

    // Simulate booking action
    setTimeout(() => {
      setItems((prev) => 
        prev.map((item) => (item.id === itemId ? { ...item, status: "Pending" } : item))
      );
    }, 1200);
  };

  const handleConfirmAll = () => {
    setIsConfirmingAll(true);
    setTimeout(() => {
      setIsConfirmingAll(false);
      setConfirmed(true);
    }, 1800);
  };

  const bookedCount = items.filter((item) => item.status === "Pending").length;
  const allBooked = bookedCount === items.length;
  const totalCost = items.reduce((sum, item) => sum + item.price, 0);

  // Sidebar Menu Items
  const menuItems = [
    { name: 'Dashboard', icon: <Compass size={18} />, active: false },
    { name: 'My Trips', icon: <Calendar size={18} />, active: true },
    { name: 'Browse Groups', icon: <Users size={18} />, active: false },
    { name: 'Expenses', icon: <CreditCard size={18} />, active: false },
    { name: 'Profile', icon: <User size={18} />, active: false }
  ];

  // SVG route line coordinates for final drawing confirmation
  const pathD = "M 40,60 C 120,20 160,100 240,60 C 320,20 360,100 440,60";

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
      <main className="flex-grow lg:pl-64 min-h-screen flex flex-col justify-between">
        <div className="max-w-5xl mx-auto w-full px-6 py-8 md:py-12 flex-grow flex flex-col space-y-8">
          
          {/* Back Action button */}
          {!confirmed && (
            <button
              onClick={() => onNavigate('plan-options', trip?.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy/60 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded py-1 self-start transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Plan Options
            </button>
          )}

          <AnimatePresence mode="wait">
            {confirmed ? (
              // 1. CONFIRMATION STATE
              <motion.div
                key="confirmed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="my-auto py-16 flex flex-col items-center justify-center text-center space-y-8 max-w-lg mx-auto"
              >
                {/* SVG Route Line Animating ONCE */}
                <div className="w-[480px] h-[120px] overflow-visible flex items-center justify-center relative max-w-full">
                  <svg viewBox="0 0 480 120" className="w-full h-auto overflow-visible select-none" aria-hidden="true">
                    {/* Dashed background */}
                    <path d={pathD} fill="none" stroke="#DDE1DE" strokeWidth={2} strokeDasharray="6 4" />
                    
                    {/* Animated drawing once */}
                    <motion.path
                      d={pathD}
                      fill="none"
                      stroke="#2D6A4F"
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 1.5, ease: "easeOut" }}
                    />
                    
                    {/* Pin endpoints */}
                    <circle cx="40" cy="60" r="4.5" fill="#D98E3D" stroke="white" strokeWidth="1.5" />
                    <circle cx="240" cy="60" r="4.5" fill="#D98E3D" stroke="white" strokeWidth="1.5" />
                    
                    {/* Checkmark pin at destination */}
                    <g transform="translate(440,60)">
                      <circle cx="0" cy="0" r="10" fill="#2D6A4F" stroke="white" strokeWidth="2" />
                      <path d="M-4 0 L-1 3 L4 -3" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  </svg>
                </div>

                <div className="space-y-4 text-center">
                  <h2 className="text-3xl font-serif text-navy">Booking confirmed</h2>
                  <div className="space-y-1">
                    <span className="font-semibold text-navy text-sm block">
                      {trip?.destination || "Kyoto Autumn Walk"}
                    </span>
                    <span className="font-mono text-xs text-navy/55 block">
                      {trip?.dates || "06 OCT - 20 OCT 2026"}
                    </span>
                  </div>
                  <p className="text-xs text-navy/60 max-w-sm mx-auto leading-relaxed border-t border-border-custom pt-4">
                    Payments are marked Pending until confirmed. You can track settlements in your trip space.
                  </p>
                </div>

                <button
                  onClick={() => onNavigate('trip-detail', trip?.id)}
                  className="inline-flex items-center justify-center gap-1.5 bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold px-6 py-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary shadow-sm"
                >
                  Go to your trip
                  <ArrowRight size={14} />
                </button>
              </motion.div>
            ) : (
              // 2. CHECKOUT TWO-COLUMN FLOW
              <motion.div
                key="checkout"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left"
              >
                
                {/* Left Column - List of Items */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="text-left space-y-1">
                    <h2 className="text-2xl font-serif text-navy">Confirm and book</h2>
                    <p className="text-xs text-navy/60">Settle your plan coordinates individually.</p>
                  </div>

                  {items.map((item) => (
                    <div key={item.id} className="bg-white border border-border-custom rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-colors hover:border-teal-primary/50">
                      
                      {/* Left Info block */}
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-fog border border-border-custom flex items-center justify-center text-teal-primary mt-0.5 flex-shrink-0">
                          {item.icon}
                        </div>
                        <div className="text-left space-y-0.5">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-navy/40 block font-semibold">{item.type}</span>
                          <span className="text-base font-bold text-navy block leading-normal">{item.name}</span>
                          <p className="text-xs text-navy/55 font-normal">{item.details}</p>
                        </div>
                      </div>

                      {/* Right Status / Action block */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 self-stretch sm:self-auto border-t sm:border-t-0 border-border-custom/50 pt-4 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <span className="font-mono text-sm font-bold text-navy block">৳{item.price.toLocaleString()}</span>
                          
                          {/* Badges */}
                          <div className="mt-1">
                            {item.status === 'Not booked' && (
                              <span className="font-mono text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-fog border border-border-custom text-navy/50">
                                Not booked
                              </span>
                            )}
                            {item.status === 'Booking' && (
                              <span className="font-mono text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-accent/10 border border-amber-accent/20 text-amber-accent flex items-center gap-1.5">
                                <Loader2 className="animate-spin" size={10} />
                                Booking...
                              </span>
                            )}
                            {item.status === 'Pending' && (
                              <span className="font-mono text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-accent/10 border border-amber-accent/20 text-amber-accent flex items-center gap-1">
                                <Check size={10} strokeWidth={3} />
                                Pending
                              </span>
                            )}
                          </div>
                        </div>

                        {item.status === 'Not booked' && (
                          <button
                            onClick={() => handleBookItem(item.id)}
                            className="bg-white hover:bg-teal-primary text-teal-primary hover:text-white border border-teal-primary text-xs font-semibold px-4 py-1.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary transition-all cursor-pointer"
                          >
                            Book this
                          </button>
                        )}
                        {item.status === 'Booking' && (
                          <button disabled className="bg-fog border border-border-custom text-navy/40 text-xs font-semibold px-4 py-1.5 rounded-lg pointer-events-none">
                            Booking...
                          </button>
                        )}
                        {item.status === 'Pending' && (
                          <div className="text-teal-primary text-xs font-bold flex items-center gap-1.5 py-1 px-2 bg-teal-primary/5 border border-teal-primary/10 rounded-lg select-none">
                            <CheckCircle2 size={14} /> Confirmed
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>

                {/* Right Column - Sticky Sidebar Summary */}
                <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-6">
                  <div className="bg-white border border-border-custom rounded-xl p-5 text-left space-y-5">
                    
                    {/* Header Summary */}
                    <div className="border-b border-border-custom/50 pb-4 space-y-1">
                      <span className="font-mono text-[8px] uppercase tracking-widest text-navy/45 font-semibold">Itinerary Checkout</span>
                      <h3 className="font-serif text-lg font-semibold text-navy leading-tight">
                        {trip?.destination || "Cox's Bazar Sea Beach & Inani"}
                      </h3>
                      <span className="font-mono text-[10px] text-navy/55 block">
                        {trip?.dates || "06 OCT - 12 OCT 2026"}
                      </span>
                    </div>

                    {/* Cost items */}
                    <div className="space-y-2.5 text-xs">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center font-normal">
                          <span className="text-navy/60">{item.type} ({item.name})</span>
                          <span className="font-mono text-navy">৳{item.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border-custom/50 pt-4 flex justify-between items-baseline">
                      <span className="text-xs font-bold text-navy/70">Total Cost</span>
                      <span className="font-mono text-xl font-bold text-navy">
                        ৳{totalCost.toLocaleString()}
                      </span>
                    </div>

                    {/* Pending bookings count status */}
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-navy/50 bg-fog border border-border-custom/70 rounded-lg p-2.5">
                      <ShieldCheck size={14} className="text-teal-primary" />
                      <span>{bookedCount} of {items.length} items booked</span>
                    </div>

                    {/* Confirm CTA button */}
                    <button
                      onClick={handleConfirmAll}
                      disabled={!allBooked || isConfirmingAll}
                      className="w-full inline-flex items-center justify-center bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold py-2.5 px-4 rounded-lg disabled:opacity-40 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary focus-visible:outline-offset-2 transition-all shadow-sm"
                    >
                      {isConfirmingAll ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="animate-spin" size={14} />
                          Confirming...
                        </span>
                      ) : (
                        "Confirm all bookings"
                      )}
                    </button>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

    </div>
  );
}
