"use client";

import { useState, useEffect, useCallback } from "react";

export function useMediaQuery(query: string): boolean {
    const getMatches = useCallback(() => {
        if (typeof window !== "undefined") {
            return window.matchMedia(query).matches;
        }
        return false;
    }, [query]);

    const [matches, setMatches] = useState(getMatches);

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);

        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, [query]);

    return matches;
}
