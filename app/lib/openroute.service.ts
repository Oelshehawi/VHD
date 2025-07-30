import { GeocodeResult } from "../../pages/api/geocode";
import { DistanceMatrixResult } from "../../pages/api/distance-matrix";



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




}

// Export singleton instance
export const openRouteService = new OpenRouteService();
export default openRouteService;

// Export class for static method access
export { OpenRouteService };
