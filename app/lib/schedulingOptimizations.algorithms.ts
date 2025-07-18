import {
  JobOptimizationData,
  LocationClusterType,
  SchedulingPreferencesType,
  HistoricalSchedulePatternType,
  ScheduleType,
  OptimizationDistanceMatrixType,
} from "./typeDefinitions";
import {
  fetchUnscheduledJobsForOptimization,
  analyzeHistoricalPatterns,
  getSchedulingPreferences,
  getLocationClusters,
  getOptimizationDistanceMatrix,
  calculateOptimizationDistanceMatrix,
  getExistingSchedules,
  generateJobIdentifier,
} from "./schedulingOptimizations.data";
import { formatDateFns } from "./utils";
import { format, addDays, addWeeks, isValid } from "date-fns";
import openRouteService, {
  LocationCoordinates,
  OpenRouteService,
} from "./openroute.service";
import type {
  OptimizedScheduleGroup,
  OptimizedJob,
  OptimizationResult,
} from "./schedulingOptimizations.types";
import { SchedulingStrategy } from "./schedulingOptimizations.types";

// Re-export client-safe types
export type {
  OptimizedScheduleGroup,
  OptimizedJob,
  OptimizationResult,
} from "./schedulingOptimizations.types";
export { SchedulingStrategy } from "./schedulingOptimizations.types";

/**
 * Main optimization engine - orchestrates the entire optimization process
 */
export class SchedulingOptimizer {
  private preferences: SchedulingPreferencesType | null = null;
  private clusters: LocationClusterType[] = [];
  private distanceMatrix: OptimizationDistanceMatrixType | null = null;
  private existingSchedules: ScheduleType[] = [];
  private adminControls: SchedulingPreferencesType | null = null;

  constructor() {}

  /**
   * Initialize the optimizer with current data
   */
  async initialize(dateRange: { start: Date; end: Date }): Promise<void> {
    try {
      // Load all required data in parallel
      const [preferences, clusters, existingSchedules] = await Promise.all([
        getSchedulingPreferences(),
        getLocationClusters(),
        getExistingSchedules(dateRange),
      ]);

      this.preferences = preferences;
      this.clusters = clusters;
      this.existingSchedules = existingSchedules;
      this.adminControls = preferences; // Use preferences for admin controls

      console.log(
        `Optimizer initialized with ${clusters.length} clusters and ${existingSchedules.length} existing schedules`,
      );
    } catch (error) {
      console.error("Failed to initialize scheduling optimizer:", error);
      throw new Error("Optimization initialization failed");
    }
  }

  /**
   * Run hybrid optimization combining historical patterns with drive time minimization
   */
  async optimize(
    strategy: SchedulingStrategy = SchedulingStrategy.HYBRID_HISTORICAL_EFFICIENCY,
    dateRange?: { start: Date; end: Date },
    adminControls?: SchedulingPreferencesType,
  ): Promise<OptimizationResult> {
    if (!this.preferences) {
      throw new Error("Optimizer not initialized. Call initialize() first.");
    }

    // Set admin controls if provided
    this.adminControls = adminControls || this.preferences;

    console.log(`Starting optimization with strategy: ${strategy}`);
    if (this.adminControls?.schedulingControls) {
      const controls = this.adminControls.schedulingControls;
      console.log(`Admin controls applied:`);
      console.log(
        `  - Excluded days: ${controls.excludedDays?.map((d: number) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ") || "None"}`,
      );
      console.log(
        `  - Excluded dates: ${controls.excludedDates?.length || 0} specific dates`,
      );
      console.log(
        `  - Allow weekends: ${controls.allowWeekends ? "Yes" : "No"}`,
      );
      console.log(
        `  - Optimization date range: ${controls.startDate || "No start"} to ${controls.endDate || "No end"}`,
      );
    }

    // Use dateRange from admin controls if not provided as parameter
    const effectiveDateRange =
      dateRange ||
      (this.adminControls?.schedulingControls?.startDate &&
      this.adminControls?.schedulingControls?.endDate
        ? {
            start: new Date(this.adminControls.schedulingControls.startDate),
            end: new Date(this.adminControls.schedulingControls.endDate),
          }
        : undefined);

    // Fetch unscheduled jobs
    const unscheduledJobs =
      await fetchUnscheduledJobsForOptimization(effectiveDateRange);
    console.log(`Found ${unscheduledJobs.length} unscheduled jobs`);

    // Generate unique optimization ID
    const optimizationId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Try to load existing distance matrix or calculate new one
    if (unscheduledJobs.length > 0) {
      this.distanceMatrix = await getOptimizationDistanceMatrix(optimizationId);
      
      if (!this.distanceMatrix) {
        console.log("🗺️ Calculating new distance matrix for optimization...");
        this.distanceMatrix = await calculateOptimizationDistanceMatrix(
          optimizationId,
          unscheduledJobs,
          effectiveDateRange!
        );
      } else {
        console.log("📋 Using cached distance matrix for optimization");
      }
    }

    if (unscheduledJobs.length === 0) {
      return {
        strategy,
        totalJobs: 0,
        scheduledGroups: [],
        unscheduledJobs: [],
        metrics: {
          totalDriveTime: 0,
          averageJobsPerDay: 0,
          utilizationRate: 0,
          conflictsResolved: 0,
        },
        generatedAt: new Date(),
      };
    }

    // Analyze historical patterns
    const historicalPatterns = await analyzeHistoricalPatterns(unscheduledJobs);

    // Step 1: Geographic Clustering
    const clusteredJobs = await this.clusterJobsByLocation(unscheduledJobs);

    // Step 2: Apply hybrid strategy (historical patterns + drive time minimization)
    const optimizedGroups = await this.applyHybridOptimization(
      clusteredJobs,
      historicalPatterns,
    );

    // Step 3: Route optimization within clusters
    const routeOptimizedGroups = await this.optimizeRoutes(optimizedGroups);

    // Step 4: Resolve conflicts with existing schedules
    const { finalGroups, conflictsResolved } =
      await this.resolveScheduleConflicts(routeOptimizedGroups);

    // Calculate metrics
    const metrics = this.calculateOptimizationMetrics(
      finalGroups,
      unscheduledJobs.length,
      conflictsResolved,
    );

    // Find unscheduled jobs
    const scheduledJobIds = new Set(
      finalGroups.flatMap((group) => group.jobs.map((job) => job.jobId)),
    );
    const unscheduledRemaining = unscheduledJobs.filter(
      (job) => !scheduledJobIds.has(job.jobId),
    );

    return {
      strategy,
      totalJobs: unscheduledJobs.length,
      scheduledGroups: finalGroups,
      unscheduledJobs: unscheduledRemaining,
      metrics,
      generatedAt: new Date(),
    };
  }

  /**
   * Step 1: Cluster jobs by geographic location
   */
  private async clusterJobsByLocation(
    jobs: JobOptimizationData[],
  ): Promise<Map<string, JobOptimizationData[]>> {
    const clusteredJobs = new Map<string, JobOptimizationData[]>();

    // Initialize all clusters
    this.clusters.forEach((cluster) => {
      clusteredJobs.set(cluster._id as string, []);
    });

    // Add "unassigned" cluster for jobs that don't fit anywhere
    clusteredJobs.set("unassigned", []);

    for (const job of jobs) {
      let assigned = false;

      // Try to assign to best matching cluster
      for (const cluster of this.clusters) {
        if (this.isJobInCluster(job, cluster)) {
          clusteredJobs.get(cluster._id as string)!.push(job);
          assigned = true;
          break;
        }
      }

      // If no cluster matches, add to unassigned
      if (!assigned) {
        clusteredJobs.get("unassigned")!.push(job);
      }
    }

    // Log cluster assignments
    clusteredJobs.forEach((jobs, clusterId) => {
      if (jobs.length > 0) {
        const clusterName =
          this.clusters.find((c) => c._id === clusterId)?.clusterName ||
          "Unassigned";
        console.log(`Cluster "${clusterName}": ${jobs.length} jobs`);
      }
    });

    return clusteredJobs;
  }

  /**
   * Check if a job belongs to a specific cluster based on location
   */
  private isJobInCluster(
    job: JobOptimizationData,
    cluster: LocationClusterType,
  ): boolean {
    const jobLocation = job.location.toLowerCase();
    const clusterName = cluster.clusterName.toLowerCase();

    // Enhanced location matching for expanded clusters
    if (
      clusterName.includes("vancouver core") ||
      clusterName.includes("vancouver")
    ) {
      return (
        (jobLocation.includes("vancouver") &&
          !jobLocation.includes("north vancouver")) ||
        jobLocation.includes("downtown") ||
        jobLocation.includes("gastown") ||
        jobLocation.includes("yaletown") ||
        jobLocation.includes("mount pleasant") ||
        jobLocation.includes("kitsilano") ||
        jobLocation.includes("fairview") ||
        jobLocation.includes("west end")
      );
    }

    if (clusterName.includes("surrey") || clusterName.includes("langley")) {
      return (
        jobLocation.includes("surrey") ||
        jobLocation.includes("langley") ||
        jobLocation.includes("white rock") ||
        jobLocation.includes("cloverdale")
      );
    }

    if (clusterName.includes("richmond")) {
      return (
        jobLocation.includes("richmond") ||
        jobLocation.includes("steveston") ||
        jobLocation.includes("brighouse")
      );
    }

    if (
      clusterName.includes("burnaby") ||
      clusterName.includes("new westminster")
    ) {
      return (
        jobLocation.includes("burnaby") ||
        jobLocation.includes("new westminster") ||
        jobLocation.includes("coquitlam") ||
        jobLocation.includes("port coquitlam") ||
        jobLocation.includes("port moody")
      );
    }

    if (clusterName.includes("north vancouver")) {
      return (
        jobLocation.includes("north vancouver") ||
        jobLocation.includes("west vancouver") ||
        jobLocation.includes("deep cove") ||
        jobLocation.includes("lynn valley")
      );
    }

    if (clusterName.includes("whistler")) {
      return (
        jobLocation.includes("whistler") ||
        jobLocation.includes("squamish") ||
        jobLocation.includes("pemberton")
      );
    }

    if (clusterName.includes("fraser valley")) {
      return (
        jobLocation.includes("abbotsford") ||
        jobLocation.includes("chilliwack") ||
        jobLocation.includes("mission") ||
        jobLocation.includes("maple ridge") ||
        jobLocation.includes("pitt meadows")
      );
    }

    if (clusterName.includes("bowen island")) {
      return jobLocation.includes("bowen island");
    }

    return false;
  }

  /**
   * Step 2: Apply hybrid strategy (historical patterns + drive time minimization)
   */
  private async applyHybridOptimization(
    clusteredJobs: Map<string, JobOptimizationData[]>,
    historicalPatterns: HistoricalSchedulePatternType[],
  ): Promise<OptimizedScheduleGroup[]> {
    const groups: OptimizedScheduleGroup[] = [];

    for (const [clusterId, jobs] of Array.from(clusteredJobs.entries())) {
      if (jobs.length === 0) continue;

      const cluster = this.clusters.find((c) => c._id === clusterId);
      const clusterName = cluster?.clusterName || "Unassigned";
      const maxJobsPerDay =
        cluster?.constraints.maxJobsPerDay ||
        this.preferences!.globalSettings.maxJobsPerDay;

      console.log(`\n🎯 ${clusterName}: ${jobs.length} jobs`);

      // Group jobs by their historical patterns
      const jobsWithPatterns = jobs.map((job) => {
        const jobIdentifier = generateJobIdentifier(job.jobTitle, job.location);
        const pattern = historicalPatterns.find(
          (p) => p.jobIdentifier === jobIdentifier,
        );

        return { job, pattern };
      });

      // Sort by pattern confidence and historical preference
      jobsWithPatterns.sort((a, b) => {
        const aConfidence = a.pattern?.patterns.hourConfidence || 0;
        const bConfidence = b.pattern?.patterns.hourConfidence || 0;
        if (aConfidence !== bConfidence) return bConfidence - aConfidence;
        return a.job.dateDue.getTime() - b.job.dateDue.getTime();
      });

      // Group by preferred day of week
      const dayGroups = new Map<
        number,
        { job: JobOptimizationData; pattern?: HistoricalSchedulePatternType }[]
      >();

      jobsWithPatterns.forEach(({ job, pattern }, index) => {
        const preferredDay =
          pattern?.patterns.preferredDayOfWeek || 1 + (index % 5); // Cycle through Mon-Fri
        if (!dayGroups.has(preferredDay)) {
          dayGroups.set(preferredDay, []);
        }
        dayGroups.get(preferredDay)!.push({ job, pattern });
      });

      // Schedule each day group
      for (const [dayOfWeek, dayJobs] of Array.from(dayGroups.entries())) {
        for (let i = 0; i < dayJobs.length; i += maxJobsPerDay) {
          const batch = dayJobs.slice(i, i + maxJobsPerDay);
          const weeksOffset = Math.floor(i / maxJobsPerDay);
          const scheduleDate = this.getNextDateForDayOfWeek(
            dayOfWeek,
            weeksOffset,
          );

          // Skip this batch if no valid date found within range
          if (!scheduleDate) {
            console.log(
              `   ❌ Skipping ${batch.length} jobs for ${this.getDayName(dayOfWeek)} - no dates available within range`,
            );
            continue;
          }

          console.log(
            `   📅 ${this.getDayName(dayOfWeek)} ${format(scheduleDate, "MMM dd")}: ${batch.length} jobs`,
          );

          const optimizedJobs = batch.map(({ job, pattern }) => {
            const scheduledTime = this.calculateHistoricalTime(
              scheduleDate,
              pattern,
            );

            // Show what time each job is scheduled
            const hourStr = pattern?.patterns.preferredHour
              ? `${pattern.patterns.preferredHour}:00`
              : "9:00 (default)";
            console.log(`      ${job.jobTitle} → ${hourStr} UTC`);

            return {
              jobId: job.jobId,
              originalJob: job,
              scheduledTime,
              estimatedDuration:
                pattern?.patterns.averageDuration || job.estimatedDuration,
              driveTimeToPrevious: 0,
              driveTimeToNext: 0,
              orderInRoute: 0,
              confidence: pattern?.patterns.hourConfidence || 0.5,
              historicalPattern: pattern,
            };
          });

          groups.push({
            clusterId,
            clusterName,
            date: scheduleDate,
            jobs: optimizedJobs,
            totalDriveTime: 0,
            totalWorkTime: optimizedJobs.reduce(
              (sum, job) => sum + job.estimatedDuration,
              0,
            ),
            estimatedStartTime: scheduleDate,
            estimatedEndTime: scheduleDate,
            assignedTechnicians: [],
            routeOptimized: false,
          });
        }
      }
    }

    return groups;
  }

  /**
   * Step 3: Optimize routes within each cluster group
   */
  private async optimizeRoutes(
    groups: OptimizedScheduleGroup[],
  ): Promise<OptimizedScheduleGroup[]> {
    const optimizedGroups: OptimizedScheduleGroup[] = [];

    // Get starting point coordinates for depot calculations
    const startingPointAddress =
      this.preferences?.globalSettings.startingPointAddress;
    let startingPointCoords: LocationCoordinates | null = null;

    if (startingPointAddress) {
      startingPointCoords =
        await openRouteService.addressToCoordinates(startingPointAddress);
      if (startingPointCoords) {
        console.log(`🏢 Using starting point: ${startingPointAddress}`);
      }
    }

    for (const group of groups) {
      if (group.jobs.length <= 1) {
        // For single jobs, calculate depot travel time
        const job = group.jobs[0];
        let driveTimeFromDepot = 0;

        if (job && startingPointCoords) {
          const jobCoords = await this.getJobCoordinates(job.originalJob);
          if (jobCoords) {
            // Depot to job
            const depotToJobResult =
              await openRouteService.getDistanceBetweenPoints(
                startingPointCoords,
                jobCoords,
              );
            driveTimeFromDepot = Math.round(depotToJobResult.duration);
            console.log(
              `   🚗 Depot → ${job.originalJob.jobTitle}: ${driveTimeFromDepot} min`,
            );

            // Job back to depot (mandatory)
            const jobToDepotResult =
              await openRouteService.getDistanceBetweenPoints(
                jobCoords,
                startingPointCoords,
              );
            const jobToDepotTime = Math.round(jobToDepotResult.duration);
            driveTimeFromDepot += jobToDepotTime;
            console.log(
              `   🚗 ${job.originalJob.jobTitle} → Depot: ${jobToDepotTime} min`,
            );
          }
        }

        const estimatedStartTime = job?.scheduledTime || group.date;
        const estimatedEndTime = job
          ? new Date(
              job.scheduledTime.getTime() + job.estimatedDuration * 60000,
            )
          : group.date;

        optimizedGroups.push({
          ...group,
          estimatedStartTime,
          estimatedEndTime,
          totalDriveTime: driveTimeFromDepot,
          routeOptimized: true,
        });
        continue;
      }

      // Apply nearest neighbor TSP optimization to minimize drive time
      const sortedJobs = await this.optimizeJobSequenceNearestNeighbor(
        group.jobs,
        startingPointCoords,
      );

      // Calculate drive times including depot travel
      let totalDriveTime = 0;

      // Add drive time from depot to first job
      if (sortedJobs.length > 0 && startingPointCoords) {
        const firstJobCoords = await this.getJobCoordinates(
          sortedJobs[0]!.originalJob,
        );
        if (firstJobCoords) {
          const depotToFirstResult =
            await openRouteService.getDistanceBetweenPoints(
              startingPointCoords,
              firstJobCoords,
            );
          const depotToFirstTime = Math.round(depotToFirstResult.duration);
          sortedJobs[0]!.driveTimeToPrevious = depotToFirstTime;
          totalDriveTime += depotToFirstTime;
          console.log(
            `   🚗 Depot → ${sortedJobs[0]!.originalJob.jobTitle}: ${depotToFirstTime} min`,
          );
        }
      }

      // Calculate drive times between jobs using OpenRouteService
      for (let i = 0; i < sortedJobs.length; i++) {
        sortedJobs[i]!.orderInRoute = i + 1;

        if (i > 0) {
          const driveTime = await this.calculateDriveTime(
            sortedJobs[i - 1]!,
            sortedJobs[i]!,
          );
          sortedJobs[i]!.driveTimeToPrevious = driveTime;
          sortedJobs[i - 1]!.driveTimeToNext = driveTime;
          totalDriveTime += driveTime;
        }
      }

      // Add mandatory return-to-depot calculation
      if (sortedJobs.length > 0 && startingPointCoords) {
        const lastJobCoords = await this.getJobCoordinates(
          sortedJobs[sortedJobs.length - 1]!.originalJob,
        );
        if (lastJobCoords) {
          const lastToDepotResult =
            await openRouteService.getDistanceBetweenPoints(
              lastJobCoords,
              startingPointCoords,
            );
          const lastToDepotTime = Math.round(lastToDepotResult.duration);
          sortedJobs[sortedJobs.length - 1]!.driveTimeToNext = lastToDepotTime;
          totalDriveTime += lastToDepotTime;
          console.log(
            `   🚗 ${sortedJobs[sortedJobs.length - 1]!.originalJob.jobTitle} → Depot: ${lastToDepotTime} min`,
          );
        }
      }

      // Keep the historical scheduled times - don't override with work day start
      const estimatedStartTime = sortedJobs[0]?.scheduledTime || group.date;
      const lastJob = sortedJobs[sortedJobs.length - 1];
      const estimatedEndTime = lastJob
        ? new Date(
            lastJob.scheduledTime.getTime() + lastJob.estimatedDuration * 60000,
          )
        : group.date;

      optimizedGroups.push({
        ...group,
        jobs: sortedJobs,
        totalDriveTime,
        estimatedStartTime,
        estimatedEndTime,
        routeOptimized: true,
      });
    }

    return optimizedGroups;
  }

  /**
   * Nearest neighbor TSP optimization for job sequencing - OPTIMIZED VERSION
   */
  private async optimizeJobSequenceNearestNeighbor(
    jobs: OptimizedJob[],
    startingPointCoords: LocationCoordinates | null,
  ): Promise<OptimizedJob[]> {
    if (jobs.length <= 1) return jobs;

    console.log(
      `   🧭 Optimizing route for ${jobs.length} jobs using nearest neighbor TSP`,
    );

    // EFFICIENCY FIX: Batch calculate all coordinates and distance matrix once
    const jobCoords: (LocationCoordinates | null)[] = [];
    const coordsToJobs = new Map<number, OptimizedJob>();

    // Collect all coordinates in one pass
    for (let i = 0; i < jobs.length; i++) {
      const coords = await this.getJobCoordinates(jobs[i]!.originalJob);
      jobCoords.push(coords);
      if (coords) {
        coordsToJobs.set(i, jobs[i]!);
      }
    }

    // Filter out jobs without coordinates for matrix calculation
    const validCoords: Array<[number, number]> = [];
    const coordIndexToJobIndex = new Map<number, number>();
    let coordIndex = 0;

    for (let i = 0; i < jobCoords.length; i++) {
      if (jobCoords[i]) {
        const coords = jobCoords[i]!;
        validCoords.push([coords.longitude, coords.latitude]);
        coordIndexToJobIndex.set(coordIndex, i);
        coordIndex++;
      }
    }

    // Check if we can use the optimization distance matrix for all jobs
    const allJobsInOptimizationMatrix = this.distanceMatrix && 
      jobs.every(job => this.distanceMatrix!.locations.includes(job.originalJob.location));

    let distanceMatrix: number[][] = [];
    if (!allJobsInOptimizationMatrix && validCoords.length > 1) {
      try {
        console.log(
          `   📊 Calculating distance matrix for ${validCoords.length} locations (batch)`,
        );
        const matrixResult =
          await openRouteService.calculateDistanceMatrix(validCoords);
        distanceMatrix = matrixResult.durations;
        console.log(
          `   ✅ Distance matrix calculated - reduced from ${jobs.length * jobs.length} to 1 API call!`,
        );
      } catch (error) {
        console.warn(
          `   ⚠️ Distance matrix failed, falling back to individual calculations`,
        );
      }
    } else if (allJobsInOptimizationMatrix) {
      console.log(`   🗂️ Using optimization distance matrix for all ${jobs.length} jobs - skipping TSP matrix calculation`);
    }

    // Helper function to get distance between two jobs using cached optimization matrix or local matrix
    const getJobDistance = (jobIndex1: number, jobIndex2: number): number => {
      const job1Location = jobs[jobIndex1]!.originalJob.location;
      const job2Location = jobs[jobIndex2]!.originalJob.location;

      // First, try to use the cached optimization distance matrix
      if (this.distanceMatrix) {
        const optIndex1 = this.distanceMatrix.locations.indexOf(job1Location);
        const optIndex2 = this.distanceMatrix.locations.indexOf(job2Location);
        
        if (optIndex1 >= 0 && optIndex2 >= 0 && this.distanceMatrix.matrix.durations[optIndex1]?.[optIndex2] !== undefined) {
          const cachedDuration = this.distanceMatrix.matrix.durations[optIndex1]![optIndex2]!;
          console.log(`🗂️ Using cached duration: ${job1Location} → ${job2Location} = ${cachedDuration} min`);
          return cachedDuration;
        }
      }

      // Fallback to local TSP matrix if optimization matrix doesn't have this pair
      if (
        !jobCoords[jobIndex1] ||
        !jobCoords[jobIndex2] ||
        distanceMatrix.length === 0
      ) {
        return this.calculateTextualDistance(job1Location, job2Location);
      }

      // Find matrix indices for these jobs in the local TSP matrix
      let matrixIndex1 = -1,
        matrixIndex2 = -1;
      for (const [coordIdx, jobIdx] of coordIndexToJobIndex.entries()) {
        if (jobIdx === jobIndex1) matrixIndex1 = coordIdx;
        if (jobIdx === jobIndex2) matrixIndex2 = coordIdx;
      }

      if (matrixIndex1 >= 0 && matrixIndex2 >= 0) {
        const localDuration = distanceMatrix[matrixIndex1]?.[matrixIndex2] || Infinity;
        console.log(`📊 Using local TSP matrix: ${job1Location} → ${job2Location} = ${localDuration} min`);
        return localDuration;
      }

      return this.calculateTextualDistance(job1Location, job2Location);
    };

    // NOW run the TSP algorithm using cached distances
    const unvisited = jobs.map((_, index) => index); // Work with indices
    const optimizedSequence: OptimizedJob[] = [];

    // Start with the job that has the highest historical confidence or earliest preferred time
    let currentJobIndex = unvisited.reduce((bestIndex, jobIndex) => {
      const bestJob = jobs[bestIndex]!;
      const currentJob = jobs[jobIndex]!;

      const bestConfidence =
        bestJob.historicalPattern?.patterns.hourConfidence || 0;
      const jobConfidence =
        currentJob.historicalPattern?.patterns.hourConfidence || 0;

      if (jobConfidence > bestConfidence) return jobIndex;
      if (jobConfidence === bestConfidence) {
        return currentJob.scheduledTime < bestJob.scheduledTime
          ? jobIndex
          : bestIndex;
      }
      return bestIndex;
    });

    // Remove starting job from unvisited and add to sequence
    unvisited.splice(unvisited.indexOf(currentJobIndex), 1);
    optimizedSequence.push(jobs[currentJobIndex]!);

    // Apply nearest neighbor algorithm using cached distances
    while (unvisited.length > 0) {
      let nearestJobIndex = unvisited[0]!;
      let shortestDistance = getJobDistance(currentJobIndex, nearestJobIndex);

      for (const candidateJobIndex of unvisited) {
        const distance = getJobDistance(currentJobIndex, candidateJobIndex);
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestJobIndex = candidateJobIndex;
        }
      }

      // Move nearest job to optimized sequence
      unvisited.splice(unvisited.indexOf(nearestJobIndex), 1);
      optimizedSequence.push(jobs[nearestJobIndex]!);
      currentJobIndex = nearestJobIndex;
    }

    console.log(`   ✅ TSP optimization complete - route order:`);
    optimizedSequence.forEach((job, index) => {
      console.log(`      ${index + 1}. ${job.originalJob.jobTitle}`);
    });

    return optimizedSequence;
  }

  /**
   * Fallback textual distance calculation for locations without coordinates
   */
  private calculateTextualDistance(
    location1: string,
    location2: string,
  ): number {
    return OpenRouteService.estimateDriveTimeFallback(location1, location2);
  }

  /**
   * Calculate real drive time between two jobs using cached matrix or API
   */
  private async calculateDriveTime(
    job1: OptimizedJob,
    job2: OptimizedJob,
  ): Promise<number> {
    try {
      // Try to use cached distance matrix first
      if (this.distanceMatrix) {
        const index1 = this.distanceMatrix.locations.indexOf(job1.originalJob.location);
        const index2 = this.distanceMatrix.locations.indexOf(job2.originalJob.location);
        
        if (index1 >= 0 && index2 >= 0 && this.distanceMatrix.matrix.durations[index1]?.[index2] !== undefined) {
          const cachedDuration = this.distanceMatrix.matrix.durations[index1]![index2]!;
          console.log(`🗂️ Using cached duration: ${job1.originalJob.location} → ${job2.originalJob.location} = ${cachedDuration} min`);
          return cachedDuration;
        }
      }

      // Fall back to real-time API call
      const coords1 = await this.getJobCoordinates(job1.originalJob);
      const coords2 = await this.getJobCoordinates(job2.originalJob);

      if (!coords1 || !coords2) {
        return this.estimateDriveTimeFallback(job1, job2);
      }

      const result = await openRouteService.getDistanceBetweenPoints(
        coords1,
        coords2,
      );

      if (result.error) {
        console.warn(
          `OpenRouteService error for ${job1.originalJob.location} to ${job2.originalJob.location}: ${result.error}`,
        );
        return this.estimateDriveTimeFallback(job1, job2);
      }

      return Math.round(result.duration);
    } catch (error) {
      console.error("Drive time calculation error:", error);
      return this.estimateDriveTimeFallback(job1, job2);
    }
  }

  /**
   * Fallback drive time estimation when OpenRouteService is unavailable
   */
  private estimateDriveTimeFallback(
    job1: OptimizedJob,
    job2: OptimizedJob,
  ): number {
    // Use OpenRouteService fallback estimation
    return OpenRouteService.estimateDriveTimeFallback(
      job1.originalJob.location,
      job2.originalJob.location,
    );
  }

  /**
   * Get coordinates for a job location (with caching)
   */
  private locationCache = new Map<string, LocationCoordinates | null>();

  private async getJobCoordinates(
    job: JobOptimizationData,
  ): Promise<LocationCoordinates | null> {
    const cacheKey = job.location;

    // Check memory cache first
    if (this.locationCache.has(cacheKey)) {
      return this.locationCache.get(cacheKey) || null;
    }

    // Check if we have it in the optimization distance matrix
    if (this.distanceMatrix) {
      const locationIndex = this.distanceMatrix.locations.indexOf(job.location);
      if (locationIndex >= 0) {
        const [lng, lat] = this.distanceMatrix.coordinates[locationIndex]!;
        const coordinates: LocationCoordinates = {
          longitude: lng,
          latitude: lat,
          address: job.location,
        };
        this.locationCache.set(cacheKey, coordinates);
        return coordinates;
      }
    }

    try {
      // Last resort: individual geocoding call
      console.log(`📍 Individual geocoding for: ${job.location}`);
      const coordinates = await openRouteService.addressToCoordinates(
        job.location,
      );

      // Cache the result (even if null to avoid repeated failures)
      this.locationCache.set(cacheKey, coordinates);

      return coordinates;
    } catch (error) {
      console.error(`Geocoding error for ${job.location}:`, error);
      this.locationCache.set(cacheKey, null);
      return null;
    }
  }

  /**
   * Step 4: Resolve conflicts with existing schedules
   */
  private async resolveScheduleConflicts(
    groups: OptimizedScheduleGroup[],
  ): Promise<{
    finalGroups: OptimizedScheduleGroup[];
    conflictsResolved: number;
  }> {
    let conflictsResolved = 0;
    const finalGroups: OptimizedScheduleGroup[] = [];

    for (const group of groups) {
      // Check for conflicts with existing schedules
      const hasConflict = this.existingSchedules.some((existingSchedule) => {
        const existingDate = new Date(existingSchedule.startDateTime);
        return this.isSameDay(existingDate, group.date);
      });

      if (hasConflict) {
        // Try to reschedule to next available day
        const newDate = this.getNextAvailableDate(group.date);
        if (newDate) {
          // Update all job times for new date
          const updatedJobs = group.jobs.map((job) => ({
            ...job,
            scheduledTime: this.adjustTimeForNewDate(
              job.scheduledTime,
              newDate,
            ),
          }));

          finalGroups.push({
            ...group,
            date: newDate,
            jobs: updatedJobs,
            estimatedStartTime: this.adjustTimeForNewDate(
              group.estimatedStartTime,
              newDate,
            ),
            estimatedEndTime: this.adjustTimeForNewDate(
              group.estimatedEndTime,
              newDate,
            ),
          });
          conflictsResolved++;
        } else {
          // Could not reschedule - keep original
          finalGroups.push(group);
        }
      } else {
        finalGroups.push(group);
      }
    }

    return { finalGroups, conflictsResolved };
  }

  /**
   * Helper methods
   */
  private isDateAvailableForScheduling(date: Date): boolean {
    if (!this.adminControls?.schedulingControls) return true;

    const controls = this.adminControls.schedulingControls;

    // Check if day of week is excluded (use UTC day)
    const dayOfWeek = date.getUTCDay();
    if (controls.excludedDays?.includes(dayOfWeek)) {
      return false;
    }

    // Check if specific date is excluded (compare ISO date strings in UTC)
    const dateString = format(date, "yyyy-MM-dd");
    if (controls.excludedDates && controls.excludedDates.includes(dateString)) {
      return false;
    }

    // Check weekend policy (use UTC day)
    if (!controls.allowWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return false;
    }

    // Check if date is within optimization range
    if (controls.startDate) {
      const startDate = new Date(controls.startDate + "T00:00:00.000Z"); // Ensure UTC
      if (date < startDate) {
        return false;
      }
    }

    if (controls.endDate) {
      const endDate = new Date(controls.endDate + "T23:59:59.999Z"); // Ensure UTC
      if (date > endDate) {
        return false;
      }
    }

    return true;
  }

  private getNextAvailableDate(fromDate?: Date, daysOffset: number = 0): Date {
    const startDate = fromDate ? new Date(fromDate) : new Date();

    // Use date-fns for reliable date arithmetic
    let candidateDate = addDays(startDate, daysOffset + 1);

    // Find next available date according to admin controls
    while (!this.isDateAvailableForScheduling(candidateDate)) {
      candidateDate = addDays(candidateDate, 1);
    }

    return candidateDate;
  }

  private getNextDateForDayOfWeek(
    dayOfWeek: number,
    weeksOffset: number = 0,
  ): Date {
    const referenceDate = this.adminControls?.schedulingControls?.startDate
      ? new Date(
          this.adminControls.schedulingControls.startDate + "T00:00:00.000Z",
        )
      : new Date();

    const today = referenceDate.getUTCDay();
    const targetDay = dayOfWeek === 7 ? 0 : dayOfWeek;

    let daysUntilTarget = (targetDay - today + 7) % 7;
    if (daysUntilTarget === 0) daysUntilTarget = 7;

    let targetDate = addDays(referenceDate, daysUntilTarget);
    targetDate = addWeeks(targetDate, weeksOffset);

    // Simplified bounds checking
    let attempts = 0;
    const maxAttempts = 52;
    const endDateBoundary = this.adminControls?.schedulingControls?.endDate
      ? new Date(
          this.adminControls.schedulingControls.endDate + "T23:59:59.999Z",
        )
      : addWeeks(referenceDate, 52);

    while (
      !this.isDateAvailableForScheduling(targetDate) &&
      attempts < maxAttempts
    ) {
      targetDate = addWeeks(targetDate, 1);
      attempts++;

      if (targetDate > endDateBoundary) {
        // Try to find an earlier date within the range
        console.log(
          `   ⚠️ Date ${format(targetDate, "MMM dd")} outside range, trying earlier dates`,
        );

        // Search backwards from end boundary for an available date with same day of week
        let fallbackDate = new Date(endDateBoundary);
        for (let backDays = 0; backDays <= 30; backDays++) {
          fallbackDate = addDays(endDateBoundary, -backDays);
          if (
            fallbackDate.getUTCDay() === targetDay &&
            this.isDateAvailableForScheduling(fallbackDate)
          ) {
            console.log(
              `   ✅ Found alternative date: ${format(fallbackDate, "MMM dd")}`,
            );
            return fallbackDate;
          }
        }

        // If no alternative found, return null to indicate unschedulable
        console.log(
          `   ❌ No available dates found within range for day ${targetDay}`,
        );
        return null as any; // This will be handled by calling code
      }
    }

    if (attempts >= maxAttempts) {
      targetDate = addDays(referenceDate, daysUntilTarget);
      targetDate = addWeeks(targetDate, weeksOffset);
    }

    return targetDate;
  }

  private calculateHistoricalTime(
    date: Date,
    pattern?: HistoricalSchedulePatternType,
  ): Date {
    const scheduledTime = new Date(date);
    const preferredHour = pattern?.patterns.preferredHour || 9; // Default to 9 AM

    // Set time in UTC to match our storage pattern
    scheduledTime.setUTCHours(preferredHour, 0, 0, 0);

    return scheduledTime;
  }

  private getDayName(dayNumber: number): string {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (dayNumber === 7) return "Sun"; // Handle Sunday as 7
    return days[dayNumber] || "Unknown";
  }

  private parseTimeString(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(":").map(Number) as [number, number];
    return { hours, minutes };
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getUTCFullYear() === date2.getUTCFullYear() &&
      date1.getUTCMonth() === date2.getUTCMonth() &&
      date1.getUTCDate() === date2.getUTCDate()
    );
  }

  private adjustTimeForNewDate(originalTime: Date, newDate: Date): Date {
    const adjusted = new Date(newDate);
    adjusted.setUTCHours(
      originalTime.getUTCHours(),
      originalTime.getUTCMinutes(),
      originalTime.getUTCSeconds(),
    );
    return adjusted;
  }

  private calculateOptimizationMetrics(
    groups: OptimizedScheduleGroup[],
    totalJobsInput: number,
    conflictsResolved: number,
  ) {
    const totalDriveTime = groups.reduce(
      (sum, group) => sum + group.totalDriveTime,
      0,
    );
    const totalDays = groups.length;
    const totalScheduledJobs = groups.reduce(
      (sum, group) => sum + group.jobs.length,
      0,
    );

    return {
      totalDriveTime,
      averageJobsPerDay: totalDays > 0 ? totalScheduledJobs / totalDays : 0,
      utilizationRate:
        totalJobsInput > 0 ? totalScheduledJobs / totalJobsInput : 0,
      conflictsResolved,
    };
  }
}
