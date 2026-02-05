// Edge runtime for faster response
export const runtime = 'edge';

const RAILRADAR_API_KEY = process.env.RAILRADAR_API;
const RAILRADAR_BASE_URL = 'https://api.railradar.org';

/**
 * RailRadar Station Info API
 * Get static information about a railway station
 * 
 * Path param:
 * - stationCode: Station code (e.g., NDLS, BCT, MAS)
 * 
 * Example: /api/railradar/stations/NDLS/info
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

        if (!stationCode) {
            return Response.json(
                { error: 'Station code is required' },
                { status: 400 }
            );
        }

        const url = `${RAILRADAR_BASE_URL}/api/v1/stations/${encodeURIComponent(stationCode)}/info`;

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
                // Static data - long cache
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
            },
        });
    } catch (error) {
        console.error('RailRadar Station Info API error:', error);
        return Response.json(
            { error: 'Failed to fetch station info', details: error.message },
            { status: 500 }
        );
    }
}
