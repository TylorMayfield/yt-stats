/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// @ts-check
// YouTube activity tracker content script

let currentVideoData = {
  videoId: null,
  title: null,
  startTime: null,
  channel: null,
  accumulatedTime: 0,
  lastPlayTime: null,
  playbackRate: 1,
  isShorts: null,
  duration: null,
  currentTime: null,
};

let videoCheckInterval = null;
let updateInterval = null;
let videoObserver = null;
let isInitialized = false;
let lastUpdateTime = null;

// Initialize tracking when script loads
initializeTracking();

function initializeTracking() {
  if (isInitialized) return;
  console.log("[YT Stats] Initializing video tracking...");

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setupVideoTracking();
    });
  } else {
    setupVideoTracking();
  }

  // Listen for page navigation
  document.addEventListener("yt-navigate-finish", handleNavigation);
  document.addEventListener("yt-page-data-updated", handleNavigation);

  // Listen for visibility changes
  document.addEventListener("visibilitychange", handleVisibilityChange);

  isInitialized = true;
}

function handleNavigation() {
  console.log("[YT Stats] Page navigation detected");
  // End current session if exists
  if (currentVideoData.startTime) {
    handleVideoEnd();
  }
  // Reset and setup new tracking
  setupVideoTracking();
}

function extractVideoData() {
  try {
    // Get video ID from URL
    const url = new URL(window.location.href);
    const videoId = url.searchParams.get("v");

    if (!videoId) {
      console.log("[YT Stats] No video ID found in URL");
      return null;
    }

    // Get video title
    const titleElement = document.querySelector(
      "h1.ytd-video-primary-info-renderer"
    );
    if (!titleElement) {
      console.log("[YT Stats] Title element not found");
      return null;
    }

    // Get channel name
    const channelElement = document.querySelector(
      "ytd-video-owner-renderer #channel-name a"
    );
    if (!channelElement) {
      console.log("[YT Stats] Channel element not found");
      return null;
    }

    const videoElement = document.querySelector("video");
    if (!videoElement) {
      console.log("[YT Stats] Video element not found");
      return null;
    }

    const data = {
      videoId,
      // @ts-ignore
      title: titleElement.textContent.trim(),
      // @ts-ignore
      channel: channelElement.textContent.trim(),
      isShorts: window.location.pathname.includes("/shorts/"),
      duration: videoElement.duration || 0,
      currentTime: videoElement.currentTime || 0,
    };

    console.log("[YT Stats] Extracted video data:", data);
    return data;
  } catch (error) {
    console.error("[YT Stats] Error extracting video data:", error);
    return null;
  }
}

function updateWatchTime() {
  const videoElement = document.querySelector("video");
  if (!videoElement || videoElement.paused || !currentVideoData.lastPlayTime) {
    return;
  }

  try {
    const now = Date.now();

    // Calculate elapsed time since last update
    const elapsed = (now - currentVideoData.lastPlayTime) / 1000; // Convert to seconds
    // @ts-ignore
    currentVideoData.lastPlayTime = now;

    // Only count if elapsed time is reasonable (less than 30 seconds to account for small delays)
    if (elapsed > 0 && elapsed < 30) {
      // Add elapsed time adjusted for playback rate
      const adjustedTime = elapsed * currentVideoData.playbackRate;
      currentVideoData.accumulatedTime += adjustedTime;

      // Update current video time
      // @ts-ignore
      currentVideoData.currentTime = videoElement.currentTime;

      // Send update if enough time has passed (5 seconds for regular videos, 1 second for shorts)
      const minDuration = currentVideoData.isShorts ? 1 : 5;
      const timeSinceLastUpdate = lastUpdateTime
        ? (now - lastUpdateTime) / 1000
        : minDuration;

      if (timeSinceLastUpdate >= minDuration) {
        console.log("[YT Stats] Sending watch time update:", {
          elapsed,
          adjustedTime,
          playbackRate: currentVideoData.playbackRate,
          accumulatedTime: currentVideoData.accumulatedTime,
          currentTime: currentVideoData.currentTime,
        });

        chrome.runtime.sendMessage(
          {
            type: "VIDEO_UPDATE",
            data: {
              ...currentVideoData,
              watchDuration: Math.floor(currentVideoData.accumulatedTime),
              endTime: now,
            },
          },
          handleMessageResponse
        );

        lastUpdateTime = now;
      }
    }
  } catch (error) {
    console.error("[YT Stats] Error updating watch time:", error);
  }
}

// @ts-ignore
function handleMessageResponse(response) {
  if (chrome.runtime.lastError) {
    console.error("[YT Stats] Message error:", chrome.runtime.lastError);
  }
}

function handleVideoStateChange() {
  console.log("[YT Stats] Checking video state...");
  const videoData = extractVideoData();
  if (!videoData) {
    console.log("[YT Stats] No valid video data found");
    return;
  }

  const videoElement = document.querySelector("video");
  if (!videoElement) {
    console.log("[YT Stats] No video element found");
    return;
  }

  // Only start tracking if it's a new video or if we don't have a startTime
  if (
    !currentVideoData.startTime ||
    currentVideoData.videoId !== videoData.videoId
  ) {
    console.log("[YT Stats] New video detected");

    if (currentVideoData.startTime) {
      handleVideoEnd();
    }

    // Clean up old event listeners first
    removeVideoEventListeners(videoElement);

    currentVideoData = {
      ...videoData,
      // @ts-ignore
      startTime: Date.now(),
      accumulatedTime: 0,
      // @ts-ignore
      lastPlayTime: videoElement.paused ? null : Date.now(),
      playbackRate: videoElement.playbackRate,
    };

    // Set up video event listeners
    addVideoEventListeners(videoElement);

    console.log("[YT Stats] Video started:", currentVideoData);

    chrome.runtime.sendMessage(
      {
        type: "VIDEO_START",
        data: currentVideoData,
      },
      handleMessageResponse
    );

    lastUpdateTime = null;
  } else if (!videoElement.paused && !currentVideoData.lastPlayTime) {
    // Video is playing but we're not tracking it
    console.log("[YT Stats] Resuming tracking of playing video");
    // @ts-ignore
    currentVideoData.lastPlayTime = Date.now();
    lastUpdateTime = null;
  }
}

function addVideoEventListeners(videoElement) {
  if (!videoElement) return;
  videoElement.addEventListener("play", handleVideoPlay);
  videoElement.addEventListener("pause", handleVideoPause);
  videoElement.addEventListener("ratechange", handlePlaybackRateChange);
  videoElement.addEventListener("seeking", handleVideoSeeking);
}

function removeVideoEventListeners(videoElement) {
  if (!videoElement) return;
  videoElement.removeEventListener("play", handleVideoPlay);
  videoElement.removeEventListener("pause", handleVideoPause);
  videoElement.removeEventListener("ratechange", handlePlaybackRateChange);
  videoElement.removeEventListener("seeking", handleVideoSeeking);
}

function handleVideoPlay() {
  console.log("[YT Stats] Video played");
  // @ts-ignore
  currentVideoData.lastPlayTime = Date.now();
}

function handleVideoPause() {
  console.log("[YT Stats] Video paused");
  updateWatchTime();
  currentVideoData.lastPlayTime = null;
}

function handlePlaybackRateChange() {
  const videoElement = document.querySelector("video");
  if (videoElement) {
    console.log("[YT Stats] Playback rate changed:", videoElement.playbackRate);
    currentVideoData.playbackRate = videoElement.playbackRate;
  }
}

function handleVideoSeeking() {
  console.log("[YT Stats] Video seeking");
  if (currentVideoData.lastPlayTime) {
    updateWatchTime();
    // @ts-ignore
    currentVideoData.lastPlayTime = Date.now();
  }
}

function handleVisibilityChange() {
  console.log("[YT Stats] Visibility changed:", document.visibilityState);
  const videoElement = document.querySelector("video");

  if (!videoElement || !currentVideoData.startTime) {
    return;
  }

  if (document.visibilityState === "hidden") {
    // Store the current time when going to background
    if (!videoElement.paused) {
      // @ts-ignore
      currentVideoData.lastPlayTime = Date.now();
    }
  } else {
    // Update accumulated time when coming back to foreground
    if (!videoElement.paused) {
      // @ts-ignore
      currentVideoData.lastPlayTime = Date.now();
      lastUpdateTime = null; // Force an immediate update
    }
  }
}

function handleVideoEnd() {
  console.log("[YT Stats] Handling video end...");
  if (currentVideoData.startTime) {
    // Final update of accumulated time
    updateWatchTime();

    const endTime = Date.now();
    const minDuration = currentVideoData.isShorts ? 1 : 5;

    if (currentVideoData.accumulatedTime >= minDuration) {
      console.log("[YT Stats] Video ended:", {
        ...currentVideoData,
        endTime,
        watchDuration: Math.floor(currentVideoData.accumulatedTime),
        watchDurationFormatted: formatTime(currentVideoData.accumulatedTime),
      });

      chrome.runtime.sendMessage(
        {
          type: "VIDEO_END",
          data: {
            ...currentVideoData,
            watchDuration: Math.floor(currentVideoData.accumulatedTime),
            endTime,
          },
        },
        handleMessageResponse
      );
    } else {
      console.log(
        "[YT Stats] Video watched for too short:",
        currentVideoData.accumulatedTime
      );
    }

    // Clean up event listeners
    const videoElement = document.querySelector("video");
    if (videoElement) {
      removeVideoEventListeners(videoElement);
    }
    document.removeEventListener("visibilitychange", handleVisibilityChange);

    // Reset current video data
    currentVideoData = {
      videoId: null,
      title: null,
      startTime: null,
      channel: null,
      accumulatedTime: 0,
      lastPlayTime: null,
      playbackRate: 1,
      isShorts: null,
      duration: null,
      currentTime: null,
    };
  }
}

function checkVideoState() {
  const videoElement = document.querySelector("video");
  if (videoElement) {
    console.log("[YT Stats] Video element found in check");
    handleVideoStateChange();
  }
}

function setupVideoObserver() {
  if (videoObserver) {
    videoObserver.disconnect();
  }

  // First try to find existing video
  const videoElement = document.querySelector("video");
  if (videoElement) {
    console.log("[YT Stats] Video element found immediately");
    handleVideoStateChange();
    return;
  }

  // Set up observer for video element
  videoObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Check added nodes for video element
      for (const node of mutation.addedNodes) {
        // @ts-ignore
        if (node.nodeName === "VIDEO" || node.querySelector?.("video")) {
          console.log("[YT Stats] Video element found via observer");
          videoObserver.disconnect();
          handleVideoStateChange();
          return;
        }
      }
    }
  });

  videoObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

function setupVideoTracking() {
  console.log("[YT Stats] Setting up video tracking...");

  // Clear any existing intervals and observers
  if (videoCheckInterval) {
    clearInterval(videoCheckInterval);
  }
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  if (videoObserver) {
    videoObserver.disconnect();
  }

  // End any existing session
  handleVideoEnd();

  // Set up new tracking
  videoCheckInterval = setInterval(checkVideoState, 2000); // Check every 2 seconds
  updateInterval = setInterval(updateWatchTime, 1000);
  setupVideoObserver(); // Add observer to catch video element early

  // Initial check
  checkVideoState();
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0m";

  seconds = Math.round(seconds);

  if (seconds < 60) return `${seconds}s`;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

// Cleanup on unload
window.addEventListener("beforeunload", () => {
  console.log("[YT Stats] Page unloading");
  if (videoCheckInterval) {
    clearInterval(videoCheckInterval);
  }
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  if (videoObserver) {
    videoObserver.disconnect();
  }
  handleVideoEnd();
});
