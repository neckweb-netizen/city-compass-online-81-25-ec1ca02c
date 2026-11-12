import * as React from "react"
import { cn } from "@/lib/utils"

// Visual estável: sem borda neon azul aleatória a cada montagem do componente.
const NeonCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl border border-primary/15 bg-card text-card-foreground shadow-[0_14px_34px_-28px_hsl(var(--primary)/0.35)]",
      className
    )}
    {...props}
  />
))
NeonCard.displayName = "NeonCard"

export { NeonCard }
