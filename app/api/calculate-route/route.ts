// app/api/calculate-route/route.ts
import { NextResponse } from "next/server";

// Cache for work addresses, geocoded coordinates, and route calculations
const geocodeCache = new Map<string, { lat: number; lng: number }>();
const routeCache = new Map<string, { distance: string; duration: string }>();

// Helper function to create cache key
function createCacheKey(origin: string, destination: string): string {
  return `${origin}|${destination}`;
}

// Helper function to geocode an address
async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number }> {
  // Check cache first
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address)!;
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Google Maps API key not configured");
  }

  const params = new URLSearchParams({
    address: address,
    key: apiKey,
    region: "de", // Germany region bias
    language: "en",
  });

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      throw new Error(`Geocoding failed for address: ${address}`);
    }

    const location = data.results[0].geometry.location;
    const coordinates = { lat: location.lat, lng: location.lng };

    // Cache the result
    geocodeCache.set(address, coordinates);

    console.log(`Geocoded ${address} to:`, coordinates);
    return coordinates;
  } catch (error) {
    console.error("Error geocoding address:", error);
    throw error;
  }
}

// Helper function to calculate route using coordinates
async function calculateRoute(
  originCoords: { lat: number; lng: number },
  destCoords: { lat: number; lng: number },
  originAddress: string,
  destAddress: string
): Promise<{ distance: string; duration: string }> {
  // Check cache first using addresses as key
  const cacheKey = createCacheKey(originAddress, destAddress);
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Google Maps API key not configured");
  }

  // Calculate departure time - for now, use current time + 5 minutes
  // This gives more realistic current transit options
  const now = new Date();
  const departureTime = Math.floor((now.getTime() + 5 * 60 * 1000) / 1000);

  // Alternative: Still use Monday 8 AM but add a comment
  // const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  // const nextMonday = new Date(now);
  // nextMonday.setDate(now.getDate() + daysUntilMonday);
  // nextMonday.setHours(8, 0, 0, 0);
  // const departureTime = Math.floor(nextMonday.getTime() / 1000);

  const params = new URLSearchParams({
    origin: `${originCoords.lat},${originCoords.lng}`,
    destination: `${destCoords.lat},${destCoords.lng}`,
    mode: "transit",
    departure_time: departureTime.toString(),
    key: apiKey,
    language: "en",
    region: "de",
    // Request alternatives to see if there are better routes
    alternatives: "true",
    units: "metric",
    // Add transit preferences
    transit_mode: "bus|subway|train|tram|rail",
    transit_routing_preference: "fewer_transfers",
  });

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.routes || data.routes.length === 0) {
      console.error("Directions API error:", data);
      throw new Error(`Google Maps API returned status: ${data.status}`);
    }

    // Look through all routes and pick the best one
    let bestRoute = data.routes[0];
    let bestDuration = bestRoute.legs[0].duration.value;

    for (const route of data.routes) {
      if (route.legs[0].duration.value < bestDuration) {
        bestRoute = route;
        bestDuration = route.legs[0].duration.value;
      }
    }

    // Extract only the necessary data
    const leg = bestRoute.legs[0];

    // Log detailed information for debugging
    console.log(`Route details for ${originAddress} to ${destAddress}:`);
    console.log(
      `- Duration value: ${leg.duration.value} seconds (${leg.duration.value / 60} minutes)`
    );
    console.log(`- Duration text: ${leg.duration.text}`);
    console.log(`- Distance: ${leg.distance.text}`);
    if (leg.departure_time) {
      console.log(
        `- Departure: ${new Date(leg.departure_time.value * 1000).toLocaleString()}`
      );
    }
    if (leg.arrival_time) {
      console.log(
        `- Arrival: ${new Date(leg.arrival_time.value * 1000).toLocaleString()}`
      );
    }

    const result = {
      distance: leg.distance.text,
      duration: leg.duration.text,
    };

    console.log(`Route from ${originAddress} to ${destAddress}:`, result);

    // Cache the result
    routeCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error("Error calculating route:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { apartmentAddress } = await request.json();

    if (!apartmentAddress) {
      return NextResponse.json(
        { error: "Apartment address is required" },
        { status: 400 }
      );
    }

    // Geocode the apartment address first
    let apartmentCoords;
    try {
      apartmentCoords = await geocodeAddress(apartmentAddress);
    } catch (error) {
      console.error("Failed to geocode apartment address:", error);
      return NextResponse.json(
        {
          error:
            "Failed to geocode apartment address. Please check the address format.",
        },
        { status: 400 }
      );
    }

    const workAddresses = [
      "Lichtenbergstraße 8, 85748 Garching bei München, Germany",
      "TUM School of Life Sciences, Alte Akademie 8, 85354 Freising, Germany",
      "Cliniserve Gmbh, Werinherstraße 2, 81541 München, Germany",
    ];

    const weightage = [1, 1, 1];

    // Calculate routes for each unique work address
    const routePromises = workAddresses.map(async (workAddress) => {
      const workCoords = await geocodeAddress(workAddress);
      console.log(`Coords of ${workAddress} : ${workCoords}`);

      const route = await calculateRoute(
        apartmentCoords,
        workCoords,
        apartmentAddress,
        workAddress
      );

      return {
        destination: workAddress,
        distance: route.distance,
        duration: route.duration,
      };
    });
    const routes = await Promise.all(routePromises);

    const durations = routes.map(({ duration }) => {
      let totalMinutes = 0;

      const hourMatch = duration.match(/(\d+)\s*hour/i);
      if (hourMatch) {
        totalMinutes += parseInt(hourMatch[1]) * 60;
      }

      const minMatch = duration.match(/(\d+)\s*min/i);
      if (minMatch) {
        totalMinutes += parseInt(minMatch[1]);
      }

      return totalMinutes;
    });

    const weightedDurations = durations.map(
      (duration, index) => duration * weightage[index]
    );
    const totalWeight = weightage.reduce((sum, weight) => sum + weight, 0);
    const weightedAvgDuration =
      weightedDurations.reduce((sum, wd) => sum + wd, 0) / totalWeight;

    // Calculate weighted variance for fairness
    const weightedVariance =
      durations.reduce((variance, duration, index) => {
        const diff = duration - weightedAvgDuration;
        return variance + weightage[index] * diff * diff;
      }, 0) / totalWeight;

    const weightedStdDev = Math.sqrt(weightedVariance);

    // Fairness score: lower standard deviation relative to average = higher fairness
    const coefficientOfVariation = weightedStdDev / weightedAvgDuration;
    const fairnessScore = Math.max(
      0,
      Math.min(100, Math.round(100 * (1 - coefficientOfVariation)))
    );

    return NextResponse.json({
      routes,
      mean: Number(Math.round(weightedAvgDuration)),
      variance: weightedVariance,
      fairnessScore
    });
  } catch (error) {
    console.error("Error in calculate-route API:", error);
    return NextResponse.json(
      { error: "Failed to calculate routes" },
      { status: 500 }
    );
  }
}
