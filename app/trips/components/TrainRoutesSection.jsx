/**
 * Train Routes Section Component
 * Allows users to search trains between specific railway stations
 */

"use client";

import { useState } from 'react';
import StationSelector from './StationSelector';
import { Button } from '@/app/components/ui/button';
import { Train, Clock, IndianRupee, ArrowRight } from 'lucide-react';

export default function TrainRoutesSection({ defaultFrom, defaultTo }) {
    const [fromStation, setFromStation] = useState(null);
    const [toStation, setToStation] = useState(null);
    const [trains, setTrains] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!fromStation || !toStation) {
            setError("Please select both origin and destination stations");
            return;
        }

        setLoading(true);
        setError(null);
        setSearched(true);

        try {
            const response = await fetch(
                `/api/railradar/trains/between?from=${encodeURIComponent(fromStation.code)}&to=${encodeURIComponent(toStation.code)}`
            );

            if (response.ok) {
                const data = await response.json();
                setTrains(data.trains || []);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to fetch trains');
                setTrains([]);
            }
        } catch (err) {
            console.error('Error searching trains:', err);
            setError('Failed to connect to server');
            setTrains([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Note:</strong> Select specific railway stations to search for trains. Cities may have multiple stations.
                </p>
            </div>

            {/* Station Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StationSelector
                    label="From Station"
                    placeholder="Search origin station..."
                    defaultCity={defaultFrom}
                    onSelect={setFromStation}
                />
                <StationSelector
                    label="To Station"
                    placeholder="Search destination station..."
                    defaultCity={defaultTo}
                    onSelect={setToStation}
                />
            </div>

            {/* Search Button */}
            <div className="flex justify-center">
                <Button
                    onClick={handleSearch}
                    disabled={!fromStation || !toStation || loading}
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
                            <Train className="w-4 h-4 mr-2" />
                            Search Trains
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
                    {trains.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">
                                    Found {trains.length} {trains.length === 1 ? 'train' : 'trains'}
                                </h3>
                            </div>
                            <div className="space-y-3">
                                {trains.map((train) => (
                                    <div
                                        key={train.train_number}
                                        className="bg-muted/30 border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Train className="w-4 h-4 text-primary" />
                                                    <h4 className="font-semibold text-foreground">
                                                        {train.train_name}
                                                    </h4>
                                                    <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                        {train.train_number}
                                                    </span>
                                                </div>
                                                {train.train_type && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {train.train_type}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Departure */}
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Departure</div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-semibold">{train.from_station_time}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {train.from_station_name}
                                                </div>
                                            </div>

                                            {/* Arrival */}
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Arrival</div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-semibold">{train.to_station_time}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {train.to_station_name}
                                                </div>
                                            </div>

                                            {/* Duration */}
                                            {train.duration && (
                                                <div>
                                                    <div className="text-xs text-muted-foreground mb-1">Duration</div>
                                                    <div className="font-semibold">{train.duration}</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Running Days */}
                                        {train.running_days && (
                                            <div className="mt-3 pt-3 border-t border-border">
                                                <div className="text-xs text-muted-foreground mb-2">Running Days</div>
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    {train.running_days.split('').map((day, idx) => (
                                                        <span
                                                            key={idx}
                                                            className={`w-6 h-6 flex items-center justify-center text-xs rounded ${day === '1'
                                                                    ? 'bg-primary text-primary-foreground'
                                                                    : 'bg-muted text-muted-foreground'
                                                                }`}
                                                        >
                                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'][idx]}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Train className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No trains found between these stations</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
