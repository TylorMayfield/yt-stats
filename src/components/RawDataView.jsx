/* eslint-disable react/prop-types */
import { TableCellsIcon, EyeIcon } from "@heroicons/react/24/outline";

export function RawDataView({ stats, showRawData, setShowRawData }) {
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
    <div className="flex justify-end">
      <button
        onClick={() => setShowRawData(true)}
        className="flex items-center px-3 py-1 rounded bg-youtube-gray-800 text-youtube-gray-300 hover:bg-youtube-gray-700"
      >
        <TableCellsIcon className="w-4 h-4 mr-1" />
        Show Raw Data
      </button>
    </div>
  );
}
