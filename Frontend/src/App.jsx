import { lazy, Suspense, useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import { useAuth } from './contexts/useAuth';

// Route-level code splitting: the landing/auth pages load first, everything else on demand.
const BrowseGroupsPage = lazy(() => import('./pages/BrowseGroupsPage'));
const PlanOptionsPage = lazy(() => import('./pages/PlanOptionsPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const ExpenseTrackerPage = lazy(() => import('./pages/ExpenseTrackerPage'));
const AdminInventoryPage = lazy(() => import('./pages/AdminInventoryPage'));
const AuthorTourPlanPage = lazy(() => import('./pages/AuthorTourPlanPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EnhancedDashboardPage = lazy(() => import('./pages/EnhancedDashboardPage'));
const EnhancedCreateTripPage = lazy(() => import('./pages/EnhancedCreateTripPage'));
const TripWorkspacePage = lazy(() => import('./pages/TripWorkspacePage'));
const AIChatPage = lazy(() => import('./pages/AIChatPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const QuestionDetailPage = lazy(() => import('./pages/QuestionDetailPage'));

const PageFallback = () => (
  <div className="flex h-screen items-center justify-center text-teal-primary text-xl" role="status">Loading…</div>
);

import { BANGLADESH_TRIPS } from './mockData';
import ProtectedRoute from './contexts/ProtectedRoute';
import { tripService } from './services/tripService';

const toUiTrip = (trip) => {
  if (!trip) return null;
  const destName = typeof trip.destination === 'string'
    ? trip.destination
    : (trip.destination?.name || trip.title || 'Trip Corridor');
  return {
    ...trip,
    destination: destName,
    dates: trip.dates || (trip.start_date && trip.end_date ? `${trip.start_date} — ${trip.end_date}` : 'Dates to be confirmed'),
    type: trip.type || (trip.travel_type === 'group' ? 'Group' : 'Solo'),
    budgetPercent: trip.budgetPercent ?? 0,
    members: (trip.members || []).map((member) => ({
      id: member.id || member.user_id,
      userId: member.user_id || member.userId || null,
      name: member.name || member.user?.full_name || member.user?.username || 'Traveler',
      initial: member.initial || (member.name || member.user?.full_name || member.user?.username || 'T')[0].toUpperCase(),
      role: member.role || 'Member',
      bg: member.bg || 'bg-teal-primary/20 text-teal-primary'
    }))
  };
};

function TripRouteWrapper({
  Component,
  tripOnly = false,
  trips = [],
  onNavigate,
  onGoBack,
  agentPlans = {},
  onSaveAgentPlan,
  onUpdateTrip,
  onTripStateChange,
  theme,
  onToggleTheme
}) {
  const { tripId } = useParams();
  const activeTrip = trips.find((t) => String(t.id) === String(tripId));
  const [loadedTrip, setLoadedTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(!activeTrip && !!tripId);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (activeTrip || !tripId) {
      setIsLoading(false);
      return undefined;
    }
    let active = true;
    setIsLoading(true);
    setErrorMsg(null);
    tripService.getTrip(tripId)
      .then((trip) => {
        if (active) {
          setLoadedTrip(toUiTrip(trip));
        }
      })
      .catch((error) => {
        if (active) {
          console.error('Failed to load trip:', error);
          setErrorMsg(error.message || 'Unable to access trip details.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeTrip, tripId]);

  const resolvedTrip = activeTrip || loadedTrip;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-teal-primary text-xl">
        Loading Trip...
      </div>
    );
  }

  if (!resolvedTrip && tripId) {
    return (
      <div className="min-h-screen bg-[#F5F6F4]/40 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-border-custom p-8 rounded-xl max-w-md w-full space-y-4 shadow-sm">
          <h2 className="text-2xl font-serif text-navy font-bold">Access Restricted / Not Found</h2>
          <p className="text-sm text-navy/70">{errorMsg || 'You do not have permission to view this trip or it does not exist.'}</p>
          <div className="flex justify-center gap-3 pt-4">
            <button onClick={() => onNavigate('dashboard')} className="px-4 py-2 bg-teal-primary text-white text-xs font-semibold rounded-lg hover:bg-teal-hover transition-colors">
              Go to Dashboard
            </button>
            <button onClick={() => onNavigate('browse-groups')} className="px-4 py-2 border border-border-custom text-navy text-xs font-semibold rounded-lg hover:bg-fog transition-colors">
              Browse Public Groups
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tripOnly) {
    return (
      <Component
        onNavigate={onNavigate}
        onGoBack={onGoBack}
        trip={resolvedTrip}
        agentPlan={agentPlans[tripId]}
        onSaveAgentPlan={onSaveAgentPlan}
        onUpdateTrip={onUpdateTrip}
        onTripStateChange={(updated) => {
          if (!activeTrip) setLoadedTrip(updated);
          if (onTripStateChange) onTripStateChange(updated);
        }}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    );
  }
  return (
    <Component
      onNavigate={onNavigate}
      onGoBack={onGoBack}
      trip={resolvedTrip}
      theme={theme}
      onToggleTheme={onToggleTheme}
    />
  );
}

function QuestionRouteWrapper({ onNavigate, onGoBack, theme, onToggleTheme }) {
  const { questionId } = useParams();
  return (
    <QuestionDetailPage
      questionId={questionId}
      onNavigate={onNavigate}
      onGoBack={onGoBack}
      theme={theme}
      onToggleTheme={onToggleTheme}
    />
  );
}

export default function App() {
  const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userId = user?.id || null;
  const [agentPlans, setAgentPlans] = useState({});
  const [forumPrefill, setForumPrefill] = useState(null);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('porikroma-theme') || 'light'; } catch { return 'light'; }
  });
  const [trips, setTrips] = useState(useMock ? BANGLADESH_TRIPS.map(toUiTrip) : []);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);

  // Trips belong to the signed-in user: load them when the user changes and drop
  // them on sign-out so the next account never sees the previous one's trips.
  useEffect(() => {
    if (useMock) return undefined;
    if (!userId) {
      setTrips([]);
      setIsLoadingTrips(false);
      return undefined;
    }
    let active = true;
    setIsLoadingTrips(true);
    tripService.getTrips()
      .then((data) => { if (active) setTrips(Array.isArray(data) ? data.map(toUiTrip) : []); })
      .catch((err) => {
        console.error('Failed to load trips:', err);
        if (active) setTrips([]);
      })
      .finally(() => { if (active) setIsLoadingTrips(false); });
    return () => { active = false; };
  }, [useMock, userId]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('porikroma-theme', theme); } catch { /* storage unavailable */ }
  }, [theme]);

  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark');

  const handleNavigate = (view, extra = null, isBack = false) => {
    if (isBack) {
      navigate(-1);
      return;
    }
    switch (view) {
      case 'landing': navigate('/'); break;
      case 'auth': navigate(`/${extra || 'login'}`); break;
      case 'dashboard': navigate('/dashboard'); break;
      case 'create-trip': navigate('/trips/new'); break;
      case 'browse-groups': navigate('/groups'); break;
      case 'trip-detail': navigate(`/trips/${extra}`); break;
      case 'plan-options': navigate(`/trips/${extra}/options`); break;
      case 'booking': navigate(`/trips/${extra}/booking`); break;
      case 'expenses': navigate(extra ? `/trips/${extra}/expenses` : '/expenses'); break;
      case 'admin-inventory': navigate('/admin/inventory'); break;
      case 'author-plan': {
        const targetTripId = extra || trips[0]?.id;
        if (targetTripId) navigate(`/planner/trips/${targetTripId}`);
        else navigate('/trips');
        break;
      }
      case 'profile': navigate('/profile'); break;
      case 'ai-chat': navigate('/ai'); break;
      case 'community': navigate('/community'); break;
      case 'ask-question': 
        setForumPrefill(extra || null);
        navigate('/community?mode=ask'); 
        break;
      case 'question-detail': navigate(`/community/questions/${extra}`); break;
      default: navigate('/');
    }
  };

  const handleGoBack = () => navigate(-1);

  const handleSaveAgentPlan = (planData) => {
    setAgentPlans((prev) => ({ ...prev, [planData.tripId]: planData }));
  };

  const handleCreateTrip = async (newTrip) => {
    try {
      const createdTrip = await tripService.createTrip(newTrip);
      const uiTrip = toUiTrip(createdTrip);
      setTrips((prev) => [uiTrip, ...prev]);
      navigate(`/trips/${createdTrip.id}`);
    } catch (err) {
      console.error('Failed to create trip', err);
      window.alert(err.message || 'Unable to create the trip. Please try again.');
    }
  };

  // Persists trip fields with PATCH /trips/{id}. Throws so callers can show the error.
  const handleUpdateTrip = async (updatedTrip) => {
    const savedTrip = await tripService.updateTrip(updatedTrip.id, updatedTrip);
    const uiTrip = { ...updatedTrip, ...toUiTrip(savedTrip) };
    setTrips((prev) => prev.map((t) => (String(t.id) === String(updatedTrip.id) ? uiTrip : t)));
    return uiTrip;
  };

  // Local-only update after a sub-resource (expense, member, ...) was already saved
  // through its own endpoint. Must not re-PATCH the whole trip.
  const handleTripStateChange = useCallback((updatedTrip) => {
    setTrips((prev) => prev.map((t) => (String(t.id) === String(updatedTrip.id) ? { ...t, ...updatedTrip } : t)));
  }, []);

  const tripRouteProps = {
    trips,
    onNavigate: handleNavigate,
    onGoBack: handleGoBack,
    agentPlans,
    onSaveAgentPlan: handleSaveAgentPlan,
    onUpdateTrip: handleUpdateTrip,
    onTripStateChange: handleTripStateChange,
    theme,
    onToggleTheme: toggleTheme
  };

  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/" element={<LandingPage onNavigate={handleNavigate} onGoBack={null} theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/login" element={<AuthPage onNavigate={(v, t) => handleNavigate(v, t)} onGoBack={handleGoBack} initialTab="login" theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/auth" element={<AuthPage onNavigate={(v, t) => handleNavigate(v, t)} onGoBack={handleGoBack} initialTab="login" theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/signup" element={<AuthPage onNavigate={(v, t) => handleNavigate(v, t)} onGoBack={handleGoBack} initialTab="signup" theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/register" element={<AuthPage onNavigate={(v, t) => handleNavigate(v, t)} onGoBack={handleGoBack} initialTab="signup" theme={theme} onToggleTheme={toggleTheme} />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<EnhancedDashboardPage onNavigate={handleNavigate} onGoBack={handleGoBack} trips={trips} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/profile" element={<ProfilePage onNavigate={handleNavigate} onGoBack={handleGoBack} />} />
        <Route path="/trips" element={<EnhancedDashboardPage onNavigate={handleNavigate} onGoBack={handleGoBack} trips={trips} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/trips/new" element={<EnhancedCreateTripPage onNavigate={handleNavigate} onGoBack={handleGoBack} onCreateTrip={handleCreateTrip} theme={theme} onToggleTheme={toggleTheme} />} />
        
        {/* Trip Detail & Workspace Routes */}
        <Route path="/trips/:tripId" element={<TripRouteWrapper Component={TripWorkspacePage} tripOnly={true} {...tripRouteProps} />} />
        <Route path="/trips/:tripId/details" element={<TripRouteWrapper Component={TripWorkspacePage} tripOnly={true} {...tripRouteProps} />} />
        <Route path="/trips/:tripId/detail" element={<TripRouteWrapper Component={TripWorkspacePage} tripOnly={true} {...tripRouteProps} />} />
        <Route path="/trip/:tripId" element={<TripRouteWrapper Component={TripWorkspacePage} tripOnly={true} {...tripRouteProps} />} />
        <Route path="/trip/:tripId/details" element={<TripRouteWrapper Component={TripWorkspacePage} tripOnly={true} {...tripRouteProps} />} />
        <Route path="/trip/:tripId/detail" element={<TripRouteWrapper Component={TripWorkspacePage} tripOnly={true} {...tripRouteProps} />} />
        
        {/* Nested Trip Sub-Routes */}
        <Route path="/trips/:tripId/options" element={<TripRouteWrapper Component={PlanOptionsPage} tripOnly={true} {...tripRouteProps} />} />
        <Route path="/trips/:tripId/booking" element={<TripRouteWrapper Component={BookingPage} tripOnly={true} {...tripRouteProps} />} />
        <Route path="/trips/:tripId/expenses" element={<ExpenseTrackerPage onNavigate={handleNavigate} onGoBack={handleGoBack} trips={trips} tripsLoading={isLoadingTrips} />} />
        <Route path="/trips/:tripId/chat" element={<TripRouteWrapper Component={AIChatPage} tripOnly={true} {...tripRouteProps} />} />
        
        {/* Global Features */}
        <Route path="/groups" element={<BrowseGroupsPage onNavigate={handleNavigate} onGoBack={handleGoBack} />} />
        <Route path="/expenses" element={<ExpenseTrackerPage onNavigate={handleNavigate} onGoBack={handleGoBack} trips={trips} tripsLoading={isLoadingTrips} />} />
        <Route path="/ai" element={<AIChatPage onNavigate={handleNavigate} onGoBack={handleGoBack} theme={theme} onToggleTheme={toggleTheme} />} />
        
        {/* Community Forum */}
        <Route path="/community" element={<CommunityPage onNavigate={handleNavigate} onGoBack={handleGoBack} initialMode={new URLSearchParams(location.search).get('mode') || 'home'} prefill={forumPrefill} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/community/questions/:questionId" element={<QuestionRouteWrapper onNavigate={handleNavigate} onGoBack={handleGoBack} theme={theme} onToggleTheme={toggleTheme} />} />
      </Route>

      {/* Admin/Planner Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['platform_admin', 'catalog_staff', 'provider_reviewer']} />}>
        <Route path="/admin/inventory" element={<AdminInventoryPage onNavigate={handleNavigate} onGoBack={handleGoBack} />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['provider', 'platform_admin']} />}>
        <Route path="/planner/trips/:tripId" element={<TripRouteWrapper Component={AuthorTourPlanPage} tripOnly={true} {...tripRouteProps} />} />
      </Route>
      <Route path="*" element={<LandingPage onNavigate={handleNavigate} onGoBack={null} theme={theme} onToggleTheme={toggleTheme} />} />
    </Routes>
    </Suspense>
  );
}
