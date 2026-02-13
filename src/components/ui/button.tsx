import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#992755] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0710] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#C9909A] text-white shadow-lg shadow-[#C9909A]/25 hover:bg-[#B87D87] hover:shadow-[#C9909A]/40",
        destructive:
          "bg-gradient-to-r from-[#DC2626] to-[#EF4444] text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40",
        outline:
          "border border-[#992755]/30 bg-transparent text-[#B09FB5] hover:bg-[#992755]/10 hover:text-white hover:border-[#992755]/50",
        secondary:
          "bg-[#150B18] border border-[#992755]/20 text-[#B09FB5] hover:bg-[#992755]/20 hover:text-white",
        ghost: "text-[#B09FB5] hover:bg-[#992755]/10 hover:text-white",
        link: "text-[#C9909A] underline-offset-4 hover:underline hover:text-[#B87D87]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
