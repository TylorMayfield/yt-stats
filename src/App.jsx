import { useState } from "react";
import { useStats } from "./hooks/useStats";
import { formatDuration } from "./utils/time";
import KofiButton from "./components/KofiButton";
import {
  ClockIcon,
  PlayCircleIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  TrashIcon,
  TableCellsIcon,
  EyeIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

function App() {
  const [activeTab, setActiveTab] = useState("data");
  const [showRawData, setShowRawData] = useState(false);

  const { stats, loading, error, clearData, refreshStats } = useStats();

  console.log("[YT Stats] Raw Stats:", stats);

  const renderDataTab = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-youtube-gray-300">Loading stats...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error: {error}</div>
        </div>
      );
    }

    if (showRawData) {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-youtube-gray-300 flex items-center">
              <TableCellsIcon className="w-5 h-5 mr-2" />
              Raw Data
            </h3>
            <button
              onClick={() => setShowRawData(false)}
              className="flex items-center px-3 py-1 rounded bg-youtube-gray-800 text-youtube-gray-300 hover:bg-youtube-gray-700"
            >
              <EyeIcon className="w-4 h-4 mr-1" />
              Show Summary
            </button>
          </div>
          <pre className="bg-youtube-gray-800 p-4 rounded-lg shadow overflow-auto text-sm text-youtube-gray-300">
            {JSON.stringify(stats, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => setShowRawData(true)}
            className="flex items-center px-3 py-1 rounded bg-youtube-gray-800 text-youtube-gray-300 hover:bg-youtube-gray-700"
          >
            <TableCellsIcon className="w-4 h-4 mr-1" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-youtube-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2 text-youtube-gray-300 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2" />
              Total Watch Time
            </h3>
            <p className="text-2xl text-youtube-red">
              {formatDuration(stats.totalWatchTime)}
            </p>
          </div>
          <div className="bg-youtube-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2 text-youtube-gray-300 flex items-center">
              <PlayCircleIcon className="w-5 h-5 mr-2" />
              Unique Videos
            </h3>
            <p className="text-2xl text-youtube-red">{stats.uniqueVideos}</p>
          </div>
        </div>

        {/* Top Channels */}
        <div className="bg-youtube-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-youtube-gray-300 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Top Channels
          </h3>
          {stats.topChannels.length > 0 ? (
            <div className="space-y-4">
              {stats.topChannels.map((channel, index) => (
                <div
                  key={channel.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span className="text-youtube-gray-300 mr-2">
                      #{index + 1}
                    </span>
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

        {/* Recently Watched */}
        <div className="bg-youtube-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-youtube-gray-300 flex items-center">
            <PlayCircleIcon className="w-5 h-5 mr-2" />
            Recently Watched
          </h3>
          {Object.keys(stats.watchedVideos).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(stats.watchedVideos)
                .sort((a, b) => b[1].firstWatched - a[1].firstWatched)
                .slice(0, 5)
                .map(([videoId, video]) => (
                  <div key={videoId} className="flex flex-col">
                    <div className="font-medium text-youtube-light">
                      {video.title}
                    </div>
                    <div className="flex justify-between items-center text-sm text-youtube-gray-300">
                      <span>{video.channel}</span>
                      <span>
                        {formatDuration(video.totalTime)} • {video.viewCount}{" "}
                        views
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-youtube-gray-300">No videos watched yet</p>
          )}
        </div>
      </div>
    );
  };

  const renderSettingsTab = () => {
    return (
      <div className="space-y-4">
        <div className="bg-youtube-gray-800 p-4 rounded-lg shadow">
          <div className="space-y-4">
            <div>
              <button
                onClick={clearData}
                disabled={loading}
                className="flex items-center px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
              </button>
              <p className="mt-2 text-sm text-youtube-gray-300">
                This will permanently delete all your watch history and
                statistics.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-w-[400px] max-w-2xl mx-auto p-4 bg-youtube-dark">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <svg
            className="w-6 h-6 text-youtube-red"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-youtube-light to-youtube-gray-300 bg-clip-text text-transparent">
            yt-stats
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("data")}
            className={`px-3 py-1 rounded flex items-center ${
              activeTab === "data"
                ? "bg-youtube-red text-white"
                : "bg-youtube-gray-800 text-youtube-gray-300 hover:bg-youtube-gray-700"
            }`}
          >
            <ChartBarIcon className="w-4 h-4 mr-1" />
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-1 rounded flex items-center ${
              activeTab === "settings"
                ? "bg-youtube-red text-white"
                : "bg-youtube-gray-800 text-youtube-gray-300 hover:bg-youtube-gray-700"
            }`}
          >
            <Cog6ToothIcon className="w-4 h-4 mr-1" />
          </button>
          <button
            onClick={refreshStats}
            className="px-2 py-1 rounded bg-youtube-gray-800 text-youtube-gray-300 hover:bg-youtube-gray-700"
            title="Refresh Stats"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === "data" ? renderDataTab() : renderSettingsTab()}

      <KofiButton />
    </div>
  );
}

export default App;
