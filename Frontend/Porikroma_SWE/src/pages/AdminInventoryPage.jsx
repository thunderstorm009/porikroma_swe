import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Search, Plus, Edit2, Trash2, Check, X, Bed, Car, Ticket,
  LogOut, Shield, ChevronRight, AlertCircle
} from 'lucide-react';
import LogoIcon from '../components/LogoIcon';
import { BANGLADESH_HOTELS, BANGLADESH_VEHICLES, BANGLADESH_TICKETS } from '../mockData';

export default function AdminInventoryPage({ onNavigate }) {
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState('Hotels'); // 'Hotels' | 'Vehicles' | 'Tickets'
  const [searchQuery, setSearchQuery] = useState('');

  // Inventory Datasets initialized with Bangladesh records
  const [hotels, setHotels] = useState(BANGLADESH_HOTELS);
  const [vehicles, setVehicles] = useState(BANGLADESH_VEHICLES);
  const [tickets, setTickets] = useState(BANGLADESH_TICKETS);

  // Delete Inline Confirm state { id: null, type: null }
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null if adding new item

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: '',
    mode: 'Train',
    origin: '',
    destination: '',
    price: '',
    capacity: '2',
    status: 'Active'
  });

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      location: '',
      type: '',
      mode: 'Train',
      origin: '',
      destination: '',
      price: '',
      capacity: '2',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      location: item.location || '',
      type: item.type || '',
      mode: item.mode || 'Train',
      origin: item.origin || '',
      destination: item.destination || '',
      price: item.price || '',
      capacity: item.capacity || '2',
      status: item.status || 'Active'
    });
    setIsModalOpen(true);
  };

  // Save Item (Add/Edit)
  const handleSaveItem = (e) => {
    e.preventDefault();
    const priceNum = parseFloat(formData.price) || 0;
    const capacityNum = parseInt(formData.capacity, 10) || 1;

    if (activeTab === 'Hotels') {
      if (editingItem) {
        setHotels(hotels.map(h => h.id === editingItem.id ? { ...h, name: formData.name, location: formData.location, price: priceNum, capacity: capacityNum, status: formData.status } : h));
      } else {
        const newItem = {
          id: `HTL-00${hotels.length + 1}`,
          name: formData.name,
          location: formData.location,
          price: priceNum,
          capacity: capacityNum,
          status: formData.status
        };
        setHotels([newItem, ...hotels]);
      }
    } else if (activeTab === 'Vehicles') {
      if (editingItem) {
        setVehicles(vehicles.map(v => v.id === editingItem.id ? { ...v, type: formData.type, price: priceNum, capacity: capacityNum, status: formData.status } : v));
      } else {
        const newItem = {
          id: `VHC-10${vehicles.length + 1}`,
          type: formData.type,
          price: priceNum,
          capacity: capacityNum,
          status: formData.status
        };
        setVehicles([newItem, ...vehicles]);
      }
    } else if (activeTab === 'Tickets') {
      if (editingItem) {
        setTickets(tickets.map(t => t.id === editingItem.id ? { ...t, mode: formData.mode, origin: formData.origin, destination: formData.destination, price: priceNum, status: formData.status } : t));
      } else {
        const newItem = {
          id: `TCK-20${tickets.length + 1}`,
          mode: formData.mode,
          origin: formData.origin,
          destination: formData.destination,
          price: priceNum,
          status: formData.status
        };
        setTickets([newItem, ...tickets]);
      }
    }

    setIsModalOpen(false);
  };

  // Delete Action
  const handleConfirmDelete = (id) => {
    if (activeTab === 'Hotels') {
      setHotels(hotels.filter(h => h.id !== id));
    } else if (activeTab === 'Vehicles') {
      setVehicles(vehicles.filter(v => v.id !== id));
    } else if (activeTab === 'Tickets') {
      setTickets(tickets.filter(t => t.id !== id));
    }
    setDeleteConfirmId(null);
  };

  // Filter Data
  const getFilteredData = () => {
    const q = searchQuery.toLowerCase();
    if (activeTab === 'Hotels') {
      return hotels.filter(h => h.name.toLowerCase().includes(q) || h.location.toLowerCase().includes(q) || h.id.toLowerCase().includes(q));
    }
    if (activeTab === 'Vehicles') {
      return vehicles.filter(v => v.type.toLowerCase().includes(q) || v.id.toLowerCase().includes(q));
    }
    if (activeTab === 'Tickets') {
      return tickets.filter(t => t.mode.toLowerCase().includes(q) || t.origin.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
    }
    return [];
  };

  const filteredItems = getFilteredData();

  return (
    <div className="min-h-screen bg-[#F5F6F4]/40 text-navy font-sans flex flex-col antialiased">
      
      {/* ADMIN TOP BAR SHELL */}
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-navy text-white text-[10px] font-mono font-semibold uppercase tracking-wider">
            <Shield size={10} /> Admin Surface
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 border-r border-border-custom pr-4">
            <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-mono text-xs font-bold">
              AD
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-navy block leading-none">System Admin</span>
              <span className="text-[10px] font-mono text-navy/40 block leading-none mt-0.5">admin@waypoint.internal</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-xs font-semibold text-navy/70 hover:text-navy px-2.5 py-1.5 rounded-lg hover:bg-fog focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary transition-colors"
          >
            <LogOut size={15} />
            <span>Exit Admin</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto w-full px-6 py-8 flex-grow flex flex-col space-y-6 text-left">
        
        {/* PAGE HEADER & TAB BAR */}
        <div className="space-y-4 border-b border-border-custom pb-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h1 className="text-3xl font-serif text-navy">Inventory</h1>
              <p className="text-xs text-navy/60 font-normal mt-0.5">
                Manage record catalogs powering the AI itinerary planner. Draft records are excluded from auto-generation.
              </p>
            </div>
          </div>

          {/* Underline Style Tabs */}
          <div className="flex items-center gap-8 pt-2" role="tablist" aria-label="Inventory categories">
            {['Hotels', 'Vehicles', 'Tickets'].map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => { setActiveTab(tab); setDeleteConfirmId(null); }}
                className={`
                  relative text-sm font-semibold pb-2.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary rounded-xs
                  ${activeTab === tab ? 'text-teal-primary' : 'text-navy/60 hover:text-navy'}
                `}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="adminTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-primary"
                    transition={{ duration: 0.15 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* TOOLBAR ROW */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-grow max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()} by name, ID, or location...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-border-custom rounded-lg pl-9 pr-3 py-2 text-sm text-navy placeholder:text-navy/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy p-0.5 rounded"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Add Item Button */}
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 bg-teal-primary hover:bg-teal-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition-transform duration-150 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary focus-visible:outline-offset-2 shadow-2xs"
          >
            <Plus size={16} />
            <span>Add {activeTab === 'Hotels' ? 'Hotel' : activeTab === 'Vehicles' ? 'Vehicle' : 'Ticket'}</span>
          </button>
        </div>

        {/* DATA TABLE CONTAINER */}
        <div className="bg-white border border-border-custom rounded-xl overflow-hidden shadow-2xs">
          {filteredItems.length === 0 ? (
            /* EMPTY STATE */
            <div className="p-12 md:p-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-fog flex items-center justify-center text-navy/30" aria-hidden="true">
                {activeTab === 'Hotels' && <Bed size={32} strokeWidth={1.5} />}
                {activeTab === 'Vehicles' && <Car size={32} strokeWidth={1.5} />}
                {activeTab === 'Tickets' && <Ticket size={32} strokeWidth={1.5} />}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-serif font-medium text-navy">
                  No {activeTab.toLowerCase()} yet
                </h3>
                <p className="text-xs text-navy/60 max-w-sm font-normal">
                  {searchQuery
                    ? `No matching ${activeTab.toLowerCase()} records found for "${searchQuery}".`
                    : `No ${activeTab.toLowerCase()} recorded in inventory. Add catalog items for AI itinerary generation.`}
                </p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center justify-center gap-2 bg-teal-primary hover:bg-teal-hover text-white text-xs font-semibold px-4 py-2 rounded-lg transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
              >
                <Plus size={14} />
                <span>Add {activeTab.slice(0, -1)}</span>
              </button>
            </div>
          ) : (
            /* RESPONSIVE TABLE */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label={`${activeTab} Inventory Table`}>
                <thead>
                  <tr className="bg-fog/80 border-b border-border-custom text-[11px] font-mono font-bold uppercase tracking-wider text-navy/60">
                    <th scope="col" className="py-3 px-4">Record ID</th>
                    {activeTab === 'Hotels' && (
                      <>
                        <th scope="col" className="py-3 px-4">Hotel Name</th>
                        <th scope="col" className="py-3 px-4">Location</th>
                        <th scope="col" className="py-3 px-4">Price / Night</th>
                        <th scope="col" className="py-3 px-4">Capacity</th>
                      </>
                    )}
                    {activeTab === 'Vehicles' && (
                      <>
                        <th scope="col" className="py-3 px-4">Vehicle Model / Type</th>
                        <th scope="col" className="py-3 px-4">Rate / Day</th>
                        <th scope="col" className="py-3 px-4">Seating Capacity</th>
                      </>
                    )}
                    {activeTab === 'Tickets' && (
                      <>
                        <th scope="col" className="py-3 px-4">Mode</th>
                        <th scope="col" className="py-3 px-4">Origin</th>
                        <th scope="col" className="py-3 px-4">Destination</th>
                        <th scope="col" className="py-3 px-4">Ticket Price</th>
                      </>
                    )}
                    <th scope="col" className="py-3 px-4">AI Planner Status</th>
                    <th scope="col" className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom/60 text-sm">
                  <AnimatePresence initial={false}>
                    {filteredItems.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`${index % 2 === 1 ? 'bg-[#F5F6F4]/50' : 'bg-white'} hover:bg-teal-primary/5 transition-colors`}
                      >
                        {/* ID Column */}
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-navy/70 whitespace-nowrap">
                          {item.id}
                        </td>

                        {/* HOTELS COLUMNS */}
                        {activeTab === 'Hotels' && (
                          <>
                            <td className="py-3.5 px-4 font-medium text-navy">
                              {item.name}
                            </td>
                            <td className="py-3.5 px-4 text-navy/70 text-xs">
                              {item.location}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-navy whitespace-nowrap">
                              ৳{item.price.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4 text-navy/70 text-xs font-mono">
                              {item.capacity} guests
                            </td>
                          </>
                        )}

                        {/* VEHICLES COLUMNS */}
                        {activeTab === 'Vehicles' && (
                          <>
                            <td className="py-3.5 px-4 font-medium text-navy">
                              {item.type}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-navy whitespace-nowrap">
                              ৳{item.price.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4 text-navy/70 text-xs font-mono">
                              {item.capacity} passengers
                            </td>
                          </>
                        )}

                        {/* TICKETS COLUMNS */}
                        {activeTab === 'Tickets' && (
                          <>
                            <td className="py-3.5 px-4 font-semibold text-navy text-xs">
                              <span className="px-2 py-0.5 bg-fog border border-border-custom rounded font-mono text-[11px]">
                                {item.mode}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-navy/70 text-xs">
                              {item.origin}
                            </td>
                            <td className="py-3.5 px-4 text-navy/70 text-xs">
                              {item.destination}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-navy whitespace-nowrap">
                              ৳{item.price.toFixed(2)}
                            </td>
                          </>
                        )}

                        {/* STATUS BADGE */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`
                            inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border
                            ${item.status === 'Active'
                              ? 'bg-teal-primary/10 text-teal-primary border-teal-primary/30'
                              : 'bg-amber-accent/15 text-amber-accent border-amber-accent/30'}
                          `}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Active' ? 'bg-teal-primary' : 'bg-amber-accent'}`} />
                            {item.status}
                          </span>
                        </td>

                        {/* ACTIONS COLUMN */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap relative">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-navy/60 hover:text-teal-primary hover:bg-fog rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                              title="Edit Record"
                              aria-label={`Edit ${item.id}`}
                            >
                              <Edit2 size={15} />
                            </button>

                            {/* Delete Button / Inline Confirm Popover */}
                            {deleteConfirmId === item.id ? (
                              <div className="inline-flex items-center gap-1 bg-white border border-red-200 shadow-md rounded-md p-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                                <span className="text-[10px] font-mono font-semibold text-red-600 px-1">Confirm?</span>
                                <button
                                  onClick={() => handleConfirmDelete(item.id)}
                                  className="px-2 py-0.5 bg-red-600 text-white font-xs font-semibold rounded hover:bg-red-700 text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="p-1 text-navy/50 hover:text-navy rounded text-[11px]"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(item.id)}
                                className="p-1.5 text-navy/40 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                                title="Delete Record"
                                aria-label={`Delete ${item.id}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dim Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-navy/40 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-lg bg-white border border-border-custom rounded-xl p-6 shadow-xl z-10 text-left space-y-5"
            >
              <div className="flex items-center justify-between border-b border-border-custom pb-3">
                <h3 className="text-lg font-serif font-medium text-navy">
                  {editingItem ? `Edit ${editingItem.id}` : `Add New ${activeTab.slice(0, -1)}`}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-navy/40 hover:text-navy rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-4">
                {/* HOTEL FORM FIELDS */}
                {activeTab === 'Hotels' && (
                  <>
                    <div className="space-y-1">
                      <label htmlFor="hName" className="text-xs font-semibold text-navy/70 block">
                        Hotel / Property Name
                      </label>
                      <input
                        id="hName"
                        type="text"
                        required
                        placeholder="e.g. Kyoto Machiya Inn"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-fog border border-border-custom text-navy text-sm px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="hLoc" className="text-xs font-semibold text-navy/70 block">
                        Location / District
                      </label>
                      <input
                        id="hLoc"
                        type="text"
                        required
                        placeholder="e.g. Gion, Kyoto"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-fog border border-border-custom text-navy text-sm px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="hPrice" className="text-xs font-semibold text-navy/70 block">
                          Price per Night (BDT)
                        </label>
                        <input
                          id="hPrice"
                          type="number"
                          step="0.01"
                          required
                          placeholder="9500.00"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full bg-fog border border-border-custom text-navy font-mono text-sm px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="hCap" className="text-xs font-semibold text-navy/70 block">
                          Max Guest Capacity
                        </label>
                        <input
                          id="hCap"
                          type="number"
                          min="1"
                          required
                          value={formData.capacity}
                          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                          className="w-full bg-fog border border-border-custom text-navy font-mono text-sm px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* VEHICLE FORM FIELDS */}
                {activeTab === 'Vehicles' && (
                  <>
                    <div className="space-y-1">
                      <label htmlFor="vType" className="text-xs font-semibold text-navy/70 block">
                        Vehicle Model & Type
                      </label>
                      <input
                        id="vType"
                        type="text"
                        required
                        placeholder="e.g. Toyota Alphard Minivan"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full bg-fog border border-border-custom text-navy text-sm px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="vPrice" className="text-xs font-semibold text-navy/70 block">
                          Daily Rental Rate (BDT)
                        </label>
                        <input
                          id="vPrice"
                          type="number"
                          step="0.01"
                          required
                          placeholder="4500.00"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full bg-fog border border-border-custom text-navy font-mono text-sm px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="vCap" className="text-xs font-semibold text-navy/70 block">
                          Seating Capacity
                        </label>
                        <input
                          id="vCap"
                          type="number"
                          min="1"
                          required
                          value={formData.capacity}
                          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                          className="w-full bg-fog border border-border-custom text-navy font-mono text-sm px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* TICKET FORM FIELDS */}
                {activeTab === 'Tickets' && (
                  <>
                    <div className="space-y-1">
                      <label htmlFor="tMode" className="text-xs font-semibold text-navy/70 block">
                        Transport Mode
                      </label>
                      <select
                        id="tMode"
                        value={formData.mode}
                        onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                        className="w-full bg-fog border border-border-custom text-navy text-sm px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                      >
                        <option value="Train">Train</option>
                        <option value="Flight">Flight</option>
                        <option value="Bus">Bus</option>
                        <option value="Ferry">Ferry</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="tOrig" className="text-xs font-semibold text-navy/70 block">
                          Origin Station / Airport
                        </label>
                        <input
                          id="tOrig"
                          type="text"
                          required
                          placeholder="e.g. Dhaka Kamalapur"
                          value={formData.origin}
                          onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                          className="w-full bg-fog border border-border-custom text-navy text-sm px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="tDest" className="text-xs font-semibold text-navy/70 block">
                          Destination Station / Airport
                        </label>
                        <input
                          id="tDest"
                          type="text"
                          required
                          placeholder="e.g. Cox's Bazar Station"
                          value={formData.destination}
                          onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                          className="w-full bg-fog border border-border-custom text-navy text-sm px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="tPrice" className="text-xs font-semibold text-navy/70 block">
                        Standard Ticket Price (BDT)
                      </label>
                      <input
                        id="tPrice"
                        type="number"
                        step="0.01"
                        required
                        placeholder="1350.00"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full bg-fog border border-border-custom text-navy font-mono text-sm px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                      />
                    </div>
                  </>
                )}

                {/* STATUS TOGGLE */}
                <div className="pt-2 border-t border-border-custom space-y-1">
                  <span className="text-xs font-semibold text-navy/70 block">AI Planner Availability Status</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'Active' })}
                      className={`
                        flex-1 py-2 px-3 text-xs font-semibold rounded-lg border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary
                        ${formData.status === 'Active'
                          ? 'bg-teal-primary/10 border-teal-primary text-teal-primary'
                          : 'bg-fog border-border-custom text-navy/60'}
                      `}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'Draft' })}
                      className={`
                        flex-1 py-2 px-3 text-xs font-semibold rounded-lg border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary
                        ${formData.status === 'Draft'
                          ? 'bg-amber-accent/20 border-amber-accent text-amber-accent font-bold'
                          : 'bg-fog border-border-custom text-navy/60'}
                      `}
                    >
                      Draft
                    </button>
                  </div>
                  <p className="text-[11px] text-navy/50 pt-1 leading-tight">
                    * Draft items are excluded from the AI itinerary planning algorithms until marked Active.
                  </p>
                </div>

                {/* MODAL BUTTONS */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-custom">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-navy/70 hover:text-navy bg-fog rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-teal-primary hover:bg-teal-hover rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-primary"
                  >
                    Save record
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
