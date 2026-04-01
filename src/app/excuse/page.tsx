"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

interface Excuse {
  id: string;
  date: string;
  reason: string;
  submitted_at: string;
}

export default function ExcusePage() {
  const router = useRouter();
  const [excuses, setExcuses] = useState<Excuse[]>([]);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    loadExcuses();

    // 기본 날짜를 내일로
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split("T")[0]);
  }, [router]);

  const loadExcuses = async () => {
    try {
      const data = await apiFetch<Excuse[]>("/api/excuses/me");
      setExcuses(data);
    } catch {
      setExcuses([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await apiFetch("/api/excuses", {
        method: "POST",
        body: JSON.stringify({ date, reason }),
      });
      setReason("");
      await loadExcuses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("사유를 삭제하시겠습니까?")) return;
    try {
      await apiFetch(`/api/excuses/${id}`, { method: "DELETE" });
      await loadExcuses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold">지각/결석 사유 제출</h1>
        <p className="text-sm text-gray-500">
          전날 밤 23시까지 다음날 지각/결석 사유를 제출하면 출석 인정(파란색)됩니다.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사유</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 h-24 resize-none"
              placeholder="사유를 입력하세요"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? "제출중..." : "사유 제출"}
          </button>
        </form>

        {excuses.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold">제출한 사유</h2>
            {excuses.map((e) => (
              <div key={e.id} className="bg-white rounded-lg border p-4 flex justify-between items-start">
                <div>
                  <p className="font-medium">{e.date}</p>
                  <p className="text-sm text-gray-600">{e.reason}</p>
                </div>
                <button
                  onClick={() => handleDelete(e.id)}
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
