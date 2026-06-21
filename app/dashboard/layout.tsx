import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AffiliateSidebar } from "@/components/dashboard/affiliate-sidebar"

export const metadata = { title: "ArcadeTrack — Partner Dashboard" }

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "AFFILIATE" || session.user.status !== "APPROVED") {
    redirect("/login")
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AffiliateSidebar
        userName={session.user.name ?? "Partner"}
        userEmail={session.user.email ?? ""}
        subIdCode={session.user.subIdCode ?? ""}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
