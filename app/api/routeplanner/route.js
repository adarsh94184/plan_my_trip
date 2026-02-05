// Edge runtime for faster response
export const runtime = 'edge';

const GEOAPIFY_API_KEY = process.env.GEOCODING;

/**
 * Geoapify Route Planner API (VRP - Vehicle Routing Problem)
 * Optimize routes with multiple stops, vehicles, and constraints
 * 
 * Request body (POST):
 * {
 *   "mode": "drive" | "truck" | "bicycle" | "walk",
 *   "agents": [
 *     {
 *       "start_location": [lon, lat],
 *       "end_location": [lon, lat], // optional
 *       "time_window": [start_time, end_time] // optional
 *     }
 *   ],
 *   "jobs": [
 *     {
 *       "location": [lon, lat],
 *       "duration": 300, // seconds
 *       "time_window": [start_time, end_time] // optional
 *     }
 *   ],
 *   "options": {
 *     "balance": true, // balance load between agents
 *     "min_stops": 1 // minimum stops per agent
 *   }
 * }
 * 
 * Returns optimized routes with sequences, times, and distances
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
        const { mode = 'drive', agents, jobs, options = {} } = body;

        if (!agents || !Array.isArray(agents) || agents.length === 0) {
            return Response.json(
                { error: 'Missing or invalid agents array' },
                { status: 400 }
            );
        }

        if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
            return Response.json(
                { error: 'Missing or invalid jobs array' },
                { status: 400 }
            );
        }

        // Build Geoapify Route Planner request
        const url = `https://api.geoapify.com/v1/routeplanner?apiKey=${GEOAPIFY_API_KEY}`;

        const requestBody = {
            mode,
            agents: agents.map(agent => ({
                start_location: agent.start_location,
                ...(agent.end_location && { end_location: agent.end_location }),
                ...(agent.time_window && { time_window: agent.time_window }),
            })),
            jobs: jobs.map(job => ({
                location: job.location,
                duration: job.duration || 300, // default 5 minutes
                ...(job.time_window && { time_window: job.time_window }),
                ...(job.id && { id: job.id }),
            })),
            ...(options.balance !== undefined && { balance: options.balance }),
            ...(options.min_stops && { min_stops: options.min_stops }),
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Geoapify API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Enhance response with formatted data
        const result = {
            ...data,
            formatted: formatRoutePlannerResults(data),
        };

        return Response.json(result, {
            headers: {
                'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
            },
        });
    } catch (error) {
        console.error('Route Planner API error:', error);
        return Response.json(
            { error: 'Failed to plan routes', details: error.message },
            { status: 500 }
        );
    }
}

function formatRoutePlannerResults(data) {
    if (!data.features || data.features.length === 0) return null;

    return data.features.map((feature, idx) => {
        const props = feature.properties;

        return {
            agentIndex: idx,
            totalDistance: formatDistance(props.distance),
            totalTime: formatTime(props.time),
            stops: props.waypoints?.length || 0,
            distanceRaw: props.distance,
            timeRaw: props.time,
            waypoints: props.waypoints?.map(wp => ({
                location: wp.location,
                arrivalTime: wp.arrival_time,
                departureTime: wp.departure_time,
                waitingTime: wp.waiting_time,
            })) || [],
        };
    });
}

function formatDistance(meters) {
    if (!meters) return 'N/A';

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
