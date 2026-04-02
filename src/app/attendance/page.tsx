"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import AttendanceGrid from "@/components/AttendanceGrid";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

export default function AttendancePage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    loadSheet();
  }, [weekOffset, router]);

  const loadSheet = async () => {
    setLoading(true);
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const start = monday.toISOString().split("T")[0];
    const end = friday.toISOString().split("T")[0];

    // 날짜 배열 생성
    const dateArr: string[] = [];
    const d = new Date(monday);
    while (d <= friday) {
      dateArr.push(d.toISOString().split("T")[0]);
      d.setDate(d.getDate() + 1);
    }
    setDates(dateArr);

    try {
      const sheet = await apiFetch<any[]>(`/api/attendance/sheet?start=${start}&end=${end}`);
      setData(sheet);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="text-lg sm:text-xl font-bold">출석부</h1>
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="px-2 sm:px-3 py-1 border rounded hover:bg-gray-100"
            >
              &lt; 이전
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-2 sm:px-3 py-1 border rounded hover:bg-gray-100"
            >
              이번주
            </button>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="px-2 sm:px-3 py-1 border rounded hover:bg-gray-100"
            >
              다음 &gt;
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-lime-400 inline-block" /> 정상
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-600 inline-block" /> 10분이내
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> 인정
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500 inline-block" /> 지각/결석
          </span>
        </div>

        {loading ? (
          <p className="text-gray-400">로딩중...</p>
        ) : data.length === 0 ? (
          <p className="text-gray-400">출석 데이터가 없습니다.</p>
        ) : (
          <AttendanceGrid data={data} dates={dates} />
        )}
      </main>
    </>
  );
}
