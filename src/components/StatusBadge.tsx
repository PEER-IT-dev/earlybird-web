"use client";

import { STATUS_LABELS } from "@/lib/utils";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  on_time: { bg: "#c5e67e", text: "#3d5a00" },       // 연두
  slightly_late: { bg: "#7cb342", text: "#ffffff" },   // 초록
  excused: { bg: "#64b5f6", text: "#ffffff" },         // 파란
  late: { bg: "#ef9a9a", text: "#b71c1c" },           // 빨간 (부드럽게)
  absent: { bg: "#ef9a9a", text: "#b71c1c" },         // 빨간 (부드럽게)
};

interface StatusBadgeProps {
  status: string;
  checkIn?: string | null;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, checkIn, size = "md" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || { bg: "#e0e0e0", text: "#666" };
  const label = STATUS_LABELS[status] || status;
  const time = checkIn
    ? new Date(checkIn).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : null;

  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  return (
    <span
      className={`rounded-full ${sizeClass} inline-flex items-center gap-1 font-medium`}
      style={{ background: style.bg, color: style.text }}
      title={`${label}${time ? ` (${time})` : ""}`}
    >
      {time || label}
    </span>
  );
}
