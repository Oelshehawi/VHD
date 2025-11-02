"use client";

import { useState } from "react";

interface AvailabilityToggleProps {
  onToggle?: (isVisible: boolean) => void;
}

export function AvailabilityToggle({ onToggle }: AvailabilityToggleProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleToggle = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    onToggle?.(newState);
  };

  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg bg-white">
      <button
        onClick={handleToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isVisible
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        {isVisible ? "Hide Availability" : "Show Availability"}
      </button>
      <span className="text-sm text-gray-600">
        {isVisible ? "Technician unavailability shown on calendar" : "Click to show technician unavailability"}
      </span>
    </div>
  );
}
