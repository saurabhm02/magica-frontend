"use client";

import { useEffect, useRef } from "react";

const BOTTOM_THRESHOLD_PX = 48;

// Sticks the container to the bottom as its content grows (new messages, streaming
// text), unless the user has scrolled up — then it leaves them where they are.
export function useAutoScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      stickToBottom.current = container.scrollHeight - container.scrollTop - container.clientHeight < BOTTOM_THRESHOLD_PX;
    };
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    const observer = new ResizeObserver(() => {
      if (stickToBottom.current) container.scrollTop = container.scrollHeight;
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return { containerRef, contentRef };
}
