"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser, removeToken } from "@/lib/auth";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "홈" },
  { href: "/attendance", label: "출석부" },
  { href: "/excuse", label: "사유제출" },
  { href: "/stats/weekly", label: "통계" },
  { href: "/recruitment", label: "모집" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  if (!user) return null;

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/dashboard" className="font-bold text-lg text-green-700">
            일찍새
          </Link>

          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded text-sm ${
                  pathname.startsWith(item.href)
                    ? "bg-green-100 text-green-800 font-semibold"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user.is_admin && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded text-sm ${
                  pathname.startsWith("/admin")
                    ? "bg-green-100 text-green-800 font-semibold"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                관리
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/settings" className="text-sm text-gray-600 hover:underline">
              {user.display_name}
            </Link>
            <button
              onClick={() => {
                removeToken();
                window.location.href = "/login";
              }}
              className="text-sm text-gray-400 hover:text-red-500"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
