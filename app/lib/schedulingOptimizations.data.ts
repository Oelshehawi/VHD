
import connectMongo from "./connect";
import {
  Client,
  Invoice,
  JobsDueSoon,
  Schedule,
  LocationGeocode,
  LocationCluster,
  MonthlyDistanceMatrix,
  SchedulingPreferences,
  HistoricalSchedulePattern,
  OptimizationHistory,
} from "../../models/reactDataSchema";
import {
  JobOptimizationData,
  LocationGeocodeType,
  LocationClusterType,
  MonthlyDistanceMatrixType,
  SchedulingPreferencesType,
  HistoricalSchedulePatternType,
  OptimizationHistoryType,
  ScheduleType,
  ClientType,
} from "./typeDefinitions";

/**
 * Fetch unscheduled jobs for optimization
 */
export async function fetchUnscheduledJobsForOptimization(dateRange?: {
  start: Date;
  end: Date;
}): Promise<JobOptimizationData[]> {
  await connectMongo();

  try {
    // Build date filter
    const dateFilter: any = { isScheduled: false };
    if (dateRange) {
      dateFilter.dateDue = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    // Get unscheduled jobs with populated client data
    const unscheduledJobs = await JobsDueSoon.find(dateFilter)
      .populate("clientId")
      .lean();

    if (!unscheduledJobs.length) return [];

    // Get associated invoice details
    const invoiceIds = unscheduledJobs.map((job: any) => job.invoiceId);
    const invoices = await Invoice.find({
      _id: { $in: invoiceIds },
    }).lean();

    // Get geocoded locations for these jobs
    const locations = Array.from(
      new Set(invoices.map((inv: any) => inv.location)),
    );
    const geocodedLocations = await LocationGeocode.find({
      address: { $in: locations },
    }).lean();

    // Combine data into optimization format
    const optimizationJobs: JobOptimizationData[] = unscheduledJobs
      .map((job: any) => {
        const invoice = invoices.find(
          (inv: any) => inv._id.toString() === job.invoiceId,
        );
        const geocoded = geocodedLocations.find(
          (geo: any) => geo.address === invoice?.location,
        );

        // Handle populated clientId (could be ObjectId or populated Client object)
        const client: ClientType =
          typeof job.clientId === "object" && job.clientId.clientName
            ? job.clientId // Already populated
            : null;

        if (!invoice) {
          console.warn(`Invoice not found for job ${job._id}`);
          return null;
        }

        if (!client) {
          console.warn(`Client not found for job ${job._id}`);
          return null;
        }

        // Calculate priority based on due date
        const daysUntilDue = Math.ceil(
          (new Date(job.dateDue).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const priority = Math.max(1, Math.min(10, 10 - daysUntilDue)); // 1-10 scale

        // Estimate duration based on frequency (more frequent = longer jobs)
        const estimatedDuration = invoice.frequency
          ? Math.max(60, invoice.frequency * 30)
          : 120;

        return {
          jobId: job._id.toString(),
          invoiceId: job.invoiceId,
          jobTitle: job.jobTitle,
          location: invoice.location,
          normalizedLocation: geocoded?.normalizedAddress || invoice.location,
          clientName: client.clientName || "Unknown Client",
          dateDue: new Date(job.dateDue),
          estimatedDuration,
          priority,
          constraints: {
            earliestStart: new Date(new Date().setHours(8, 0, 0, 0)), // 8 AM
            latestStart: new Date(new Date().setHours(15, 0, 0, 0)), // 3 PM (for 4-hour jobs)
            bufferAfter: 30, // 30 minute default buffer
          },
        };
      })
      .filter(Boolean) as JobOptimizationData[];

    return optimizationJobs;
  } catch (error) {
    console.error("Error fetching unscheduled jobs:", error);
    throw new Error("Failed to fetch unscheduled jobs for optimization");
  }
}

/**
 * Analyze historical scheduling patterns for jobs
 */
export async function analyzeHistoricalPatterns(
  jobs: JobOptimizationData[],
): Promise<HistoricalSchedulePatternType[]> {
  await connectMongo();

  try {
    const patterns: HistoricalSchedulePatternType[] = [];

    for (const job of jobs) {
      const jobIdentifier = `${job.jobTitle}|${job.normalizedLocation}`;

      // Find existing pattern or create new one
      let existingPattern = await HistoricalSchedulePattern.findOne({
        jobIdentifier,
      }).lean();

      if (!existingPattern) {
        // Create new pattern by analyzing historical schedules
        const historicalSchedules = await Schedule.find({
          jobTitle: job.jobTitle,
          location: { $regex: job.location, $options: "i" }, // fuzzy match location
        })
          .sort({ startDateTime: -1 })
          .limit(20)
          .lean();

        if (historicalSchedules.length > 0) {
          const analysisResult = analyzeSchedulePatterns(historicalSchedules);

          // Create proper type for new pattern without _id
          const newPatternData = {
            jobIdentifier,
            patterns: analysisResult.patterns,
            historicalData: analysisResult.historicalData,
            lastAnalyzed: new Date(),
            totalOccurrences: historicalSchedules.length,
          };

          // Save the new pattern
          const newPattern = new HistoricalSchedulePattern(
            newPatternData as any,
          );
          const savedPattern = await newPattern.save();
          existingPattern = savedPattern.toObject();
        }
      }

      if (existingPattern) {
        // Convert to proper type
        const typedPattern: HistoricalSchedulePatternType = {
          _id: (existingPattern as any)._id.toString(),
          jobIdentifier: (existingPattern as any).jobIdentifier,
          patterns: (existingPattern as any).patterns,
          historicalData: (existingPattern as any).historicalData,
          lastAnalyzed: (existingPattern as any).lastAnalyzed,
          totalOccurrences: (existingPattern as any).totalOccurrences,
        };
        patterns.push(typedPattern);
      }
    }

    return patterns;
  } catch (error) {
    console.error("Error analyzing historical patterns:", error);
    throw new Error("Failed to analyze historical patterns");
  }
}

/**
 * Helper function to analyze schedule patterns from historical data
 */
function analyzeSchedulePatterns(schedules: any[]) {
  const hours: number[] = [];
  const daysOfWeek: number[] = [];
  const durations: number[] = [];
  const technicianCounts: { [key: string]: number } = {};

  const historicalData = schedules.map((schedule) => {
    const startDate = new Date(schedule.startDateTime);
    const hour = startDate.getHours();
    const dayOfWeek = startDate.getDay() === 0 ? 7 : startDate.getDay(); // Convert Sunday from 0 to 7

    hours.push(hour);
    daysOfWeek.push(dayOfWeek);
    durations.push(schedule.hours || 120);

    // Count technician assignments
    schedule.assignedTechnicians.forEach((techId: string) => {
      technicianCounts[techId] = (technicianCounts[techId] || 0) + 1;
    });

    return {
      scheduleId: schedule._id.toString(),
      startDateTime: startDate,
      actualDuration: schedule.hours || 120,
      assignedTechnicians: schedule.assignedTechnicians,
      completionNotes: schedule.technicianNotes || "",
    };
  });

  // Calculate preferred patterns
  const preferredHour = Math.round(
    hours.reduce((sum, h) => sum + h, 0) / hours.length,
  );
  const preferredDayOfWeek = Math.round(
    daysOfWeek.reduce((sum, d) => sum + d, 0) / daysOfWeek.length,
  );
  const averageDuration = Math.round(
    durations.reduce((sum, d) => sum + d, 0) / durations.length,
  );

  // Find most common technicians
  const preferredTechnicians = Object.entries(technicianCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([techId]) => techId);

  // Calculate confidence based on consistency
  const hourVariance = calculateVariance(hours);
  const dayVariance = calculateVariance(daysOfWeek);
  const hourConfidence = Math.max(0, 1 - hourVariance / 12); // Normalize by max possible variance
  const dayConfidence = Math.max(0, 1 - dayVariance / 3.5); // Normalize by max possible variance
  const technicianConfidence =
    preferredTechnicians.length > 0 && preferredTechnicians[0]
      ? (technicianCounts[preferredTechnicians[0]] || 0) / schedules.length
      : 0;

  return {
    patterns: {
      preferredHour,
      hourConfidence,
      preferredDayOfWeek,
      dayConfidence,
      preferredTechnicians,
      technicianConfidence,
      averageDuration,
    },
    historicalData,
  };
}

/**
 * Calculate variance for confidence scoring
 */
function calculateVariance(numbers: number[]): number {
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const squareDiffs = numbers.map((num) => Math.pow(num - mean, 2));
  return squareDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
}

/**
 * Get or create default scheduling preferences
 */
export async function getSchedulingPreferences(
  userId?: string,
): Promise<SchedulingPreferencesType> {
  await connectMongo();

  try {
    // Try to find user-specific preferences first
    let preferences = null;
    if (userId) {
      preferences = await SchedulingPreferences.findOne({
        createdBy: userId,
      }).lean();
    }

    // Fall back to default preferences
    if (!preferences) {
      preferences = await SchedulingPreferences.findOne({
        isDefault: true,
      }).lean();
    }

    // Create default if none exist
    if (!preferences) {
      const defaultPreferences = {
        globalSettings: {
          defaultBufferMinutes: 30,
          workDayStart: "08:00",
          workDayEnd: "17:00",
          maxJobsPerDay: 4,
          maxDriveTimePerDay: 240,
          lunchBreakDuration: 60,
          lunchBreakStart: "12:00",
        },
        jobTypePreferences: [
          {
            jobTitle: "Restaurant Hood Cleaning",
            estimatedDuration: 120,
            bufferAfter: 45,
            preferredTimeSlots: ["09:00-12:00", "13:00-16:00"],
            difficultyScore: 3,
            requiresSpecialEquipment: false,
          },
        ],
        locationPreferences: [],
        isDefault: true,
        createdBy: userId || "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newPreferences = new SchedulingPreferences(
        defaultPreferences as any,
      );
      const savedPreferences = await newPreferences.save();
      preferences = savedPreferences.toObject();
    }

    // Convert to proper type
    const typedPreferences: SchedulingPreferencesType = {
      _id: preferences._id.toString(),
      globalSettings: preferences.globalSettings,
      jobTypePreferences: preferences.jobTypePreferences,
      locationPreferences: preferences.locationPreferences,
      isDefault: preferences.isDefault,
      createdBy: preferences.createdBy,
      createdAt: preferences.createdAt,
      updatedAt: preferences.updatedAt,
    };

    return typedPreferences;
  } catch (error) {
    console.error("Error getting scheduling preferences:", error);
    throw new Error("Failed to get scheduling preferences");
  }
}

/**
 * Get location clusters for geographic optimization
 */
export async function getLocationClusters(): Promise<LocationClusterType[]> {
  await connectMongo();

  try {
    const clusters = await LocationCluster.find({ isActive: true })
      .sort({ clusterName: 1 })
      .lean();

    // Create default clusters if none exist
    if (clusters.length === 0) {
      const defaultClusters = [
        {
          clusterName: "Vancouver Core",
          centerCoordinates: { lat: 49.2827, lng: -123.1207 },
          radius: 15,
          constraints: {
            maxJobsPerDay: 4,
            preferredDays: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
            ],
            specialRequirements: "Urban area - parking restrictions",
            bufferTimeMinutes: 15,
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          clusterName: "Whistler Area",
          centerCoordinates: { lat: 50.1163, lng: -122.9574 },
          radius: 25,
          constraints: {
            maxJobsPerDay: 2,
            preferredDays: ["Monday", "Tuesday"],
            specialRequirements: "2+ hour drive - bundle trips",
            bufferTimeMinutes: 60,
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          clusterName: "Surrey/Langley",
          centerCoordinates: { lat: 49.1913, lng: -122.849 },
          radius: 20,
          constraints: {
            maxJobsPerDay: 3,
            preferredDays: ["Wednesday", "Thursday", "Friday"],
            specialRequirements: "Suburban area",
            bufferTimeMinutes: 20,
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Create and return clusters with proper typing
      const createdClusters: LocationClusterType[] = [];
      for (const clusterData of defaultClusters) {
        const cluster = new LocationCluster(clusterData as any);
        const savedCluster = await cluster.save();
        // Convert to proper type
        const typedCluster: LocationClusterType = {
          _id: savedCluster._id.toString(),
          clusterName: savedCluster.clusterName,
          centerCoordinates: savedCluster.centerCoordinates,
          radius: savedCluster.radius,
          constraints: savedCluster.constraints,
          boundingBox: savedCluster.boundingBox,
          isActive: savedCluster.isActive,
          createdAt: savedCluster.createdAt,
          updatedAt: savedCluster.updatedAt,
        };
        createdClusters.push(typedCluster);
      }
      return createdClusters;
    }

    // Convert existing clusters to proper type
    return clusters.map(
      (cluster: any): LocationClusterType => ({
        _id: cluster._id.toString(),
        clusterName: cluster.clusterName,
        centerCoordinates: cluster.centerCoordinates,
        radius: cluster.radius,
        constraints: cluster.constraints,
        boundingBox: cluster.boundingBox,
        isActive: cluster.isActive,
        createdAt: cluster.createdAt,
        updatedAt: cluster.updatedAt,
      }),
    );
  } catch (error) {
    console.error("Error getting location clusters:", error);
    throw new Error("Failed to get location clusters");
  }
}

/**
 * Get monthly distance matrix (cache)
 */
export async function getMonthlyDistanceMatrix(
  month: string,
): Promise<MonthlyDistanceMatrixType | null> {
  await connectMongo();

  try {
    const matrix = await MonthlyDistanceMatrix.findOne({
      month,
      isActive: true,
    }).lean();

    if (!matrix) return null;

    // Convert to proper type
    const typedMatrix: MonthlyDistanceMatrixType = {
      _id: (matrix as any)._id.toString(),
      month: (matrix as any).month,
      locations: (matrix as any).locations,
      coordinates: (matrix as any).coordinates,
      matrix: (matrix as any).matrix,
      calculatedAt: (matrix as any).calculatedAt,
      isActive: (matrix as any).isActive,
    };

    return typedMatrix;
  } catch (error) {
    console.error("Error getting monthly distance matrix:", error);
    return null;
  }
}

/**
 * Get existing schedules for conflict checking
 */
export async function getExistingSchedules(dateRange: {
  start: Date;
  end: Date;
}): Promise<ScheduleType[]> {
  await connectMongo();

  try {
    const schedules = await Schedule.find({
      startDateTime: {
        $gte: dateRange.start,
        $lte: dateRange.end,
      },
    }).lean();

    return schedules.map((schedule: any) => {
      // Ensure proper date handling for both Date and string types
      let startDateTimeString: string;
      if (schedule.startDateTime instanceof Date) {
        startDateTimeString = schedule.startDateTime.toISOString();
      } else if (typeof schedule.startDateTime === "string") {
        startDateTimeString = new Date(schedule.startDateTime).toISOString();
      } else {
        // Handle any other case by converting to Date first
        startDateTimeString = new Date(
          schedule.startDateTime as any,
        ).toISOString();
      }

      return {
        _id: schedule._id.toString(),
        invoiceRef: schedule.invoiceRef.toString(),
        jobTitle: schedule.jobTitle || "",
        location: schedule.location,
        startDateTime: startDateTimeString,
        assignedTechnicians: schedule.assignedTechnicians,
        confirmed: schedule.confirmed,
        hours: schedule.hours,
        payrollPeriod: schedule.payrollPeriod
          ? schedule.payrollPeriod.toString()
          : "",
        deadRun: schedule.deadRun,
        technicianNotes: schedule.technicianNotes || "",
      };
    }) as ScheduleType[];
  } catch (error) {
    console.error("Error getting existing schedules:", error);
    throw new Error("Failed to get existing schedules");
  }
}

/**
 * Normalize address for consistent geocoding
 */
export function normalizeAddress(address: string): string {
  return address
    .trim()
    .toLowerCase()
    .replace(
      /\b(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd)\b/g,
      (match) => {
        const abbrevs: { [key: string]: string } = {
          street: "st",
          avenue: "ave",
          road: "rd",
          drive: "dr",
          boulevard: "blvd",
        };
        return abbrevs[match] || match;
      },
    )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate unique job identifier for historical analysis
 */
export function generateJobIdentifier(
  jobTitle: string,
  location: string,
): string {
  const normalizedTitle = jobTitle.trim().toLowerCase();
  const normalizedLocation = normalizeAddress(location);
  return `${normalizedTitle}|${normalizedLocation}`;
}
