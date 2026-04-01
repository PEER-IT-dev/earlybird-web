"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/lib/api";
import { getUser, isLoggedIn } from "@/lib/auth";
import { MEMBER_TYPE_LABELS } from "@/lib/utils";

interface Member {
  id: string;
  display_name: string;
  member_type: string | null;
  is_admin: boolean;
  profile_image: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn() || !user?.is_admin) {
      router.replace("/dashboard");
      return;
    }
    loadMembers();
  }, [router]);

  const loadMembers = async () => {
    try {
      const data = await apiFetch<Member[]>("/api/users");
      setMembers(data);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const setMemberType = async (userId: string, type: string) => {
    try {
      await apiFetch(`/api/users/${userId}/member-type`, {
        method: "PATCH",
        body: JSON.stringify({ member_type: type }),
      });
      await loadMembers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">관리자</h1>
          <Link
            href="/admin/meetings"
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
          >
            조회 관리
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left">이름</th>
                <th className="px-4 py-3 text-center">현재 구분</th>
                <th className="px-4 py-3 text-center">변경</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3 font-medium">
                    {m.display_name}
                    {m.is_admin && (
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                        관리자
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {m.member_type ? MEMBER_TYPE_LABELS[m.member_type] : "미등록"}
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button
                      onClick={() => setMemberType(m.id, "earlybird")}
                      className={`px-2 py-1 rounded text-xs ${
                        m.member_type === "earlybird"
                          ? "bg-green-200 text-green-800"
                          : "border hover:bg-gray-100"
                      }`}
                    >
                      일찍새
                    </button>
                    <button
                      onClick={() => setMemberType(m.id, "super_earlybird")}
                      className={`px-2 py-1 rounded text-xs ${
                        m.member_type === "super_earlybird"
                          ? "bg-green-200 text-green-800"
                          : "border hover:bg-gray-100"
                      }`}
                    >
                      쌉일찍새
                    </button>
                    <button
                      onClick={() => setMemberType(m.id, "member")}
                      className={`px-2 py-1 rounded text-xs ${
                        m.member_type === "member"
                          ? "bg-gray-300 text-gray-800"
                          : "border hover:bg-gray-100"
                      }`}
                    >
                      멤버
                    </button>
                    <button
                      onClick={() => setMemberType(m.id, "manager")}
                      className={`px-2 py-1 rounded text-xs ${
                        m.member_type === "manager"
                          ? "bg-yellow-200 text-yellow-800"
                          : "border hover:bg-gray-100"
                      }`}
                    >
                      관리새
                    </button>
                    <button
                      onClick={() => setMemberType(m.id, "leader")}
                      className={`px-2 py-1 rounded text-xs ${
                        m.member_type === "leader"
                          ? "bg-orange-200 text-orange-800"
                          : "border hover:bg-gray-100"
                      }`}
                    >
                      대장새
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
