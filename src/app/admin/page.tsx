"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { getUser, isLoggedIn } from "@/lib/auth";
import { MEMBER_TYPE_LABELS } from "@/lib/utils";

interface Member {
  id: string;
  display_name: string;
  real_name: string | null;
  member_type: string | null;
  is_admin: boolean;
  profile_image: string | null;
}

interface AttendanceRecord {
  user_id: string;
  display_name: string;
  member_type: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  net_minutes: number;
  status: string;
}

interface Excuse {
  id: string;
  user_id: string;
  display_name: string;
  date: string;
  reason: string;
  status: string;
  submitted_at: string;
}

type Tab = "members" | "attendance" | "excuses";

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [excuses, setExcuses] = useState<Excuse[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editRealName, setEditRealName] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn() || !user?.is_admin) {
      router.replace("/dashboard");
      return;
    }
    loadMembers();
  }, [router]);

  useEffect(() => {
    if (tab === "attendance") loadAttendance();
    if (tab === "excuses") loadExcuses();
  }, [tab, selectedDate]);

  const loadMembers = async () => {
    try {
      const data = await apiFetch<Member[]>("/api/users");
      setMembers(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      const data = await apiFetch<AttendanceRecord[]>(`/api/attendance?date=${selectedDate}`);
      setAttendance(data);
    } catch {
      setAttendance([]);
    }
  };

  const loadExcuses = async () => {
    try {
      const data = await apiFetch<Excuse[]>("/api/excuses/admin/all");
      setExcuses(data);
    } catch {
      setExcuses([]);
    }
  };

  const setMemberType = async (userId: string, type: string) => {
    try {
      await apiFetch(`/api/users/${userId}/member-type`, {
        method: "PATCH",
        body: JSON.stringify({ member_type: type }),
      });
      await loadMembers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const saveMemberProfile = async (userId: string) => {
    try {
      await apiFetch(`/api/users/${userId}/profile`, {
        method: "PATCH",
        body: JSON.stringify({
          display_name: editDisplayName || undefined,
          real_name: editRealName || undefined,
        }),
      });
      setEditingMember(null);
      await loadMembers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const saveCheckIn = async (userId: string) => {
    try {
      await apiFetch(`/api/attendance/admin/${userId}/${selectedDate}`, {
        method: "PATCH",
        body: JSON.stringify({ check_in: editCheckIn }),
      });
      setEditingUser(null);
      await loadAttendance();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExcuseAction = async (excuseId: string, status: string) => {
    try {
      await apiFetch(`/api/excuses/admin/${excuseId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadExcuses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const tabStyle = (t: Tab) =>
    `px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
      tab === t ? "text-white" : "hover:bg-[#f0f1d8]"
    }`;

  const statusLabels: Record<string, string> = {
    pending: "대기중",
    approved: "승인",
    rejected: "반려",
  };

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold" style={{ color: "#4a4e1c" }}>관리자</h1>
          <Link
            href="/admin/meetings"
            className="cloud-btn text-white text-xs sm:text-sm px-3 sm:px-4 py-2"
            style={{ background: "#8a8e3a" }}
          >
            조회 관리
          </Link>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 sm:gap-2">
          <button onClick={() => setTab("members")} className={tabStyle("members")} style={tab === "members" ? { background: "#8a8e3a" } : undefined}>
            멤버
          </button>
          <button onClick={() => setTab("attendance")} className={tabStyle("attendance")} style={tab === "attendance" ? { background: "#8a8e3a" } : undefined}>
            출석
          </button>
          <button onClick={() => setTab("excuses")} className={tabStyle("excuses")} style={tab === "excuses" ? { background: "#8a8e3a" } : undefined}>
            사유
          </button>
        </div>

        {/* 멤버 관리 */}
        {tab === "members" && (
          <div className="cloud-card overflow-x-auto">
            <table className="w-full text-xs sm:text-sm whitespace-nowrap">
              <thead>
                <tr style={{ background: "#f8f8ee" }}>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">실명</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">닉네임</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">구분</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">편집</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      {editingMember === m.id ? (
                        <input
                          type="text"
                          value={editRealName}
                          onChange={(e) => setEditRealName(e.target.value)}
                          className="border rounded px-2 py-1 w-16 sm:w-20 text-xs sm:text-sm"
                          placeholder="실명"
                        />
                      ) : (
                        <span className="font-medium">
                          {m.real_name || <span className="text-gray-400">미설정</span>}
                          {m.is_admin && (
                            <span className="ml-1 text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded" style={{ background: "#e8ebc0", color: "#6b6f2b" }}>관리자</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      {editingMember === m.id ? (
                        <input
                          type="text"
                          value={editDisplayName}
                          onChange={(e) => setEditDisplayName(e.target.value)}
                          className="border rounded px-2 py-1 w-20 sm:w-28 text-xs sm:text-sm"
                          placeholder="닉네임"
                        />
                      ) : (
                        <span className="text-xs sm:text-sm text-gray-600">{m.display_name}</span>
                      )}
                    </td>
                    <td className="px-1 sm:px-4 py-2 sm:py-3 text-center">
                      <div className="flex flex-wrap justify-center gap-0.5 sm:gap-1">
                        {["earlybird", "super_earlybird", "member", "manager", "leader"].map((type) => (
                          <button
                            key={type}
                            onClick={() => setMemberType(m.id, type)}
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs ${
                              m.member_type === type
                                ? "text-white"
                                : "border hover:bg-gray-100"
                            }`}
                            style={m.member_type === type ? { background: "#8a8e3a" } : undefined}
                          >
                            {MEMBER_TYPE_LABELS[type]}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                      {editingMember === m.id ? (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => saveMemberProfile(m.id)}
                            className="text-[10px] sm:text-xs px-2 py-1 rounded text-white"
                            style={{ background: "#8a8e3a" }}
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingMember(null)}
                            className="text-[10px] sm:text-xs px-2 py-1 rounded border"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingMember(m.id);
                            setEditRealName(m.real_name || "");
                            setEditDisplayName(m.display_name);
                          }}
                          className="text-[10px] sm:text-xs px-2 py-1 rounded border hover:bg-gray-100"
                        >
                          수정
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 출석 수정 */}
        {tab === "attendance" && (
          <div className="space-y-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-2 rounded-xl px-3 sm:px-4 py-2 text-sm"
              style={{ borderColor: "#e8ebc0" }}
            />
            <div className="cloud-card overflow-x-auto">
              <table className="w-full text-xs sm:text-sm whitespace-nowrap">
                <thead>
                  <tr style={{ background: "#f8f8ee" }}>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">이름</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">출근</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">상태</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">수정</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a) => (
                    <tr key={a.user_id} className="border-t">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium">{a.display_name}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        {editingUser === a.user_id ? (
                          <input
                            type="time"
                            value={editCheckIn}
                            onChange={(e) => setEditCheckIn(e.target.value)}
                            className="border rounded px-1 sm:px-2 py-1 text-center w-20 sm:w-24 text-xs sm:text-sm"
                            autoFocus
                          />
                        ) : (
                          a.check_in
                            ? new Date(a.check_in).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
                            : "-"
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                          a.status === "on_time" ? "bg-lime-100 text-lime-700" :
                          a.status === "slightly_late" ? "bg-green-100 text-green-700" :
                          a.status === "excused" ? "bg-blue-100 text-blue-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {a.status === "on_time" ? "정상" : a.status === "slightly_late" ? "10분이내" : a.status === "excused" ? "인정" : a.status === "late" ? "지각" : "결석"}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        {editingUser === a.user_id ? (
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => saveCheckIn(a.user_id)}
                              className="text-[10px] sm:text-xs px-2 py-1 rounded text-white"
                              style={{ background: "#8a8e3a" }}
                            >
                              저장
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="text-[10px] sm:text-xs px-2 py-1 rounded border"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingUser(a.user_id);
                              setEditCheckIn(
                                a.check_in
                                  ? new Date(a.check_in).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
                                  : ""
                              );
                            }}
                            className="text-[10px] sm:text-xs px-2 py-1 rounded border hover:bg-gray-100"
                          >
                            수정
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {attendance.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">출석 데이터가 없습니다</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 사유 관리 */}
        {tab === "excuses" && (
          <div className="space-y-3">
            {excuses.length === 0 ? (
              <div className="cloud-card p-8 text-center text-gray-400">제출된 사유가 없습니다</div>
            ) : (
              excuses.map((e) => (
                <div key={e.id} className="cloud-card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className="font-medium text-sm" style={{ color: "#4a4e1c" }}>{e.display_name}</span>
                      <span className="text-xs text-gray-400">{e.date}</span>
                      <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                        e.status === "approved" ? "bg-green-100 text-green-700" :
                        e.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {statusLabels[e.status] || e.status}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">{e.reason}</p>
                  </div>
                  {e.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleExcuseAction(e.id, "approved")}
                        className="cloud-btn text-xs text-white px-3 py-1.5"
                        style={{ background: "#7cb342" }}
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleExcuseAction(e.id, "rejected")}
                        className="cloud-btn text-xs text-white px-3 py-1.5 bg-red-400"
                      >
                        반려
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </>
  );
}
