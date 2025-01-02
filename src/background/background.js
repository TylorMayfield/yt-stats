import {
  initDatabase,
  storeVideo,
  storeSession,
  getStats,
} from "../services/database";

console.log("[YT Stats Background] Background script loaded");

let initialized = false;

async function initialize() {
  if (initialized) return;

  try {
    await initDatabase();
    initialized = true;
    console.log("[YT Stats Background] Initialization complete");
  } catch (error) {
    console.error("[YT Stats Background] Initialization failed:", error);
    throw error;
  }
}

// Initialize when extension is installed/updated
chrome.runtime.onInstalled.addListener(async () => {
  console.log("[YT Stats Background] Extension installed/updated");
  try {
    await initialize();
  } catch (error) {
    console.error("[YT Stats Background] Error during installation:", error);
  }
});

let skipActiveTab = false;
let activeTimers = {};

// Main listener for all runtime messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[YT Stats Background] Received message:", message);

  // Handle async operations
  const handleAsync = async () => {
    try {
      switch (message.type) {
        case "VIDEO_START":
          await handleVideoStart(message.data);
          return { success: true };

        case "VIDEO_END":
          await handleVideoEnd(message.data);
          return { success: true };

        case "VIDEO_UPDATE":
          await handleVideoUpdate(message.data);
          return { success: true };

        case "GET_STATS":
          return await getWatchTimeStats();

        case "getActiveTimers":
          return activeTimers;

        case "setSkipActiveTab":
          skipActiveTab = message.value;
          await chrome.storage.local.set({ skipActiveTab });
          return { success: true };

        case "getSkipActiveTab":
          const result = await chrome.storage.local.get("skipActiveTab");
          return result.skipActiveTab || false;

        case "setInterval":
          await startTimer(message.tabId, message.interval);
          return { success: true };

        case "removeTimer":
          if (activeTimers[message.tabId]) {
            clearInterval(activeTimers[message.tabId].timerId);
            delete activeTimers[message.tabId];
            await chrome.storage.local.set({ activeTimers });
            broadcastTimerUpdate();
            return { success: true };
          }

        case "pause":
          if (activeTimers[message.tabId]) {
            clearInterval(activeTimers[message.tabId].timerId);
            activeTimers[message.tabId].isPaused = true;
            await chrome.storage.local.set({ activeTimers });
            broadcastTimerUpdate();
            return { success: true };
          }

        case "resume":
          if (activeTimers[message.tabId]) {
            startTimer(message.tabId, activeTimers[message.tabId].interval);
            return { success: true };
          }

        default:
          console.warn("[YT Stats Background] Unknown message type:", message.type);
          return { success: false, error: "Unknown message type" };
      }
    } catch (error) {
      console.error("[YT Stats Background] Error handling message:", error);
      return { success: false, error: error.message };
    }
  };

  // Process async operation and send response
  handleAsync().then(sendResponse);

  // Return true to indicate we'll send response asynchronously
  return true;
});

async function handleVideoStart(data) {
  await initialize();

  const { videoId, title, channel } = data;
  console.log("[YT Stats Background] Storing video info:", {
    videoId,
    title,
    channel,
  });

  try {
    await storeVideo({ videoId, title, channel });
  } catch (error) {
    console.error("[YT Stats Background] Error in handleVideoStart:", error);
    throw error;
  }
}

async function handleVideoUpdate(data) {
  await initialize();

  const { videoId, startTime, endTime, watchDuration, isShorts } = data;
  console.log("[YT Stats Background] Storing session update:", {
    videoId,
    startTime,
    endTime,
    watchDuration,
    isShorts,
  });

  try {
    await storeSession({
      videoId,
      startTime,
      endTime,
      duration: watchDuration,
    });
  } catch (error) {
    console.error("[YT Stats Background] Error in handleVideoUpdate:", error);
    throw error;
  }
}

async function handleVideoEnd(data) {
  await initialize();

  const { videoId, startTime, endTime, watchDuration, isShorts } = data;
  console.log("[YT Stats Background] Storing final session:", {
    videoId,
    startTime,
    endTime,
    watchDuration,
    isShorts,
  });

  try {
    await storeSession({
      videoId,
      startTime,
      endTime,
      duration: watchDuration,
    });
  } catch (error) {
    console.error("[YT Stats Background] Error in handleVideoEnd:", error);
    throw error;
  }
}

async function getWatchTimeStats() {
  await initialize();

  try {
    return await getStats();
  } catch (error) {
    console.error("[YT Stats Background] Error in getWatchTimeStats:", error);
    throw error;
  }
}

const startTimer = async (tabId, interval) => {
  if (activeTimers[tabId]) {
    clearInterval(activeTimers[tabId].timerId);
  }

  try {
    const tab = await chrome.tabs.get(tabId);

    activeTimers[tabId] = {
      interval,
      lastRefresh: Date.now(),
      timerId: setInterval(() => refreshTab(tabId), interval * 1000),
      title: tab.title,
      favIconUrl: tab.favIconUrl,
      url: tab.url,
    };

    await chrome.storage.local.set({ activeTimers });
    broadcastTimerUpdate();
  } catch (error) {
    console.error("Error starting timer:", error);
  }
};

const refreshTab = async (tabId) => {
  if (skipActiveTab) {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (activeTab && activeTab.id === tabId) {
      return;
    }
  }
  chrome.tabs.reload(tabId);
  if (activeTimers[tabId]) {
    activeTimers[tabId].lastRefresh = Date.now();
    await chrome.storage.local.set({ activeTimers });
    broadcastTimerUpdate();
  }
};

const broadcastTimerUpdate = () => {
  chrome.runtime.sendMessage({
    action: "timerUpdate",
    timers: activeTimers,
  });
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (activeTimers[tabId] && (changeInfo.title || changeInfo.favIconUrl)) {
    activeTimers[tabId].title = tab.title;
    activeTimers[tabId].favIconUrl = tab.favIconUrl;
    chrome.storage.local.set({ activeTimers });
    broadcastTimerUpdate();
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTimers[tabId]) {
    clearInterval(activeTimers[tabId].timerId);
    delete activeTimers[tabId];
    chrome.storage.local.set({ activeTimers });
    broadcastTimerUpdate();
  }
});
