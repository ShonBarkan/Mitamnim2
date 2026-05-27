import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import {
  Calendar,
  Dumbbell,
  Activity,
  Search,
  BarChart3,
  TrendingUp,
  Loader2,
  RefreshCcw,
  Eye,
  EyeOff,
} from "lucide-react";

import { useStatistics } from "../contexts/StatisticsContext";

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

  /**
   * ============================================================================
   * RENDER HELPERS
   * ============================================================================
   */

  const renderLoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 rounded-3xl bg-zinc-800/60" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="h-36 rounded-3xl bg-zinc-800/60" />
        <div className="h-36 rounded-3xl bg-zinc-800/60" />
      </div>

      <div className="h-[420px] rounded-3xl bg-zinc-800/60" />
    </div>
  );

  /**
   * ============================================================================
   * ERROR STATE
   * ============================================================================
   */

  if (error) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#09090B] text-white p-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-10 text-center">
            <div className="flex justify-center mb-5">
              <RefreshCcw className="w-10 h-10 text-red-400" />
            </div>

            <h2 className="text-2xl font-bold mb-3">
              שגיאה בטעינת הנתונים
            </h2>

            <p className="text-zinc-300 mb-6">
              לא הצלחנו לטעון את הסטטיסטיקות כרגע
            </p>

            <button
              onClick={loadStatistics}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-500 hover:bg-red-400 transition-all px-6 py-3 font-semibold"
            >
              <RefreshCcw className="w-4 h-4" />
              נסה שוב
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ============================================================================
   * MAIN RENDER
   * ============================================================================
   */

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#09090B] text-white"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* ========================================================================= */}
        {/* HEADER */}
        {/* ========================================================================= */}

        <div className="rounded-[32px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-6 md:p-10 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-6 justify-between">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-green-500/15 border border-green-500/20 flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-green-400" />
                </div>

                <div>
                  <h1 className="text-3xl text-white md:text-5xl font-black tracking-tight">
                    סטטיסטיקות אימונים
                  </h1>

                  <p className="text-zinc-400 mt-2 text-sm md:text-base">
                    מעקב ביצועים, נפחים והתקדמות לאורך זמן
                  </p>
                </div>
              </div>

              {statsData?.first_name && (
                <div className="flex items-center gap-4 mt-6">
                  <img
                    src={statsData.profile_picture}
                    alt={statsData.first_name}
                    className="w-14 h-14 rounded-2xl object-cover border border-zinc-700"
                  />

                  <div>
                    <div className="font-bold text-lg">
                      {statsData.first_name}{" "}
                      {statsData.second_name}
                    </div>

                    <div className="text-zinc-400 text-sm">
                      פלטפורמת אנליטיקות אתלט
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* FILTERS */}
            {/* ========================================================================= */}

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-3">
                {[
                  { key: "all", label: "הכל" },
                  { key: "today", label: "היום" },
                  { key: "week", label: "השבוע" },
                  { key: "month", label: "החודש" },
                ].map((filter) => {
                  const active = dateFilter === filter.key;

                  return (
                    <button
                      key={filter.key}
                      disabled={loadingStats}
                      onClick={() => setDateFilter(filter.key)}
                      className={`
                        px-5 py-3 rounded-2xl transition-all duration-200 font-semibold border
                        ${
                          active
                            ? "bg-green-500 text-black border-green-400 shadow-lg shadow-green-500/20"
                            : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800"
                        }
                        disabled:opacity-50
                      `}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {loadingStats && renderLoadingSkeleton()}

        {!loadingStats && (
          <>
            {/* ========================================================================= */}
            {/* EMPTY */}
            {/* ========================================================================= */}

            {!logs.length ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-16 text-center">
                <Activity className="mx-auto w-14 h-14 text-zinc-500 mb-5" />

                <h3 className="text-2xl font-bold mb-3">
                  אין נתונים בטווח הזמן שנבחר
                </h3>

                <p className="text-zinc-400">
                  נסה לבחור טווח תאריכים אחר
                </p>
              </div>
            ) : (
              <>
                {/* ========================================================================= */}
                {/* OVERVIEW CARDS */}
                {/* ========================================================================= */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-6 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />

                    <div className="relative">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <div className="text-zinc-400 mb-2">
                            סה״כ אימונים
                          </div>

                          <div className="text-5xl font-black">
                            {formatNumber(
                              stats.total_sessions || 0
                            )}
                          </div>
                        </div>

                        <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center">
                          <Dumbbell className="w-8 h-8 text-green-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-6 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />

                    <div className="relative">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <div className="text-zinc-400 mb-2">
                            סה״כ דקות אימון
                          </div>

                          <div className="text-5xl font-black">
                            {formatNumber(
                              stats.total_duration_minutes || 0
                            )}
                          </div>
                        </div>

                        <div className="w-16 h-16 rounded-2xl bg-blue-500/15 flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-blue-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* MODE TABS */}
                {/* ========================================================================= */}

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setAnalyticsMode("parameters");
                      setSelectedExercise(null);
                    }}
                    className={`
                      rounded-3xl border p-5 text-lg font-bold transition-all
                      ${
                        analyticsMode === "parameters"
                          ? "bg-green-500 text-black border-green-400"
                          : "bg-zinc-900/70 border-zinc-800 hover:bg-zinc-800"
                      }
                    `}
                  >
                    פרמטרים
                  </button>

                  <button
                    onClick={() => {
                      setAnalyticsMode("exercises");
                      setSelectedParameter(null);
                    }}
                    className={`
                      rounded-3xl border p-5 text-lg font-bold transition-all
                      ${
                        analyticsMode === "exercises"
                          ? "bg-green-500 text-black border-green-400"
                          : "bg-zinc-900/70 border-zinc-800 hover:bg-zinc-800"
                      }
                    `}
                  >
                    תרגילים
                  </button>
                </div>

                {/* ========================================================================= */}
                {/* SEARCH PANEL */}
                {/* ========================================================================= */}

                <div className="rounded-[30px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-5">
                  <div className="relative mb-5">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />

                    <input
                      aria-label="search"
                      type="text"
                      value={searchValue}
                      onChange={(e) =>
                        setSearchValue(e.target.value)
                      }
                      placeholder={
                        analyticsMode === "parameters"
                          ? "חפש פרמטר..."
                          : "חפש תרגיל..."
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-green-500 transition-all"
                    />
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {!filteredSearchResults.length ? (
                      <div className="text-center py-12 text-zinc-400">
                        לא נמצאו תוצאות
                      </div>
                    ) : analyticsMode === "parameters" ? (
                      filteredSearchResults.map((parameter) => {
                        const active =
                          selectedParameter?.id === parameter.id;

                        return (
                          <button
                            key={parameter.id}
                            onClick={() =>
                              handleParameterSelect(parameter)
                            }
                            className={`
                              w-full rounded-2xl border p-4 transition-all text-right
                              ${
                                active
                                  ? "border-green-500 bg-green-500/10"
                                  : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700"
                              }
                            `}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="font-bold text-lg">
                                  {parameter.name}
                                </div>

                                <div className="text-sm text-zinc-400 mt-1">
                                  {parameter.unit}
                                </div>
                              </div>

                              <div className="text-sm text-zinc-400">
                                {parameter.appearances} מופעים
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      filteredSearchResults.map((exercise) => {
                        const active =
                          selectedExercise?.id === exercise.id;

                        return (
                          <button
                            key={exercise.id}
                            onClick={() =>
                              handleExerciseSelect(exercise)
                            }
                            className={`
                              w-full rounded-2xl border p-4 transition-all text-right
                              ${
                                active
                                  ? "border-green-500 bg-green-500/10"
                                  : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700"
                              }
                            `}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="font-bold text-lg">
                                  {exercise.name}
                                </div>

                                <div className="flex flex-wrap gap-2 mt-3">
                                  {exercise.tags?.map((tag) => (
                                    <div
                                      key={tag.id}
                                      className="px-3 py-1 rounded-full text-xs font-semibold"
                                      style={{
                                        backgroundColor: `${tag.color}20`,
                                        border: `1px solid ${tag.color}50`,
                                        color: tag.color,
                                      }}
                                    >
                                      {tag.name}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="text-sm text-zinc-400">
                                {exercise.appearances} מופעים
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* EMPTY SELECTION */}
                {/* ========================================================================= */}

                {analyticsMode === "parameters" &&
                  !selectedParameter && (
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-14 text-center">
                      <TrendingUp className="mx-auto w-14 h-14 text-zinc-500 mb-5" />

                      <h3 className="text-2xl font-bold">
                        בחר תרגיל או פרמטר כדי להתחיל
                      </h3>
                    </div>
                  )}

                {analyticsMode === "exercises" &&
                  !selectedExercise && (
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-14 text-center">
                      <TrendingUp className="mx-auto w-14 h-14 text-zinc-500 mb-5" />

                      <h3 className="text-2xl font-bold">
                        בחר תרגיל או פרמטר כדי להתחיל
                      </h3>
                    </div>
                  )}

                {/* ========================================================================= */}
                {/* PARAMETERS MODE */}
                {/* ========================================================================= */}

                {analyticsMode === "parameters" &&
                  selectedParameter &&
                  selectedParameterData && (
                    <div className="space-y-8">
                      {/* HERO */}

                      <div className="rounded-[32px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-8 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />

                        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                          <div>
                            <div className="text-zinc-400 mb-3">
                              {selectedParameter.name}
                            </div>

                            <div className="text-5xl md:text-7xl font-black">
                              {formatNumber(
                                selectedParameterData.aggregate
                              )}{" "}
                              <span className="text-3xl text-zinc-400">
                                {selectedParameter.unit}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800 p-5">
                              <div className="text-zinc-500 text-sm mb-2">
                                מדידות
                              </div>

                              <div className="text-2xl font-black">
                                {selectedParameterData.count}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800 p-5">
                              <div className="text-zinc-500 text-sm mb-2">
                                ממוצע
                              </div>

                              <div className="text-2xl font-black">
                                {formatNumber(
                                  selectedParameterData.average
                                )}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800 p-5">
                              <div className="text-zinc-500 text-sm mb-2">
                                מקסימום
                              </div>

                              <div className="text-2xl font-black">
                                {formatNumber(
                                  selectedParameterData.max
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* BREAKDOWN */}

                      <div className="space-y-4">
                        <h2 className="text-2xl text-white font-black">
                          פילוח לפי תרגיל
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {parameterExerciseBreakdown.map((item) => (
                            <div
                              key={item.exerciseName}
                              className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5"
                            >
                              <div className="flex justify-between items-center mb-5">
                                <div className="font-bold text-lg">
                                  {item.exerciseName}
                                </div>

                                <div className="font-black text-2xl">
                                  {formatNumber(item.value)}{" "}
                                  <span className="text-zinc-400 text-base">
                                    {item.unit}
                                  </span>
                                </div>
                              </div>

                              <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-l from-green-400 to-green-600"
                                  style={{
                                    width: `${item.percentage}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CHART */}

                      <div className="rounded-[32px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                          <div>
                            <h2 className="text-2xl font-black mb-2">
                              ציר זמן
                            </h2>

                            <p className="text-zinc-400">
                              התקדמות לאורך זמן לפי תרגילים
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {parameterExerciseBreakdown.map((item) => {
                              const visible =
                                visibleExercises[
                                  item.exerciseName
                                ];

                              return (
                                <button
                                  key={item.exerciseName}
                                  onClick={() =>
                                    setVisibleExercises((prev) => ({
                                      ...prev,
                                      [item.exerciseName]:
                                        !prev[
                                          item.exerciseName
                                        ],
                                    }))
                                  }
                                  className={`
                                    flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all
                                    ${
                                      visible
                                        ? "bg-green-500/15 border-green-500/30"
                                        : "bg-zinc-950 border-zinc-800"
                                    }
                                  `}
                                >
                                  {visible ? (
                                    <Eye className="w-4 h-4" />
                                  ) : (
                                    <EyeOff className="w-4 h-4" />
                                  )}

                                  {item.exerciseName}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="h-[420px] w-full">
                          <ResponsiveContainer>
                            <LineChart
                              data={parameterTimelineData}
                              margin={{
                                top: 20,
                                right: 20,
                                left: 20,
                                bottom: 20,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#27272a"
                              />

                              <XAxis
                                dataKey="date"
                                stroke="#a1a1aa"
                                tick={{ fill: "#a1a1aa" }}
                              />

                              <YAxis
                                stroke="#a1a1aa"
                                tick={{ fill: "#a1a1aa" }}
                              />

                              <Tooltip
                                contentStyle={{
                                  background: "#18181b",
                                  border:
                                    "1px solid #27272a",
                                  borderRadius: 16,
                                }}
                              />

                              <Legend />

                              {parameterExerciseBreakdown.map(
                                (item) => {
                                  if (
                                    !visibleExercises[
                                      item.exerciseName
                                    ]
                                  ) {
                                    return null;
                                  }

                                  return (
                                    <Line
                                      key={item.exerciseName}
                                      type="monotone"
                                      dataKey={
                                        item.exerciseName
                                      }
                                      stroke={generateStableColor(
                                        item.exerciseName
                                      )}
                                      strokeWidth={3}
                                      dot={false}
                                      activeDot={{
                                        r: 6,
                                      }}
                                      animationDuration={500}
                                    />
                                  );
                                }
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}

                {/* ========================================================================= */}
                {/* EXERCISES MODE */}
                {/* ========================================================================= */}

                {analyticsMode === "exercises" &&
                  selectedExercise &&
                  selectedExerciseData && (
                    <div className="space-y-8">
                      {/* PARAMETER CARDS */}

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {selectedExerciseData.map((param) => (
                          <div
                            key={param.name}
                            className="rounded-[28px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-6"
                          >
                            <div className="flex items-start justify-between mb-6">
                              <div>
                                <div className="text-zinc-400 mb-2">
                                  {param.name}
                                </div>

                                <div className="text-4xl font-black">
                                  {formatNumber(
                                    param.aggregate
                                  )}
                                </div>
                              </div>

                              <div className="text-xs px-3 py-2 rounded-full border border-zinc-700 bg-zinc-950 text-zinc-300">
                                {param.method}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm text-zinc-400 mb-5">
                              <span>{param.unit}</span>

                              <span>
                                max:{" "}
                                {formatNumber(param.max)}
                              </span>
                            </div>

                            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-l from-blue-400 to-cyan-400"
                                style={{
                                  width: `${Math.min(
                                    param.avg,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* CHART */}

                      <div className="rounded-[32px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-6">
                        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-8">
                          <div>
                            <h2 className="text-2xl font-black mb-2">
                              גרף התקדמות
                            </h2>

                            <p className="text-zinc-400">
                              מעקב פרמטרים לאורך זמן
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              onClick={() =>
                                setNormalizeChart((prev) => !prev)
                              }
                              className={`
                                px-5 py-3 rounded-2xl border transition-all font-semibold
                                ${
                                  normalizeChart
                                    ? "bg-blue-500 text-black border-blue-400"
                                    : "bg-zinc-950 border-zinc-800"
                                }
                              `}
                            >
                              נרמל ערכים
                            </button>

                            {selectedExerciseData.map((param) => {
                              const visible =
                                visibleParameters[param.name];

                              return (
                                <button
                                  key={param.name}
                                  onClick={() =>
                                    setVisibleParameters(
                                      (prev) => ({
                                        ...prev,
                                        [param.name]:
                                          !prev[param.name],
                                      })
                                    )
                                  }
                                  className={`
                                    flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all
                                    ${
                                      visible
                                        ? "bg-green-500/15 border-green-500/30"
                                        : "bg-zinc-950 border-zinc-800"
                                    }
                                  `}
                                >
                                  {visible ? (
                                    <Eye className="w-4 h-4" />
                                  ) : (
                                    <EyeOff className="w-4 h-4" />
                                  )}

                                  {param.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="h-[460px]">
                          <ResponsiveContainer>
                            <LineChart
                              data={exerciseTimelineData}
                              margin={{
                                top: 20,
                                right: 20,
                                left: 20,
                                bottom: 20,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#27272a"
                              />

                              <XAxis
                                dataKey="date"
                                stroke="#a1a1aa"
                                tick={{ fill: "#a1a1aa" }}
                              />

                              <YAxis
                                stroke="#a1a1aa"
                                tick={{ fill: "#a1a1aa" }}
                              />

                              <Tooltip
                                contentStyle={{
                                  background: "#18181b",
                                  border:
                                    "1px solid #27272a",
                                  borderRadius: 16,
                                }}
                              />

                              <Legend />

                              {selectedExerciseData.map(
                                (param) => {
                                  if (
                                    !visibleParameters[
                                      param.name
                                    ]
                                  ) {
                                    return null;
                                  }

                                  return (
                                    <Line
                                      key={param.name}
                                      type="monotone"
                                      dataKey={param.name}
                                      stroke={generateStableColor(
                                        param.name
                                      )}
                                      strokeWidth={3}
                                      dot={false}
                                      activeDot={{
                                        r: 6,
                                      }}
                                      animationDuration={500}
                                    />
                                  );
                                }
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
              </>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* LOADING OVERLAY */}
        {/* ========================================================================= */}

        {loadingStats && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="rounded-3xl bg-zinc-900 border border-zinc-800 px-8 py-6 flex items-center gap-4 shadow-2xl">
              <Loader2 className="w-6 h-6 animate-spin text-green-400" />

              <div className="font-semibold">
                טוען נתוני אנליטיקות...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AthleteStatsPage;