// Edge runtime for faster response
export const runtime = 'edge';

const RAILRADAR_API_KEY = process.env.RAILRADAR_API;
const RAILRADAR_BASE_URL = 'https://api.railradar.org';

/**
 * RailRadar Search Trains API
 * Search for Indian trains by number or name
 * 
 * Query params:
 * - query: Search term (train number or name)
 * 
 * Example: /api/railradar/search/trains?query=rajdhani
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

        const url = `${RAILRADAR_BASE_URL}/api/v1/search/trains?query=${encodeURIComponent(query)}`;

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
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('RailRadar Trains Search API error:', error);
        return Response.json(
            { error: 'Failed to search trains', details: error.message },
            { status: 500 }
        );
    }
}
