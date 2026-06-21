import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Clock, CheckCircle, Mail, ArrowRight, TrendingUp } from "lucide-react"
import Link from "next/link"
import { SignOutButton } from "@/components/shared/sign-out-button"

const steps = [
  {
    id: 1,
    label: "Application submitted",
    desc: "We received your application",
    done: true,
  },
  {
    id: 2,
    label: "Under review",
    desc: "Our team is reviewing your profile",
    active: true,
  },
  {
    id: 3,
    label: "Approval decision",
    desc: "You'll be notified by email",
    done: false,
  },
  {
    id: 4,
    label: "Start earning",
    desc: "Access your dashboard and links",
    done: false,
  },
]

export default async function AwaitingApprovalPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")
  if (session.user.status === "APPROVED") redirect("/dashboard")
  if (session.user.role === "ADMIN") redirect("/admin")

  const isSuspended = session.user.status === "SUSPENDED"

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">ArcadeTrack Partners</span>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg space-y-10 animate-fade-in">
          {isSuspended ? (
            /* ── Suspended state ─────────────────────────────────────────── */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-2xl">🚫</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Account suspended</h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                Your account has been suspended. If you believe this is an error, please
                contact our team and we&apos;ll look into it right away.
              </p>
              <a
                href="mailto:partners@arcadetrack.com"
                className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium hover:text-indigo-500"
              >
                <Mail className="w-4 h-4" />
                partners@arcadetrack.com
              </a>
            </div>
          ) : (
            /* ── Pending state ───────────────────────────────────────────── */
            <>
              {/* Status badge */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-indigo-50 border-4 border-indigo-100 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Application received
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Hi{session.user.name ? ` ${session.user.name.split(" ")[0]}` : ""},
                    we&apos;ve got your application and are reviewing it now.
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-0">
                {steps.map((step, i) => (
                  <div key={step.id} className="flex gap-4">
                    {/* Icon column */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                          step.done
                            ? "bg-emerald-500 border-emerald-500"
                            : step.active
                              ? "bg-indigo-600 border-indigo-600"
                              : "bg-white border-gray-200"
                        }`}
                      >
                        {step.done ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : step.active ? (
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        ) : (
                          <span className="text-xs font-bold text-gray-300">{step.id}</span>
                        )}
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          className={`w-0.5 h-10 mt-1 ${step.done ? "bg-emerald-200" : "bg-gray-100"}`}
                        />
                      )}
                    </div>

                    {/* Content column */}
                    <div className="pb-8 last:pb-0">
                      <p
                        className={`text-sm font-semibold ${
                          step.done
                            ? "text-emerald-700"
                            : step.active
                              ? "text-indigo-700"
                              : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                    Review time
                  </p>
                  <p className="text-lg font-bold text-indigo-900 mt-1">
                    Within 24 hrs
                  </p>
                  <p className="text-xs text-indigo-600 mt-0.5">Business days</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                    Notification
                  </p>
                  <p className="text-sm font-bold text-emerald-900 mt-1 break-all">
                    {session.user.email}
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">We&apos;ll email you</p>
                </div>
              </div>

              {/* Contact */}
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-500">Have questions about your application?</p>
                <a
                  href="mailto:partners@arcadetrack.com"
                  className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium hover:text-indigo-500 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  partners@arcadetrack.com
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          )}

          {/* Sign out */}
          <div className="text-center">
            <SignOutButton variant="link" />
          </div>
        </div>
      </main>
    </div>
  )
}
