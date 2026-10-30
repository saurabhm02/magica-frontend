"use client";

import { useSyncExternalStore } from "react";

let snapshot = Date.now();

function subscribe(callback: () => void) {
  snapshot = Date.now();
  const id = setInterval(() => {
    snapshot = Date.now();
    callback();
  }, 30_000);
  return () => clearInterval(id);
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return 0;
}

const formatter = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", hour12: true });

export function Clock() {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!now) return null;

  const parts = formatter.formatToParts(new Date(now));
  const time = parts
    .filter((p) => p.type === "hour" || p.type === "minute" || p.type === "literal")
    .map((p) => p.value)
    .join("");
  const period = parts.find((p) => p.type === "dayPeriod")?.value.toLowerCase();

  return (
    <div
      className="mt-[14px] flex items-baseline justify-center gap-[6px] text-[13px] leading-[19.5px] font-medium tracking-[0.01em] whitespace-nowrap text-text-secondary md:mt-[19px]"
      aria-label="Local time"
    >
      <span>{time}</span>
      {period && <span className="-translate-x-[3px] -translate-y-[5px] text-[10px] leading-3 font-normal">{period}</span>}
    </div>
  );
}
