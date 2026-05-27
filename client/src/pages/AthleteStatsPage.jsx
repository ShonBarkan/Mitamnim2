import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useStatistics } from "../contexts/StatisticsContext";
import { useAuth } from "../contexts/AuthContext";
import { useUsers } from "../contexts/UserContext";

import Header from "../components/AthleteStatsPage/Header";
import OverviewCards from "../components/AthleteStatsPage/OverviewCards";
import ModeTabs from "../components/AthleteStatsPage/ModeTabs";
import SearchPanel from "../components/AthleteStatsPage/SearchPanel";
import ParametersMode from "../components/AthleteStatsPage/ParametersMode";
import ExercisesMode from "../components/AthleteStatsPage/ExercisesMode";
import ErrorState from "../components/AthleteStatsPage/ErrorState";
import EmptyState from "../components/AthleteStatsPage/EmptyState";
import EmptySelectionState from "../components/AthleteStatsPage/EmptySelectionState";
import LoadingSkeleton from "../components/AthleteStatsPage/LoadingSkeleton";
import LoadingOverlay from "../components/AthleteStatsPage/LoadingOverlay";
import TrainerAthleteSelector from "../components/AthleteStatsPage/TrainerAthleteSelector";

const AthleteStatsPage = () => {
  /**
 * ============================================================================
 * CONTEXT
 * ============================================================================
 */

const { loadingStats, fetchRawStatistics } = useStatistics();
const { user } = useAuth();
const { users, refreshUsers } = useUsers();

const isTrainerUser = user?.role === 'trainer' || user?.role === 'admin';

/**
 * ============================================================================
 * STATE
 * ============================================================================
 */

const [statsData, setStatsData] = useState(null);
const [masterGroupStatsData, setMasterGroupStatsData] = useState([]); // Holds ALL athletes stats
const [error, setError] = useState(null);

const [selectedUsers, setSelectedUsers] = useState([]);
const isTrainerMode = isTrainerUser && selectedUsers.length > 0;

const [analyticsMode, setAnalyticsMode] = useState("parameters");

const [selectedExercise, setSelectedExercise] = useState(null);
const [selectedParameter, setSelectedParameter] = useState(null);

const [trainerSubExercise, setTrainerSubExercise] = useState("all");
const [trainerSubParameter, setTrainerSubParameter] = useState("all");

const [visibleExercises, setVisibleExercises] = useState({});
const [visibleParameters, setVisibleParameters] = useState({});

const [normalizeChart, setNormalizeChart] = useState(false);

const [dateFilter, setDateFilter] = useState("all");

const [searchValue, setSearchValue] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");

const isInitialLoadRef = useRef(true);

/**
 * ============================================================================
 * FILTERED DATA
 * ============================================================================
 */

const filteredGroupStatsData = useMemo(() => {
  if (!isTrainerMode || selectedUsers.length === 0) return [];
  return masterGroupStatsData.filter(user => selectedUsers.includes(user.user_id));
}, [masterGroupStatsData, isTrainerMode, selectedUsers]);

/**
 * ============================================================================
 * USER AVATAR MAPPING
 * ============================================================================
 */

const userAvatarMap = useMemo(() => {
  const map = {};
  filteredGroupStatsData.forEach(user => {
    const userName = user.first_name + (user.last_name ? ` ${user.last_name}` : (user.second_name ? ` ${user.second_name}` : ''));
    map[userName] = user.profile_picture || null;
  });
  return map;
}, [filteredGroupStatsData]);

/**
 * ============================================================================
 * EFFECTS
 * ============================================================================
 */

useEffect(() => {
  if (isTrainerUser && users.length === 0) {
    refreshUsers();
  }
}, [isTrainerUser, users.length, refreshUsers]);

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchValue);
  }, 250);

  return () => clearTimeout(timer);
}, [searchValue]);

useEffect(() => {
  loadStatistics();
}, []);

// Only reload statistics from API if the date filter changes.
// We no longer reload when selectedUsers change, as we filter locally.
useEffect(() => {
  if (isInitialLoadRef.current) {
    isInitialLoadRef.current = false;
    return;
  }

  loadStatistics();
}, [dateFilter]);

/**
 * ============================================================================
 * API
 * ============================================================================
 */

const loadStatistics = useCallback(async () => {
  try {
    setError(null);

    // If it's a trainer, fetch ALL users' stats for this date filter once.
    // If it's a trainee, just fetch their own stats.
    const fetchTrainerMode = isTrainerUser; 
    
    // We pass null for user_ids so the backend returns everyone in the group
    const response = await fetchRawStatistics(
      dateFilter,
      fetchTrainerMode,
      null 
    );

    if (fetchTrainerMode) {
      setMasterGroupStatsData(response.data || []);
      setStatsData(null);
    } else {
      setStatsData(response);
      setMasterGroupStatsData([]);
    }
  } catch (err) {
    console.error(err);
    setError("אירעה שגיאה בטעינת הנתונים");
  }
}, [dateFilter, fetchRawStatistics, isTrainerUser]);
  /**
   * ============================================================================
   * HELPERS
   * ============================================================================
   */

  const formatNumber = useCallback((value) => {
    if (typeof value !== "number") return value;

    return new Intl.NumberFormat("he-IL").format(
      Number(value.toFixed(2))
    );
  }, []);

  const generateStableColor = useCallback((seed) => {
    const colors = [
      "#22c55e",
      "#3b82f6",
      "#f97316",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#eab308",
      "#14b8a6",
      "#ef4444",
      "#6366f1",
    ];

    if (typeof seed === 'number') {
      return colors[Math.abs(seed) % colors.length];
    }

    let hash = 0;
    const strSeed = String(seed);

    for (let i = 0; i < strSeed.length; i++) {
      hash = strSeed.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }, []);

  const aggregateParameterValues = useCallback(
    (values, method) => {
      if (!values.length) return 0;

      switch (method) {
        case "max":
          return Math.max(...values);

        case "avg":
          return (
            values.reduce((acc, curr) => acc + curr, 0) / values.length
          );

        case "sum":
        default:
          return values.reduce((acc, curr) => acc + curr, 0);
      }
    },
    []
  );

  const normalizeChartData = useCallback((data, keys) => {
    const ranges = {};

    keys.forEach((key) => {
      const values = data
        .map((item) => item[key])
        .filter((v) => typeof v === "number");

      if (!values.length) return;

      ranges[key] = {
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });

    return data.map((row) => {
      const next = { ...row };

      keys.forEach((key) => {
        const value = row[key];

        if (typeof value !== "number") return;

        const range = ranges[key];

        if (!range || range.max === range.min) {
          next[key] = 100;
          return;
        }

        next[key] =
          ((value - range.min) / (range.max - range.min)) * 100;
      });

      return next;
    });
  }, []);

  const buildTimelineDataset = useCallback((logs, extractor) => {
    return logs.map((log) => {
      const row = {
        date: new Date(log.created_at).toLocaleDateString("he-IL"),
        timestamp: new Date(log.created_at).getTime(),
      };

      extractor(log, row);

      return row;
    });
  }, []);

  /**
   * ============================================================================
   * RAW DATA
   * ============================================================================
   */

  const stats = isTrainerMode ? null : (statsData?.stats || {});
  const logs = stats?.logs || [];

  const combinedStats = useMemo(() => {
    if (!isTrainerMode) return stats;
    return {
      total_sessions: filteredGroupStatsData.reduce((sum, u) => sum + (u.stats?.total_sessions || 0), 0),
      total_duration_minutes: filteredGroupStatsData.reduce((sum, u) => sum + (u.stats?.total_duration_minutes || 0), 0),
      breakdown: filteredGroupStatsData.map(u => ({
        name: u.first_name + (u.last_name ? ` ${u.last_name}` : (u.second_name ? ` ${u.second_name}` : '')),
        sessions: u.stats?.total_sessions || 0,
        duration: u.stats?.total_duration_minutes || 0
      })).filter(u => u.sessions > 0)
    };
  }, [stats, filteredGroupStatsData, isTrainerMode]);

  /**
   * ============================================================================
   * SORTED LOGS
   * ============================================================================
   */

  const sortedGroupData = useMemo(() => {
    if (!isTrainerMode) return [];
    return filteredGroupStatsData.map((user) => {
      const sorted = [...(user.stats?.logs || [])].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      return { ...user, sortedLogs: sorted };
    });
  }, [filteredGroupStatsData, isTrainerMode]);

  const sortedLogs = useMemo(() => {
    if (isTrainerMode) return [];
    return [...logs].sort(
      (a, b) =>
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
    );
  }, [logs, isTrainerMode]);

  /**
   * ============================================================================
   * GROUPING HELPERS
   * ============================================================================
   */

  const processLogIntoExercisesMap = (log, map) => {
    if (!map.has(log.exercise_id)) {
      map.set(log.exercise_id, {
        id: log.exercise_id,
        name: log.exercise_name,
        logs: [],
        appearances: 0,
        tags: log.tags || [],
      });
    }
    const current = map.get(log.exercise_id);
    current.logs.push(log);
    current.appearances += 1;
  };

  const exercisesMap = useMemo(() => {
    const map = new Map();

    if (isTrainerMode) {
      sortedGroupData.forEach((user) => {
        user.sortedLogs.forEach((log) => processLogIntoExercisesMap(log, map));
      });
    } else {
      sortedLogs.forEach((log) => processLogIntoExercisesMap(log, map));
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.appearances !== a.appearances) return b.appearances - a.appearances;
      return a.name.localeCompare(b.name, "he");
    });
  }, [sortedLogs, sortedGroupData, isTrainerMode]);

  const processLogIntoParametersMap = (log, map) => {
    log.params?.forEach((param) => {
      const key = param.parameter_name;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: param.parameter_name,
          unit: param.parameter_unit,
          method: param.display_method,
          values: [],
          appearances: 0,
          logs: [],
        });
      }
      const current = map.get(key);
      current.values.push(Number(param.value));
      current.logs.push(log);
      current.appearances += 1;
    });
  };

  const parametersMap = useMemo(() => {
    const map = new Map();

    if (isTrainerMode) {
      sortedGroupData.forEach((user) => {
        user.sortedLogs.forEach((log) => processLogIntoParametersMap(log, map));
      });
    } else {
      sortedLogs.forEach((log) => processLogIntoParametersMap(log, map));
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.appearances !== a.appearances) return b.appearances - a.appearances;
      return a.name.localeCompare(b.name, "he");
    });
  }, [sortedLogs, sortedGroupData, isTrainerMode]);

  /**
   * ============================================================================
   * FILTERED SEARCH LIST
   * ============================================================================
   */

  const filteredSearchResults = useMemo(() => {
    if (analyticsMode === "parameters") {
      return parametersMap.filter((parameter) =>
        parameter.name
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase())
      );
    }

    return exercisesMap.filter((exercise) =>
      exercise.name
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase())
    );
  }, [
    analyticsMode,
    parametersMap,
    exercisesMap,
    debouncedSearch,
  ]);

  /**
   * ============================================================================
   * SELECTED PARAMETER ANALYTICS
   * ============================================================================
   */

  const selectedParameterData = useMemo(() => {
    if (!selectedParameter) return null;

    const values = [];
    const valuesByAthlete = [];
    let count = 0;
    
    if (isTrainerMode) {
      sortedGroupData.forEach((user) => {
        const userValues = [];
        user.sortedLogs.forEach((log) => {
          const param = log.params.find(p => p.parameter_name === selectedParameter.name);
          if (param) {
            const numVal = Number(param.value);
            values.push(numVal);
            userValues.push(numVal);
            count++;
          }
        });

        if (userValues.length > 0) {
          const userName = user.first_name + (user.last_name ? ` ${user.last_name}` : (user.second_name ? ` ${user.second_name}` : ''));
          valuesByAthlete.push({
            name: userName,
            aggregate: aggregateParameterValues(userValues, selectedParameter.method)
          });
        }
      });
    } else {
      sortedLogs.forEach((log) => {
        const param = log.params.find(p => p.parameter_name === selectedParameter.name);
        if (param) {
          values.push(Number(param.value));
          count++;
        }
      });
    }

    if (count === 0) return null;

    return {
      aggregate: aggregateParameterValues(values, selectedParameter.method),
      average: values.reduce((a, b) => a + b, 0) / count,
      max: Math.max(...values),
      count,
      values,
      valuesByAthlete
    };
  }, [selectedParameter, sortedLogs, sortedGroupData, isTrainerMode, aggregateParameterValues]);

  /**
   * ============================================================================
   * PARAMETER BREAKDOWN
   * ============================================================================
   */

  const parameterExerciseBreakdown = useMemo(() => {
    if (!selectedParameter) return [];

    const map = new Map();

    if (isTrainerMode) {
      // In trainer mode, still break down by exercise, but aggregate across all users
      // to populate the cards and the sub-filter dropdown.
      sortedGroupData.forEach((user) => {
        user.sortedLogs.forEach((log) => {
          const param = log.params.find(p => p.parameter_name === selectedParameter.name);
          if (!param) return;
          if (!map.has(log.exercise_name)) map.set(log.exercise_name, []);
          map.get(log.exercise_name).push(Number(param.value));
        });
      });
    } else {
      sortedLogs.forEach((log) => {
        const param = log.params.find((p) => p.parameter_name === selectedParameter.name);
        if (!param) return;
        if (!map.has(log.exercise_name)) map.set(log.exercise_name, []);
        map.get(log.exercise_name).push(Number(param.value));
      });
    }

    const breakdown = Array.from(map.entries()).map(
      ([exerciseName, values]) => ({
        exerciseName,
        value: aggregateParameterValues(values, selectedParameter.method),
        unit: selectedParameter.unit,
      })
    );

    if (!breakdown.length) return [];
    const maxValue = Math.max(...breakdown.map((item) => item.value));

    return breakdown
      .map((item) => ({ ...item, percentage: (item.value / maxValue) * 100 }))
      .sort((a, b) => b.value - a.value);
  }, [selectedParameter, sortedLogs, sortedGroupData, isTrainerMode, aggregateParameterValues]);

  // Handle setting default sub-filters when parameter or exercise changes
  useEffect(() => {
    if (isTrainerMode && parameterExerciseBreakdown.length > 0) {
      if (!parameterExerciseBreakdown.some(e => e.exerciseName === trainerSubExercise)) {
        setTrainerSubExercise(parameterExerciseBreakdown[0].exerciseName);
      }
    }
  }, [parameterExerciseBreakdown, isTrainerMode, trainerSubExercise]);

  /**
   * ============================================================================
   * PARAMETER TIMELINE
   * ============================================================================
   */

  const parameterTimelineData = useMemo(() => {
    if (!selectedParameter) return [];

    if (isTrainerMode) {
      const dateMap = new Map();
      
      sortedGroupData.forEach((user) => {
        const userName = user.first_name + (user.second_name ? ` ${user.second_name}` : '');
        user.sortedLogs.forEach((log) => {
          if (trainerSubExercise && trainerSubExercise !== "all" && log.exercise_name !== trainerSubExercise) {
            return;
          }
          const param = log.params.find(p => p.parameter_name === selectedParameter.name);
          if (!param) return;
          
          const dateStr = new Date(log.created_at).toLocaleDateString("he-IL");
          if (!dateMap.has(dateStr)) {
            dateMap.set(dateStr, { date: dateStr, timestamp: new Date(log.created_at).getTime() });
          }
          const row = dateMap.get(dateStr);
          row[userName] = row[userName] ? Math.max(row[userName], Number(param.value)) : Number(param.value);
        });
      });
      return Array.from(dateMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    } else {
      return buildTimelineDataset(
        sortedLogs.filter((log) => log.params.some((param) => param.parameter_name === selectedParameter.name)),
        (log, row) => {
          const param = log.params.find((p) => p.parameter_name === selectedParameter.name);
          row[log.exercise_name] = Number(param.value);
        }
      );
    }
  }, [selectedParameter, sortedLogs, sortedGroupData, isTrainerMode, buildTimelineDataset, trainerSubExercise]);

  /**
   * ============================================================================
   * EXERCISE ANALYTICS
   * ============================================================================
   */

  const selectedExerciseData = useMemo(() => {
    if (!selectedExercise) return null;

    if (isTrainerMode) {
      // In trainer mode, break down by parameter for the selected exercise, 
      // aggregating across all users.
      const paramMap = new Map();
      sortedGroupData.forEach((user) => {
        const relevantLogs = user.sortedLogs.filter((log) => log.exercise_id === selectedExercise.id);
        relevantLogs.forEach((log) => {
          log.params.forEach((param) => {
            const key = param.parameter_name;
            if (!paramMap.has(key)) {
              paramMap.set(key, {
                name: param.parameter_name,
                unit: param.parameter_unit,
                method: param.display_method,
                values: [],
              });
            }
            paramMap.get(key).values.push(Number(param.value));
          });
        });
      });

      return Array.from(paramMap.values()).map((param) => ({
        ...param,
        aggregate: aggregateParameterValues(param.values, param.method),
        max: Math.max(...param.values),
        avg: param.values.reduce((a, b) => a + b, 0) / param.values.length,
      }));
    }

    const relevantLogs = sortedLogs.filter(
      (log) => log.exercise_id === selectedExercise.id
    );

    const paramMap = new Map();

    relevantLogs.forEach((log) => {
      log.params.forEach((param) => {
        const key = param.parameter_name;

        if (!paramMap.has(key)) {
          paramMap.set(key, {
            name: param.parameter_name,
            unit: param.parameter_unit,
            method: param.display_method,
            values: [],
          });
        }

        paramMap.get(key).values.push(Number(param.value));
      });
    });

    return Array.from(paramMap.values()).map((param) => ({
      ...param,
      aggregate: aggregateParameterValues(
        param.values,
        param.method
      ),
      max: Math.max(...param.values),
      avg:
        param.values.reduce((a, b) => a + b, 0) /
        param.values.length,
    }));
  }, [
    selectedExercise,
    sortedLogs,
    sortedGroupData,
    isTrainerMode,
    aggregateParameterValues,
  ]);

  useEffect(() => {
    if (isTrainerMode && selectedExerciseData && selectedExerciseData.length > 0) {
      if (!selectedExerciseData.some(p => p.name === trainerSubParameter)) {
        setTrainerSubParameter(selectedExerciseData[0].name);
      }
    }
  }, [selectedExerciseData, isTrainerMode, trainerSubParameter]);

  /**
   * ============================================================================
   * EXERCISE CHART
   * ============================================================================
   */

  const exerciseTimelineData = useMemo(() => {
    if (!selectedExercise) return [];

    let rows;
    if (isTrainerMode) {
      const dateMap = new Map();
      sortedGroupData.forEach((user) => {
        const userName = user.first_name + (user.last_name ? ` ${user.last_name}` : (user.second_name ? ` ${user.second_name}` : ''));
        const exerciseLogs = user.sortedLogs.filter((log) => log.exercise_id === selectedExercise.id);
        exerciseLogs.forEach((log) => {
          const dateStr = new Date(log.created_at).toLocaleDateString("he-IL");
          if (!dateMap.has(dateStr)) {
            dateMap.set(dateStr, { date: dateStr, timestamp: new Date(log.created_at).getTime() });
          }
          const row = dateMap.get(dateStr);
          
          if (trainerSubParameter && trainerSubParameter !== "all") {
             const param = log.params.find(p => p.parameter_name === trainerSubParameter);
             if (param) {
                 row[userName] = row[userName] ? Math.max(row[userName], Number(param.value)) : Number(param.value);
             }
          } else {
             // Fallback if somehow nothing is selected: sum of all parameters? Not useful, but keeps it safe
             let sum = 0;
             log.params.forEach(p => sum += Number(p.value));
             row[userName] = row[userName] ? Math.max(row[userName], sum) : sum;
          }
        });
      });
      return Array.from(dateMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    } else {
      const exerciseLogs = sortedLogs.filter(
        (log) => log.exercise_id === selectedExercise.id
      );

      rows = buildTimelineDataset(
        exerciseLogs,
        (log, row) => {
          log.params.forEach((param) => {
            row[param.parameter_name] = Number(param.value);
          });
        }
      );

      if (!normalizeChart) return rows;

      const keys = selectedExerciseData?.map((p) => p.name) || [];

      return normalizeChartData(rows, keys);
    }
  }, [
    selectedExercise,
    selectedExerciseData,
    sortedLogs,
    sortedGroupData,
    isTrainerMode,
    buildTimelineDataset,
    normalizeChart,
    normalizeChartData,
  ]);

  /**
   * ============================================================================
   * DEFAULT VISIBILITY
   * ============================================================================
   */

  useEffect(() => {
    if (!selectedParameter) return;

    const next = {};

    parameterExerciseBreakdown.forEach((item) => {
      next[item.exerciseName] = true;
    });

    setVisibleExercises(next);
  }, [selectedParameter]);

  useEffect(() => {
    if (!selectedExerciseData) return;

    const next = {};

    selectedExerciseData.forEach((param) => {
      next[param.name] = true;
    });

    setVisibleParameters(next);
  }, [selectedExerciseData]);

  /**
   * ============================================================================
   * ACTIONS
   * ============================================================================
   */

  const handleParameterSelect = useCallback((parameter) => {
    setSelectedParameter(parameter);
    setSelectedExercise(null);
  }, []);

  const handleExerciseSelect = useCallback((exercise) => {
    setSelectedExercise(exercise);
    setSelectedParameter(null);
  }, []);

  if (error) {
    return <ErrorState loadStatistics={loadStatistics} />;
  }

  const hasDataToDisplay = isTrainerMode 
    ? filteredGroupStatsData.length > 0
    : logs.length > 0;

  return (
    <div dir="rtl" className="min-h-screen bg-[#09090B] text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <Header
          statsData={statsData}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          loadingStats={loadingStats}
        />

        {isTrainerUser && (
          <TrainerAthleteSelector
            users={users}
            selectedUsers={selectedUsers}
            setSelectedUsers={setSelectedUsers}
          />
        )}

        {loadingStats && <LoadingSkeleton />}

        {!loadingStats && (
          <>
            {!hasDataToDisplay ? (
              <EmptyState />
            ) : (
              <>
                <OverviewCards 
                  stats={combinedStats} 
                  formatNumber={formatNumber} 
                  isTrainerMode={isTrainerMode}
                  userAvatarMap={userAvatarMap}
                />

                <ModeTabs
                  analyticsMode={analyticsMode}
                  setAnalyticsMode={setAnalyticsMode}
                  setSelectedExercise={setSelectedExercise}
                  setSelectedParameter={setSelectedParameter}
                />

                <SearchPanel
                  analyticsMode={analyticsMode}
                  searchValue={searchValue}
                  setSearchValue={setSearchValue}
                  filteredSearchResults={filteredSearchResults}
                  selectedParameter={selectedParameter}
                  handleParameterSelect={handleParameterSelect}
                  selectedExercise={selectedExercise}
                  handleExerciseSelect={handleExerciseSelect}
                />

                {analyticsMode === "parameters" && !selectedParameter && (
                  <EmptySelectionState />
                )}

                {analyticsMode === "exercises" && !selectedExercise && (
                  <EmptySelectionState />
                )}

                {analyticsMode === "parameters" &&
                  selectedParameter &&
                  selectedParameterData && (
                    <ParametersMode
                      selectedParameter={selectedParameter}
                      selectedParameterData={selectedParameterData}
                      formatNumber={formatNumber}
                      parameterExerciseBreakdown={parameterExerciseBreakdown}
                      parameterTimelineData={parameterTimelineData}
                      visibleExercises={visibleExercises}
                      setVisibleExercises={setVisibleExercises}
                      generateStableColor={generateStableColor}
                      isTrainerMode={isTrainerMode}
                      userAvatarMap={userAvatarMap}
                      trainerSubExercise={trainerSubExercise}
                      setTrainerSubExercise={setTrainerSubExercise}
                    />
                  )}

                {analyticsMode === "exercises" &&
                  selectedExercise &&
                  selectedExerciseData && (
                    <ExercisesMode
                      selectedExerciseData={selectedExerciseData}
                      formatNumber={formatNumber}
                      exerciseTimelineData={exerciseTimelineData}
                      normalizeChart={normalizeChart}
                      setNormalizeChart={setNormalizeChart}
                      visibleParameters={visibleParameters}
                      setVisibleParameters={setVisibleParameters}
                      generateStableColor={generateStableColor}
                      isTrainerMode={isTrainerMode}
                      userAvatarMap={userAvatarMap}
                      trainerSubParameter={trainerSubParameter}
                      setTrainerSubParameter={setTrainerSubParameter}
                    />
                  )}
              </>
            )}
          </>
        )}

        {loadingStats && <LoadingOverlay />}
      </div>
    </div>
  );
};

export default AthleteStatsPage;