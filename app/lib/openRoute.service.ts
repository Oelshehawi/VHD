import connectMongo from "./connect";
import { LocationGeocode } from "../../models/reactDataSchema";

// Types from the API routes
interface OpenRouteGeocodeResponse {
  features: Array<{
    geometry: {
      coordinates: [number, number]; // [lng, lat]
    };
    properties: {
      label: string;
      confidence: number;
      accuracy: string;
    };
  }>;
}

interface OpenRouteMatrixResponse {
  durations: number[][]; // seconds
  distances: number[][]; // meters
  sources: Array<{
    location: [number, number];
  }>;
  destinations: Array<{
    location: [number, number];
  }>;
}

export interface GeocodeResult {
  address: string;
  coordinates: [number, number]; // [lng, lat]
  cached: boolean;
  confidence?: number;
}

export interface DistanceMatrixResult {
  durations: number[][]; // Matrix of durations in minutes
  distances: number[][]; // Matrix of distances in kilometers
  sources: Array<[number, number]>; // [lng, lat] pairs
  destinations: Array<[number, number]>; // [lng, lat] pairs
}

// Simple address normalization function
function normalizeAddress(address: string): string {
  return address.toLowerCase().trim().replace(/\s+/g, ' ');
}
class OpenRouteService {

  /**
   * Geocode multiple addresses to GPS coordinates
   * Direct implementation without HTTP requests to own API
   */
  async geocodeAddresses(addresses: string[]): Promise<GeocodeResult[]> {
    await connectMongo();

    const results: GeocodeResult[] = [];

    for (const address of addresses) {
      const normalizedAddress = normalizeAddress(address);

      // Check cache first
      const cached = await LocationGeocode.findOne({
        normalizedAddress,
      });

      if (cached) {
        console.log(`📍 Using cached coordinates for: ${address}`);
        results.push({
          address,
          coordinates: cached.coordinates as [number, number],
          cached: true,
        });
        continue;
      }

      // Make OpenRouteService API call
      console.log(`🌐 Geocoding new address: ${address}`);

      try {
        const openRouteResponse = await fetch(
          `https://api.openrouteservice.org/geocode/search?api_key=${process.env.OPENROUTE_API_KEY}&text=${encodeURIComponent(address)}&boundary.country=CA&size=1`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!openRouteResponse.ok) {
          console.error(`❌ OpenRouteService geocoding failed for: ${address}`);
          continue;
        }

        const data: OpenRouteGeocodeResponse = await openRouteResponse.json();

        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          if (!feature) continue;

          const coordinates = feature.geometry.coordinates as [number, number];
          const confidence = feature.properties.confidence;

          // Save to cache
          await LocationGeocode.create({
            address,
            normalizedAddress,
            coordinates,
            lastGeocoded: new Date(),
            source: "openroute",
          });

          results.push({
            address,
            coordinates,
            cached: false,
            confidence,
          });

          console.log(
            `✅ Geocoded and cached: ${address} → [${coordinates[1]}, ${coordinates[0]}]`,
          );
        } else {
          console.error(`❌ No geocoding results for: ${address}`);
        }

        // Rate limiting: small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error geocoding ${address}:`, error);
      }
    }

    const cachedCount = results.filter((r) => r.cached).length;
    const newCount = results.length - cachedCount;

    console.log(
      `📍 Geocoding complete: ${cachedCount} cached, ${newCount} new`,
    );

    return results;
  }

  /**
   * Calculate distance matrix between coordinates
   * Direct implementation without HTTP requests to own API
   */
  async calculateDistanceMatrix(
    coordinates: Array<[number, number]>,
  ): Promise<DistanceMatrixResult> {
    try {
      if (!coordinates || !Array.isArray(coordinates)) {
        throw new Error("Coordinates array required");
      }

      if (coordinates.length > 50) {
        throw new Error("Maximum 50 coordinates allowed per request");
      }

      console.log(
        `🗺️ Calculating distance matrix for ${coordinates.length} locations`,
      );

      // OpenRouteService Matrix API payload
      const payload = {
        locations: coordinates, // [lng, lat] format
        sources: coordinates.map((_, index) => index),
        destinations: coordinates.map((_, index) => index),
        metrics: ["duration", "distance"],
        units: "m", // meters for distance
      };

      const openRouteResponse = await fetch(
        `https://api.openrouteservice.org/v2/matrix/driving-car`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: process.env.OPENROUTE_API_KEY!,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!openRouteResponse.ok) {
        const errorText = await openRouteResponse.text();
        console.error("❌ OpenRouteService matrix API error:", errorText);
        throw new Error(`Distance matrix calculation failed: ${errorText}`);
      }

      const data: OpenRouteMatrixResponse = await openRouteResponse.json();

      // Convert to more user-friendly units
      const result: DistanceMatrixResult = {
        durations: data.durations.map(
          (row) => row.map((seconds) => Math.round(seconds / 60)), // Convert to minutes
        ),
        distances: data.distances.map(
          (row) => row.map((meters) => Math.round((meters / 1000) * 100) / 100), // Convert to km, round to 2 decimals
        ),
        sources: coordinates,
        destinations: coordinates,
      };

      console.log(`✅ Distance matrix calculated successfully`);
      console.log(
        `   Max duration: ${Math.max(...result.durations.flat())} minutes`,
      );
      console.log(`   Max distance: ${Math.max(...result.distances.flat())} km`);

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
