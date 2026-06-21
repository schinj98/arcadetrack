import { redirect } from "next/navigation"

// Temporary: redirect root to login until the full landing page is built (Step 5)
export default function HomePage() {
  redirect("/login")
}
