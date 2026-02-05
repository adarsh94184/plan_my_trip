"use client";

import { useState, useEffect } from "react";
import { Train, Clock, IndianRupee, ArrowRight, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/app/components/ui/button";

/**
 * TrainRoutes - Shows real train options between two stations using RailRadar API
 */
export default function TrainRoutes({ from, to, fromCode, toCode }) {
    const [trains, setTrains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTrain, setSelectedTrain] = useState(null);

    useEffect(() => {
        if (from && to) {
            // Search for stations and fetch trains from all combinations
            fetchWithStationSearch(from, to);
        }
    }, [from, to]);

    // Extract just the city name from full address (e.g., "Mumbai, MH, India" -> "Mumbai")
    const extractCityName = (fullAddress) => {
        if (!fullAddress) return '';
        // Take the first part before comma
        const cityName = fullAddress.split(',')[0].trim();
        // Remove common suffixes
        return cityName.replace(/\s+(India|City|Town|District)$/i, '').trim();
    };

    const fetchWithStationSearch = async (fromCity, toCity) => {
        setLoading(true);
        setError(null);

        try {
            // Extract just city names for RailRadar search
            const fromCityClean = extractCityName(fromCity);
            const toCityClean = extractCityName(toCity);

            console.log(`Searching stations for: ${fromCityClean} -> ${toCityClean}`);

            // Search for source stations
            const srcRes = await fetch(`/api/railradar/search/stations?query=${encodeURIComponent(fromCityClean)}`);
            const srcJson = await srcRes.json();
            console.log('Source stations response:', srcJson);

            // API returns { stations: [...] }
            const srcData = srcJson.stations || [];

            // Search for destination stations
            const destRes = await fetch(`/api/railradar/search/stations?query=${encodeURIComponent(toCityClean)}`);
            const destJson = await destRes.json();
            console.log('Destination stations response:', destJson);

            // API returns { stations: [...] }
            const destData = destJson.stations || [];

            if (!srcData || !Array.isArray(srcData) || srcData.length === 0) {
                setError(`Could not find railway station for "${fromCityClean}". Try a nearby major city.`);
                setLoading(false);
                return;
            }

            if (!destData || !Array.isArray(destData) || destData.length === 0) {
                setError(`Could not find railway station for "${toCityClean}". Try a nearby major city.`);
                setLoading(false);
                return;
            }

            // Get station codes - try multiple stations (up to 3 per city)
            const srcStations = srcData.slice(0, 3).map(s => ({
                code: s.code || s.stationCode,
                name: s.name || s.stationName
            })).filter(s => s.code);

            const destStations = destData.slice(0, 3).map(s => ({
                code: s.code || s.stationCode,
                name: s.name || s.stationName
            })).filter(s => s.code);

            console.log('Source station codes:', srcStations.map(s => s.code));
            console.log('Destination station codes:', destStations.map(s => s.code));

            if (srcStations.length === 0 || destStations.length === 0) {
                setError("Invalid station codes received from API");
                setLoading(false);
                return;
            }

            // Try all combinations and aggregate results
            await fetchTrainsFromMultipleStations(srcStations, destStations);
        } catch (err) {
            console.error('Station search error:', err);
            setError(`Failed to search stations: ${err.message || 'Unknown error'}`);
            setLoading(false);
        }
    };

    const fetchTrainsFromMultipleStations = async (srcStations, destStations) => {
        const allTrains = [];
        const seenTrainNumbers = new Set();

        try {
            // Try each source-destination combination
            for (const src of srcStations) {
                for (const dest of destStations) {
                    console.log(`Trying route: ${src.code} -> ${dest.code}`);

                    try {
                        const res = await fetch(`/api/railradar/trains/between?from=${src.code}&to=${dest.code}`);

                        if (!res.ok) {
                            console.warn(`Failed to fetch trains from ${src.code} to ${dest.code}:`, res.status);
                            continue;
                        }

                        const data = await res.json();
                        console.log(`Response from ${src.code} -> ${dest.code}:`, data);

                        // API returns { trains: [...] }
                        const trains = data.trains || [];

                        if (Array.isArray(trains) && trains.length > 0) {
                            console.log(`Found ${trains.length} trains for ${src.code} -> ${dest.code}`);
                            // Add unique trains
                            trains.forEach(train => {
                                if (!seenTrainNumbers.has(train.number)) {
                                    seenTrainNumbers.add(train.number);
                                    allTrains.push({
                                        ...train,
                                        sourceStation: train.sourceStation || src.name,
                                        destStation: train.destStation || dest.name,
                                    });
                                }
                            });
                        }
                    } catch (err) {
                        console.warn(`Error fetching trains from ${src.code} to ${dest.code}:`, err);
                        // Continue to next combination
                    }
                }
            }

            console.log(`Total unique trains found: ${allTrains.length}`);

            if (allTrains.length > 0) {
                // Sort by duration and take top trains
                const sortedTrains = allTrains
                    .filter(t => t.duration)
                    .sort((a, b) => parseDuration(a.duration) - parseDuration(b.duration))
                    .slice(0, 9); // Show up to 9 trains
                setTrains(sortedTrains);
                setError(null);
            } else {
                setTrains([]);
                setError(`No trains found between these cities. Try searching specific station names (e.g., "New Delhi" or "Mumbai Central")`);
            }
        } catch (err) {
            console.error('Error fetching trains from multiple stations:', err);
            setError(`Failed to fetch trains: ${err.message || 'Unknown error'}`);
            setTrains([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrainsBetween = async (srcCode, destCode) => {
        setLoading(true);
        setError(null);

        try {
            console.log(`Fetching trains from ${srcCode} to ${destCode}`);
            const res = await fetch(`/api/railradar/trains/between?from=${srcCode}&to=${destCode}`);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('API Response Error:', res.status, errorText);
                throw new Error(`API returned ${res.status}: ${errorText}`);
            }

            const data = await res.json();
            console.log('API Response:', data);

            if (data.error) {
                console.error('API Error:', data.error);
                setError(data.error);
                setTrains([]);
            } else if (data.trains && Array.isArray(data.trains) && data.trains.length > 0) {
                console.log(`Found ${data.trains.length} trains`);
                // Sort by duration and take top trains
                const sortedTrains = data.trains
                    .filter(t => t.duration)
                    .sort((a, b) => parseDuration(a.duration) - parseDuration(b.duration))
                    .slice(0, 6);
                setTrains(sortedTrains);
            } else {
                console.warn('No trains in response:', data);
                setTrains([]);
                setError("No direct trains found between these stations. Try different cities or check station names.");
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError(`Failed to fetch trains: ${err.message || 'Unknown error'}`);
            setTrains([]);
        } finally {
            setLoading(false);
        }
    };

    const parseDuration = (durationStr) => {
        if (!durationStr) return Infinity;
        const match = durationStr.match(/(\d+)h\s*(\d+)?m?/);
        if (match) {
            const hours = parseInt(match[1]) || 0;
            const mins = parseInt(match[2]) || 0;
            return hours * 60 + mins;
        }
        return Infinity;
    };

    const estimatePrice = (durationStr, trainType) => {
        // Rough price estimation based on train type and duration in INR
        const hours = parseDuration(durationStr) / 60;
        const baseRates = {
            'Rajdhani': 80, // per hour
            'Shatabdi': 70,
            'Duronto': 75,
            'Vande Bharat': 90,
            'Superfast': 40,
            'Express': 30,
            'Mail': 25,
            'default': 35
        };

        const rate = Object.entries(baseRates).find(([key]) =>
            trainType?.toLowerCase().includes(key.toLowerCase())
        )?.[1] || baseRates.default;

        return Math.round(hours * rate * 10) * 10; // Round to nearest 10
    };

    const getTrainTypeColor = (trainName) => {
        if (trainName?.toLowerCase().includes('rajdhani')) return 'bg-red-500/10 text-red-500 border-red-500/20';
        if (trainName?.toLowerCase().includes('shatabdi')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        if (trainName?.toLowerCase().includes('vande bharat')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
        if (trainName?.toLowerCase().includes('duronto')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        return 'bg-green-500/10 text-green-500 border-green-500/20';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Searching trains from all stations...</p>
                <p className="text-xs text-muted-foreground mt-2">Checking multiple station combinations</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-8 h-8 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button variant="outline" size="sm" onClick={() => fetchWithStationSearch(from, to)}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                </Button>
            </div>
        );
    }

    return (
        <section className="py-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Train className="w-6 h-6 text-primary" />
                    Train Routes
                </h2>
                <span className="text-sm text-muted-foreground">{trains.length} trains found</span>
            </div>

            {trains.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    No trains found for this route
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trains.map((train, idx) => {
                        const price = estimatePrice(train.duration, train.name);
                        return (
                            <div
                                key={train.number || idx}
                                className={`relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-lg ${selectedTrain === train.number
                                    ? 'border-primary bg-primary/5 shadow-lg'
                                    : 'border-border bg-card hover:border-primary/50'
                                    }`}
                                onClick={() => setSelectedTrain(train.number)}
                            >
                                {/* Train Type Badge */}
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-3 border ${getTrainTypeColor(train.name)}`}>
                                    <Train className="w-3 h-3" />
                                    {train.type || 'Express'}
                                </div>

                                {/* Train Name & Number */}
                                <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                                    {train.name}
                                </h3>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Train #{train.number}
                                </p>

                                {/* Route */}
                                <div className="flex items-center gap-2 text-sm mb-4">
                                    <span className="font-medium">{train.sourceStation || from}</span>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span className="font-medium">{train.destStation || to}</span>
                                </div>

                                {/* Duration & Price */}
                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">{train.duration || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 text-lg font-bold text-primary">
                                        <IndianRupee className="w-4 h-4" />
                                        <span>{price}</span>
                                        <span className="text-xs font-normal text-muted-foreground ml-1">~est</span>
                                    </div>
                                </div>

                                {/* Running Days */}
                                {train.runningDays && (
                                    <div className="mt-3 flex gap-1">
                                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                            <span
                                                key={i}
                                                className={`w-5 h-5 flex items-center justify-center text-xs rounded ${train.runningDays[i]
                                                    ? 'bg-primary/20 text-primary font-medium'
                                                    : 'bg-muted text-muted-foreground'
                                                    }`}
                                            >
                                                {day}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Best Deal Badge */}
                                {idx === 0 && (
                                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                                        Fastest
                                    </div>
                                )}
                                {idx === trains.length - 1 && trains.length > 1 && (
                                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        Budget
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground mt-4 text-center">
                * Prices are estimated based on train type. Actual fares may vary. Book on IRCTC for exact prices.
            </p>
        </section>
    );
}
