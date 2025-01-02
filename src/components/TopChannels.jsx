/* eslint-disable react/prop-types */
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { formatDuration } from "../utils/time";

export function TopChannels({ channels }) {
  return (
    <div className="bg-youtube-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-youtube-gray-300 flex items-center">
        <ChartBarIcon className="w-5 h-5 mr-2" />
        Top Channels
      </h3>
      {channels.length > 0 ? (
        <div className="space-y-4">
          {channels.map((channel, index) => (
            <div
              key={channel.name}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <span className="text-youtube-gray-300 mr-2">#{index + 1}</span>
                <span className="font-medium text-youtube-light">
                  {channel.name}
                </span>
              </div>
              <div className="text-sm text-youtube-gray-300">
                {formatDuration(channel.watchTime)} • {channel.videoCount}{" "}
                videos
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-youtube-gray-300">No channel data yet</p>
      )}
    </div>
  );
}
