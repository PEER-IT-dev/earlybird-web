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

interface TeamMember {
  user_id: string;
  display_name: string;
  member_type: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  net_minutes: number;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [today, setToday] = useState<MyAttendance | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [myRecords, teamData] = await Promise.all([
        apiFetch<MyAttendance[]>("/api/attendance/me"),
        apiFetch<TeamMember[]>("/api/attendance"),
      ]);
      const todayStr = new Date().toISOString().split("T")[0];
      setToday(myRecords.find((r) => r.date === todayStr) || null);
      setTeam(teamData);
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
      await loadData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div style={{ color: "#b0b462" }}>🐥 로딩중...</div>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* 오늘 날짜 */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#4a4e1c" }}>
            {todayStr}
          </h1>
          <p style={{ color: "#a0a44e" }}>
            {user?.display_name}님
            {user?.member_type
              ? ` · ${user.member_type === "super_earlybird" ? "⚡" : "🌱"} ${MEMBER_TYPE_LABELS[user.member_type]}`
              : " · 멤버 등록 대기중"}
          </p>
        </div>

        {/* 내 출석 + 퇴근 버튼 */}
        <div className="cloud-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🐥</span>
              <div>
                <p className="font-semibold" style={{ color: "#4a4e1c" }}>내 출근</p>
                <p className="text-sm text-gray-500">
                  {today?.check_in ? formatTime(today.check_in) : "아직 없음"}
                  {today?.check_out && ` → ${formatTime(today.check_out)}`}
                  {today && today.net_minutes > 0 && ` (${formatMinutes(today.net_minutes)})`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {today && <StatusBadge status={today.status} />}
              {today?.check_in && !today?.check_out && (
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="cloud-btn text-white text-sm px-4 py-2 disabled:opacity-50"
                  style={{ background: "#8a8e3a" }}
                >
                  {checkingOut ? "..." : "퇴근"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 팀 전체 현황 */}
        <div className="cloud-card p-5 space-y-4">
          <h2 className="font-semibold text-lg" style={{ color: "#6b6f2b" }}>
            오늘 출석 현황
          </h2>

          {team.length === 0 ? (
            <p className="text-gray-400 text-center py-4">아직 출석 데이터가 없어요</p>
          ) : (
            <div className="space-y-2">
              {team.map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[#f8f8ee] transition-colors"
                  style={m.user_id === user?.id ? { background: "#f0f1d8" } : undefined}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {m.member_type === "super_earlybird" ? "⚡" : "🌱"}
                    </span>
                    <div>
                      <p className="font-medium text-sm" style={{ color: "#4a4e1c" }}>
                        {m.display_name}
                        {m.user_id === user?.id && (
                          <span className="text-xs ml-1" style={{ color: "#b0b462" }}>나</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {MEMBER_TYPE_LABELS[m.member_type] || ""}
                        {m.check_in && ` · ${formatTime(m.check_in)}`}
                        {m.net_minutes > 0 && ` · ${formatMinutes(m.net_minutes)}`}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={m.status} checkIn={m.check_in} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
