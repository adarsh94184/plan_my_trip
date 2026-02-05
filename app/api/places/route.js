// Edge runtime for faster response
export const runtime = 'edge';

const GEOAPIFY_API_KEY = process.env.GEOCODING;

/**
 * Geoapify Places API
 * Search for places by category, name, or nearby locations
 * 
 * Query params:
 * - categories: comma-separated categories (e.g., accommodation.hotel, catering.restaurant)
 * - filter: geographic filter (circle:lon,lat,radius or rect:lon1,lat1,lon2,lat2)
 * - bias: bias results near location (proximity:lon,lat or countrycode:us)
 * - limit: max results (default: 20, max: 50)
 * - name: filter by place name
 * - conditions: additional filters (e.g., internet_access, wheelchair)
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);

    const categories = searchParams.get('categories');
    const filter = searchParams.get('filter');
    const bias = searchParams.get('bias');
    const limit = searchParams.get('limit') || '20';
    const name = searchParams.get('name');
    const conditions = searchParams.get('conditions');

    if (!GEOAPIFY_API_KEY) {
        return Response.json(
            { error: 'Geoapify API key not configured' },
            { status: 500 }
        );
    }

    if (!categories && !name) {
        return Response.json(
            { error: 'Missing required parameter: categories or name' },
            { status: 400 }
        );
    }

    try {
        // Build Geoapify Places URL
        let url = `https://api.geoapify.com/v2/places?apiKey=${GEOAPIFY_API_KEY}&limit=${limit}`;

        if (categories) {
            url += `&categories=${encodeURIComponent(categories)}`;
        }

        if (filter) {
            url += `&filter=${encodeURIComponent(filter)}`;
        }

        if (bias) {
            url += `&bias=${encodeURIComponent(bias)}`;
        }

        if (name) {
            url += `&name=${encodeURIComponent(name)}`;
        }

        if (conditions) {
            url += `&conditions=${encodeURIComponent(conditions)}`;
        }

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Geoapify API error: ${response.status}`);
        }

        const data = await response.json();

        return Response.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
            },
        });
    } catch (error) {
        console.error('Places API error:', error);
        return Response.json(
            { error: 'Failed to fetch places', details: error.message },
            { status: 500 }
        );
    }
}
