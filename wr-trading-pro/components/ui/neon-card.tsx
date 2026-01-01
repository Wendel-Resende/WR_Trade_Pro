import * as React from "react"
import { cn } from "@/lib/utils"

interface NeonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: "primary" | "secondary" | "accent" | "success" | "danger"
  intensity?: "low" | "medium" | "high"
}

const NeonCard = React.forwardRef<HTMLDivElement, NeonCardProps>(
  ({ className, glowColor = "primary", intensity = "medium", ...props }, ref) => {
    const glowClasses = {
      primary: "neon-border-primary",
      secondary: "neon-border-secondary",
      accent: "before:bg-gradient-to-r before:from-accent before:via-purple-500 before:to-accent",
      success: "before:bg-gradient-to-r before:from-success before:via-green-400 before:to-success",
      danger: "before:bg-gradient-to-r before:from-danger before:via-red-400 before:to-danger",
    }

    const intensityClasses = {
      low: "before:opacity-30",
      medium: "before:opacity-50",
      high: "before:opacity-70",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-lg bg-surface p-6 shadow-xl",
          "neon-border",
          glowClasses[glowColor],
          intensityClasses[intensity],
          "before:animate-pulse",
          className
        )}
        {...props}
      />
    )
  }
)
NeonCard.displayName = "NeonCard"

const NeonCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 mb-4", className)}
    {...props}
  />
))
NeonCardHeader.displayName = "NeonCardHeader"

const NeonCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-bold font-orbitron tracking-wider text-neon-primary",
      className
    )}
    {...props}
  />
))
NeonCardTitle.displayName = "NeonCardTitle"

const NeonCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-400", className)}
    {...props}
  />
))
NeonCardDescription.displayName = "NeonCardDescription"

const NeonCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
))
NeonCardContent.displayName = "NeonCardContent"

const NeonCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-6", className)}
    {...props}
  />
))
NeonCardFooter.displayName = "NeonCardFooter"

export {
  NeonCard,
  NeonCardHeader,
  NeonCardFooter,
  NeonCardTitle,
  NeonCardDescription,
  NeonCardContent,
}
