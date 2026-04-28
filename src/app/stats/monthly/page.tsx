"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { isLoggedIn, getUser } from "@/lib/auth";
import { formatMinutes, MEMBER_TYPE_LABELS, isVisibleMember } from "@/lib/utils";

interface Stat {
  rank: number;
  user_id: string;
  display_name: string;
  member_type: string;
  total_minutes: number;
  total_hours: number;
  on_time_days: number;
  late_days: number;
  fail_days: number;
  excused_days: number;
  avg_hours: number;
  total_members: number;
}

export default function MonthlyStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stat[]>([]);
  const [year, setYear] = useState(0);
  const [month, setMonth] = useState(0);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    loadStats();
  }, [router]);

  const loadStats = async () => {
    try {
      const data = await apiFetch<{ year: number; month: number; stats: Stat[] }>(
        "/api/stats/monthly"
      );
      setStats(data.stats.filter((s) => isVisibleMember(s.member_type, s.display_name)));
      setYear(data.year);
      setMonth(data.month);
    } catch {
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold">월간 통계</h1>
          <Link href="/stats/weekly" className="text-sm text-blue-500 hover:underline">
            &lt; 주간 통계
          </Link>
        </div>

        {year > 0 && (
          <p className="text-gray-500 text-sm">
            {year}년 {month}월
          </p>
        )}

        {loading ? (
          <p className="text-gray-400">로딩중...</p>
        ) : stats.length === 0 ? (
          <p className="text-gray-400">데이터가 없습니다.</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
            <table className="w-full text-xs sm:text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">#</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">이름</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">구분</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-right">근무</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">정상</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">인정</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">지각</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr
                    key={s.user_id}
                    className={`border-t ${
                      s.user_id === user?.id ? "bg-green-50 font-semibold" : ""
                    }`}
                  >
                    <td className="px-2 sm:px-4 py-2 sm:py-3">{s.rank}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">{s.display_name}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs text-gray-500">
                      {MEMBER_TYPE_LABELS[s.member_type] || "-"}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">{formatMinutes(s.total_minutes)}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-green-600">{s.on_time_days}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-blue-500">{s.excused_days}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-red-500">{s.fail_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
