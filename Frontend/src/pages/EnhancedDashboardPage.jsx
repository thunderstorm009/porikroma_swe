import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Check, ChevronRight, MapPin, Plus, Sparkles, Users } from 'lucide-react';
import TravelShell from '../components/TravelShell';
import { DESTINATIONS } from '../data/travelData';
import { aiService } from '../services/aiService';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../contexts/useAuth';

const destinationImage = (trip) => {
  const destStr = typeof trip?.destination === 'string' ? trip.destination : (trip?.destination?.name || trip?.title || '');
  const match = DESTINATIONS.find((item) => destStr.toLowerCase().includes(item.name.toLowerCase().split(' ')[0].toLowerCase()));
  return match || DESTINATIONS[0];
};

export default function EnhancedDashboardPage({ onNavigate, trips, theme, onToggleTheme }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const { user } = useAuth();
  // /trips is the "My Trips" view of this page: highlight it and jump to the trip list.
  const isTripsView = useLocation().pathname === '/trips';
  useEffect(() => {
    if (isTripsView) document.getElementById('my-trips')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [isTripsView, trips.length]);
  const [recommendationError, setRecommendationError] = useState('');
  // Real spend per trip ({ [tripId]: { spent, percent } }) from each trip's budget summary.
  const [spending, setSpending] = useState({});
  const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const tripIds = trips.map((trip) => trip.id).join(',');

  useEffect(() => {
    if (useMock || !tripIds) return undefined;
    let active = true;
    Promise.all(tripIds.split(',').map((id) => apiClient.get(`/api/v1/trips/${id}/budget-summary`)
      .then((response) => [id, { spent: Number(response.data?.total_spent || 0), percent: Number(response.data?.percentage_spent || 0) }])
      .catch(() => [id, null])))
      .then((entries) => { if (active) setSpending(Object.fromEntries(entries.filter(([, value]) => value))); });
    return () => { active = false; };
  }, [tripIds, useMock]);
  const [showPlanner, setShowPlanner] = useState(false);
  const [planner, setPlanner] = useState({ budget: '20000', duration: '4', travelers: '2', type: 'Group', interests: 'nature, food', style: 'Balanced' });

  const getRecommendations = async () => {
    setLoadingRecommendations(true);
    setRecommendationError('');
    try {
      setRecommendations(await aiService.recommendDestinations({ ...planner, budget: Number(planner.budget), duration: Number(planner.duration), travelers: Number(planner.travelers), interests: planner.interests.split(',').map((interest) => interest.trim()).filter(Boolean) }));
    } catch (error) {
      setRecommendations(null);
      setRecommendationError(error.message || 'Recommendations are unavailable right now.');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const upcoming = trips.filter((trip) => !['completed', 'cancelled'].includes(String(trip.status || '').toLowerCase()));
  const companions = new Set(trips.flatMap((trip) => (trip.members || []).map((member) => member.userId)).filter((id) => id && id !== user?.id)).size;
  const totalSpent = Object.values(spending).reduce((sum, item) => sum + item.spent, 0);
  const budgetPercent = (trip) => Math.min(100, Math.round(spending[trip.id]?.percent ?? trip.budgetPercent ?? 0));
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <TravelShell onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} active={isTripsView ? 'My Trips' : 'Dashboard'} title={isTripsView ? 'My trips' : 'Your travel map'}>
      <div className="travel-hero travel-panel">
        <div>
          <span className="travel-kicker">{today}</span>
          <h2>Make room for the places you haven’t seen yet.</h2>
          <p>Porikroma brings your people, plans, budget and local context into one calm travel workspace. Start with a destination or let the planner find the right one.</p>
          <div className="travel-hero-actions"><button className="travel-button" onClick={() => onNavigate('create-trip')}><Plus size={15} /> Plan a new trip</button><button className="travel-button travel-button-ghost" onClick={() => setShowPlanner(!showPlanner)}><Sparkles size={15} /> Find my next place</button></div>
        </div>
      </div>

      <div className="travel-grid travel-grid-4" style={{ marginTop: 17 }}>
        <div className="travel-panel travel-stat"><span className="travel-stat-label">Upcoming trips</span><strong className="travel-stat-value">{upcoming.length}</strong><span className="travel-stat-note">Across your active map</span></div>
        <div className="travel-panel travel-stat"><span className="travel-stat-label">Travel companions</span><strong className="travel-stat-value">{companions}</strong><span className="travel-stat-note">People in shared spaces</span></div>
        <div className="travel-panel travel-stat"><span className="travel-stat-label">Planned budget</span><strong className="travel-stat-value">৳{(trips.reduce((total, trip) => total + Number(trip.budget || 0), 0) / 1000).toFixed(1)}k</strong><span className="travel-stat-note">Across saved itineraries</span></div>
        <div className="travel-panel travel-stat"><span className="travel-stat-label">Spent so far</span><strong className="travel-stat-value" style={{ color: '#2d6a4f' }}>৳{(totalSpent / 1000).toFixed(1)}k</strong><span className="travel-stat-note">Recorded trip expenses</span></div>
      </div>

      {showPlanner && <div className="travel-panel travel-panel-pad travel-ai-card" style={{ marginTop: 17 }}><div className="travel-section-heading" style={{ margin: 0 }}><div><span className="travel-ai-title">✦ Destination planner</span><h2>Tell us what you want to optimize for.</h2><p>Budget, duration and travel mode are matched against Porikroma's destination data.</p></div><button className="travel-link" onClick={() => setShowPlanner(false)}>Close</button></div><div className="travel-form-grid" style={{ marginTop: 17 }}><div className="travel-field"><label htmlFor="recommendation-budget">Budget (৳)</label><input id="recommendation-budget" className="travel-input" type="number" value={planner.budget} onChange={(e) => setPlanner({ ...planner, budget: e.target.value })} /></div><div className="travel-field"><label htmlFor="recommendation-duration">Duration (days)</label><input id="recommendation-duration" className="travel-input" type="number" min="1" value={planner.duration} onChange={(e) => setPlanner({ ...planner, duration: e.target.value })} /></div><div className="travel-field"><label htmlFor="recommendation-travelers">Travelers</label><input id="recommendation-travelers" className="travel-input" type="number" min="1" value={planner.travelers} onChange={(e) => setPlanner({ ...planner, travelers: e.target.value })} /></div><div className="travel-field"><label htmlFor="recommendation-type">Travel mode</label><select id="recommendation-type" className="travel-select" value={planner.type} onChange={(e) => setPlanner({ ...planner, type: e.target.value })}><option>Solo</option><option>Group</option></select></div><div className="travel-field"><label htmlFor="recommendation-style">Travel style</label><select id="recommendation-style" className="travel-select" value={planner.style} onChange={(e) => setPlanner({ ...planner, style: e.target.value })}><option>Budget</option><option>Balanced</option><option>Luxury</option><option>Adventure</option><option>Relaxed</option><option>Family</option><option>Romantic</option><option>Photography</option><option>Food</option></select></div><div className="travel-field"><label htmlFor="recommendation-interests">Interests</label><input id="recommendation-interests" className="travel-input" value={planner.interests} onChange={(e) => setPlanner({ ...planner, interests: e.target.value })} placeholder="nature, food, photography" /></div></div><button className="travel-button" style={{ marginTop: 16 }} onClick={getRecommendations} disabled={loadingRecommendations}><Sparkles size={14} /> {loadingRecommendations ? 'Finding a fit…' : 'Get AI recommendations'}</button>{recommendationError && <div className="travel-alert" role="alert" style={{ marginTop: 12 }}><span>{recommendationError}</span></div>}</div>}

      {recommendations && <div className="travel-panel travel-panel-pad travel-ai-card" style={{ marginTop: 17 }}><div className="travel-section-heading" style={{ margin: 0 }}><div><span className="travel-ai-title">✦ AI destination desk</span><h2>Places shaped around your preferences</h2><p>Ranked by how well each destination fits your budget and trip length.</p></div><button className="travel-link" onClick={() => setRecommendations(null)}>Dismiss</button></div><div className="travel-grid travel-grid-4" style={{ marginTop: 16 }}>{recommendations.map((item) => <button key={item.id} className="travel-location-card" style={{ marginTop: 0 }} onClick={() => onNavigate('create-trip')}><img src={item.image} alt="" /><span><strong>{item.name} <em style={{ color: '#2d6a4f', font: '700 10px var(--font-mono)' }}>{item.match}%</em></strong><small>{item.reason}</small></span></button>)}</div></div>}

      <div className="travel-section-heading" id="my-trips" style={{ scrollMarginTop: 90 }}><div><h2>Active trips</h2><p>Every trip keeps its own shared itinerary, budget and safety layer.</p></div></div>
      {trips.length === 0 ? <div className="travel-panel travel-empty"><MapPin size={27} color="#2d6a4f" /><h3>No trips yet.</h3><p>Start planning your next adventure and your map will appear here.</p><button className="travel-button" onClick={() => onNavigate('create-trip')}><Plus size={14} /> Start planning</button></div> : <div className="travel-grid travel-grid-3">{trips.map((trip) => { const destination = destinationImage(trip); return <article key={trip.id} className="travel-panel travel-trip-card" onClick={() => onNavigate('trip-detail', trip.id)} onKeyDown={(e) => e.key === 'Enter' && onNavigate('trip-detail', trip.id)} tabIndex={0}><div className="travel-trip-image" style={{ backgroundImage: `url(${destination.image})` }}><span>{trip.type} trip · {trip.status}</span></div><div className="travel-trip-body"><h3>{trip.destination}</h3><p>{trip.dates}</p><div className="travel-trip-meta"><span><Users size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{trip.members?.length || 1} travelers</span><strong>৳{Number(trip.budget || 0).toLocaleString()}</strong></div><div style={{ marginTop: 13 }}><div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--travel-muted)', fontSize: 10, marginBottom: 6 }}><span>Budget allocation</span><span>{budgetPercent(trip)}%</span></div><div className="travel-progress"><span style={{ width: `${budgetPercent(trip)}%` }} /></div></div></div></article>; })}</div>}

      <div className="travel-grid travel-grid-2" style={{ marginTop: 17 }}>
        <div className="travel-panel travel-panel-pad"><div className="travel-section-heading" style={{ margin: 0 }}><div><span className="travel-card-kicker">Next on your map</span><h2>Upcoming rhythm</h2></div><CalendarDays size={20} color="#2d6a4f" /></div><div style={{ marginTop: 17, display: 'grid', gap: 12 }}>{upcoming.slice(0, 3).map((trip, index) => <button key={trip.id} onClick={() => onNavigate('trip-detail', trip.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, border: 0, borderBottom: index < Math.min(upcoming.length, 3) - 1 ? '1px solid var(--travel-border)' : 0, padding: '0 0 11px', background: 'none', color: 'var(--travel-text)', textAlign: 'left', cursor: 'pointer' }}><span className="avatar avatar-teal"><MapPin size={14} /></span><span style={{ flex: 1 }}><strong style={{ display: 'block', fontSize: 12 }}>{trip.destination}</strong><small style={{ color: 'var(--travel-muted)', fontSize: 10 }}>{trip.dates} · {trip.type}</small></span><ChevronRight size={15} color="var(--travel-faint)" /></button>)}</div></div>
        <div className="travel-panel travel-panel-pad travel-ai-card"><span className="travel-ai-title">✦ AI planning pulse</span><h3>Your plans have breathing room.</h3><p>Current trips are balanced between activity and recovery. Add a trip and the planner will compare budget, weather and travel intensity before you commit.</p><ul className="travel-insight-list"><li><Check size={13} /> Shared itineraries keep everyone aligned.</li><li><Check size={13} /> Weather-aware suggestions update the route.</li><li><Check size={13} /> Emergency locations stay one tap away.</li></ul><button className="travel-link" style={{ marginTop: 15, padding: 0 }} onClick={() => onNavigate('create-trip')}>Explore destination ideas <ArrowUpRight size={13} style={{ verticalAlign: 'middle' }} /></button></div>
      </div>
    </TravelShell>
  );
}
