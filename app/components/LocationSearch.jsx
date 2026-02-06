"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/app/components/ui/input";
import { MapPin, Loader2, X, Compass, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Debounce hook
function useDebounce(callback, delay) {
    const timeoutRef = useRef(null);

    return useCallback(
        (...args) => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => callback(...args), delay);
        },
        [callback, delay]
    );
}

export default function LocationSearch({
    placeholder = "Search location...",
    onSelect,
    initialValue = "",
    className,
}) {
    const [query, setQuery] = useState(initialValue);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [geoLoading, setGeoLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Sync query with initialValue if it changes
    useEffect(() => {
        if (initialValue) {
            setQuery(initialValue);
        }
    }, [initialValue]);

    const searchLocation = useCallback(async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `/api/geocode?q=${encodeURIComponent(
                    searchQuery
                )}&type=autocomplete&limit=5`
            );

            if (!response.ok) throw new Error("Search failed");

            const data = await response.json();
            setResults(data.features || []);
            setIsOpen(true);
        } catch (err) {
            console.error(err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const debouncedSearch = useDebounce(searchLocation, 300);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        debouncedSearch(value);
    };

    const handleSelect = (feature) => {
        const formatted = feature.properties.formatted;
        setQuery(formatted);
        setIsOpen(false);
        if (onSelect) {
            onSelect({
                name: feature.properties.name || formatted,
                formatted: formatted,
                lat: feature.properties.lat,
                lon: feature.properties.lon,
                city: feature.properties.city,
                country: feature.properties.country,
            });
        }
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setGeoLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    const response = await fetch(
                        `/api/geocode?lat=${latitude}&lon=${longitude}&type=reverse`
                    );

                    if (!response.ok) throw new Error("Reverse geocoding failed");

                    const data = await response.json();

                    if (data.features && data.features.length > 0) {
                        handleSelect(data.features[0]);
                    } else {
                        alert("Could not find your location address");
                    }
                } catch (error) {
                    console.error("Location error:", error);
                    alert("Failed to get your location details");
                } finally {
                    setGeoLoading(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                setGeoLoading(false);
                alert("Please allow location access to use this feature");
            }
        );
    };

    const clearSearch = () => {
        setQuery("");
        setResults([]);
        setIsOpen(false);
        if (onSelect) onSelect(null);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div className="relative group">
                {/* Input Container */}
                <div className="relative flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl transition-all duration-300 focus-within:bg-white/20 focus-within:border-white/40 focus-within:shadow-lg focus-within:shadow-blue-500/10">

                    {/* Map Icon */}
                    <div className="pl-3 text-white/60">
                        <MapPin className="h-4 w-4" />
                    </div>

                    <Input
                        value={query}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        className="border-none bg-transparent h-12 px-3 text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                        onFocus={() => {
                            if (results.length > 0) setIsOpen(true);
                        }}
                    />

                    {/* Right Actions */}
                    <div className="flex items-center gap-1 pr-2">
                        <AnimatePresence>
                            {query && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={clearSearch}
                                    className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <X className="h-4 w-4" />
                                    )}
                                </motion.button>
                            )}
                        </AnimatePresence>

                        <div className="w-px h-6 bg-white/10 mx-1"></div>

                        <button
                            onClick={handleCurrentLocation}
                            disabled={geoLoading}
                            className={`p-2 rounded-lg transition-all duration-300 ${geoLoading
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'hover:bg-blue-500/20 text-blue-400 hover:text-blue-300'
                                }`}
                            title="Use my current location"
                        >
                            {geoLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Compass className={`h-5 w-5 ${geoLoading ? 'animate-pulse' : ''}`} />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && results.length > 0 && (
                    <motion.ul
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 mt-2 w-full max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl p-2 shadow-2xl"
                    >
                        {results.map((feature, index) => (
                            <li
                                key={feature.properties.place_id || index}
                                className="relative flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-3 text-sm text-white/90 outline-none hover:bg-white/10 transition-colors"
                                onClick={() => handleSelect(feature)}
                            >
                                <div className="p-2 rounded-full bg-white/5">
                                    <MapPin className="h-4 w-4 text-blue-400" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold text-white">
                                        {feature.properties.name || feature.properties.formatted.split(',')[0]}
                                    </span>
                                    <span className="text-xs text-white/50 line-clamp-1">
                                        {feature.properties.formatted}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}
