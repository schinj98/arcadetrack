"use client"

import { useState, useEffect } from "react"
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

interface SyncLog {
  id: string
  runAt: string
  recordsPulled: number
  recordsNew: number
  recordsUpdated: number
  status: "SUCCESS" | "PARTIAL" | "FAILED"
  errorMessage: string | null
  durationMs: number | null
}

export default function SyncPage() {
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const lastSync = logs[0] ?? null

  async function fetchLogs() {
    const res = await fetch("/api/admin/sync")
    if (res.ok) setLogs(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [])

  async function triggerSync() {
    setSyncing(true)
    const res = await fetch("/api/admin/sync", { method: "POST" })
    setSyncing(false)

    if (res.ok) {
      const log: SyncLog = await res.json()
      if (log.status === "SUCCESS") {
        toast.success(`Sync complete — ${log.recordsPulled} records pulled, ${log.recordsNew} new`)
      } else if (log.status === "FAILED") {
        toast.error(`Sync failed: ${log.errorMessage ?? "Unknown error"}`)
      } else {
        toast.warning("Sync partially completed")
      }
      fetchLogs()
    } else {
      toast.error("Sync request failed")
    }
  }

  const hasCredentials =
    typeof window !== "undefined"
      ? true
      : Boolean(process.env.IMPACT_ACCOUNT_SID && process.env.IMPACT_AUTH_TOKEN)

  function StatusIcon({ status }: { status: string }) {
    if (status === "SUCCESS") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    if (status === "PARTIAL") return <AlertCircle className="w-4 h-4 text-amber-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Impact Sync</h1>
        <p className="text-gray-500 text-sm mt-1">
          Sync conversion data from your Impact.com publisher account. Runs automatically every 3 hours.
        </p>
      </div>

      {/* Sync now card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-1">
              <p className="font-semibold text-gray-900">Manual Sync</p>
              <p className="text-sm text-gray-500">
                Pull the latest conversion data from Impact.com right now. Idempotent — safe to run multiple times.
              </p>
              {lastSync && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  Last synced {formatDate(lastSync.runAt)}
                  {lastSync.durationMs && ` · ${(lastSync.durationMs / 1000).toFixed(1)}s`}
                </p>
              )}
            </div>
            <Button
              className="bg-slate-900 hover:bg-slate-800 text-white shrink-0 min-w-[140px]"
              onClick={triggerSync}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync Now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Credentials status */}
      <Card className="border-0 shadow-sm bg-blue-50 border-blue-100">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold">Impact API credentials</p>
              <p className="mt-0.5 text-blue-700">
                Set <code className="font-mono bg-blue-100 px-1 rounded">IMPACT_ACCOUNT_SID</code> and{" "}
                <code className="font-mono bg-blue-100 px-1 rounded">IMPACT_AUTH_TOKEN</code> in your environment variables.
                Found in your Impact dashboard → Settings → API. The sync endpoint uses Basic Auth with these credentials.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last sync status */}
      {lastSync && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Status", value: lastSync.status, custom: true },
            { label: "Records pulled", value: lastSync.recordsPulled.toLocaleString() },
            { label: "New records", value: `+${lastSync.recordsNew}` },
            { label: "Updated", value: lastSync.recordsUpdated.toLocaleString() },
          ].map(({ label, value, custom }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              {custom ? (
                <div className="flex items-center gap-2 mt-1">
                  <StatusIcon status={value} />
                  <span className={`text-sm font-bold ${
                    value === "SUCCESS" ? "text-emerald-700" : value === "PARTIAL" ? "text-amber-700" : "text-red-700"
                  }`}>{value}</span>
                </div>
              ) : (
                <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sync history table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Sync History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Loading history…</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10">
              <RefreshCw className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No syncs yet — run your first sync above.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pulled</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{formatDate(log.runAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon status={log.status} />
                        <span className={`text-xs font-semibold ${
                          log.status === "SUCCESS" ? "text-emerald-700" : log.status === "PARTIAL" ? "text-amber-700" : "text-red-700"
                        }`}>{log.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{log.recordsPulled}</TableCell>
                    <TableCell className="text-sm text-emerald-700 font-medium">+{log.recordsNew}</TableCell>
                    <TableCell className="text-sm text-gray-600">{log.recordsUpdated}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {log.errorMessage ? (
                        <span className="text-xs text-red-600 truncate block" title={log.errorMessage}>
                          {log.errorMessage}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
