/**
 * Bus Search API
 * 
 * Searches for buses between two cities with pricing and availability information.
 * Uses web scraping from RedBus with intelligent fallback to estimated data.
 * 
 * @module api/bus
 * @requires lib/bus-scraper
 */

import { NextResponse } from 'next/server';
import { searchBuses, getCitySuggestions, getSeatLayout } from '@/lib/bus-scraper';

/**
 * GET /api/bus
 * 
 * Search for buses or get city suggestions
 * 
 * @async
 * @param {Request} request - Next.js request object
 * 
 * @query {string} action - Action type: 'search' (default), 'suggestions', 'seats'
 * @query {string} from - Source city name (required for search)
 * @query {string} to - Destination city name (required for search)
 * @query {string} date - Journey date in YYYY-MM-DD format (required for search)
 * @query {string} q - Search query for city suggestions (required for suggestions)
 * @query {string} busId - Bus ID for seat layout (required for seats)
 * 
 * @returns {Promise<Response>} JSON response with bus data
 * 
 * @example
 * // Search for buses
 * GET /api/bus?from=Delhi&to=Jaipur&date=2026-02-10
 * 
 * @example
 * // Get city suggestions
 * GET /api/bus?action=suggestions&q=Mum
 * 
 * @example
 * // Get seat layout
 * GET /api/bus?action=seats&busId=bus_123
 * 
 * @response
 * {
 *   "success": true,
 *   "from": "Delhi",
 *   "to": "Jaipur",
 *   "date": "2026-02-10",
 *   "count": 5,
 *   "buses": [
 *     {
 *       "id": "bus_1",
 *       "operator": "VRL Travels",
 *       "busType": "Volvo AC Sleeper",
 *       "departureTime": "18:00",
 *       "arrivalTime": "11:00 PM",
 *       "duration": "5h",
 *       "price": 750,
 *       "seatsAvailable": 12,
 *       "amenities": ["ac", "sleeper", "wifi", "charging"],
 *       "rating": "4.2"
 *     }
 *   ]
 * }
 * 
 * @throws {400} Missing required parameters
 * @throws {500} Failed to fetch bus data
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const date = searchParams.get('date');
        const action = searchParams.get('action') || 'search';

        // Handle city suggestions
        if (action === 'suggestions') {
            const query = searchParams.get('q');
            if (!query) {
                return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
            }
            const suggestions = await getCitySuggestions(query);
            return NextResponse.json({ suggestions });
        }

        // Handle seat layout
        if (action === 'seats') {
            const busId = searchParams.get('busId');
            if (!busId) {
                return NextResponse.json({ error: 'Bus ID required' }, { status: 400 });
            }
            const seatLayout = await getSeatLayout(busId);
            return NextResponse.json({ seatLayout });
        }

        // Handle bus search
        if (!from || !to || !date) {
            return NextResponse.json(
                { error: 'Missing required parameters: from, to, date' },
                { status: 400 }
            );
        }

        const buses = await searchBuses(from, to, date);

        return NextResponse.json({
            success: true,
            from,
            to,
            date,
            count: buses.length,
            buses
        });

    } catch (error) {
        console.error('Bus search API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bus data', message: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/bus
 * 
 * Search for buses using POST request (alternative to GET)
 * 
 * @async
 * @param {Request} request - Next.js request object
 * 
 * @body {Object} body - Request body
 * @body {string} body.from - Source city name
 * @body {string} body.to - Destination city name
 * @body {string} body.date - Journey date (YYYY-MM-DD)
 * 
 * @returns {Promise<Response>} JSON response with bus data
 * 
 * @example
 * POST /api/bus
 * Content-Type: application/json
 * 
 * {
 *   "from": "Mumbai",
 *   "to": "Pune",
 *   "date": "2026-02-15"
 * }
 * 
 * @throws {400} Missing required parameters
 * @throws {500} Failed to fetch bus data
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { from, to, date } = body;

        if (!from || !to || !date) {
            return NextResponse.json(
                { error: 'Missing required parameters: from, to, date' },
                { status: 400 }
            );
        }

        const buses = await searchBuses(from, to, date);

        return NextResponse.json({
            success: true,
            from,
            to,
            date,
            count: buses.length,
            buses
        });

    } catch (error) {
        console.error('Bus search API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bus data', message: error.message },
            { status: 500 }
        );
    }
}
