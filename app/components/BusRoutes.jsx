"use client";

import { useState, useEffect } from "react";
import { Bus, Clock, IndianRupee, ArrowRight, Wifi, Plug, Moon, Snowflake, Armchair, Zap, Wallet } from "lucide-react";
import { SkeletonBusCard } from "@/app/components/ui/skeleton";
import { useDebounce } from "@/app/hooks/useDebounce";

/**
 * BusRoutes - Shows bus options between two cities
 * Uses estimated data based on distance
 */
export default function BusRoutes({ from, to, distanceKm }) {
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBus, setSelectedBus] = useState(null);

    // Debounce inputs
    const debouncedFrom = useDebounce(from, 600);
    const debouncedTo = useDebounce(to, 600);
    const debouncedDistance = useDebounce(distanceKm, 600);

    useEffect(() => {
        if (debouncedFrom && debouncedTo) {
            generateBusOptions(debouncedFrom, debouncedTo, debouncedDistance);
        }
    }, [debouncedFrom, debouncedTo, debouncedDistance]);

    const generateBusOptions = async (origin, destination, distance) => {
        setLoading(true);

        let dist = distance;
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
                dist = 500;
            }
        }

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
        const baseSpeed = 50;
        const hours = distKm / baseSpeed;

        const busTypes = [
            { type: 'Volvo AC Sleeper', operator: 'VRL Travels', pricePerKm: 2.5, amenities: ['ac', 'sleeper', 'wifi', 'charging'], gradient: 'from-purple-500/20 to-purple-600/10', text: 'text-purple-500', border: 'border-purple-500/30' },
            { type: 'AC Seater', operator: 'SRS Travels', pricePerKm: 1.8, amenities: ['ac', 'seater', 'charging'], gradient: 'from-blue-500/20 to-blue-600/10', text: 'text-blue-500', border: 'border-blue-500/30' },
            { type: 'Multi-Axle Volvo', operator: 'Orange Travels', pricePerKm: 2.2, amenities: ['ac', 'sleeper', 'wifi'], gradient: 'from-orange-500/20 to-orange-600/10', text: 'text-orange-500', border: 'border-orange-500/30' },
            { type: 'Non-AC Sleeper', operator: 'Neeta Travels', pricePerKm: 1.2, amenities: ['sleeper'], gradient: 'from-green-500/20 to-green-600/10', text: 'text-green-500', border: 'border-green-500/30' },
            { type: 'AC Semi-Sleeper', operator: 'Kallada Travels', pricePerKm: 1.5, amenities: ['ac', 'semi-sleeper', 'charging'], gradient: 'from-teal-500/20 to-teal-600/10', text: 'text-teal-500', border: 'border-teal-500/30' },
        ];

        return busTypes.map((bus, idx) => {
            const departureHours = [18, 19, 20, 21, 22];
            const depHour = departureHours[idx % departureHours.length];
            const durationVariance = 1 + (idx * 0.1);
            const totalHours = hours * durationVariance;
            const durationStr = formatDuration(totalHours);
            const basePrice = Math.round(distKm * bus.pricePerKm);
            const price = Math.round(basePrice / 10) * 10;

            return {
                id: idx + 1,
                type: bus.type,
                operator: bus.operator,
                departure: `${depHour}:00`,
                arrival: formatArrival(depHour, totalHours),
                duration: durationStr,
                price,
                amenities: bus.amenities,
                gradient: bus.gradient,
                text: bus.text,
                border: bus.border,
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
            case 'ac': return <Snowflake className="w-3 h-3" />;
            case 'seater': return <Armchair className="w-3 h-3" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <section className="py-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Bus className="w-6 h-6 text-primary" />
                        </div>
                        Bus Routes
                    </h2>
                    <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <SkeletonBusCard key={i} />
                    ))}
                </div>
            </section>
        );
    }

    return (
        <section className="py-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Bus className="w-6 h-6 text-primary" />
                    </div>
                    Bus Routes
                </h2>
                <span className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded-full">
                    {buses.length} options
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {buses.map((bus, idx) => {
                    const isSelected = selectedBus === bus.id;
                    const isCheapest = idx === 0;
                    const isPopular = bus.type.includes('Volvo') && bus.amenities.includes('wifi') && idx !== 0;

                    return (
                        <div
                            key={bus.id}
                            className={`relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer group
                                ${isSelected
                                    ? 'border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                                    : `${bus.border} hover:border-primary/50 hover:shadow-md`
                                }
                                bg-gradient-to-r ${bus.gradient}
                            `}
                            onClick={() => setSelectedBus(bus.id)}
                        >
                            {/* Badge */}
                            {(isCheapest || isPopular) && (
                                <div className={`absolute -top-2.5 -right-2.5 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white shadow-md
                                    ${isCheapest ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-primary to-primary/80'}
                                `}>
                                    {isCheapest ? <><Wallet className="w-3 h-3" /> Cheapest</> : <><Zap className="w-3 h-3" /> Popular</>}
                                </div>
                            )}

                            {/* Bus Type Badge */}
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 ${bus.text} bg-white/50 dark:bg-black/20`}>
                                <Bus className="w-3 h-3" />
                                {bus.type}
                            </div>

                            {/* Operator */}
                            <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                                {bus.operator}
                            </h3>

                            {/* Timing */}
                            <div className="flex items-center gap-2 text-sm mb-3 p-2 rounded-lg bg-white/30 dark:bg-black/10">
                                <span className="font-medium">{bus.departure}</span>
                                <ArrowRight className="w-4 h-4 text-primary" />
                                <span className="font-medium">{bus.arrival}</span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {bus.duration}
                                </span>
                            </div>

                            {/* Amenities */}
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {bus.amenities.map((amenity, i) => (
                                    <span
                                        key={i}
                                        className="flex items-center gap-1 px-2 py-1 bg-white/40 dark:bg-black/20 rounded-md text-xs font-medium"
                                        title={amenity.toUpperCase()}
                                    >
                                        {getAmenityIcon(amenity)}
                                        <span className="capitalize">{amenity}</span>
                                    </span>
                                ))}
                            </div>

                            {/* Price & Seats */}
                            <div className="flex items-center justify-between pt-3 border-t border-white/20 dark:border-white/10">
                                <span className="text-xs text-muted-foreground px-2 py-1 bg-white/30 dark:bg-black/10 rounded">
                                    {bus.seatsAvailable} seats left
                                </span>
                                <div className="flex items-center gap-0.5 text-lg font-bold text-primary">
                                    <IndianRupee className="w-4 h-4" />
                                    <span>{bus.price}</span>
                                    <span className="text-xs font-normal text-muted-foreground ml-1">~est</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="text-xs text-muted-foreground mt-6 text-center">
                * Prices are estimates. Book on RedBus, AbhiBus, or operator websites for actual fares.
            </p>
        </section>
    );
}
