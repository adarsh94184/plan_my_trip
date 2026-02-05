// Edge runtime for faster response
export const runtime = 'edge';

const RAILRADAR_API_KEY = process.env.RAILRADAR_API;
const RAILRADAR_BASE_URL = 'https://api.railradar.org';

/**
 * RailRadar Train Details API
 * Get comprehensive train data (static + live)
 * 
 * Path param:
 * - trainNumber: 5-digit train number
 * 
 * Query params:
 * - journeyDate: Journey date (YYYY-MM-DD) - optional, auto-detects if not provided
 * - dataType: 'full' | 'static' | 'live' (default: 'full')
 * - dataProvider: Data provider for live info
 * 
 * Example: /api/railradar/trains/12301?dataType=full&journeyDate=2024-02-05
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
        const { trainNumber } = await params;
        const { searchParams } = new URL(request.url);

        const journeyDate = searchParams.get('journeyDate');
        const dataType = searchParams.get('dataType') || 'full';
        const dataProvider = searchParams.get('dataProvider');

        if (!trainNumber || !/^\d{5}$/.test(trainNumber)) {
            return Response.json(
                { error: 'Valid 5-digit train number is required' },
                { status: 400 }
            );
        }

        let url = `${RAILRADAR_BASE_URL}/api/v1/trains/${trainNumber}?dataType=${dataType}`;

        if (journeyDate) {
            url += `&journeyDate=${journeyDate}`;
        }
        if (dataProvider) {
            url += `&dataProvider=${dataProvider}`;
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

        // Different cache durations based on data type
        const cacheControl = dataType === 'live'
            ? 'public, s-maxage=60, stale-while-revalidate=120' // Live data: 1 min cache
            : 'public, s-maxage=3600, stale-while-revalidate=7200'; // Static data: 1 hour cache

        return Response.json(data, {
            headers: {
                'Cache-Control': cacheControl,
            },
        });
    } catch (error) {
        console.error('RailRadar Train Details API error:', error);
        return Response.json(
            { error: 'Failed to fetch train details', details: error.message },
            { status: 500 }
        );
    }
}
