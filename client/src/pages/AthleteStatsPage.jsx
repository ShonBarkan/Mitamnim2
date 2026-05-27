import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useStatistics } from "../contexts/StatisticsContext";

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

const AthleteStatsPage = () => {
  /**
 * ============================================================================
 * CONTEXT
 * ============================================================================
 */

const { loadingStats, fetchRawStatistics } = useStatistics();

/**
 * ============================================================================
 * STATE
 * ============================================================================
 */

const [statsData, setStatsData] = useState(null);
const [error, setError] = useState(null);

const [analyticsMode, setAnalyticsMode] = useState("parameters");

const [selectedExercise, setSelectedExercise] = useState(null);
const [selectedParameter, setSelectedParameter] = useState(null);

const [visibleExercises, setVisibleExercises] = useState({});
const [visibleParameters, setVisibleParameters] = useState({});

const [normalizeChart, setNormalizeChart] = useState(false);

const [dateFilter, setDateFilter] = useState("all");

const [searchValue, setSearchValue] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");

const isInitialLoadRef = useRef(true);

/**
 * ============================================================================
 * EFFECTS
 * ============================================================================
 */

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchValue);
  }, 250);

  return () => clearTimeout(timer);
}, [searchValue]);

useEffect(() => {
  loadStatistics();
}, []);

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

    const response = await fetchRawStatistics(dateFilter);

    setStatsData(response);
  } catch (err) {
    console.error(err);
    setError("אירעה שגיאה בטעינת הנתונים");
  }
}, [dateFilter, fetchRawStatistics]);
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

    let hash = 0;

    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
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

  const stats = statsData?.stats || {};
  const logs = stats.logs || [];

  /**
   * ============================================================================
   * SORTED LOGS
   * ============================================================================
   */

  const sortedLogs = useMemo(() => {
    return [...logs].sort(
      (a, b) =>
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
    );
  }, [logs]);

  /**
   * ============================================================================
   * GROUPING HELPERS
   * ============================================================================
   */

  const exercisesMap = useMemo(() => {
    const map = new Map();

    sortedLogs.forEach((log) => {
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
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.appearances !== a.appearances) {
        return b.appearances - a.appearances;
      }

      return a.name.localeCompare(b.name, "he");
    });
  }, [sortedLogs]);

  const parametersMap = useMemo(() => {
    const map = new Map();

    sortedLogs.forEach((log) => {
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
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.appearances !== a.appearances) {
        return b.appearances - a.appearances;
      }

      return a.name.localeCompare(b.name, "he");
    });
  }, [sortedLogs]);

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

    const logsContainingParameter = sortedLogs.filter((log) =>
      log.params.some(
        (param) => param.parameter_name === selectedParameter.name
      )
    );

    const values = [];

    logsContainingParameter.forEach((log) => {
      const param = log.params.find(
        (p) => p.parameter_name === selectedParameter.name
      );

      if (param) {
        values.push(Number(param.value));
      }
    });

    const aggregate = aggregateParameterValues(
      values,
      selectedParameter.method
    );

    return {
      aggregate,
      average:
        values.reduce((acc, curr) => acc + curr, 0) /
        (values.length || 1),
      max: Math.max(...values),
      count: values.length,
      values,
      logs: logsContainingParameter,
    };
  }, [
    selectedParameter,
    sortedLogs,
    aggregateParameterValues,
  ]);

  /**
   * ============================================================================
   * PARAMETER BREAKDOWN
   * ============================================================================
   */

  const parameterExerciseBreakdown = useMemo(() => {
    if (!selectedParameter) return [];

    const map = new Map();

    sortedLogs.forEach((log) => {
      const param = log.params.find(
        (p) => p.parameter_name === selectedParameter.name
      );

      if (!param) return;

      if (!map.has(log.exercise_name)) {
        map.set(log.exercise_name, []);
      }

      map.get(log.exercise_name).push(Number(param.value));
    });

    const breakdown = Array.from(map.entries()).map(
      ([exerciseName, values]) => ({
        exerciseName,
        value: aggregateParameterValues(
          values,
          selectedParameter.method
        ),
        unit: selectedParameter.unit,
      })
    );

    const maxValue = Math.max(
      ...breakdown.map((item) => item.value)
    );

    return breakdown
      .map((item) => ({
        ...item,
        percentage: (item.value / maxValue) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [
    selectedParameter,
    sortedLogs,
    aggregateParameterValues,
  ]);

  /**
   * ============================================================================
   * PARAMETER TIMELINE
   * ============================================================================
   */

  const parameterTimelineData = useMemo(() => {
    if (!selectedParameter) return [];

    return buildTimelineDataset(
      sortedLogs.filter((log) =>
        log.params.some(
          (param) =>
            param.parameter_name === selectedParameter.name
        )
      ),
      (log, row) => {
        const param = log.params.find(
          (p) => p.parameter_name === selectedParameter.name
        );

        row[log.exercise_name] = Number(param.value);
      }
    );
  }, [
    selectedParameter,
    sortedLogs,
    buildTimelineDataset,
  ]);

  /**
   * ============================================================================
   * EXERCISE ANALYTICS
   * ============================================================================
   */

  const selectedExerciseData = useMemo(() => {
    if (!selectedExercise) return null;

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
    aggregateParameterValues,
  ]);

  /**
   * ============================================================================
   * EXERCISE CHART
   * ============================================================================
   */

  const exerciseTimelineData = useMemo(() => {
    if (!selectedExercise) return [];

    const exerciseLogs = sortedLogs.filter(
      (log) => log.exercise_id === selectedExercise.id
    );

    const rows = buildTimelineDataset(
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
  }, [
    selectedExercise,
    selectedExerciseData,
    sortedLogs,
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

        {loadingStats && <LoadingSkeleton />}

        {!loadingStats && (
          <>
            {!logs.length ? (
              <EmptyState />
            ) : (
              <>
                <OverviewCards stats={stats} formatNumber={formatNumber} />

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