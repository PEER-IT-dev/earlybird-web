"use client";

import { STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  checkIn?: string | null;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, checkIn, size = "md" }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] || "bg-gray-300";
  const label = STATUS_LABELS[status] || status;
  const time = checkIn
    ? new Date(checkIn).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : null;

  const sizeClass = size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1";

  return (
    <span
      className={`${color} text-white rounded ${sizeClass} inline-flex items-center gap-1 font-medium`}
      title={`${label}${time ? ` (${time})` : ""}`}
    >
      {time || label}
    </span>
  );
}
