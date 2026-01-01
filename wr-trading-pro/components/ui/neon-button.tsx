import * as React from "react"
import { cn } from "@/lib/utils"

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "success" | "danger" | "cyber"
  size?: "default" | "sm" | "lg" | "icon"
  glow?: boolean
  pulse?: boolean
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant = "primary", size = "default", glow = true, pulse = false, ...props }, ref) => {
    const variantClasses = {
      primary: "bg-primary text-white border-primary shadow-[0_0_15px_#FF006E]",
      secondary: "bg-secondary text-background border-secondary shadow-[0_0_15px_#00F5FF]",
      accent: "bg-accent text-white border-accent shadow-[0_0_15px_#9D4EDD]",
      success: "bg-success text-background border-success shadow-[0_0_15px_#39FF14]",
      danger: "bg-danger text-white border-danger shadow-[0_0_15px_#FF073A]",
      cyber: "bg-gradient-to-r from-primary via-accent to-secondary text-white border-transparent",
    }

    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8 text-lg",
      icon: "h-10 w-10",
    }

    const glowClasses = glow ? {
      primary: "hover:shadow-[0_0_25px_#FF006E]",
      secondary: "hover:shadow-[0_0_25px_#00F5FF]",
      accent: "hover:shadow-[0_0_25px_#9D4EDD]",
      success: "hover:shadow-[0_0_25px_#39FF14]",
      danger: "hover:shadow-[0_0_25px_#FF073A]",
      cyber: "hover:shadow-[0_0_25px_#FF006E,0_0_40px_#00F5FF]",
    } : {}

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md",
          "font-orbitron font-bold tracking-wider",
          "border-2 transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
          "disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          glow && glowClasses[variant],
          pulse && "animate-neon-pulse",
          className
        )}
        {...props}
      />
    )
  }
)
NeonButton.displayName = "NeonButton"

export { NeonButton }
