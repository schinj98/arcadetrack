import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const pendingCount = await prisma.user.count({
    where: { role: "AFFILIATE", status: "PENDING" },
  })

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AdminSidebar
        pendingCount={pendingCount}
        userName={session.user.name ?? "Admin"}
        userEmail={session.user.email ?? ""}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
