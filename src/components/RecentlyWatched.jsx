/* eslint-disable react/prop-types */
import { PlayCircleIcon } from "@heroicons/react/24/outline";
import { formatDuration } from "../utils/time";

export function RecentlyWatched({ watchedVideos }) {
  const recentVideos = Object.entries(watchedVideos)
    .sort((a, b) => b[1].firstWatched - a[1].firstWatched)
    .slice(0, 5);

  return (
    <div className="bg-youtube-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-youtube-gray-300 flex items-center">
        <PlayCircleIcon className="w-5 h-5 mr-2" />
        Recently Watched
      </h3>
      {recentVideos.length > 0 ? (
        <div className="space-y-4">
          {recentVideos.map(([videoId, video]) => (
            <div key={videoId} className="flex flex-col">
              <div className="font-medium text-youtube-light">
                {video.title}
              </div>
              <div className="flex justify-between items-center text-sm text-youtube-gray-300">
                <span>{video.channel}</span>
                <span>
                  {formatDuration(video.totalTime)} • {video.viewCount} views
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-youtube-gray-300">No videos watched yet</p>
      )}
    </div>
  );
}
