"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plane, Train, Bus, Car, Clock, DollarSign, ArrowRight, Shuffle } from "lucide-react";
import { Button } from "@/app/components/ui/button";

const TRANSPORT_MODES = {
    flight: { icon: Plane, color: "text-blue-500", costPerKm: 12, avgSpeed: 800 }, // ₹12/km
    train: { icon: Train, color: "text-green-500", costPerKm: 6, avgSpeed: 120 }, // ₹6/km
    bus: { icon: Bus, color: "text-orange-500", costPerKm: 4, avgSpeed: 80 }, // ₹4/km
    car: { icon: Car, color: "text-purple-500", costPerKm: 10, avgSpeed: 90 }, // ₹10/km
};

const TransportOption = ({ route, isMultiModal = false }) => {
    const { segments, totalDuration, totalPrice, tags, bestFor } = route;

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`relative p-6 rounded-2xl bg-card border shadow-sm transition-all ${bestFor ? 'ring-2 ring-primary border-primary' : 'border-border'
                }`}
        >
            {bestFor && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Best for {bestFor}
                </div>
            )}

            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                    {segments.map((seg, idx) => {
                        const Icon = TRANSPORT_MODES[seg.mode]?.icon || Bus;
                        return (
                            <div key={idx} className="p-3 bg-muted rounded-xl">
                                <Icon className={`w-6 h-6 ${TRANSPORT_MODES[seg.mode]?.color || 'text-foreground'}`} />
                            </div>
                        );
                    })}
                </div>
                <div className="text-right">
                    <span className="block text-2xl font-bold text-foreground">₹{totalPrice}</span>
                    <span className="text-sm text-muted-foreground">per person</span>
                </div>        </div>

            <h3 className="text-lg font-semibold mb-2">
                {isMultiModal ? (
                    <span className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4" />
                        {segments.map(s => s.mode).join(' → ')}
                    </span>
                ) : (
                    <span className="capitalize">{segments[0].mode}</span>
                )}
            </h3>

            <div className="flex items-center text-muted-foreground mb-4">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm">{totalDuration}</span>
            </div>

            {/* Segment breakdown for multi-modal */}
            {isMultiModal && segments.length > 1 && (
                <div className="mb-4 space-y-1 text-xs text-muted-foreground">
                    {segments.map((seg, idx) => (
                        <div key={idx} className="flex justify-between">
                            <span className="capitalize">{seg.mode}:</span>
                            <span>{seg.duration} • ₹{seg.price}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-secondary/10 text-secondary-foreground rounded-md font-medium">
                        {tag}
                    </span>
                ))}
            </div>

            <Button className="w-full group">
                Select <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
        </motion.div>
    );
};

export default function TransportComparison({ from, to }) {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const calculateRoutes = async () => {
            setLoading(true);
            try {
                // Geocode origin and destination
                const [originRes, destRes] = await Promise.all([
                    fetch(`/api/geocode?q=${encodeURIComponent(from)}&limit=1`),
                    fetch(`/api/geocode?q=${encodeURIComponent(to)}&limit=1`)
                ]);

                const originGeo = await originRes.json();
                const destGeo = await destRes.json();

                const originCoords = originGeo.features?.[0]?.properties;
                const destCoords = destGeo.features?.[0]?.properties;

                if (!originCoords || !destCoords) {
                    throw new Error("Could not geocode locations");
                }

                // Calculate route matrix for different modes
                const modes = ['drive', 'bicycle', 'walk'];
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

                // Generate route options
                const generatedRoutes = generateRouteOptions(matrixResults, originCoords, destCoords);
                setRoutes(generatedRoutes);
            } catch (error) {
                console.error("Failed to calculate routes:", error);
                // Fallback to mock data
                setRoutes(getMockRoutes());
            } finally {
                setLoading(false);
            }
        };

        if (from && to) {
            calculateRoutes();
        }
    }, [from, to]);

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

function generateRouteOptions(matrixResults, origin, dest) {
    const routes = [];

    // Calculate distance for pricing
    const distance = calculateDistance(origin.lat, origin.lon, dest.lat, dest.lon);

    // Single-mode routes
    const driveData = matrixResults.find(r => r.mode === 'drive');
    const driveTime = driveData?.data?.formatted?.[0]?.[0]?.timeRaw || 0;
    const driveDistance = driveData?.data?.formatted?.[0]?.[0]?.distanceRaw || distance * 1000;

    // Flight (for distances > 200km)
    if (distance > 200) {
        routes.push({
            segments: [{ mode: 'flight', duration: formatTime(distance / 800 * 3600), price: Math.round(distance * 12) }],
            totalDuration: formatTime(distance / 800 * 3600 + 7200), // Add 2h for airport time
            totalPrice: Math.round(distance * 12),
            tags: ['Fastest', 'Premium'],
            bestFor: 'Time',
        });
    }

    // Train
    routes.push({
        segments: [{ mode: 'train', duration: formatTime(distance / 120 * 3600), price: Math.round(distance * 6) }],
        totalDuration: formatTime(distance / 120 * 3600),
        totalPrice: Math.round(distance * 6),
        tags: ['Comfortable', 'Scenic', 'WiFi'],
        bestFor: distance > 200 ? 'Value' : null,
    });

    // Bus
    routes.push({
        segments: [{ mode: 'bus', duration: formatTime(distance / 80 * 3600), price: Math.round(distance * 4) }],
        totalDuration: formatTime(distance / 80 * 3600),
        totalPrice: Math.round(distance * 4),
        tags: ['Budget', 'Direct'],
        bestFor: 'Budget',
    });

    // Multi-modal: Car + Train
    if (distance > 100) {
        const carDistance = distance * 0.2; // 20% by car
        const trainDistance = distance * 0.8; // 80% by train
        const carTime = (carDistance / 90) * 3600;
        const trainTime = (trainDistance / 120) * 3600;

        routes.push({
            segments: [
                { mode: 'car', duration: formatTime(carTime), price: Math.round(carDistance * 10) },
                { mode: 'train', duration: formatTime(trainTime), price: Math.round(trainDistance * 6) },
            ],
            totalDuration: formatTime(carTime + trainTime + 1800), // Add 30min transfer
            totalPrice: Math.round(carDistance * 10 + trainDistance * 6),
            tags: ['Flexible', 'Mixed'],
            bestFor: null,
        });
    }

    // Multi-modal: Bus + Train
    if (distance > 150) {
        const busDistance = distance * 0.3;
        const trainDistance = distance * 0.7;
        const busTime = (busDistance / 80) * 3600;
        const trainTime = (trainDistance / 120) * 3600;

        routes.push({
            segments: [
                { mode: 'bus', duration: formatTime(busTime), price: Math.round(busDistance * 4) },
                { mode: 'train', duration: formatTime(trainTime), price: Math.round(trainDistance * 6) },
            ],
            totalDuration: formatTime(busTime + trainTime + 1200), // Add 20min transfer
            totalPrice: Math.round(busDistance * 4 + trainDistance * 6),
            tags: ['Economical', 'Mixed'],
            bestFor: null,
        });
    }

    return routes.slice(0, 6); // Return top 6 options
}

function getMockRoutes() {
    return [
        {
            segments: [{ mode: 'flight', duration: '1h 20m', price: 4500 }],
            totalDuration: '3h 20m',
            totalPrice: 4500,
            tags: ['Fastest', 'Premium'],
            bestFor: 'Time',
        },
        {
            segments: [{ mode: 'train', duration: '4h 15m', price: 1200 }],
            totalDuration: '4h 15m',
            totalPrice: 1200,
            tags: ['Comfortable', 'Scenic'],
            bestFor: 'Value',
        },
        {
            segments: [{ mode: 'bus', duration: '6h 30m', price: 600 }],
            totalDuration: '6h 30m',
            totalPrice: 600,
            tags: ['Budget', 'Direct'],
            bestFor: 'Budget',
        },
    ];
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
