"use client";

import StatusBadge from "./StatusBadge";
import { formatMinutes, MEMBER_TYPE_LABELS } from "@/lib/utils";

interface DayData {
  check_in: string | null;
  check_out: string | null;
  net_minutes: number;
  status: string;
}

interface MemberRow {
  user_id: string;
  display_name: string;
  member_type: string;
  days: Record<string, DayData>;
  week_minutes: number;
}

interface AttendanceGridProps {
  data: MemberRow[];
  dates: string[];
}

export default function AttendanceGrid({ data, dates }: AttendanceGridProps) {
  // 쌉일찍새 먼저, 그 다음 일찍새
  const sorted = [...data].sort((a, b) => {
    if (a.member_type === b.member_type) return a.display_name.localeCompare(b.display_name);
    return a.member_type === "super_earlybird" ? -1 : 1;
  });

  const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="border px-3 py-2 text-left sticky left-0 bg-gray-50 z-10 min-w-[120px]">
              이름
            </th>
            <th className="border px-2 py-2 text-center min-w-[60px]">구분</th>
            {dates.map((d) => (
              <th key={d} className="border px-2 py-2 text-center min-w-[80px]">
                {formatDateHeader(d)}
              </th>
            ))}
            <th className="border px-3 py-2 text-center min-w-[90px]">주간합계</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((member) => (
            <tr key={member.user_id} className="hover:bg-gray-50">
              <td className="border px-3 py-2 font-medium sticky left-0 bg-white z-10">
                {member.display_name}
              </td>
              <td className="border px-2 py-2 text-center text-xs text-gray-500">
                {MEMBER_TYPE_LABELS[member.member_type] || "-"}
              </td>
              {dates.map((d) => {
                const day = member.days[d];
                return (
                  <td key={d} className="border px-2 py-2 text-center">
                    {day ? (
                      <StatusBadge status={day.status} checkIn={day.check_in} size="sm" />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                );
              })}
              <td className="border px-3 py-2 text-center font-medium">
                {formatMinutes(member.week_minutes)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
