"use client";

import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const handleKakaoLogin = async () => {
    const data = await apiFetch<{ url: string }>("/api/auth/kakao");
    window.location.href = data.url;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-green-800">일찍새</h1>
          <p className="text-gray-500 mt-2">피어잇 출근 챌린지</p>
        </div>

        <button
          onClick={handleKakaoLogin}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-8 py-3 rounded-lg shadow-md transition-colors"
        >
          카카오 로그인
        </button>

        <div className="text-sm text-gray-400 space-y-1">
          <p>매일 아침, 일찍 출근하는 습관을 만들어요</p>
          <p>일찍새 10:00 / 쌉일찍새 9:30</p>
        </div>
      </div>
    </div>
  );
}
