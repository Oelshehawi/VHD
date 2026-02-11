"use client";

import { Polyline, Tooltip } from "react-leaflet";

interface RoutePolylineProps {
  positions: [number, number][];
  color: string;
  dashed?: boolean;
  from: string;
  to: string;
  minutes: number;
  km: number;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default function RoutePolyline({
  positions,
  color,
  dashed = false,
  from,
  to,
  minutes,
  km,
}: RoutePolylineProps) {
  if (positions.length < 2) return null;

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight: 4,
        opacity: dashed ? 0.9 : 0.8,
        dashArray: dashed ? "10 8" : undefined,
      }}
    >
      <Tooltip sticky>
        <div className="text-xs">
          <div className="font-semibold">
            {from} to {to}
          </div>
          <div>
            {formatMinutes(minutes)} ({Math.round(km)} km)
          </div>
        </div>
      </Tooltip>
    </Polyline>
  );
}
