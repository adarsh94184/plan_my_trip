"use client";

import { useState, useEffect, useMemo } from "react";
import { Train, Clock, IndianRupee, ArrowRight, AlertCircle, RefreshCw, Zap, Wallet } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { SkeletonTrainCard } from "@/app/components/ui/skeleton";
import { useDebounce } from "@/app/hooks/useDebounce";

/**
 * TrainRoutes - Shows real train options between two stations using RailRadar API
 */
export default function TrainRoutes({ from, to }) {
    const [trains, setTrains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTrain, setSelectedTrain] = useState(null);

    // Debounce the search inputs
    const debouncedFrom = useDebounce(from, 600);
    const debouncedTo = useDebounce(to, 600);

    useEffect(() => {
        if (debouncedFrom && debouncedTo) {
            fetchWithStationSearch(debouncedFrom, debouncedTo);
        }
    }, [debouncedFrom, debouncedTo]);

    // Extract just the city name from full address
    const extractCityName = (fullAddress) => {
        if (!fullAddress) return '';
        const cityName = fullAddress.split(',')[0].trim();
        return cityName.replace(/\s+(India|City|Town|District)$/i, '').trim();
    };

    const fetchWithStationSearch = async (fromCity, toCity) => {
        setLoading(true);
        setError(null);

        try {
            const fromCityClean = extractCityName(fromCity);
            const toCityClean = extractCityName(toCity);

            console.log(`Searching stations for: ${fromCityClean} -> ${toCityClean}`);

            const [srcRes, destRes] = await Promise.all([
                fetch(`/api/railradar/search/stations?query=${encodeURIComponent(fromCityClean)}`),
                fetch(`/api/railradar/search/stations?query=${encodeURIComponent(toCityClean)}`)
            ]);

            const [srcJson, destJson] = await Promise.all([srcRes.json(), destRes.json()]);

            const srcData = srcJson.stations || [];
            const destData = destJson.stations || [];

            if (srcData.length === 0) {
                setError(`No railway station found for "${fromCityClean}". Try a nearby major city.`);
                setLoading(false);
                return;
            }

            if (destData.length === 0) {
                setError(`No railway station found for "${toCityClean}". Try a nearby major city.`);
                setLoading(false);
                return;
            }

            // Sort and filter stations to prioritize major ones
            const prioritizeStations = (stations, query) => {
                const q = query.toLowerCase();
                return stations.sort((a, b) => {
                    const nameA = a.name.toLowerCase();
                    const nameB = b.name.toLowerCase();

                    // 1. Exact match (highest priority)
                    if (nameA === q && nameB !== q) return -1;
                    if (nameB === q && nameA !== q) return 1;

                    // 2. Starts with query
                    const startsA = nameA.startsWith(q);
                    const startsB = nameB.startsWith(q);
                    if (startsA && !startsB) return -1;
                    if (startsB && !startsA) return 1;

                    // 3. Contains major keywords (Junction, Central, Cantt, Terminus)
                    const majorKeywords = ['jn', 'junction', 'central', 'cantt', 'terminus', 'city'];
                    const isMajorA = majorKeywords.some(k => nameA.includes(k));
                    const isMajorB = majorKeywords.some(k => nameB.includes(k));
                    if (isMajorA && !isMajorB) return -1;
                    if (isMajorB && !isMajorA) return 1;

                    // 4. Alphabetical fallback
                    return nameA.localeCompare(nameB);
                });
            };

            const srcStations = prioritizeStations(srcData, fromCityClean)
                .slice(0, 3)
                .map(s => ({
                    code: s.code || s.stationCode,
                    name: s.name || s.stationName
                }))
                .filter(s => s.code);

            const destStations = prioritizeStations(destData, toCityClean)
                .slice(0, 3)
                .map(s => ({
                    code: s.code || s.stationCode,
                    name: s.name || s.stationName
                }))
                .filter(s => s.code);

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
            for (const src of srcStations) {
                for (const dest of destStations) {
                    try {
                        const res = await fetch(`/api/railradar/trains/between?from=${src.code}&to=${dest.code}`);
                        if (!res.ok) continue;

                        const data = await res.json();
                        const trains = data.trains || [];

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
                    } catch (err) {
                        continue;
                    }
                }
            }

            if (allTrains.length > 0) {
                const sortedTrains = allTrains
                    .filter(t => t.duration)
                    .sort((a, b) => parseDuration(a.duration) - parseDuration(b.duration))
                    .slice(0, 9);
                setTrains(sortedTrains);
                setError(null);
            } else {
                setTrains([]);
                setError(`No direct trains found. Try searching for specific station names.`);
            }
        } catch (err) {
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
            return (parseInt(match[1]) || 0) * 60 + (parseInt(match[2]) || 0);
        }
        return Infinity;
    };

    const estimatePrice = (durationStr, trainType) => {
        const hours = parseDuration(durationStr) / 60;
        const baseRates = {
            'Rajdhani': 80, 'Shatabdi': 70, 'Duronto': 75,
            'Vande Bharat': 90, 'Superfast': 40, 'Express': 30,
            'Mail': 25, 'default': 35
        };
        const rate = Object.entries(baseRates).find(([key]) =>
            trainType?.toLowerCase().includes(key.toLowerCase())
        )?.[1] || baseRates.default;
        return Math.round(hours * rate * 10) * 10;
    };

    const getTrainTypeStyle = (trainName) => {
        if (trainName?.toLowerCase().includes('rajdhani'))
            return { bg: 'bg-gradient-to-r from-red-500/20 to-red-600/10', text: 'text-red-500', border: 'border-red-500/30' };
        if (trainName?.toLowerCase().includes('shatabdi'))
            return { bg: 'bg-gradient-to-r from-blue-500/20 to-blue-600/10', text: 'text-blue-500', border: 'border-blue-500/30' };
        if (trainName?.toLowerCase().includes('vande bharat'))
            return { bg: 'bg-gradient-to-r from-orange-500/20 to-orange-600/10', text: 'text-orange-500', border: 'border-orange-500/30' };
        if (trainName?.toLowerCase().includes('duronto'))
            return { bg: 'bg-gradient-to-r from-purple-500/20 to-purple-600/10', text: 'text-purple-500', border: 'border-purple-500/30' };
        return { bg: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10', text: 'text-emerald-500', border: 'border-emerald-500/30' };
    };

    // Loading skeleton
    if (loading) {
        return (
            <section className="py-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Train className="w-6 h-6 text-primary" />
                        </div>
                        Train Routes
                    </h2>
                    <span className="text-sm text-muted-foreground animate-pulse">Searching...</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <SkeletonTrainCard key={i} />
                    ))}
                </div>
            </section>
        );
    }

    // Error state
    if (error) {
        return (
            <section className="py-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Train className="w-6 h-6 text-primary" />
                        </div>
                        Train Routes
                    </h2>
                </div>
                <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-xl border border-border">
                    <AlertCircle className="w-10 h-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
                    <Button variant="outline" size="sm" onClick={() => fetchWithStationSearch(from, to)}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                    </Button>
                </div>
            </section>
        );
    }

    return (
        <section className="py-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Train className="w-6 h-6 text-primary" />
                    </div>
                    Train Routes
                </h2>
                <span className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded-full">
                    {trains.length} trains found
                </span>
            </div>

            {trains.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl border border-border">
                    No trains found for this route
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trains.map((train, idx) => {
                        const price = estimatePrice(train.duration, train.name);
                        const style = getTrainTypeStyle(train.name);
                        const isSelected = selectedTrain === train.number;
                        const isFastest = idx === 0;
                        const isCheapest = idx === trains.length - 1 && trains.length > 1;

                        return (
                            <div
                                key={train.number || idx}
                                className={`relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer group
                                    ${isSelected
                                        ? 'border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                                        : `${style.border} hover:border-primary/50 hover:shadow-md`
                                    }
                                    ${style.bg}
                                `}
                                onClick={() => setSelectedTrain(train.number)}
                            >
                                {/* Badge */}
                                {(isFastest || isCheapest) && (
                                    <div className={`absolute -top-2.5 -right-2.5 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white shadow-md
                                        ${isFastest ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-green-500'}
                                    `}>
                                        {isFastest ? <><Zap className="w-3 h-3" /> Fastest</> : <><Wallet className="w-3 h-3" /> Budget</>}
                                    </div>
                                )}

                                {/* Train Type Badge */}
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 ${style.text} bg-white/50 dark:bg-black/20`}>
                                    <Train className="w-3 h-3" />
                                    {train.type || 'Express'}
                                </div>

                                {/* Train Name & Number */}
                                <h3 className="font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                    {train.name}
                                </h3>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Train #{train.number}
                                </p>

                                {/* Route */}
                                <div className="flex items-center gap-2 text-sm mb-4 p-2 rounded-lg bg-white/30 dark:bg-black/10">
                                    <span className="font-medium truncate">{train.sourceStation || from}</span>
                                    <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                                    <span className="font-medium truncate">{train.destStation || to}</span>
                                </div>

                                {/* Duration & Price */}
                                <div className="flex items-center justify-between pt-3 border-t border-white/20 dark:border-white/10">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm font-medium">{train.duration || 'N/A'}</span>
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
                                                className={`w-6 h-6 flex items-center justify-center text-xs rounded-md font-medium transition-colors
                                                    ${train.runningDays[i]
                                                        ? 'bg-primary/20 text-primary'
                                                        : 'bg-muted/50 text-muted-foreground'
                                                    }`}
                                            >
                                                {day}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <p className="text-xs text-muted-foreground mt-6 text-center">
                * Prices are estimated based on train type. Actual fares may vary. Book on IRCTC for exact prices.
            </p>
        </section>
    );
}
