// Edge runtime for faster response
export const runtime = 'edge';

const GEOAPIFY_API_KEY = process.env.GEOCODING;

/**
 * Geoapify Routing API
 * Calculate routes with turn-by-turn instructions between locations
 * 
 * Request body (POST):
 * {
 *   "waypoints": [
 *     { "lat": 40.7128, "lon": -74.0060 },
 *     { "lat": 51.5074, "lon": -0.1278 }
 *   ],
 *   "mode": "drive" | "truck" | "bicycle" | "walk" | "transit",
 *   "units": "metric" | "imperial",
 *   "details": ["instruction_details", "route_details"] // optional
 * }
 * 
 * Returns detailed route with turn-by-turn instructions, distance, duration
 */
export async function POST(request) {
    if (!GEOAPIFY_API_KEY) {
        return Response.json(
            { error: 'Geoapify API key not configured' },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const { waypoints, mode = 'drive', units = 'metric', details = [] } = body;

        if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
            return Response.json(
                { error: 'At least 2 waypoints required' },
                { status: 400 }
            );
        }

        // Build waypoints string: lat1,lon1|lat2,lon2|...
        const waypointsStr = waypoints
            .map(w => `${w.lat},${w.lon}`)
            .join('|');

        // Build Geoapify Routing URL
        let url = `https://api.geoapify.com/v1/routing?waypoints=${waypointsStr}&mode=${mode}&apiKey=${GEOAPIFY_API_KEY}`;

        if (details.length > 0) {
            url += `&details=${details.join(',')}`;
        }

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Geoapify API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Enhance response with formatted data
        const result = {
            ...data,
            units,
            formatted: formatRouteData(data, units),
        };

        return Response.json(result, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            },
        });
    } catch (error) {
        console.error('Routing API error:', error);
        return Response.json(
            { error: 'Failed to calculate route', details: error.message },
            { status: 500 }
        );
    }
}

function formatRouteData(data, units) {
    if (!data.features || data.features.length === 0) return null;

    const route = data.features[0];
    const props = route.properties;

    return {
        distance: formatDistance(props.distance, units),
        duration: formatTime(props.time),
        distanceRaw: props.distance,
        durationRaw: props.time,
        legs: props.legs?.map(leg => ({
            distance: formatDistance(leg.distance, units),
            duration: formatTime(leg.time),
            steps: leg.steps?.map(step => ({
                instruction: step.instruction?.text || 'Continue',
                distance: formatDistance(step.distance, units),
                duration: formatTime(step.time),
                type: step.type,
                distanceRaw: step.distance,
                durationRaw: step.time,
            })) || [],
        })) || [],
    };
}

function formatDistance(meters, units) {
    if (!meters) return 'N/A';

    if (units === 'imperial') {
        const miles = meters * 0.000621371;
        return miles < 0.1
            ? `${Math.round(meters * 3.28084)} ft`
            : `${miles.toFixed(1)} mi`;
    }

    return meters < 1000
        ? `${Math.round(meters)} m`
        : `${(meters / 1000).toFixed(1)} km`;
}

function formatTime(seconds) {
    if (!seconds) return 'N/A';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}
