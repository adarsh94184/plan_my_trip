"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plane, Train, Bus, Car, Clock, ArrowRight, Shuffle, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { SkeletonCard } from "@/app/components/ui/skeleton";
import { useDebounce } from "@/app/hooks/useDebounce";

const TRANSPORT_MODES = {
    flight: { icon: Plane, color: "text-blue-500", costPerKm: 12, avgSpeed: 800 },
    train: { icon: Train, color: "text-green-500", costPerKm: 6, avgSpeed: 120 },
    bus: { icon: Bus, color: "text-orange-500", costPerKm: 4, avgSpeed: 80 },
    car: { icon: Car, color: "text-purple-500", costPerKm: 10, avgSpeed: 90 },
};

const TransportOption = ({ route, isMultiModal = false }) => {
    const { segments, totalDuration, totalPrice, tags, bestFor } = route;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className={`relative p-6 rounded-2xl bg-card border shadow-sm transition-all group hover:shadow-lg ${bestFor ? 'ring-2 ring-primary border-primary' : 'border-border'
                }`}
        >
            {bestFor && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-md">
                    Best for {bestFor}
                </div>
            )}

            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                    {segments.map((seg, idx) => {
                        const Icon = TRANSPORT_MODES[seg.mode]?.icon || Bus;
                        return (
                            <div key={idx} className="p-3 bg-muted rounded-xl bg-gradient-to-br from-muted to-muted/50 border border-white/10">
                                <Icon className={`w-6 h-6 ${TRANSPORT_MODES[seg.mode]?.color || 'text-foreground'}`} />
                            </div>
                        );
                    })}
                </div>
                <div className="text-right">
                    <span className="block text-2xl font-bold text-foreground">₹{totalPrice}</span>
                    <span className="text-sm text-muted-foreground">per person</span>
                </div>
            </div>

            <h3 className="text-lg font-semibold mb-2">
                {isMultiModal ? (
                    <span className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4 text-purple-500" />
                        {segments.map(s => s.mode).join(' → ')}
                    </span>
                ) : (
                    <span className="capitalize">{segments[0].mode}</span>
                )}
            </h3>

            <div className="flex items-center text-muted-foreground mb-4">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">{totalDuration}</span>
            </div>

            {isMultiModal && segments.length > 1 && (
                <div className="mb-4 space-y-1 text-xs text-muted-foreground p-2 bg-muted/50 rounded-lg">
                    {segments.map((seg, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                            <span className="capitalize flex items-center gap-1">
                                {idx > 0 && <span className="text-xs mx-1">→</span>}
                                {seg.mode}
                            </span>
                            <span className="font-mono">{seg.duration} • ₹{seg.price}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-secondary/10 text-secondary-foreground rounded-md font-medium border border-secondary/20">
                        {tag}
                    </span>
                ))}
            </div>

            <Button className="w-full group bg-primary/90 hover:bg-primary">
                Select <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
        </motion.div>
    );
};

export default function TransportComparison({ from, to }) {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Debounce inputs
    const debouncedFrom = useDebounce(from, 800);
    const debouncedTo = useDebounce(to, 800);

    useEffect(() => {
        const calculateRoutes = async () => {
            if (!debouncedFrom || !debouncedTo) return;

            setLoading(true);
            setError(null);

            try {
                // Geocode origin and destination
                const [originRes, destRes] = await Promise.all([
                    fetch(`/api/geocode?q=${encodeURIComponent(debouncedFrom)}&limit=1`),
                    fetch(`/api/geocode?q=${encodeURIComponent(debouncedTo)}&limit=1`)
                ]);

                const originGeo = await originRes.json();
                const destGeo = await destRes.json();

                const originCoords = originGeo.features?.[0]?.properties;
                const destCoords = destGeo.features?.[0]?.properties;

                if (!originCoords || !destCoords) {
                    throw new Error("Could not geocode locations");
                }

                // Calculate straight-line distance first
                const distance = calculateDistance(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon);

                // If distance is > 300km (Geoapify limit), skip matrix API and use estimates
                if (distance > 300) {
                    console.warn("Distance > 300km, using estimated routes to avoid API limit");
                    const estRoutes = generateDistanceBasedRoutes(distance);
                    setRoutes(estRoutes);
                    setLoading(false);
                    return;
                }

                // Calculate route matrix for different modes
                const modes = ['drive']; // Only use drive for cost saving on API
                const matrixPromises = modes.map(mode =>
                    fetch('/api/routematrix', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sources: [{ lat: originCoords.lat, lon: originCoords.lon }],
                            targets: [{ lat: destCoords.lat, lon: destCoords.lon }],
                            mode,
                        }),
                    }).then(r => r.json()).then(data => ({ mode, data }))
                );

                const matrixResults = await Promise.all(matrixPromises);

                // Check for API errors
                if (matrixResults.some(r => r.data.error || !r.data.formatted)) {
                    throw new Error("Routing API limit or error");
                }

                // Generate route options
                const generatedRoutes = generateRouteOptions(matrixResults, originCoords, destCoords);
                setRoutes(generatedRoutes);
            } catch (error) {
                console.error("Failed to calculate routes:", error);

                // Fallback to purely distance-based estimates on error
                // Attempt to get coordinates if possible, otherwise use a default distance if totally failed
                try {
                    // Try to recover distance if we have coords but matrix failed
                    // If we completely failed to get coords, we can't estimate real distance
                    setError("Could not calculate transport options based on location.");
                    setRoutes(generateDistanceBasedRoutes(500)); // usage fallback
                } catch (e) {
                    setRoutes(generateDistanceBasedRoutes(500)); // absolute fallback
                }
            } finally {
                setLoading(false);
            }
        };

        calculateRoutes();
    }, [debouncedFrom, debouncedTo]);

    if (loading) {
        return (
            <section className="py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                            Calculating Best Travel Options...
                        </span>
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </section>
        );
    }

    return (
        <section className="py-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    How do you want to travel?
                </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {routes.map((route, i) => (
                    <TransportOption key={i} route={route} isMultiModal={route.segments.length > 1} />
                ))}
            </div>
        </section>
    );
}

// Generate routes based just on distance (fallback for long trips or API errors)
function generateDistanceBasedRoutes(distanceKm) {
    const routes = [];

    // Flight (for long distances)
    if (distanceKm > 250) {
        routes.push({
            segments: [{ mode: 'flight', duration: formatTime(distanceKm / 800 * 3600 + 5400), price: Math.round(distanceKm * 5 + 2000) }],
            totalDuration: formatTime(distanceKm / 800 * 3600 + 7200),
            totalPrice: Math.round(distanceKm * 5 + 2000),
            tags: ['Fastest', 'Premium'],
            bestFor: 'Time',
        });
    }

    // Train
    routes.push({
        segments: [{ mode: 'train', duration: formatTime(distanceKm / 80 * 3600), price: Math.round(distanceKm * 1.5) }],
        totalDuration: formatTime(distanceKm / 80 * 3600),
        totalPrice: Math.round(distanceKm * 1.5),
        tags: ['Comfortable', 'Scenic'],
        bestFor: distanceKm > 200 && distanceKm < 800 ? 'Value' : null,
    });

    // Bus
    routes.push({
        segments: [{ mode: 'bus', duration: formatTime(distanceKm / 60 * 3600), price: Math.round(distanceKm * 2) }],
        totalDuration: formatTime(distanceKm / 60 * 3600),
        totalPrice: Math.round(distanceKm * 2),
        tags: ['Budget', 'Direct'],
        bestFor: 'Budget',
    });

    // Car (if < 800km)
    if (distanceKm < 800) {
        routes.push({
            segments: [{ mode: 'car', duration: formatTime(distanceKm / 70 * 3600), price: Math.round(distanceKm * 8) }],
            totalDuration: formatTime(distanceKm / 70 * 3600),
            totalPrice: Math.round(distanceKm * 8),
            tags: ['Flexible', 'Private'],
            bestFor: distanceKm < 300 ? 'Comfort' : null,
        });
    }

    return routes;
}

function generateRouteOptions(matrixResults, origin, dest) {
    const routes = [];
    const distance = calculateDistance(origin.lat, origin.lon, dest.lat, dest.lon);

    // Drive Data
    const driveData = matrixResults.find(r => r.mode === 'drive');
    const driveDistance = driveData?.data?.formatted?.[0]?.[0]?.distanceRaw || distance * 1000; // meters
    const driveTime = driveData?.data?.formatted?.[0]?.[0]?.timeRaw || (distance / 70 * 3600); // seconds

    // Calculate real distance in km
    const realDistKm = driveDistance / 1000;

    return generateDistanceBasedRoutes(realDistKm);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}
