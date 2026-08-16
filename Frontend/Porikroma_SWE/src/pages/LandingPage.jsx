import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Users, Landmark, Check } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PolaroidSlideshow from '../components/PolaroidSlideshow';
import RouteDashboard from '../components/RouteDashboard';

export default function LandingPage({ onNavigate, onGoBack, theme, onToggleTheme }) {
  const shouldReduceMotion = useReducedMotion();

  const navLinks = [
    { name: 'How it works', href: '#how-it-works' },
    { name: 'For Travel Agents', href: '#travel-agents' },
    { name: 'Admin Inventory', href: '#admin' }
  ];

  // Variants for scroll-based slide/fade animations
  const sectionVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className="min-h-screen bg-white text-navy font-sans antialiased flex flex-col justify-between">
      {/* Sticky Header Nav */}
      <Header onNavigate={onNavigate} onGoBack={onGoBack} navLinks={navLinks} theme={theme} onToggleTheme={onToggleTheme} />

      {/* Main Content */}
      <main className="flex-grow">
        
        {/* Hero Section */}
        <section className="relative bg-white pt-12 pb-24 md:pt-16 md:pb-32 overflow-hidden border-b border-border-custom">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Hero Left Column (Simple Copy, CTAs, and Testimonial Quote) */}
            <div className="lg:col-span-6 flex flex-col justify-center space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-navy leading-[1.1] tracking-tight">
                Plan your next trip with friends or go solo, without the stress of planning.
              </h1>
              <p className="text-lg text-navy/70 max-w-xl font-normal leading-relaxed">
                Porikroma helps you map your routes, share trip costs, and coordinate bookings in one place.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => onNavigate('auth', 'signup')}
                  className="inline-flex items-center justify-center gap-2 bg-teal-primary hover:bg-teal-hover text-white font-semibold px-6 py-3 rounded-lg transition-transform duration-150 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary focus-visible:outline-offset-2 shadow-sm"
                >
                  Start planning
                  <ArrowRight size={16} />
                </button>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center border border-border-custom hover:border-teal-primary hover:bg-fog text-navy font-semibold px-6 py-3 rounded-lg transition-transform duration-150 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary focus-visible:outline-offset-2"
                >
                  See how it works
                </a>
              </div>

              {/* Simple Testimony Quote */}
              <div className="border-l-2 border-amber-accent/40 pl-4 py-1 mt-6 max-w-lg">
                <p className="text-sm font-serif italic text-navy/80 leading-relaxed">
                  "We wanted to walk the Nakasendo trail without spending weeks organizing hotels and budgets. Porikroma helped us map the path and split expenses easily."
                </p>
                <div className="mt-2 font-mono text-[10px] text-navy/50 uppercase tracking-wider">
                  — Sarah L., Munich
                </div>
              </div>
            </div>

            {/* Hero Right Column (Fully Visible Polaroid Slideshow + Interactive Dashboard Overlay) */}
            <div className="lg:col-span-6 flex flex-col space-y-8">
              {/* Polaroid Photo Frame */}
              <PolaroidSlideshow />
              {/* Interactive Route Dashboard */}
              <RouteDashboard />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 bg-fog border-b border-border-custom">
          <div className="max-w-7xl mx-auto px-6">
            
            <motion.div 
              className="max-w-xl mb-16 space-y-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={sectionVariants}
            >
              <span className="font-mono text-xs uppercase tracking-widest text-teal-primary font-semibold block">How it works</span>
              <h2 className="text-3xl md:text-4xl font-serif text-navy">Simple planning from start to finish</h2>
              <p className="text-navy/70 text-base leading-relaxed font-normal">We help you organize your itinerary, coordinate with your group, and settle payments.</p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-4 gap-8 relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {/* Steps */}
              <motion.div className="flex flex-col space-y-4 relative group" variants={itemVariants}>
                <div className="flex items-baseline justify-between border-b border-border-custom pb-3">
                  <span className="font-mono text-xl text-teal-primary font-medium">01</span>
                  <span className="font-mono text-[10px] text-navy/40 uppercase tracking-widest">Setup</span>
                </div>
                <h3 className="text-xl font-serif text-navy group-hover:text-teal-primary transition-colors">Map the route</h3>
                <p className="text-sm text-navy/70 leading-relaxed font-normal">Choose where and when you want to go. The system checks coordinates and scheduling details for you.</p>
              </motion.div>

              <motion.div className="flex flex-col space-y-4 relative group" variants={itemVariants}>
                <div className="flex items-baseline justify-between border-b border-border-custom pb-3">
                  <span className="font-mono text-xl text-teal-primary font-medium">02</span>
                  <span className="font-mono text-[10px] text-navy/40 uppercase tracking-widest">Invite</span>
                </div>
                <h3 className="text-xl font-serif text-navy group-hover:text-teal-primary transition-colors">Invite your group</h3>
                <p className="text-sm text-navy/70 leading-relaxed font-normal">Send invites to your friends, or choose to match with verified solo travelers going the same way.</p>
              </motion.div>

              <motion.div className="flex flex-col space-y-4 relative group" variants={itemVariants}>
                <div className="flex items-baseline justify-between border-b border-border-custom pb-3">
                  <span className="font-mono text-xl text-teal-primary font-medium">03</span>
                  <span className="font-mono text-[10px] text-navy/40 uppercase tracking-widest">Options</span>
                </div>
                <h3 className="text-xl font-serif text-navy group-hover:text-teal-primary transition-colors">Set a budget</h3>
                <p className="text-sm text-navy/70 leading-relaxed font-normal">Enter how much you want to spend. The system searches verified hotels and transit to find the best options.</p>
              </motion.div>

              <motion.div className="flex flex-col space-y-4 relative group" variants={itemVariants}>
                <div className="flex items-baseline justify-between border-b border-border-custom pb-3">
                  <span className="font-mono text-xl text-teal-primary font-medium">04</span>
                  <span className="font-mono text-[10px] text-navy/40 uppercase tracking-widest">Billing</span>
                </div>
                <h3 className="text-xl font-serif text-navy group-hover:text-teal-primary transition-colors">Book and track costs</h3>
                <p className="text-sm text-navy/70 leading-relaxed font-normal">Book your trip in one place. Expenses are added to a shared list so you can split them easily.</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-24 bg-white border-b border-border-custom">
          <div className="max-w-7xl mx-auto px-6">
            
            <motion.div 
              className="max-w-xl mb-16 space-y-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={sectionVariants}
            >
              <span className="font-mono text-xs uppercase tracking-widest text-teal-primary font-semibold block">Features</span>
              <h2 className="text-3xl md:text-4xl font-serif text-navy">Built for real trips</h2>
              <p className="text-navy/70 text-base leading-relaxed font-normal">A reliable travel tool that focuses on what you actually need.</p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {/* Feature Cards */}
              <motion.div 
                className="bg-white border border-border-custom rounded-xl p-8 flex flex-col justify-between hover:border-teal-primary focus-within:ring-2 focus-within:ring-teal-primary outline-none transition-colors"
                tabIndex={0}
                variants={itemVariants}
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-fog border border-border-custom flex items-center justify-center text-teal-primary">
                    <Users size={20} />
                  </div>
                  <h3 className="text-xl font-serif font-medium text-navy">Travel with others</h3>
                  <p className="text-sm text-navy/70 leading-relaxed font-normal">Find and connect with travel partners who have the same budget and destination. All profiles are verified for safety.</p>
                </div>
                <div className="pt-6 border-t border-border-custom mt-6 flex items-center justify-between text-teal-primary font-medium text-sm font-semibold">
                  <span>Verified travelers</span>
                  <Check size={16} />
                </div>
              </motion.div>

              <motion.div 
                className="bg-white border border-border-custom rounded-xl p-8 flex flex-col justify-between hover:border-teal-primary focus-within:ring-2 focus-within:ring-teal-primary outline-none transition-colors"
                tabIndex={0}
                variants={itemVariants}
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-fog border border-border-custom flex items-center justify-center text-teal-primary">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="text-xl font-serif font-medium text-navy">Real bookings</h3>
                  <p className="text-sm text-navy/70 leading-relaxed font-normal">All hotels, flights, and train tickets come from official databases. You get real prices and direct bookings.</p>
                </div>
                <div className="pt-6 border-t border-border-custom mt-6 flex items-center justify-between text-teal-primary font-medium text-sm font-semibold">
                  <span>Direct bookings only</span>
                  <Check size={16} />
                </div>
              </motion.div>

              <motion.div 
                className="bg-white border border-border-custom rounded-xl p-8 flex flex-col justify-between hover:border-teal-primary focus-within:ring-2 focus-within:ring-teal-primary outline-none transition-colors"
                tabIndex={0}
                variants={itemVariants}
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-fog border border-border-custom flex items-center justify-center text-teal-primary">
                    <Landmark size={20} />
                  </div>
                  <h3 className="text-xl font-serif font-medium text-navy">Easy expense sharing</h3>
                  <p className="text-sm text-navy/70 leading-relaxed font-normal">Separate your personal expenses from group costs. Split bills in any currency and settle up with one click.</p>
                </div>
                <div className="pt-6 border-t border-border-custom mt-6 flex items-center justify-between text-teal-primary font-medium text-sm font-semibold">
                  <span>One-click settlement</span>
                  <Check size={16} />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA section */}
        <section id="get-started-cta" className="py-24 bg-fog border-b border-border-custom">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-serif text-navy">Start planning your trip today</h2>
            <p className="text-navy/70 text-base max-w-xl mx-auto">Create your workspace to map your routes, coordinate dates, and split payments.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => onNavigate('auth', 'signup')}
                className="inline-flex items-center justify-center bg-teal-primary hover:bg-teal-hover text-white font-semibold px-8 py-3 rounded-lg transition-transform duration-150 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary focus-visible:outline-offset-2 shadow-sm"
              >
                Create a free account
              </button>
              <button
                onClick={() => onNavigate('auth', 'signup')}
                className="inline-flex items-center justify-center border border-border-custom hover:border-teal-primary bg-white text-navy font-semibold px-8 py-3 rounded-lg transition-transform duration-150 hover:-translate-y-[1px] active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary focus-visible:outline-offset-2"
              >
                Talk to our team
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
