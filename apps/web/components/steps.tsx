import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <ol className="relative ml-3 space-y-8 border-l border-border/60 pl-8">
      {children}
    </ol>
  )
}

type StepProps = {
  n: number
  title: string
  children: React.ReactNode
  className?: string
}

export function Step({ n, title, children, className }: StepProps) {
  return (
    <li className={cn("relative", className)}>
      <span className="absolute -left-[43px] flex size-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-mono text-sm font-semibold text-primary shadow-sm">
        {n}
      </span>
      <h3 className="font-heading text-lg font-semibold tracking-tight">
        {title}
      </h3>
      <div className="mt-3 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </li>
  )
}
