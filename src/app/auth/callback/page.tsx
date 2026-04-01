"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      router.replace("/login");
      return;
    }

    apiFetch<{
      access_token: string;
      user: {
        id: string;
        display_name: string;
        member_type: string | null;
        is_admin: boolean;
        profile_image: string | null;
      };
    }>(`/api/auth/kakao/callback?code=${code}`, { method: "POST" })
      .then((data) => {
        setToken(data.access_token);
        setUser(data.user as any);
        router.replace("/dashboard");
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router, searchParams]);

  return <div className="text-gray-500">로그인 중...</div>;
}

export default function AuthCallbackPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Suspense fallback={<div className="text-gray-400">로딩중...</div>}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
