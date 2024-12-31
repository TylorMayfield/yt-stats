const STORAGE_KEY = 'yt_stats_data';

const DEFAULT_DATA = {
    videos: {},     // videoId -> { title, channel, firstWatched }
    sessions: [],   // Array of { videoId, startTime, endTime, duration }
    lastUpdate: Date.now()
};

export async function initDatabase() {
    console.log('[YT Stats DB] Initializing storage...');
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            if (!result[STORAGE_KEY]) {
                chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_DATA });
                console.log('[YT Stats DB] Initialized with default data');
            } else {
                console.log('[YT Stats DB] Found existing data');
            }
            resolve();
        });
    });
}

export async function storeVideo(videoData) {
    const { videoId, title, channel } = videoData;
    
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            const data = result[STORAGE_KEY] || DEFAULT_DATA;
            
            // Only store if video doesn't exist or has different title/channel
            if (!data.videos[videoId] || 
                data.videos[videoId].title !== title || 
                data.videos[videoId].channel !== channel) {
                
                data.videos[videoId] = {
                    title,
                    channel,
                    firstWatched: Date.now()
                };
                
                chrome.storage.local.set({ [STORAGE_KEY]: data });
                console.log('[YT Stats DB] Video stored:', videoData);
            }
            
            resolve();
        });
    });
}

export async function storeSession(sessionData) {
    const { videoId, startTime, endTime, duration } = sessionData;
    
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            const data = result[STORAGE_KEY] || DEFAULT_DATA;
            
            data.sessions.push({
                videoId,
                startTime,
                endTime,
                duration
            });
            
            data.lastUpdate = Date.now();
            
            chrome.storage.local.set({ [STORAGE_KEY]: data });
            console.log('[YT Stats DB] Session stored:', sessionData);
            
            resolve();
        });
    });
}

export async function getStats() {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            const data = result[STORAGE_KEY] || DEFAULT_DATA;
            
            // Calculate total watch time and unique videos
            const totalWatchTime = data.sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
            const uniqueVideos = Object.keys(data.videos).length;
            
            // Calculate channel stats
            const channelStats = {};
            Object.entries(data.videos).forEach(([videoId, video]) => {
                const channel = video.channel;
                const sessions = data.sessions.filter(s => s.videoId === videoId);
                const watchTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
                
                if (!channelStats[channel]) {
                    channelStats[channel] = {
                        name: channel,
                        watchTime: 0,
                        videos: new Set()
                    };
                }
                
                channelStats[channel].watchTime += watchTime;
                channelStats[channel].videos.add(videoId);
            });
            
            // Format top channels
            const topChannels = Object.values(channelStats)
                .map(stat => ({
                    name: stat.name,
                    watchTime: stat.watchTime,
                    videoCount: stat.videos.size
                }))
                .sort((a, b) => b.watchTime - a.watchTime)
                .slice(0, 5);
            
            // Format watched videos
            const watchedVideos = {};
            Object.entries(data.videos).forEach(([videoId, video]) => {
                const sessions = data.sessions.filter(s => s.videoId === videoId);
                watchedVideos[videoId] = {
                    title: video.title,
                    channel: video.channel,
                    firstWatched: video.firstWatched,
                    totalTime: sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
                    viewCount: sessions.length
                };
            });
            
            const stats = {
                totalWatchTime,
                uniqueVideos,
                topChannels,
                watchedVideos
            };
            
            console.log('[YT Stats DB] Raw data:', data);
            console.log('[YT Stats DB] Calculated stats:', stats);
            resolve(stats);
        });
    });
}
