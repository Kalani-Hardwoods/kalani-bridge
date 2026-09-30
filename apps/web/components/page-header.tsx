import * as React from "react"
import Link from "next/link"
import type { Route } from "next"
import type { Icon } from "@tabler/icons-react"
import { IconChevronRight } from "@tabler/icons-react"

import { cn } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/badge"

type Crumb = { title: string; href?: Route }

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: React.ReactNode
  icon?: Icon
  crumbs?: Crumb[]
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: IconEl,
  crumbs,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden border-b border-border/60 pb-8",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-primary/10 blur-3xl"
      />
      {crumbs && crumbs.length > 0 ? (
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 ? (
                <IconChevronRight className="size-3 opacity-50" />
              ) : null}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="transition-colors hover:text-foreground"
                >
                  {crumb.title}
                </Link>
              ) : (
                <span className="text-foreground/80">{crumb.title}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex items-start gap-4">
        {IconEl ? (
          <div className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
            <IconEl className="size-6" />
          </div>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? (
            <Badge
              variant="outline"
              className="mb-3 border-primary/30 bg-primary/5 text-primary"
            >
              {eyebrow}
            </Badge>
          ) : null}
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  )
}
