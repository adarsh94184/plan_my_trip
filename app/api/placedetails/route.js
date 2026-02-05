// Edge runtime for faster response
export const runtime = 'edge';

const GEOAPIFY_API_KEY = process.env.GEOCODING;

/**
 * Geoapify Place Details API
 * Get detailed information about a place including geometry, address, and features
 * 
 * Query params:
 * - id: Geoapify place_id (required) - from geocode/places API results
 * - features: comma-separated list of features to include
 *   Options: details, geometry, building, drive_distance
 * - lang: language code (e.g., en, es, fr) - default: en
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);

    const placeId = searchParams.get('id');
    const features = searchParams.get('features') || 'details';
    const lang = searchParams.get('lang') || 'en';

    if (!GEOAPIFY_API_KEY) {
        return Response.json(
            { error: 'Geoapify API key not configured' },
            { status: 500 }
        );
    }

    if (!placeId) {
        return Response.json(
            { error: 'Missing required parameter: id (place_id)' },
            { status: 400 }
        );
    }

    try {
        // Build Geoapify Place Details URL
        const url = `https://api.geoapify.com/v2/place-details?id=${encodeURIComponent(placeId)}&features=${encodeURIComponent(features)}&lang=${lang}&apiKey=${GEOAPIFY_API_KEY}`;

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
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('Place Details API error:', error);
        return Response.json(
            { error: 'Failed to get place details', details: error.message },
            { status: 500 }
        );
    }
}
