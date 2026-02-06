"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icons
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const BigIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [35, 50], // Bigger size
    iconAnchor: [17, 50],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Removed global mutation to prevent conflicts
// L.Marker.prototype.options.icon = DefaultIcon;

function MapEvents({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
}

export default function LeafletMap({ origin, destination, onLocationSelect }) {
    // Mode is now implicitly handled: If no origin, next click is origin. Otherwise destination.
    const [map, setMap] = useState(null);

    const handleMapClick = async (latlng) => {
        // Logic: If no origin, set origin. Otherwise set destination (even if dest exists, overwrite it)
        const targetType = !origin ? 'origin' : 'destination';

        // Reverse geocode
        try {
            const res = await fetch(`/api/geocode?lat=${latlng.lat}&lon=${latlng.lng}&type=reverse`);
            const data = await res.json();
            const place = data.features?.[0]?.properties;

            if (place) {
                onLocationSelect(targetType, {
                    name: place.formatted,
                    lat: latlng.lat,
                    lon: latlng.lng,
                    formatted: place.formatted,
                    city: place.city,
                    country: place.country
                });
            }
        } catch (e) {
            console.error("Reverse geocode failed", e);
        }
    };

    const handleLocateMe = () => {
        if (!map) return;
        map.locate().on("locationfound", function (e) {
            // Set user location as Origin
            onLocationSelect('origin', {
                name: "Current Location",
                lat: e.latlng.lat,
                lon: e.latlng.lng,
                formatted: "Current Location",
                city: "",
                country: ""
            });
            map.flyTo(e.latlng, map.getZoom());
        });
    };

    return (
        <div className="h-full w-full relative group">

            {/* My Location Button (Bottom Right) */}
            <button
                onClick={handleLocateMe}
                className="absolute bottom-6 right-6 z-[1000] bg-white text-black p-3 rounded-full shadow-xl hover:bg-gray-100 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center border border-gray-200"
                title="Use My Location"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-crosshair"><circle cx="12" cy="12" r="10" /><line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" /><line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" /></svg>
            </button>

            <MapContainer
                center={[20.5937, 78.9629]} // Center of India
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
                zoomControl={true}
                ref={setMap}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapEvents onMapClick={handleMapClick} />

                {origin && (
                    <Marker position={[origin.lat, origin.lon]} icon={BigIcon}>
                        <Popup className="font-bold">📍 Origin: {origin.name}</Popup>
                    </Marker>
                )}

                {destination && (
                    <Marker position={[destination.lat, destination.lon]} icon={BigIcon}>
                        <Popup className="font-bold">🏁 Destination: {destination.name}</Popup>
                    </Marker>
                )}

                {origin && destination && (
                    <Polyline
                        positions={[[origin.lat, origin.lon], [destination.lat, destination.lon]]}
                        color="#3b82f6" // Blue-500
                        weight={6}      // Thicker line
                        opacity={0.8}
                        dashArray="10, 10"
                    />
                )}
                <ZoomToUser />
            </MapContainer>
        </div>
    );
}

// Component to handle auto-zoom to user location on mount
function ZoomToUser() {
    const map = useMap();

    useEffect(() => {
        // Only locate once on load to set view
        map.locate({ setView: true, maxZoom: 10 });
    }, [map]);

    return null;
}
