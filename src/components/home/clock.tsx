"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const id = setInterval(callback, 30_000);
  return () => clearInterval(id);
}

function getSnapshot() {
  return Date.now();
}

function getServerSnapshot() {
  return 0;
}

export function Clock() {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!now) return null;

  const date = new Date(now);
  const hour = date.getHours() % 12 || 12;
  const minute = date.getMinutes().toString().padStart(2, "0");
  const period = date.getHours() >= 12 ? "pm" : "am";

  return (
    <p className="text-sm text-text-secondary">
      {hour}:{minute} <span className="text-xs">{period}</span>
    </p>
  );
}
