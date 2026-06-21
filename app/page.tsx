import Link from "next/link"
import {
  TrendingUp,
  CheckCircle2,
  Zap,
  Shield,
  BarChart2,
  DollarSign,
  Users,
  Globe,
  ArrowRight,
  Star,
  Link2,
  Clock,
} from "lucide-react"
import { FaqAccordion } from "@/components/landing/faq-accordion"

export const metadata = {
  title: "ArcadeTrack Partners — Turn Your Audience Into Affiliate Income",
  description:
    "Join ArcadeTrack Partners and earn commissions from 150+ top brands. Real-time tracking, transparent commission splits, monthly payouts.",
}

const stats = [
  { value: "500+", label: "Active Partners" },
  { value: "150+", label: "Brand Offers" },
  { value: "99.2%", label: "On-Time Payouts" },
  { value: "24hr", label: "Approval Turnaround" },
]

const steps = [
  {
    step: "01",
    title: "Apply in 5 Minutes",
    desc: "Fill out your profile, tell us about your audience and traffic source. No minimum follower counts.",
    icon: Users,
  },
  {
    step: "02",
    title: "Approved in 24 Hours",
    desc: "We review every application within one business day and assign your unique SubID tracking code.",
    icon: CheckCircle2,
  },
  {
    step: "03",
    title: "Get Your Tracking Links",
    desc: "Copy a personalized tracking link for any active offer. Your SubID is pre-embedded — nothing to configure.",
    icon: Link2,
  },
  {
    step: "04",
    title: "Earn & Get Paid Monthly",
    desc: "Watch every click and conversion in your dashboard. Cleared earnings hit your account every month.",
    icon: DollarSign,
  },
]

const features = [
  {
    icon: BarChart2,
    title: "Real-Time Conversion Dashboard",
    desc: "Every conversion tracked the moment it fires. See Pending, Locked, and Cleared earnings side by side — no spreadsheets, no guessing.",
  },
  {
    icon: Shield,
    title: "Transparent Commission Splits",
    desc: "Each offer shows your exact payout per conversion before you promote it. The math is always visible — no hidden deductions.",
  },
  {
    icon: Zap,
    title: "One-Click Tracking Links",
    desc: "Your unique SubID is embedded in every link automatically. Copy, share, and start earning without any technical setup.",
  },
  {
    icon: DollarSign,
    title: "Monthly Payouts, Full History",
    desc: "Cleared earnings are paid monthly. Every payment is logged with period, amount, and date — full audit trail always available.",
  },
  {
    icon: Globe,
    title: "150+ Offers Across Every Vertical",
    desc: "Finance, eCommerce, SaaS, Travel, Health & Wellness, Gaming — curated offers from brands that convert.",
  },
  {
    icon: Clock,
    title: "4-Stage Conversion Tracking",
    desc: "Pending → Locked → Cleared → Paid. You always know exactly where each conversion stands and when you'll see the money.",
  },
]

const faqs = [
  {
    q: "How long does the approval process take?",
    a: "We review all applications within 24 business hours. Once approved, your unique SubID tracking code is assigned immediately and your dashboard goes live. You'll receive an email with next steps.",
  },
  {
    q: "How are my commissions calculated?",
    a: "Each offer shows two numbers: the gross payout (what the brand pays us) and your split percentage (your share). Your earnings = gross payout × split %. Both numbers are always visible before you decide to promote an offer.",
  },
  {
    q: "When and how do I get paid?",
    a: "Payouts are processed monthly for all cleared earnings minus any amounts already paid. We support PayPal, bank transfer, and other methods — coordinate this with your account manager after approval. Full payment history is always visible in your dashboard.",
  },
  {
    q: "What's the difference between Pending, Locked, and Cleared?",
    a: "Pending = the conversion was recorded but Impact hasn't validated it yet. Locked = validated and confirmed, but within the advertiser's return window (typically 30 days). Cleared = fully confirmed and included in your next payout. Reversed = cancelled due to a refund or fraud detection.",
  },
  {
    q: "Can I promote multiple offers at the same time?",
    a: "Yes — you get a unique tracking link for every active offer in our network. Promote as many as you like, each tracked separately with its own conversion count and earnings.",
  },
  {
    q: "What traffic sources do you accept?",
    a: "Social media, paid ads (Meta, Google, TikTok), SEO/content sites, YouTube channels, email lists, podcasts, and influencer audiences. We evaluate traffic quality over volume — an engaged niche audience often outperforms a large passive one.",
  },
]

const testimonials = [
  {
    name: "Jordan M.",
    role: "Paid Ads Specialist",
    text: "I was running direct campaigns for brands and losing margin on every deal. ArcadeTrack gives me a clean dashboard, transparent splits, and consistent monthly payouts. Best network I've worked with.",
    rating: 5,
  },
  {
    name: "Priya S.",
    role: "Finance Content Creator",
    text: "The conversion tracking is incredibly transparent — I can see exactly what's pending vs. cleared. The split percentages are shown upfront, no surprises ever.",
    rating: 5,
  },
  {
    name: "Marcus T.",
    role: "YouTube Creator, 280k subs",
    text: "Approved within hours, had my first conversion the same day. The copy-link feature is stupidly simple and the 24-hour support team actually responds.",
    rating: 5,
  },
]

const verticals = [
  "Finance & Fintech",
  "eCommerce & Retail",
  "SaaS & Software",
  "Health & Wellness",
  "Travel & Hospitality",
  "Fashion & Lifestyle",
  "Gaming & Entertainment",
  "Education & Courses",
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">ArcadeTrack</span>
            <span className="text-xs text-gray-400 font-medium hidden sm:inline">Partners</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-16 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-600 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-indigo-200 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Now accepting applications — 24hr approval
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Turn Your Audience Into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-300">
              Affiliate Income
            </span>
          </h1>
          <p className="text-lg text-indigo-200 max-w-2xl mx-auto mb-8 leading-relaxed">
            Join ArcadeTrack Partners and earn commissions from 150+ top brands. Real-time conversion
            tracking, transparent commission splits, and monthly payouts — no guesswork, ever.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Apply to Join — Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 text-white hover:bg-white/10 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Partner Login
            </Link>
          </div>
          <p className="text-xs text-indigo-400 mt-4">
            Free to join · No approval fees · Cancel any time
          </p>
        </div>

        {/* Dashboard preview mockup */}
        <div className="relative max-w-5xl mx-auto px-6 -mb-16">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <div className="flex-1 mx-4 bg-gray-200 rounded h-4 text-xs flex items-center px-2 text-gray-400">
                arcadetrack.com/dashboard
              </div>
            </div>
            <div className="p-6 grid grid-cols-4 gap-4">
              {[
                { label: "Pending Earnings", value: "$842.50", color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Locked Earnings", value: "$2,140.00", color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Cleared Earnings", value: "$5,980.25", color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "All-Time Conversions", value: "347", color: "text-indigo-600", bg: "bg-indigo-50" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <div className="h-24 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl flex items-center justify-center">
                <div className="flex items-end gap-1.5 h-16 px-4">
                  {[30, 55, 40, 70, 50, 85, 65, 90, 75, 100, 80, 95].map((h, i) => (
                    <div
                      key={i}
                      className="w-4 bg-indigo-400 rounded-t opacity-70"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats bar ─── */}
      <section className="pt-24 pb-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-extrabold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-20 bg-white" id="how-it-works">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              Simple by design
            </p>
            <h2 className="text-3xl font-extrabold text-gray-900">From signup to first paycheck in 4 steps</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="relative">
                <div className="bg-gray-50 rounded-2xl p-6 h-full">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-indigo-400 mb-1">{step}</p>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Verticals / Offers ─── */}
      <section className="py-16 bg-indigo-600">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-2">150+ offers across 8 verticals</h2>
          <p className="text-indigo-200 text-sm mb-8">
            Promote brands your audience already trusts — in the categories that convert best for your traffic.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {verticals.map((v) => (
              <span
                key={v}
                className="bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-full border border-white/20"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-20 bg-white" id="features">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              Built for serious partners
            </p>
            <h2 className="text-3xl font-extrabold text-gray-900">Everything you need to scale your affiliate income</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              Partner stories
            </p>
            <h2 className="text-3xl font-extrabold text-gray-900">What our partners say</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text, rating }) => (
              <div key={name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">&ldquo;{text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{name}</p>
                  <p className="text-xs text-gray-400">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 bg-white" id="faq">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              Common questions
            </p>
            <h2 className="text-3xl font-extrabold text-gray-900">FAQ</h2>
          </div>
          <FaqAccordion items={faqs} />
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-violet-700">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Ready to start earning?
          </h2>
          <p className="text-indigo-200 mb-8 text-sm">
            Join 500+ partners already earning commissions from top brands. Free to apply — approved in 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors text-sm"
            >
              Apply Now — It&apos;s Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center border border-white/30 text-white hover:bg-white/10 font-medium px-8 py-3.5 rounded-xl transition-colors text-sm"
            >
              Already a partner? Log in
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8">
            {[
              "Free to join",
              "24hr approval",
              "Monthly payouts",
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-indigo-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-sm">ArcadeTrack Partners</span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <Link href="/login" className="hover:text-white transition-colors">
              Partner Login
            </Link>
            <Link href="/signup" className="hover:text-white transition-colors">
              Apply
            </Link>
            <span className="text-slate-600">
              © {new Date().getFullYear()} ArcadeTrack. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
