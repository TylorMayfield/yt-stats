import React from "react";
import { formatDuration, formatNumber } from "../utils/formatters";

export default function ChannelItem({ name, rank, watchTime, videoCount, showDetails }) {
  return (
    <div className="bg-youtube-gray-100 hover:bg-youtube-gray-200 transition-colors rounded-lg p-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-youtube-gray-300">#{rank}</span>
          <span className="font-medium text-youtube-light truncate">{name}</span>
        </div>
        <span className="text-sm text-youtube-gray-300 font-medium">
          {formatDuration(watchTime)}
        </span>
      </div>
      
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-youtube-gray-200 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-youtube-gray-300 mb-1">Videos Watched</p>
            <p className="font-medium text-youtube-light">
              {formatNumber(videoCount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-youtube-gray-300 mb-1">Avg. Watch Time</p>
            <p className="font-medium text-youtube-light">
              {formatDuration(watchTime / videoCount)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
