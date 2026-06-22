"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import {
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Star,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const signupSchema = z
  .object({
    name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    company: z.string().optional(),
    trafficSource: z.string().min(1, "Please select your primary traffic source"),
    mediaProperties: z.string().max(1000).optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type SignupValues = z.infer<typeof signupSchema>

const trafficSources = [
  { value: "social_media", label: "Social Media (Instagram, TikTok, X)" },
  { value: "paid_ads", label: "Paid Ads (Meta, Google, LinkedIn)" },
  { value: "seo_content", label: "SEO / Content / Blog" },
  { value: "youtube", label: "YouTube / Video" },
  { value: "email", label: "Email Marketing" },
  { value: "podcast", label: "Podcast / Audio" },
  { value: "influencer", label: "Influencer / Creator" },
  { value: "other", label: "Other" },
]

const perks = [
  "Access 150+ vetted brand offers",
  "Real-time click & conversion tracking",
  "Transparent 3-stage earnings breakdown",
  "Reliable monthly payouts",
  "Dedicated partner support",
]

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      trafficSource: "",
      mediaProperties: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: SignupValues) {
    setIsLoading(true)
    setServerError(null)

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        password: values.password,
        company: values.company || undefined,
        trafficSource: values.trafficSource,
        mediaProperties: values.mediaProperties || undefined,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setIsLoading(false)
      setServerError(data.error || "Something went wrong. Please try again.")
      return
    }

    // Auto sign-in after successful signup
    await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    router.push("/awaiting-approval")
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute bottom-0 -left-20 w-72 h-72 bg-white/5 rounded-full" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">ArcadeTrack Partners</span>
        </div>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1 text-xs font-medium">
              <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
              Join 500+ active partners
            </div>
            <h1 className="text-4xl font-bold leading-tight">
              Start earning with
              <br />
              <span className="text-indigo-200">top-tier brands</span>
            </h1>
            <p className="text-indigo-100 text-base leading-relaxed max-w-sm">
              Apply in minutes. Once approved, you&apos;ll get your unique tracking
              links and start earning commissions immediately.
            </p>
          </div>

          <div className="space-y-3">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span className="text-sm text-indigo-100">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative pt-8 border-t border-white/20">
          <p className="text-indigo-200 text-sm italic">
            &ldquo;ArcadeTrack made it effortless to start earning. The dashboard is
            exactly what I needed to scale my campaigns.&rdquo;
          </p>
          <p className="text-white text-sm font-semibold mt-2">
            — Alex M., Content creator
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">ArcadeTrack Partners</span>
        </div>

        <div className="w-full max-w-lg space-y-7 animate-fade-in py-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">Apply to join</h2>
            <p className="text-gray-500 text-sm">
              Complete your application below — we review within 24 hours.
            </p>
          </div>

          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Personal info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Full name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Smith" className="h-10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">
                        Company{" "}
                        <span className="text-gray-400 font-normal">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Your company" className="h-10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        className="h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trafficSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      Primary traffic source
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="How do you drive traffic?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {trafficSources.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mediaProperties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      Where do you promote?{" "}
                      <span className="text-gray-400 font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. Instagram @handle (150k followers), finance blog at example.com, YouTube channel — Tech Reviews (80k subs)…"
                        className="h-24 text-sm resize-none"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-400 mt-1">
                      Tell us about your audience and platforms so we can match you with the best brands.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Min. 8 characters"
                            className="h-10 pr-10"
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
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Confirm password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirm ? "text" : "password"}
                            placeholder="Repeat password"
                            className="h-10 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirm ? (
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
              </div>

              <p className="text-xs text-gray-400">
                By applying you agree to our{" "}
                <span className="text-indigo-600 cursor-pointer hover:underline">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-indigo-600 cursor-pointer hover:underline">
                  Privacy Policy
                </span>
                .
              </p>

              <Button
                type="submit"
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting application…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Submit application
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-600 font-medium hover:text-indigo-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
