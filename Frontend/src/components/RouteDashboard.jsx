import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function RouteDashboard() {
  const shouldReduceMotion = useReducedMotion();

  const pathD = "M 80,140 C 180,60 200,60 300,60 C 400,60 440,220 540,220 C 640,220 660,140 720,140";
  const waypoints = [
    { name: "Tokyo", code: "TYO • 35.67", date: "ARR: 06 OCT", cx: 80, cy: 140, textY: 172, labelPos: "below", delay: 0 },
    { name: "Hakone", code: "HCN • 35.23", date: "ARR: 10 OCT", cx: 300, cy: 60, textY: 92, labelPos: "below", delay: 0.6 },
    { name: "Kyoto", code: "UKY • 35.01", date: "ARR: 12 OCT", cx: 540, cy: 220, textY: 185, labelPos: "above", delay: 1.3 },
    { name: "Osaka", code: "OSK • 34.69", date: "ARR: 17 OCT", cx: 720, cy: 140, textY: 172, labelPos: "below", delay: 2.0 }
  ];

  return (
    <div className="w-full bg-white border border-border-custom rounded-xl overflow-hidden shadow-none flex flex-col">
      {/* Boarding Pass Ticket Header (Thematic Travel Stub) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 bg-[#FCFAF5] border-b border-dashed border-border-custom rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-accent"></div>
          <div className="flex flex-col">
            <span className="font-mono text-[9px] uppercase tracking-widest text-navy/40">Travel Document</span>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-navy">
              Boarding Pass • Group Route
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-left">
          <div>
            <span className="font-mono text-[8px] uppercase tracking-wider text-navy/40 block">Trip ID</span>
            <span className="font-mono text-xs font-semibold text-navy">PK-0412</span>
          </div>
          <div>
            <span className="font-mono text-[8px] uppercase tracking-wider text-navy/40 block">Class</span>
            <span className="font-mono text-xs font-semibold text-navy">Explorer</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Barcode */}
          <div className="flex items-center gap-[2px] h-6 opacity-60" aria-hidden="true">
            <div className="w-[1px] h-full bg-navy"></div>
            <div className="w-[3px] h-full bg-navy"></div>
            <div className="w-[1px] h-full bg-navy"></div>
            <div className="w-[1px] h-full bg-navy"></div>
            <div className="w-[2px] h-full bg-navy"></div>
            <div className="w-[4px] h-full bg-navy"></div>
            <div className="w-[1px] h-full bg-navy"></div>
            <div className="w-[2px] h-full bg-navy"></div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Panel */}
      <div className="p-4 md:p-6 bg-white relative">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-navy/40 block">Itinerary Route</span>
            <span className="font-serif text-lg font-medium text-navy">Central Japan Corridor</span>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] uppercase tracking-wider text-navy/40 block">Total distance</span>
            <span className="font-mono text-sm font-semibold text-teal-primary">584.2 KM</span>
          </div>
        </div>

        {/* SVG Route Line Canvas */}
        <div className="relative border border-border-custom rounded-lg bg-white overflow-hidden p-1">
          <svg viewBox="0 0 800 280" className="w-full h-auto overflow-visible select-none" aria-hidden="true">
            <defs>
              {/* Technical Grid Pattern */}
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#DDE1DE" strokeWidth="0.5" opacity="0.35" />
              </pattern>
              {/* Gradient for Route Line Drawing */}
              <mask id="route-mask">
                <motion.path
                  d={pathD}
                  fill="none"
                  stroke="white"
                  strokeWidth={6}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 2.0,
                    ease: "easeOut"
                  }}
                />
              </mask>
            </defs>

            {/* Render Grid Background */}
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Accent Boundary Borders inside SVG */}
            <line x1="0" y1="280" x2="800" y2="280" stroke="#DDE1DE" strokeWidth="0.5" />

            {/* Underlay path indicating the dotted design */}
            <path
              d={pathD}
              fill="none"
              stroke="#2D6A4F"
              strokeWidth={2.5}
              strokeDasharray="8 6"
              mask="url(#route-mask)"
            />

            {/* Render Waypoint Pins & Tooltips */}
            {waypoints.map((point) => {
              // Calculate label position coordinates
              const isBelow = point.labelPos === "below";
              const labelY = isBelow ? point.cy + 25 : point.cy - 70;
              const boxY = isBelow ? point.cy + 18 : point.cy - 78;

              return (
                <g key={point.name}>
                  {/* Outer Circle Halo */}
                  <motion.circle
                    cx={point.cx}
                    cy={point.cy}
                    r={11}
                    fill="#FFFFFF"
                    stroke="#2D6A4F"
                    strokeWidth={2.5}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: shouldReduceMotion ? 0 : point.delay,
                      duration: shouldReduceMotion ? 0 : 0.35,
                      ease: "easeOut"
                    }}
                  />
                  {/* Inner Dot */}
                  <motion.circle
                    cx={point.cx}
                    cy={point.cy}
                    r={4.5}
                    fill="#D98E3D"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: shouldReduceMotion ? 0 : point.delay + 0.15,
                      duration: shouldReduceMotion ? 0 : 0.2,
                      ease: "easeOut"
                    }}
                  />

                  {/* Info Box Card Container */}
                  <motion.g
                    initial={{ opacity: 0, y: isBelow ? 8 : -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: shouldReduceMotion ? 0 : point.delay + 0.3,
                      duration: shouldReduceMotion ? 0 : 0.45,
                      ease: "easeOut"
                    }}
                  >
                    {/* Background card */}
                    <rect
                      x={point.cx - 55}
                      y={boxY}
                      width={110}
                      height={48}
                      rx={6}
                      fill="#FFFFFF"
                      stroke="#DDE1DE"
                      strokeWidth={1}
                    />
                    
                    {/* Waypoint Title text */}
                    <text
                      x={point.cx}
                      y={labelY}
                      textAnchor="middle"
                      className="fill-navy font-semibold font-serif text-[11px]"
                    >
                      {point.name}
                    </text>
                    {/* Waypoint Coordinate text */}
                    <text
                      x={point.cx}
                      y={labelY + 13}
                      textAnchor="middle"
                      className="fill-navy/50 font-mono text-[8px] uppercase tracking-wide"
                    >
                      {point.code}
                    </text>
                    {/* Waypoint Date text */}
                    <text
                      x={point.cx}
                      y={labelY + 24}
                      textAnchor="middle"
                      className="fill-teal-primary font-mono text-[8px] tracking-tight font-medium"
                    >
                      {point.date}
                    </text>
                  </motion.g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
