import {
  IconAlertTriangle,
  IconArrowRight,
  IconMailbox,
  IconRotate,
  IconShieldCheck,
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

export const metadata = { title: "Dead-letter queue" }

const createQueue = `aws sqs create-queue \\
  --queue-name kalani-bridge-delete-dlq \\
  --attributes MessageRetentionPeriod=1209600 \\
  --region us-west-2`

const settings = [
  { k: "Queue name", v: "kalani-bridge-delete-dlq" },
  { k: "Type", v: "Standard" },
  { k: "Message retention", v: "14 days (1209600s)" },
  { k: "Encryption", v: "SSE-SQS (enabled)" },
  { k: "Used by", v: "EventBridge delete rule only" },
  { k: "Authorized by", v: "Queue resource policy" },
  { k: "Alarm", v: "depth > 0 for 5 min" },
]

const queuePolicy = `{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowEventBridgeDelivery",
    "Effect": "Allow",
    "Principal": { "Service": "events.amazonaws.com" },
    "Action": "sqs:SendMessage",
    "Resource": "arn:aws:sqs:us-west-2:312635943953:kalani-bridge-delete-dlq",
    "Condition": {
      "ArnEquals": {
        "aws:SourceArn": "arn:aws:events:us-west-2:312635943953:rule/kalani-bridge/kalani-bridge-delete"
      }
    }
  }]
}`

const replaySketch = `// Replay is receive → PutEvents → delete, in that order.
// Deleting first would lose the deletion for good.
for (const m of (await sqs.send(new ReceiveMessageCommand({
  QueueUrl: dlqUrl,
  MaxNumberOfMessages: 10,
  MessageAttributeNames: ["All"],
}))).Messages ?? []) {
  const original = JSON.parse(m.Body)

  await eb.send(new PutEventsCommand({
    Entries: [{
      EventBusName: "kalani-bridge",
      Source: original.source,
      DetailType: original["detail-type"],
      Detail: JSON.stringify(original.detail),
    }],
  }))

  await sqs.send(new DeleteMessageCommand({
    QueueUrl: dlqUrl,
    ReceiptHandle: m.ReceiptHandle,
  }))
}`

const depthAlarm = `aws cloudwatch put-metric-alarm \\
  --alarm-name kalani-bridge-dlq-not-empty \\
  --namespace AWS/SQS \\
  --metric-name ApproximateNumberOfMessagesVisible \\
  --dimensions Name=QueueName,Value=kalani-bridge-delete-dlq \\
  --statistic Maximum --period 300 --evaluation-periods 1 \\
  --threshold 0 --comparison-operator GreaterThanThreshold \\
  --treat-missing-data notBreaching \\
  --alarm-actions arn:aws:sns:us-west-2:312635943953:kalani-bridge-alerts \\
  --region us-west-2`

export default function DlqPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Deploy the bridge"
        icon={IconMailbox}
        crumbs={[
          { title: "Runbook", href: "/overview" },
          { title: "What to build", href: "/deploy" },
          { title: "Dead-letter queue" },
        ]}
        title="The delete-path safety net"
        description="Deletions are the one flow we can't afford to drop — a lost delete leaves orphaned rows cascading through AppSheet. This SQS queue catches any delete event that EventBridge couldn't deliver after its retries, so it can be inspected and replayed instead of vanishing."
      />

      <Alert className="border-primary/30 bg-primary/5">
        <IconShieldCheck className="size-4 text-primary" />
        <AlertTitle>Why only the delete path?</AlertTitle>
        <AlertDescription>
          The create flow is idempotent and easy to re-trigger — Transloadit can
          resend. A missed delete is silent and permanent, so it gets the DLQ.
          That said, &ldquo;re-triggerable&rdquo; still means someone has to
          notice: the create rule needs an alarm on{" "}
          <code>FailedInvocations</code> even though it needs no queue.
        </AlertDescription>
      </Alert>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">Queue settings</h2>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[220px]">Setting</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((s) => (
                <TableRow key={s.k} className="border-border/50">
                  <TableCell className="text-muted-foreground">{s.k}</TableCell>
                  <TableCell className="font-mono text-sm">{s.v}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold">Create it</h2>
        <Steps>
          <Step n={1} title="Create the queue in us-west-2">
            <p>
              Console: SQS → Create queue → Standard. Or, for the record, the
              equivalent CLI:
            </p>
            <CodeBlock shell code={createQueue} />
          </Step>
          <Step n={2} title="Grant EventBridge send access on the QUEUE">
            <p>
              This is the easiest thing on the whole project to get wrong.
              EventBridge does not use the target&apos;s IAM role to write to a
              dead-letter queue — it needs a resource-based policy on the queue
              itself. Without it, delivery to the DLQ is denied and the
              exhausted delete event is simply dropped: the exact failure this
              queue exists to prevent, with nothing in the console to say it
              happened.
            </p>
            <CodeBlock
              language="json"
              title="queue-policy.json"
              code={queuePolicy}
            />
            <p>
              The <code>aws:SourceArn</code> condition keeps the queue from
              accepting messages from any other rule in the account.
            </p>
          </Step>
          <Step n={3} title="Alarm on it — a DLQ nobody watches is silent loss">
            <p>
              &ldquo;Never silently lost&rdquo; is only true if someone finds
              out. Send the alarm to an SNS topic that reaches a person, and
              treat any non-zero depth as an incident rather than a statistic.
            </p>
            <CodeBlock shell code={depthAlarm} />
          </Step>
          <Step n={4} title="Reference it from the delete rule">
            <p>
              You&apos;ll point the EventBridge delete rule&apos;s target at
              this queue as its dead-letter destination on the next pages. Keep
              the ARN handy:
            </p>
            <CodeBlock
              title="arn"
              code={
                "arn:aws:sqs:us-west-2:312635943953:kalani-bridge-delete-dlq"
              }
            />
          </Step>
        </Steps>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <IconRotate className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold">
            Replaying a stuck deletion
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">Check depth first:</p>
        <CodeBlock
          shell
          code={
            "aws sqs get-queue-attributes \\\n  --queue-url <dlq-url> \\\n  --attribute-names ApproximateNumberOfMessages \\\n  --region us-west-2"
          }
        />
        <Alert className="border-destructive/30 bg-destructive/5">
          <IconAlertTriangle className="size-4 text-destructive" />
          <AlertTitle>
            SQS &ldquo;redrive to source&rdquo; does not work here
          </AlertTitle>
          <AlertDescription>
            The console&apos;s redrive button moves messages back to the{" "}
            <em>source queue</em> they came from. These messages did not come
            from a queue — EventBridge put them here directly, so there is no
            source to redrive to. Replay is a deliberate, human-run step:
            receive each message, put the original event back on the bus, then
            delete it from the queue only after the put succeeds.
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          Each message body is the original event; EventBridge attaches{" "}
          <code>RULE_ARN</code>, <code>TARGET_ARN</code>,{" "}
          <code>ERROR_CODE</code>, and <code>ERROR_MESSAGE</code> as message
          attributes. Read the error first — if the deletes failed because the
          payload shape was wrong rather than because AppSheet was down,
          replaying them unchanged just refills the queue.
        </p>
        <CodeBlock language="ts" title="replay.ts" code={replaySketch} />
      </section>

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-6">
        <p className="text-sm text-muted-foreground">
          Safety net is up. Now the logic that does the work.
        </p>
        <LinkButton href="/deploy/lambda">
          Next: Lambda
          <IconArrowRight className="size-4" />
        </LinkButton>
      </div>
    </div>
  )
}
