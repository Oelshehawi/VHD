import connectMongo from "./connect";
import {
  Client,
  Invoice,
  JobsDueSoon,
  LocationGeocode,
  DistanceMatrixCache,
  Schedule,
} from "../../models/reactDataSchema";
import {
  JobOptimizationData,
  ClientType,
} from "./typeDefinitions";
import { calculateJobDurationFromPrice } from "./utils";
import openRouteService from "./openRoute.service";

/**
 * Get historical scheduling times for similar jobs
 * Returns the most common time from historical data
 */
async function getHistoricalSchedulingTime(
  clientName: string,
  jobTitle: string,
  location: string
): Promise<{ hour: number; minute: number } | null> {
  try {
    
    // First try exact job title match
    let historicalSchedules = await Schedule.find({
      jobTitle: { $regex: new RegExp(jobTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      startDateTime: { 
        $lt: new Date(), // Only past schedules
        $gte: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000) // Within last 2 years
      }
    })
    .sort({ startDateTime: -1 })
    .limit(50) // Get more data for better analysis
    .lean();

    // If no exact job title match, try location match
    if (historicalSchedules.length === 0) {
      console.log(`🔄 No job title match, trying location match for: "${location}"`);
      historicalSchedules = await Schedule.find({
        location: { $regex: new RegExp(location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
        startDateTime: { 
          $lt: new Date(),
          $gte: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
        }
      })
      .sort({ startDateTime: -1 })
      .limit(50)
      .lean();
    }

    // If still no match, try broader search with partial matches
    if (historicalSchedules.length === 0) {
      console.log(`🔄 No location match, trying broader search...`);
      const locationParts = location.split(/[\s\-(),]+/).filter(part => part.length > 3);
      const jobTitleParts = jobTitle.split(/[\s\-(),]+/).filter(part => part.length > 3);
      
      if (locationParts.length > 0 || jobTitleParts.length > 0) {
        const searchTerms = [...locationParts, ...jobTitleParts];
        const regexPattern = searchTerms.map(term => `(?=.*${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`).join('');
        
        historicalSchedules = await Schedule.find({
          $or: [
            { jobTitle: { $regex: regexPattern, $options: 'i' } },
            { location: { $regex: regexPattern, $options: 'i' } }
          ],
          startDateTime: { 
            $lt: new Date(),
            $gte: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
          }
        })
        .sort({ startDateTime: -1 })
        .limit(50)
        .lean();
      }
    }

    if (historicalSchedules.length === 0) {
      console.error(`❌ ERROR: No historical data found for "${jobTitle}" at "${location}" - this shouldn't happen!`);
      return null;
    }


    // Count frequency of each time slot (hour:minute)
    const timeFrequency = new Map<string, { count: number; hour: number; minute: number }>();

    for (const schedule of historicalSchedules) {
      // Use UTC time as stored in MongoDB
      const scheduleDate = new Date(schedule.startDateTime);
      const hour = scheduleDate.getUTCHours();
      const minute = scheduleDate.getUTCMinutes();
      const timeKey = `${hour}:${minute.toString().padStart(2, '0')}`;

      if (timeFrequency.has(timeKey)) {
        timeFrequency.get(timeKey)!.count++;
      } else {
        timeFrequency.set(timeKey, { count: 1, hour, minute });
      }
    }

    // Find the most common time
    let mostCommonTime = { count: 0, hour: 0, minute: 0 };
    let mostCommonTimeKey = '';

    for (const [timeKey, timeData] of timeFrequency.entries()) {
      if (timeData.count > mostCommonTime.count) {
        mostCommonTime = timeData;
        mostCommonTimeKey = timeKey;
      }
    }

    return {
      hour: mostCommonTime.hour,
      minute: mostCommonTime.minute,
    };
  } catch (error) {
    console.error("Error fetching historical scheduling time:", error);
    return null;
  }
}

/**
 * Enrich jobs with historical scheduling data and update constraints
 */
async function enrichJobsWithHistoricalData(
  jobs: JobOptimizationData[]
): Promise<JobOptimizationData[]> {
  
  return Promise.all(
    jobs.map(async (job) => {
      const historicalTime = await getHistoricalSchedulingTime(
        job.clientName,
        job.jobTitle,
        job.location
      );

      if (historicalTime) {
        // Set time window to exact historical time using UTC
        const targetDate = new Date(job.dateDue);
        
        // Set the UTC time to match the historical pattern
        const historicalDateTime = new Date(targetDate);
        historicalDateTime.setUTCHours(historicalTime.hour, historicalTime.minute, 0, 0);
      
        
        return {
          ...job,
          historicalTime,
          constraints: {
            ...job.constraints,
            earliestStart: new Date(historicalDateTime),
            latestStart: new Date(historicalDateTime), // Exact time window (same start and end)
          },
        };
      } else {
        console.error(`❌ CRITICAL ERROR: No historical data found for "${job.jobTitle}" - this indicates a data issue!`);
        // This should never happen - return job with default constraints but log error
        return job; 
      }
    })
  );
}

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
    const unscheduledJobs = await JobsDueSoon.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: "clients",
          localField: "clientId",
          foreignField: "_id",
          as: "client",
        },
      },
      { $match: { "client.isArchived": { $ne: true } } },
    ]);

    if (!unscheduledJobs.length) return [];

    // Get associated invoice details
    const invoiceIds = unscheduledJobs.map((job: any) => job.invoiceId);
    const invoices = await Invoice.find({
      _id: { $in: invoiceIds },
    }).lean();

    // Combine data into optimization format
    const preliminaryJobs: JobOptimizationData[] = unscheduledJobs
      .map((job: any) => {
        const invoice = invoices.find(
          (inv: any) => inv._id.toString() === job.invoiceId,
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
          normalizedLocation: invoice.location, 
          clientName: client.clientName || "Unknown Client",
          dateDue: new Date(job.dateDue),
          estimatedDuration,
          constraints: {
            earliestStart: new Date(new Date().setHours(8, 0, 0, 0)), // Will be updated with historical data
            latestStart: new Date(new Date().setHours(15, 0, 0, 0)), // Will be updated with historical data
          },
          // Placeholder for historical scheduling data
          historicalTime: null,
        };
      })
      .filter(Boolean) as JobOptimizationData[];

    // Enrich jobs with historical scheduling data
    const optimizationJobs = await enrichJobsWithHistoricalData(preliminaryJobs);

    return optimizationJobs;
  } catch (error) {
    console.error("Error fetching unscheduled jobs:", error);
    throw new Error("Failed to fetch unscheduled jobs for optimization");
  }
}



/**
 * Batch geocode locations using existing API
 */
export async function batchGeocodeJobLocations(
  jobs: JobOptimizationData[],
): Promise<Map<string, { lat: number; lng: number }>> {
  await connectMongo();

  try {
    // Get unique locations
    const uniqueLocations = Array.from(new Set(jobs.map(job => job.location)));

    // Check which locations we already have geocoded
    const existingGeocodes = await LocationGeocode.find({
      address: { $in: uniqueLocations }
    }).lean();

    const geocodeMap = new Map<string, { lat: number; lng: number }>();
    const locationsToGeocode: string[] = [];

    // Add existing geocodes to map
    for (const geocode of existingGeocodes) {
      const [lng, lat] = geocode.coordinates;
      geocodeMap.set(geocode.address, { lat, lng });
    }

    // Find locations that need geocoding
    for (const location of uniqueLocations) {
      if (!geocodeMap.has(location)) {
        locationsToGeocode.push(location);
      }
    }

    if (locationsToGeocode.length > 0) {
      
      // Use the direct geocoding service
      const geocodeResults = await openRouteService.geocodeAddresses(locationsToGeocode);
      
      // Add new geocodes to map
      for (const result of geocodeResults) {
        if (result && result.coordinates) {
          const [lng, lat] = result.coordinates;
          geocodeMap.set(result.address, { lat, lng });
        }
      }
    }

    return geocodeMap;
  } catch (error) {
    console.error("Error batch geocoding locations:", error);
    throw new Error("Failed to batch geocode locations");
  }
}

/**
 * Calculate distance matrix for Cloud Run OR Tools service
 */
export async function calculateDistanceMatrixForCloudRun(
  jobs: JobOptimizationData[],
  startingPointAddress?: string,
  geocodeMap?: Map<string, { lat: number; lng: number }>
): Promise<{
  locations: string[];
  coordinates: [number, number][];
  distanceMatrix: number[][];
  durationMatrix: number[][];
} | null> {
  try {
    // Use provided geocode map or get one
    const effectiveGeocodeMap = geocodeMap || await batchGeocodeJobLocations(jobs);
    
    // Prepare locations array starting with depot if provided
    const locations: string[] = [];
    const coordinates: [number, number][] = [];
    
    // Add starting point (depot) as first location if provided
    if (startingPointAddress) {
      try {
        const geocodeResults = await openRouteService.geocodeAddresses([startingPointAddress]);
        if (geocodeResults.length > 0 && geocodeResults[0]?.coordinates) {
          const depotCoords = geocodeResults[0].coordinates;
          locations.push(startingPointAddress);
          coordinates.push([depotCoords[0], depotCoords[1]] as [number, number]); // [lng, lat]
        }
      } catch (error) {
        console.warn("Failed to geocode starting point:", error);
      }
    }
    
    // Add job locations
    for (const job of jobs) {
      const coords = effectiveGeocodeMap.get(job.location);
      if (coords) {
        locations.push(job.location);
        coordinates.push([coords.lng, coords.lat] as [number, number]);
      }
    }

    if (coordinates.length < 2) {
      console.warn("Not enough geocoded locations for distance matrix calculation");
      return null;
    }

    // Create a hash for caching
    const locationHash = locations.sort().join('|');
    
    // Check if we have a cached matrix
    const cachedMatrix = await DistanceMatrixCache.findOne({
      locationHash,
      expiresAt: { $gt: new Date() }
    });

    if (cachedMatrix) {
      console.log(`📊 Using cached distance matrix for ${coordinates.length} locations`);
      return {
        locations: cachedMatrix.locations,
        coordinates: cachedMatrix.coordinates as [number, number][],
        distanceMatrix: cachedMatrix.matrix.distances,
        durationMatrix: cachedMatrix.matrix.durations,
      };
    }

    console.log(`🗺️ Calculating distance matrix for ${coordinates.length} locations...`);

    // Calculate distance matrix using the direct service
    const matrixResult = await openRouteService.calculateDistanceMatrix(coordinates);
    
    // Cache the matrix for 1 hour (for real-time accuracy)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    await DistanceMatrixCache.findOneAndUpdate(
      { locationHash },
      {
        locationHash,
        locations,
        coordinates,
        matrix: {
          distances: matrixResult.distances,
          durations: matrixResult.durations,
        },
        calculatedAt: new Date(),
        expiresAt,
      },
      { upsert: true }
    );
    
    console.log(`✅ Distance matrix calculated and cached for 1 hour (Cloud Run OR Tools)`);
    
    return {
      locations,
      coordinates,
      distanceMatrix: matrixResult.distances, // km
      durationMatrix: matrixResult.durations,  // minutes
    };
  } catch (error) {
    console.error("Error calculating distance matrix for Cloud Run:", error);
    return null;
  }
}
