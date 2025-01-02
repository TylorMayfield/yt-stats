/* eslint-disable react/prop-types */
import { ClockIcon, PlayCircleIcon } from "@heroicons/react/24/outline";
import { formatDuration } from "../utils/time";

export function StatsOverview({ totalWatchTime, uniqueVideos }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-youtube-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2 text-youtube-gray-300 flex items-center">
          <ClockIcon className="w-5 h-5 mr-2" />
          Total Watch Time
        </h3>
        <p className="text-2xl text-youtube-red">
          {formatDuration(totalWatchTime)}
        </p>
      </div>
      <div className="bg-youtube-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2 text-youtube-gray-300 flex items-center">
          <PlayCircleIcon className="w-5 h-5 mr-2" />
          Unique Videos
        </h3>
        <p className="text-2xl text-youtube-red">{uniqueVideos}</p>
      </div>
    </div>
  );
}
