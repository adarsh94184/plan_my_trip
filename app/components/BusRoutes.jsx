"use client";

import { useState, useEffect } from "react";
import { Bus, Clock, IndianRupee, ArrowRight, Loader2, AlertCircle, Wifi, Plug, Moon } from "lucide-react";

/**
 * BusRoutes - Shows bus options between two cities
 * Uses estimated data based on distance and typical bus services
 */
export default function BusRoutes({ from, to, distanceKm }) {
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBus, setSelectedBus] = useState(null);

    useEffect(() => {
        generateBusOptions(from, to, distanceKm);
    }, [from, to, distanceKm]);

    const generateBusOptions = async (origin, destination, distance) => {
        setLoading(true);

        // Get coordinates for distance calculation if not provided
        let dist = distanceKm;
        if (!dist) {
            try {
                const [srcRes, destRes] = await Promise.all([
                    fetch(`/api/geocode?q=${encodeURIComponent(origin)}&type=search`),
                    fetch(`/api/geocode?q=${encodeURIComponent(destination)}&type=search`)
                ]);
                const [srcData, destData] = await Promise.all([srcRes.json(), destRes.json()]);

                if (srcData.features?.[0] && destData.features?.[0]) {
                    const src = srcData.features[0].properties;
                    const dest = destData.features[0].properties;
                    dist = calculateDistance(src.lat, src.lon, dest.lat, dest.lon);
                }
            } catch (e) {
                dist = 500; // Default fallback
            }
        }

        // Generate realistic bus options based on distance
        const busOptions = generateBusOptionsFromDistance(origin, destination, dist);
        setBuses(busOptions);
        setLoading(false);
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const generateBusOptionsFromDistance = (origin, destination, distKm) => {
        const baseSpeed = 50; // km/h average for buses
        const hours = distKm / baseSpeed;

        // Bus types with pricing per km and amenities
        const busTypes = [
            {
                type: 'Volvo AC Sleeper',
                operator: 'VRL Travels',
                pricePerKm: 2.5,
                amenities: ['ac', 'sleeper', 'wifi', 'charging'],
                color: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
            },
            {
                type: 'AC Seater',
                operator: 'SRS Travels',
                pricePerKm: 1.8,
                amenities: ['ac', 'seater', 'charging'],
                color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            },
            {
                type: 'Multi-Axle Volvo',
                operator: 'Orange Travels',
                pricePerKm: 2.2,
                amenities: ['ac', 'sleeper', 'wifi'],
                color: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
            },
            {
                type: 'Non-AC Sleeper',
                operator: 'Neeta Travels',
                pricePerKm: 1.2,
                amenities: ['sleeper'],
                color: 'bg-green-500/10 text-green-500 border-green-500/20'
            },
            {
                type: 'AC Semi-Sleeper',
                operator: 'Kallada Travels',
                pricePerKm: 1.5,
                amenities: ['ac', 'semi-sleeper', 'charging'],
                color: 'bg-teal-500/10 text-teal-500 border-teal-500/20'
            },
        ];

        return busTypes.map((bus, idx) => {
            // Vary departure times
            const departureHours = [18, 19, 20, 21, 22];
            const depHour = departureHours[idx % departureHours.length];

            // Calculate duration with some variance
            const durationVariance = 1 + (idx * 0.1); // Slightly different travel times
            const totalHours = hours * durationVariance;
            const durationStr = formatDuration(totalHours);

            // Calculate price
            const basePrice = Math.round(distKm * bus.pricePerKm);
            const price = Math.round(basePrice / 10) * 10; // Round to nearest 10

            return {
                id: idx + 1,
                type: bus.type,
                operator: bus.operator,
                departure: `${depHour}:00`,
                arrival: formatArrival(depHour, totalHours),
                duration: durationStr,
                price,
                amenities: bus.amenities,
                color: bus.color,
                seatsAvailable: Math.floor(Math.random() * 20) + 5,
            };
        }).sort((a, b) => a.price - b.price);
    };

    const formatDuration = (hours) => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const formatArrival = (depHour, durationHours) => {
        const arrival = (depHour + durationHours) % 24;
        const hour = Math.floor(arrival);
        const min = Math.round((arrival - hour) * 60);
        const suffix = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${min.toString().padStart(2, '0')} ${suffix}`;
    };

    const getAmenityIcon = (amenity) => {
        switch (amenity) {
            case 'wifi': return <Wifi className="w-3 h-3" />;
            case 'charging': return <Plug className="w-3 h-3" />;
            case 'sleeper': return <Moon className="w-3 h-3" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Finding bus options...</p>
            </div>
        );
    }

    return (
        <section className="py-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Bus className="w-6 h-6 text-primary" />
                    Bus Routes
                </h2>
                <span className="text-sm text-muted-foreground">{buses.length} options</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {buses.map((bus, idx) => (
                    <div
                        key={bus.id}
                        className={`relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-lg ${selectedBus === bus.id
                                ? 'border-primary bg-primary/5 shadow-lg'
                                : 'border-border bg-card hover:border-primary/50'
                            }`}
                        onClick={() => setSelectedBus(bus.id)}
                    >
                        {/* Bus Type Badge */}
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-3 border ${bus.color}`}>
                            <Bus className="w-3 h-3" />
                            {bus.type}
                        </div>

                        {/* Operator */}
                        <h3 className="font-semibold text-foreground mb-1">
                            {bus.operator}
                        </h3>

                        {/* Timing */}
                        <div className="flex items-center gap-2 text-sm mb-3">
                            <span className="font-medium">{bus.departure}</span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{bus.arrival}</span>
                            <span className="text-xs text-muted-foreground">({bus.duration})</span>
                        </div>

                        {/* Amenities */}
                        <div className="flex gap-2 mb-4">
                            {bus.amenities.map((amenity, i) => (
                                <span
                                    key={i}
                                    className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground"
                                    title={amenity.toUpperCase()}
                                >
                                    {getAmenityIcon(amenity)}
                                    <span className="capitalize">{amenity}</span>
                                </span>
                            ))}
                        </div>

                        {/* Price & Seats */}
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                            <span className="text-xs text-muted-foreground">
                                {bus.seatsAvailable} seats left
                            </span>
                            <div className="flex items-center gap-0.5 text-lg font-bold text-primary">
                                <IndianRupee className="w-4 h-4" />
                                <span>{bus.price}</span>
                            </div>
                        </div>

                        {/* Badges */}
                        {idx === 0 && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                Cheapest
                            </div>
                        )}
                        {bus.type.includes('Volvo') && bus.amenities.includes('wifi') && idx !== 0 && (
                            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                                Popular
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground mt-4 text-center">
                * Prices and availability are estimates. Book on RedBus, AbhiBus, or operator websites for actual fares.
            </p>
        </section>
    );
}
