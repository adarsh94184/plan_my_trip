"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LocationSearch from "./LocationSearch";
import { Button } from "@/app/components/ui/button";
import { CalendarIcon, ArrowRight } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

// Dynamic import for Leaflet map to avoid SSR issues
import dynamic from 'next/dynamic';
const LeafletMap = dynamic(() => import('./LeafletMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-muted/20 animate-pulse">Loading Map...</div>
});

import { Map as MapIcon, X } from "lucide-react"; // Import MapIcon

export default function SearchForm({ onLocationChange }) {
    const router = useRouter();
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [showMap, setShowMap] = useState(false); // Map modal state

    // Default: today and tomorrow
    const today = new Date();
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(addDays(today, 3));

    const [activeCalendar, setActiveCalendar] = useState(null); // 'start' | 'end' | null

    // Sync persistence
    useEffect(() => {
        try {
            const savedData = sessionStorage.getItem('tripSearch');
            if (savedData) {
                const parsed = JSON.parse(savedData);

                if (parsed.origin) {
                    setOrigin(parsed.origin);
                    onLocationChange?.('origin', parsed.origin);
                }
                if (parsed.destination) {
                    setDestination(parsed.destination);
                    onLocationChange?.('destination', parsed.destination);
                }

                if (parsed.startDate) setStartDate(parseISO(parsed.startDate));
                if (parsed.endDate) setEndDate(parseISO(parsed.endDate));
            }
        } catch (e) {
            console.error('Error loading saved search:', e);
        }
    }, []);

    // Notify parent when locations change
    const handleOriginSelect = (data) => {
        setOrigin(data);
        onLocationChange?.('origin', data);
    };

    const handleDestinationSelect = (data) => {
        setDestination(data);
        onLocationChange?.('destination', data);
    };

    // Callback from Map Modal (keep modal for mobile or specific intent)
    const handleMapSelect = (type, data) => {
        if (type === 'origin') handleOriginSelect(data);
        if (type === 'destination') handleDestinationSelect(data);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!origin || !destination || !startDate || !endDate) {
            alert("Please fill in all fields");
            return;
        }

        // Store trip data in sessionStorage for clean URL
        const tripData = {
            origin: {
                name: origin.name,
                lat: origin.lat,
                lon: origin.lon
            },
            destination: {
                name: destination.name,
                lat: destination.lat,
                lon: destination.lon
            },
            startDate: format(startDate, "yyyy-MM-dd"),
            endDate: format(endDate, "yyyy-MM-dd"),
            timestamp: Date.now() // For cache expiry if needed
        };

        sessionStorage.setItem('tripSearch', JSON.stringify(tripData));

        // Navigate to clean URL
        router.push('/trips');
    };

    const handleStartDateSelect = (date) => {
        if (date) {
            setStartDate(date);
            // If end date is before new start date, adjust it
            if (endDate && date > endDate) {
                setEndDate(addDays(date, 1));
            }
            setActiveCalendar(null);
        }
    };

    const handleEndDateSelect = (date) => {
        if (date) {
            setEndDate(date);
            setActiveCalendar(null);
        }
    };

    return (
        <>
            {/* Backdrop for calendar */}
            {activeCalendar && (
                <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => setActiveCalendar(null)}
                />
            )}

            {/* Map Modal */}
            {showMap && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
                    <div className="relative w-full max-w-6xl h-[80vh] bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                <MapIcon className="w-5 h-5 text-blue-500" />
                                Select Locations on Map
                            </h3>
                            <button
                                onClick={() => setShowMap(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 relative">
                            <LeafletMap
                                origin={origin}
                                destination={destination}
                                onLocationSelect={handleMapSelect}
                            />
                        </div>
                        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
                            <Button
                                onClick={() => setShowMap(false)}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-medium"
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="w-full bg-black/40 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col gap-6 relative z-10 transition-all hover:border-white/20">
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold tracking-wider text-blue-300 uppercase ml-1 flex justify-between items-center">
                            From
                            <button type="button" onClick={() => setShowMap(true)} className="md:hidden text-xs text-white/50 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-full hover:bg-white/5">
                                <MapIcon className="w-3 h-3" /> Map
                            </button>
                        </label>
                        <LocationSearch
                            placeholder="Origin City"
                            onSelect={handleOriginSelect}
                            initialValue={origin?.name || ""}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold tracking-wider text-purple-300 uppercase ml-1 flex justify-between items-center">
                            To
                            <button type="button" onClick={() => setShowMap(true)} className="md:hidden text-xs text-white/50 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-full hover:bg-white/5">
                                <MapIcon className="w-3 h-3" /> Map
                            </button>
                        </label>
                        <LocationSearch
                            placeholder="Destination City"
                            onSelect={handleDestinationSelect}
                            initialValue={destination?.name || ""}
                            className="w-full"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div className="space-y-2 relative">
                        <label className="text-xs font-semibold tracking-wider text-white/60 uppercase ml-1">Departure</label>
                        <button
                            type="button"
                            onClick={() => setActiveCalendar(activeCalendar === 'start' ? null : 'start')}
                            className="w-full h-12 flex items-center gap-3 px-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl text-white text-sm transition-all duration-300 group"
                        >
                            <CalendarIcon className="w-4 h-4 text-white/50 group-hover:text-blue-400 transition-colors" />
                            <span className="font-medium truncate">{format(startDate, "MMM d")}</span>
                        </button>

                        {activeCalendar === 'start' && (
                            <div className="absolute bottom-full left-0 mb-4 z-[200] bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <DayPicker
                                    mode="single"
                                    selected={startDate}
                                    onSelect={handleStartDateSelect}
                                    disabled={{ before: new Date() }}
                                    defaultMonth={startDate}
                                    className="!bg-transparent"
                                    classNames={{
                                        month: "space-y-4",
                                        caption: "flex justify-center pt-1 relative items-center text-foreground",
                                        caption_label: "text-sm font-medium",
                                        nav: "space-x-1 flex items-center",
                                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-border",
                                        nav_button_previous: "absolute left-1",
                                        nav_button_next: "absolute right-1",
                                        table: "w-full border-collapse space-y-1",
                                        head_row: "flex",
                                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                                        row: "flex w-full mt-2",
                                        cell: "h-9 w-9 text-center text-sm p-0 relative",
                                        day: "h-9 w-9 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md transition-colors cursor-pointer",
                                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                                        day_today: "ring-2 ring-primary/50",
                                        day_outside: "text-muted-foreground opacity-50",
                                        day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* End Date */}
                    <div className="space-y-2 relative">
                        <label className="text-xs font-semibold tracking-wider text-white/60 uppercase ml-1">Return</label>
                        <button
                            type="button"
                            onClick={() => setActiveCalendar(activeCalendar === 'end' ? null : 'end')}
                            className="w-full h-12 flex items-center gap-3 px-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl text-white text-sm transition-all duration-300 group"
                        >
                            <CalendarIcon className="w-4 h-4 text-white/50 group-hover:text-purple-400 transition-colors" />
                            <span className="font-medium truncate">{format(endDate, "MMM d")}</span>
                        </button>

                        {activeCalendar === 'end' && (
                            <div className="absolute bottom-full right-0 mb-4 z-[200] bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <DayPicker
                                    mode="single"
                                    selected={endDate}
                                    onSelect={handleEndDateSelect}
                                    disabled={{ before: startDate || new Date() }}
                                    defaultMonth={endDate}
                                    className="!bg-transparent"
                                    classNames={{
                                        month: "space-y-4",
                                        caption: "flex justify-center pt-1 relative items-center text-foreground",
                                        caption_label: "text-sm font-medium",
                                        nav: "space-x-1 flex items-center",
                                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-border",
                                        nav_button_previous: "absolute left-1",
                                        nav_button_next: "absolute right-1",
                                        table: "w-full border-collapse space-y-1",
                                        head_row: "flex",
                                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                                        row: "flex w-full mt-2",
                                        cell: "h-9 w-9 text-center text-sm p-0 relative",
                                        day: "h-9 w-9 p-0 font-normal hover:bg-accent hover:text-accent-foreground rounded-md transition-colors cursor-pointer",
                                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                                        day_today: "ring-2 ring-primary/50",
                                        day_outside: "text-muted-foreground opacity-50",
                                        day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-2">
                    <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold h-14 text-lg shadow-xl shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02]">
                        Find My Trip <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </form>
        </>
    );
}
