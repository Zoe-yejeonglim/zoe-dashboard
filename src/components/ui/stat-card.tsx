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
    <div className="rounded-2xl p-5 border border-[#992755]/20 bg-gradient-to-br from-[#64202F]/20 via-[#992755]/10 to-transparent backdrop-blur-sm hover:shadow-lg hover:shadow-[#992755]/10 transition-all card-hover">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#75728F] uppercase tracking-wider mb-1">{title}</p>
          <p className="text-xl font-semibold text-white">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm mt-1 font-medium",
              trend.isPositive ? "text-[#34D399]" : "text-[#EF4444]"
            )}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center",
          iconClassName || "bg-[#992755]/20"
        )}>
          <Icon className="h-5 w-5 text-[#C9909A]" />
        </div>
      </div>
    </div>
  )
}
