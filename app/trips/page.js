"use client";

import { Suspense } from "react";
import { useTripData } from "./hooks/useTripData";
import CollapsibleSection from "./components/CollapsibleSection";
import TransportComparison from "../components/TransportComparison";
import TripMap from "../components/TripMap";
import NearbyPlaces from "../components/NearbyPlaces";
import ItineraryTimeline from "../components/ItineraryTimeline";
import TrainRoutesSection from "./components/TrainRoutesSection";
import BusRoutesSection from "./components/BusRoutesSection";
import { Train, Bus, MapPin, Calendar, Map, ArrowLeft } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { useState } from "react";
import Link from "next/link";

function TripsContent() {
    const { tripData, loading, error } = useTripData();
    const [destCoords, setDestCoords] = useState(null);

    // Show loading state while fetching trip data
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-muted-foreground">Loading your trip...</p>
                </div>
            </div>
        );
    }

    // Show error state (shouldn't normally see this as hook redirects)
    if (error || !tripData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <p className="text-destructive">Error loading trip data</p>
                    <Link href="/" className="text-primary hover:underline">
                        Return to home
                    </Link>
                </div>
            </div>
        );
    }

    const { origin, destination, startDate, endDate } = tripData;
    const days = Math.max(1, differenceInDays(parseISO(endDate), parseISO(startDate)) + 1);

    return (
        <main className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="bg-gradient-to-r from-primary via-purple-600 to-blue-600 text-primary-foreground py-12 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Back to search</span>
                    </Link>

                    <h1 className="text-3xl md:text-5xl font-bold mb-4">
                        {origin.name} → {destination.name}
                    </h1>

                    <div className="flex flex-wrap gap-3 text-primary-foreground/90">
                        <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                                {format(parseISO(startDate), "MMM d")} - {format(parseISO(endDate), "MMM d, yyyy")}
                            </span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                            {days} {days === 1 ? 'day' : 'days'}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                {/* Route Map - Always visible */}
                <div className="bg-card rounded-2xl p-6 shadow-xl border border-border mb-6 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Map className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-semibold">Route Overview</h2>
                    </div>
                    <TripMap
                        origin={origin.name}
                        destination={destination.name}
                        onDestinationLoad={setDestCoords}
                    />
                </div>

                {/* Transport Overview - Always visible */}
                <div className="bg-card rounded-2xl p-6 shadow-xl border border-border mb-6">
                    <h2 className="text-xl font-semibold mb-4">Transport Comparison</h2>
                    <TransportComparison from={origin.name} to={destination.name} />
                </div>

                {/* Train Routes - Collapsible, lazy load */}
                <CollapsibleSection
                    title="Train Routes"
                    icon={<Train className="w-5 h-5" />}
                    defaultOpen={false}
                    badge="Search by station"
                >
                    <TrainRoutesSection
                        defaultFrom={origin.name}
                        defaultTo={destination.name}
                    />
                </CollapsibleSection>

                {/* Bus Routes - Collapsible, lazy load */}
                <CollapsibleSection
                    title="Bus Routes"
                    icon={<Bus className="w-5 h-5" />}
                    defaultOpen={false}
                    badge="Search by location"
                >
                    <BusRoutesSection
                        defaultFrom={origin.name}
                        defaultTo={destination.name}
                        defaultDate={startDate}
                    />
                </CollapsibleSection>

                {/* Nearby Places - Collapsible, lazy load */}
                {destCoords && (
                    <CollapsibleSection
                        title="Places to Visit"
                        icon={<MapPin className="w-5 h-5" />}
                        defaultOpen={false}
                    >
                        <NearbyPlaces
                            destination={destination.name}
                            lat={destCoords.lat}
                            lon={destCoords.lon}
                            radius={5000}
                        />
                    </CollapsibleSection>
                )}

                {/* Itinerary - Collapsible, lazy load */}
                <CollapsibleSection
                    title="Day-by-Day Itinerary"
                    icon={<Calendar className="w-5 h-5" />}
                    defaultOpen={false}
                    badge={`${days} days`}
                >
                    <ItineraryTimeline days={days} destination={destination.name} />
                </CollapsibleSection>
            </div>
        </main>
    );
}

export default function TripsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        }>
            <TripsContent />
        </Suspense>
    );
}
