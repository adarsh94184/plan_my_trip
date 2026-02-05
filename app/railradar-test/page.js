"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";

export default function RailRadarTestPage() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const testSearchStations = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/railradar/search/stations?query=Delhi');
            const data = await res.json();
            setResult({ test: 'Search Stations', data });
        } catch (err) {
            setResult({ test: 'Search Stations', error: err.message });
        }
        setLoading(false);
    };

    const testTrainsBetween = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/railradar/trains/between?from=NDLS&to=BCT');
            const data = await res.json();
            setResult({ test: 'Trains Between', data });
        } catch (err) {
            setResult({ test: 'Trains Between', error: err.message });
        }
        setLoading(false);
    };

    const testTrainDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/railradar/trains/12301?dataType=static');
            const data = await res.json();
            setResult({ test: 'Train Details', data });
        } catch (err) {
            setResult({ test: 'Train Details', error: err.message });
        }
        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">RailRadar API Test</h1>

                <div className="space-y-4 mb-8">
                    <Button onClick={testSearchStations} disabled={loading}>
                        Test: Search Stations (Delhi)
                    </Button>
                    <Button onClick={testTrainsBetween} disabled={loading}>
                        Test: Trains Between (NDLS → BCT)
                    </Button>
                    <Button onClick={testTrainDetails} disabled={loading}>
                        Test: Train Details (12301)
                    </Button>
                </div>

                {loading && <p>Loading...</p>}

                {result && (
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">{result.test}</h2>
                        <pre className="bg-muted p-4 rounded overflow-auto text-sm">
                            {JSON.stringify(result.data || result.error, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </main>
    );
}
