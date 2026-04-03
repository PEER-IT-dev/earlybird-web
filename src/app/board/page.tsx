"use client";

import { useEffect, useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// 익명화용 이모지 아바타
const MEMBER_EMOJIS = [
  "🐥", "🐣", "🦆", "🐧", "🦉", "🦅", "🐦", "🦜",
  "🐸", "🐰", "🐱", "🐶", "🐻", "🐼", "🦊", "🐨",
  "🐯", "🐷", "🐮", "🦁",
];

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

interface WeekGroup {
  weekNum: number;
  dates: string[];
}

const STATUS_CELL: Record<
  string,
  { bg: string; border: string; label: string; symbol: string }
> = {
  on_time: { bg: "#d4edbc", border: "#6a9f2e", label: "정상출석", symbol: "✓" },
  slightly_late: {
    bg: "#c5e1a5",
    border: "#558b2f",
    label: "10분이내 지각",
    symbol: "△",
  },
  excused: { bg: "#bbdefb", border: "#1e88e5", label: "출석인정", symbol: "○" },
  late: { bg: "#ffcdd2", border: "#e53935", label: "지각", symbol: "✕" },
  absent: { bg: "#ffcdd2", border: "#e53935", label: "결석", symbol: "✕" },
};

const MEMBER_TYPE_EMOJI: Record<string, string> = {
  leader: "👑",
  manager: "💻",
  super_earlybird: "⚡",
  earlybird: "🌱",
  member: "🌱",
};

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function getMonthWeeks(year: number, month: number): WeekGroup[] {
  const weeks: WeekGroup[] = [];
  const lastDay = new Date(year, month, 0).getDate();
  let currentWeek: string[] = [];
  let weekNum = 1;

  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month - 1, day);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    if (dow === 1 && currentWeek.length > 0) {
      weeks.push({ weekNum, dates: currentWeek });
      currentWeek = [];
      weekNum++;
    }
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    currentWeek.push(dateStr);
  }
  if (currentWeek.length > 0) {
    weeks.push({ weekNum, dates: currentWeek });
  }
  return weeks;
}

function formatDateLabel(dateStr: string) {
  const [, mm, dd] = dateStr.split("-");
  const m = parseInt(mm);
  const d = parseInt(dd);
  const date = new Date(parseInt(dateStr.split("-")[0]), m - 1, d);
  return `${m}/${d}(${DAY_NAMES[date.getDay()]})`;
}

export default function PublicBoardPage() {
  const [data, setData] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const weeks = getMonthWeeks(year, month);
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const monthWeeks = getMonthWeeks(year, month);
    const dates = monthWeeks.flatMap((w) => w.dates);

    if (dates.length === 0) {
      setData([]);
      setLoading(false);
      return;
    }

    const start = dates[0];
    const end = dates[dates.length - 1];

    try {
      const res = await fetch(
        `${API_BASE}/api/attendance/public/sheet?start=${start}&end=${end}`
      );
      if (!res.ok) throw new Error("Failed");
      const json: MemberRow[] = await res.json();
      setData(json);
    } catch {
      setError("출석 데이터를 불러올 수 없습니다.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 멤버 타입별 정렬
  const sorted = [...data].sort((a, b) => {
    const order: Record<string, number> = {
      leader: 0,
      manager: 1,
      super_earlybird: 2,
      earlybird: 3,
      member: 4,
    };
    const oa = order[a.member_type] ?? 5;
    const ob = order[b.member_type] ?? 5;
    if (oa !== ob) return oa - ob;
    return a.display_name.localeCompare(b.display_name);
  });

  // 이모지 매핑 (인덱스 기반)
  const emojiMap = new Map<string, string>();
  sorted.forEach((m, i) => {
    emojiMap.set(m.user_id, MEMBER_EMOJIS[i % MEMBER_EMOJIS.length]);
  });

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m > 12) {
      m = 1;
      y++;
    }
    if (m < 1) {
      m = 12;
      y--;
    }
    setYear(y);
    setMonth(m);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, #f5f3e8 0%, #eaecce 40%, #f5f3e8 100%)",
      }}
    >
      {/* ===== 헤더 ===== */}
      <header className="text-center pt-10 sm:pt-14 pb-6">
        <div className="text-5xl sm:text-6xl mb-3">🐥</div>
        <h1
          className="text-2xl sm:text-3xl font-extrabold tracking-tight"
          style={{ color: "#3d3d2e" }}
        >
          일찍새 출석부
        </h1>
        <p className="text-sm mt-1.5 font-medium" style={{ color: "#8a8e3a" }}>
          피어잇 공유오피스 · 출근 챌린지
        </p>
      </header>

      {/* ===== 월 선택 ===== */}
      <div className="flex justify-center items-center gap-3 sm:gap-5 mb-5">
        <button
          onClick={() => changeMonth(-1)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
          style={{ background: "#c5c96b", color: "white" }}
        >
          ‹
        </button>
        <span
          className="text-xl sm:text-2xl font-bold tabular-nums select-none"
          style={{ color: "#3d3d2e" }}
        >
          {year}년 {month}월
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
          style={{ background: "#c5c96b", color: "white" }}
        >
          ›
        </button>
      </div>

      {/* ===== 범례 ===== */}
      <div className="flex justify-center flex-wrap gap-3 sm:gap-5 mb-6 px-4">
        {Object.entries(STATUS_CELL)
          .filter(([k]) => k !== "absent")
          .map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs sm:text-sm">
              <span
                className="w-6 h-6 rounded-lg inline-flex items-center justify-center text-xs font-bold border"
                style={{
                  background: cfg.bg,
                  borderColor: cfg.border,
                  color: cfg.border,
                }}
              >
                {cfg.symbol}
              </span>
              <span className="font-medium" style={{ color: "#3d3d2e" }}>
                {cfg.label}
              </span>
            </div>
          ))}
      </div>

      {/* ===== 테이블 ===== */}
      <div className="max-w-[96vw] mx-auto px-1 sm:px-4 pb-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 animate-bounce">🐥</div>
            <p className="font-medium" style={{ color: "#8a8e3a" }}>
              로딩중...
            </p>
          </div>
        ) : error ? (
          <div
            className="text-center py-14 mx-auto max-w-md rounded-3xl"
            style={{
              background: "white",
              boxShadow: "0 4px 24px rgba(197,201,107,0.15)",
            }}
          >
            <div className="text-5xl mb-4">😢</div>
            <p className="font-semibold mb-2" style={{ color: "#3d3d2e" }}>
              {error}
            </p>
            <p className="text-xs px-6" style={{ color: "#8a8e3a" }}>
              백엔드에{" "}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                /api/attendance/public/sheet
              </code>{" "}
              엔드포인트를 추가해주세요
            </p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-medium" style={{ color: "#8a8e3a" }}>
              이번 달 출석 데이터가 없습니다.
            </p>
          </div>
        ) : (
          <div
            className="overflow-x-auto rounded-2xl border"
            style={{
              borderColor: "#c5c96b",
              boxShadow: "0 8px 40px rgba(197,201,107,0.18)",
            }}
          >
            <table
              className="w-full border-collapse"
              style={{ background: "white" }}
            >
              <thead>
                {/* 주차 헤더 */}
                <tr>
                  <th
                    rowSpan={2}
                    className="px-2 sm:px-3 py-2.5 sticky left-0 z-20 text-center"
                    style={{
                      background: "#6d7230",
                      color: "#f5f3e8",
                      minWidth: 60,
                      borderRight: "2px solid #565a22",
                    }}
                  >
                    <span className="text-lg sm:text-xl">🐤</span>
                  </th>
                  {weeks.map((w, wi) => (
                    <th
                      key={w.weekNum}
                      colSpan={w.dates.length}
                      className="px-1 py-2 text-center font-bold text-xs sm:text-sm"
                      style={{
                        background: "#8a8e3a",
                        color: "#f5f3e8",
                        borderLeft: wi > 0 ? "2px solid #6d7230" : "none",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {w.weekNum}주차
                    </th>
                  ))}
                </tr>
                {/* 날짜 헤더 */}
                <tr>
                  {weeks.map((w, wi) =>
                    w.dates.map((d, di) => {
                      const isToday = d === today;
                      return (
                        <th
                          key={d}
                          className="px-0.5 sm:px-1.5 py-2 text-center font-semibold whitespace-nowrap"
                          style={{
                            background: isToday ? "#f5c842" : "#e8ebc0",
                            color: isToday ? "#3d3d2e" : "#5a5d2e",
                            borderLeft:
                              di === 0 && wi > 0
                                ? "2px solid #c5c96b"
                                : "1px solid #d4d88a",
                            minWidth: 52,
                            fontSize: "0.68rem",
                          }}
                        >
                          {formatDateLabel(d)}
                        </th>
                      );
                    })
                  )}
                </tr>
              </thead>
              <tbody>
                {sorted.map((member, idx) => {
                  const emoji = emojiMap.get(member.user_id) || "🐥";
                  const typeEmoji =
                    MEMBER_TYPE_EMOJI[member.member_type] || "";
                  const isEven = idx % 2 === 0;

                  return (
                    <tr key={member.user_id}>
                      {/* 멤버 이모지 */}
                      <td
                        className="px-2 sm:px-3 py-2.5 sticky left-0 z-10 text-center whitespace-nowrap"
                        style={{
                          background: isEven ? "#ffffff" : "#fafaf2",
                          borderTop: "1px solid #e8ebc0",
                          borderRight: "2px solid #d4d88a",
                        }}
                        title={`멤버 ${idx + 1}`}
                      >
                        <span className="text-lg sm:text-xl">{emoji}</span>
                        <span className="text-[0.6rem] sm:text-xs ml-0.5 opacity-50">
                          {typeEmoji}
                        </span>
                      </td>
                      {/* 출석 셀 */}
                      {weeks.map((w, wi) =>
                        w.dates.map((d, di) => {
                          const day = member.days[d];
                          const status = day?.status;
                          const cfg = status ? STATUS_CELL[status] : null;
                          const isToday = d === today;

                          return (
                            <td
                              key={d}
                              className="text-center relative"
                              style={{
                                background: cfg
                                  ? cfg.bg
                                  : isEven
                                    ? "#ffffff"
                                    : "#fafaf2",
                                borderTop: "1px solid #e8ebc0",
                                borderLeft:
                                  di === 0 && wi > 0
                                    ? "2px solid #d4d88a"
                                    : "1px solid #eeefdc",
                                padding: "8px 2px",
                              }}
                            >
                              {isToday && (
                                <div
                                  className="absolute inset-0 pointer-events-none"
                                  style={{
                                    boxShadow: "inset 0 0 0 2px #f5c842",
                                    borderRadius: 2,
                                  }}
                                />
                              )}
                              {cfg && (
                                <span
                                  className="font-bold"
                                  style={{
                                    color: cfg.border,
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  {cfg.symbol}
                                </span>
                              )}
                            </td>
                          );
                        })
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== 푸터 ===== */}
      <footer className="text-center pb-10 pt-2">
        <p className="text-xs font-medium" style={{ color: "#b0b45a" }}>
          🐥 일찍새 · 피어잇 공유오피스
        </p>
      </footer>
    </div>
  );
}
