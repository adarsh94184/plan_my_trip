"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LocationSearch from "./LocationSearch";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label"; // Add Label component if not already there, or use standard label
import { CalendarIcon, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function SearchForm() {
    const router = useRouter();
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Set default dates if needed
    // const today = new Date().toISOString().split('T')[0];

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!origin || !destination || !startDate || !endDate) {
            // Basic validation
            alert("Please fill in all fields");
            return;
        }

        const params = new URLSearchParams({
            origin: origin.name,
            originLat: origin.lat,
            originLon: origin.lon,
            destination: destination.name,
            destinationLat: destination.lat,
            destinationLon: destination.lon,
            startDate,
            endDate
        });

        router.push(`/trips?${params.toString()}`);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium text-white/90 ml-1">From</label>
                <LocationSearch
                    placeholder="Origin (e.g. New York)"
                    onSelect={setOrigin}
                    className="w-full"
                />
            </div>

            <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium text-white/90 ml-1">To</label>
                <LocationSearch
                    placeholder="Destination (e.g. London)"
                    onSelect={setDestination}
                    className="w-full"
                />
            </div>

            <div className="w-full md:w-36 space-y-2">
                <label className="text-sm font-medium text-white/90 ml-1">Start Date</label>
                <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                    min={new Date().toISOString().split("T")[0]}
                />
            </div>

            <div className="w-full md:w-36 space-y-2">
                <label className="text-sm font-medium text-white/90 ml-1">End Date</label>
                <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                    min={startDate || new Date().toISOString().split("T")[0]}
                />
            </div>

            <Button type="submit" size="lg" className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold shadow-lg transition-all duration-300 hover:scale-105">
                Plan Trip <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </form>
    );
}
