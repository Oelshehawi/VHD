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
} from "../../models/reactDataSchema";
import {
  JobOptimizationData,
  LocationGeocodeType,
  LocationClusterType,
  MonthlyDistanceMatrixType,
  SchedulingPreferencesType,
  HistoricalSchedulePatternType,
  ScheduleType,
  ClientType,
} from "./typeDefinitions";
import { formatDateFns } from "./utils";
import { format } from "date-fns";

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

        // Calculate job duration based on invoice price (business rule)
        const totalPrice = invoice.items.reduce(
          (sum: number, item: any) => sum + item.price,
          0,
        );
        const estimatedDuration = calculateJobDurationFromPrice(totalPrice);

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

    // Get scheduling preferences for business hours
    const preferences = await getSchedulingPreferences();
    const workDayStart = parseInt(
      preferences.globalSettings.workDayStart.split(":")[0]!,
    );
    const workDayEnd = parseInt(
      preferences.globalSettings.workDayEnd.split(":")[0]!,
    );

    console.log(
      `📊 Using business hours: ${workDayStart}:00 - ${workDayEnd}:00 UTC`,
    );

    for (const job of jobs) {
      const jobIdentifier = generateJobIdentifier(job.jobTitle, job.location);

      console.log(`🔍 Analyzing: "${job.jobTitle}"`);

      // Find existing pattern or create new one
      let existingPattern = await HistoricalSchedulePattern.findOne({
        jobIdentifier,
      }).lean();

      if (!existingPattern) {
        // Create new pattern by analyzing historical schedules
        // Use broader search criteria and LIMIT to 5 records
        const historicalSchedules = await Schedule.find({
          $or: [
            { jobTitle: job.jobTitle },
            {
              jobTitle: {
                $regex: job.jobTitle.trim().replace(/\s+/g, "\\s+"),
                $options: "i",
              },
            },
            {
              location: {
                $regex: job.location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                $options: "i",
              },
            },
          ],
        })
          .sort({ startDateTime: -1 })
          .limit(5) // LIMIT TO 5 RECORDS
          .lean();

        console.log(
          `   Found ${historicalSchedules.length} historical records`,
        );

        if (historicalSchedules.length > 0) {
          const analysisResult = analyzeSchedulePatterns(
            historicalSchedules,
            workDayStart,
            workDayEnd,
          );

          const newPatternData = {
            jobIdentifier,
            patterns: analysisResult.patterns,
            historicalData: analysisResult.historicalData,
            lastAnalyzed: new Date(),
            totalOccurrences: historicalSchedules.length,
          };

          console.log(
            `   Pattern: ${analysisResult.patterns.preferredHour}:00 UTC (${(analysisResult.patterns.hourConfidence * 100).toFixed(0)}% confidence)`,
          );

          const newPattern = new HistoricalSchedulePattern(
            newPatternData as any,
          );
          const savedPattern = await newPattern.save();
          existingPattern = savedPattern.toObject();
        } else {
          console.log(`   No historical data found`);
        }
      } else {
        console.log(
          `   Using cached pattern: ${(existingPattern as any).patterns.preferredHour}:00 UTC (${((existingPattern as any).patterns.hourConfidence * 100).toFixed(0)}% confidence)`,
        );
      }

      if (existingPattern) {
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
 * Calculate job duration based on invoice price (business rule)
 */
function calculateJobDurationFromPrice(totalPrice: number): number {
  if (totalPrice < 600) return 150; // 2.5 hours
  if (totalPrice < 900) return 180; // 3 hours
  return 240; // 4 hours
}

/**
 * Get the most common value in an array
 */
function getMostCommon(arr: number[]): number {
  if (arr.length === 0) return 0; // Return 0 if array is empty

  const counts: { [key: number]: number } = {};
  arr.forEach((val) => {
    counts[val] = (counts[val] || 0) + 1;
  });

  let maxCount = 0;
  let mostCommon = arr[0]!; // Non-null assertion since we checked length above
  Object.entries(counts).forEach(([val, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = parseInt(val);
    }
  });

  return mostCommon;
}

/**
 * Calculate consistency (confidence) for a set of values
 * Returns 0-1 where 1 is perfectly consistent (all same value)
 */
function calculateConsistency(values: number[]): number {
  if (values.length <= 1) return 1; // Perfect consistency with 0 or 1 value

  const mostCommon = getMostCommon(values);
  const occurrences = values.filter((val) => val === mostCommon).length;
  return occurrences / values.length;
}

/**
 * Helper function to analyze schedule patterns from historical data
 * Exported for testing purposes
 */
export function analyzeSchedulePatterns(
  schedules: any[],
  workDayStart: number = 9,
  workDayEnd: number = 17,
) {
  const hours: number[] = [];
  const daysOfWeek: number[] = [];
  const durations: number[] = [];

  console.log(
    `   📊 Analyzing ${schedules.length} records (business hours: ${workDayStart}-${workDayEnd})`,
  );

  const historicalData = schedules.map((schedule) => {
    // Ensure we're working with UTC dates consistently
    const startDate = new Date(schedule.startDateTime);

    // Use UTC methods to avoid timezone conversion
    const hour = startDate.getUTCHours();
    const dayOfWeek = startDate.getUTCDay() === 0 ? 7 : startDate.getUTCDay(); // Convert Sunday from 0 to 7

    console.log(
      `      ${format(startDate, "yyyy-MM-dd HH:mm")} UTC → Hour: ${hour}, Day: ${getDayName(dayOfWeek)}`,
    );

    // Use preferences for business hours instead of hardcoded 7-19
    if (hour >= workDayStart && hour <= workDayEnd) {
      hours.push(hour);
      console.log(`      ✅ Including hour ${hour}`);
    } else {
      console.log(
        `      ❌ Excluding hour ${hour} (outside ${workDayStart}-${workDayEnd})`,
      );
    }
    daysOfWeek.push(dayOfWeek);

    // Convert hours to minutes and validate reasonable duration
    const durationMinutes = (schedule.hours || 2) * 60;
    if (durationMinutes >= 60 && durationMinutes <= 480) {
      durations.push(durationMinutes);
    }

    return {
      scheduleId: schedule._id.toString(),
      startDateTime: startDate,
      actualDuration: durationMinutes,
      assignedTechnicians: schedule.assignedTechnicians,
      completionNotes: schedule.technicianNotes || "",
    };
  });

  // Calculate preferred patterns (use most common values, not averages)
  const preferredHour = hours.length > 0 ? getMostCommon(hours) : 9; // Default to 9am
  const preferredDayOfWeek =
    daysOfWeek.length > 0 ? getMostCommon(daysOfWeek) : 1; // Default to Monday
  const averageDuration =
    durations.length > 0
      ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
      : 180;

  // Calculate confidence based on consistency (higher is better)
  const hourConfidence = hours.length > 0 ? calculateConsistency(hours) : 0;
  const dayConfidence =
    daysOfWeek.length > 0 ? calculateConsistency(daysOfWeek) : 0;

  console.log(
    `   → Most common: ${preferredHour}:00 UTC on ${getDayName(preferredDayOfWeek)} (${(hourConfidence * 100).toFixed(0)}% hour confidence)`,
  );

  return {
    patterns: {
      preferredHour,
      hourConfidence,
      preferredDayOfWeek,
      dayConfidence,
      averageDuration,
    },
    historicalData,
  };
}

/**
 * Calculate variance for confidence scoring
 */
function calculateVariance(numbers: number[]): number {
  if (numbers.length <= 1) return 0; // No variance with 0 or 1 element

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
      preferences = await SchedulingPreferences.findOne().lean();
    }

    // Create default if none exist
    if (!preferences) {
      const defaultPreferences = {
        globalSettings: {
          maxJobsPerDay: 4,
          workDayStart: "00:00",
          workDayEnd: "24:00",
          preferredBreakDuration: 30,
          startingPointAddress: "11020 Williams Rd Richmond, BC V7A 1X8",
        },
        schedulingControls: {
          excludedDays: [],
          excludedDates: [],
          allowWeekends: false,
          startDate: new Date().toISOString().split("T")[0], // Today's date
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // 30 days from now
        },
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
      schedulingControls: preferences.schedulingControls,
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
            bufferTimeMinutes: 15,
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
            bufferTimeMinutes: 20,
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          clusterName: "Richmond",
          centerCoordinates: { lat: 49.1666, lng: -123.1336 },
          radius: 15,
          constraints: {
            maxJobsPerDay: 3,
            bufferTimeMinutes: 20,
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          clusterName: "Burnaby/New Westminster",
          centerCoordinates: { lat: 49.2488, lng: -122.9805 },
          radius: 15,
          constraints: {
            maxJobsPerDay: 3,
            bufferTimeMinutes: 20,
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          clusterName: "North Vancouver",
          centerCoordinates: { lat: 49.3163, lng: -123.0687 },
          radius: 12,
          constraints: {
            maxJobsPerDay: 3,
            bufferTimeMinutes: 25,
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
            bufferTimeMinutes: 60,
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          clusterName: "Fraser Valley",
          centerCoordinates: { lat: 49.0504, lng: -122.3045 },
          radius: 30,
          constraints: {
            maxJobsPerDay: 2,
            bufferTimeMinutes: 45,
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          clusterName: "Bowen Island",
          centerCoordinates: { lat: 49.3811, lng: -123.3482 },
          radius: 10,
          constraints: {
            maxJobsPerDay: 1,
            bufferTimeMinutes: 120,
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
 * Get day name from day number
 */
function getDayName(dayNumber: number): string {
  const days = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days[dayNumber] || "Unknown";
}

/**
 * Generate unique job identifier for historical analysis
 * Normalizes job title and location to handle variations
 */
export function generateJobIdentifier(
  jobTitle: string,
  location: string,
): string {
  // Normalize job title: trim, lowercase, remove extra spaces, handle common variations
  const normalizedTitle = jobTitle
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/[^\w\s]/g, "") // Remove special characters except spaces
    .trim();

  // Normalize location using existing function
  const normalizedLocation = normalizeAddress(location);

  return `${normalizedTitle}|${normalizedLocation}`;
}
