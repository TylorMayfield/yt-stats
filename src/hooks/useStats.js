import { useState, useEffect } from "react";
import { getStats, initDatabase } from "../services/database";

const DEFAULT_STATS = {
  totalWatchTime: 0,
  uniqueVideos: 0,
  topChannels: [],
  watchedVideos: {},
  lastUpdate: Date.now(),
};

export function useStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStats();
      setStats(data);
    } catch (err) {
      console.error("[YT Stats] Error loading stats:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearData = async () => {
    try {
      setLoading(true);
      await chrome.storage.local.clear();
      await initDatabase();
      await fetchStats();
    } catch (err) {
      console.error("[YT Stats] Error clearing data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = () => {
    fetchStats();
  };

  useEffect(() => {
    console.log("[YT Stats] Initializing stats hook");
    fetchStats();

    // Listen for storage changes
    const handleStorageChange = (changes, areaName) => {
      console.log("[YT Stats] Storage changed:", changes, areaName);
      if (areaName === "local") {
        fetchStats();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return {
    stats: stats || DEFAULT_STATS,
    loading,
    error,
    clearData,
    refreshStats,
  };
}
