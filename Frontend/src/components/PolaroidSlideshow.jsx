import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PolaroidSlideshow() {
  const images = [
    { url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600&auto=format&fit=crop", title: "Kyoto Forest Path", location: "OCTOBER 2026 • JAPAN" },
    { url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=600&auto=format&fit=crop", title: "Lake Geneva Corridor", location: "JULY 2026 • SWITZERLAND" },
    { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop", title: "Maldives Atoll Pathway", location: "DECEMBER 2026 • MALDIVES" },
    { url: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=600&auto=format&fit=crop", title: "Amalfi Coastal Walkway", location: "JUNE 2026 • ITALY" },
    { url: "https://images.unsplash.com/photo-1509316975850-ff9c5edd0cd9?q=80&w=600&auto=format&fit=crop", title: "Monument Valley Trail", location: "SEPTEMBER 2026 • USA" },
    { url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=600&auto=format&fit=crop", title: "Seine River Corridor", location: "APRIL 2026 • FRANCE" },
    { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=600&auto=format&fit=crop", title: "Hallstatt Alpine Walk", location: "OCTOBER 2026 • AUSTRIA" },
    { url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=600&auto=format&fit=crop", title: "Ubud Sanctuary Path", location: "MARCH 2026 • INDONESIA" },
    { url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop", title: "Canyonlands Route", location: "MAY 2026 • USA" },
    { url: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=600&auto=format&fit=crop", title: "Cinque Terre Path", location: "AUGUST 2026 • ITALY" }
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="relative mx-auto lg:mr-0 lg:ml-auto w-full max-w-md">
      <div 
        className="bg-[#FCFCFA] p-4 pb-10 border border-border-custom rounded-sm shadow-[0_4px_24px_rgba(0,0,0,0.04)] rotate-[-1.5deg] hover:rotate-0 transition-transform duration-300 group cursor-pointer"
        style={{ transformOrigin: 'center bottom' }}
      >
        <div className="overflow-hidden border border-border-custom/40 bg-fog relative aspect-[4/3]">
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentImageIndex}
              src={images[currentImageIndex].url} 
              alt={images[currentImageIndex].title} 
              className="absolute inset-0 w-full h-full object-cover filter contrast-[1.02] saturate-[0.98]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          </AnimatePresence>
        </div>
        <div className="mt-4 text-center min-h-[48px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.25 }}
            >
              <span className="font-serif italic text-navy/70 text-base block font-medium">
                {images[currentImageIndex].title}
              </span>
              <span className="font-mono text-[10px] text-navy/40 uppercase tracking-widest block mt-1">
                {images[currentImageIndex].location}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Decorative Pin Badge simulating a traveler pin */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-amber-accent rounded-full border-2 border-white shadow-sm z-10"></div>
    </div>
  );
}
