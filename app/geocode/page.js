'use client';

import { useState, useCallback, useRef } from 'react';

// Debounce hook for fast typing
function useDebounce(callback, delay) {
    const timeoutRef = useRef(null);

    return useCallback((...args) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => callback(...args), delay);
    }, [callback, delay]);
}

export default function GeocodePage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);

    const searchLocation = useCallback(async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/geocode?q=${encodeURIComponent(searchQuery)}&type=autocomplete&limit=5`
            );

            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            setResults(data.features || []);
        } catch (err) {
            setError(err.message);
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

    const handleSelectLocation = (feature) => {
        setSelectedLocation(feature);
        setQuery(feature.properties.formatted);
        setResults([]);
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>🌍 Location Search</h1>
                <p style={styles.subtitle}>Find any place in the world</p>

                <div style={styles.searchContainer}>
                    <input
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        placeholder="Search for a location..."
                        style={styles.input}
                    />
                    {loading && <span style={styles.spinner}>⏳</span>}
                </div>

                {error && <p style={styles.error}>❌ {error}</p>}

                {results.length > 0 && (
                    <ul style={styles.resultsList}>
                        {results.map((feature, index) => (
                            <li
                                key={feature.properties.place_id || index}
                                style={styles.resultItem}
                                onClick={() => handleSelectLocation(feature)}
                            >
                                <span style={styles.icon}>📍</span>
                                <div style={styles.resultContent}>
                                    <strong>{feature.properties.name || feature.properties.formatted}</strong>
                                    <span style={styles.address}>
                                        {feature.properties.formatted}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {selectedLocation && (
                    <div style={styles.selectedCard}>
                        <h3 style={styles.selectedTitle}>Selected Location</h3>
                        <p><strong>Name:</strong> {selectedLocation.properties.name || 'N/A'}</p>
                        <p><strong>Address:</strong> {selectedLocation.properties.formatted}</p>
                        <p><strong>Coordinates:</strong> {selectedLocation.properties.lat}, {selectedLocation.properties.lon}</p>
                        {selectedLocation.properties.country && (
                            <p><strong>Country:</strong> {selectedLocation.properties.country}</p>
                        )}
                        {selectedLocation.properties.city && (
                            <p><strong>City:</strong> {selectedLocation.properties.city}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    card: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '500px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    title: {
        color: '#fff',
        fontSize: '2rem',
        fontWeight: '700',
        marginBottom: '8px',
        textAlign: 'center',
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        marginBottom: '30px',
    },
    searchContainer: {
        position: 'relative',
        marginBottom: '20px',
    },
    input: {
        width: '100%',
        padding: '16px 20px',
        fontSize: '16px',
        borderRadius: '12px',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.08)',
        color: '#fff',
        outline: 'none',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
    },
    spinner: {
        position: 'absolute',
        right: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '18px',
    },
    error: {
        color: '#ff6b6b',
        textAlign: 'center',
        marginBottom: '16px',
    },
    resultsList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    resultItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        background: 'rgba(255, 255, 255, 0.05)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        color: '#fff',
    },
    icon: {
        fontSize: '20px',
    },
    resultContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        overflow: 'hidden',
    },
    address: {
        fontSize: '13px',
        color: 'rgba(255, 255, 255, 0.5)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    selectedCard: {
        marginTop: '24px',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(102, 126, 234, 0.3)',
        color: '#fff',
    },
    selectedTitle: {
        marginBottom: '16px',
        color: '#a78bfa',
        fontSize: '1.1rem',
    },
};
