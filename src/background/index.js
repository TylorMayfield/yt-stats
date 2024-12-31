// Clean up old stats periodically
chrome.alarms.create('cleanup', { periodInMinutes: 60 * 24 }); // Once per day

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    chrome.storage.local.get(['stats'], (result) => {
      if (!result.stats) return;

      const stats = result.stats;
      const now = Date.now();
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds

      // Keep only channels watched in the last 30 days
      stats.topChannels = stats.topChannels.filter(channel => {
        return channel.lastUpdate > thirtyDaysAgo;
      });

      // Reset stats if they're too old
      if (stats.lastUpdate < thirtyDaysAgo) {
        stats.totalWatchTime = 0;
        stats.uniqueVideos = 0;
        stats.watchedVideos = new Set();
      }

      // Update last update time
      stats.lastUpdate = now;

      // Save cleaned up stats
      chrome.storage.local.set({ stats });
    });
  }
});

// Handle extension installation or update
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['stats'], (result) => {
    if (!result.stats) {
      // Initialize stats object
      chrome.storage.local.set({
        stats: {
          totalWatchTime: 0,
          uniqueVideos: 0,
          topChannels: [],
          watchedVideos: new Set(),
          lastUpdate: Date.now(),
        }
      });
    }
  });
});
