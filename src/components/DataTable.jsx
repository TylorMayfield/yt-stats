import React from 'react';

export default function DataTable({ data, columns }) {
  console.log('[DataTable] Incoming Data:', data);

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-youtube-gray-300 py-4">
        No data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-youtube-gray-100">
            {columns.map((column) => (
              <th
                key={column.key}
                className="py-2 px-4 text-sm font-medium text-youtube-gray-300"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            console.log('[DataTable] Row Data:', row);
            return (
              <tr
                key={index}
                className="border-b border-youtube-gray-100 hover:bg-youtube-gray-100 transition-colors"
              >
                {columns.map((column) => {
                  const value = row[column.key];
                  console.log(`[DataTable] Column ${column.key}:`, { value, row });
                  return (
                    <td
                      key={column.key}
                      className="py-2 px-4 text-sm"
                    >
                      {column.format ? column.format(value, row) : value}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
