"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LocationSearch from "./LocationSearch";
import { Button } from "@/app/components/ui/button";
import { CalendarIcon, ArrowRight } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

export default function SearchForm() {
    const router = useRouter();
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);

    // Default: today and tomorrow
    const today = new Date();
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(addDays(today, 3));

    const [activeCalendar, setActiveCalendar] = useState(null); // 'start' | 'end' | null

    // Load saved search from session storage on mount
    useEffect(() => {
        try {
            const savedData = sessionStorage.getItem('tripSearch');
            if (savedData) {
                const parsed = JSON.parse(savedData);

                if (parsed.origin) setOrigin(parsed.origin);
                if (parsed.destination) setDestination(parsed.destination);

                if (parsed.startDate) setStartDate(parseISO(parsed.startDate));
                if (parsed.endDate) setEndDate(parseISO(parsed.endDate));
            }
        } catch (e) {
            console.error('Error loading saved search:', e);
        }
    }, []);

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

            <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-4 items-end relative z-10">
                <div className="flex-1 w-full space-y-2">
                    <label className="text-sm font-medium text-white/90 ml-1">From</label>
                    <LocationSearch
                        placeholder="Origin (e.g. New Delhi)"
                        onSelect={setOrigin}
                        initialValue={origin?.name || ""}
                        className="w-full"
                    />
                </div>

                <div className="flex-1 w-full space-y-2">
                    <label className="text-sm font-medium text-white/90 ml-1">To</label>
                    <LocationSearch
                        placeholder="Destination (e.g. Mumbai)"
                        onSelect={setDestination}
                        initialValue={destination?.name || ""}
                        className="w-full"
                    />
                </div>

                {/* Start Date */}
                <div className="w-full md:w-36 space-y-2 relative">
                    <label className="text-sm font-medium text-white/90 ml-1">Start Date</label>
                    <button
                        type="button"
                        onClick={() => setActiveCalendar(activeCalendar === 'start' ? null : 'start')}
                        className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm hover:bg-white/20 transition-colors"
                    >
                        <CalendarIcon className="w-4 h-4 text-white/70 shrink-0" />
                        <span className="truncate">{format(startDate, "MMM d, yyyy")}</span>
                    </button>

                    {activeCalendar === 'start' && (
                        <div className="absolute bottom-full left-0 mb-2 z-[200] bg-card border border-border rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                <div className="w-full md:w-36 space-y-2 relative">
                    <label className="text-sm font-medium text-white/90 ml-1">End Date</label>
                    <button
                        type="button"
                        onClick={() => setActiveCalendar(activeCalendar === 'end' ? null : 'end')}
                        className="w-full flex items-center gap-2 px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm hover:bg-white/20 transition-colors"
                    >
                        <CalendarIcon className="w-4 h-4 text-white/70 shrink-0" />
                        <span className="truncate">{format(endDate, "MMM d, yyyy")}</span>
                    </button>

                    {activeCalendar === 'end' && (
                        <div className="absolute bottom-full right-0 mb-2 z-[200] bg-card border border-border rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
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

                <Button type="submit" size="lg" className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold shadow-lg transition-all duration-300 hover:scale-105">
                    Plan Trip <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </form>
        </>
    );
}
