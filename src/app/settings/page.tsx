"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { getUser, isLoggedIn, setUser } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    const user = getUser();
    if (user) setDisplayName(user.display_name);
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await apiFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({ display_name: displayName }),
      });
      const user = getUser();
      if (user) {
        user.display_name = displayName;
        setUser(user);
      }
      setMessage("저장 완료!");
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const enablePush = async () => {
    if (!("Notification" in window)) {
      alert("이 브라우저는 알림을 지원하지 않습니다.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("알림 권한이 거부되었습니다.");
      return;
    }

    const reg = await navigator.serviceWorker.ready;
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      alert("VAPID 키가 설정되지 않았습니다.");
      return;
    }

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey,
    });

    await apiFetch("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify({ push_subscription: subscription.toJSON() }),
    });

    setMessage("알림 설정 완료!");
  };

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold">설정</h1>

        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              닉네임 (잇소키 닉네임과 동일하게 설정)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
            <p className="text-xs text-gray-400 mt-1">
              잇소키 앱의 닉네임과 같아야 출근이 자동 인식됩니다.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "저장중..." : "닉네임 저장"}
          </button>

          {message && (
            <p className={`text-sm ${message.includes("완료") ? "text-green-600" : "text-red-500"}`}>
              {message}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h2 className="font-semibold">알림 설정</h2>
          <p className="text-sm text-gray-500">
            출근 체크, 주간 리포트, 조회 알림 등을 받을 수 있습니다.
          </p>
          <button
            onClick={enablePush}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            알림 허용하기
          </button>
        </div>
      </main>
    </>
  );
}
