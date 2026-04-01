"use client";

import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const handleKakaoLogin = async () => {
    const data = await apiFetch<{ url: string }>("/api/auth/kakao");
    window.location.href = data.url;
  };

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "linear-gradient(180deg, #e8ebc0 0%, #f5f3e8 100%)" }}>
      <div className="text-center space-y-8">
        {/* 몽글몽글 구름 로고 */}
        <div className="relative inline-block">
          <div className="bg-white rounded-[40px] px-12 py-10 shadow-lg" style={{ boxShadow: "0 8px 30px rgba(197, 201, 107, 0.2)" }}>
            <div className="text-5xl mb-3">🐥</div>
            <h1 className="text-3xl font-bold" style={{ color: "#8a8e3a" }}>일찍새</h1>
            <p className="text-sm mt-1" style={{ color: "#b0b462" }}>PEER IT !</p>
          </div>
          {/* 구름 데코 */}
          <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-white rounded-full shadow-sm" />
          <div className="absolute -bottom-6 -left-6 w-5 h-5 bg-white rounded-full shadow-sm" />
        </div>

        <div className="space-y-3">
          <button
            onClick={handleKakaoLogin}
            className="cloud-btn bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] px-10 py-3.5 text-base shadow-md"
          >
            🔑 카카오 로그인
          </button>
        </div>

        <div className="text-sm space-y-1" style={{ color: "#a0a44e" }}>
          <p>매일 아침, 일찍 출근하는 습관을 만들어요</p>
          <p>🌱 일찍새 10:00 / ⚡ 쌉일찍새 9:30</p>
        </div>
      </div>
    </div>
  );
}
