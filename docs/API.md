# TripWise API Documentation

Complete reference for all 14 API endpoints in the TripWise application.

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting & Caching](#rate-limiting--caching)
3. [Core Services](#core-services)
   - [Bus Search](#bus-search)
   - [Geocoding](#geocoding)
   - [Places Search](#places-search)
   - [Place Details](#place-details)
   - [Map Markers](#map-markers)
4. [Routing Services](#routing-services)
   - [Turn-by-turn Routing](#turn-by-turn-routing)
   - [Route Matrix](#route-matrix)
   - [Route Planner](#route-planner)
5. [Rail Services](#rail-services)
   - [Station Search](#station-search)
   - [Train Search](#train-search)
   - [Station Details](#station-details)
   - [Live Station Status](#live-station-status)
   - [Train Details](#train-details)
   - [Trains Between Stations](#trains-between-stations)
6. [Error Handling](#error-handling)

---

## Authentication

All APIs use environment variables for authentication:

```env
# Required for geocoding, routing, and places APIs
GEOCODING=your_geoapify_api_key

# Required for rail APIs
X_AUTH=your_railradar_api_key
```

---

## Rate Limiting & Caching

- **Server-side caching**: Most endpoints cache responses for 1-24 hours
- **Client-side caching**: Responses include `Cache-Control` headers
- **Rate limits**: Follow external API provider limits (Geoapify, RailRadar)

---

## Core Services

### Bus Search

Search for buses between cities with pricing and availability.

**Endpoint**: `/api/bus`

**Methods**: `GET`, `POST`

**Parameters** (GET):
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | string | Yes* | Source city name |
| `to` | string | Yes* | Destination city name |
| `date` | string | Yes* | Journey date (YYYY-MM-DD) |
| `action` | string | No | `search` (default), `suggestions`, `seats` |
| `q` | string | Yes** | City query (for autocomplete) |
| `busId` | string | Yes*** | Bus ID (for seat layout) |

\* Required for search  
\** Required for suggestions  
\*** Required for seats

**Example Request**:
```bash
GET /api/bus?from=Delhi&to=Jaipur&date=2026-02-10
```

**Example Response**:
```json
{
  "success": true,
  "from": "Delhi",
  "to": "Jaipur",
  "date": "2026-02-10",
  "count": 5,
  "buses": [
    {
      "id": "bus_1",
      "operator": "VRL Travels",
      "busType": "Volvo AC Sleeper",
      "departureTime": "18:00",
      "arrivalTime": "11:00 PM",
      "duration": "5h",
      "price": 750,
      "seatsAvailable": 12,
      "amenities": ["ac", "sleeper", "wifi", "charging"],
      "rating": "4.2"
    }
  ]
}
```

---

### Geocoding

Convert addresses to coordinates and vice versa.

**Endpoint**: `/api/geocode`

**Method**: `GET`

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes* | Search query/address |
| `type` | string | No | `search` (default), `reverse`, `autocomplete` |
| `lat` | number | Yes** | Latitude for reverse geocoding |
| `lon` | number | Yes** | Longitude for reverse geocoding |
| `limit` | number | No | Max results (default: 5) |

\* Required for search/autocomplete  
\** Required for reverse geocoding

**Example Requests**:
```bash
# Forward geocoding
GET /api/geocode?q=Connaught Place, Delhi&type=search

# Reverse geocoding
GET /api/geocode?lat=28.6139&lon=77.2090&type=reverse

# Autocomplete
GET /api/geocode?q=Mumb&type=autocomplete&limit=10
```

**Example Response**:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "formatted": "Connaught Place, New Delhi, Delhi, India",
        "lat": 28.6304,
        "lon": 77.2177,
        "city": "New Delhi",
        "state": "Delhi",
        "country": "India"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [77.2177, 28.6304]
      }
    }
  ]
}
```

---

### Places Search

Find points of interest by category or name.

**Endpoint**: `/api/places`

**Method**: `GET`

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `categories` | string | Yes* | Comma-separated categories (e.g., `accommodation.hotel,catering.restaurant`) |
| `name` | string | Yes* | Place name filter |
| `filter` | string | No | Geographic filter (`circle:lon,lat,radius` or `rect:lon1,lat1,lon2,lat2`) |
| `bias` | string | No | Bias results (`proximity:lon,lat` or `countrycode:us`) |
| `limit` | number | No | Max results (default: 20, max: 50) |
| `conditions` | string | No | Additional filters (e.g., `internet_access,wheelchair`) |

\* At least one required

**Example Request**:
```bash
GET /api/places?categories=tourism.attraction&filter=circle:77.2090,28.6139,5000&limit=10
```

---

### Place Details

Get detailed information about a specific place.

**Endpoint**: `/api/placedetails`

**Method**: `GET`

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Geoapify place_id |
| `features` | string | No | Comma-separated features: `details`, `geometry`, `building`, `drive_distance` |
| `lang` | string | No | Language code (default: `en`) |

**Example Request**:
```bash
GET /api/placedetails?id=51a73c8e4b5a22c25940a72c04ff3c354840f00101f901f4040c00000000009203104a616e2050617468
```

---

### Map Markers

Generate customizable map marker icons.

**Endpoint**: `/api/marker`

**Method**: `GET`

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | `awesome` (default), `material`, `circle` |
| `color` | string | No | Hex color without # (default: `3b82f6`) |
| `icon` | string | No | Icon name (default: `location-pin`) |
| `size` | string | No | `small`, `medium` (default), `large` |
| `text` | string | No | Single character for circle type |
| `shadow` | boolean | No | Include shadow (default: `true`) |
| `strokeColor` | string | No | Border color hex (default: `ffffff`) |

**Example Request**:
```bash
GET /api/marker?type=awesome&color=ff5733&icon=hotel&size=large
```

**Returns**: PNG image

---

## Routing Services

### Turn-by-turn Routing

Calculate detailed routes with navigation instructions.

**Endpoint**: `/api/routing`

**Method**: `POST`

**Request Body**:
```json
{
  "waypoints": [
    { "lat": 28.6139, "lon": 77.2090 },
    { "lat": 28.7041, "lon": 77.1025 }
  ],
  "mode": "drive",
  "units": "metric",
  "details": ["instruction_details", "route_details"]
}
```

**Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `waypoints` | array | Yes | Array of {lat, lon} objects (min 2) |
| `mode` | string | No | `drive` (default), `truck`, `bicycle`, `walk`, `transit` |
| `units` | string | No | `metric` (default), `imperial` |
| `details` | array | No | Additional details to include |

**Example Response**:
```json
{
  "type": "FeatureCollection",
  "features": [...],
  "formatted": {
    "distance": "15.3 km",
    "duration": "28m",
    "legs": [
      {
        "distance": "15.3 km",
        "duration": "28m",
        "steps": [
          {
            "instruction": "Turn right onto Main Street",
            "distance": "500 m",
            "duration": "1m",
            "type": "turn-right"
          }
        ]
      }
    ]
  }
}
```

---

### Route Matrix

Calculate distance/time matrix between multiple locations.

**Endpoint**: `/api/routematrix`

**Method**: `POST`

**Request Body**:
```json
{
  "sources": [
    { "lat": 28.6139, "lon": 77.2090 },
    { "lat": 28.7041, "lon": 77.1025 }
  ],
  "targets": [
    { "lat": 28.5355, "lon": 77.3910 },
    { "lat": 28.4595, "lon": 77.0266 }
  ],
  "mode": "drive",
  "units": "metric"
}
```

**Returns**: Matrix of distances and times between all source-target pairs.

---

### Route Planner

Plan  multi-stop routes with optimization.

**Endpoint**: `/api/routeplanner`

**Method**: `POST`

Similar to routing but supports multiple waypoints and route optimization.

---

## Rail Services

### Station Search

Search for railway stations.

**Endpoint**: `/api/railradar/search/stations`

**Method**: `GET`

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Station name query |
| `limit` | number | No | Max results (default: 10) |

**Example Request**:
```bash
GET /api/railradar/search/stations?q=Delhi&limit=5
```

---

### Train Search

Search for trains.

**Endpoint**: `/api/railradar/search/trains`

**Method**: `GET`

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Train name/number query |
| `limit` | number | No | Max results (default: 10) |

**Example Request**:
```bash
GET /api/railradar/search/trains?q=Rajdhani&limit=10
```

---

### Station Details

Get detailed information about a station.

**Endpoint**: `/api/railradar/stations/[stationCode]/info`

**Method**: `GET`

**Example Request**:
```bash
GET /api/railradar/stations/NDLS/info
```

---

### Live Station Status

Get real-time train arrivals/departures at a station.

**Endpoint**: `/api/railradar/stations/[stationCode]/live`

**Method**: `GET`

**Example Request**:
```bash
GET /api/railradar/stations/NDLS/live
```

---

### Train Details

Get detailed information about a specific train.

**Endpoint**: `/api/railradar/trains/[trainNumber]`

**Method**: `GET`

**Example Request**:
```bash
GET /api/railradar/trains/12301
```

---

### Trains Between Stations

Find trains running between two stations.

**Endpoint**: `/api/railradar/trains/between`

**Method**: `GET`

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | string | Yes | Source station code |
| `to` | string | Yes | Destination station code |
| `date` | string | No | Journey date (YYYY-MM-DD) |

**Example Request**:
```bash
GET /api/railradar/trains/between?from=NDLS&to=BCT&date=2026-02-10
```

---

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

### Common HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `400` | Bad Request | Missing or invalid parameters |
| `401` | Unauthorized | Missing or invalid API key |
| `404` | Not Found | Resource or endpoint not found |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server or external API failure |
| `503` | Service Unavailable | External API unavailable |

---

## Quick Start Examples

### Planning a Trip

```javascript
// 1. Geocode the destination
const geoRes = await fetch('/api/geocode?q=Jaipur&type=search');
const geoData = await geoRes.json();
const { lat, lon } = geoData.features[0].properties;

// 2. Find nearby hotels
const placesRes = await fetch(
  `/api/places?categories=accommodation.hotel&filter=circle:${lon},${lat},5000&limit=10`
);
const hotels = await placesRes.json();

// 3. Search for buses
const busRes = await fetch('/api/bus?from=Delhi&to=Jaipur&date=2026-02-10');
const buses = await busRes.json();

// 4. Get routing directions
const routeRes = await fetch('/api/routing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    waypoints: [
      { lat: 28.6139, lon: 77.2090 },
      { lat, lon }
    ],
    mode: 'drive'
  })
});
const route = await routeRes.json();
```

---

## Support

For issues or questions about the API:
- Check the inline JSDoc comments in each route file
- Review example code in `docs/examples/`
- Refer to external API documentation (Geoapify, RailRadar)
