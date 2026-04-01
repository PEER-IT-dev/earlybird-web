"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
import { getUser, isLoggedIn } from "@/lib/auth";
import { formatMinutes, formatTime, MEMBER_TYPE_LABELS } from "@/lib/utils";

interface MyAttendance {
  date: string;
  check_in: string | null;
  check_out: string | null;
  net_minutes: number;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [today, setToday] = useState<MyAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    loadToday();
  }, [router]);

  const loadToday = async () => {
    try {
      const records = await apiFetch<MyAttendance[]>("/api/attendance/me");
      const todayStr = new Date().toISOString().split("T")[0];
      const todayRecord = records.find((r) => r.date === todayStr);
      setToday(todayRecord || null);
    } catch {
      // no data
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      await apiFetch("/api/attendance/checkout", { method: "POST" });
      await loadToday();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">로딩중...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* 인사 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            안녕하세요, {user?.display_name}님
          </h1>
          <p className="text-gray-500">
            {user?.member_type
              ? `${MEMBER_TYPE_LABELS[user.member_type]} 멤버`
              : "멤버 등록 대기중"}
          </p>
        </div>

        {/* 오늘 출석 카드 */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h2 className="font-semibold text-lg">오늘 출석</h2>

          {today ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">상태</span>
                <StatusBadge status={today.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">출근</span>
                <span className="font-medium">{formatTime(today.check_in)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">퇴근</span>
                <span className="font-medium">
                  {today.check_out ? formatTime(today.check_out) : "-"}
                </span>
              </div>
              {today.net_minutes > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">근무시간</span>
                  <span className="font-medium">{formatMinutes(today.net_minutes)}</span>
                </div>
              )}

              {/* 퇴근 버튼 */}
              {today.check_in && !today.check_out && (
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {checkingOut ? "처리중..." : "퇴근 체크"}
                </button>
              )}
            </div>
          ) : (
            <p className="text-gray-400">아직 출근 기록이 없습니다.</p>
          )}
        </div>
      </main>
    </>
  );
}
