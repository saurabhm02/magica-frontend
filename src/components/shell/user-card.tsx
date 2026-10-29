"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, MoreVertical } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLiveRunStore } from "@/stores/live-run.store";
import { useUiStore } from "@/stores/ui.store";

export function UserCard() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (!user) return null;

  const handleLogout = async () => {
    queryClient.clear();
    useLiveRunStore.getState().reset();
    useUiStore.getState().reset();
    await signOut({ redirectUrl: "/sign-in" });
    router.push("/sign-in");
  };

  const displayName = user.fullName ?? user.username ?? "Account";
  const email = user.primaryEmailAddress?.emailAddress;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="User menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-8 p-1.5 hover:bg-surface-secondary/70 transition"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Image
            src={user.imageUrl}
            alt=""
            width={28}
            height={28}
            className="size-7 shrink-0 rounded-full"
          />
          <span className="truncate text-sm text-text-primary font-medium">{displayName}</span>
        </div>
        <MoreVertical className="size-4 shrink-0 text-text-tertiary" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute bottom-full left-0 mb-2 w-full min-w-[200px] rounded-12 border border-border-secondary bg-surface-primary p-1.5 shadow-lg z-50 divide-y divide-border-secondary"
        >
          <div className="px-2.5 py-2">
            <p className="text-xs font-semibold text-text-primary truncate">{displayName}</p>
            {email && <p className="text-xs text-text-tertiary truncate">{email}</p>}
          </div>
          <div className="pt-1">
            <button
              type="button"
              role="menuitem"
              data-testid="logout-button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-8 px-2.5 py-2 text-xs text-error hover:bg-error/10 transition cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
