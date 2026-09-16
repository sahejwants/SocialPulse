import type { ReactElement } from "react";
import type { GetServerSideProps } from "next";
import type { NextPageWithLayout } from "../_app";
import { useState } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Role } from "@prisma/client";
import { formatDate, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useRouter } from "next/router";
import { ShieldCheck, Archive, RotateCcw, ChevronDown, Search } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: string;
  emailVerified: string | null;
  deletedAt: string | null;
}

interface AdminUsersProps {
  activeUsers: User[];
  archivedUsers: User[];
  currentUserId: string;
}

const ROLE_LABELS: Record<Role, string> = {
  USER: "User",
  BUSINESS_OWNER: "Business owner",
  ADMIN: "Admin",
};

const ROLE_STYLE: Record<Role, string> = {
  USER: "bg-[#F4F4F0] text-[#52525B]",
  BUSINESS_OWNER: "bg-sky-50 text-sky-700",
  ADMIN: "bg-violet-50 text-violet-700",
};

const AdminUsersPage: NextPageWithLayout<AdminUsersProps> = ({ activeUsers, archivedUsers, currentUserId }) => {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const filtered = activeUsers.filter(
    (u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const patch = async (id: string, body: object) => {
    setProcessing(id);
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setProcessing(null);
    router.replace(router.asPath);
  };

  // const changeRole = (id: string, role: Role) => patch(id, { action: "role", role });
  const archive = (id: string) => { if (confirm("Archive this user? They will not be able to sign in.")) patch(id, { action: "archive" }); };
  const restore = (id: string) => patch(id, { action: "restore" });

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-['Fraunces'] text-3xl font-bold text-[#18181B] tracking-tight">Users</h1>
        <span className="text-sm text-[#A1A1AA]">{activeUsers.length} active{archivedUsers.length > 0 ? ` · ${archivedUsers.length} archived` : ""}</span>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E4E4DC] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E8572A] focus:border-transparent"
        />
      </div>

      {/* Active users table */}
      <div className="bg-white rounded-2xl border border-[#E4E4DC] overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-[#F4F4F0] bg-[#FAFAF7]">
          <p className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">User</p>
          <p className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Joined</p>
          <p className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Role</p>
          <p className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Actions</p>
        </div>
        {filtered.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-[#A1A1AA]">No users found.</p>
        ) : (
          <div className="divide-y divide-[#F4F4F0]">
            {filtered.map((u) => (
              <div key={u.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-6 py-3.5">
                {/* User info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#E8572A] flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">{getInitials(u.name ?? u.email)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-[#18181B] truncate">{u.name ?? "—"}</p>
                      {u.id === currentUserId && (
                        <span className="text-[10px] font-bold text-[#E8572A]">(you)</span>
                      )}
                    </div>
                    <p className="text-xs text-[#A1A1AA] truncate">{u.email}</p>
                  </div>
                </div>

                {/* Joined */}
                <p className="text-xs text-[#A1A1AA] whitespace-nowrap">{formatDate(u.createdAt)}</p>

                {/* Role badge (read-only — role changing disabled for now) */}
                <div>
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
                    u.id === currentUserId ? "bg-violet-50 text-violet-700" : ROLE_STYLE[u.role]
                  )}>
                    {u.id === currentUserId && <ShieldCheck className="h-3.5 w-3.5" />}
                    {ROLE_LABELS[u.role]}
                  </div>
                  {/* <select
                    value={u.role}
                    disabled={processing === u.id}
                    onChange={(e) => changeRole(u.id, e.target.value as Role)}
                    className={cn(
                      "text-xs font-semibold px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E8572A] disabled:opacity-50",
                      ROLE_STYLE[u.role]
                    )}
                  >
                    {Object.values(Role).map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select> */}
                </div>

                {/* Archive */}
                <div>
                  {u.id !== currentUserId && (
                    <button
                      onClick={() => archive(u.id)}
                      disabled={processing === u.id}
                      title="Archive user"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A1A1AA] hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archived users */}
      {archivedUsers.length > 0 && (
        <div className="border border-dashed border-[#E4E4DC] rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-[#71717A] hover:text-[#18181B] hover:bg-[#FAFAF7] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archived users ({archivedUsers.length})
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", showArchived && "rotate-180")} />
          </button>

          {showArchived && (
            <div className="divide-y divide-[#F4F4F0] border-t border-[#E4E4DC]">
              {archivedUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-4 px-6 py-3.5 bg-[#FAFAF7] opacity-70">
                  <div className="w-9 h-9 rounded-full bg-[#D4D4C8] flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">{getInitials(u.name ?? u.email)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#52525B] truncate">{u.name ?? "—"}</p>
                    <p className="text-xs text-[#A1A1AA] truncate">{u.email} · archived {formatDate(u.deletedAt!)}</p>
                  </div>
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-lg", ROLE_STYLE[u.role])}>
                    {ROLE_LABELS[u.role]}
                  </span>
                  <button
                    onClick={() => restore(u.id)}
                    disabled={processing === u.id}
                    title="Restore user"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A1A1AA] hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

AdminUsersPage.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout title="Users">{page}</AdminLayout>;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session || session.user.role !== "ADMIN") return { redirect: { destination: "/", permanent: false } };

  const [activeUsers, archivedUsers] = await Promise.all([
    db.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true, emailVerified: true, deletedAt: true },
    }),
    db.user.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true, emailVerified: true, deletedAt: true },
    }),
  ]);

  return {
    props: {
      activeUsers: JSON.parse(JSON.stringify(activeUsers)),
      archivedUsers: JSON.parse(JSON.stringify(archivedUsers)),
      currentUserId: session.user.id,
    },
  };
};

export default AdminUsersPage;
