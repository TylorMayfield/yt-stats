import React from "react";

export default function KofiButton() {
  return (
    <div className="text-center mt-6">
      <a
        href="https://ko-fi.com/tylormayfield"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-4 py-2 bg-youtube-gray-800 hover:bg-youtube-gray-700 text-youtube-gray-300 rounded-lg transition-colors"
      >
        <img
          src="https://storage.ko-fi.com/cdn/cup-border.png"
          alt="Ko-fi"
          className="h-4 w-4 mr-2 invert"
        />
        Support this project
      </a>
    </div>
  );
}
