"use client";

import { motion } from "framer-motion";
import { Plane, Train, Bus, Clock, DollarSign, ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";

const TransportOption = ({ mode, duration, price, tags, bestFor }) => {
    const icons = {
        flight: Plane,
        train: Train,
        bus: Bus,
        car: Bus,
    };

    const Icon = icons[mode.toLowerCase()] || Bus;

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`relative p-6 rounded-2xl bg-card border shadow-sm transition-all ${bestFor ? 'ring-2 ring-primary border-primary' : 'border-border'}`}
        >
            {bestFor && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Best for {bestFor}
                </div>
            )}

            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-muted rounded-xl">
                    <Icon className="w-6 h-6 text-foreground" />
                </div>
                <div className="text-right">
                    <span className="block text-2xl font-bold text-foreground">${price}</span>
                    <span className="text-sm text-muted-foreground">per person</span>
                </div>
            </div>

            <h3 className="text-lg font-semibold capitalize mb-2">{mode}</h3>

            <div className="flex items-center text-muted-foreground mb-4">
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm">{duration}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-secondary/10 text-secondary-foreground rounded-md font-medium">
                        {tag}
                    </span>
                ))}
            </div>

            <Button className="w-full group">
                Select <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
        </motion.div>
    );
};

export default function TransportComparison({ from, to }) {
    // Mock data based on distance (would be real logic later)
    // For now, we statically generate plausible options
    const options = [
        {
            mode: "Flight",
            duration: "1h 20m",
            price: 120,
            tags: ["Fastest", "Eco-heavy"],
            bestFor: "Time",
        },
        {
            mode: "Train",
            duration: "4h 15m",
            price: 45,
            tags: ["Scenic", "Comfortable", "Wifi"],
            bestFor: "Value",
        },
        {
            mode: "Bus",
            duration: "6h 30m",
            price: 25,
            tags: ["Budget", "Direct"],
            bestFor: "Budget",
        }
    ];

    return (
        <section className="py-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    How strictly do you want to travel?
                </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {options.map((opt, i) => (
                    <TransportOption key={i} {...opt} />
                ))}
            </div>
        </section>
    );
}
