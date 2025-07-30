import { NextApiRequest, NextApiResponse } from "next";
import { LocationGeocode } from "../../../models/reactDataSchema";
import dbConnect from "../../../app/lib/connect";
// Simple address normalization function
function normalizeAddress(address: string): string {
  return address.toLowerCase().trim().replace(/\s+/g, ' ');
}

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

export interface GeocodeResult {
  address: string;
  coordinates: [number, number]; // [lng, lat]
  cached: boolean;
  confidence?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { addresses }: { addresses: string[] } = req.body;

    if (!addresses || !Array.isArray(addresses)) {
      return res.status(400).json({ error: "Addresses array required" });
    }

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
    }

    res.status(200).json({ results });
  } catch (error) {
    console.error("Geocoding API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
