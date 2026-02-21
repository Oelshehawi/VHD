"use client";

import { useEffect, useMemo } from "react";
import { format } from "date-fns";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type {
  DayTravelTimeSummary,
  ScheduleType,
  TravelTimeSegment,
} from "../../../app/lib/typeDefinitions";
import { compareScheduleDisplayOrder } from "../../../app/lib/utils/scheduleDayUtils";
import { cn } from "../../../app/lib/utils";
import JobMarker from "./JobMarker";
import RoutePolyline from "./RoutePolyline";
import MapLegend from "./MapLegend";

const DEFAULT_CENTER: [number, number] = [49.2827, -123.1207];
const DEFAULT_TILE_URL =
  process.env.NEXT_PUBLIC_OSM_TILE_URL ||
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const TECHNICIAN_COLORS = [
  "#0f766e",
  "#2563eb",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#ea580c",
  "#4f46e5",
  "#65a30d",
];

const ROUTE_COLORS = {
  toJob: "#2563eb",
  toDepot: "#ea580c",
  other: "#475569",
} as const;

type RouteLine = {
  id: string;
  positions: [number, number][];
  color: string;
  dashed?: boolean;
  from: string;
  to: string;
  minutes: number;
  km: number;
};

interface ScheduleMapProps {
  jobs: ScheduleType[];
  summary?: DayTravelTimeSummary;
  technicians: { id: string; name: string }[];
  depotAddress?: string | null;
  className?: string;
}

function decodePolyline(encoded: string): [number, number][] {
  if (!encoded) return [];

  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      if (index >= encoded.length) return points;
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const latDelta = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += latDelta;

    result = 0;
    shift = 0;

    do {
      if (index >= encoded.length) return points;
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const lngDelta = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += lngDelta;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatClockFrom24Hour(hour: number, minute: number): string {
  const normalizedHour = ((hour % 24) + 24) % 24;
  const meridiem = normalizedHour >= 12 ? "PM" : "AM";
  const hour12 = normalizedHour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

function formatStoredScheduleTime(value: Date | string): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return formatClockFrom24Hour(value.getUTCHours(), value.getUTCMinutes());
  }

  const raw = String(value || "").trim();
  if (!raw) return "";

  const localeMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i,
  );
  if (localeMatch) {
    const hour12 = Number.parseInt(localeMatch[4] || "0", 10);
    const minute = Number.parseInt(localeMatch[5] || "0", 10);
    const period = (localeMatch[7] || "").toUpperCase();
    let hour24 = hour12 % 12;
    if (period === "PM") hour24 += 12;
    return formatClockFrom24Hour(hour24, minute);
  }

  const isoMatch = raw.match(
    /^\d{4}-\d{2}-\d{2}(?:[T\s](\d{2}):(\d{2})(?::\d{2})?)?/,
  );
  if (isoMatch && isoMatch[1] && isoMatch[2]) {
    const hour = Number.parseInt(isoMatch[1], 10);
    const minute = Number.parseInt(isoMatch[2], 10);
    return formatClockFrom24Hour(hour, minute);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return format(parsed, "h:mm a");
}

function AutoFitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;
    const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  }, [map, positions]);

  return null;
}

function getSegmentColor(segment: TravelTimeSegment): string {
  if (segment.toKind === "depot") return ROUTE_COLORS.toDepot;
  if (segment.toKind === "job") return ROUTE_COLORS.toJob;
  return ROUTE_COLORS.other;
}

export default function ScheduleMap({
  jobs,
  summary,
  technicians,
  depotAddress,
  className,
}: ScheduleMapProps) {
  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) =>
      compareScheduleDisplayOrder(a.startDateTime, b.startDateTime),
    );
  }, [jobs]);

  const colorByTechId = useMemo(() => {
    const map = new Map<string, string>();
    technicians.forEach((tech, idx) => {
      map.set(tech.id, TECHNICIAN_COLORS[idx % TECHNICIAN_COLORS.length]!);
    });
    return map;
  }, [technicians]);

  const techNameById = useMemo(() => {
    const map = new Map<string, string>();
    technicians.forEach((tech) => {
      map.set(tech.id, tech.name);
    });
    return map;
  }, [technicians]);

  const { routeLines, coordinatesByStop } = useMemo(() => {
    const lines: RouteLine[] = [];
    const stopCoordinates = new Map<string, [number, number]>();

    if (!summary) {
      return { routeLines: lines, coordinatesByStop: stopCoordinates };
    }

    summary.segments.forEach((segment, index) => {
      if (!segment.routePolyline) return;

      const points = decodePolyline(segment.routePolyline);
      if (points.length < 2) return;

      const first = points[0]!;
      const last = points[points.length - 1]!;

      if (segment.fromKind === "depot") {
        stopCoordinates.set("depot", first);
      }
      if (segment.toKind === "depot") {
        stopCoordinates.set("depot", last);
      }
      if (segment.fromKind === "job" && segment.fromJobId) {
        stopCoordinates.set(`job:${segment.fromJobId}`, first);
      }
      if (segment.toKind === "job" && segment.toJobId) {
        stopCoordinates.set(`job:${segment.toJobId}`, last);
      }

      lines.push({
        id: `${index}-${segment.from}-${segment.to}`,
        positions: points,
        color: getSegmentColor(segment),
        dashed: segment.toKind === "depot",
        from: segment.from,
        to: segment.to,
        minutes: segment.typicalMinutes,
        km: segment.km,
      });
    });

    return { routeLines: lines, coordinatesByStop: stopCoordinates };
  }, [summary]);

  const jobMarkers = useMemo(() => {
    return sortedJobs.flatMap((job, idx) => {
      const jobId = String(job._id);
      const position = coordinatesByStop.get(`job:${jobId}`);
      if (!position) return [];

      const techId = job.assignedTechnicians?.[0];
      return [
        {
          id: jobId,
          index: idx + 1,
          position,
          job,
          color: techId ? (colorByTechId.get(techId) ?? "#0f766e") : "#0f766e",
        },
      ];
    });
  }, [sortedJobs, coordinatesByStop, colorByTechId]);

  const missingJobCoordinates = sortedJobs.length - jobMarkers.length;
  const depotPosition = coordinatesByStop.get("depot");

  const mapPoints = useMemo(() => {
    const points: [number, number][] = [];

    for (const line of routeLines) {
      points.push(...line.positions);
    }

    for (const marker of jobMarkers) {
      points.push(marker.position);
    }

    if (depotPosition) {
      points.push(depotPosition);
    }

    return points;
  }, [routeLines, jobMarkers, depotPosition]);

  const legendTechnicians = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of sortedJobs) {
      const techId = job.assignedTechnicians?.[0];
      if (!techId) continue;
      counts.set(techId, (counts.get(techId) || 0) + 1);
    }

    return Array.from(counts.entries()).map(([techId, jobCount]) => ({
      id: techId,
      name: techNameById.get(techId) || techId,
      color: colorByTechId.get(techId) || "#334155",
      jobCount,
    }));
  }, [sortedJobs, techNameById, colorByTechId]);

  const mapCenter = mapPoints[0] || DEFAULT_CENTER;

  if (jobs.length === 0) {
    return (
      <div className="text-muted-foreground border-border flex min-h-[220px] items-center justify-center rounded-md border text-sm">
        No jobs scheduled for this day.
      </div>
    );
  }

  return (
    <div
      className={cn("grid gap-3 lg:grid-cols-[minmax(0,1fr)_250px]", className)}
    >
      <section className="space-y-2">
        <div className="text-muted-foreground text-xs">
          Total travel: {formatMinutes(summary?.totalTravelMinutes || 0)} (
          {Math.round(summary?.totalTravelKm || 0)} km)
        </div>

        <div className="border-border overflow-hidden rounded-md border">
          {mapPoints.length > 0 ? (
            <MapContainer
              center={mapCenter}
              zoom={11}
              className="h-[56vh] min-h-[360px] w-full"
              scrollWheelZoom
            >
              <TileLayer url={DEFAULT_TILE_URL} attribution={OSM_ATTRIBUTION} />
              <AutoFitBounds positions={mapPoints} />

              {routeLines.map((line) => (
                <RoutePolyline
                  key={line.id}
                  positions={line.positions}
                  color={line.color}
                  dashed={line.dashed}
                  from={line.from}
                  to={line.to}
                  minutes={line.minutes}
                  km={line.km}
                />
              ))}

              {depotPosition && (
                <JobMarker position={depotPosition} label="D" color="#0f172a">
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold">Depot</p>
                    {depotAddress ? <p>{depotAddress}</p> : null}
                  </div>
                </JobMarker>
              )}

              {jobMarkers.map((marker) => {
                const startLabel = formatStoredScheduleTime(
                  marker.job.startDateTime,
                );
                const assignedTechs = marker.job.assignedTechnicians
                  .map((techId) => techNameById.get(techId) || techId)
                  .join(", ");

                return (
                  <JobMarker
                    key={marker.id}
                    position={marker.position}
                    label={String(marker.index)}
                    color={marker.color}
                  >
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold">
                        {marker.index}. {marker.job.jobTitle}
                      </p>
                      <p>{startLabel}</p>
                      <p>{marker.job.location}</p>
                      {assignedTechs ? (
                        <p className="text-muted-foreground">
                          Tech: {assignedTechs}
                        </p>
                      ) : null}
                    </div>
                  </JobMarker>
                );
              })}
            </MapContainer>
          ) : (
            <div className="text-muted-foreground flex h-[56vh] min-h-[260px] items-center justify-center p-4 text-sm">
              Route polyline data is not available yet for this day.
            </div>
          )}
        </div>
      </section>

      <MapLegend
        technicians={legendTechnicians}
        totalSegments={routeLines.length}
        missingJobCoordinates={missingJobCoordinates}
        depotAddress={depotAddress}
        routeColors={ROUTE_COLORS}
      />
    </div>
  );
}
