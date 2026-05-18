import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStats } from '../contexts/StatsContext';
import { useAuth } from '../contexts/AuthContext';
import { UserContext } from '../contexts/UserContext';

// Nested sub-components mapped cleanly to the studio context boundaries
import AnalyticsSidebar from '../components/AnalyticsStudioPage/AnalyticsSidebar';
import AnalyticsHeader from '../components/AnalyticsStudioPage/AnalyticsHeader';
import TraineeMetricsView from '../components/AnalyticsStudioPage/TraineeMetricsView';
import CrossTraineeExerciseView from '../components/AnalyticsStudioPage/CrossTraineeExerciseView';
import FrontendLogger from '../utils/logger';

/**
 * AnalyticsStudioPage Component - Advanced physical performance analytics control center.
 * Completely refactored into pure Tailwind CSS, flat metrics maps, and bright Arctic Mirror elements.
 */
const AnalyticsStudioPage = () => {
  const { userId: urlUserId } = useParams();
  const navigate = useNavigate();
  
  const { user: currentUser } = useAuth();
  const { users, refreshUsers } = useContext(UserContext);
  const { fetchUserOverview, fetchGroupOverview, loading } = useStats();

  // Core UI layout toggle and filter states
  const [dateRange, setDateRange] = useState('week');
  const [selectedTraineeId, setSelectedTraineeId] = useState(urlUserId || null);
  const [statsData, setStatsData] = useState(null);
  
  // Tactical view modes for trainers: 'trainee' (per isolated user) | 'exercise' (cross-squad tracking parameters)
  const [trainerViewMode, setTrainerViewMode] = useState('trainee');

  const isTrainer = currentUser?.role === 'trainer' || currentUser?.role === 'admin';

  // Synchronize team squad member cache tables on mount
  useEffect(() => {
    if (isTrainer && currentUser?.group_id) {
      FrontendLogger.info('ANALYTICS_STUDIO', `Hydrating group members registry data for squad ID: ${currentUser.group_id}`);
      refreshUsers(currentUser.group_id);
    }
  }, [isTrainer, currentUser, refreshUsers]);

  /**
   * Generates dynamic UTC/ISO temporal boundary windows driven by state selections.
   */
  const dateQuery = useMemo(() => {
    const now = new Date();
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    if (dateRange === 'week') {
      const dayOfWeek = now.getDay();
      start.setDate(now.getDate() - dayOfWeek);
    } else if (dateRange === 'month') {
      start.setDate(1);
    } else if (dateRange === 'all') {
      start.setFullYear(now.getFullYear() - 5);
    } else if (dateRange === 'today') {
      // Bounded within current date block parameters
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  }, [dateRange]);

  /**
   * Data Fetching Pipeline: Invokes services dynamically targeting specific payloads.
   */
  useEffect(() => {
    const loadStudioMetrics = async () => {
      try {
        let dataPayload = null;
        if (isTrainer && !selectedTraineeId) {
          FrontendLogger.info('ANALYTICS_STUDIO', 'Requesting group panoramic macro data metrics from backend context');
          dataPayload = await fetchGroupOverview(dateQuery.start, dateQuery.end);
        } else {
          const targetUid = selectedTraineeId || currentUser?.id;
          FrontendLogger.info('ANALYTICS_STUDIO', `Requesting individual user stats payload block for user vector index: ${targetUid}`);
          dataPayload = await fetchUserOverview(targetUid, dateQuery.start, dateQuery.end);
        }
        setStatsData(dataPayload);
      } catch (err) {
        FrontendLogger.error('ANALYTICS_STUDIO', 'Exception intercepted while gathering analytical dataset metrics streams', err);
      }
    };
    loadStudioMetrics();
  }, [selectedTraineeId, dateQuery, currentUser, isTrainer, fetchUserOverview, fetchGroupOverview]);

  /**
   * Safe Context Switcher Coordinator: Keeps active router definitions synced with viewport controls.
   */
  const handleTraineeContextSwitch = (traineeId) => {
    setSelectedTraineeId(traineeId);
    if (traineeId) {
      navigate(`/stats-page/${traineeId}`);
    } else {
      navigate('/stats-page');
    }
  };

  // Isolate current active context profile entity block
  const activeTraineeProfile = useMemo(() => {
    return users.find(u => u.id === selectedTraineeId);
  }, [users, selectedTraineeId]);

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-100 to-zinc-200 font-sans antialiased selection:bg-zinc-900 selection:text-white" dir="rtl">
      
      {/* --- SIDEBAR WORKSPACE: TRAINEE SELECTION NODE PANEL --- */}
      <AnalyticsSidebar 
        isTrainer={isTrainer}
        users={users}
        selectedTraineeId={selectedTraineeId}
        onTraineeSwitch={handleTraineeContextSwitch}
      />

      {/* --- MAIN CORE ANALYTICS VIEWPANEL --- */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Main Context Filters Dashboard Control Header Block */}
          <AnalyticsHeader 
            isTrainer={isTrainer}
            selectedTraineeId={selectedTraineeId}
            activeTraineeProfile={activeTraineeProfile}
            dateRange={dateRange}
            setDateRange={setDateRange}
            trainerViewMode={trainerViewMode}
            setTrainerViewMode={setTrainerViewMode}
          />

          {/* Core Content Layout Switching Pipeline Rendering Stages */}
          {loading || !statsData ? (
            <div className="flex flex-col items-center justify-center py-40 bg-white/30 backdrop-blur-3xl border border-white/60 rounded-[3rem] shadow-xl">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-zinc-200 border-t-zinc-900 mb-4" />
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] animate-pulse">Compiling Performance Ledger Matrix...</p>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
              
              {/* Conditional Routing Module Driven directly by Trainer selections */}
              {isTrainer && !selectedTraineeId && trainerViewMode === 'exercise' ? (
                <CrossTraineeExerciseView statsData={statsData} />
              ) : (
                <TraineeMetricsView statsData={statsData} isGroupMode={isTrainer && !selectedTraineeId} />
              )}

            </div>
          )}
        </div>
      </main>

    </div>
  );
};

export default AnalyticsStudioPage;