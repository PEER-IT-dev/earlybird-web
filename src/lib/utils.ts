export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}시간 ${m}분`;
}

export function formatTime(isoString: string | null): string {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

export const STATUS_COLORS: Record<string, string> = {
  on_time: "bg-lime-400",       // 연두
  slightly_late: "bg-green-600", // 초록
  excused: "bg-blue-500",       // 파란
  late: "bg-red-500",           // 빨간
  absent: "bg-red-500",         // 빨간
};

export const STATUS_LABELS: Record<string, string> = {
  on_time: "정상출근",
  slightly_late: "10분이내 지각",
  excused: "출석인정",
  late: "지각",
  absent: "결석",
};

export const MEMBER_TYPE_LABELS: Record<string, string> = {
  earlybird: "일찍새",
  super_earlybird: "쌉일찍새",
  member: "멤버",
  manager: "관리새",
  leader: "대장새",
};
