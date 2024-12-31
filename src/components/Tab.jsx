import React from "react";

export default function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
        active
          ? "bg-youtube-gray-200 text-youtube-light"
          : "text-youtube-gray-300 hover:text-youtube-light hover:bg-youtube-gray-100"
      }`}
    >
      {label}
    </button>
  );
}
