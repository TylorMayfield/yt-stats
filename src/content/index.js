console.log('[YT Stats] Content script loaded');

// Track video watching time
let startTime = null;
let currentVideoId = null;

// Default stats object
const DEFAULT_STATS = {
  totalWatchTime: 0,
  uniqueVideos: 0,
  topChannels: [],
  watchedVideos: [],
  lastUpdate: Date.now(),
};

// Save watch time to storage
function saveWatchTime() {
  if (!startTime || !currentVideoId) {
    console.log('[YT Stats] No watch time to save');
    return;
  }

  const watchTime = Math.floor((Date.now() - startTime) / 1000); // Convert to seconds
  if (watchTime < 1) {
    console.log('[YT Stats] Watch time too short:', watchTime);
    return;
  }

  console.log('[YT Stats] Saving watch time:', watchTime, 'seconds');
  
  chrome.storage.local.get(['stats'], (result) => {
    console.log('[YT Stats] Current stats:', result.stats);
    
    let stats = result.stats || DEFAULT_STATS;

    // Update total watch time
    stats.totalWatchTime += watchTime;

    // Update unique videos
    if (!stats.watchedVideos.includes(currentVideoId)) {
      stats.watchedVideos.push(currentVideoId);
      stats.uniqueVideos++;
    }

    // Update channel stats
    const channelName = document.querySelector('#owner #channel-name a')?.textContent?.trim();
    if (channelName) {
      console.log('[YT Stats] Updating channel:', channelName);
      
      const channel = stats.topChannels.find(c => c.name === channelName);
      if (channel) {
        channel.watchTime += watchTime;
        channel.videoCount++;
      } else {
        stats.topChannels.push({
          name: channelName,
          watchTime,
          videoCount: 1,
        });
      }

      // Sort channels by watch time
      stats.topChannels.sort((a, b) => b.watchTime - a.watchTime);
    }

    // Update timestamp
    stats.lastUpdate = Date.now();

    // Save updated stats
    chrome.storage.local.set({ stats }, () => {
      if (chrome.runtime.lastError) {
        console.error('[YT Stats] Error saving stats:', chrome.runtime.lastError);
      } else {
        console.log('[YT Stats] Stats saved successfully:', stats);
        startTime = null; // Reset start time only after successful save
      }
    });
  });
}

// Handle video state
function handleVideoStateChange() {
  const video = document.querySelector('video');
  if (!video) return;

  const videoId = new URLSearchParams(window.location.search).get('v');
  if (!videoId) return;

  console.log('[YT Stats] Video detected:', videoId);

  // Remove existing listeners
  video.removeEventListener('play', handlePlay);
  video.removeEventListener('pause', handlePause);
  video.removeEventListener('ended', handleEnded);

  // Add new listeners
  video.addEventListener('play', handlePlay);
  video.addEventListener('pause', handlePause);
  video.addEventListener('ended', handleEnded);

  currentVideoId = videoId;
}

function handlePlay() {
  console.log('[YT Stats] Video started');
  startTime = Date.now();
}

function handlePause() {
  console.log('[YT Stats] Video paused');
  saveWatchTime();
}

function handleEnded() {
  console.log('[YT Stats] Video ended');
  saveWatchTime();
}

// Initialize
function init() {
  console.log('[YT Stats] Initializing tracker');

  // Initialize stats if they don't exist
  chrome.storage.local.get(['stats'], (result) => {
    if (!result.stats) {
      console.log('[YT Stats] Creating initial stats');
      chrome.storage.local.set({ stats: DEFAULT_STATS });
    }
  });

  // Set up video tracking
  if (window.location.pathname === '/watch') {
    handleVideoStateChange();
  }
}

// Handle navigation
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    console.log('[YT Stats] URL changed:', url);
    lastUrl = url;
    saveWatchTime();
    startTime = null;
    currentVideoId = null;
    
    if (url.includes('/watch')) {
      setTimeout(handleVideoStateChange, 1000); // Wait for video to load
    }
  }
}).observe(document, { subtree: true, childList: true });

// Start tracking
init();
