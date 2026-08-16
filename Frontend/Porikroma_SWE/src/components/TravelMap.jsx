import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, MapPin, Search, X } from 'lucide-react';
import { mapService } from '../services/mapService';

const markerIcons = { Hotel: '🏨', Attraction: '📍', Restaurant: '🍴', Hospital: '🚑', Pharmacy: '💊', Police: '🚓', 'Fire Station': '🚒' };
const defaultCategories = ['All', 'Hotel', 'Attraction', 'Restaurant', 'Emergency'];

export default function TravelMap({ location, selectable = false, emergencyLocations = null, mapCategories = defaultCategories, onSelectLocation, height = '360px' }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [category, setCategory] = useState('All');
  const [results, setResults] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (emergencyLocations) {
        const normalizedCategory = category === 'Fire' ? 'Fire Station' : category;
        const filtered = normalizedCategory === 'All' ? emergencyLocations : emergencyLocations.filter((item) => item.category === normalizedCategory || (normalizedCategory === 'Emergency' && ['Hospital', 'Pharmacy', 'Police', 'Fire Station'].includes(item.category)));
        if (!ignore) setResults(filtered);
        return;
      }
      const nearby = await mapService.getNearbyLocations(location, category);
      if (!ignore) setResults(nearby);
    };
    load();
    return () => { ignore = true; };
  }, [location, category, emergencyLocations]);

  const search = async (value) => {
    setQuery(value);
    setSearchResults(value ? await mapService.searchLocation(value) : []);
  };

  const markers = useMemo(() => results.slice(0, 9), [results]);
  const choose = (item) => { setSelected(item); if (selectable && onSelectLocation) onSelectLocation(item); };

  return (
    <div className="travel-map-wrap" style={{ minHeight: height }}>
      <div className="travel-map-toolbar">
        <div className="travel-map-search"><Search size={15} /><input value={query} onChange={(e) => search(e.target.value)} placeholder="Search destination..." aria-label="Search destination" /></div>
        <div className="travel-map-filters">{mapCategories.map((item) => <button key={item} onClick={() => setCategory(item)} className={category === item ? 'active' : ''}>{item}</button>)}</div>
      </div>
      {searchResults.length > 0 && <div className="travel-map-results">{searchResults.slice(0, 4).map((item) => <button key={item.id} onClick={() => { choose(item); setQuery(item.name); setSearchResults([]); }}><MapPin size={14} /><span><strong>{item.name}</strong><small>{item.country}</small></span><ChevronRight size={14} /></button>)}</div>}
      <div className="travel-map" style={{ minHeight: `calc(${height} - 62px)` }}>
        <div className="travel-map-watermark">MOCK LOCATION LAYER</div>
        <div className="travel-map-road road-one" /><div className="travel-map-road road-two" /><div className="travel-map-road road-three" />
        {location && <button className="travel-map-center" onClick={() => choose(location)} style={{ left: '50%', top: '47%' }} title={location.name}><span>📍</span></button>}
        {markers.map((marker, index) => {
          const left = 17 + ((index * 23) % 68);
          const top = 22 + ((index * 31) % 58);
          return <button key={marker.id} className={`travel-map-marker ${marker.markerCategory === 'Hospital' || marker.category === 'Hospital' ? 'emergency' : ''}`} style={{ left: `${left}%`, top: `${top}%` }} onClick={() => choose(marker)} title={marker.name}>{markerIcons[marker.markerCategory || marker.category] || '📍'}</button>;
        })}
        <div className="travel-map-label"><span className="travel-live-dot" /> Mock map · {location?.name || 'Select a location'}</div>
        {selected && <div className="travel-map-card"><button onClick={() => setSelected(null)} aria-label="Close marker card"><X size={14} /></button><span className="travel-map-card-icon">{markerIcons[selected.markerCategory || selected.category] || '📍'}</span><div><strong>{selected.name}</strong><small>{selected.address || selected.location || selected.country || 'Selected location'}</small>{selected.phone && <small>{selected.phone} · {selected.openStatus}</small>}</div></div>}
      </div>
    </div>
  );
}
