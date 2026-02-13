import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#992755] focus:ring-offset-2 focus:ring-offset-[#0D0710]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#C9909A] text-white shadow-sm shadow-[#C9909A]/20",
        secondary:
          "border-[#992755]/20 bg-[#992755]/10 text-[#C9909A] hover:bg-[#992755]/20",
        destructive:
          "border-transparent bg-gradient-to-r from-[#DC2626] to-[#EF4444] text-white shadow-sm",
        outline: "border-[#992755]/30 text-[#B09FB5] bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
