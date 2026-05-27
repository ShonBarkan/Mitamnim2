import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { statisticsService } from "../services/statisticsService";
import FrontendLogger from "../utils/logger";

export const StatisticsContext = createContext();

/**
 * =========================================================
 * DATE RANGE HELPER (single source of truth)
 * =========================================================
 */
const getDateRange = (period) => {
  const now = new Date();

  let startDate = new Date();
  let endDate = new Date();

  endDate.setHours(23, 59, 59, 999);

  switch (period) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;

    case "week": {
      const daysSinceSunday = now.getDay();
      startDate.setDate(now.getDate() - daysSinceSunday);
      startDate.setHours(0, 0, 0, 0);
      break;
    }

    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    default:
      // "all"
      startDate = new Date(0);
      endDate = new Date();
      break;
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

export const StatisticsProvider = ({ children }) => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  /**
   * =========================================================
   * DASHBOARD STATS
   * =========================================================
   */
  const fetchDashboardStats = useCallback(async (period = "today") => {
    setLoadingStats(true);

    try {
      const { startDate, endDate } = getDateRange(period);

      const data = await statisticsService.getDashboardStats(
        startDate,
        endDate
      );

      setDashboardStats(data);
      return data;
    } catch (error) {
      FrontendLogger.error(
        "STATISTICS_CONTEXT",
        "Error fetching dashboard stats",
        error
      );
      throw error;
    } finally {
      setLoadingStats(false);
    }
  }, []);

  /**
   * =========================================================
   * RAW STATS (ATHLETE / TRAINER)
   * =========================================================
   */
  const fetchRawStatistics = useCallback(
    async (period = "all", isTrainer = false, userIds = null) => {
      setLoadingStats(true);

      try {
        const { startDate, endDate } = getDateRange(period);

        let data;

        if (isTrainer) {
          data = await statisticsService.getGroupStatistics(
            startDate,
            endDate,
            userIds
          );
        } else {
          data = await statisticsService.getMyStatistics(
            startDate,
            endDate
          );
        }

        return data;
      } catch (error) {
        FrontendLogger.error(
          "STATISTICS_CONTEXT",
          "Error fetching raw statistics",
          error
        );
        throw error;
      } finally {
        setLoadingStats(false);
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      dashboardStats,
      loadingStats,
      fetchDashboardStats,
      fetchRawStatistics,
    }),
    [dashboardStats, loadingStats, fetchDashboardStats, fetchRawStatistics]
  );

  return (
    <StatisticsContext.Provider value={value}>
      {children}
    </StatisticsContext.Provider>
  );
};

export const useStatistics = () => {
  const context = useContext(StatisticsContext);

  if (!context) {
    throw new Error(
      "useStatistics must be consumed within a StatisticsProvider"
    );
  }

  return context;
};