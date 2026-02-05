"use client";

import { useState, useEffect } from "react";
import { MapPin, Star, ExternalLink, Coffee, Hotel, Utensils, Camera } from "lucide-react";

const CATEGORY_ICONS = {
    "accommodation.hotel": Hotel,
    "catering.restaurant": Utensils,
    "catering.cafe": Coffee,
    "tourism": Camera,
    "entertainment": Star,
};

export default function NearbyPlaces({ destination, lat, lon, radius = 5000 }) {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("tourism");

    const categories = [
        { id: "tourism", label: "Attractions", icon: Camera },
        { id: "catering.restaurant", label: "Restaurants", icon: Utensils },
        { id: "catering.cafe", label: "Cafes", icon: Coffee },
        { id: "accommodation.hotel", label: "Hotels", icon: Hotel },
        { id: "entertainment", label: "Entertainment", icon: Star },
    ];

    useEffect(() => {
        const fetchPlaces = async () => {
            if (!lat || !lon) return;

            setLoading(true);
            try {
                const filter = `circle:${lon},${lat},${radius}`;
                const response = await fetch(
                    `/api/places?categories=${selectedCategory}&filter=${encodeURIComponent(filter)}&limit=10`
                );
                const data = await response.json();
                setPlaces(data.features || []);
            } catch (error) {
                console.error("Failed to fetch places:", error);
                setPlaces([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPlaces();
    }, [lat, lon, radius, selectedCategory]);

    return (
        <section className="py-8">
            <h2 className="text-2xl font-bold mb-6">
                Explore {destination}
            </h2>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedCategory === cat.id
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* Places Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : places.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No places found in this category
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {places.map((place, idx) => (
                        <PlaceCard key={place.properties.place_id || idx} place={place} />
                    ))}
                </div>
            )}
        </section>
    );
}

function PlaceCard({ place }) {
    const { properties } = place;
    const Icon = CATEGORY_ICONS[properties.categories?.[0]] || MapPin;

    const distance = properties.distance
        ? properties.distance < 1000
            ? `${Math.round(properties.distance)}m`
            : `${(properties.distance / 1000).toFixed(1)}km`
        : null;

    return (
        <div className="group p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all">
            <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                        {properties.name || properties.address_line1}
                    </h3>
                    {distance && (
                        <p className="text-xs text-muted-foreground mt-1">
                            📍 {distance} away
                        </p>
                    )}
                </div>
            </div>

            {properties.address_line2 && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {properties.address_line2}
                </p>
            )}

            {properties.datasource?.raw?.website && (
                <a
                    href={properties.datasource.raw.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                    <ExternalLink className="w-3 h-3" />
                    Visit website
                </a>
            )}

            {properties.datasource?.raw?.phone && (
                <p className="text-sm text-muted-foreground mt-2">
                    📞 {properties.datasource.raw.phone}
                </p>
            )}

            {properties.datasource?.raw?.opening_hours && (
                <p className="text-xs text-muted-foreground mt-2 truncate">
                    🕒 {properties.datasource.raw.opening_hours}
                </p>
            )}
        </div>
    );
}
