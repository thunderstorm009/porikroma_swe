import { useEffect, useMemo, useState } from 'react';
import { Bookmark, ChevronRight, Filter, Heart, MessageCircle, Plus, Search, Sparkles, Tag, Users } from 'lucide-react';
import TravelShell from '../components/TravelShell';
import { FORUM_CATEGORIES } from '../data/forumData';
import { forumService } from '../services/forumService';

const timeAgo = (date) => { const days = Math.max(0, Math.round((Date.now() - new Date(date)) / 86400000)); return days < 1 ? 'today' : `${days}d ago`; };

function QuestionCard({ question, author, onOpen, onToggleBookmark }) {
  return <article className="travel-panel forum-question-card"><button className="forum-card-main" onClick={() => onOpen(question.id)}><div className="forum-question-meta"><span className={`avatar avatar-${author?.color || 'teal'}`}>{author?.initials || '?'}</span><span><strong>{author?.name || 'Traveler'}</strong><small>{author?.role || 'Explorer'} · {timeAgo(question.createdAt)}</small></span><span className="forum-category">{question.category}</span></div><h3>{question.title}</h3><p>{question.content}</p><div className="forum-tags">{question.tags.map((tag) => <span key={tag}><Tag size={10} />{tag}</span>)}</div><div className="forum-card-stats"><span><MessageCircle size={14} /> {question.answerIds.length} answers</span><span><Heart size={14} /> {question.likes} likes</span><span><Users size={14} /> {question.destination}</span></div></button><div className="forum-card-actions"><button className={`forum-action-button ${question.bookmarked ? 'selected' : ''}`} onClick={() => onToggleBookmark(question.id)}><Bookmark size={14} fill={question.bookmarked ? 'currentColor' : 'none'} /> {question.bookmarked ? 'Saved' : 'Save'}</button><button className="forum-action-button" onClick={() => onOpen(question.id)}>Open discussion <ChevronRight size={14} /></button></div></article>;
}

function AskQuestionForm({ onCancel, onCreated, prefill }) {
  const [form, setForm] = useState({ title: prefill?.title || '', content: prefill?.content || '', destination: prefill?.destination || '', category: prefill?.category || 'Destinations', tags: prefill?.tags?.join(', ') || '', includeTripContext: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => { event.preventDefault(); if (!form.title.trim() || !form.content.trim()) return; setSubmitting(true); setError(''); try { const question = await forumService.createQuestion({ ...form, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean), tripContext: prefill?.tripContext }); onCreated(question.id); } catch (requestError) { setError(requestError.message || 'Unable to post your question. Please try again.'); } finally { setSubmitting(false); } };
  return <div className="travel-panel travel-panel-pad forum-form-card"><div className="travel-section-heading" style={{ margin: 0 }}><div><span className="travel-card-kicker">Community contribution</span><h2>Ask the Community</h2><p>Share enough context for travelers to give practical advice.</p></div><button className="travel-link" type="button" onClick={onCancel}>Cancel</button></div>{error && <div className="travel-alert" role="alert"><span>{error}</span></div>}<form onSubmit={submit} className="travel-form-grid forum-form" style={{ marginTop: 20 }}><div className="travel-field full"><label htmlFor="question-title">Title</label><input id="question-title" className="travel-input" value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Best places to visit in Sajek?" required /></div><div className="travel-field full"><label htmlFor="question-content">Question</label><textarea id="question-content" className="travel-textarea" rows="6" value={form.content} onChange={(event) => update('content', event.target.value)} placeholder="Tell travelers what you are planning and what would help you decide." required /></div><div className="travel-field"><label htmlFor="question-destination">Destination</label><input id="question-destination" className="travel-input" value={form.destination} onChange={(event) => update('destination', event.target.value)} placeholder="Sajek Valley" /></div><div className="travel-field"><label htmlFor="question-category">Category</label><select id="question-category" className="travel-select" value={form.category} onChange={(event) => update('category', event.target.value)}>{FORUM_CATEGORIES.filter((category) => category !== 'All').map((category) => <option key={category}>{category}</option>)}</select></div><div className="travel-field full"><label htmlFor="question-tags">Tags</label><input id="question-tags" className="travel-input" value={form.tags} onChange={(event) => update('tags', event.target.value)} placeholder="Sajek, Nature, Photography" /><small>Separate tags with commas.</small></div>{prefill?.tripContext && <div className="travel-field full forum-trip-context"><label><input type="checkbox" checked={form.includeTripContext} onChange={(event) => update('includeTripContext', event.target.checked)} /> Include my trip details in this public question</label><small>Nothing private is published unless you explicitly enable this.</small>{form.includeTripContext && <span>{prefill.tripContext.travelers} travelers · ৳{Number(prefill.tripContext.budget || 0).toLocaleString()} · {prefill.tripContext.dates}</span>}</div>}<div className="travel-form-actions full"><button className="travel-button travel-button-ghost" type="button" onClick={onCancel}>Back</button><button className="travel-button" disabled={submitting}><Plus size={14} /> {submitting ? 'Posting…' : 'Post Question'}</button></div></form></div>;
}

export default function CommunityPage({ onNavigate, theme, onToggleTheme, initialMode = 'home', prefill = null }) {
  const [mode, setMode] = useState(initialMode);
  const [questions, setQuestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('Trending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => { setMode(initialMode); }, [initialMode]);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([forumService.getQuestions({ search: debouncedQuery, category, sort }), forumService.getUsers()])
      .then(([loadedQuestions, loadedUsers]) => {
        if (!active) return;
        setQuestions(loadedQuestions);
        setUsers(loadedUsers);
        setError(false);
      })
      .catch((requestError) => {
        if (!active) return;
        console.error('Failed to load community discussions:', requestError);
        setQuestions([]);
        setUsers([]);
        setError(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debouncedQuery, category, sort, version]);
  const userById = useMemo(() => Object.fromEntries(users.map((user) => [user.id, user])), [users]);
  const openQuestion = (id) => onNavigate('question-detail', id);
  const bookmark = async (id) => { await forumService.bookmarkQuestion(id); setVersion((value) => value + 1); };
  const latest = questions.slice(0, 3);

  return <TravelShell onNavigate={onNavigate} theme={theme} onToggleTheme={onToggleTheme} active="Community" title="Travelers helping travelers">
    {mode === 'ask' ? <AskQuestionForm prefill={prefill} onCancel={() => setMode('home')} onCreated={openQuestion} /> : <>
      <div className="travel-workspace-header"><div><span className="travel-kicker">Porikroma community · {questions.length || '20+'} discussions</span><h2>Community</h2><p>Ask locals, compare routes, and learn from people who have already been there.</p></div><button className="travel-button" onClick={() => setMode('ask')}><Plus size={15} /> Ask a Question</button></div>
      <div className="travel-panel forum-toolbar"><div className="forum-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search discussions, destinations, tags…" aria-label="Search discussions" /></div><div className="forum-toolbar-controls"><div className="forum-select-wrap"><Filter size={14} /><select className="travel-select" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">{FORUM_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></div><select className="travel-select" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort discussions"><option>Trending</option><option>Latest</option><option>Most Helpful</option><option>Most Discussed</option><option>Unanswered</option></select></div></div>
      <div className="forum-category-row">{FORUM_CATEGORIES.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
      {!query && category === 'All' && <div className="forum-highlights"><div className="travel-panel travel-panel-pad travel-ai-card"><span className="travel-ai-title"><Sparkles size={13} style={{ verticalAlign: 'middle' }} /> Community pulse</span><h3>Real places, practical answers.</h3><p>Trending: Sajek planning and Cox’s Bazar budgets. New conversations are added to this community.</p></div><div className="travel-panel travel-panel-pad"><span className="travel-card-kicker">Latest discussions</span>{latest.map((question) => <button key={question.id} className="forum-mini-question" onClick={() => openQuestion(question.id)}><strong>{question.title}</strong><small>{question.answerIds.length} answers · {timeAgo(question.createdAt)}</small></button>)}</div></div>}
      <div className="travel-section-heading forum-list-heading"><div><h2>{sort === 'Unanswered' ? 'Unanswered Questions' : sort === 'Latest' ? 'Latest Discussions' : 'Trending Discussions'}</h2><p>{loading ? 'Loading discussions…' : `${questions.length} discussion${questions.length === 1 ? '' : 's'} found`}</p></div></div>
      {loading ? <div className="travel-panel travel-empty"><span className="travel-loading-dot" /><h3>Loading discussions...</h3></div> : error ? <div className="travel-panel travel-empty"><h3>Unable to load discussions.</h3><p>Unable to connect to the community service. Please try again.</p><button className="travel-button" onClick={() => setVersion((value) => value + 1)}>Try Again</button></div> : questions.length === 0 ? <div className="travel-panel travel-empty"><Search size={26} color="#2d6a4f" /><h3>No discussions yet.</h3><p>Be the first person to ask about this topic.</p><button className="travel-button" onClick={() => setMode('ask')}><Plus size={14} /> Ask a Question</button></div> : <div className="forum-question-list">{questions.map((question) => <QuestionCard key={question.id} question={question} author={question.author || userById[question.authorId]} onOpen={openQuestion} onToggleBookmark={bookmark} />)}</div>}
    </>}
  </TravelShell>;
}
