"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/app/components/ui/input";
import { MapPin, Loader2, X } from "lucide-react";
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
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

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
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="pl-9 pr-9"
                    onFocus={() => {
                        if (results.length > 0) setIsOpen(true);
                    }}
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <X className="h-4 w-4" />
                        )}
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && results.length > 0 && (
                    <motion.ul
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
                    >
                        {results.map((feature, index) => (
                            <li
                                key={feature.properties.place_id || index}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                onClick={() => handleSelect(feature)}
                            >
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-medium">
                                        {feature.properties.name || feature.properties.formatted}
                                    </span>
                                    <span className="text-xs text-muted-foreground line-clamp-1">
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
