"use client";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";

export function UserCard() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <Image src={user.imageUrl} alt="" width={28} height={28} className="size-7 shrink-0 rounded-full" />
      <span className="truncate text-sm text-text-primary">{user.fullName ?? user.username ?? "Account"}</span>
    </div>
  );
}
