/* eslint-disable react/prop-types */
import {
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export function Header({ activeTab, setActiveTab, refreshStats }) {
  return (
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
  );
}
