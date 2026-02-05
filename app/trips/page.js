"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import TransportComparison from "../components/TransportComparison";
import TrainRoutes from "../components/TrainRoutes";
import BusRoutes from "../components/BusRoutes";
import ItineraryTimeline from "../components/ItineraryTimeline";
import TripMap from "../components/TripMap";
import NearbyPlaces from "../components/NearbyPlaces";
import { format, differenceInDays, parseISO } from "date-fns";

function TripsContent() {
    const searchParams = useSearchParams();
    const from = searchParams.get("origin") || "Origin";
    const to = searchParams.get("destination") || "Destination";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const [destCoords, setDestCoords] = useState(null);

    const days = useMemo(() => {
        if (!startDate || !endDate) return 3;
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        return Math.max(1, differenceInDays(end, start) + 1);
    }, [startDate, endDate]);

    return (
        <main className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="bg-primary text-primary-foreground py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">
                        Trip to {to}
                    </h1>
                    <div className="flex flex-wrap gap-4 text-primary-foreground/80">
                        <span className="bg-white/10 px-3 py-1 rounded-full text-sm">
                            From: {from}
                        </span>
                        {startDate && endDate && (
                            <span className="bg-white/10 px-3 py-1 rounded-full text-sm">
                                {format(parseISO(startDate), "MMM d")} - {format(parseISO(endDate), "MMM d, yyyy")} ({days} days)
                            </span>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                {/* Route Map */}
                <div className="bg-card rounded-2xl p-6 shadow-xl border border-border mb-12">
                    <TripMap
                        origin={from}
                        destination={to}
                        onDestinationLoad={setDestCoords}
                    />
                </div>

                {/* Transport Overview */}
                <div className="bg-card rounded-2xl p-6 shadow-xl border border-border mb-12">
                    <TransportComparison from={from} to={to} />
                </div>

                {/* Train Routes - Real Data from RailRadar */}
                <div className="bg-card rounded-2xl p-6 shadow-xl border border-border mb-12">
                    <TrainRoutes from={from} to={to} />
                </div>

                {/* Bus Routes */}
                <div className="bg-card rounded-2xl p-6 shadow-xl border border-border mb-12">
                    <BusRoutes from={from} to={to} />
                </div>

                {/* Nearby Places */}
                {destCoords && (
                    <div className="bg-card rounded-2xl p-6 shadow-xl border border-border mb-12">
                        <NearbyPlaces
                            destination={to}
                            lat={destCoords.lat}
                            lon={destCoords.lon}
                            radius={5000}
                        />
                    </div>
                )}

                {/* Itinerary */}
                <div className="bg-card rounded-2xl p-6 shadow-xl border border-border">
                    <ItineraryTimeline days={days} destination={to} />
                </div>
            </div>
        </main>
    );
}

export default function TripsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading trip details...</div>}>
            <TripsContent />
        </Suspense>
    )
}
