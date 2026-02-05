// Edge runtime for faster response
export const runtime = 'edge';

const RAILRADAR_API_KEY = process.env.RAILRADAR_API;
const RAILRADAR_BASE_URL = 'https://api.railradar.org';

/**
 * RailRadar Search Stations API
 * Search for Indian railway stations by code or name
 * 
 * Query params:
 * - query: Search term (station code or name)
 * 
 * Example: /api/railradar/search/stations?query=mumbai
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
        const query = searchParams.get('query');

        if (!query) {
            return Response.json(
                { error: 'Query parameter is required' },
                { status: 400 }
            );
        }

        const url = `${RAILRADAR_BASE_URL}/api/v1/search/stations?query=${encodeURIComponent(query)}`;

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

        // Normalize response - extract stations array from nested structure
        // RailRadar returns: { success: true, data: { stations: [...] }, meta: {...} }
        const stations = data.data?.stations || data.stations || [];

        console.log(`Found ${stations.length} stations for query: ${query}`);

        return Response.json({ stations }, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('RailRadar Stations Search API error:', error);
        return Response.json(
            { error: 'Failed to search stations', details: error.message },
            { status: 500 }
        );
    }
}
