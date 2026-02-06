/**
 * Custom hook to manage trip data from sessionStorage
 * Handles trip data retrieval, validation, and redirection
 */

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useTripData() {
    const router = useRouter();
    const [tripData, setTripData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            // Retrieve trip data from sessionStorage
            const storedData = sessionStorage.getItem('tripSearch');

            if (!storedData) {
                // No trip data found - redirect to home
                router.push('/');
                return;
            }

            const parsed = JSON.parse(storedData);

            // Validate required fields
            if (!parsed.origin || !parsed.destination || !parsed.startDate || !parsed.endDate) {
                throw new Error('Invalid trip data');
            }

            // Optional: Check if data is too old (e.g., older than 24 hours)
            const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
            if (parsed.timestamp && Date.now() - parsed.timestamp > MAX_AGE) {
                sessionStorage.removeItem('tripSearch');
                router.push('/');
                return;
            }

            setTripData(parsed);
        } catch (err) {
            console.error('Error loading trip data:', err);
            setError(err.message);
            // Redirect to home on error
            router.push('/');
        } finally {
            setLoading(false);
        }
    }, [router]);

    return { tripData, loading, error };
}
