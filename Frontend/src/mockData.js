// Porikroma 2.0 (Waypoint Bangladesh Edition) - Master Mock Dataset

export const BANGLADESH_TRIPS = [
  {
    id: 1,
    destination: "Cox's Bazar Sea Beach & Inani",
    dates: "06 OCT - 12 OCT 2026",
    type: "Group",
    status: "Planning",
    statusColor: "bg-teal-primary/10 text-teal-primary border-teal-primary/20",
    budgetPercent: 82,
    budget: "25000.00",
    members: [
      { id: 1, name: "Sarah Jenkins", initial: "S", role: "Creator", bg: "bg-teal-primary/20 text-teal-primary" },
      { id: 2, name: "Tanvir Hossain", initial: "T", role: "Member", bg: "bg-amber-accent/20 text-amber-accent" },
      { id: 3, name: "Nusrat Jahan", initial: "N", role: "Member", bg: "bg-navy/20 text-navy" }
    ],
    extraMembers: 0,
    joinRequests: [
      { id: 4, name: "Rafiqul Islam", initial: "R", bg: "bg-red-400/20 text-red-600", answer: "I love beach trekking and sunset photography. I'd love to join a friendly group!" },
      { id: 5, name: "Anika Chowdhury", initial: "A", bg: "bg-purple-400/20 text-purple-600", answer: "Looking for a relaxed trip to Marine Drive and Himchari waterfall." }
    ],
    rejoinRequests: []
  },
  {
    id: 2,
    destination: "Sreemangal Tea Gardens & Lawachara",
    dates: "12 JUL - 16 JUL 2026",
    type: "Solo",
    status: "Planning",
    statusColor: "bg-amber-accent/10 text-amber-accent border-amber-accent/20",
    budgetPercent: 45,
    budget: "12000.00",
    members: [
      { id: 1, name: "Sarah Jenkins", initial: "S", role: "Creator", bg: "bg-teal-primary/20 text-teal-primary" }
    ],
    extraMembers: 0,
    joinRequests: [],
    rejoinRequests: [],
    matchedCompanions: [
      { id: 10, name: "Farhan Ahmed", initial: "F", role: "Auto-matched", bg: "bg-blue-400/20 text-blue-600" },
      { id: 11, name: "Sadia Rahman", initial: "S", role: "Auto-matched", bg: "bg-pink-400/20 text-pink-600" }
    ]
  },
  {
    id: 3,
    destination: "Sajek Valley & Ruilui Para",
    dates: "15 DEC - 20 DEC 2026",
    type: "Group",
    status: "Completed",
    statusColor: "bg-navy/10 text-navy/60 border-navy/20",
    budgetPercent: 100,
    budget: "30000.00",
    members: [
      { id: 1, name: "Sarah Jenkins", initial: "S", role: "Creator", bg: "bg-teal-primary/20 text-teal-primary" },
      { id: 8, name: "Kazi Arafat", initial: "K", role: "Member", bg: "bg-red-400/20 text-red-600" },
      { id: 9, name: "Mehedi Hasan", initial: "M", role: "Member", bg: "bg-blue-400/20 text-blue-600" }
    ],
    extraMembers: 0,
    joinRequests: [],
    rejoinRequests: []
  },
  {
    id: 4,
    destination: "Sundarbans Mangrove Safari",
    dates: "10 JAN - 15 JAN 2027",
    type: "Group",
    status: "Planning",
    statusColor: "bg-teal-primary/10 text-teal-primary border-teal-primary/20",
    budgetPercent: 60,
    budget: "45000.00",
    members: [
      { id: 1, name: "Sarah Jenkins", initial: "S", role: "Creator", bg: "bg-teal-primary/20 text-teal-primary" },
      { id: 12, name: "Shakib Al Hasan", initial: "S", role: "Member", bg: "bg-teal-primary/20 text-teal-primary" }
    ],
    extraMembers: 2,
    joinRequests: [],
    rejoinRequests: []
  },
  {
    id: 5,
    destination: "Tanguar Haor & Niladri Lake",
    dates: "01 SEP - 05 SEP 2026",
    type: "Group",
    status: "Planning",
    statusColor: "bg-teal-primary/10 text-teal-primary border-teal-primary/20",
    budgetPercent: 35,
    budget: "18000.00",
    members: [
      { id: 1, name: "Sarah Jenkins", initial: "S", role: "Creator", bg: "bg-teal-primary/20 text-teal-primary" }
    ],
    extraMembers: 3,
    joinRequests: [],
    rejoinRequests: []
  }
];

export const BANGLADESH_HOTELS = [
  { id: 'HTL-BD-01', name: 'Sayeman Beach Resort', location: 'Marine Drive, Cox\'s Bazar', price: 9500.00, capacity: 4, status: 'Active' },
  { id: 'HTL-BD-02', name: 'Grand Sultan Tea Resort & Golf', location: 'Sreemangal, Moulvibazar', price: 14500.00, capacity: 4, status: 'Active' },
  { id: 'HTL-BD-03', name: 'Sajek Resort (Lushai Cottage)', location: 'Ruilui Para, Sajek Valley', price: 550.00, capacity: 6, status: 'Active' },
  { id: 'HTL-BD-04', name: 'Dera Resort & Spa', location: 'Cox\'s Bazar - Teknaf Marine Drive', price: 8000.00, capacity: 2, status: 'Active' },
  { id: 'HTL-BD-05', name: 'The Palace Luxury Resort', location: 'Bahubal, Habiganj', price: 18500.00, capacity: 5, status: 'Active' },
  { id: 'HTL-BD-06', name: 'Tanguar Haor Luxury Houseboat', location: 'Sunamganj', price: 7500.00, capacity: 8, status: 'Active' },
  { id: 'HTL-BD-07', name: 'Novem Eco Resort', location: 'Radhanagar, Sreemangal', price: 6200.00, capacity: 4, status: 'Draft' }
];

export const BANGLADESH_VEHICLES = [
  { id: 'VHC-BD-01', name: 'Chander Gari (4x4 Jeep)', detail: '10 Passengers - Khagrachari to Sajek', price: 4500.00, capacity: 10, type: 'Vehicle', status: 'Active' },
  { id: 'VHC-BD-02', name: 'Toyota HiAce Microbus (AC)', detail: '11 Passengers - Dhaka to Cox\'s Bazar Corridor', price: 8500.00, capacity: 11, type: 'Vehicle', status: 'Active' },
  { id: 'VHC-BD-03', name: 'Engine Boat (Haor Shikari)', detail: '15 Passengers - Sunamganj to Tanguar Haor', price: 6000.00, capacity: 15, type: 'Vehicle', status: 'Active' },
  { id: 'VHC-BD-04', name: 'Noah SQ Microbus', detail: '7 Passengers - Sreemangal Local Sightseeing', price: 4000.00, capacity: 7, type: 'Vehicle', status: 'Active' },
  { id: 'VHC-BD-05', name: 'Sundarbans Launch Charter', detail: '30 Passengers - Khulna Mongla Port to Katka', price: 35000.00, capacity: 30, type: 'Vehicle', status: 'Draft' }
];

export const BANGLADESH_TICKETS = [
  { id: 'TCK-BD-01', name: 'Dhaka (Kamalapur) → Cox\'s Bazar', detail: 'Cox\'s Bazar Express (Snigdha AC Chair)', price: 1350.00, type: 'Ticket', mode: 'Train', origin: 'Dhaka Kamalapur', destination: 'Cox\'s Bazar Station', status: 'Active' },
  { id: 'TCK-BD-02', name: 'Dhaka (DAC) → Cox\'s Bazar (CXB)', detail: 'Biman Bangladesh Airlines (Economy)', price: 4800.00, type: 'Ticket', mode: 'Flight', origin: 'Dhaka (DAC)', destination: 'Cox\'s Bazar (CXB)', status: 'Active' },
  { id: 'TCK-BD-03', name: 'Dhaka (Sayedabad) → Sreemangal', detail: 'Parabat Express (AC Snigdha)', price: 580.00, type: 'Ticket', mode: 'Train', origin: 'Dhaka Kamalapur', destination: 'Sreemangal Station', status: 'Active' },
  { id: 'TCK-BD-04', name: 'Dhaka (Fakirapool) → Khagrachari', detail: 'Shyamoli NR Travels (Scania Multi-Axle AC)', price: 1400.00, type: 'Ticket', mode: 'Bus', origin: 'Dhaka Fakirapool', destination: 'Khagrachari Bus Stand', status: 'Active' },
  { id: 'TCK-BD-05', name: 'Dhaka (DAC) → Sylhet (ZYL)', detail: 'US-Bangla Airlines (Economy)', price: 3800.00, type: 'Ticket', mode: 'Flight', origin: 'Dhaka (DAC)', destination: 'Sylhet (ZYL)', status: 'Active' }
];

export const BANGLADESH_PERSONAL_EXPENSES = [
  { id: 'p1', date: '2026-08-10', description: 'Cox\'s Bazar Express Train Ticket (Snigdha Class)', category: 'Transport', amount: 1350.00, month: 'August 2026' },
  { id: 'p2', date: '2026-08-08', description: 'Fresh Rupchanda BBQ & Seafood at Jhaubon', category: 'Food', amount: 1850.00, month: 'August 2026' },
  { id: 'p3', date: '2026-08-02', description: 'Travel insurance & emergency medical kit', category: 'Other', amount: 850.00, month: 'August 2026' },
  { id: 'p4', date: '2026-07-28', description: 'Trekking shoes & raincoat for Lawachara', category: 'Other', amount: 2400.00, month: 'July 2026' },
  { id: 'p5', date: '2026-07-15', description: '7-Layer Tea experience at Nilkantha Tea Cabin', category: 'Food', amount: 350.00, month: 'July 2026' }
];

export const BANGLADESH_GROUP_EXPENSES = {
  1: [ // Cox's Bazar Sea Beach
    { id: 'g1', date: '2026-08-09', description: 'Sayeman Beach Resort rooms advance payment', category: 'Lodging', amount: 28500.00, month: 'August 2026', paidBy: { name: 'Sarah Jenkins', initial: 'S', bg: 'bg-teal-primary/20 text-teal-primary' } },
    { id: 'g2', date: '2026-08-05', description: 'Group dinner at Mermaid Eco Resort Cafe', category: 'Food', amount: 6400.00, month: 'August 2026', paidBy: { name: 'Tanvir Hossain', initial: 'T', bg: 'bg-amber-accent/20 text-amber-accent' } },
    { id: 'g3', date: '2026-08-01', description: 'Private AC Microbus rental for Marine Drive', category: 'Transport', amount: 8500.00, month: 'August 2026', paidBy: { name: 'Nusrat Jahan', initial: 'N', bg: 'bg-navy/20 text-navy' } }
  ],
  3: [ // Sajek Valley
    { id: 'g5', date: '2026-07-10', description: 'Chander Gari (4x4 Jeep) Khagrachari to Sajek', category: 'Transport', amount: 9000.00, month: 'July 2026', paidBy: { name: 'Kazi Arafat', initial: 'K', bg: 'bg-red-400/20 text-red-600' } },
    { id: 'g6', date: '2026-07-12', description: 'Ruilui Para Cottage full payment', category: 'Lodging', amount: 16500.00, month: 'July 2026', paidBy: { name: 'Sarah Jenkins', initial: 'S', bg: 'bg-teal-primary/20 text-teal-primary' } },
    { id: 'g7', date: '2026-07-14', description: 'Bamboo Chicken & Helipad group dinner', category: 'Food', amount: 4500.00, month: 'July 2026', paidBy: { name: 'Mehedi Hasan', initial: 'M', bg: 'bg-blue-400/20 text-blue-600' } }
  ]
};

export const BANGLADESH_CITIES = [
  "Cox's Bazar, Chittagong",
  "Sreemangal, Moulvibazar",
  "Sajek Valley, Rangamati",
  "Sundarbans, Khulna",
  "Tanguar Haor, Sunamganj",
  "Saint Martin's Island, Cox's Bazar",
  "Bandarban, Chittagong Hill Tracts",
  "Sylhet Sadar, Sylhet",
  "Kuakata Sea Beach, Patuakhali",
  "Rangamati Sadar, Rangamati"
];

export const BANGLADESH_OPEN_GROUPS = [
  {
    id: 101,
    destination: "Cox's Bazar & Saint Martin's Island",
    dates: "15 OCT - 22 OCT 2026",
    dateKey: "autumn",
    creator: "Tanvir",
    creatorBg: "bg-teal-primary/20 text-teal-primary",
    members: [
      { initial: "T", bg: "bg-teal-primary/20 text-teal-primary" },
      { initial: "N", bg: "bg-amber-accent/20 text-amber-accent" },
      { initial: "R", bg: "bg-navy/20 text-navy" }
    ],
    openSlots: true,
    slotsLeft: 2,
    question: "Are you comfortable taking a 3-hour sea-vessel journey to Saint Martin's Island?"
  },
  {
    id: 102,
    destination: "Sajek Valley & Alutila Cave Expedition",
    dates: "04 JUL - 11 JUL 2026",
    dateKey: "summer",
    creator: "Rafiq",
    creatorBg: "bg-blue-400/20 text-blue-600",
    members: [
      { initial: "R", bg: "bg-blue-400/20 text-blue-600" },
      { initial: "P", bg: "bg-purple-400/20 text-purple-600" }
    ],
    openSlots: true,
    slotsLeft: 3,
    question: "Are you okay with riding Chander Gari (4x4 Jeep) on steep hill roads?"
  },
  {
    id: 103,
    destination: "Sundarbans Wildlife Forest Safari",
    dates: "18 JUN - 25 JUN 2026",
    dateKey: "summer",
    creator: "Nusrat",
    creatorBg: "bg-red-400/20 text-red-600",
    members: [
      { initial: "N", bg: "bg-red-400/20 text-red-600" },
      { initial: "E", bg: "bg-teal-primary/10 text-teal-primary" },
      { initial: "T", bg: "bg-amber-accent/10 text-amber-accent" },
      { initial: "A", bg: "bg-navy/10 text-navy" }
    ],
    openSlots: false,
    slotsLeft: 0,
    question: "Do you have prior experience staying 3 days on a forest launch?"
  },
  {
    id: 104,
    destination: "Sreemangal Tea Garden Trek & Lawachara",
    dates: "10 APR - 17 APR 2026",
    dateKey: "spring",
    creator: "Sadia",
    creatorBg: "bg-purple-400/20 text-purple-600",
    members: [
      { initial: "S", bg: "bg-purple-400/20 text-purple-600" }
    ],
    openSlots: true,
    slotsLeft: 4,
    question: "Are you ready to walk 10km through rainforest paths early morning?"
  }
];
