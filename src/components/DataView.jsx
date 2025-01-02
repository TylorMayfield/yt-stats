/* eslint-disable react/prop-types */
import { RawDataView } from "./RawDataView";
import { StatsOverview } from "./StatsOverview";
import { TopChannels } from "./TopChannels";
import { RecentlyWatched } from "./RecentlyWatched";

export function DataView({
  stats,
  loading,
  error,
  showRawData,
  setShowRawData,
}) {
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
      <RawDataView
        stats={stats}
        showRawData={showRawData}
        setShowRawData={setShowRawData}
      />
    );
  }

  return (
    <div className="space-y-6">
      <RawDataView
        stats={stats}
        showRawData={showRawData}
        setShowRawData={setShowRawData}
      />
      <StatsOverview
        totalWatchTime={stats.totalWatchTime}
        uniqueVideos={stats.uniqueVideos}
      />
      <TopChannels channels={stats.topChannels} />
      <RecentlyWatched watchedVideos={stats.watchedVideos} />
    </div>
  );
}
