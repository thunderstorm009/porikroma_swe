import { useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import TravelShell from '../components/TravelShell';
import FormattedMarkdown from '../components/FormattedMarkdown';
import { aiService } from '../services/aiService';

const prompts = ['✨ Plan my trip', '📍 Recommend places', '💰 Optimize my budget', '🌦 Weather advice', '🍴 Recommend restaurants', '🏨 Recommend hotels', '🗓 Improve my itinerary', '🎒 Packing suggestions'];

export default function AIChatPage({ onNavigate, theme, onToggleTheme, trip }) {
  const [messages, setMessages] = useState([{ id: 'welcome', user: 'Porikroma AI', initials: '✦', ai: true, color: 'teal', time: 'now', message: trip ? `I’m ready to help with your ${trip.destination} trip. Ask me about the plan, budget, weather, food, or what to do next.` : 'I’m your travel co-pilot for destinations, budgets, food, weather, hotels, and itineraries. What are you planning?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (event, suggested = '') => {
    event?.preventDefault();
    const message = (suggested || input).trim();
    if (!message || loading) return;
    setInput('');
    setMessages((current) => [...current, { id: Date.now(), user: 'Sarah', initials: 'SJ', color: 'teal', time: 'now', message }]);
    setLoading(true);
    try {
      const response = await aiService.chat(message, { trip, tripId: trip?.id, destination: trip?.destination, travelers: trip?.members?.length, budget: trip?.budget, itinerary: trip?.itinerary || [] });
      setMessages((current) => [...current, { ...response, id: Date.now() + 1, time: 'now' }]);
    } finally {
      setLoading(false);
    }
  };

  return <TravelShell onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} active="AI Assistant" title="Porikroma AI">
    <div className="travel-workspace-header"><div><span className="travel-kicker">Travel intelligence · mock service</span><h2>Ask Porikroma AI</h2><p>{trip ? `Trip context: ${trip.destination} · ${trip.members?.length || 1} traveler${trip.members?.length === 1 ? '' : 's'}` : 'A calm co-pilot for your next move.'}</p></div><button className="travel-button travel-button-ghost" onClick={() => onNavigate('community')}>Ask the community</button></div>
    <div className="travel-grid travel-grid-2">
      <div className="travel-panel travel-chat"><div className="travel-chat-list">{messages.map((message) => <div key={message.id} className={`travel-message ${message.user === 'Sarah' ? 'mine' : ''} ${message.ai ? 'ai' : ''}`}><span className={`avatar avatar-${message.color || 'teal'}`}>{message.initials}</span><div className="travel-message-body"><strong>{message.ai ? '✦ Porikroma AI' : message.user}</strong><FormattedMarkdown content={message.message} /><time>{message.time}</time></div></div>)}{loading && <div className="travel-message ai"><span className="avatar avatar-teal">✦</span><div className="travel-message-body"><strong>✦ Porikroma AI</strong><p>✨ Porikroma AI is thinking...</p></div></div>}</div><div className="travel-chat-prompts">{prompts.map((prompt) => <button key={prompt} onClick={() => send(null, prompt)}>{prompt}</button>)}</div><form className="travel-chat-form" onSubmit={send}><input className="travel-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about your destination, budget, or itinerary…" aria-label="Message Porikroma AI" /><button className="travel-button" disabled={loading} aria-label="Send message"><Send size={14} /></button></form></div>
      <aside className="travel-panel travel-panel-pad travel-ai-card"><span className="travel-ai-title"><Sparkles size={13} style={{ verticalAlign: 'middle' }} /> Porikroma AI</span><h3>Travel advice with context.</h3><p>The UI calls an isolated AI service. Today it returns contextual mock responses; later the same request shape can call the FastAPI endpoint.</p>{trip ? <div className="travel-ai-context"><span className="travel-card-kicker">Trip context included</span><strong>{trip.destination}</strong><small>{trip.members?.length || 1} travelers · ৳{Number(trip.budget || 0).toLocaleString()} budget</small></div> : <div className="travel-alert" style={{ marginTop: 17 }}><Bot size={16} color="#2d6a4f" /><span>Open a trip workspace to give AI your itinerary and budget context.</span></div>}<div className="travel-alert" style={{ marginTop: 17 }}><span>✨</span><span>AI suggestions are informational mock responses. Verify live prices, weather and local guidance before traveling.</span></div></aside>
    </div>
  </TravelShell>;
}
