
import { NextApiRequest, NextApiResponse } from "next";

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

export interface DistanceMatrixResult {
  durations: number[][]; // Matrix of durations in minutes
  distances: number[][]; // Matrix of distances in kilometers
  sources: Array<[number, number]>; // [lng, lat] pairs
  destinations: Array<[number, number]>; // [lng, lat] pairs
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { coordinates }: { coordinates: Array<[number, number]> } = req.body;

    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({ error: "Coordinates array required" });
    }

    if (coordinates.length > 50) {
      return res.status(400).json({
        error: "Maximum 50 coordinates allowed per request",
      });
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
      return res.status(500).json({
        error: "Distance matrix calculation failed",
        details: errorText,
      });
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

    res.status(200).json(result);
  } catch (error) {
    console.error("Distance matrix API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
