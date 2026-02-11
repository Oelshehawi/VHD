"use client";

type LegendTechnician = {
  id: string;
  name: string;
  color: string;
  jobCount: number;
};

interface MapLegendProps {
  technicians: LegendTechnician[];
  totalSegments: number;
  missingJobCoordinates: number;
  depotAddress?: string | null;
  routeColors: {
    toJob: string;
    toDepot: string;
    other: string;
  };
}

export default function MapLegend({
  technicians,
  totalSegments,
  missingJobCoordinates,
  depotAddress,
  routeColors,
}: MapLegendProps) {
  return (
    <aside className="border-border bg-muted/20 space-y-3 rounded-md border p-3">
      <div>
        <h4 className="text-sm font-semibold">Map Legend</h4>
        <p className="text-muted-foreground text-xs">
          Route segments: {totalSegments}
        </p>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium">Route Colors</p>
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-6 rounded-full"
            style={{ backgroundColor: routeColors.toJob }}
          />
          <span className="text-xs">To job</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-6 rounded-full"
            style={{ backgroundColor: routeColors.toDepot }}
          />
          <span className="text-xs">Back to depot (dashed)</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-6 rounded-full"
            style={{ backgroundColor: routeColors.other }}
          />
          <span className="text-xs">Other</span>
        </div>
      </div>

      {technicians.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium">Technicians</p>
          {technicians.map((tech) => (
            <div
              key={tech.id}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: tech.color }}
                />
                <span className="truncate text-xs">{tech.name}</span>
              </div>
              <span className="text-muted-foreground text-[11px]">
                {tech.jobCount} job{tech.jobCount === 1 ? "" : "s"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1 text-[11px]">
        <p className="text-muted-foreground">
          Depot: {depotAddress ? "Included" : "Not configured"}
        </p>
        {missingJobCoordinates > 0 && (
          <p className="text-amber-700 dark:text-amber-400">
            {missingJobCoordinates} job marker
            {missingJobCoordinates === 1 ? "" : "s"} could not be mapped.
          </p>
        )}
        <p className="text-muted-foreground">
          Tiles by OpenStreetMap contributors.
        </p>
      </div>
    </aside>
  );
}
