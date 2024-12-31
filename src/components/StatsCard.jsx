import React from "react";

export default function StatsCard({ title, value }) {
  return (
    <div className="bg-youtube-gray-100 hover:bg-youtube-gray-200 transition-colors rounded-lg p-4 animate-fade-in">
      <p className="text-sm text-youtube-gray-300 mb-1">{title}</p>
      <p className="text-2xl font-bold text-youtube-light">{value}</p>
    </div>
  );
}
