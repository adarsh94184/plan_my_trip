// Edge runtime for faster cold starts and lower latency
export const runtime = 'edge';

const GEOAPIFY_API_KEY = process.env.GEOCODING;
const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v1/geocode';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'search'; // search, reverse, autocomplete
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const limit = searchParams.get('limit') || '5';

    if (!GEOAPIFY_API_KEY) {
        return Response.json(
            { error: 'Geoapify API key not configured' },
            { status: 500 }
        );
    }

    try {
        let url;

        if (type === 'reverse' && lat && lon) {
            // Reverse geocoding
            url = `${GEOAPIFY_BASE_URL}/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_API_KEY}`;
        } else if (type === 'autocomplete' && query) {
            // Autocomplete (faster for live typing)
            url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=${limit}&apiKey=${GEOAPIFY_API_KEY}`;
        } else if (query) {
            // Standard search
            url = `${GEOAPIFY_BASE_URL}/search?text=${encodeURIComponent(query)}&limit=${limit}&apiKey=${GEOAPIFY_API_KEY}`;
        } else {
            return Response.json(
                { error: 'Missing required parameters: q (query) or lat/lon for reverse' },
                { status: 400 }
            );
        }

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
            // Cache for 1 hour to reduce API calls
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            throw new Error(`Geoapify API error: ${response.status}`);
        }

        const data = await response.json();

        // Return with cache headers for client-side caching
        return Response.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('Geocode error:', error);
        return Response.json(
            { error: 'Failed to geocode', details: error.message },
            { status: 500 }
        );
    }
}
