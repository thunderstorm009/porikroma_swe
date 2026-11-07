import { useState } from 'react';
import { Plus } from 'lucide-react';
import { apiClient } from '../services/apiClient';

const CATEGORIES = ['Sightseeing', 'Food', 'Transport', 'Stay', 'Activity', 'Other'];

const formatDay = (iso) => {
  if (!iso) return 'Unscheduled';
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

// Itinerary stored on the server (GET/POST/DELETE /trips/{id}/itinerary).
// Any member can add a stop; only the trip owner/admins can remove one (server rule).
export default function TripItinerary({ tripId, items, onItemsChange, canEdit, defaultDate, destinationTitle }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', date: defaultDate || '', start_time: '', location_name: '', estimated_cost: '', category: 'Sightseeing' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const addItem = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        estimated_cost: Math.max(0, Number(form.estimated_cost) || 0),
        order_index: items.length,
        ...(form.date ? { date: form.date } : {}),
        ...(form.start_time ? { start_time: form.start_time } : {}),
        ...(form.location_name.trim() ? { location_name: form.location_name.trim() } : {}),
      };
      const response = await apiClient.post(`/api/v1/trips/${tripId}/itinerary`, payload);
      onItemsChange([...items, response.data]);
      setForm((current) => ({ ...current, title: '', start_time: '', location_name: '', estimated_cost: '' }));
      setShowForm(false);
    } catch (requestError) {
      setError(requestError.message || 'Could not add the stop.');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (id) => {
    setError('');
    try {
      await apiClient.delete(`/api/v1/itinerary/${id}`);
      onItemsChange(items.filter((item) => item.id !== id));
    } catch (requestError) {
      setError(requestError.message || 'Could not remove the stop.');
    }
  };

  const sorted = [...items].sort((a, b) => String(a.date || '9999').localeCompare(String(b.date || '9999'))
    || String(a.start_time || '').localeCompare(String(b.start_time || ''))
    || (a.order_index || 0) - (b.order_index || 0));
  const days = sorted.reduce((groups, item) => {
    const key = item.date || '';
    (groups[key] = groups[key] || []).push(item);
    return groups;
  }, {});

  return (
    <div>
      {error && <div className="travel-alert" role="alert"><span>{error}</span></div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button className="travel-button travel-button-ghost" onClick={() => setShowForm(!showForm)}><Plus size={14} /> Add stop</button>
      </div>
      {showForm && (
        <form onSubmit={addItem} className="travel-panel travel-panel-pad travel-form-grid" style={{ marginBottom: 12 }}>
          <div className="travel-field"><label htmlFor="itinerary-title">What</label><input id="itinerary-title" className="travel-input" required maxLength={200} value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Sunrise at Konglak Hill" /></div>
          <div className="travel-field"><label htmlFor="itinerary-location">Where</label><input id="itinerary-location" className="travel-input" maxLength={240} value={form.location_name} onChange={(e) => update('location_name', e.target.value)} placeholder={destinationTitle} /></div>
          <div className="travel-field"><label htmlFor="itinerary-date">Date</label><input id="itinerary-date" type="date" className="travel-input" value={form.date} onChange={(e) => update('date', e.target.value)} /></div>
          <div className="travel-field"><label htmlFor="itinerary-time">Time</label><input id="itinerary-time" type="time" className="travel-input" value={form.start_time} onChange={(e) => update('start_time', e.target.value)} /></div>
          <div className="travel-field"><label htmlFor="itinerary-cost">Estimated cost (৳)</label><input id="itinerary-cost" type="number" min="0" className="travel-input" value={form.estimated_cost} onChange={(e) => update('estimated_cost', e.target.value)} placeholder="0" /></div>
          <div className="travel-field"><label htmlFor="itinerary-category">Type</label><select id="itinerary-category" className="travel-select" value={form.category} onChange={(e) => update('category', e.target.value)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></div>
          <button className="travel-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save stop'}</button>
        </form>
      )}
      {items.length === 0 ? (
        <div className="travel-panel travel-empty"><h3>No stops planned yet.</h3><p>Add the first place you want to visit; everyone in the trip sees the same plan.</p></div>
      ) : (
        <div className="travel-timeline">
          {Object.entries(days).map(([date, dayItems], index) => (
            <div className="travel-panel travel-day" key={date || 'unscheduled'}>
              <h3>{date ? `Day ${index + 1}` : 'Unscheduled'}</h3>
              <p>{formatDay(date)}</p>
              {dayItems.map((item) => (
                <div className="travel-itinerary-row" key={item.id}>
                  <time>{item.start_time ? item.start_time.slice(0, 5) : '—'}</time>
                  <span className="travel-itinerary-dot" />
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.location_name || destinationTitle}</small>
                    <small>৳{Number(item.estimated_cost || 0).toLocaleString()}{item.description ? ` · ${item.description}` : ''}</small>
                  </div>
                  <span className="travel-itinerary-type">{item.category || 'Stop'}</span>
                  {canEdit && <button className="travel-remove" style={{ padding: 0, marginLeft: 8 }} onClick={() => removeItem(item.id)} aria-label={`Remove ${item.title}`}>Remove</button>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
