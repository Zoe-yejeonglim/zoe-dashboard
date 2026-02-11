import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  iconClassName?: string
}

export function StatCard({ title, value, icon: Icon, trend, iconClassName }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-xl font-semibold text-slate-700">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm mt-1 font-medium",
              trend.isPositive ? "text-emerald-500" : "text-red-500"
            )}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center",
          iconClassName || "bg-slate-100"
        )}>
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
      </div>
    </div>
  )
}
