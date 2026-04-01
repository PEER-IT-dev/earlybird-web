"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

interface Period {
  id: string;
  year_month: string;
  open_date: string;
  close_date: string;
  status: string;
}

interface MyApplication {
  desired_type: string;
  message: string | null;
  submitted_at: string;
}

export default function RecruitmentPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period | null>(null);
  const [myApp, setMyApp] = useState<MyApplication | null>(null);
  const [desiredType, setDesiredType] = useState("earlybird");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    loadRecruitment();
  }, [router]);

  const loadRecruitment = async () => {
    try {
      const data = await apiFetch<{ period: Period | null; my_application: MyApplication | null }>(
        "/api/recruitment/current"
      );
      setPeriod(data.period);
      setMyApp(data.my_application);
    } catch {
      // no data
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/api/recruitment/apply", {
        method: "POST",
        body: JSON.stringify({ desired_type: desiredType, message: message || null }),
      });
      await loadRecruitment();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold">일찍새 모집</h1>

        {loading ? (
          <p className="text-gray-400">로딩중...</p>
        ) : !period ? (
          <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
            <p className="text-gray-500">현재 모집 기간이 아닙니다.</p>
            <p className="text-sm text-gray-400 mt-2">
              매월 마지막 월~화요일에 다음 달 모집이 시작됩니다.
            </p>
          </div>
        ) : myApp ? (
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-3">
            <h2 className="font-semibold text-green-700">신청 완료!</h2>
            <p>
              {period.year_month.split("-")[1]}월{" "}
              {myApp.desired_type === "super_earlybird" ? "쌉일찍새" : "일찍새"} 신청됨
            </p>
            {myApp.message && <p className="text-sm text-gray-500">{myApp.message}</p>}
          </div>
        ) : (
          <form onSubmit={handleApply} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h2 className="font-semibold">
              {period.year_month.split("-")[1]}월 일찍새 신청
            </h2>
            <p className="text-sm text-gray-500">
              모집기간: {period.open_date} ~ {period.close_date}
            </p>

            <div>
              <label className="block text-sm font-medium mb-2">유형 선택</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="earlybird"
                    checked={desiredType === "earlybird"}
                    onChange={(e) => setDesiredType(e.target.value)}
                  />
                  <span>일찍새 (10시 출근)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="super_earlybird"
                    checked={desiredType === "super_earlybird"}
                    onChange={(e) => setDesiredType(e.target.value)}
                  />
                  <span>쌉일찍새 (9시 30분 출근)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">한마디 (선택)</label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="각오 한마디!"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? "신청중..." : "신청하기"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
