"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface SignOutButtonProps {
  variant?: "default" | "outline" | "ghost" | "link"
}

export function SignOutButton({ variant = "ghost" }: SignOutButtonProps) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={variant === "link" ? "text-gray-400 hover:text-gray-600 text-sm" : ""}
    >
      <LogOut className="w-4 h-4 mr-1.5" />
      Sign out
    </Button>
  )
}
