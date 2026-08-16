import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Compass, Calendar, Users, CreditCard, User, Menu, LogOut, X,
  Plus, Utensils, Car, Bed, Compass as ActivityIcon, Tag,
  ChevronDown, Filter, Trash2, AlertTriangle, Receipt
} from 'lucide-react';
import LogoIcon from '../components/LogoIcon';
import { BANGLADESH_PERSONAL_EXPENSES, BANGLADESH_GROUP_EXPENSES } from '../mockData';
import { expenseService } from '../services/expenseService';
import { useAuth } from '../contexts/AuthContext';

// Pre-defined category icons & color tokens for horizontal breakdown
const CATEGORIES = {
  Food: { name: 'Food', icon: Utensils, color: 'bg-[#2D6E68]', hex: '#2D6E68' },
  Transport: { name: 'Transport', icon: Car, color: 'bg-[#D98E3D]', hex: '#D98E3D' },
  Lodging: { name: 'Lodging', icon: Bed, color: 'bg-[#4B6584]', hex: '#4B6584' },
  Activities: { name: 'Activities', icon: ActivityIcon, color: 'bg-[#778CA3]', hex: '#778CA3' },
  Other: { name: 'Other', icon: Tag, color: 'bg-[#A5B1C2]', hex: '#A5B1C2' }
};

export default function ExpenseTrackerPage({ onNavigate, trips = [], initialTripId = null, tripsLoading = false }) {
  const { tripId: routeTripId } = useParams();
  const { user, profile, logout } = useAuth();
  const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const shouldReduceMotion = useReducedMotion();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(routeTripId || initialTripId ? 'group' : 'personal'); // 'personal' | 'group'

  // Filter group-eligible trips (only trips with type "Group" or all trips)
  const groupTrips = trips.filter(t => t.type === 'Group').length > 0 ? trips.filter(t => t.type === 'Group') : trips;
  const [selectedTripId, setSelectedTripId] = useState(() => routeTripId || initialTripId || groupTrips[0]?.id || null);

  useEffect(() => {
    if (!selectedTripId && (routeTripId || initialTripId || groupTrips[0]?.id)) setSelectedTripId(routeTripId || initialTripId || groupTrips[0].id);
  }, [groupTrips, initialTripId, routeTripId, selectedTripId]);

  // State data initialized with Bangladesh dataset
  const [personalExpenses, setPersonalExpenses] = useState(useMock ? BANGLADESH_PERSONAL_EXPENSES : []);
  const [groupExpensesMap, setGroupExpensesMap] = useState(useMock ? BANGLADESH_GROUP_EXPENSES : {});
  const [loadingExpenses, setLoadingExpenses] = useState(!useMock);
  const [expenseError, setExpenseError] = useState('');

  // Category filter state
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Inline Add Expense form toggle & state
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    description: '',
      paidById: user?.id || ''
  });

  // Active group trip object
  const currentTrip = trips.find(t => String(t.id) === String(selectedTripId)) || groupTrips[0] || (useMock ? {
    id: 1,
    destination: "Kyoto Autumn Walk",
    budget: "4500.00",
    members: [
      { id: 1, name: "Sarah Jenkins", initial: "S", bg: "bg-teal-primary/20 text-teal-primary" },
      { id: 2, name: "Marcus Vance", initial: "M", bg: "bg-amber-accent/20 text-amber-accent" },
      { id: 3, name: "Kenji Sato", initial: "K", bg: "bg-navy/20 text-navy" }
    ]
  } : null);
  const firstTripMemberId = currentTrip?.members?.[0]?.id;

  const currentGroupExpenses = currentTrip ? groupExpensesMap[currentTrip.id] || [] : [];

  useEffect(() => {
    if (useMock) return;
    if (!user?.id || tripsLoading) {
      setLoadingExpenses(Boolean(tripsLoading));
      return;
    }
    if (trips.length === 0) {
      setLoadingExpenses(false);
      return;
    }

    let active = true;
    setLoadingExpenses(true);
    setExpenseError('');
    Promise.all(trips.map((trip) => expenseService.list(trip.id).then((items) => ({ tripId: trip.id, items }))))
      .then((results) => {
        if (!active) return;
        const nextMap = Object.fromEntries(results.map(({ tripId, items }) => [tripId, items]));
        setGroupExpensesMap(nextMap);
        setPersonalExpenses(results.flatMap(({ items }) => items).filter((item) => item.userId === user.id));
      })
      .catch((error) => {
        if (active) setExpenseError(error.message || 'Unable to load expenses from the server.');
      })
      .finally(() => { if (active) setLoadingExpenses(false); });
    return () => { active = false; };
  }, [trips, tripsLoading, user?.id, useMock]);

  // Reset form when tab or trip changes
  useEffect(() => {
    setIsAddingExpense(false);
    setFormData({
      amount: '',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
      description: '',
      paidById: firstTripMemberId || user?.id || ''
    });
  }, [activeTab, selectedTripId, user?.id, firstTripMemberId]);

  // Current dataset based on tab
  const activeDataset = activeTab === 'personal' ? personalExpenses : currentGroupExpenses;

  // Filter dataset by Category if set
  const filteredExpenses = categoryFilter === 'All'
    ? activeDataset
    : activeDataset.filter(item => item.category === categoryFilter);

  // Total running calculation
  const totalAmount = activeDataset.reduce((sum, item) => sum + Number(item.amount), 0);

  // Month grouping helper
  const groupedByMonth = filteredExpenses.reduce((groups, item) => {
    const month = item.month || 'Recent Expenses';
    if (!groups[month]) groups[month] = [];
    groups[month].push(item);
    return groups;
  }, {});

  // Category breakdown calculation for horizontal bar
  const categoryBreakdown = Object.keys(CATEGORIES).map(catKey => {
    const catTotal = activeDataset
      .filter(item => item.category === catKey)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const percent = totalAmount > 0 ? (catTotal / totalAmount) * 100 : 0;
    return { name: catKey, total: catTotal, percent, ...CATEGORIES[catKey] };
  });

  // Group Member breakdown
  const memberBreakdown = currentTrip?.members?.map(member => {
    const memberTotal = currentGroupExpenses
      .filter(item => item.paidBy?.name === member.name)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    return { ...member, amountLogged: memberTotal };
  }) || [];

  const tripBudgetNum = parseFloat(currentTrip?.budget || 0);
  const isOverBudget = activeTab === 'group' && totalAmount > tripBudgetNum;
  const budgetPercent = tripBudgetNum > 0 ? Math.min(Math.round((totalAmount / tripBudgetNum) * 100), 100) : 0;

  // Form submit handler
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    const parsedAmount = parseFloat(formData.amount);
    const dateObj = new Date(formData.date);
    const monthFormatted = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    if (!useMock) {
      if (!currentTrip?.id) { setExpenseError('Create or select a trip before adding an expense.'); return; }
      setExpenseError('');
      try {
        if (editingExpenseId) {
          await expenseService.update(editingExpenseId, formData);
        } else {
          await expenseService.create(currentTrip.id, formData);
        }
        const refreshed = await expenseService.list(currentTrip.id);
        setGroupExpensesMap((current) => ({ ...current, [currentTrip.id]: refreshed }));
        setPersonalExpenses((current) => [
          ...current.filter((item) => item.tripId !== currentTrip.id),
          ...refreshed.filter((item) => item.userId === user?.id),
        ]);
      } catch (error) {
        setExpenseError(error.message || 'Unable to save the expense.');
        return;
      }
    } else if (activeTab === 'personal') {
      const newExp = {
        id: `p-${Date.now()}`,
        date: formData.date,
        description: formData.description,
        category: formData.category,
        amount: parsedAmount,
        month: monthFormatted
      };
      setPersonalExpenses([newExp, ...personalExpenses]);
    } else {
      const paidMember = currentTrip?.members?.find(m => m.id === Number(formData.paidById)) || currentTrip?.members?.[0];
      const newExp = {
        id: `g-${Date.now()}`,
        date: formData.date,
        description: formData.description,
        category: formData.category,
        amount: parsedAmount,
        month: monthFormatted,
        paidBy: paidMember
      };
      setGroupExpensesMap(prev => ({
        ...prev,
        [currentTrip.id]: [newExp, ...(prev[currentTrip.id] || [])]
      }));
    }

    setIsAddingExpense(false);
    setFormData({
      amount: '',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
      description: '',
      paidById: currentTrip?.members?.[0]?.id || user?.id || ''
    });
    setEditingExpenseId(null);
  };

  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setFormData({
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date,
      description: expense.description,
      paidById: expense.paidBy?.id || user?.id || '',
    });
    setIsAddingExpense(true);
  };

  const handleDeleteExpense = async (id) => {
    if (!useMock) {
      try {
        await expenseService.remove(id);
        const refreshed = await expenseService.list(currentTrip.id);
        setGroupExpensesMap((current) => ({ ...current, [currentTrip.id]: refreshed }));
        setPersonalExpenses((current) => [
          ...current.filter((item) => item.tripId !== currentTrip.id),
          ...refreshed.filter((item) => item.userId === user?.id),
        ]);
      } catch (error) { setExpenseError(error.message || 'Unable to delete the expense.'); }
      return;
    }
    if (activeTab === 'personal') {
      setPersonalExpenses(prev => prev.filter(item => item.id !== id));
    } else {
      setGroupExpensesMap(prev => ({
        ...prev,
        [currentTrip.id]: (prev[currentTrip.id] || []).filter(item => item.id !== id)
      }));
    }
  };

  // Sidebar Menu Items
  const menuItems = [
    { name: 'Dashboard', icon: <Compass size={18} />, active: false, action: () => onNavigate('dashboard') },
    { name: 'My Trips', icon: <Calendar size={18} />, active: false, action: () => onNavigate('dashboard') },
    { name: 'Browse Groups', icon: <Users size={18} />, active: false, action: () => onNavigate('browse-groups') },
    { name: 'Expenses', icon: <CreditCard size={18} />, active: true, action: () => onNavigate('expenses') },
    { name: 'Profile', icon: <User size={18} />, active: false, action: () => onNavigate('profile') }
  ];

  return (
    <div className="min-h-screen bg-[#F5F6F4]/40 text-navy font-sans flex flex-col lg:flex-row relative">
      {/* Live Region for Screen Readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Current total expense is ${totalAmount.toFixed(2)}. {isOverBudget ? 'Warning: Group spend is over budget.' : ''}
      </div>

      {/* Mobile Top Header */}
      <div className="lg:hidden w-full h-16 bg-white border-b border-border-custom px-6 flex items-center justify-between sticky top-0 z-40">
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}
          className="flex items-center gap-2.5 font-serif text-xl font-semibold tracking-tight text-navy"
        >
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

      {/* Persistent Left Sidebar (Desktop) */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r border-border-custom py-8 flex flex-col justify-between z-30 transition-transform duration-300 lg:translate-x-0
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="space-y-8 px-6">
          <div className="flex items-center justify-between">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}
              className="flex items-center gap-2.5 font-serif text-2xl font-semibold tracking-tight text-navy focus-visible:outline-2 focus-visible:outline-teal-primary rounded"
            >
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
              <span className="text-sm font-bold text-navy block truncate">{profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler'}</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-navy/40 block">Explorer</span>
            </div>
          </div>

          <button
            onClick={async () => { await logout(); onNavigate('auth', 'login'); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-navy/75 hover:text-red-600 rounded-lg hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary transition-colors text-left"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow lg:pl-64 min-h-screen flex flex-col">
        <div className="max-w-5xl mx-auto w-full px-6 py-8 md:py-12 flex-grow flex flex-col space-y-8">
          
          {/* Header & Tabs Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border-custom pb-6">
            <div className="text-left space-y-2">
              <h1 className="text-3xl md:text-4xl font-serif text-navy">
                Expenses
              </h1>
              
              {/* Tabs Toggle */}
              <div className="flex items-center gap-6 pt-2" role="tablist" aria-label="Expense views">
                <button
                  role="tab"
                  aria-selected={activeTab === 'personal'}
                  onClick={() => setActiveTab('personal')}
                  className={`
                    relative text-sm font-semibold pb-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded-xs
                    ${activeTab === 'personal' ? 'text-teal-primary' : 'text-navy/60 hover:text-navy'}
                  `}
                >
                  Personal
                  {activeTab === 'personal' && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-primary"
                    />
                  )}
                </button>

                <button
                  role="tab"
                  aria-selected={activeTab === 'group'}
                  onClick={() => setActiveTab('group')}
                  className={`
                    relative text-sm font-semibold pb-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded-xs
                    ${activeTab === 'group' ? 'text-teal-primary' : 'text-navy/60 hover:text-navy'}
                  `}
                >
                  Group
                  {activeTab === 'group' && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-primary"
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Selector dropdown for Group view */}
            {activeTab === 'group' && (
              <div className="flex items-center gap-3 self-start md:self-auto">
                <label htmlFor="tripSelect" className="text-xs font-mono uppercase tracking-wider text-navy/50 whitespace-nowrap">
                  Trip space:
                </label>
                <div className="relative">
                  <select
                    id="tripSelect"
                    value={selectedTripId}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                    className="appearance-none bg-white border border-border-custom text-navy text-sm font-medium pr-8 pl-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary cursor-pointer"
                  >
                    {groupTrips.map(t => (
                      <option key={t.id} value={t.id}>{t.destination}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy/40 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: PERSONAL SUMMARY STRIP */}
          {activeTab === 'personal' && (
            <div className="bg-white border border-border-custom rounded-xl p-6 text-left space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-navy/50 block">Total spent this month</span>
                  <div className="font-mono text-3xl md:text-4xl font-bold text-navy mt-1 tracking-tight flex items-baseline gap-2">
                    <span>৳{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="text-xs font-sans font-normal text-navy/40">BDT</span>
                  </div>
                </div>
                <div className="text-xs font-mono text-navy/50">
                  {filteredExpenses.length} transaction{filteredExpenses.length === 1 ? '' : 's'} logged
                </div>
              </div>

              {/* Compact horizontal category bar */}
              <div className="space-y-2.5 pt-2 border-t border-border-custom/60">
                <div className="w-full h-2.5 bg-fog rounded-full overflow-hidden flex">
                  {categoryBreakdown.map((cat) => (
                    cat.percent > 0 && (
                      <div
                        key={cat.name}
                        className={`h-full ${cat.color} transition-all duration-300`}
                        style={{ width: `${cat.percent}%` }}
                        title={`${cat.name}: $${cat.total.toFixed(2)} (${cat.percent.toFixed(1)}%)`}
                      />
                    )
                  ))}
                </div>

                {/* Bar Legend */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono text-navy/70">
                  {categoryBreakdown.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${cat.color} inline-block`} />
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-navy/40">${cat.total.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GROUP SUMMARY CARD */}
          {activeTab === 'group' && (
            <div className="bg-white border border-border-custom rounded-xl p-6 text-left space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-navy/50 block">
                    Group spend — {currentTrip?.destination || 'Selected trip'}
                  </span>
                  <div className="font-mono text-3xl md:text-4xl font-bold text-navy mt-1 tracking-tight flex items-baseline gap-3">
                    <span className={isOverBudget ? "text-amber-accent" : "text-navy"}>
                      ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm font-sans font-normal text-navy/50">
                      of ${tripBudgetNum.toLocaleString('en-US', { minimumFractionDigits: 2 })} budget
                    </span>
                  </div>
                </div>

                {isOverBudget && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-accent/10 border border-amber-accent/30 text-amber-accent text-xs font-semibold self-start md:self-auto">
                    <AlertTriangle size={16} />
                    <span>Over trip budget</span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full h-2.5 bg-fog rounded-full overflow-hidden border border-border-custom/50">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${isOverBudget ? 'bg-amber-accent' : 'bg-teal-primary'}`}
                    style={{ width: `${budgetPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-navy/50">
                  <span>{budgetPercent}% used</span>
                  <span>${Math.max(0, tripBudgetNum - totalAmount).toFixed(2)} remaining</span>
                </div>
              </div>

              {/* Per-member breakdown */}
              <div className="pt-4 border-t border-border-custom/60 space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-navy/50 block">Logged per member</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {memberBreakdown.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-2.5 bg-fog/60 border border-border-custom/60 rounded-lg">
                      <div className={`w-8 h-8 rounded-full border border-white flex items-center justify-center text-xs font-serif font-bold ${m.bg}`}>
                        {m.initial}
                      </div>
                      <div className="overflow-hidden text-left">
                        <span className="text-xs font-semibold text-navy block truncate">{m.name}</span>
                        <span className="font-mono text-xs text-navy/60 font-semibold block">${m.amountLogged.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACTION BAR: Category filter & Inline Form CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none" role="group" aria-label="Filter expenses by category">
              <span className="text-xs font-mono uppercase tracking-wider text-navy/40 flex items-center gap-1 mr-1">
                <Filter size={12} /> Filter:
              </span>
              {['All', ...Object.keys(CATEGORIES)].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`
                    px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary
                    ${categoryFilter === cat
                      ? 'bg-navy text-white'
                      : 'bg-white border border-border-custom text-navy/70 hover:border-navy/40'}
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Inline Add Expense Trigger */}
            <button
              onClick={() => { setEditingExpenseId(null); setIsAddingExpense(!isAddingExpense); }}
              className="inline-flex items-center justify-center gap-2 bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-transform duration-150 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary focus-visible:outline-offset-2 shadow-sm self-end sm:self-auto w-full sm:w-auto"
            >
              {isAddingExpense ? <X size={16} /> : <Plus size={16} />}
              <span>{activeTab === 'personal' ? 'Add expense' : 'Add group expense'}</span>
            </button>
          </div>

          {/* INLINE EXPAND FORM */}
          <AnimatePresence>
            {isAddingExpense && (
              <motion.div
                initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <form
                  onSubmit={handleSaveExpense}
                  className="bg-white border border-teal-primary/30 rounded-xl p-6 text-left shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-border-custom pb-3">
                    <h3 className="text-lg font-serif font-medium text-navy">
                      {activeTab === 'personal' ? 'Log Personal Expense' : `Log Group Expense for ${currentTrip?.destination || 'selected trip'}`}
                    </h3>
                    <span className="text-xs font-mono text-navy/40">Inline Entry</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Amount */}
                    <div className="space-y-1">
                      <label htmlFor="expAmount" className="text-xs font-semibold text-navy/70 block">
                        Amount ($USD)
                      </label>
                      <input
                        id="expAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full bg-fog border border-border-custom text-navy font-mono text-sm px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                      <label htmlFor="expCategory" className="text-xs font-semibold text-navy/70 block">
                        Category
                      </label>
                      <select
                        id="expCategory"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-fog border border-border-custom text-navy text-sm px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                      >
                        {Object.keys(CATEGORIES).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date */}
                    <div className="space-y-1">
                      <label htmlFor="expDate" className="text-xs font-semibold text-navy/70 block">
                        Date
                      </label>
                      <input
                        id="expDate"
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-fog border border-border-custom text-navy font-mono text-sm px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                      />
                    </div>

                    {/* Paid By (Group mode only) */}
                    {activeTab === 'group' && (
                      <div className="space-y-1">
                        <label htmlFor="expPaidBy" className="text-xs font-semibold text-navy/70 block">
                          Paid by
                        </label>
                        <select
                          id="expPaidBy"
                          value={formData.paidById}
                          onChange={(e) => setFormData({ ...formData, paidById: e.target.value })}
                          className="w-full bg-fog border border-border-custom text-navy text-sm px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                        >
                          {currentTrip?.members?.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label htmlFor="expDesc" className="text-xs font-semibold text-navy/70 block">
                      Short Description
                    </label>
                    <input
                      id="expDesc"
                      type="text"
                      placeholder="e.g. Bus tickets from Kyoto station"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-fog border border-border-custom text-navy text-sm px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingExpense(false)}
                      className="px-4 py-2 text-xs font-semibold text-navy/70 hover:text-navy bg-fog hover:bg-border-custom/40 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-semibold text-white bg-teal-primary hover:bg-teal-hover rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                    >
                      {editingExpenseId ? 'Update expense' : 'Save expense'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {expenseError && <div className="travel-alert" role="alert"><AlertTriangle size={16} /><span>{expenseError}</span></div>}
          {loadingExpenses ? <div className="travel-panel travel-empty"><span className="travel-loading-dot" /><h3>Loading persisted expenses…</h3></div> : null}

          {/* EXPENSE LIST / EMPTY STATE */}
          {!loadingExpenses && (
          <div className="space-y-6">
            {Object.keys(groupedByMonth).length === 0 ? (
              /* EMPTY STATE */
              <div className="border border-dashed border-border-custom rounded-xl p-12 md:p-16 bg-white flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-fog flex items-center justify-center text-navy/30" aria-hidden="true">
                  <Receipt size={32} strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-serif font-medium text-navy">No expenses logged yet</h3>
                  <p className="text-sm text-navy/60 max-w-sm font-normal leading-relaxed">
                    {categoryFilter !== 'All' 
                      ? `No expenses found matching the "${categoryFilter}" category filter.` 
                      : 'Keep clear ledger records for your solo travels or split costs seamlessly with group members.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingExpense(true)}
                  className="inline-flex items-center justify-center gap-2 bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-transform duration-150 hover:-translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                >
                  <Plus size={16} />
                  <span>{activeTab === 'personal' ? 'Add expense' : 'Add group expense'}</span>
                </button>
              </div>
            ) : (
              /* GROUPED EXPENSE LIST */
              <motion.div 
                layout 
                className="space-y-8 text-left"
                transition={{ duration: 0.2 }}
              >
                {Object.entries(groupedByMonth).map(([month, items]) => (
                  <div key={month} className="space-y-3">
                    {/* Sticky Sub-header per Month */}
                    <div className="sticky top-16 z-10 bg-[#F5F6F4]/90 backdrop-blur-xs py-2 border-b border-border-custom/70 flex items-center justify-between">
                      <span className="font-mono text-xs font-bold uppercase tracking-widest text-navy/60">
                        {month}
                      </span>
                      <span className="font-mono text-xs font-semibold text-navy/40">
                        ${items.reduce((s, i) => s + Number(i.amount), 0).toFixed(2)}
                      </span>
                    </div>

                    {/* Expense Rows */}
                    <div className="space-y-2">
                      <AnimatePresence initial={false}>
                        {items.map((item) => {
                          const CatMeta = CATEGORIES[item.category] || CATEGORIES.Other;
                          const IconComponent = CatMeta.icon;

                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                              transition={{ duration: 0.2 }}
                              className="bg-white border border-border-custom rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-navy/30 transition-colors group"
                            >
                              <div className="flex items-start sm:items-center gap-3.5">
                                {/* Icon */}
                                <div className={`w-10 h-10 rounded-lg ${CatMeta.color}/10 text-navy flex items-center justify-center flex-shrink-0`}>
                                  <IconComponent size={20} className="text-navy/80" />
                                </div>

                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-semibold text-navy group-hover:text-teal-primary transition-colors">
                                      {item.description}
                                    </h4>
                                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-fog rounded border border-border-custom/60 text-navy/60">
                                      {item.category}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3 text-xs font-mono text-navy/50">
                                    <span>{item.date}</span>
                                    {activeTab === 'group' && item.paidBy && (
                                      <span className="flex items-center gap-1.5">
                                        • paid by 
                                        <span className={`w-4 h-4 rounded-full ${item.paidBy.bg} inline-flex items-center justify-center text-[9px] font-bold font-serif`}>
                                          {item.paidBy.initial}
                                        </span>
                                        <strong className="font-normal text-navy/70">{item.paidBy.name}</strong>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-border-custom/50 pt-2 sm:pt-0">
                                <span className="font-mono text-base font-bold text-navy">
                                  ${Number(item.amount).toFixed(2)}
                                </span>

                                <button
                                  onClick={() => handleEditExpense(item)}
                                  className="p-1.5 text-navy/30 hover:text-teal-primary hover:bg-teal-primary/10 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                                  title="Edit expense entry"
                                  aria-label={`Edit expense: ${item.description}`}
                                >
                                  <Receipt size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(item.id)}
                                  className="p-1.5 text-navy/30 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                                  title="Delete expense entry"
                                  aria-label={`Delete expense: ${item.description}`}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
          )}

        </div>
      </main>
    </div>
  );
}
