"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { getUser, isLoggedIn } from "@/lib/auth";

interface Meeting {
  id: string;
  meeting_type: string;
  title: string;
  meeting_date: string;
  meeting_time: string;
  description: string | null;
}

export default function AdminMeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [title, setTitle] = useState("");
  const [meetingType, setMeetingType] = useState("mid_month");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("10:00");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn() || !user?.is_admin) {
      router.replace("/dashboard");
      return;
    }
    loadMeetings();
  }, [router]);

  const loadMeetings = async () => {
    try {
      const data = await apiFetch<Meeting[]>("/api/meetings");
      setMeetings(data);
    } catch {
      setMeetings([]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/api/meetings", {
        method: "POST",
        body: JSON.stringify({
          meeting_type: meetingType,
          title,
          meeting_date: meetingDate,
          meeting_time: meetingTime,
          description: description || null,
        }),
      });
      setTitle("");
      setDescription("");
      await loadMeetings();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await apiFetch(`/api/meetings/${id}`, { method: "DELETE" });
    await loadMeetings();
  };

  const typeLabels: Record<string, string> = {
    mid_month: "중간조회",
    regular_morning: "정기 아침조회",
  };

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold">조회 관리</h1>

        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">유형</label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="mid_month">중간조회</option>
                <option value="regular_morning">정기 아침조회</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="4월 중간조회"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">날짜</label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">시간</label>
              <input
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">설명 (선택)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="장소, 준비물 등"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {submitting ? "등록중..." : "조회 등록"}
          </button>
        </form>

        {meetings.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold">예정된 조회</h2>
            {meetings.map((m) => (
              <div key={m.id} className="bg-white rounded-lg border p-4 flex justify-between items-center">
                <div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mr-2">
                    {typeLabels[m.meeting_type]}
                  </span>
                  <span className="font-medium">{m.title}</span>
                  <span className="text-gray-500 ml-2 text-sm">
                    {m.meeting_date} {m.meeting_time}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="text-sm text-red-400 hover:text-red-600"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
