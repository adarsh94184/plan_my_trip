/**
 * Station Selector Component
 * Autocomplete for railway stations using RailRadar API
 */

"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { useDebounce } from '@/app/hooks/useDebounce';

export default function StationSelector({
    label,
    placeholder = "Search railway stations...",
    onSelect,
    defaultCity = ""
}) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);
    const debouncedQuery = useDebounce(query, 300);
    const wrapperRef = useRef(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch station suggestions
    useEffect(() => {
        async function fetchStations() {
            if (!debouncedQuery || debouncedQuery.length < 2) {
                setSuggestions([]);
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(
                    `/api/railradar/search/stations?q=${encodeURIComponent(debouncedQuery)}&limit=10`
                );

                if (response.ok) {
                    const data = await response.json();
                    setSuggestions(data.stations || []);
                } else {
                    setSuggestions([]);
                }
            } catch (error) {
                console.error('Error fetching stations:', error);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }

        fetchStations();
    }, [debouncedQuery]);

    // Pre-fill with city name if provided
    useEffect(() => {
        if (defaultCity && !selectedStation) {
            setQuery(defaultCity);
        }
    }, [defaultCity, selectedStation]);

    const handleSelect = (station) => {
        setSelectedStation(station);
        setQuery(`${station.name} (${station.code})`);
        setShowSuggestions(false);
        onSelect?.(station);
    };

    const handleClear = () => {
        setSelectedStation(null);
        setQuery("");
        setSuggestions([]);
        onSelect?.(null);
    };

    return (
        <div className="space-y-2" ref={wrapperRef}>
            {label && (
                <label className="text-sm font-medium text-foreground">
                    {label}
                </label>
            )}

            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowSuggestions(true);
                            if (selectedStation) {
                                setSelectedStation(null);
                                onSelect?.(null);
                            }
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder={placeholder}
                        className="w-full pl-9 pr-9 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    {query && (
                        <button
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && (query.length >= 2 || suggestions.length > 0) && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-xl max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Searching stations...
                            </div>
                        ) : suggestions.length > 0 ? (
                            <div className="py-1">
                                {suggestions.map((station) => (
                                    <button
                                        key={station.code}
                                        onClick={() => handleSelect(station)}
                                        className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start gap-3 group"
                                    >
                                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-medium text-sm text-foreground">
                                                    {station.name}
                                                </span>
                                                <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                                    {station.code}
                                                </span>
                                            </div>
                                            {station.state && (
                                                <span className="text-xs text-muted-foreground">
                                                    {station.state}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : query.length >= 2 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No stations found
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {selectedStation && (
                <div className="text-xs text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{selectedStation.name}</span> ({selectedStation.code})
                </div>
            )}
        </div>
    );
}
