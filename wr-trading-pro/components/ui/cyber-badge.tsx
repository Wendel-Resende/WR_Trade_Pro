import * as React from "react"
import { cn } from "@/lib/utils"

interface CyberBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "primary" | "secondary" | "accent" | "success" | "danger" | "warning" | "info"
  size?: "sm" | "md" | "lg"
  glow?: boolean
  pulse?: boolean
}

const CyberBadge = React.forwardRef<HTMLDivElement, CyberBadgeProps>(
  ({ className, variant = "default", size = "md", glow = true, pulse = false, ...props }, ref) => {
    const variantClasses = {
      default: "bg-surface text-gray-300 border-gray-600",
      primary: "bg-primary/20 text-primary border-primary",
      secondary: "bg-secondary/20 text-secondary border-secondary",
      accent: "bg-accent/20 text-accent border-accent",
      success: "bg-success/20 text-success border-success",
      danger: "bg-danger/20 text-danger border-danger",
      warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500",
      info: "bg-cyan-500/20 text-cyan-400 border-cyan-500",
    }

    const sizeClasses = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-3 py-1 text-sm",
      lg: "px-4 py-1.5 text-base",
    }

    const glowClasses = glow ? {
      default: "",
      primary: "shadow-[0_0_8px_#FF006E]",
      secondary: "shadow-[0_0_8px_#00F5FF]",
      accent: "shadow-[0_0_8px_#9D4EDD]",
      success: "shadow-[0_0_8px_#39FF14]",
      danger: "shadow-[0_0_8px_#FF073A]",
      warning: "shadow-[0_0_8px_#FFB800]",
      info: "shadow-[0_0_8px_#00F5FF]",
    } : {}

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          "font-jetbrains font-medium tracking-tight",
          "border transition-all duration-300",
          variantClasses[variant],
          sizeClasses[size],
          glow && glowClasses[variant],
          pulse && "animate-pulse",
          className
        )}
        {...props}
      />
    )
  }
)
CyberBadge.displayName = "CyberBadge"

export { CyberBadge }
