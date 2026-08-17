import { useEffect, useMemo, useState, useRef } from 'react';
import { AlertCircle, Bot, CalendarDays, Check, ChevronRight, DollarSign, MapPinned, MessageCircle, Phone, Plus, Send, Sparkles, Users } from 'lucide-react';
import TravelShell from '../components/TravelShell';
import TravelMap from '../components/TravelMap';
import { DESTINATIONS, MOCK_CHAT_MESSAGES, MOCK_EMERGENCY_LOCATIONS, MOCK_ITINERARY, MOCK_WEATHER, MOCK_AI_SUMMARY } from '../data/travelData';
import { aiService } from '../services/aiService';
import { chatService } from '../services/chatService';
import { emergencyService } from '../services/emergencyService';
import { weatherService } from '../services/weatherService';
import { expenseService } from '../services/expenseService';

const tabs = [
  { id: 'overview', label: 'Overview', icon: <Sparkles size={14} /> },
  { id: 'itinerary', label: 'Itinerary', icon: <CalendarDays size={14} /> },
  { id: 'map', label: 'Map', icon: <MapPinned size={14} /> },
  { id: 'budget', label: 'Budget', icon: <DollarSign size={14} /> },
  { id: 'chat', label: 'Chat', icon: <MessageCircle size={14} /> },
  { id: 'emergency', label: 'Emergency', icon: <AlertCircle size={14} /> }
];
const emergencyIcon = { Hospital: '🏥', Pharmacy: '💊', Police: '🚓', 'Fire Station': '🚒' };

const getDestination = (trip) => trip?.location || DESTINATIONS.find((location) => trip?.destination?.toLowerCase().includes(location.name.split(' ')[0].toLowerCase())) || DESTINATIONS[0];
const getWeather = (trip) => MOCK_WEATHER[getDestination(trip).id] || MOCK_WEATHER.default;

export default function TripWorkspacePage({ onNavigate, trip, onUpdateTrip, theme, onToggleTheme }) {
  const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const [activeTab, setActiveTab] = useState('overview');
  const [summary, setSummary] = useState(MOCK_AI_SUMMARY);
  const [itinerary, setItinerary] = useState(trip?.itinerary?.length ? trip.itinerary : MOCK_ITINERARY);
  const [optimizing, setOptimizing] = useState(false);
  const [weather, setWeather] = useState(getWeather(trip));
  const [expenses, setExpenses] = useState(useMock ? [{ id: 'e1', description: 'Hotel advance payment', category: 'Lodging', amount: 9500, paidBy: 'Sarah' }, { id: 'e2', description: 'Private microbus', category: 'Transport', amount: 8500, paidBy: 'Abrar' }, { id: 'e3', description: 'Group dinner', category: 'Food', amount: 2400, paidBy: 'Huzaifa' }] : []);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', category: 'Food', amount: '', paidBy: 'Sarah' });
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [budgetAdvice, setBudgetAdvice] = useState(null);
  const [messages, setMessages] = useState(MOCK_CHAT_MESSAGES);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [emergencyCategory, setEmergencyCategory] = useState('All');
  const [emergencyLocations, setEmergencyLocations] = useState(MOCK_EMERGENCY_LOCATIONS);
  const wsRef = useRef(null);

  const destination = getDestination(trip);

  useEffect(() => {
    let ignore = false;
    aiService.generateTripSummary(trip).then((result) => { if (!ignore) setSummary(result); });
    weatherService.getWeather(destination).then((result) => { if (!ignore) setWeather(result); });
    emergencyService.getEmergencyLocations().then((result) => { if (!ignore) setEmergencyLocations(result); });
    return () => { ignore = true; };
  }, [trip, destination]);

  useEffect(() => {
    if (useMock || !trip?.id) return;
    let active = true;
    expenseService.list(trip.id).then((items) => { if (active) setExpenses(items); }).catch((error) => console.error('Failed to load persisted trip expenses:', error));
    
    // Connect WS
    chatService.connect(trip.id, (data) => {
      setMessages((current) => [...current, {
        id: data.id || Date.now(),
        user: data.sender?.full_name || data.sender?.username || 'User',
        initials: (data.sender?.full_name || data.sender?.username || 'U')[0].toUpperCase(),
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        message: data.text,
        color: 'blue'
      }]);
    }).then(ws => {
      wsRef.current = ws;
    }).catch(err => console.error('Failed to connect to chat WS:', err));

    return () => { 
      active = false; 
      if (wsRef.current) wsRef.current.close();
    };
  }, [trip?.id, useMock]);

  const filteredEmergency = useMemo(() => emergencyCategory === 'All' ? emergencyLocations : emergencyLocations.filter((item) => item.category === emergencyCategory), [emergencyCategory, emergencyLocations]);
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const budget = Number(trip?.budget || 20000);

  if (!trip) return <TravelShell onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} title="Trip workspace"><div className="travel-panel travel-empty"><h3>No trip selected</h3><p>Choose a trip from the dashboard to open its shared workspace.</p><button className="travel-button" onClick={() => onNavigate('dashboard')}>Back to dashboard</button></div></TravelShell>;

  const optimizeItinerary = async () => { setOptimizing(true); const response = await aiService.optimizeItinerary(trip); setItinerary(response.itinerary); setOptimizing(false); };
  const optimizeBudget = async () => setBudgetAdvice(await aiService.optimizeBudget(trip));
  const saveExpense = async (event) => {
    event.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) return;
    const input = { ...expenseForm, date: new Date().toISOString().split('T')[0] };
    try {
      const saved = editingExpenseId && !useMock ? await expenseService.update(editingExpenseId, input) : await expenseService.create(trip.id, input);
      setExpenses((current) => editingExpenseId ? current.map((expense) => expense.id === editingExpenseId ? saved : expense) : [saved, ...current]);
      if (useMock) onUpdateTrip({ ...trip, expenses: editingExpenseId ? expenses.map((expense) => expense.id === editingExpenseId ? saved : expense) : [saved, ...expenses] });
      setExpenseForm({ description: '', category: 'Food', amount: '', paidBy: 'Sarah' });
      setEditingExpenseId(null);
      setShowExpenseForm(false);
    } catch (error) { console.error('Failed to persist trip expense:', error); }
  };
  const editExpense = (expense) => { setExpenseForm({ description: expense.description, category: expense.category, amount: String(expense.amount), paidBy: expense.paidBy?.name || expense.paidBy || 'You' }); setEditingExpenseId(expense.id); setShowExpenseForm(true); };
  const deleteExpense = async (expenseId) => {
    try {
      if (!useMock) await expenseService.remove(expenseId);
      const nextExpenses = expenses.filter((expense) => expense.id !== expenseId);
      setExpenses(nextExpenses);
      if (useMock) onUpdateTrip({ ...trip, expenses: nextExpenses });
    } catch (error) { console.error('Failed to delete trip expense:', error); }
  };
  const sendChat = async (event, suggested = null) => { 
    event?.preventDefault(); 
    const messageText = (suggested || chatInput).trim(); 
    if (!messageText || chatLoading) return; 
    setChatInput(''); 
    
    if (useMock) {
      setMessages((current) => [...current, { id: Date.now(), user: 'Sarah', initials: 'SJ', time: 'now', message: messageText, color: 'teal' }]); 
      setChatLoading(true); 
      const response = await aiService.chat(messageText, { trip, destination }); 
      setMessages((current) => [...current, { ...response, id: Date.now() + 1, time: 'now' }]); 
      setChatLoading(false); 
    } else {
      chatService.sendMessage(wsRef.current, messageText);
    }
  };
  const updateEmergency = (category) => { setEmergencyCategory(category); setEmergencyLocations(MOCK_EMERGENCY_LOCATIONS); };

  return <TravelShell onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} active="My Trips" title="Trip workspace">
    <div className="travel-workspace-header"><div><span className="travel-kicker">{trip.type} trip · {trip.status}</span><h2>{destination.name}</h2><p>{trip.dates} · {trip.members?.length || 1} traveler{(trip.members?.length || 1) === 1 ? '' : 's'} · Shared workspace</p></div><div className="travel-workspace-actions"><button className="travel-button travel-button-ghost" onClick={() => onNavigate('dashboard')}><ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> All trips</button><button className="travel-button travel-button-ghost" onClick={() => onNavigate('ask-question', { destination: trip.destination, category: 'Destinations', tripContext: { travelers: trip.members?.length || 1, budget: trip.budget, dates: trip.dates } })}>Ask Community</button><button className="travel-button" onClick={() => { setActiveTab('emergency'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>🚨 Emergency</button></div></div>
    <div className="travel-workspace-tabs" role="tablist">{tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)} role="tab" aria-selected={activeTab === tab.id}>{tab.icon}{tab.label}</button>)}</div>

    {activeTab === 'overview' && <div className="travel-grid" style={{ gap: 17 }}>
      <div className="travel-metric-row"><div className="travel-panel travel-metric"><span>Travelers</span><strong>{trip.members?.length || 1}</strong><span>{trip.type === 'Group' ? 'Shared trip' : 'Just you'}</span></div><div className="travel-panel travel-metric"><span>Trip budget</span><strong>৳{budget.toLocaleString()}</strong><span>{trip.selectedPlan?.name || 'Balanced plan'}</span></div><div className="travel-panel travel-metric"><span>Weather now</span><strong>{weather[0]?.temp}°C</strong><span>{weather[0]?.label}</span></div><div className="travel-panel travel-metric"><span>Plan intensity</span><strong>{summary.intensity}</strong><span>{summary.activities} recommended activities</span></div></div>
      <div className="travel-grid travel-grid-2"><div className="travel-panel travel-panel-pad travel-ai-card"><span className="travel-ai-title">✦ AI trip summary</span><h3>{summary.headline}</h3><div className="travel-grid travel-grid-3" style={{ gap: 8, margin: '16px 0' }}>{[['Budget', summary.budget], ['Weather', summary.weather], ['Intensity', summary.intensity]].map(([label, value]) => <div key={label} className="travel-panel" style={{ padding: 11, boxShadow: 'none' }}><span className="travel-stat-label">{label}</span><strong style={{ display: 'block', fontSize: 11, marginTop: 7 }}>{value}</strong></div>)}</div><ul className="travel-insight-list">{summary.insights.map((insight) => <li key={insight}><Check size={13} />{insight}</li>)}</ul></div><div className="travel-panel travel-panel-pad"><div className="travel-section-heading" style={{ margin: 0 }}><div><span className="travel-card-kicker">Next up</span><h2>Weather-aware rhythm</h2></div><button className="travel-link" onClick={() => setActiveTab('itinerary')}>Full itinerary</button></div><div className="travel-weather-row" style={{ marginTop: 18 }}>{weather.map((day) => <div className="travel-weather-card" key={day.day}><span>{day.icon}</span><strong>{day.temp}°</strong><small>{day.day.split(',')[0]}</small><small style={{ color: day.rain > 50 ? '#b86e20' : 'var(--travel-muted)' }}>{day.rain}% rain</small></div>)}</div><div className="travel-alert" style={{ marginTop: 14 }}><span>🌧</span><span><strong>Weather-aware suggestion</strong><br />Move the beach activity from Day 2 to Day 3.</span></div></div></div>
      <div className="travel-grid travel-grid-2"><div className="travel-panel travel-panel-pad"><div className="travel-section-heading" style={{ margin: 0 }}><div><span className="travel-card-kicker">Saved plan</span><h2>{trip.selectedPlan?.name || 'Balanced Experience'}</h2></div><span className="travel-pill green">94% match</span></div><p style={{ color: 'var(--travel-muted)', fontSize: 12, lineHeight: 1.6, marginBottom: 0 }}>A comfortable hotel, seven activities, moderate travel time and enough open space for the group to decide together.</p></div><div className="travel-panel travel-panel-pad"><div className="travel-section-heading" style={{ margin: 0 }}><div><span className="travel-card-kicker">People in this space</span><h2>{trip.type === 'Group' ? 'Group crew' : 'Trip Assistant'}</h2></div><Users size={18} color="#2d6a4f" /></div><div className="travel-avatar-stack" style={{ marginTop: 15 }}>{(trip.members || []).map((member, index) => <span className={`avatar avatar-${['teal', 'amber', 'blue', 'purple'][index % 4]}`} key={member.id}>{member.initial}</span>)}</div><p style={{ color: 'var(--travel-muted)', fontSize: 11, marginBottom: 0, marginTop: 9 }}>{trip.type === 'Group' ? 'Everyone sees the same itinerary, budget and map.' : 'Ask the assistant to adjust your plan as you travel.'}</p></div></div>
    </div>}

    {activeTab === 'itinerary' && <div className="travel-grid travel-grid-2"><div><div className="travel-section-heading" style={{ marginTop: 0 }}><div><h2>Shared itinerary</h2><p>Grouped by place, paced around the weather.</p></div><button className="travel-button" onClick={optimizeItinerary} disabled={optimizing}><Sparkles size={14} /> {optimizing ? 'Optimizing…' : 'Optimize with AI'}</button></div>{optimizing && <div className="travel-alert"><Sparkles size={15} color="#2d6a4f" /><span>✨ Rebalancing travel time, weather and nearby stops…</span></div>}<div className="travel-timeline">{itinerary.map((day) => <div className="travel-panel travel-day" key={day.day}><h3>{day.day}</h3><p>{day.date}</p>{day.items.map((item) => <div className="travel-itinerary-row" key={`${day.day}-${item.time}`}><time>{item.time}</time><span className="travel-itinerary-dot" /><div><strong>{item.title}</strong><small>{item.detail} · {item.location || destination.name}</small><small>{item.duration || 'Flexible'} · ৳{Number(item.cost || 0).toLocaleString()} · {item.notes || 'Add a note before you go.'}</small></div><span className="travel-itinerary-type">{item.category || item.type}</span></div>)}</div>)}</div></div><div className="travel-panel travel-panel-pad travel-ai-card"><span className="travel-ai-title">✦ Itinerary intelligence</span><h3>Keep Day 2 loose.</h3><p>Rain probability is highest then, so the plan now favors a flexible cafe stop and moves the long beach window to the clearest morning.</p><ul className="travel-insight-list"><li>Reduced transfer time by 42 minutes</li><li>Grouped Inani and sunset photography</li><li>Added a rain-friendly backup activity</li></ul></div></div>}

    {activeTab === 'map' && <div><div className="travel-section-heading" style={{ marginTop: 0 }}><div><h2>Trip map</h2><p>Hotels, attractions, restaurants and nearby services in one location layer.</p></div><span className="travel-pill green"><span className="travel-live-dot" /> Mock map ready for Places API</span></div><TravelMap location={destination} height="570px" /></div>}

    {activeTab === 'budget' && <div className="travel-grid travel-grid-2"><div><div className="travel-section-heading" style={{ marginTop: 0 }}><div><h2>Shared budget</h2><p>Track expenses now; settle with the future backend later.</p></div><button className="travel-button" onClick={() => { setEditingExpenseId(null); setExpenseForm({ description: '', category: 'Food', amount: '', paidBy: 'Sarah' }); setShowExpenseForm(!showExpenseForm); }}><Plus size={14} /> Add expense</button></div><div className="travel-panel travel-panel-pad"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}><div><span className="travel-stat-label">Spent so far</span><strong style={{ display: 'block', font: '700 28px var(--font-mono)', marginTop: 9 }}>৳{totalExpenses.toLocaleString()}</strong></div><span className="travel-pill green">{Math.round((totalExpenses / (budget || 1)) * 100)}% allocated</span></div><div className="travel-progress" style={{ marginTop: 16 }}><span style={{ width: `${Math.min(100, (totalExpenses / (budget || 1)) * 100)}%` }} /></div>{showExpenseForm && <form onSubmit={saveExpense} className="travel-form-grid" style={{ marginTop: 20, borderTop: '1px solid var(--travel-border)', paddingTop: 18 }}><div className="travel-field"><label htmlFor="expense-description">Description</label><input id="expense-description" className="travel-input" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="e.g. Beach dinner" required /></div><div className="travel-field"><label htmlFor="expense-amount">Amount (৳)</label><input id="expense-amount" type="number" className="travel-input" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="1200" required /></div><div className="travel-field"><label htmlFor="expense-category">Category</label><select id="expense-category" className="travel-select" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}><option>Food</option><option>Lodging</option><option>Transport</option><option>Activity</option><option>Shopping</option><option>Emergency</option><option>Other</option></select></div><div className="travel-field"><label htmlFor="expense-paid-by">Paid by</label><select id="expense-paid-by" className="travel-select" value={expenseForm.paidBy} onChange={(e) => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}><option>Sarah</option><option>Abrar</option><option>Huzaifa</option><option>Faizul</option><option>Munzeer</option></select></div><button className="travel-button" type="submit">{editingExpenseId ? 'Update expense' : 'Save expense'}</button></form>}</div><div className="travel-panel travel-panel-pad" style={{ marginTop: 12 }}><span className="travel-card-kicker">Expense ledger</span>{expenses.map((expense) => <div className="travel-expense-row" key={expense.id}><span><strong>{expense.description}</strong><small>{expense.category} · paid by {typeof expense.paidBy === 'object' ? expense.paidBy?.name : expense.paidBy}</small></span><span style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span className="travel-expense-amount">৳{Number(expense.amount).toLocaleString()}</span><button className="travel-link" style={{ padding: 0, fontSize: 10 }} onClick={() => editExpense(expense)}>Edit</button><button className="travel-remove" style={{ padding: 0 }} onClick={() => deleteExpense(expense.id)}>Delete</button></span></div>)}</div></div><div className="travel-panel travel-panel-pad travel-ai-card"><span className="travel-ai-title">✦ Optimize budget</span><h3>Keep ৳{Math.max(0, budget - totalExpenses).toLocaleString()} flexible.</h3><p>Ask the mock planner to find savings while protecting the parts of your trip that matter most.</p><button className="travel-button" style={{ marginTop: 15 }} onClick={optimizeBudget}><Sparkles size={14} /> Optimize budget</button>{budgetAdvice && <div style={{ marginTop: 20 }}><div className="travel-pill green">Potential savings: ৳{budgetAdvice.savings.toLocaleString()}</div><ul className="travel-insight-list">{budgetAdvice.recommendations.map((item) => <li key={item.label}>{item.label} <strong style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>− ৳{item.amount}</strong></li>)}</ul><button className="travel-link" style={{ padding: 0, marginTop: 12 }} onClick={() => setBudgetAdvice(null)}>Applied to mock state ✓</button></div>}</div></div>}

    {activeTab === 'chat' && <div className="travel-grid travel-grid-2"><div className="travel-panel travel-chat"><div className="travel-chat-list">{messages.map((message) => <div key={message.id} className={`travel-message ${message.user === 'Sarah' ? 'mine' : ''} ${message.ai ? 'ai' : ''}`}><span className={`avatar avatar-${message.color || 'teal'}`}>{message.initials}</span><div className="travel-message-body"><strong>{message.ai ? '✦ AI Assistant' : message.user}</strong><p>{message.message}</p><time>{message.time}</time></div></div>)}{chatLoading && <div className="travel-message ai"><span className="avatar avatar-teal">✦</span><div className="travel-message-body"><strong>✦ AI Assistant</strong><p>Thinking through your trip…</p></div></div>}</div><div className="travel-chat-prompts">{['✨ Optimize our itinerary', '💰 How much budget remains?', '🌦 What if it rains?', '🍴 Where should we eat?', '📍 What is nearby?'].map((prompt) => <button key={prompt} onClick={() => sendChat(null, prompt)}>{prompt}</button>)}</div><form className="travel-chat-form" onSubmit={sendChat}><input className="travel-input" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={trip.type === 'Group' ? 'Message your group…' : 'Ask your trip assistant…'} /><button className="travel-button" aria-label="Send message"><Send size={14} /></button></form></div><div className="travel-panel travel-panel-pad travel-ai-card"><span className="travel-ai-title">{trip.type === 'Group' ? '✦ Group chat' : '✦ Trip Assistant'}</span><h3>{trip.type === 'Group' ? 'Plan together, lightly.' : 'A calm co-pilot for the road.'}</h3><p>{trip.type === 'Group' ? 'Everyone in the group can see the same plan. The assistant can answer with your itinerary and budget as context.' : 'Ask about food, weather, nearby places or the next best move. The chat service is already isolated for a future /api/ai/chat call.'}</p><div className="travel-alert" style={{ marginTop: 18 }}><Bot size={16} color="#2d6a4f" /><span>AI replies are mock responses in this frontend stage.</span></div></div></div>}

    {activeTab === 'emergency' && <div><div className="travel-panel travel-panel-pad travel-emergency-hero"><h2>Emergency assistance</h2><p>Nearby help stays visible while you travel. For mock mode, Call and Directions are safe demo actions.</p><div className="travel-emergency-quick">{[['Hospital', '🏥'], ['Pharmacy', '💊'], ['Police', '🚓'], ['Fire Station', '🚒'], ['All', '📍']].map(([label, icon]) => <button key={label} onClick={() => updateEmergency(label)}><span>{icon}</span>{label === 'Fire Station' ? 'Fire' : label}</button>)}</div></div><div className="travel-grid travel-grid-2" style={{ marginTop: 17 }}><div className="travel-panel travel-panel-pad"><div className="travel-section-heading" style={{ margin: 0 }}><div><span className="travel-card-kicker">{filteredEmergency.length} nearby locations</span><h2>Emergency contacts</h2></div><Phone size={18} color="#c95b43" /></div><div className="travel-emergency-list" style={{ marginTop: 14 }}>{filteredEmergency.slice(0, 8).map((item) => <div className="travel-emergency-row" key={item.id}><span className="avatar" style={{ background: '#fff0ec', fontSize: 18 }}>{emergencyIcon[item.category] || '🚑'}</span><div><strong>{item.name}</strong><small>{item.category} · {item.distance} away · {item.openStatus}</small><small>{item.address} · {item.phone}</small></div><div className="travel-emergency-actions"><button onClick={() => window.alert(`Mock call: ${item.phone}`)}><Phone size={12} /> Call</button><button onClick={() => window.alert(`Mock directions to ${item.name}`)}><MapPinned size={12} /> Directions</button></div></div>)}</div></div><div><TravelMap location={destination} emergencyLocations={filteredEmergency} mapCategories={['All', 'Hospital', 'Pharmacy', 'Police', 'Fire']} height="500px" /><div className="travel-panel travel-panel-pad" style={{ marginTop: 12 }}><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span className="avatar" style={{ background: '#fff0ec', fontSize: 18 }}>📞</span><span><strong style={{ display: 'block', fontSize: 12 }}>Local emergency number</strong><small style={{ display: 'block', color: 'var(--travel-muted)', fontSize: 10, marginTop: 3 }}>Call 999 for police, ambulance or fire service.</small></span><button className="travel-button" style={{ marginLeft: 'auto', background: '#c95b43', borderColor: '#c95b43' }} onClick={() => window.alert('Mock emergency call: 999')}><Phone size={13} /> 999</button></div></div></div></div></div>}
  </TravelShell>;
}
