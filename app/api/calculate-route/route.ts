// app/api/calculate-route/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Cache for work addresses, geocoded coordinates, and route calculations
const workAddressCache = new Map<string, string[]>();
const geocodeCache = new Map<string, { lat: number; lng: number }>();
const routeCache = new Map<string, { distance: string; duration: string }>();

// Helper function to create cache key
function createCacheKey(origin: string, destination: string): string {
  return `${origin}|${destination}`;
}

// Helper function to geocode an address
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  // Check cache first
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address)!;
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const params = new URLSearchParams({
    address: address,
    key: apiKey,
    region: 'de', // Germany region bias
    language: 'en'
  });

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error(`Geocoding failed for address: ${address}`);
    }

    const location = data.results[0].geometry.location;
    const coordinates = { lat: location.lat, lng: location.lng };
    
    // Cache the result
    geocodeCache.set(address, coordinates);
    
    console.log(`Geocoded ${address} to:`, coordinates);
    return coordinates;
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
}

// Helper function to get unique work addresses from Supabase
async function getUniqueWorkAddresses(supabase: any): Promise<string[]> {
  // Check cache first
  const cacheKey = 'work_addresses';
  if (workAddressCache.has(cacheKey)) {
    return workAddressCache.get(cacheKey)!;
  }

  try {
    const { data: roommates, error } = await supabase
      .from('roommates')
      .select('work_address')
      .not('work_address', 'is', null);

    if (error) throw error;

    // Get unique work addresses
    const uniqueAddresses = [...new Set<string>(roommates.map((r: any) => r.work_address))];
    
    // Cache the result
    workAddressCache.set(cacheKey, uniqueAddresses);
    
    return uniqueAddresses;
  } catch (error) {
    console.error('Error fetching work addresses:', error);
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
    throw new Error('Google Maps API key not configured');
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
    mode: 'transit',
    departure_time: departureTime.toString(),
    key: apiKey,
    language: 'en',
    region: 'de',
    // Request alternatives to see if there are better routes
    alternatives: 'true',
    units: 'metric',
    // Add transit preferences
    transit_mode: 'bus|subway|train|tram|rail',
    transit_routing_preference: 'fewer_transfers'
  });

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      console.error('Directions API error:', data);
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
    console.log(`- Duration value: ${leg.duration.value} seconds (${leg.duration.value / 60} minutes)`);
    console.log(`- Duration text: ${leg.duration.text}`);
    console.log(`- Distance: ${leg.distance.text}`);
    if (leg.departure_time) {
      console.log(`- Departure: ${new Date(leg.departure_time.value * 1000).toLocaleString()}`);
    }
    if (leg.arrival_time) {
      console.log(`- Arrival: ${new Date(leg.arrival_time.value * 1000).toLocaleString()}`);
    }
    
    const result = {
      distance: leg.distance.text,
      duration: leg.duration.text
    };

    console.log(`Route from ${originAddress} to ${destAddress}:`, result);

    // Cache the result
    routeCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Error calculating route:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { apartmentAddress } = await request.json();

    if (!apartmentAddress) {
      return NextResponse.json(
        { error: 'Apartment address is required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Get unique work addresses
    const workAddresses = await getUniqueWorkAddresses(supabase);

    // Geocode the apartment address first
    let apartmentCoords;
    try {
      apartmentCoords = await geocodeAddress(apartmentAddress);
    } catch (error) {
      console.error('Failed to geocode apartment address:', error);
      return NextResponse.json(
        { error: 'Failed to geocode apartment address. Please check the address format.' },
        { status: 400 }
      );
    }

    // Calculate routes for each unique work address
    const routePromises = workAddresses.map(async (workAddress) => {
      try {
        // Geocode work address
        const workCoords = await geocodeAddress(workAddress);
        
        // Calculate route using coordinates
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
          status: 'completed' as const
        };
      } catch (error) {
        console.error(`Error calculating route to ${workAddress}:`, error);
        return {
          destination: workAddress,
          distance: 'Error',
          duration: 'Error',
          status: 'error' as const
        };
      }
    });

    const routes = await Promise.all(routePromises);

    // Calculate fairness score based on travel times
    const validRoutes = routes.filter(r => r.status === 'completed');
    let fairnessScore = 0;

    if (validRoutes.length > 0) {
      // Extract minutes from duration strings (e.g., "28 min" -> 28, "1 hour 10 mins" -> 70)
      const durations = validRoutes.map(r => {
        const duration = r.duration;
        let totalMinutes = 0;
        
        // Match hours
        const hourMatch = duration.match(/(\d+)\s*hour/i);
        if (hourMatch) {
          totalMinutes += parseInt(hourMatch[1]) * 60;
        }
        
        // Match minutes
        const minMatch = duration.match(/(\d+)\s*min/i);
        if (minMatch) {
          totalMinutes += parseInt(minMatch[1]);
        }
        
        return totalMinutes;
      });

      if (durations.length > 0 && durations.every(d => d > 0)) {
        const maxDuration = Math.max(...durations);
        const minDuration = Math.min(...durations);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        
        // Calculate fairness score (100 = perfectly fair, 0 = very unfair)
        // Based on the spread of commute times
        const spread = maxDuration - minDuration;
        const spreadRatio = spread / avgDuration;
        
        // Score decreases as spread increases
        fairnessScore = Math.max(0, Math.min(100, Math.round(100 * (1 - spreadRatio))));
      }
    }

    return NextResponse.json({
      routes,
      fairnessScore
    });

  } catch (error) {
    console.error('Error in calculate-route API:', error);
    return NextResponse.json(
      { error: 'Failed to calculate routes' },
      { status: 500 }
    );
  }
}