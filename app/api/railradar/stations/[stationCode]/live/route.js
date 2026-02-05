// Edge runtime for faster response
export const runtime = 'edge';

const RAILRADAR_API_KEY = process.env.RAILRADAR_API;
const RAILRADAR_BASE_URL = 'https://api.railradar.org';

/**
 * RailRadar Live Station Board API
 * Get real-time departures and arrivals at a station
 * 
 * Path param:
 * - stationCode: Station code (e.g., NDLS, BCT)
 * 
 * Query params:
 * - hours: Hours to look ahead (1-8, default: 8)
 * - toStationCode: Filter trains going to specific destination
 * 
 * Example: /api/railradar/stations/NDLS/live?hours=4
 */
export async function GET(request, { params }) {
    if (!RAILRADAR_API_KEY) {
        return Response.json(
            { error: 'RailRadar API key not configured' },
            { status: 500 }
        );
    }

    try {
        // Next.js 13+ - params is a Promise that must be awaited
        const { stationCode } = await params;
        const { searchParams } = new URL(request.url);

        const hours = searchParams.get('hours') || '8';
        const toStationCode = searchParams.get('toStationCode');

        if (!stationCode) {
            return Response.json(
                { error: 'Station code is required' },
                { status: 400 }
            );
        }

        let url = `${RAILRADAR_BASE_URL}/api/v1/stations/${encodeURIComponent(stationCode)}/live?hours=${hours}`;

        if (toStationCode) {
            url += `&toStationCode=${encodeURIComponent(toStationCode)}`;
        }

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

        return Response.json(data, {
            headers: {
                // Live data - short cache
                'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240',
            },
        });
    } catch (error) {
        console.error('RailRadar Live Station Board API error:', error);
        return Response.json(
            { error: 'Failed to fetch live station board', details: error.message },
            { status: 500 }
        );
    }
}
