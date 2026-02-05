"use client";

import { useState, useEffect } from "react";
import { MapPin, Info, Navigation } from "lucide-react";

export default function TripMap({ origin, destination, onDestinationLoad }) {
    const [originData, setOriginData] = useState(null);
    const [destinationData, setDestinationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlace, setSelectedPlace] = useState(null);

    useEffect(() => {
        const fetchLocations = async () => {
            setLoading(true);
            try {
                // Geocode origin and destination
                const [originRes, destRes] = await Promise.all([
                    fetch(`/api/geocode?q=${encodeURIComponent(origin)}&limit=1`),
                    fetch(`/api/geocode?q=${encodeURIComponent(destination)}&limit=1`)
                ]);

                const originGeo = await originRes.json();
                const destGeo = await destRes.json();

                if (originGeo.features?.[0]) {
                    setOriginData(originGeo.features[0]);
                }
                if (destGeo.features?.[0]) {
                    const destData = destGeo.features[0];
                    setDestinationData(destData);
                    // Notify parent component with destination coordinates
                    if (onDestinationLoad) {
                        onDestinationLoad({
                            lat: destData.properties.lat,
                            lon: destData.properties.lon,
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to geocode locations:", error);
            } finally {
                setLoading(false);
            }
        };

        if (origin && destination) {
            fetchLocations();
        }
    }, [origin, destination, onDestinationLoad]);

    const fetchPlaceDetails = async (placeId, placeName) => {
        try {
            const response = await fetch(
                `/api/placedetails?id=${encodeURIComponent(placeId)}&features=details,geometry`
            );
            const data = await response.json();
            setSelectedPlace({ ...data, name: placeName });
        } catch (error) {
            console.error("Failed to fetch place details:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <section className="py-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Navigation className="w-6 h-6 text-primary" />
                Route Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Origin Card */}
                {originData && (
                    <LocationCard
                        title="Starting Point"
                        location={originData}
                        color="3b82f6"
                        onDetailsClick={() =>
                            fetchPlaceDetails(
                                originData.properties.place_id,
                                origin
                            )
                        }
                    />
                )}

                {/* Destination Card */}
                {destinationData && (
                    <LocationCard
                        title="Destination"
                        location={destinationData}
                        color="8b5cf6"
                        onDetailsClick={() =>
                            fetchPlaceDetails(
                                destinationData.properties.place_id,
                                destination
                            )
                        }
                    />
                )}
            </div>

            {/* Place Details Modal */}
            {selectedPlace && (
                <PlaceDetailsCard
                    place={selectedPlace}
                    onClose={() => setSelectedPlace(null)}
                />
            )}
        </section>
    );
}

function LocationCard({ title, location, color, onDetailsClick }) {
    const { properties } = location;
    const markerUrl = `/api/marker?color=${color}&icon=location-pin&size=large`;

    return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border shadow-lg">
            <div className="flex items-start gap-4 mb-4">
                <img
                    src={markerUrl}
                    alt="Location marker"
                    className="w-12 h-12"
                />
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground">
                        {properties.formatted || properties.name}
                    </p>
                </div>
            </div>

            <div className="space-y-2 text-sm">
                {properties.city && (
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">
                            {properties.city}
                            {properties.state && `, ${properties.state}`}
                        </span>
                    </div>
                )}
                {properties.country && (
                    <div className="text-muted-foreground">
                        📍 {properties.country}
                    </div>
                )}
                <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                    Coordinates: {properties.lat?.toFixed(4)}, {properties.lon?.toFixed(4)}
                </div>
            </div>

            <button
                onClick={onDetailsClick}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
                <Info className="w-4 h-4" />
                View Details
            </button>
        </div>
    );
}

function PlaceDetailsCard({ place, onClose }) {
    const details = place.features?.[0]?.properties || {};

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-border shadow-2xl">
                <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-bold text-foreground">{place.name}</h3>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    {details.formatted && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Address</h4>
                            <p className="text-foreground">{details.formatted}</p>
                        </div>
                    )}

                    {details.datasource && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Source</h4>
                            <p className="text-foreground capitalize">{details.datasource.sourcename}</p>
                        </div>
                    )}

                    {details.timezone && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Timezone</h4>
                            <p className="text-foreground">{details.timezone.name}</p>
                        </div>
                    )}

                    {details.rank && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Importance</h4>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-muted rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full"
                                        style={{ width: `${details.rank.popularity * 100}%` }}
                                    />
                                </div>
                                <span className="text-sm text-foreground">
                                    {(details.rank.popularity * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-border">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Coordinates</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Latitude:</span>{" "}
                                <span className="font-mono text-foreground">{details.lat}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Longitude:</span>{" "}
                                <span className="font-mono text-foreground">{details.lon}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
