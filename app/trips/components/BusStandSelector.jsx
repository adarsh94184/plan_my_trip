/**
 * Bus Stand Selector Component
 * Autocomplete for bus locations using Bus API suggestions
 */

"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { useDebounce } from '@/app/hooks/useDebounce';

export default function BusStandSelector({
    label,
    placeholder = "Search bus stands or cities...",
    onSelect,
    defaultCity = ""
}) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
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

    // Fetch bus location suggestions
    useEffect(() => {
        async function fetchLocations() {
            if (!debouncedQuery || debouncedQuery.length < 2) {
                setSuggestions([]);
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(
                    `/api/bus?action=suggestions&q=${encodeURIComponent(debouncedQuery)}`
                );

                if (response.ok) {
                    const data = await response.json();
                    setSuggestions(data.suggestions || []);
                } else {
                    setSuggestions([]);
                }
            } catch (error) {
                console.error('Error fetching bus locations:', error);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }

        fetchLocations();
    }, [debouncedQuery]);

    // Pre-fill with city name if provided
    useEffect(() => {
        if (defaultCity && !selectedLocation) {
            setQuery(defaultCity);
        }
    }, [defaultCity, selectedLocation]);

    const handleSelect = (location) => {
        setSelectedLocation(location);
        setQuery(location);
        setShowSuggestions(false);
        onSelect?.(location);
    };

    const handleClear = () => {
        setSelectedLocation(null);
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
                            if (selectedLocation) {
                                setSelectedLocation(null);
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
                                Searching locations...
                            </div>
                        ) : suggestions.length > 0 ? (
                            <div className="py-1">
                                {suggestions.map((location, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSelect(location)}
                                        className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3 group"
                                    >
                                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                                        <span className="text-sm text-foreground">
                                            {location}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : query.length >= 2 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No locations found
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {selectedLocation && (
                <div className="text-xs text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{selectedLocation}</span>
                </div>
            )}
        </div>
    );
}
