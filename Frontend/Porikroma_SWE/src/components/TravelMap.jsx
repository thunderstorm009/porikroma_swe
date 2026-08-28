import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, MapPin, Search, X } from 'lucide-react';
import { mapService } from '../services/mapService';

const markerIcons = { Hotel: '🏨', Attraction: '📍', Restaurant: '🍴', Hospital: '🚑', Pharmacy: '💊', Police: '🚓', 'Fire Station': '🚒' };
const defaultCategories = ['All', 'Hotel', 'Attraction', 'Restaurant', 'Emergency'];
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function TravelMap({ location, selectable = false, emergencyLocations = null, mapCategories = defaultCategories, onSelectLocation, height = '360px' }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [category, setCategory] = useState('All');
  const [results, setResults] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

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

  // Load Google Maps JS API script if API key is configured
  useEffect(() => {
    if (!apiKey) return;
    if (window.google?.maps) {
      setScriptLoaded(true);
      return;
    }
    const scriptId = 'google-maps-js-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => setScriptLoaded(false);
      document.head.appendChild(script);
    }
  }, []);

  // Initialize/Update Google Map Instance
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current || !window.google?.maps) return;

    const lat = location?.latitude || 21.4272;
    const lng = location?.longitude || 92.0058;

    if (!mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: true,
        fullscreenControl: false
      });
    } else {
      mapInstance.current.setCenter({ lat, lng });
    }

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Place location center marker
    if (location) {
      const centerMarker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstance.current,
        title: location.name || 'Center',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        }
      });
      markersRef.current.push(centerMarker);
    }

    // Place result markers
    results.forEach((item) => {
      const mLat = item.latitude || lat + (Math.random() - 0.5) * 0.04;
      const mLng = item.longitude || lng + (Math.random() - 0.5) * 0.04;
      const marker = new window.google.maps.Marker({
        position: { lat: mLat, lng: mLng },
        map: mapInstance.current,
        title: item.name,
        icon: {
          url: item.category === 'Hospital' || item.markerCategory === 'Hospital'
            ? 'http://maps.google.com/mapfiles/ms/icons/pink-dot.png'
            : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        }
      });

      marker.addListener('click', () => {
        choose(item);
      });

      markersRef.current.push(marker);
    });
  }, [scriptLoaded, location, results]);

  const search = async (value) => {
    setQuery(value);
    setSearchResults(value ? await mapService.searchLocation(value) : []);
  };

  const markers = useMemo(() => results.slice(0, 9), [results]);
  const choose = (item) => {
    setSelected(item);
    if (selectable && onSelectLocation) onSelectLocation(item);
  };

  const currentSearchTarget = query || location?.name || "Cox's Bazar, Bangladesh";

  return (
    <div className="travel-map-wrap" style={{ minHeight: height }}>
      <div className="travel-map-toolbar">
        <div className="travel-map-search"><Search size={15} /><input value={query} onChange={(e) => search(e.target.value)} placeholder="Search destination..." aria-label="Search destination" /></div>
        <div className="travel-map-filters">{mapCategories.map((item) => <button key={item} onClick={() => setCategory(item)} className={category === item ? 'active' : ''}>{item}</button>)}</div>
      </div>
      {searchResults.length > 0 && <div className="travel-map-results">{searchResults.slice(0, 4).map((item) => <button key={item.id} onClick={() => { choose(item); setQuery(item.name); setSearchResults([]); }}><MapPin size={14} /><span><strong>{item.name}</strong><small>{item.country}</small></span><ChevronRight size={14} /></button>)}</div>}
      <div className="travel-map" style={{ minHeight: `calc(${height} - 62px)` }}>
        {apiKey ? (
          scriptLoaded ? (
            <div ref={mapRef} style={{ width: '100%', height: `calc(${height} - 62px)`, borderRadius: '8px' }} />
          ) : (
            <iframe
              title="Google Map"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '8px', minHeight: `calc(${height} - 62px)` }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(currentSearchTarget)}`}
            />
          )
        ) : (
          <>
            <div className="travel-map-watermark">MOCK LOCATION LAYER</div>
            <div className="travel-map-road road-one" /><div className="travel-map-road road-two" /><div className="travel-map-road road-three" />
            {location && <button className="travel-map-center" onClick={() => choose(location)} style={{ left: '50%', top: '47%' }} title={location.name}><span>📍</span></button>}
            {markers.map((marker, index) => {
              const left = 17 + ((index * 23) % 68);
              const top = 22 + ((index * 31) % 58);
              return <button key={marker.id} className={`travel-map-marker ${marker.markerCategory === 'Hospital' || marker.category === 'Hospital' ? 'emergency' : ''}`} style={{ left: `${left}%`, top: `${top}%` }} onClick={() => choose(marker)} title={marker.name}>{markerIcons[marker.markerCategory || marker.category] || '📍'}</button>;
            })}
          </>
        )}
        <div className="travel-map-label"><span className="travel-live-dot" /> {apiKey ? 'Google Maps' : 'Mock map'} · {location?.name || 'Select a location'}</div>
        {selected && <div className="travel-map-card"><button onClick={() => setSelected(null)} aria-label="Close marker card"><X size={14} /></button><span className="travel-map-card-icon">{markerIcons[selected.markerCategory || selected.category] || '📍'}</span><div><strong>{selected.name}</strong><small>{selected.address || selected.location || selected.country || 'Selected location'}</small>{selected.phone && <small>{selected.phone} · {selected.openStatus}</small>}</div></div>}
      </div>
    </div>
  );
}
