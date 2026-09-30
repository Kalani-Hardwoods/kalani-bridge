import {
  IconArrowRight,
  IconArrowsExchange,
  IconEye,
  IconFilter,
  IconFunction,
  IconInbox,
  IconRefresh,
  IconSend,
  IconWebhook,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-header"
import { LinkButton } from "@/components/link-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@workspace/ui/components/hover-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Badge } from "@workspace/ui/components/badge"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"

export const metadata = { title: "Leaving WebhookRelay" }

const features = [
  {
    icon: IconInbox,
    title: "Inputs (public endpoints)",
    short: "Stable public URLs that third parties post to.",
    detail:
      "Each Input is a unique URL like https://xyz.hooks.webhookrelay.com that Shopify or Transloadit points at. Every event is saved to durable storage the moment it arrives.",
    aws: "API Gateway route",
  },
  {
    icon: IconSend,
    title: "Outputs (destinations)",
    short: "Where events get delivered, with retries.",
    detail:
      "Outputs define the destination — a public API or a localhost dev box — with override headers, timeouts, filtering, and long-period durable retries.",
    aws: "EventBridge target → Lambda",
  },
  {
    icon: IconFunction,
    title: "Functions (transformations)",
    short: "JS/Lua snippets that reshape payloads in transit.",
    detail:
      "The core of our usage: transform payloads, modify headers, drop unwanted requests, and call external APIs — exactly the reshaping that gets a webhook into the AppSheet API shape.",
    aws: "Lambda handler",
  },
  {
    icon: IconFilter,
    title: "Routing rules",
    short: "Multi-level filters that pick a destination.",
    detail:
      "Each Output can carry rule groups that filter and route webhooks based on their contents. We use this to separate the create flow from the delete flow.",
    aws: "EventBridge rule",
  },
  {
    icon: IconRefresh,
    title: "Durable retries",
    short: "Exponential backoff, up to a 30-day window.",
    detail:
      "Every event is stored, delivered, and retried with exponential backoff until it lands — across short blips, medium outages, and extended downtime.",
    aws: "EventBridge retry + SQS DLQ",
  },
  {
    icon: IconEye,
    title: "Logs & monitoring",
    short: "Real-time delivery status and attempt history.",
    detail:
      "Live visibility into every event, delivery status, and per-attempt history — plus alerts on anomalies like missing fields or empty responses.",
    aws: "CloudWatch Logs + metrics",
  },
]

const mapping = [
  {
    relay: "Input / public endpoint",
    aws: "API Gateway route",
    note: "One per flow",
  },
  {
    relay: "Signature verification",
    aws: "HMAC check in API Gateway / Lambda",
    note: "Delete route",
  },
  {
    relay: "Routing rule",
    aws: "EventBridge rule",
    note: "Match on detail-type",
  },
  {
    relay: "Function (transform)",
    aws: "Lambda handler",
    note: "Two handlers, one fn",
  },
  {
    relay: "Output + durable retry",
    aws: "EventBridge retry policy",
    note: "Backoff",
  },
  {
    relay: "Dropped-delivery safety net",
    aws: "SQS dead-letter queue",
    note: "Delete path",
  },
  { relay: "Webhook logs", aws: "CloudWatch Logs", note: "Per-invocation" },
]

export default function WebhookRelayPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Start here"
        icon={IconWebhook}
        crumbs={[
          { title: "Runbook", href: "/overview" },
          { title: "Leaving WebhookRelay" },
        ]}
        title="What WebhookRelay did for us"
        description="WebhookRelay is a hosted webhook gateway: durable public endpoints, in-transit transforms, rules-based routing, and retry until it lands. To migrate confidently we need to know exactly which of its features we lean on — and the AWS primitive that takes over each job."
      />

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">
          The features we actually use
        </h2>
        <p className="text-sm text-muted-foreground">
          Hover any card for the detail. Everything else WebhookRelay offers —
          tunnels, custom domains, SSO, Kubernetes operators, the testing bin —
          is out of scope: this is a small, internal, one-way bridge.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <HoverCard key={f.title}>
              <HoverCardTrigger>
                <Card className="h-full cursor-help border-border/60 bg-card/50 transition-colors hover:border-primary/30">
                  <CardHeader className="pb-3">
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                      <f.icon className="size-5" />
                    </div>
                    <CardTitle className="text-sm">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CardDescription>{f.short}</CardDescription>
                    <Badge
                      variant="secondary"
                      className="font-mono text-[10px]"
                    >
                      → {f.aws}
                    </Badge>
                  </CardContent>
                </Card>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <p className="text-sm leading-relaxed">{f.detail}</p>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <IconArrowsExchange className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold">
            Feature parity map
          </h2>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>WebhookRelay</TableHead>
                <TableHead>AWS equivalent</TableHead>
                <TableHead className="hidden sm:table-cell">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mapping.map((m) => (
                <TableRow key={m.relay} className="border-border/50">
                  <TableCell className="text-muted-foreground">
                    {m.relay}
                  </TableCell>
                  <TableCell className="font-medium">{m.aws}</TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                    {m.note}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <Alert className="border-primary/30 bg-primary/5">
        <IconRefresh className="size-4 text-primary" />
        <AlertTitle>The one thing to get right: the transform</AlertTitle>
        <AlertDescription>
          The heart of our WebhookRelay usage is the Function that reshapes each
          payload into the AppSheet API shape. That logic moves verbatim into
          the Lambda. Everything else is plumbing.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <LinkButton href="/aws/account">
          Next: AWS account &amp; region
          <IconArrowRight className="size-4" />
        </LinkButton>
      </div>
    </div>
  )
}
