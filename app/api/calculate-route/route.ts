// app/api/calculate-routes/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

const workAddressCache = new Map<string, string[]>();
const routeCache = new Map<string, { distance: string; duration: string }>();

function createCacheKey(origin: string, destination: string): string {
  return `${origin}|${destination}`;
}

async function getUniqueWorkAddresses(supabase: any): Promise<string[]> {
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

    const uniqueAddresses : string[] = [...new Set<string>(roommates.map((r: any) => r.work_address))];
    workAddressCache.set(cacheKey, uniqueAddresses);
    
    return uniqueAddresses;
  } catch (error) {
    console.error('Error fetching work addresses:', error);
    throw error;
  }
}

async function calculateRoute(origin: string, destination: string): Promise<{ distance: string; duration: string }> {
  const cacheKey = createCacheKey(origin, destination);
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  console.log('read apiKey', apiKey)

  if (!apiKey) {
    throw new Error('Google Maps API key not configured');
  }

  const now = new Date();
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(8, 0, 0, 0);
  const departureTime = Math.floor(nextMonday.getTime() / 1000);

  const params = new URLSearchParams({
    origin: origin,
    destination: destination,
    mode: 'transit',
    departure_time: departureTime.toString(),
    key: apiKey,
    language: 'en',
    region: 'de',
    fields: 'routes.legs.duration'
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
      throw new Error(`Google Maps API returned status: ${data.status}`);
    }

    const route = data.routes[0];
    const leg = route.legs[0];
    
    const result = {
      distance: leg.distance.text,
      duration: leg.duration.text
    };

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

    const supabase = await createClient();

    const workAddresses = await getUniqueWorkAddresses(supabase);

    const routePromises = workAddresses.map(async (workAddress) => {
      try {
        const route = await calculateRoute(apartmentAddress, workAddress);
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
      // Extract minutes from duration strings (e.g., "28 min" -> 28)
      const durations = validRoutes.map(r => {
        const match = r.duration.match(/(\d+)\s*min/);
        return match ? parseInt(match[1]) : 0;
      });

      if (durations.length > 0 && durations.every(d => d > 0)) {
        const maxDuration = Math.max(...durations);
        const minDuration = Math.min(...durations);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

        const spread = maxDuration - minDuration;
        const spreadRatio = spread / avgDuration;
        
        fairnessScore = Math.max(0, Math.min(100, Math.round(100 * (1 - spreadRatio))));
      }
    }

    return NextResponse.json({
      routes,
      fairnessScore
    });

  } catch (error) {
    console.error('Error in calculate-routes API:', error);
    return NextResponse.json(
      { error: 'Failed to calculate routes' },
      { status: 500 }
    );
  }
}