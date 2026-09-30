import * as React from "react"
import {
  IconApi,
  IconArrowsSplit,
  IconChevronRight,
  IconFunction,
  IconLock,
  IconMailbox,
  IconTable,
  IconWebhook,
} from "@tabler/icons-react"

import { cn } from "@workspace/ui/lib/utils"

type Node = {
  label: string
  sub: string
  icon: typeof IconApi
  tone: "muted" | "primary"
}

const flow: Node[] = [
  {
    label: "Source webhook",
    sub: "Transloadit · Shopify",
    icon: IconWebhook,
    tone: "muted",
  },
  {
    label: "API Gateway",
    sub: "2 routes · throttled",
    icon: IconApi,
    tone: "primary",
  },
  {
    label: "EventBridge",
    sub: "bus + rules",
    icon: IconArrowsSplit,
    tone: "primary",
  },
  {
    label: "Lambda",
    sub: "reshape payload",
    icon: IconFunction,
    tone: "primary",
  },
  {
    label: "AppSheet API",
    sub: "row upsert / delete",
    icon: IconTable,
    tone: "muted",
  },
]

export function ArchDiagram({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-7",
        className
      )}
    >
      {/* The chain is wider than the content column at every real viewport,
          so it scrolls inside itself rather than truncating every label. */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex flex-col items-stretch gap-3 lg:w-max lg:flex-row lg:items-center">
          {flow.map((node, i) => (
            <React.Fragment key={node.label}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 transition-colors lg:shrink-0",
                  node.tone === "primary"
                    ? "border-primary/30 bg-primary/10"
                    : "border-border/60 bg-muted/30"
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    node.tone === "primary"
                      ? "bg-primary/20 text-primary"
                      : "bg-background/60 text-muted-foreground"
                  )}
                >
                  <node.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium whitespace-nowrap">
                    {node.label}
                  </div>
                  <div className="font-mono text-[11px] whitespace-nowrap text-muted-foreground">
                    {node.sub}
                  </div>
                </div>
              </div>
              {i < flow.length - 1 ? (
                <IconChevronRight className="mx-auto size-4 shrink-0 rotate-90 text-muted-foreground/50 lg:rotate-0" />
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <IconLock className="size-5" />
        </div>
        <div className="text-sm">
          <span className="font-medium">Verifier Lambda</span>
          <span className="text-muted-foreground">
            {" "}
            — sits inside the first hop, checking each signature against the raw
            body before anything reaches the bus. An authorizer can&apos;t: API
            Gateway never gives one the body.
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-destructive/30 bg-destructive/5 p-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
          <IconMailbox className="size-5" />
        </div>
        <div className="text-sm">
          <span className="font-medium">Dead-letter queue (SQS)</span>
          <span className="text-muted-foreground">
            {" "}
            — delete path only, so an AppSheet blip never drops a deletion.
            Alarmed on depth &gt; 0, because an unwatched queue is just slower
            data loss.
          </span>
        </div>
      </div>
    </div>
  )
}
