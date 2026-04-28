"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { isHiddenName } from "@/lib/utils";

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

interface UserInfo {
  id: string;
  display_name: string;
  real_name: string | null;
  member_type: string | null;
}

interface WeekGroup {
  weekNum: number;
  dates: string[];
}

const STATUS_CELL: Record<
  string,
  { bg: string; border: string; label: string; symbol: string }
> = {
  on_time: { bg: "#d4edbc", border: "#6a9f2e", label: "정상", symbol: "✓" },
  slightly_late: { bg: "#c5e1a5", border: "#558b2f", label: "10분이내", symbol: "△" },
  excused: { bg: "#bbdefb", border: "#1e88e5", label: "인정", symbol: "○" },
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
    currentWeek.push(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );
  }
  if (currentWeek.length > 0) weeks.push({ weekNum, dates: currentWeek });
  return weeks;
}

function fmtDate(dateStr: string) {
  const [, mm, dd] = dateStr.split("-");
  const m = parseInt(mm), d = parseInt(dd);
  const date = new Date(parseInt(dateStr), m - 1, d);
  return `${m}/${d}(${DAY_NAMES[date.getDay()]})`;
}

function fmtDateShort(dateStr: string) {
  const [, , dd] = dateStr.split("-");
  const d = parseInt(dd);
  const [yr, mm] = dateStr.split("-");
  const date = new Date(parseInt(yr), parseInt(mm) - 1, d);
  return `${d}(${DAY_NAMES[date.getDay()]})`;
}

export default function Board2Page() {
  const router = useRouter();
  const [data, setData] = useState<MemberRow[]>([]);
  const [nameMap, setNameMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [weekIdx, setWeekIdx] = useState(0);

  const weeks = getMonthWeeks(year, month);
  const allDates = weeks.flatMap((w) => w.dates);
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    }
  }, [router]);

  // 현재 주차 자동 선택
  useEffect(() => {
    const idx = weeks.findIndex((w) => w.dates.includes(today));
    setWeekIdx(idx >= 0 ? idx : 0);
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const dates = getMonthWeeks(year, month).flatMap((w) => w.dates);
    if (dates.length === 0) {
      setData([]);
      setLoading(false);
      return;
    }
    try {
      const [sheetData, users] = await Promise.all([
        apiFetch<MemberRow[]>(
          `/api/attendance/public/sheet?start=${dates[0]}&end=${dates[dates.length - 1]}`
        ),
        apiFetch<UserInfo[]>("/api/users"),
      ]);
      // user_id → real_name || display_name 맵 생성
      const map = new Map<string, string>();
      for (const u of users) {
        map.set(u.id, u.real_name || u.display_name);
      }
      setNameMap(map);
      setData(sheetData);
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

  // 5분마다 자동 새로고침
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  const VISIBLE = new Set(["leader", "manager", "super_earlybird", "earlybird"]);
  const sorted = data
    .filter((m) => VISIBLE.has(m.member_type) && !isHiddenName(nameMap.get(m.user_id), m.display_name))
    .sort((a, b) => {
      const o: Record<string, number> = { leader: 0, manager: 1, super_earlybird: 2, earlybird: 3 };
      return (o[a.member_type] ?? 5) - (o[b.member_type] ?? 5) || a.display_name.localeCompare(b.display_name);
    });

  const changeMonth = (delta: number) => {
    let m = month + delta, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setYear(y);
    setMonth(m);
  };

  const safeWeekIdx = Math.min(weekIdx, weeks.length - 1);
  const mobileWeek = weeks[safeWeekIdx] || weeks[0];
  const mobileDates = mobileWeek?.dates || [];

  let colCursor = 2;
  const weekCols = weeks.map((w) => {
    const start = colCursor;
    colCursor += w.dates.length;
    return { start, span: w.dates.length };
  });

  const memberCount = sorted.length;

  return (
    <div
      className="h-dvh overflow-hidden flex flex-col"
      style={{ background: "linear-gradient(160deg, #f5f3e8 0%, #eaecce 40%, #f5f3e8 100%)" }}
    >
      {/* ===== 헤더 ===== */}
      <div className="flex items-center justify-center gap-1.5 pt-2 md:pt-3 pb-0.5 shrink-0">
        <span className="text-xl md:text-3xl">🐥</span>
        <h1 className="text-sm md:text-xl font-extrabold tracking-tight" style={{ color: "#3d3d2e" }}>
          일찍새 출석부
        </h1>
        <span className="text-[0.5rem] md:text-xs font-medium ml-1" style={{ color: "#8a8e3a" }}>
          피어잇
        </span>
      </div>

      {/* ===== 월 선택 ===== */}
      <div className="flex justify-center items-center gap-2 mb-0.5 md:mb-1 shrink-0">
        <button
          onClick={() => changeMonth(-1)}
          className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-sm md:text-base font-bold hover:scale-110 active:scale-95 transition-transform cursor-pointer"
          style={{ background: "#c5c96b", color: "white" }}
        >
          ‹
        </button>
        <span className="text-xs md:text-lg font-bold tabular-nums select-none" style={{ color: "#3d3d2e" }}>
          {year}년 {month}월
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-sm md:text-base font-bold hover:scale-110 active:scale-95 transition-transform cursor-pointer"
          style={{ background: "#c5c96b", color: "white" }}
        >
          ›
        </button>
      </div>

      {/* ===== 모바일 주차 탭 ===== */}
      <div className="flex md:hidden justify-center gap-1 mb-0.5 shrink-0">
        {weeks.map((w, i) => (
          <button
            key={w.weekNum}
            onClick={() => setWeekIdx(i)}
            className="px-2.5 py-0.5 rounded-full text-[0.6rem] font-bold transition-colors cursor-pointer"
            style={{
              background: i === safeWeekIdx ? "#8a8e3a" : "#e8ebc0",
              color: i === safeWeekIdx ? "white" : "#5a5d2e",
            }}
          >
            {w.weekNum}주
          </button>
        ))}
      </div>

      {/* ===== 범례 ===== */}
      <div className="flex justify-center gap-1.5 md:gap-3 mb-1 md:mb-1.5 shrink-0">
        {Object.entries(STATUS_CELL)
          .filter(([k]) => k !== "absent")
          .map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-0.5">
              <span
                className="w-3 h-3 md:w-4 md:h-4 rounded inline-flex items-center justify-center font-bold border"
                style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.border, fontSize: "0.45rem" }}
              >
                {cfg.symbol}
              </span>
              <span className="text-[0.5rem] md:text-[0.65rem] font-medium" style={{ color: "#3d3d2e" }}>
                {cfg.label}
              </span>
            </div>
          ))}
      </div>

      {/* ===== 테이블 영역 ===== */}
      <div
        className="flex-1 min-h-0 mx-1 md:mx-3 mb-1 rounded-xl overflow-hidden border"
        style={{ borderColor: "#c5c96b", boxShadow: "0 4px 24px rgba(197,201,107,0.15)" }}
      >
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center" style={{ background: "white" }}>
            <div className="text-3xl md:text-4xl mb-2 animate-bounce">🐥</div>
            <p className="text-xs font-medium" style={{ color: "#8a8e3a" }}>로딩중...</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center" style={{ background: "white" }}>
            <div className="text-3xl mb-2">😢</div>
            <p className="text-xs font-semibold" style={{ color: "#3d3d2e" }}>{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center" style={{ background: "white" }}>
            <div className="text-3xl mb-2">📭</div>
            <p className="text-xs font-medium" style={{ color: "#8a8e3a" }}>데이터 없음</p>
          </div>
        ) : (
          <>
            {/* ===== 데스크톱: 월간 그리드 ===== */}
            <div
              className="hidden md:grid h-full"
              style={{
                gridTemplateColumns: `68px repeat(${allDates.length}, 1fr)`,
                gridTemplateRows: `24px 28px repeat(${memberCount}, 1fr)`,
                background: "white",
              }}
            >
              {/* 🐤 코너 셀 */}
              <div
                className="flex items-center justify-center text-base"
                style={{ gridColumn: "1", gridRow: "1 / 3", background: "#6d7230", color: "#f5f3e8", borderRight: "2px solid #565a22" }}
              >
                🐤
              </div>

              {/* 주차 헤더 */}
              {weekCols.map((wc, i) => (
                <div
                  key={weeks[i].weekNum}
                  className="flex items-center justify-center text-[0.65rem] font-bold"
                  style={{
                    gridColumn: `${wc.start} / span ${wc.span}`,
                    gridRow: "1",
                    background: "#8a8e3a",
                    color: "#f5f3e8",
                    borderLeft: i > 0 ? "2px solid #6d7230" : "none",
                  }}
                >
                  {weeks[i].weekNum}주차
                </div>
              ))}

              {/* 날짜 헤더 */}
              {allDates.map((d, di) => {
                const isToday = d === today;
                const isWeekStart = weeks.some((w, wi) => wi > 0 && w.dates[0] === d);
                return (
                  <div
                    key={d}
                    className="flex items-center justify-center font-semibold whitespace-nowrap"
                    style={{
                      gridColumn: `${di + 2}`,
                      gridRow: "2",
                      background: isToday ? "#f5c842" : "#e8ebc0",
                      color: isToday ? "#3d3d2e" : "#5a5d2e",
                      borderLeft: isWeekStart ? "2px solid #c5c96b" : "1px solid #d4d88a",
                      fontSize: "0.58rem",
                    }}
                  >
                    {fmtDate(d)}
                  </div>
                );
              })}

              {/* 멤버 행 */}
              {sorted.map((member, idx) => {
                const typeEmoji = MEMBER_TYPE_EMOJI[member.member_type] || "";
                const isEven = idx % 2 === 0;
                const rowNum = idx + 3;
                const name = nameMap.get(member.user_id) || member.display_name;
                return [
                  <div
                    key={`name-${member.user_id}`}
                    className="flex items-center justify-center gap-0.5 px-0.5"
                    style={{
                      gridColumn: "1",
                      gridRow: `${rowNum}`,
                      background: isEven ? "#fff" : "#fafaf2",
                      borderTop: "1px solid #e8ebc0",
                      borderRight: "2px solid #d4d88a",
                    }}
                  >
                    <span className="text-[0.6rem] font-semibold truncate leading-tight" style={{ color: "#3d3d2e", maxWidth: "46px" }}>
                      {name}
                    </span>
                    <span className="text-[0.5rem] opacity-60 shrink-0">{typeEmoji}</span>
                  </div>,
                  ...allDates.map((d, di) => {
                    const status = member.days[d]?.status;
                    const cfg = status ? STATUS_CELL[status] : null;
                    const isToday = d === today;
                    const isWeekStart = weeks.some((w, wi) => wi > 0 && w.dates[0] === d);
                    return (
                      <div
                        key={`${member.user_id}-${d}`}
                        className="flex items-center justify-center relative"
                        style={{
                          gridColumn: `${di + 2}`,
                          gridRow: `${rowNum}`,
                          background: cfg ? cfg.bg : isEven ? "#fff" : "#fafaf2",
                          borderTop: "1px solid #e8ebc0",
                          borderLeft: isWeekStart ? "2px solid #d4d88a" : "1px solid #eeefdc",
                        }}
                      >
                        {isToday && (
                          <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 0 2px #f5c842" }} />
                        )}
                        {cfg && (
                          <span className="font-bold" style={{ color: cfg.border, fontSize: "0.7rem" }}>
                            {cfg.symbol}
                          </span>
                        )}
                      </div>
                    );
                  }),
                ];
              })}
            </div>

            {/* ===== 모바일: 주간 그리드 ===== */}
            <div
              className="grid md:hidden h-full"
              style={{
                gridTemplateColumns: `54px repeat(${mobileDates.length}, 1fr)`,
                gridTemplateRows: `28px repeat(${memberCount}, 1fr)`,
                background: "white",
              }}
            >
              {/* 🐤 코너 */}
              <div
                className="flex items-center justify-center text-sm"
                style={{ gridColumn: "1", gridRow: "1", background: "#6d7230", color: "#f5f3e8", borderRight: "2px solid #565a22" }}
              >
                🐤
              </div>

              {/* 날짜 헤더 */}
              {mobileDates.map((d, di) => {
                const isToday = d === today;
                return (
                  <div
                    key={d}
                    className="flex items-center justify-center font-bold whitespace-nowrap"
                    style={{
                      gridColumn: `${di + 2}`,
                      gridRow: "1",
                      background: isToday ? "#f5c842" : "#e8ebc0",
                      color: isToday ? "#3d3d2e" : "#5a5d2e",
                      borderLeft: "1px solid #d4d88a",
                      fontSize: "0.6rem",
                    }}
                  >
                    {fmtDateShort(d)}
                  </div>
                );
              })}

              {/* 멤버 행 */}
              {sorted.map((member, idx) => {
                const typeEmoji = MEMBER_TYPE_EMOJI[member.member_type] || "";
                const isEven = idx % 2 === 0;
                const rowNum = idx + 2;
                const name = nameMap.get(member.user_id) || member.display_name;
                return [
                  <div
                    key={`m-name-${member.user_id}`}
                    className="flex items-center justify-center gap-0.5 px-0.5"
                    style={{
                      gridColumn: "1",
                      gridRow: `${rowNum}`,
                      background: isEven ? "#fff" : "#fafaf2",
                      borderTop: "1px solid #e8ebc0",
                      borderRight: "2px solid #d4d88a",
                    }}
                  >
                    <span className="text-[0.55rem] font-semibold truncate leading-tight" style={{ color: "#3d3d2e", maxWidth: "36px" }}>
                      {name}
                    </span>
                    <span className="text-[0.45rem] opacity-60 shrink-0">{typeEmoji}</span>
                  </div>,
                  ...mobileDates.map((d, di) => {
                    const status = member.days[d]?.status;
                    const cfg = status ? STATUS_CELL[status] : null;
                    const isToday = d === today;
                    return (
                      <div
                        key={`m-${member.user_id}-${d}`}
                        className="flex items-center justify-center relative"
                        style={{
                          gridColumn: `${di + 2}`,
                          gridRow: `${rowNum}`,
                          background: cfg ? cfg.bg : isEven ? "#fff" : "#fafaf2",
                          borderTop: "1px solid #e8ebc0",
                          borderLeft: "1px solid #eeefdc",
                        }}
                      >
                        {isToday && (
                          <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 0 2px #f5c842" }} />
                        )}
                        {cfg && (
                          <span className="font-bold" style={{ color: cfg.border, fontSize: "0.85rem" }}>
                            {cfg.symbol}
                          </span>
                        )}
                      </div>
                    );
                  }),
                ];
              })}
            </div>
          </>
        )}
      </div>

      {/* ===== 푸터 ===== */}
      <div className="text-center py-0.5 shrink-0">
        <p className="text-[0.5rem] md:text-[0.6rem] font-medium" style={{ color: "#b0b45a" }}>
          🐥 일찍새 · 피어잇
        </p>
      </div>
    </div>
  );
}
