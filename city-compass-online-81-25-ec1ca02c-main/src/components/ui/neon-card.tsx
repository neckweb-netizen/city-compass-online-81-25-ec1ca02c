
import * as React from "react"
import { cn } from "@/lib/utils"

const NeonCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  // Seleção aleatória entre azul puro e misto (mais chance de azul)
  const neonEffects = ['neon-border-blue', 'neon-border-blue', 'neon-border-mixed'];
  const randomNeonEffect = React.useMemo(() => {
    return neonEffects[Math.floor(Math.random() * neonEffects.length)];
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg bg-card text-card-foreground shadow-sm",
        randomNeonEffect,
        className
      )}
      {...props}
    />
  )
})
NeonCard.displayName = "NeonCard"

export { NeonCard }
