import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import BrowseGroupsPage from './pages/BrowseGroupsPage';
import PlanOptionsPage from './pages/PlanOptionsPage';
import BookingPage from './pages/BookingPage';
import ExpenseTrackerPage from './pages/ExpenseTrackerPage';
import AdminInventoryPage from './pages/AdminInventoryPage';
import AuthorTourPlanPage from './pages/AuthorTourPlanPage';
import ProfilePage from './pages/ProfilePage';
import EnhancedDashboardPage from './pages/EnhancedDashboardPage';
import EnhancedCreateTripPage from './pages/EnhancedCreateTripPage';
import TripWorkspacePage from './pages/TripWorkspacePage';
import AIChatPage from './pages/AIChatPage';
import CommunityPage from './pages/CommunityPage';
import QuestionDetailPage from './pages/QuestionDetailPage';
import { BANGLADESH_TRIPS } from './mockData';
import ProtectedRoute from './contexts/ProtectedRoute';
import { tripService } from './services/tripService';

export default function App() {
  const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const navigate = useNavigate();
  const location = useLocation();
  const [agentPlans, setAgentPlans] = useState({});
  const [forumPrefill, setForumPrefill] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('porikroma-theme') || 'light');
  const [trips, setTrips] = useState(useMock ? BANGLADESH_TRIPS : []);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);

  const toUiTrip = (trip) => ({
    ...trip,
    destination: trip.destination?.name || trip.title,
    dates: trip.start_date && trip.end_date ? `${trip.start_date} — ${trip.end_date}` : 'Dates to be confirmed',
    type: trip.travel_type === 'group' ? 'Group' : 'Solo',
    budgetPercent: 0,
    members: (trip.members || []).map((member) => ({ id: member.user_id, name: member.user?.full_name || member.user?.username || 'Traveler', initial: (member.user?.full_name || member.user?.username || 'T')[0].toUpperCase(), role: member.role, bg: 'bg-teal-primary/20 text-teal-primary' }))
  });

  useEffect(() => {
    setIsLoadingTrips(true);
    tripService.getTrips()
      .then((data) => setTrips(Array.isArray(data) ? data.map(toUiTrip) : []))
      .catch((err) => {
        console.error('Failed to load trips:', err);
        if (!useMock) setTrips([]);
      })
      .finally(() => {
        setIsLoadingTrips(false);
      });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('porikroma-theme', theme);
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
      setTrips((prev) => [toUiTrip(createdTrip), ...prev]);
      navigate(`/trips/${createdTrip.id}`);
    } catch (err) {
      console.error('Failed to create trip', err);
      window.alert(err.message || 'Unable to create the trip. Please try again.');
    }
  };

  const handleUpdateTrip = async (updatedTrip) => {
    try {
      const savedTrip = await tripService.updateTrip(updatedTrip.id, updatedTrip);
      setTrips((prev) => prev.map((t) => (String(t.id) === String(savedTrip.id) ? toUiTrip(savedTrip) : t)));
    } catch (err) {
      console.error('Failed to update trip', err);
      window.alert(err.message || 'Unable to update the trip. Please try again.');
    }
  };

  // Helper component to extract trip ID from URL
  const TripRouteWrapper = ({ Component, tripOnly = false }) => {
    const { tripId } = useParams();
    const activeTrip = trips.find((t) => t.id === String(tripId) || t.id === Number(tripId));
    const [loadedTrip, setLoadedTrip] = useState(null);
    const [isLoading, setIsLoading] = useState(!activeTrip && !!tripId);

    useEffect(() => {
      if (activeTrip || !tripId) {
        setIsLoading(false);
        return undefined;
      }
      let active = true;
      setIsLoading(true);
      tripService.getTrip(tripId)
        .then((trip) => { if (active) setLoadedTrip(toUiTrip(trip)); })
        .catch((error) => console.error('Failed to load trip:', error))
        .finally(() => { if (active) setIsLoading(false); });
      return () => { active = false; };
    }, [activeTrip, tripId]);

    const resolvedTrip = activeTrip || loadedTrip;

    if (isLoading) {
      return <div className="flex h-screen items-center justify-center text-teal-primary text-xl">Loading Trip...</div>;
    }

    if (!resolvedTrip && tripId) {
      return <div className="flex h-screen items-center justify-center text-red-500 text-xl">404 - Trip Not Found</div>;
    }

    if (tripOnly) {
      return <Component onNavigate={handleNavigate} onGoBack={handleGoBack} trip={resolvedTrip} agentPlan={agentPlans[tripId]} onSaveAgentPlan={handleSaveAgentPlan} onUpdateTrip={handleUpdateTrip} theme={theme} onToggleTheme={toggleTheme} />;
    }
    return <Component onNavigate={handleNavigate} onGoBack={handleGoBack} trip={resolvedTrip} theme={theme} onToggleTheme={toggleTheme} />;
  };

  const QuestionRouteWrapper = () => {
    const { questionId } = useParams();
    return <QuestionDetailPage questionId={questionId} onNavigate={handleNavigate} onGoBack={handleGoBack} theme={theme} onToggleTheme={toggleTheme} />;
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage onNavigate={handleNavigate} onGoBack={null} theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/login" element={<AuthPage onNavigate={(v, t) => handleNavigate(v, t)} onGoBack={handleGoBack} initialTab="login" theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/register" element={<AuthPage onNavigate={(v, t) => handleNavigate(v, t)} onGoBack={handleGoBack} initialTab="register" theme={theme} onToggleTheme={toggleTheme} />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<EnhancedDashboardPage onNavigate={handleNavigate} onGoBack={handleGoBack} trips={trips} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/profile" element={<ProfilePage onNavigate={handleNavigate} onGoBack={handleGoBack} />} />
        <Route path="/trips" element={<EnhancedDashboardPage onNavigate={handleNavigate} onGoBack={handleGoBack} trips={trips} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/trips/new" element={<EnhancedCreateTripPage onNavigate={handleNavigate} onGoBack={handleGoBack} onCreateTrip={handleCreateTrip} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/trips/:tripId" element={<TripRouteWrapper Component={TripWorkspacePage} tripOnly={true} />} />
        <Route path="/trips/:tripId/options" element={<TripRouteWrapper Component={PlanOptionsPage} tripOnly={true} />} />
        <Route path="/trips/:tripId/booking" element={<TripRouteWrapper Component={BookingPage} tripOnly={true} />} />
        <Route path="/trips/:tripId/expenses" element={<ExpenseTrackerPage onNavigate={handleNavigate} onGoBack={handleGoBack} trips={trips} tripsLoading={isLoadingTrips} />} />
        <Route path="/trips/:tripId/chat" element={<TripRouteWrapper Component={AIChatPage} tripOnly={true} />} />
        
        <Route path="/groups" element={<BrowseGroupsPage onNavigate={handleNavigate} onGoBack={handleGoBack} />} />
        <Route path="/expenses" element={<ExpenseTrackerPage onNavigate={handleNavigate} onGoBack={handleGoBack} trips={trips} tripsLoading={isLoadingTrips} />} />
        
        <Route path="/ai" element={<AIChatPage onNavigate={handleNavigate} onGoBack={handleGoBack} theme={theme} onToggleTheme={toggleTheme} />} />
        
        <Route path="/community" element={<CommunityPage onNavigate={handleNavigate} onGoBack={handleGoBack} initialMode={new URLSearchParams(location.search).get('mode') || 'home'} prefill={forumPrefill} theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/community/questions/:questionId" element={<QuestionRouteWrapper />} />
      </Route>

      {/* Admin/Planner Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['platform_admin', 'catalog_staff', 'provider_reviewer']} />}>
        <Route path="/admin/inventory" element={<AdminInventoryPage onNavigate={handleNavigate} onGoBack={handleGoBack} />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['provider', 'platform_admin']} />}>
        <Route path="/planner/trips/:tripId" element={<TripRouteWrapper Component={AuthorTourPlanPage} tripOnly={true} />} />
      </Route>
    </Routes>
  );
}
