import Link from "next/link"
import type { Route } from "next"
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBug,
  IconCoin,
  IconRepeat,
  IconShieldLock,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-header"
import { LinkButton } from "@/components/link-button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"

export const metadata = { title: "Gotchas" }

type Severity = "breaks" | "silent" | "cost"

type Gotcha = {
  id: string
  title: string
  severity: Severity
  where: string
  href: Route
  trap: string
  fix: string
}

const gotchas: Gotcha[] = [
  {
    id: "authorizer",
    title: "A Lambda authorizer can't verify the Shopify HMAC",
    severity: "breaks",
    where: "API Gateway",
    href: "/deploy/api-gateway",
    trap: "API Gateway does not pass the request body to a Lambda authorizer, on HTTP APIs or REST APIs. The Shopify signature is computed over the raw body, so an authorizer has nothing to verify against. The obvious design simply cannot be built.",
    fix: "The delete route points at a real Lambda proxy integration that receives the body, verifies there, and calls PutEvents itself. That function does nothing else, so it always answers inside Shopify's 5-second window.",
  },
  {
    id: "dlq-policy",
    title: "The DLQ needs a queue policy, not a role",
    severity: "silent",
    where: "SQS",
    href: "/deploy/dlq",
    trap: "EventBridge does not use the target's IAM role to write to a dead-letter queue — it needs a resource-based policy on the queue. Grant sqs:SendMessage on the role only, and delivery is denied: the exhausted delete is dropped, and the safety net you built to prevent silent loss becomes the thing losing it silently.",
    fix: "Attach a queue policy allowing events.amazonaws.com to sqs:SendMessage, conditioned on the delete rule's ARN. Verify it by deliberately breaking the Lambda once and watching a message land.",
  },
  {
    id: "lambda-permission",
    title: "EventBridge → Lambda is a resource policy, not a target role",
    severity: "breaks",
    where: "EventBridge",
    href: "/deploy/eventbridge",
    trap: "Setting RoleArn on a Lambda target does nothing — EventBridge invokes functions through a resource-based policy on the function. The console adds it silently when you pick the target, so this only bites when the same setup is rebuilt from CLI or IaC, and then every invocation fails with AccessDenied.",
    fix: "Run lambda add-permission for each rule, with --principal events.amazonaws.com and a --source-arn scoped to that rule.",
  },
  {
    id: "unmatched",
    title: "Events matching no rule disappear without a trace",
    severity: "silent",
    where: "EventBridge",
    href: "/deploy/eventbridge",
    trap: "A bus does not error on an unroutable event. One typo in a detail-type — board.created versus boards.created — and every affected webhook is accepted with a 200, then discarded. No metric moves, no queue fills, no alarm fires.",
    fix: "A catch-all rule matching the whole source, targeting a CloudWatch log group, so every event that touches the bus leaves evidence. Compare its count against the per-rule invocation counts.",
  },
  {
    id: "retry-budget",
    title: "A short max event age silently caps the retry budget",
    severity: "silent",
    where: "EventBridge",
    href: "/deploy/eventbridge",
    trap: "Retries stop at whichever limit is hit first. Six attempts with exponential backoff are exhausted in minutes, so a routine AppSheet maintenance window pushes real deletions into the DLQ and turns an automated recovery into a manual one.",
    fix: "On the delete path, use the service maximums — 185 attempts across 24 hours. The DLQ is then for genuine failures, not for ordinary downtime.",
  },
  {
    id: "no-redrive",
    title: "The DLQ can't be redriven from the console",
    severity: "breaks",
    where: "SQS",
    href: "/deploy/dlq",
    trap: "SQS redrive returns messages to the source queue they came from. These did not come from a queue — EventBridge wrote them directly — so there is no source and the button won't help you at the exact moment you need it.",
    fix: "A small, documented replay script: receive, PutEvents back onto the bus, delete only after the put succeeds. Read the ERROR_MESSAGE attribute first — replaying a malformed payload unchanged just refills the queue.",
  },
  {
    id: "delete-key",
    title: "AppSheet deletes match on the key column",
    severity: "silent",
    where: "Lambda",
    href: "/deploy/lambda",
    trap: "Passing a Shopify product ID to a Delete action deletes nothing at all if the table's key is Board ID — and reports no error while doing it. The cascade never runs and the orphaned rows this whole design exists to prevent accumulate anyway.",
    fix: "Look the board up by Shopify ID first, then delete by key. Treat 'row not found' as success so duplicate deliveries don't fail.",
  },
  {
    id: "appsheet-200",
    title: "AppSheet returns 200 on rows that failed",
    severity: "silent",
    where: "Lambda",
    href: "/deploy/lambda",
    trap: "The API answers with a 200 status and reports per-row failures in the response body. Code that checks only res.ok reports a clean run on every failure it will ever have — and EventBridge, seeing a successful invocation, never retries and never dead-letters.",
    fix: "Parse the body and throw on reported row failures, so a failure is a failure everywhere downstream.",
  },
  {
    id: "at-least-once",
    title: "Every event can arrive twice, and out of order",
    severity: "silent",
    where: "Whole path",
    href: "/deploy/lambda",
    trap: "EventBridge delivers at least once and guarantees no ordering; Shopify re-sends anything it thinks failed; every DLQ replay is a second delivery on purpose. A delete retried after a later create can undo work that should have stood.",
    fix: "Handlers are idempotent. Create is naturally so. Delete treats an absent row as success, and carries the Shopify delivery ID so duplicates are recognisable in the logs.",
  },
  {
    id: "open-create",
    title: "The create route was unauthenticated",
    severity: "breaks",
    where: "API Gateway",
    href: "/deploy/api-gateway",
    trap: "An open ingest route lets anyone who learns the URL write arbitrary photo URLs onto a board and flip Ready — which the existing bot then pushes live to Shopify. The delete path got all the security attention because deletes feel dangerous, but this one publishes to a storefront.",
    fix: "Verify Transloadit's signed notification, or front the route with the same verifier Lambda using a shared secret. A URL is not a credential.",
  },
  {
    id: "transloadit-body",
    title: "Transloadit may not post raw JSON",
    severity: "breaks",
    where: "API Gateway",
    href: "/deploy/api-gateway",
    trap: "The direct EventBridge integration maps $request.body into Detail, which must be a JSON object. Transloadit sends assembly notifications form-encoded, with the JSON inside a transloadit field — in which case the integration fails on every single call.",
    fix: "Send one real notification and read it before committing to the direct integration. If it is form-encoded, route create through the verifier Lambda and parse there.",
  },
  {
    id: "payload-size",
    title: "A PutEvents entry caps at 256 KB",
    severity: "breaks",
    where: "API Gateway",
    href: "/deploy/api-gateway",
    trap: "Assembly payloads carry a result object per file. A board shot from enough angles produces an event too large for the bus, and it fails at ingest — on exactly the busiest listings.",
    fix: "Trim the payload to the fields the transform actually reads before putting it on the bus.",
  },
  {
    id: "trust-scope",
    title: "Bare service principals trust more than you think",
    severity: "silent",
    where: "IAM",
    href: "/deploy/iam-roles",
    trap: "A trust policy naming events.amazonaws.com with no conditions trusts the service acting for anyone, not just for you — the classic confused-deputy shape.",
    fix: "Every trust policy carries aws:SourceAccount, and aws:SourceArn where the service supplies it.",
  },
  {
    id: "concurrency",
    title: "An unbounded function is an unbounded bill",
    severity: "cost",
    where: "Lambda",
    href: "/deploy/lambda",
    trap: "With no reserved concurrency and no route throttle, a retry storm or a hostile caller can scale the bridge out until it trips AppSheet's rate limit — filling the DLQ — and runs up spend on a project whose whole premise is a small, predictable bill.",
    fix: "Reserved concurrency of 5 on the function, a stage throttle in single-digit RPS at the gateway, and the budget alarm already documented under AWS foundation.",
  },
  {
    id: "log-retention",
    title: "Auto-created log groups never expire",
    severity: "cost",
    where: "CloudWatch",
    href: "/deploy/lambda",
    trap: "A log group Lambda creates for itself keeps every line forever, and webhook logs are chatty. It is a slow leak that never shows up as an incident, only as a line item.",
    fix: "Create the log group ahead of time with 30-day retention and leave logs:CreateLogGroup out of the execution role.",
  },
]

const severityLabel: Record<Severity, string> = {
  breaks: "breaks outright",
  silent: "fails silently",
  cost: "costs money",
}

const severityClass: Record<Severity, string> = {
  breaks: "bg-destructive/15 text-destructive hover:bg-destructive/15",
  silent: "bg-chart-3/20 text-chart-3 hover:bg-chart-3/20",
  cost: "bg-primary/15 text-primary hover:bg-primary/15",
}

const counts = {
  breaks: gotchas.filter((g) => g.severity === "breaks").length,
  silent: gotchas.filter((g) => g.severity === "silent").length,
  cost: gotchas.filter((g) => g.severity === "cost").length,
}

export default function HardeningPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Make it survive"
        icon={IconAlertTriangle}
        crumbs={[{ title: "Runbook", href: "/overview" }, { title: "Gotchas" }]}
        title="The traps in this design"
        description="Every item here is a way the bridge as first sketched would have failed in production. Each is already fixed on its own page — this page exists so the reasoning survives the next person who edits one of them, and so nobody re-introduces a trap while tidying up."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        {(
          [
            {
              k: "Breaks outright",
              v: counts.breaks,
              d: "wouldn't work at all",
              tone: "destructive" as const,
            },
            {
              k: "Fails silently",
              v: counts.silent,
              d: "worst kind — looks healthy",
              tone: "chart" as const,
            },
            {
              k: "Costs money",
              v: counts.cost,
              d: "slow leaks, no incident",
              tone: "primary" as const,
            },
          ] as const
        ).map((s) => (
          <div
            key={s.k}
            className="rounded-2xl border border-border/60 bg-card/50 p-5"
          >
            <div className="text-xs text-muted-foreground">{s.k}</div>
            <div
              className={
                s.tone === "destructive"
                  ? "font-heading text-3xl text-destructive"
                  : s.tone === "chart"
                    ? "font-heading text-3xl text-chart-3"
                    : "font-heading text-3xl text-primary"
              }
            >
              {s.v}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{s.d}</div>
          </div>
        ))}
      </section>

      <Alert className="border-destructive/30 bg-destructive/5">
        <IconBug className="size-4 text-destructive" />
        <AlertTitle>The silent ones are the dangerous ones</AlertTitle>
        <AlertDescription>
          A design that breaks outright gets fixed on the first test. The
          failures worth fearing on this path are the ones that return 200 — an
          unroutable event, a delete that matched no key, an AppSheet response
          that reports failure inside a successful HTTP call. Every one of those
          looks like a working bridge right up until someone notices the
          orphaned rows.
        </AlertDescription>
      </Alert>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">
          Every trap, and what closed it
        </h2>
        <Accordion multiple className="w-full">
          {gotchas.map((g) => (
            <AccordionItem key={g.id} value={g.id}>
              <AccordionTrigger>
                <span className="flex flex-1 flex-wrap items-center gap-2 pr-2 text-left">
                  <Badge className={severityClass[g.severity]}>
                    {severityLabel[g.severity]}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-border/60 font-mono text-[10px] text-muted-foreground"
                  >
                    {g.where}
                  </Badge>
                  <span className="font-medium">{g.title}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-xs font-medium tracking-wide text-destructive uppercase">
                      The trap
                    </div>
                    <p>{g.trap}</p>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium tracking-wide text-primary uppercase">
                      What we do instead
                    </div>
                    <p>{g.fix}</p>
                  </div>
                  <Link
                    href={g.href}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Open the {g.where} page
                    <IconArrowRight className="size-4" />
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">
          Three habits that prevent the next one
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: IconShieldLock,
              title: "Verify at the edge, act behind the bus",
              body: "The function that checks signatures never holds the AppSheet key, and the function that holds the key is never reachable from the internet. Neither one can be turned into the other by a bug.",
            },
            {
              icon: IconRepeat,
              title: "Treat every delivery as a repeat",
              body: "At-least-once is not an edge case, it is the normal case: retries, Shopify re-sends, and DLQ replays are all duplicates by design. A handler that is only correct once is not correct.",
            },
            {
              icon: IconCoin,
              title: "Put a ceiling on anything public",
              body: "Route throttles, reserved concurrency, log retention. None of them matter on a good day, and all of them matter on the one day something loops.",
            },
          ].map((h) => (
            <div
              key={h.title}
              className="rounded-2xl border border-border/60 bg-card/40 p-5"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <h.icon className="size-5" />
              </div>
              <h3 className="mt-3 font-heading text-base font-semibold">
                {h.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-6">
        <p className="text-sm text-muted-foreground">
          The traps are closed. Now make sure you&apos;d hear about the next
          one.
        </p>
        <LinkButton href="/monitoring">
          Next: Monitoring
          <IconArrowRight className="size-4" />
        </LinkButton>
      </div>
    </div>
  )
}
