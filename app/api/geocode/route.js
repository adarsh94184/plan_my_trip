/**
 * Geocoding API
 * 
 * Provides geocoding, reverse geocoding, and autocomplete functionality using Geoapify.
 * Supports converting addresses to coordinates and vice versa.
 * 
 * @module api/geocode
 * @requires GEOCODING environment variable (Geoapify API key)
 */

// Edge runtime for faster cold starts and lower latency
export const runtime = 'edge';

const GEOAPIFY_API_KEY = process.env.GEOCODING;
const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v1/geocode';

/**
 * GET /api/geocode
 * 
 * Geocode addresses, reverse geocode coordinates, or provide autocomplete suggestions
 * 
 * @async
 * @param {Request} request - Next.js request object
 * 
 * @query {string} q - Search query/address (required for search/autocomplete)
 * @query {string} type - Operation type: 'search' (default), 'reverse', 'autocomplete'
 * @query {number} lat - Latitude (required for reverse geocoding)
 * @query {number} lon - Longitude (required for reverse geocoding)
 * @query {number} [limit=5] - Maximum number of results
 * 
 * @returns {Promise<Response>} GeoJSON FeatureCollection with geocoded results
 * 
 * @example
 * // Forward geocoding (address to coordinates)
 * GET /api/geocode?q=Connaught Place, Delhi&type=search
 * 
 * @example
 * // Reverse geocoding (coordinates to address)
 * GET /api/geocode?lat=28.6139&lon=77.2090&type=reverse
 * 
 * @example
 * // Autocomplete for live search
 * GET /api/geocode?q=Mumb&type=autocomplete&limit=10
 * 
 * @response
 * {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {
 *         "formatted": "Connaught Place, New Delhi, Delhi, India",
 *         "lat": 28.6304,
 *         "lon": 77.2177,
 *         "city": "New Delhi",
 *         "state": "Delhi",
 *         "country": "India"
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [77.2177, 28.6304]
 *       }
 *     }
 *   ]
 * }
 * 
 * @throws {400} Missing required parameters
 * @throws {500} Geoapify API error or key not configured
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'search'; // search, reverse, autocomplete
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const limit = searchParams.get('limit') || '5';

    // Validate API key configuration
    if (!GEOAPIFY_API_KEY) {
        return Response.json(
            { error: 'Geoapify API key not configured' },
            { status: 500 }
        );
    }

    try {
        let url;

        // Reverse geocoding: coordinates → address
        if (type === 'reverse' && lat && lon) {
            url = `${GEOAPIFY_BASE_URL}/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_API_KEY}`;
        }
        // Autocomplete: fast suggestions for live typing
        else if (type === 'autocomplete' && query) {
            url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=${limit}&apiKey=${GEOAPIFY_API_KEY}`;
        }
        // Standard search: address → coordinates
        else if (query) {
            url = `${GEOAPIFY_BASE_URL}/search?text=${encodeURIComponent(query)}&limit=${limit}&apiKey=${GEOAPIFY_API_KEY}`;
        }
        else {
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
