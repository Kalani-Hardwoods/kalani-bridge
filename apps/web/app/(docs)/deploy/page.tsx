import Link from "next/link"
import type { Route } from "next"
import {
  IconAlertTriangle,
  IconApi,
  IconArrowRight,
  IconArrowsSplit,
  IconChevronRight,
  IconCloudUpload,
  IconFunction,
  IconInfoCircle,
  IconMailbox,
  IconServer2,
  IconShieldLock,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-header"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item"

export const metadata = { title: "What to build" }

type DeployStep = {
  n: number
  icon: typeof IconShieldLock
  title: string
  href: Route
  desc: string
  tag: string
}

const order: DeployStep[] = [
  {
    n: 1,
    icon: IconShieldLock,
    title: "IAM roles",
    href: "/deploy/iam-roles",
    desc: "Create the four service roles first — every other component references them.",
    tag: "foundation",
  },
  {
    n: 2,
    icon: IconMailbox,
    title: "Dead-letter queue",
    href: "/deploy/dlq",
    desc: "Stand up the SQS DLQ, its queue policy, and its depth alarm together — the queue is worthless without both.",
    tag: "safety net",
  },
  {
    n: 3,
    icon: IconFunction,
    title: "Lambda",
    href: "/deploy/lambda",
    desc: "Deploy the transform function with its two idempotent handlers. Nothing invokes it yet.",
    tag: "logic",
  },
  {
    n: 4,
    icon: IconArrowsSplit,
    title: "EventBridge",
    href: "/deploy/eventbridge",
    desc: "Create the bus, one rule per flow, the catch-all logging rule, and the function's invoke permission.",
    tag: "routing",
  },
  {
    n: 5,
    icon: IconApi,
    title: "API Gateway",
    href: "/deploy/api-gateway",
    desc: "Add the two public routes last — throttled, signature-checked, and wired onto the bus.",
    tag: "front door",
  },
]

export default function DeployIndexPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Deploy the bridge"
        icon={IconServer2}
        crumbs={[
          { title: "Runbook", href: "/overview" },
          { title: "What to build" },
        ]}
        title="Everything to build, in order"
        description="Five AWS components make up the bridge. Build them inside-out — roles and the safety net first, the public front door last — so nothing points at something that doesn't exist yet. All of it lives in us-west-2."
      />

      <Alert className="border-destructive/30 bg-destructive/5">
        <IconAlertTriangle className="size-4 text-destructive" />
        <AlertTitle>Read the gotchas first — it will save you a day</AlertTitle>
        <AlertDescription>
          Three of the five components have a step that looks right, is accepted
          by AWS without complaint, and does not work:{" "}
          <Link
            href="/hardening"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            the gotchas page
          </Link>{" "}
          lists all of them. Skim it before step 1 rather than after step 5.
        </AlertDescription>
      </Alert>

      <Alert className="border-border/60">
        <IconInfoCircle className="size-4" />
        <AlertTitle>The code isn&apos;t here</AlertTitle>
        <AlertDescription>
          These pages describe the AWS setup and configuration. The actual
          Lambda source, IaC templates, and route definitions live in separate,
          locked-down repositories — not in this documentation app.
        </AlertDescription>
      </Alert>

      <section className="space-y-3">
        {order.map((step) => (
          <Item
            key={step.href}
            variant="outline"
            className="border-border/60 transition-colors hover:border-primary/40"
          >
            <ItemMedia>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-semibold text-primary">
                {step.n}
              </div>
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="flex items-center gap-2">
                <step.icon className="size-4 text-muted-foreground" />
                {step.title}
                <Badge
                  variant="secondary"
                  className="font-mono text-[10px] uppercase"
                >
                  {step.tag}
                </Badge>
              </ItemTitle>
              <ItemDescription>{step.desc}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Link
                href={step.href}
                className="flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Open
                <IconChevronRight className="size-4" />
              </Link>
            </ItemActions>
          </Item>
        ))}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/40 p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <IconCloudUpload className="size-6" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-lg font-semibold">
              And then: this site itself
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Once the bridge runs, the last piece is hosting this documentation
              app on AWS and giving it the read-only budget role.
            </p>
          </div>
          <Link
            href="/deploy/hosting"
            className="flex shrink-0 items-center gap-1 self-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Hosting
            <IconArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
