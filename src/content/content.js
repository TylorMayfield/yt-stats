// @ts-check
// YouTube activity tracker content script

/** @type {Object} */
let currentVideoData = {
    videoId: null,
    title: null,
    startTime: null,
    channel: null,
    accumulatedTime: 0, // This will be in seconds
    lastPlayTime: null,
    playbackRate: 1,
    isShorts: null,
    duration: null,
    currentTime: null
};

let videoCheckInterval = null;
let updateInterval = null;
let videoObserver = null;

function extractVideoData() {
    const videoElement = document.querySelector('video');
    if (!videoElement) {
        console.log('[YT Stats] No video element found');
        return null;
    }

    let videoId, title, channel;
    const isShorts = window.location.pathname.startsWith('/shorts/');

    try {
        if (isShorts) {
            // Extract data from Shorts page
            videoId = window.location.pathname.split('/')[2];
            const container = document.querySelector('ytd-reel-video-renderer[is-active]');
            if (!container) {
                console.log('[YT Stats] No active shorts container found');
                return null;
            }
            title = container.querySelector('#video-title')?.textContent?.trim();
            channel = container.querySelector('#channel-name a')?.textContent?.trim();
        } else {
            // Extract data from regular video page
            videoId = new URLSearchParams(window.location.search).get('v');
            const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer');
            const channelElement = document.querySelector('ytd-channel-name yt-formatted-string a');
            
            if (!titleElement || !channelElement) {
                console.log('[YT Stats] Page elements not ready yet');
                return null;
            }
            
            title = titleElement.textContent?.trim();
            channel = channelElement.textContent?.trim();
        }

        if (!videoId || !title || !channel) {
            console.log('[YT Stats] Missing video data:', { videoId, title, channel });
            return null;
        }

        console.log('[YT Stats] Video data extracted:', { videoId, title, channel });
        return {
            videoId,
            title,
            channel,
            duration: Math.round(videoElement.duration),
            currentTime: Math.round(videoElement.currentTime),
            isShorts,
            playbackRate: videoElement.playbackRate
        };
    } catch (error) {
        console.error('[YT Stats] Error extracting video data:', error);
        return null;
    }
}

function updateWatchTime() {
    if (!currentVideoData.lastPlayTime) return;
    
    const now = Date.now();
    const elapsed = (now - currentVideoData.lastPlayTime) / 1000; // Convert to seconds
    currentVideoData.lastPlayTime = now;

    // Only count if elapsed time is reasonable (less than 1 second)
    if (elapsed > 0 && elapsed <= 1) {
        // Add elapsed time adjusted for playback rate, in seconds
        currentVideoData.accumulatedTime += elapsed * currentVideoData.playbackRate;

        console.log('[YT Stats] Updated watch time:', {
            elapsed,
            playbackRate: currentVideoData.playbackRate,
            accumulatedTime: currentVideoData.accumulatedTime,
            accumulatedTimeFormatted: formatTime(currentVideoData.accumulatedTime)
        });

        // Send update if we've accumulated enough time
        const minDuration = currentVideoData.isShorts ? 1 : 5;
        if (currentVideoData.accumulatedTime >= minDuration) {
            console.log('[YT Stats] Sending watch time update');
            chrome.runtime.sendMessage({
                type: 'VIDEO_UPDATE',
                data: {
                    ...currentVideoData,
                    watchDuration: Math.floor(currentVideoData.accumulatedTime), // Send as integer seconds
                    endTime: now
                }
            }, response => {
                if (chrome.runtime.lastError) {
                    console.error('[YT Stats] Error sending VIDEO_UPDATE:', chrome.runtime.lastError);
                }
            });
        }
    }
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

function handleVideoStateChange() {
    console.log('[YT Stats] Checking video state...');
    const videoData = extractVideoData();
    if (!videoData) return;

    const videoElement = document.querySelector('video');
    if (!videoElement) return;

    // Only start tracking if it's a new video
    if (!currentVideoData.startTime || currentVideoData.videoId !== videoData.videoId) {
        console.log('[YT Stats] New video detected');
        
        if (currentVideoData.startTime) {
            handleVideoEnd();
        }

        currentVideoData = {
            ...videoData,
            startTime: Date.now(),
            accumulatedTime: 0,
            lastPlayTime: videoElement.paused ? null : Date.now(),
            playbackRate: videoElement.playbackRate
        };

        // Set up video event listeners
        videoElement.addEventListener('play', handleVideoPlay);
        videoElement.addEventListener('pause', handleVideoPause);
        videoElement.addEventListener('ratechange', handlePlaybackRateChange);
        videoElement.addEventListener('seeking', handleVideoSeeking);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        console.log('[YT Stats] Video started:', currentVideoData);
        
        // Notify background script that video started
        chrome.runtime.sendMessage({
            type: 'VIDEO_START',
            data: currentVideoData
        }, response => {
            if (chrome.runtime.lastError) {
                console.error('[YT Stats] Error sending VIDEO_START:', chrome.runtime.lastError);
            }
        });
    }
}

function handleVideoPlay() {
    console.log('[YT Stats] Video played');
    currentVideoData.lastPlayTime = Date.now();
}

function handleVideoPause() {
    console.log('[YT Stats] Video paused');
    updateWatchTime();
    currentVideoData.lastPlayTime = null;
}

function handlePlaybackRateChange() {
    const videoElement = document.querySelector('video');
    if (videoElement) {
        console.log('[YT Stats] Playback rate changed:', videoElement.playbackRate);
        currentVideoData.playbackRate = videoElement.playbackRate;
    }
}

function handleVideoSeeking() {
    console.log('[YT Stats] Video seeking');
    if (currentVideoData.lastPlayTime) {
        updateWatchTime();
        currentVideoData.lastPlayTime = Date.now();
    }
}

function handleVisibilityChange() {
    if (document.hidden) {
        console.log('[YT Stats] Tab hidden');
        if (currentVideoData.lastPlayTime) {
            updateWatchTime();
            currentVideoData.lastPlayTime = null;
        }
    } else {
        console.log('[YT Stats] Tab visible');
        const videoElement = document.querySelector('video');
        if (videoElement && !videoElement.paused) {
            currentVideoData.lastPlayTime = Date.now();
        }
    }
}

function handleVideoEnd() {
    console.log('[YT Stats] Handling video end...');
    if (currentVideoData.startTime) {
        // Final update of accumulated time
        updateWatchTime();
        
        const endTime = Date.now();
        const minDuration = currentVideoData.isShorts ? 1 : 5;
        
        if (currentVideoData.accumulatedTime >= minDuration) {
            console.log('[YT Stats] Video ended:', {
                ...currentVideoData,
                endTime,
                watchDuration: Math.floor(currentVideoData.accumulatedTime),
                watchDurationFormatted: formatTime(currentVideoData.accumulatedTime)
            });

            chrome.runtime.sendMessage({
                type: 'VIDEO_END',
                data: {
                    ...currentVideoData,
                    watchDuration: Math.floor(currentVideoData.accumulatedTime),
                    endTime
                }
            }, response => {
                if (chrome.runtime.lastError) {
                    console.error('[YT Stats] Error sending VIDEO_END:', chrome.runtime.lastError);
                }
            });
        } else {
            console.log('[YT Stats] Video watched for too short:', currentVideoData.accumulatedTime);
        }

        // Clean up event listeners
        const videoElement = document.querySelector('video');
        if (videoElement) {
            videoElement.removeEventListener('play', handleVideoPlay);
            videoElement.removeEventListener('pause', handleVideoPause);
            videoElement.removeEventListener('ratechange', handlePlaybackRateChange);
            videoElement.removeEventListener('seeking', handleVideoSeeking);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);

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
            currentTime: null
        };
    }
}

function checkVideoState() {
    const videoElement = document.querySelector('video');
    if (videoElement) {
        handleVideoStateChange();
    }
}

function setupVideoObserver() {
    if (videoObserver) {
        videoObserver.disconnect();
    }

    videoObserver = new MutationObserver((mutations) => {
        const videoElement = document.querySelector('video');
        if (videoElement) {
            console.log('[YT Stats] Video element found via observer');
            videoObserver.disconnect();
            handleVideoStateChange();
        }
    });

    videoObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function setupVideoTracking() {
    console.log('[YT Stats] Setting up video tracking...');
    
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

// Listen for page navigation
document.addEventListener('yt-navigate-finish', () => {
    console.log('[YT Stats] Page navigation detected');
    setupVideoTracking();
});

// Initial setup
console.log('[YT Stats] Content script loaded');
setupVideoTracking();

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    console.log('[YT Stats] Page unloading');
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
