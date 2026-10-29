"use client";

import { useEffect, useRef } from "react";

// Fetches the next page once a sentinel element placed at the end of a list scrolls
// into view. Attach the returned ref to an empty div after the list.
export function useInfiniteScroll(hasNextPage: boolean | undefined, fetchNextPage: () => void) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) fetchNextPage();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  return sentinelRef;
}
