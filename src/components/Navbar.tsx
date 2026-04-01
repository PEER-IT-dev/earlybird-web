"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser, removeToken } from "@/lib/auth";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "홈", icon: "🏠" },
  { href: "/attendance", label: "출석부", icon: "📋" },
  { href: "/excuse", label: "사유", icon: "✏️" },
  { href: "/stats/weekly", label: "통계", icon: "📊" },
  { href: "/recruitment", label: "모집", icon: "🌱" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  if (!user) return null;

  return (
    <nav className="bg-white/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm" style={{ borderBottom: "2px solid #e8ebc0" }}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/dashboard" className="font-bold text-lg flex items-center gap-1.5" style={{ color: "#8a8e3a" }}>
            🐥 일찍새
          </Link>

          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-full text-sm transition-all ${
                  pathname.startsWith(item.href)
                    ? "font-semibold"
                    : "text-gray-500 hover:bg-[#f0f1d8]"
                }`}
                style={
                  pathname.startsWith(item.href)
                    ? { background: "#e8ebc0", color: "#6b6f2b" }
                    : undefined
                }
              >
                <span className="hidden sm:inline">{item.icon} </span>
                {item.label}
              </Link>
            ))}
            {user.is_admin && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-full text-sm transition-all ${
                  pathname.startsWith("/admin")
                    ? "font-semibold"
                    : "text-gray-500 hover:bg-[#f0f1d8]"
                }`}
                style={
                  pathname.startsWith("/admin")
                    ? { background: "#e8ebc0", color: "#6b6f2b" }
                    : undefined
                }
              >
                ⚙️ 관리
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/settings" className="text-sm hover:underline" style={{ color: "#8a8e3a" }}>
              {user.display_name}
            </Link>
            <button
              onClick={() => {
                removeToken();
                window.location.href = "/login";
              }}
              className="text-sm text-gray-400 hover:text-red-400 transition-colors"
            >
              나가기
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
