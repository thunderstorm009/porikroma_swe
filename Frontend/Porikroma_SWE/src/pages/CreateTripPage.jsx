import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft, Globe, Users, User, Calendar, MapPin, Loader2 } from 'lucide-react';
import LogoIcon from '../components/LogoIcon';
import { BANGLADESH_CITIES } from '../mockData';

export default function CreateTripPage({ onNavigate, onCreateTrip }) {
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Form State
  const [destination, setDestination] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tripType, setTripType] = useState('solo'); // 'solo' or 'group'
  const [isGroupVisible, setIsGroupVisible] = useState(true);
  const [screeningQuestion, setScreeningQuestion] = useState('Why do you want to join this trip?');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Bangladesh autocomplete cities dataset
  const cities = BANGLADESH_CITIES;
  
  const filteredCities = cities.filter(c => 
    c.toLowerCase().includes(destination.toLowerCase()) && 
    destination.trim() !== "" &&
    c.toLowerCase() !== destination.toLowerCase()
  );

  const getTodayDateString = () => {
    // Current local time metadata says August 6, 2026
    return "2026-08-06";
  };

  const isStep1Valid = destination.trim().length > 0 && startDate && endDate && startDate <= endDate;

  const handleNext = () => {
    if (step === 1 && !isStep1Valid) return;
    setDirection(1);
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step !== 3) return;
    
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Construct new trip item
      const newTrip = {
        id: Date.now(),
        destination: destination,
        dates: formatDateRange(startDate, endDate),
        type: tripType === 'solo' ? 'Solo' : 'Group',
        status: 'Planning',
        statusColor: 'bg-amber-accent/10 text-amber-accent border-amber-accent/20',
        budgetPercent: 0,
        members: [
          { initial: "S", bg: "bg-teal-primary/20 text-teal-primary" }
        ],
        extraMembers: 0
      };

      setTimeout(() => {
        onCreateTrip(newTrip);
      }, 1600); // Allow checkmark animation to complete
    }, 1200);
  };

  const formatDateRange = (start, end) => {
    const format = (dateStr) => {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const month = monthNames[parseInt(parts[1], 10) - 1];
      return `${parts[2]} ${month}`;
    };
    const startYear = start.split('-')[0];
    return `${format(start)} - ${format(end)} ${startYear}`;
  };

  // Step transitions
  const stepVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 120 : -120,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: (dir) => ({
      x: dir > 0 ? -120 : 120,
      opacity: 0,
      transition: { duration: 0.25, ease: "easeIn" }
    })
  };

  // Sidebar Menu Items (collapsible/de-emphasized sidebar simulation)
  const menuItems = [
    { name: 'Dashboard', icon: <Globe size={18} /> },
    { name: 'My Trips', icon: <Calendar size={18} /> },
    { name: 'Browse Groups', icon: <Users size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-[#F5F6F4]/40 text-navy font-sans flex flex-col lg:flex-row relative">
      
      {/* Collapsed/De-emphasized Left Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-border-custom py-8 flex-col justify-between z-20 opacity-30 pointer-events-none select-none">
        <div className="space-y-8 px-6">
          <div className="flex items-center gap-2.5 font-serif text-2xl font-semibold tracking-tight text-navy">
            <LogoIcon />
            <span>Porikroma</span>
          </div>
          <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-navy/40 rounded-lg"
              >
                {item.icon}
                {item.name}
              </div>
            ))}
          </nav>
        </div>
        <div className="border-t border-border-custom pt-6 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-primary/10 text-teal-primary font-bold flex items-center justify-center font-serif text-sm">
              SJ
            </div>
            <div className="text-left overflow-hidden">
              <span className="text-sm font-bold text-navy block truncate">Sarah Jenkins</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-navy/40 block">Explorer</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow lg:pl-64 min-h-screen flex items-center justify-center py-16 px-6">
        
        {/* Centered wizard container */}
        <div className="w-full max-w-[580px] flex flex-col space-y-8">
          
          {/* Top Wizard Steps / Progress Indicator */}
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between text-xs font-mono font-semibold uppercase tracking-wider text-navy/40">
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                  step === 1 ? 'border-teal-primary text-teal-primary font-bold' : step > 1 ? 'bg-teal-primary border-teal-primary text-white' : 'border-border-custom text-navy/40'
                }`}>
                  {step > 1 ? <Check size={10} strokeWidth={3} /> : "1"}
                </span>
                <span className={step === 1 ? 'text-teal-primary font-bold' : step > 1 ? 'text-navy/80' : ''}>Route</span>
              </div>
              <div className="h-[1px] flex-grow mx-4 bg-border-custom border-t border-dashed"></div>
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                  step === 2 ? 'border-teal-primary text-teal-primary font-bold' : step > 2 ? 'bg-teal-primary border-teal-primary text-white' : 'border-border-custom text-navy/40'
                }`}>
                  {step > 2 ? <Check size={10} strokeWidth={3} /> : "2"}
                </span>
                <span className={step === 2 ? 'text-teal-primary font-bold' : step > 2 ? 'text-navy/80' : ''}>Cohort</span>
              </div>
              <div className="h-[1px] flex-grow mx-4 bg-border-custom border-t border-dashed"></div>
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                  step === 3 ? 'border-teal-primary text-teal-primary font-bold' : 'border-border-custom text-navy/40'
                }`}>
                  3
                </span>
                <span className={step === 3 ? 'text-teal-primary font-bold' : ''}>Review</span>
              </div>
            </div>

            {/* Smooth animated progress line */}
            <div className="w-full h-1 bg-fog rounded-full overflow-hidden border border-border-custom/50">
              <motion.div 
                className="h-full bg-teal-primary"
                initial={{ width: "33%" }}
                animate={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-border-custom rounded-xl p-6 sm:p-10 shadow-none min-h-[380px] flex flex-col justify-between relative overflow-hidden">
            
            {showSuccess ? (
              // Inline drawing Checkmark Success Animation
              <div className="my-auto py-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-teal-primary/10 flex items-center justify-center mx-auto">
                  <svg className="w-9 h-9 text-teal-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-serif text-navy">Trip space initialized</h2>
                  <p className="text-sm text-navy/60 max-w-xs mx-auto">
                    Adding corridor to your account. Redirecting you to the dashboard...
                  </p>
                </div>
              </div>
            ) : (
              // Wizard Steps
              <form onSubmit={handleSubmit} className="flex-grow flex flex-col justify-between" aria-live="polite">
                
                <AnimatePresence initial={false} mode="wait" custom={direction}>
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-6"
                    >
                      <div className="text-left space-y-1">
                        <h2 className="text-2xl font-serif text-navy">Where and when?</h2>
                        <p className="text-xs text-navy/60">Choose your destination and itinerary dates.</p>
                      </div>

                      {/* Destination Autocomplete */}
                      <div className="space-y-1.5 text-left relative">
                        <label htmlFor="destination" className="block text-xs font-semibold uppercase tracking-wider text-navy/70">
                          Destination City
                        </label>
                        <div className="relative">
                          <input
                            id="destination"
                            type="text"
                            value={destination}
                            onChange={(e) => {
                              setDestination(e.target.value);
                              setShowAutocomplete(true);
                            }}
                            onFocus={() => setShowAutocomplete(true)}
                            placeholder="Search city..."
                            className="w-full pl-9 pr-4 py-2.5 border border-border-custom rounded-lg text-sm bg-white text-navy focus:outline-none focus:border-teal-primary focus:ring-1 focus:ring-teal-primary transition-all"
                          />
                          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
                        </div>

                        {/* Autocomplete Dropdown list */}
                        {showAutocomplete && filteredCities.length > 0 && (
                          <ul className="absolute z-10 w-full bg-white border border-border-custom rounded-lg mt-1 overflow-hidden shadow-sm">
                            {filteredCities.map((city) => (
                              <li key={city}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDestination(city);
                                    setShowAutocomplete(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-navy hover:bg-fog focus:bg-fog focus:outline-none transition-colors border-b border-border-custom/30 last:border-b-0"
                                >
                                  {city}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Date Range Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                        <div className="space-y-1.5">
                          <label htmlFor="start-date" className="block text-xs font-semibold uppercase tracking-wider text-navy/70">
                            Start Date
                          </label>
                          <input
                            id="start-date"
                            type="date"
                            min={getTodayDateString()}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-border-custom rounded-lg text-sm bg-white text-navy focus:outline-none focus:border-teal-primary focus:ring-1 focus:ring-teal-primary transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="end-date" className="block text-xs font-semibold uppercase tracking-wider text-navy/70">
                            End Date
                          </label>
                          <input
                            id="end-date"
                            type="date"
                            min={startDate || getTodayDateString()}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-border-custom rounded-lg text-sm bg-white text-navy focus:outline-none focus:border-teal-primary focus:ring-1 focus:ring-teal-primary transition-all"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-6"
                    >
                      <div className="text-left space-y-1">
                        <h2 className="text-2xl font-serif text-navy">Who's going?</h2>
                        <p className="text-xs text-navy/60">Choose your trip structure.</p>
                      </div>

                      {/* Solo / Group Custom Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Solo option */}
                        <button
                          type="button"
                          onClick={() => setTripType('solo')}
                          className={`flex flex-col items-start p-5 border rounded-lg text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary ${
                            tripType === 'solo'
                              ? 'border-teal-primary bg-teal-primary/5 ring-1 ring-teal-primary'
                              : 'border-border-custom hover:border-teal-primary'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-fog border border-border-custom flex items-center justify-center text-teal-primary mb-3">
                            <User size={16} />
                          </div>
                          <span className="text-sm font-bold text-navy">Solo Explorer</span>
                          <p className="text-xs text-navy/60 mt-1 leading-normal">
                            We'll match you with verified companions heading to the same destination.
                          </p>
                        </button>

                        {/* Group option */}
                        <button
                          type="button"
                          onClick={() => setTripType('group')}
                          className={`flex flex-col items-start p-5 border rounded-lg text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary ${
                            tripType === 'group'
                              ? 'border-teal-primary bg-teal-primary/5 ring-1 ring-teal-primary'
                              : 'border-border-custom hover:border-teal-primary'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-fog border border-border-custom flex items-center justify-center text-teal-primary mb-3">
                            <Users size={16} />
                          </div>
                          <span className="text-sm font-bold text-navy">Group Journey</span>
                          <p className="text-xs text-navy/60 mt-1 leading-normal">
                            Invite people you know, or toggle group discoverability to allow joining requests.
                          </p>
                        </button>
                      </div>

                      {/* Expandable Group Options */}
                      {tripType === 'group' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-4 border-t border-border-custom pt-4 text-left overflow-hidden"
                        >
                          {/* Toggle */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-0.5">
                              <label htmlFor="group-visibility" className="text-xs font-semibold text-navy">
                                Discoverable Group Space
                              </label>
                              <p className="text-[10px] text-navy/60 leading-normal">
                                Allow other explorers matching your itinerary to request to join your corridor.
                              </p>
                            </div>
                            <input
                              id="group-visibility"
                              type="checkbox"
                              checked={isGroupVisible}
                              onChange={(e) => setIsGroupVisible(e.target.checked)}
                              className="w-4 h-4 text-teal-primary border-border-custom rounded focus:ring-teal-primary cursor-pointer mt-1"
                            />
                          </div>

                          {/* Screening question text area */}
                          {isGroupVisible && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="space-y-1.5 pt-2"
                            >
                              <label htmlFor="screening-question" className="block text-xs font-semibold uppercase tracking-wider text-navy/70">
                                Screening Question
                              </label>
                              <textarea
                                id="screening-question"
                                rows={2}
                                value={screeningQuestion}
                                onChange={(e) => setScreeningQuestion(e.target.value)}
                                placeholder="Why do you want to join this trip?"
                                className="w-full px-3.5 py-2.5 border border-border-custom rounded-lg text-sm bg-white text-navy focus:outline-none focus:border-teal-primary focus:ring-1 focus:ring-teal-primary transition-all font-sans"
                              />
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-6"
                    >
                      <div className="text-left space-y-1">
                        <h2 className="text-2xl font-serif text-navy">Review your trip</h2>
                        <p className="text-xs text-navy/60">Confirm your travel parameters before corridor initialization.</p>
                      </div>

                      {/* Quiet Summary Card */}
                      <div className="bg-fog border border-border-custom rounded-lg p-5 text-left text-sm space-y-4">
                        <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border-custom/50">
                          <span className="font-semibold text-navy/60">Destination</span>
                          <span className="col-span-2 text-navy font-semibold">{destination}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border-custom/50">
                          <span className="font-semibold text-navy/60">Dates</span>
                          <span className="col-span-2 text-navy font-mono font-medium">{formatDateRange(startDate, endDate)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border-custom/50">
                          <span className="font-semibold text-navy/60">Trip Type</span>
                          <span className="col-span-2 text-navy font-medium uppercase text-xs tracking-wider">{tripType}</span>
                        </div>
                        {tripType === 'group' && isGroupVisible && (
                          <div className="grid grid-cols-3 gap-2 py-1.5">
                            <span className="font-semibold text-navy/60">Question</span>
                            <span className="col-span-2 text-navy italic text-xs leading-relaxed">"{screeningQuestion}"</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-8 border-t border-border-custom mt-8 gap-4">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-navy/60 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded px-2 py-1 transition-colors disabled:opacity-50"
                    >
                      <ArrowLeft size={16} />
                      Back
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigate('dashboard')}
                      disabled={isSubmitting}
                      className="text-sm font-semibold text-navy/55 hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded px-2 py-1 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!isStep1Valid}
                      className="inline-flex items-center justify-center gap-2 bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-40 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary focus-visible:outline-offset-2 transition-all shadow-sm"
                    >
                      Continue
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold px-6 py-2.5 rounded-lg disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary focus-visible:outline-offset-2 transition-all shadow-sm"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="animate-spin" size={16} />
                          Creating trip...
                        </span>
                      ) : (
                        "Create trip"
                      )}
                    </button>
                  )}
                </div>

              </form>
            )}

          </div>

        </div>
      </main>

    </div>
  );
}
