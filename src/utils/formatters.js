// Format duration in a human-readable way
export function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0m';
    
    seconds = Math.round(seconds);
    
    if (seconds < 60) return `${seconds}s`;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
}

// Format number with commas
export function formatNumber(num) {
    if (!num || isNaN(num)) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
