"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

interface FaqItem {
  q: string
  a: string
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-gray-100 rounded-xl bg-white shadow-sm overflow-hidden"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full text-left flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900 text-sm">{item.q}</span>
            <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
              {open === i ? (
                <Minus className="w-3.5 h-3.5 text-indigo-600" />
              ) : (
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
              )}
            </span>
          </button>
          {open === i && (
            <div className="px-6 pb-5">
              <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
