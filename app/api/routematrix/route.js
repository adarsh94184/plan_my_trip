// Edge runtime for faster response
export const runtime = 'edge';

const GEOAPIFY_API_KEY = process.env.GEOCODING;

/**
 * Geoapify Route Matrix API
 * Calculate time and distance matrix between multiple locations
 * 
 * Request body (POST):
 * {
 *   "sources": [{ "lat": 40.7128, "lon": -74.0060 }, ...],
 *   "targets": [{ "lat": 51.5074, "lon": -0.1278 }, ...],
 *   "mode": "drive" | "truck" | "bicycle" | "walk" | "transit",
 *   "units": "metric" | "imperial"
 * }
 * 
 * Returns matrix of time (seconds) and distance (meters) between all source-target pairs
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
        const { sources, targets, mode = 'drive', units = 'metric' } = body;

        if (!sources || !Array.isArray(sources) || sources.length === 0) {
            return Response.json(
                { error: 'Missing or invalid sources array' },
                { status: 400 }
            );
        }

        if (!targets || !Array.isArray(targets) || targets.length === 0) {
            return Response.json(
                { error: 'Missing or invalid targets array' },
                { status: 400 }
            );
        }

        // Build Geoapify Route Matrix request
        const url = `https://api.geoapify.com/v1/routematrix?apiKey=${GEOAPIFY_API_KEY}`;

        const requestBody = {
            mode,
            sources: sources.map(s => ({
                location: [s.lon, s.lat]
            })),
            targets: targets.map(t => ({
                location: [t.lon, t.lat]
            })),
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

        // Transform response to include units and formatted values
        const result = {
            ...data,
            units,
            formatted: formatMatrixResults(data, units),
        };

        return Response.json(result, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            },
        });
    } catch (error) {
        console.error('Route Matrix API error:', error);
        return Response.json(
            { error: 'Failed to calculate route matrix', details: error.message },
            { status: 500 }
        );
    }
}

function formatMatrixResults(data, units) {
    if (!data.sources_to_targets) return null;

    return data.sources_to_targets.map((row, sourceIdx) =>
        row.map((cell, targetIdx) => ({
            sourceIndex: sourceIdx,
            targetIndex: targetIdx,
            distance: formatDistance(cell.distance, units),
            time: formatTime(cell.time),
            distanceRaw: cell.distance,
            timeRaw: cell.time,
        }))
    );
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
