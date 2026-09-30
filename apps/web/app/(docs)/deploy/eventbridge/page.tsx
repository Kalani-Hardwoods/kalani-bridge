import Link from "next/link"
import {
  IconAlertTriangle,
  IconArrowRight,
  IconArrowsSplit,
  IconBolt,
  IconRefresh,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"

export const metadata = { title: "EventBridge" }

const createRule = `{
  "source": ["kalani.bridge"],
  "detail-type": ["product.deleted"]
}`

const targetConfig = `{
  "Rule": "kalani-bridge-delete",
  "EventBusName": "kalani-bridge",
  "Targets": [{
    "Id": "invoke-bridge-lambda",
    "Arn": "arn:aws:lambda:us-west-2:312635943953:function:kalani-bridge",
    // No RoleArn: Lambda targets are authorized by a resource-based
    // policy on the FUNCTION, not by a role on the target.
    "RetryPolicy": {
      // 24h and 185 attempts are the service maximums. Retries stop at
      // whichever limit is reached first, so a short max-age quietly
      // caps a long retry budget.
      "MaximumRetryAttempts": 185,
      "MaximumEventAgeInSeconds": 86400
    },
    "DeadLetterConfig": {
      "Arn": "arn:aws:sqs:us-west-2:312635943953:kalani-bridge-delete-dlq"
    }
  }]
}`

const lambdaPermission = `aws lambda add-permission \\
  --function-name kalani-bridge \\
  --statement-id eventbridge-delete-rule \\
  --action lambda:InvokeFunction \\
  --principal events.amazonaws.com \\
  --source-arn arn:aws:events:us-west-2:312635943953:rule/kalani-bridge/kalani-bridge-delete \\
  --region us-west-2`

const catchAll = `{
  "source": ["kalani.bridge"]
}`

export default function EventBridgePage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Deploy the bridge"
        icon={IconArrowsSplit}
        crumbs={[
          { title: "Runbook", href: "/overview" },
          { title: "What to build", href: "/deploy" },
          { title: "EventBridge" },
        ]}
        title="One bus, one rule per flow"
        description="EventBridge is the durable middle of the bridge. A single custom bus receives both flows; a rule per flow matches on detail-type and invokes the Lambda. The delete rule adds retries and the DLQ; the create rule stays lean."
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconBolt className="size-5 text-primary" />
              <CardTitle className="text-base">kalani-bridge-create</CardTitle>
            </div>
            <CardDescription>detail-type: board.created</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Invokes the Lambda. Light retries, no DLQ — the create flow is
              replayable at the source.
            </p>
            <Badge variant="secondary" className="font-mono text-[10px]">
              retries: 2
            </Badge>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconRefresh className="size-5 text-destructive" />
              <CardTitle className="text-base">kalani-bridge-delete</CardTitle>
            </div>
            <CardDescription>detail-type: product.deleted</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Invokes the Lambda with the maximum retry budget and a dead-letter
              queue so a deletion is never lost.
            </p>
            <Badge variant="secondary" className="font-mono text-[10px]">
              retries: 185 · 24h · DLQ
            </Badge>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold">Build it</h2>
        <Steps>
          <Step n={1} title="Create the custom event bus">
            <p>
              Console: EventBridge → Event buses → Create event bus, named{" "}
              <code>kalani-bridge</code>, in us-west-2.
            </p>
            <CodeBlock
              shell
              code={
                "aws events create-event-bus \\\n  --name kalani-bridge \\\n  --region us-west-2"
              }
            />
          </Step>
          <Step n={2} title="Add the delete rule">
            <p>Create a rule on the bus with this event pattern:</p>
            <CodeBlock
              language="json"
              title="delete-rule-pattern.json"
              code={createRule}
            />
          </Step>
          <Step n={3} title="Attach the Lambda target with retries + DLQ">
            <p>
              Point the rule at the Lambda and set the retry policy and
              dead-letter queue. Give the delete path the full retry budget —
              anything less and a routine AppSheet maintenance window pushes
              real deletions into the DLQ for a human to redrive by hand.
            </p>
            <CodeBlock
              language="json"
              title="delete-target.json"
              code={targetConfig}
            />
          </Step>
          <Step n={4} title="Let EventBridge invoke the function">
            <p>
              A Lambda target is not authorized by the target&apos;s{" "}
              <code>RoleArn</code> — EventBridge invokes it through a
              resource-based policy on the function itself. Adding the target in
              the console does this silently for you; from the CLI or IaC you
              must add it, or every invocation fails with{" "}
              <code>AccessDeniedException</code> and drains straight into the
              DLQ.
            </p>
            <CodeBlock shell code={lambdaPermission} />
          </Step>
          <Step n={5} title="Repeat for the create rule">
            <p>
              Same shape with <code>board.created</code>, a lighter retry
              policy, and no <code>DeadLetterConfig</code> — plus its own{" "}
              <code>add-permission</code> statement with a matching{" "}
              <code>--source-arn</code>.
            </p>
          </Step>
          <Step n={6} title="Add a catch-all archive rule">
            <p>
              An event that matches no rule is discarded silently — no error, no
              metric, no DLQ. One typo in a <code>detail-type</code> and
              deletions vanish while every dashboard stays green. Add a
              deliberately broad rule targeting a CloudWatch log group so every
              event that reaches the bus leaves a trace:
            </p>
            <CodeBlock
              language="json"
              title="catch-all-pattern.json"
              code={catchAll}
            />
          </Step>
        </Steps>
      </section>

      <Alert className="border-destructive/30 bg-destructive/5">
        <IconAlertTriangle className="size-4 text-destructive" />
        <AlertTitle>Delivery is at-least-once, and unordered</AlertTitle>
        <AlertDescription>
          EventBridge may deliver the same event more than once, and a retried
          delete can arrive after a later create for the same product. The
          transform Lambda has to be safe to run twice on the same event — that
          is handled on the{" "}
          <Link
            href="/deploy/lambda"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Lambda page
          </Link>
          , and it is not optional.
        </AlertDescription>
      </Alert>

      <Alert className="border-primary/30 bg-primary/5">
        <IconBolt className="size-4 text-primary" />
        <AlertTitle>Room to fan out</AlertTitle>
        <AlertDescription>
          Because both flows are events on a bus, adding a Slack ping or a
          CloudWatch archive later is just another target on the same rule — no
          change to ingest or transform code.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-6">
        <p className="text-sm text-muted-foreground">
          Routing is live. Add the public front door last.
        </p>
        <LinkButton href="/deploy/api-gateway">
          Next: API Gateway
          <IconArrowRight className="size-4" />
        </LinkButton>
      </div>
    </div>
  )
}
