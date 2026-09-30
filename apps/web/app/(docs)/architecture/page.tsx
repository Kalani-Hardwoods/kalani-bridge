import Link from "next/link"
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconRefresh,
  IconRoute,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-header"
import { ArchDiagram } from "@/components/arch-diagram"
import { LinkButton } from "@/components/link-button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
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

export const metadata = { title: "Architecture" }

const components = [
  {
    name: "API Gateway",
    role: "Two public HTTPS routes — one per flow, each throttled to single-digit RPS.",
    replaces: "WebhookRelay Inputs",
  },
  {
    name: "Verifier Lambda",
    role: "Checks the webhook signature against the raw body, then puts the event on the bus. Holds no AppSheet credentials.",
    replaces: "WebhookRelay signature checks",
  },
  {
    name: "EventBridge",
    role: "One event bus plus one rule per flow. Routes matching events to the Lambda; owns retries.",
    replaces: "WebhookRelay routing rules",
  },
  {
    name: "Transform Lambda",
    role: "Reshapes each payload into the AppSheet API shape. Two idempotent handlers in one function, capped at 5 concurrent.",
    replaces: "WebhookRelay Functions",
  },
  {
    name: "SQS (DLQ)",
    role: "Dead-letter queue on the delete path, alarmed on depth, so a momentary AppSheet outage never drops a deletion.",
    replaces: "WebhookRelay durable retries",
  },
  {
    name: "CloudWatch",
    role: "Alarms on DLQ depth, failed invocations, and gateway 5xx — plus a catch-all rule logging every event that reaches the bus.",
    replaces: "WebhookRelay delivery log",
  },
  {
    name: "IAM roles",
    role: "Four least-privilege roles, each scoped to this account: API GW → bus, verifier → bus, EventBridge → Lambda, Lambda → Secrets Manager.",
    replaces: "—",
  },
]

export default function ArchitecturePage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Start here"
        icon={IconRoute}
        crumbs={[
          { title: "Runbook", href: "/overview" },
          { title: "Architecture" },
        ]}
        title="Architecture, hop by hop"
        description="A single ingest path handles both inbound flows. Everything downstream — S3 storage, Shopify, and the AppSheet bots — stays exactly as it is today."
      />

      <ArchDiagram />

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">
          Components to build
        </h2>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[140px]">Component</TableHead>
                <TableHead>What it does</TableHead>
                <TableHead className="hidden w-[180px] sm:table-cell">
                  Replaces
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((c) => (
                <TableRow key={c.name} className="border-border/50">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.role}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant="outline"
                      className="border-border/60 font-mono text-[10px] text-muted-foreground"
                    >
                      {c.replaces}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">
          The two flows, step by step
        </h2>
        <Tabs defaultValue="create" className="w-full">
          <TabsList>
            <TabsTrigger value="create">Board creation</TabsTrigger>
            <TabsTrigger value="delete">Product delete</TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="mt-4">
            <ol className="space-y-3">
              {[
                'Transloadit finishes an assembly and POSTs "assembly complete" with the S3 photo URLs.',
                "The notification's signature is verified — this route writes to a live storefront, so it is not open ingest.",
                "API Gateway (create route) puts an event on the bus, trimmed to the fields the transform reads.",
                "EventBridge rule matches the create detail-type and invokes the Lambda.",
                "Lambda reshapes the payload and calls the AppSheet API to update the row with photo URLs + a ready flag. Writing the same URLs twice is a no-op, so a duplicate delivery is harmless.",
                "The existing AppSheet bot sees the ready row and pushes the product to Shopify.",
              ].map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs text-primary">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{s}</span>
                </li>
              ))}
            </ol>
          </TabsContent>
          <TabsContent value="delete" className="mt-4">
            <ol className="space-y-3">
              {[
                "Shopify fires products/delete when a product is removed.",
                "API Gateway hands it to the verifier Lambda, which checks the HMAC against the raw bytes — an authorizer cannot do this, because API Gateway never gives an authorizer the body.",
                "A valid event goes on the bus and the route answers 200 immediately, well inside Shopify's 5-second window.",
                "The delete rule invokes the transform Lambda, which looks the board up by Shopify ID and deletes it by key — a row that is already gone counts as success, so duplicate deliveries are safe.",
                "The AppSheet response is inspected, not just its status code: the API reports failed rows inside a 200.",
                "If AppSheet is unreachable, EventBridge retries for up to 24 hours; only then does the event land in the SQS DLQ, which is alarmed so a human actually replays it.",
              ].map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 font-mono text-xs text-destructive">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{s}</span>
                </li>
              ))}
            </ol>
          </TabsContent>
        </Tabs>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">
          Why EventBridge in the middle?
        </h2>
        <p className="text-sm text-muted-foreground">
          A direct API Gateway → Lambda wire would be simpler. Here is why the
          bus earns its place.
        </p>
        <Accordion multiple={false} className="w-full">
          <AccordionItem value="durability">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <IconRefresh className="size-4 text-primary" />
                Durability on the delete cascade
              </span>
            </AccordionTrigger>
            <AccordionContent>
              Deletions are the unforgiving path — a dropped delete leaves
              orphaned rows across the cascade. EventBridge gives automatic
              retries with backoff, and pairs with an SQS dead-letter queue so a
              momentary AppSheet outage never loses a deletion.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="consistency">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <IconCheck className="size-4 text-primary" />
                One consistent shape for both flows
              </span>
            </AccordionTrigger>
            <AccordionContent>
              The create flow is more forgiving, but keeping both flows on one
              bus keeps the mental model and the code uniform: everything is an
              event with a detail-type and a rule.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="fanout">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <IconBolt className="size-4 text-primary" />
                Room to fan out later
              </span>
            </AccordionTrigger>
            <AccordionContent>
              A bus makes it trivial to add targets without touching the ingest
              code — a Slack notification, a CloudWatch log archive, a metrics
              dashboard — each as an extra rule on the same event.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="cost">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <IconAlertTriangle className="size-4 text-destructive" />
                What the bus costs us, honestly
              </span>
            </AccordionTrigger>
            <AccordionContent>
              Two things. The sender no longer learns whether the work succeeded
              — the route answers 200 as soon as the event is accepted, so
              Shopify&apos;s own retry mechanism stops protecting us and the DLQ
              has to. And an event that matches no rule is discarded with no
              error anywhere, which is why a catch-all logging rule is part of
              the build rather than a nice-to-have. Both are worth paying for
              durability on the delete path; neither is free.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <Alert className="border-destructive/30 bg-destructive/5">
        <IconAlertTriangle className="size-4 text-destructive" />
        <AlertTitle>Read the gotchas before you build any of this</AlertTitle>
        <AlertDescription>
          Several obvious ways to implement the path above do not work — a
          Lambda authorizer cannot see the body it would need to verify, an IAM
          role cannot authorize dead-letter delivery, and an AppSheet delete
          against the wrong column reports success while doing nothing.{" "}
          <Link
            href="/hardening"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            The gotchas page
          </Link>{" "}
          lists each one and what this design does instead.
        </AlertDescription>
      </Alert>

      <Alert className="border-border/60">
        <IconCheck className="size-4" />
        <AlertTitle>Unchanged by this migration</AlertTitle>
        <AlertDescription>
          S3 storage, the Shopify store, and the AppSheet bots keep working
          exactly as they do today. We are only swapping the webhook transport
          in the middle.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <LinkButton href="/webhookrelay">
          Next: Leaving WebhookRelay
          <IconArrowRight className="size-4" />
        </LinkButton>
      </div>
    </div>
  )
}
