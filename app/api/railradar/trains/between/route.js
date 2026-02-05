// Edge runtime for faster response
export const runtime = 'edge';

const RAILRADAR_API_KEY = process.env.RAILRADAR_API;
const RAILRADAR_BASE_URL = 'https://api.railradar.org';

/**
 * RailRadar Trains Between Stations API
 * Find all trains running between two stations
 * 
 * Query params:
 * - from: Source station code (required)
 * - to: Destination station code (required)
 * 
 * Example: /api/railradar/trains/between?from=NDLS&to=BCT
 */
export async function GET(request) {
    if (!RAILRADAR_API_KEY) {
        return Response.json(
            { error: 'RailRadar API key not configured' },
            { status: 500 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        if (!from || !to) {
            return Response.json(
                { error: 'Both "from" and "to" station codes are required' },
                { status: 400 }
            );
        }

        const url = `${RAILRADAR_BASE_URL}/api/v1/trains/between?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'x-api-key': RAILRADAR_API_KEY,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`RailRadar API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Normalize response - extract trains array from nested structure
        // RailRadar returns: { success: true, data: { trains: [...] }, meta: {...} }
        const trains = data.data?.trains || data.trains || [];

        console.log(`Found ${trains.length} trains from ${from} to ${to}`);

        return Response.json({ trains }, {
            headers: {
                'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
            },
        });
    } catch (error) {
        console.error('RailRadar Trains Between Stations API error:', error);
        return Response.json(
            { error: 'Failed to fetch trains between stations', details: error.message },
            { status: 500 }
        );
    }
}
