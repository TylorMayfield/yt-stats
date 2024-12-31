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
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log("[YT Stats Background] Received message:", message);

  switch (message.type) {
    case "VIDEO_START":
      try {
        await handleVideoStart(message.data);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      break;

    case "VIDEO_END":
      try {
        await handleVideoEnd(message.data);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      break;

    case "VIDEO_UPDATE":
      try {
        await handleVideoUpdate(message.data);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      break;

    case "GET_STATS":
      try {
        const stats = await getWatchTimeStats();
        sendResponse(stats);
      } catch (error) {
        sendResponse({ error: error.message });
      }
      break;

    case "getActiveTimers":
      sendResponse(activeTimers);
      break;

    case "setSkipActiveTab":
      skipActiveTab = message.value;
      chrome.storage.local.set({ skipActiveTab });
      sendResponse({ success: true });
      break;

    case "getSkipActiveTab":
      chrome.storage.local.get("skipActiveTab", (result) => {
        sendResponse(result.skipActiveTab || false);
      });
      break;

    case "setInterval":
      try {
        await startTimer(message.tabId, message.interval);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      break;

    case "removeTimer":
      if (activeTimers[message.tabId]) {
        clearInterval(activeTimers[message.tabId].timerId);
        delete activeTimers[message.tabId];
        chrome.storage.local.set({ activeTimers });
        broadcastTimerUpdate();
        sendResponse({ success: true });
      }
      break;

    case "pause":
      if (activeTimers[message.tabId]) {
        clearInterval(activeTimers[message.tabId].timerId);
        activeTimers[message.tabId].isPaused = true;
        chrome.storage.local.set({ activeTimers });
        broadcastTimerUpdate();
        sendResponse({ success: true });
      }
      break;

    case "resume":
      if (activeTimers[message.tabId]) {
        startTimer(message.tabId, activeTimers[message.tabId].interval);
        sendResponse({ success: true });
      }
      break;

    default:
      sendResponse({ success: false, error: "Unknown message type" });
      break;
  }

  return true; // Keep the message channel open for async response
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

    chrome.storage.local.set({ activeTimers });
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
    chrome.storage.local.set({ activeTimers });
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
