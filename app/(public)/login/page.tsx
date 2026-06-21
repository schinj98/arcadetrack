"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import {
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
})
type LoginValues = z.infer<typeof loginSchema>

const features = [
  {
    icon: BarChart3,
    title: "Real-time tracking",
    desc: "Every click and conversion tracked live",
  },
  {
    icon: Shield,
    title: "Transparent commissions",
    desc: "See exactly what you earn per conversion",
  },
  {
    icon: Zap,
    title: "Fast payouts",
    desc: "Reliable payment schedule, always on time",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Sanitize: only allow same-origin relative paths to prevent open redirect attacks
  const rawCallback = searchParams.get("callbackUrl") ?? ""
  const callbackUrl =
    rawCallback.startsWith("/") && !rawCallback.startsWith("//") && !rawCallback.startsWith("/\\")
      ? rawCallback
      : "/dashboard"
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginValues) {
    setIsLoading(true)
    setAuthError(null)

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    setIsLoading(false)

    if (result?.error) {
      setAuthError("Invalid email or password. Please try again.")
      return
    }

    // Fetch session to decide where to redirect
    const res = await fetch("/api/auth/session")
    const session = await res.json()

    if (session?.user?.role === "ADMIN") {
      router.push("/admin")
    } else if (session?.user?.status === "APPROVED") {
      router.push(callbackUrl)
    } else {
      router.push("/awaiting-approval")
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute bottom-0 -left-20 w-72 h-72 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 right-8 w-48 h-48 bg-white/5 rounded-full" />
        </div>

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">ArcadeTrack Partners</span>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight">
              Track. Convert.
              <br />
              <span className="text-indigo-200">Earn.</span>
            </h1>
            <p className="text-indigo-100 text-lg leading-relaxed max-w-sm">
              Your all-in-one partner platform for promoting vetted brands and
              maximising your commissions.
            </p>
          </div>

          <div className="space-y-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-indigo-200 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer stats */}
        <div className="relative flex gap-8 pt-8 border-t border-white/20">
          {[
            { label: "Active partners", value: "500+" },
            { label: "Brands available", value: "150+" },
            { label: "On-time payout rate", value: "99.2%" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-indigo-200 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">ArcadeTrack Partners</span>
        </div>

        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 text-sm">
              Sign in to your partner account to continue
            </p>
          </div>

          {authError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {authError}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-gray-700">Password</FormLabel>
                      <span className="text-xs text-indigo-600 hover:text-indigo-500 cursor-pointer">
                        Forgot password?
                      </span>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="h-11 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 tracking-wide">
                New to ArcadeTrack?
              </span>
            </div>
          </div>

          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-md border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            Apply as a partner
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  )
}
