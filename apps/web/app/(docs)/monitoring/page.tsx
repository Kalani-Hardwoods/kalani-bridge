import Link from "next/link"
import {
  IconActivityHeartbeat,
  IconAlertTriangle,
  IconArrowBackUp,
  IconArrowRight,
  IconBell,
  IconChecklist,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-header"
import { LinkButton } from "@/components/link-button"
import { Step, Steps } from "@/components/steps"
import { CodeBlock } from "@/components/code-block"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Badge } from "@workspace/ui/components/badge"

export const metadata = { title: "Monitoring" }

const alarms = [
  {
    metric: "ApproximateNumberOfMessagesVisible",
    ns: "AWS/SQS",
    on: "kalani-bridge-delete-dlq",
    when: "> 0 for 5 min",
    means: "A deletion gave up. Someone must replay it by hand.",
    sev: "page" as const,
  },
  {
    metric: "FailedInvocations",
    ns: "AWS/Events",
    on: "both rules",
    when: "> 0 in 5 min",
    means:
      "EventBridge could not invoke the Lambda at all — usually a missing resource policy.",
    sev: "page" as const,
  },
  {
    metric: "Errors",
    ns: "AWS/Lambda",
    on: "kalani-bridge",
    when: "> 0 in 5 min",
    means:
      "The transform threw. Retries are still running; you have time, but not much.",
    sev: "notify" as const,
  },
  {
    metric: "Throttles",
    ns: "AWS/Lambda",
    on: "kalani-bridge",
    when: "> 0 in 5 min",
    means: "Reserved concurrency is saturated — a burst, or a loop.",
    sev: "notify" as const,
  },
  {
    metric: "4xx",
    ns: "AWS/ApiGateway",
    on: "kalani-bridge-api",
    when: "> 5 in 5 min",
    means:
      "Failing signature checks: a rotated secret, or someone probing the endpoint.",
    sev: "notify" as const,
  },
  {
    metric: "5xx",
    ns: "AWS/ApiGateway",
    on: "kalani-bridge-api",
    when: "> 0 in 5 min",
    means:
      "The verifier is erroring. Shopify is being told to retry, and will give up after 48 hours.",
    sev: "page" as const,
  },
  {
    metric: "IntegrationLatency",
    ns: "AWS/ApiGateway",
    on: "delete route",
    when: "p99 > 3s",
    means: "Closing in on Shopify's 5-second timeout.",
    sev: "notify" as const,
  },
]

const snsTopic = `aws sns create-topic \\
  --name kalani-bridge-alerts \\
  --region us-west-2

aws sns subscribe \\
  --topic-arn arn:aws:sns:us-west-2:312635943953:kalani-bridge-alerts \\
  --protocol email \\
  --notification-endpoint ops@kalanihardwoods.com \\
  --region us-west-2`

const reconcile = `-- The question no metric answers: did both sides end up agreeing?
-- Run weekly. Every Shopify product should have a live board row,
-- and every board marked Ready should still exist in Shopify.
--
--   boards where Ready = true and shopify_id not in (shopify products)
--     -> a delete that never made it across
--   shopify products not in (boards)
--     -> a create that never made it across
--
-- A non-empty result is the bridge silently dropping events, which is
-- exactly the failure mode alarms are worst at catching.`

export default function MonitoringPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Make it survive"
        icon={IconActivityHeartbeat}
        crumbs={[
          { title: "Runbook", href: "/overview" },
          { title: "Monitoring" },
        ]}
        title="How you find out something broke"
        description="The bridge runs unattended between two systems nobody watches directly. Without these alarms, the first signal that it stopped working is a customer asking about a board that is still listed weeks after it sold."
      />

      <Alert className="border-destructive/30 bg-destructive/5">
        <IconAlertTriangle className="size-4 text-destructive" />
        <AlertTitle>A dead-letter queue nobody watches is data loss</AlertTitle>
        <AlertDescription>
          The DLQ&apos;s entire value is that a failed deletion waits for a
          human instead of vanishing. If no alarm points at it, the message
          still sits there for fourteen days and then deletes itself — the same
          outcome as having no queue, reached more slowly and with more
          confidence that things are fine. Build the alarm in the same sitting
          as the queue.
        </AlertDescription>
      </Alert>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">The alarm set</h2>
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[240px]">Metric</TableHead>
                <TableHead className="hidden lg:table-cell">On</TableHead>
                <TableHead className="w-[130px]">Fires when</TableHead>
                <TableHead>What it means</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alarms.map((a) => (
                <TableRow key={a.metric + a.on} className="border-border/50">
                  <TableCell className="align-top">
                    <div className="font-mono text-xs">{a.metric}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {a.ns}
                      </span>
                      <Badge
                        className={
                          a.sev === "page"
                            ? "bg-destructive/15 text-[10px] text-destructive uppercase hover:bg-destructive/15"
                            : "bg-primary/15 text-[10px] text-primary uppercase hover:bg-primary/15"
                        }
                      >
                        {a.sev}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="hidden align-top font-mono text-xs text-muted-foreground lg:table-cell">
                    {a.on}
                  </TableCell>
                  <TableCell className="align-top font-mono text-xs">
                    {a.when}
                  </TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {a.means}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-muted-foreground">
          Set <code>--treat-missing-data notBreaching</code> on all of them.
          These flows are low-volume and go quiet for hours at a time; without
          it, every idle evening looks like an outage and the alarms get muted
          within a week.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <IconBell className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold">
            One topic, pointed at a person
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Every alarm above sends to the same SNS topic. Subscribe a real
          address that someone reads — an alarm routed to an unmonitored inbox
          is the DLQ problem again, one level up.
        </p>
        <CodeBlock shell code={snsTopic} />
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">
          Reconciliation catches what alarms can&apos;t
        </h2>
        <p className="text-sm text-muted-foreground">
          Alarms only fire on failures the system noticed. The failure modes on
          the{" "}
          <Link
            href="/hardening"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            gotchas page
          </Link>{" "}
          that worry me most are the ones that return 200 — an event routed
          nowhere, a delete that matched no key. Nothing will page you. The only
          thing that catches those is comparing the two sides on a schedule.
        </p>
        <CodeBlock title="reconcile.sql" code={reconcile} />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <IconChecklist className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold">
            Cutover, in order
          </h2>
        </div>
        <Steps>
          <Step n={1} title="Prove the AppSheet cascade fires on API edits">
            <p>
              Everything here rests on an assumption worth testing before you
              build on it: that deleting a row <em>through the API</em> triggers
              the same bots and cascade deletes as a human deleting it in the
              app. Confirm it in a copy of the app, on a throwaway row, before
              the first webhook is repointed. If it does not fire, the whole
              delete flow needs a different design and you want to know now.
            </p>
          </Step>
          <Step n={2} title="Alarms first, traffic second">
            <p>
              Create the SNS topic and every alarm above while the bridge is
              still idle. Deliberately break something — remove the Lambda
              permission, send a bad signature — and confirm the mail actually
              arrives. An untested alarm is a belief, not a control.
            </p>
          </Step>
          <Step n={3} title="Run both bridges in parallel on create">
            <p>
              Point Transloadit at the new URL while WebhookRelay stays
              configured and live. Watch one real board go end to end: event on
              the bus, Lambda invoked, row updated, bot pushes to Shopify.
            </p>
          </Step>
          <Step n={4} title="Then move delete, and watch harder">
            <p>
              Repoint the Shopify webhook. Delete one test product and confirm
              the cascade completes. Check the DLQ depth is zero afterwards —
              not just that the row disappeared.
            </p>
          </Step>
          <Step n={5} title="Let it sit for a day before decommissioning">
            <p>
              Leave the WebhookRelay endpoints alive and paid for one more day
              after both flows look clean. It is the cheapest insurance in the
              project, and it is the only thing that makes step 6 possible.
            </p>
          </Step>
          <Step n={6} title="Decommission, and write down the rollback">
            <p>
              Only after a clean day: tear down the WebhookRelay Inputs. Before
              you do, record the exact old endpoint URLs somewhere durable — the
              rollback below depends on them.
            </p>
          </Step>
        </Steps>
      </section>

      <Alert className="border-primary/30 bg-primary/5">
        <IconArrowBackUp className="size-4 text-primary" />
        <AlertTitle>Rollback is two paste operations</AlertTitle>
        <AlertDescription>
          If the bridge misbehaves, recovery is repointing Transloadit and
          Shopify at the old WebhookRelay URLs — no AWS teardown required, and
          nothing in the AWS stack needs to be deleted to stop it hurting.
          Leaving the bridge deployed but unaddressed is free and makes a second
          attempt easy. Drain the DLQ before you cut back over, though: those
          events describe deletions that still have not happened.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-6">
        <p className="text-sm text-muted-foreground">
          Watch the spend as well as the errors.
        </p>
        <LinkButton href="/aws/budget">
          Next: Budget &amp; usage
          <IconArrowRight className="size-4" />
        </LinkButton>
      </div>
    </div>
  )
}
