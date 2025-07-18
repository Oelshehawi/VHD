import { GeocodeResult } from "../../pages/api/geocode";
import { DistanceMatrixResult } from "../../pages/api/distance-matrix";

export interface LocationCoordinates {
  longitude: number;
  latitude: number;
  address?: string;
}

export interface DistanceResult {
  distance: number; // in kilometers
  duration: number; // in minutes
  error?: string;
}

class OpenRouteService {
  private readonly baseURL: string;

  constructor() {
    // Use relative URLs for API calls within the same app
    this.baseURL =
      process.env.NODE_ENV === "production"
        ? "https://vhd-psi.vercel.app" // Replace with your actual domain
        : "http://localhost:3000";
  }

  /**
   * Geocode multiple addresses to GPS coordinates
   * Uses caching via our API endpoint
   */
  async geocodeAddresses(addresses: string[]): Promise<GeocodeResult[]> {
    try {
      console.log(`🗺️ Geocoding ${addresses.length} addresses...`);

      console.log(addresses);
      const response = await fetch(`${this.baseURL}/api/geocode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ addresses }),
      });

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const { results }: { results: GeocodeResult[] } = await response.json();

      const cachedCount = results.filter((r) => r.cached).length;
      const newCount = results.length - cachedCount;

      console.log(
        `📍 Geocoding complete: ${cachedCount} cached, ${newCount} new`,
      );

      return results;
    } catch (error) {
      console.error("❌ Geocoding error:", error);
      throw error;
    }
  }

  /**
   * Calculate distance matrix between coordinates
   */
  async calculateDistanceMatrix(
    coordinates: Array<[number, number]>,
  ): Promise<DistanceMatrixResult> {
    try {
      console.log(
        `🗺️ Calculating distance matrix for ${coordinates.length} locations...`,
      );

      const response = await fetch(`${this.baseURL}/api/distance-matrix`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coordinates }),
      });

      if (!response.ok) {
        throw new Error(`Distance matrix failed: ${response.statusText}`);
      }

      const result: DistanceMatrixResult = await response.json();

      console.log(`✅ Distance matrix calculated successfully`);

      return result;
    } catch (error) {
      console.error("❌ Distance matrix error:", error);
      throw error;
    }
  }

  /**
   * Get distance between two specific coordinates
   */
  async getDistanceBetweenPoints(
    coord1: LocationCoordinates,
    coord2: LocationCoordinates,
  ): Promise<DistanceResult> {
    try {
      const coordinates: Array<[number, number]> = [
        [coord1.longitude, coord1.latitude],
        [coord2.longitude, coord2.latitude],
      ];

      const matrix = await this.calculateDistanceMatrix(coordinates);

      return {
        distance: matrix.distances[0]?.[1] || 0, // km
        duration: matrix.durations[0]?.[1] || 0, // minutes
      };
    } catch (error) {
      console.error("❌ Point-to-point distance error:", error);
      return {
        distance: 0,
        duration: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Convert an address to coordinates using geocoding
   */
  async addressToCoordinates(
    address: string,
  ): Promise<LocationCoordinates | null> {
    try {
      const results = await this.geocodeAddresses([address]);

      if (results.length > 0) {
        const [lng, lat] = results[0]?.coordinates || [0, 0];
        return {
          longitude: lng,
          latitude: lat,
          address,
        };
      }

      return null;
    } catch (error) {
      console.error(`❌ Address geocoding failed for: ${address}`, error);
      return null;
    }
  }

  /**
   * Utility: Convert minutes to hours and minutes string
   */
  static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  /**
   * Utility: Convert kilometers to a readable distance string
   */
  static formatDistance(kilometers: number): string {
    if (kilometers < 1) {
      return `${Math.round(kilometers * 1000)}m`;
    }
    return `${kilometers.toFixed(1)}km`;
  }

  /**
   * Estimate drive time fallback when API fails
   */
  static estimateDriveTimeFallback(
    location1: string,
    location2: string,
  ): number {
    // Simple heuristic based on location similarity
    const location1Lower = location1.toLowerCase();
    const location2Lower = location2.toLowerCase();

    console.log("we are estimating drive time fallback");
    // Same city/area - shorter drive
    const sameCity = ["vancouver", "burnaby", "richmond", "surrey"].some(
      (city) => location1Lower.includes(city) && location2Lower.includes(city),
    );

    if (sameCity) {
      return Math.floor(Math.random() * 20) + 15; // 15-35 minutes
    }

    // Different areas - longer drive
    return Math.floor(Math.random() * 30) + 30; // 30-60 minutes
  }
}

// Export singleton instance
export const openRouteService = new OpenRouteService();
export default openRouteService;

// Export class for static method access
export { OpenRouteService };
