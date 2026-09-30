"use client"

import * as React from "react"
import { IconCheck, IconCopy, IconTerminal2 } from "@tabler/icons-react"

import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"

type CodeBlockProps = {
  code: string
  language?: string
  title?: string
  /** Render as a shell prompt with a $ gutter. */
  shell?: boolean
  className?: string
}

export function CodeBlock({
  code,
  language,
  title,
  shell,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)

  const onCopy = React.useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    })
  }, [code])

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/70 bg-card/60 shadow-sm backdrop-blur",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {shell ? (
            <IconTerminal2 className="size-3.5" />
          ) : (
            <span className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-destructive/70" />
              <span className="size-2.5 rounded-full bg-primary/70" />
              <span className="size-2.5 rounded-full bg-chart-3/70" />
            </span>
          )}
          <span className="font-mono">{title ?? language ?? "text"}</span>
        </div>
        <div className="flex items-center gap-2">
          {language ? (
            <Badge
              variant="outline"
              className="hidden border-border/60 font-mono text-[10px] tracking-wider text-muted-foreground uppercase sm:inline-flex"
            >
              {language}
            </Badge>
          ) : null}
          <Button
            size="icon"
            variant="ghost"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={onCopy}
            aria-label="Copy code"
          >
            {copied ? (
              <IconCheck className="size-3.5 text-primary" />
            ) : (
              <IconCopy className="size-3.5" />
            )}
          </Button>
        </div>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono text-foreground/90">
          {shell
            ? code.split("\n").map((line, i) => (
                <span key={i} className="table-row">
                  <span className="table-cell pr-4 text-muted-foreground/50 select-none">
                    $
                  </span>
                  <span className="table-cell">{line}</span>
                </span>
              ))
            : code}
        </code>
      </pre>
    </div>
  )
}
