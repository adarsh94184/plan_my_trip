/**
 * Bus Routes Section Component
 * Allows users to search buses between specific locations
 */

"use client";

import { useState } from 'react';
import BusStandSelector from './BusStandSelector';
import { Button } from '@/app/components/ui/button';
import { Bus, Clock, IndianRupee, Calendar, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function BusRoutesSection({ defaultFrom, defaultTo, defaultDate }) {
    const [fromLocation, setFromLocation] = useState(null);
    const [toLocation, setToLocation] = useState(null);
    const [searchDate, setSearchDate] = useState(defaultDate || format(new Date(), 'yyyy-MM-dd'));
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!fromLocation || !toLocation) {
            setError("Please select both origin and destination");
            return;
        }

        setLoading(true);
        setError(null);
        setSearched(true);

        try {
            const response = await fetch(
                `/api/bus?action=search&from=${encodeURIComponent(fromLocation)}&to=${encodeURIComponent(toLocation)}&date=${searchDate}`
            );

            if (response.ok) {
                const data = await response.json();
                setBuses(data.buses || []);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to fetch buses');
                setBuses([]);
            }
        } catch (err) {
            console.error('Error searching buses:', err);
            setError('Failed to connect to server');
            setBuses([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                    <strong>Note:</strong> Select specific bus stands or locations for accurate search results.
                </p>
            </div>

            {/* Location Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BusStandSelector
                    label="From Location"
                    placeholder="Search bus stand or city..."
                    defaultCity={defaultFrom}
                    onSelect={setFromLocation}
                />
                <BusStandSelector
                    label="To Location"
                    placeholder="Search bus stand or city..."
                    defaultCity={defaultTo}
                    onSelect={setToLocation}
                />
            </div>

            {/* Date Picker */}
            <div className="max-w-sm">
                <label className="text-sm font-medium text-foreground block mb-2">
                    Journey Date
                </label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Search Button */}
            <div className="flex justify-center">
                <Button
                    onClick={handleSearch}
                    disabled={!fromLocation || !toLocation || loading}
                    size="lg"
                    className="min-w-48"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Searching...
                        </>
                    ) : (
                        <>
                            <Bus className="w-4 h-4 mr-2" />
                            Search Buses
                        </>
                    )}
                </Button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {/* Results */}
            {searched && !loading && (
                <div className="space-y-4">
                    {buses.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">
                                    Found {buses.length} {buses.length === 1 ? 'bus' : 'buses'}
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {buses.map((bus, index) => (
                                    <div
                                        key={index}
                                        className="bg-muted/30 border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Bus className="w-4 h-4 text-primary" />
                                                    <h4 className="font-semibold text-foreground">
                                                        {bus.operator}
                                                    </h4>
                                                </div>
                                                {bus.busType && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {bus.busType}
                                                    </span>
                                                )}
                                            </div>
                                            {bus.price && (
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 text-lg font-bold text-primary">
                                                        <IndianRupee className="w-4 h-4" />
                                                        {bus.price}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">onwards</div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Departure */}
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Departure</div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-semibold">{bus.departureTime}</span>
                                                </div>
                                            </div>

                                            {/* Arrival */}
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Arrival</div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-semibold">{bus.arrivalTime}</span>
                                                </div>
                                            </div>

                                            {/* Duration */}
                                            {bus.duration && (
                                                <div>
                                                    <div className="text-xs text-muted-foreground mb-1">Duration</div>
                                                    <div className="font-semibold">{bus.duration}</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Additional Info */}
                                        <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 flex-wrap">
                                            {bus.rating && (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                                    <span className="font-medium">{bus.rating}</span>
                                                </div>
                                            )}
                                            {bus.seatsAvailable && (
                                                <div className="text-sm text-muted-foreground">
                                                    {bus.seatsAvailable} seats available
                                                </div>
                                            )}
                                            {bus.amenities && bus.amenities.length > 0 && (
                                                <div className="text-xs text-muted-foreground">
                                                    {bus.amenities.join(' • ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Bus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No buses found for this route on {format(parseISO(searchDate), 'MMM d, yyyy')}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
