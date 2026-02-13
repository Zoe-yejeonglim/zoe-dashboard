import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-[#992755]/20 bg-[#150B18] px-4 py-3 text-sm text-white shadow-sm transition-all duration-200 placeholder:text-[#75728F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#992755]/50 focus-visible:border-[#992755] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
