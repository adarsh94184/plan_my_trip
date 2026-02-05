// Edge runtime for faster response
export const runtime = 'edge';

const GEOAPIFY_API_KEY = process.env.GEOCODING;

/**
 * Geoapify Marker Icon API
 * Generates customizable map marker icons
 * 
 * Query params:
 * - type: marker type (awesome, material, circle) - default: awesome
 * - color: hex color without # (e.g., ff5733) - default: 3b82f6
 * - icon: icon name (for awesome/material types) - default: location-pin
 * - size: marker size (small, medium, large) - default: medium
 * - text: single character or number for circle type
 * - shadow: include shadow (true/false) - default: true
 * - strokeColor: border color hex - default: ffffff
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type') || 'awesome';
    const color = searchParams.get('color') || '3b82f6';
    const icon = searchParams.get('icon') || 'location-pin';
    const size = searchParams.get('size') || 'medium';
    const text = searchParams.get('text') || '';
    const shadow = searchParams.get('shadow') !== 'false';
    const strokeColor = searchParams.get('strokeColor') || 'ffffff';

    if (!GEOAPIFY_API_KEY) {
        return Response.json(
            { error: 'Geoapify API key not configured' },
            { status: 500 }
        );
    }

    try {
        // Build Geoapify marker URL
        // Format: https://api.geoapify.com/v1/icon/?type=awesome&color=%23color&icon=iconname&apiKey=KEY
        let url = `https://api.geoapify.com/v1/icon/?type=${type}&color=%23${color}&apiKey=${GEOAPIFY_API_KEY}`;

        // Add optional parameters based on marker type
        if (type === 'awesome' || type === 'material') {
            url += `&icon=${encodeURIComponent(icon)}`;
            url += `&size=${size}`;
        }

        if (type === 'circle' && text) {
            url += `&text=${encodeURIComponent(text)}`;
        }

        if (shadow) {
            url += '&shadow=true';
        }

        url += `&strokeColor=%23${strokeColor}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Geoapify API error: ${response.status}`);
        }

        // Return the image directly with proper headers
        const imageBuffer = await response.arrayBuffer();

        return new Response(imageBuffer, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year (icons don't change)
            },
        });
    } catch (error) {
        console.error('Marker API error:', error);
        return Response.json(
            { error: 'Failed to generate marker', details: error.message },
            { status: 500 }
        );
    }
}
