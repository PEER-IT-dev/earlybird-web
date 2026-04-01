"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { getUser, setUser } from "@/lib/auth";

interface NicknameModalProps {
  onComplete: () => void;
}

export default function NicknameModal({ onComplete }: NicknameModalProps) {
  const [realName, setRealName] = useState("");
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!realName.trim()) {
      setError("실명을 입력해주세요.");
      return;
    }
    if (!nickname.trim()) {
      setError("잇소키 닉네임을 입력해주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          display_name: nickname.trim(),
          real_name: realName.trim(),
        }),
      });
      const user = getUser();
      if (user) {
        user.display_name = nickname.trim();
        setUser(user);
      }
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-5" style={{ boxShadow: "0 8px 30px rgba(197, 201, 107, 0.25)" }}>
        <div className="text-center">
          <div className="text-4xl mb-2">🐥</div>
          <h2 className="text-xl font-bold" style={{ color: "#4a4e1c" }}>프로필 설정</h2>
          <p className="text-sm mt-1" style={{ color: "#a0a44e" }}>
            실명과 잇소키 닉네임을 입력해주세요
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#6b6f2b" }}>실명</label>
            <input
              type="text"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              className="w-full border-2 rounded-xl px-4 py-3 text-center text-lg focus:outline-none"
              style={{ borderColor: "#e8ebc0", background: "#fafaf2" }}
              placeholder="홍길동"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#6b6f2b" }}>잇소키 닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full border-2 rounded-xl px-4 py-3 text-center text-lg focus:outline-none"
              style={{ borderColor: "#e8ebc0", background: "#fafaf2" }}
              placeholder="잇소키 앱과 동일한 닉네임"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="cloud-btn w-full text-white font-medium py-3 disabled:opacity-50"
          style={{ background: "#8a8e3a" }}
        >
          {saving ? "저장중..." : "설정 완료"}
        </button>
      </div>
    </div>
  );
}
