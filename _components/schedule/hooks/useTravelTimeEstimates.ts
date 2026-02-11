"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type {
  ScheduleType,
  DayTravelTimeSummary,
  TravelTimeRequest,
} from "../../../app/lib/typeDefinitions";
import { getBatchTravelTimeSummaries } from "../../../app/lib/actions/travelTime.actions";
import {
  compareScheduleDisplayOrder,
  getScheduleDisplayDateKey,
} from "../../../app/lib/utils/scheduleDayUtils";

interface UseTravelTimeEstimatesResult {
  summaries: Map<string, DayTravelTimeSummary>;
  isLoading: boolean;
  error: string | null;
}

export function useTravelTimeEstimates(
  jobs: ScheduleType[],
  depotAddress: string | null,
  visibleDateKeys: string[],
): UseTravelTimeEstimatesResult {
  const [summaries, setSummaries] = useState<Map<string, DayTravelTimeSummary>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedDatesRef = useRef<Set<string>>(new Set());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRequestRef = useRef(0);

  // Group jobs by date
  const jobsByDate = useMemo(() => {
    const map = new Map<string, ScheduleType[]>();
    for (const job of jobs) {
      const dateKey = getScheduleDisplayDateKey(job.startDateTime);
      const existing = map.get(dateKey) || [];
      existing.push(job);
      map.set(dateKey, existing);
    }
    // Sort jobs within each day by start time
    for (const [key, dayJobs] of map) {
      map.set(
        key,
        dayJobs.sort((a, b) =>
          compareScheduleDisplayOrder(a.startDateTime, b.startDateTime),
        ),
      );
    }
    return map;
  }, [jobs]);

  const jobsFingerprint = useMemo(() => {
    const dateKeys = Array.from(jobsByDate.keys()).sort();

    return dateKeys
      .map((dateKey) => {
        const dayJobs = jobsByDate.get(dateKey) || [];
        const dayFingerprint = dayJobs
          .map((job) => {
            const startMs = new Date(job.startDateTime).getTime();
            const startKey = Number.isNaN(startMs)
              ? String(job.startDateTime)
              : String(startMs);

            return [
              String(job._id),
              startKey,
              String(job.hours),
              job.location,
              job.jobTitle || "",
            ].join("::");
          })
          .join("|");

        return `${dateKey}=>${dayFingerprint}`;
      })
      .join("||");
  }, [jobsByDate]);

  const fetchTravelTimes = useCallback(
    async (dateKeys: string[]) => {
      // Filter to dates that haven't been fetched and have jobs
      const newDateKeys = dateKeys.filter(
        (dk) => !fetchedDatesRef.current.has(dk) && jobsByDate.has(dk),
      );

      if (newDateKeys.length === 0) return;

      const requestId = ++latestRequestRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const requests: TravelTimeRequest[] = newDateKeys.map((dateKey) => ({
          date: dateKey,
          jobs: jobsByDate.get(dateKey) || [],
          depotAddress,
        }));

        const results = await getBatchTravelTimeSummaries(requests);

        // Check if this is still the latest request
        if (requestId !== latestRequestRef.current) return;

        setSummaries((prev) => {
          const next = new Map(prev);
          for (const summary of results) {
            next.set(summary.date, summary);
          }
          return next;
        });

        // Mark dates as fetched
        for (const dk of newDateKeys) {
          fetchedDatesRef.current.add(dk);
        }
      } catch (err) {
        if (requestId !== latestRequestRef.current) return;
        console.error("Travel time fetch failed:", err);
        setError("Failed to load travel times");
      } finally {
        if (requestId === latestRequestRef.current) {
          setIsLoading(false);
        }
      }
    },
    [jobsByDate, depotAddress],
  );

  // Reset fetched dates when depot or jobs change
  useEffect(() => {
    fetchedDatesRef.current.clear();
    setSummaries(new Map());
  }, [depotAddress, jobsFingerprint]);

  // Debounced fetch when visible dates change
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      void fetchTravelTimes(visibleDateKeys);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [visibleDateKeys, fetchTravelTimes]);

  return { summaries, isLoading, error };
}
