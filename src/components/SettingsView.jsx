/* eslint-disable react/prop-types */
import { TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export function SettingsView({ clearData, loading }) {
  const [showFeedback, setShowFeedback] = useState(false);

  const handleClearData = () => {
    clearData();
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-youtube-gray-800 p-4 rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <button
              onClick={handleClearData}
              disabled={loading}
              className="flex items-center px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Clear Data
            </button>
            <p className="mt-2 text-sm text-youtube-gray-300">
              This will permanently delete all your watch history and
              statistics.
            </p>
          </div>
        </div>
      </div>
      {showFeedback && (
        <div className="bg-green-500 text-white p-2 rounded">
          Data cleared successfully!
        </div>
      )}
    </div>
  );
}
