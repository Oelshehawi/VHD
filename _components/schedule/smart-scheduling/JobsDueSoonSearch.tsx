"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "../../ui/input";
import { ScrollArea } from "../../ui/scroll-area";
import { Badge } from "../../ui/badge";
import { formatDateStringUTC } from "../../../app/lib/utils";
import type { ScheduleJobSearchResult } from "../../../app/lib/actions/smartScheduling.actions";

interface JobSearchProps {
  onSelect: (result: ScheduleJobSearchResult) => void;
  searchScheduleJobs: (query: string) => Promise<ScheduleJobSearchResult[]>;
}

export default function JobsDueSoonSearch({
  onSelect,
  searchScheduleJobs,
}: JobSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScheduleJobSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await searchScheduleJobs(searchQuery);
        setResults(searchResults);
      } catch (error) {
        console.error("Error searching schedule jobs:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchScheduleJobs],
  );

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, 350);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, performSearch]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder="Search by job name or location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
        {isLoading && (
          <Loader2 className="text-muted-foreground absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <ScrollArea className="h-[300px] rounded-md border">
          <div className="space-y-1 p-2">
            {results.map((result) => (
              <button
                key={result._id}
                type="button"
                onClick={() => onSelect(result)}
                className="hover:bg-muted w-full rounded-md border p-3 text-left transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{result.jobTitle}</p>
                    <p className="text-muted-foreground text-sm truncate">
                      {result.clientName}
                    </p>
                    <p className="text-muted-foreground text-xs truncate">
                      {result.location}
                    </p>
                    {result.actualServiceDurationMinutes && (
                      <p className="text-muted-foreground text-xs">
                        Duration: {Math.ceil(result.actualServiceDurationMinutes / 60)}h
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {formatDateStringUTC(result.startDateTime)}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}

      {query && !isLoading && results.length === 0 && (
        <p className="text-muted-foreground text-center text-sm py-4">
          No jobs found matching &ldquo;{query}&rdquo;
        </p>
      )}
    </div>
  );
}
