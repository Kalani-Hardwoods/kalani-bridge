import {
  IconApi,
  IconArrowRight,
  IconArrowsSplit,
  IconFunction,
  IconInfoCircle,
  IconLock,
  IconShieldLock,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-header"
import { LinkButton } from "@/components/link-button"
import { CodeBlock } from "@/components/code-block"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"

export const metadata = { title: "IAM roles" }

const apigwTrust = `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "apigateway.amazonaws.com" },
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": { "aws:SourceAccount": "312635943953" },
      "ArnLike": {
        "aws:SourceArn": "arn:aws:execute-api:us-west-2:312635943953:*"
      }
    }
  }]
}`

const apigwPerm = `{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PutToBridgeBus",
    "Effect": "Allow",
    "Action": "events:PutEvents",
    "Resource": "arn:aws:events:us-west-2:312635943953:event-bus/kalani-bridge"
  }]
}`

const ebTrust = `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "events.amazonaws.com" },
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": { "aws:SourceAccount": "312635943953" }
    }
  }]
}`

const ebPerm = `{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "InvokeBridgeLambda",
    "Effect": "Allow",
    "Action": "lambda:InvokeFunction",
    "Resource": "arn:aws:lambda:us-west-2:312635943953:function:kalani-bridge"
  }]
}

// NOT here: sqs:SendMessage for the DLQ. EventBridge authorizes
// dead-letter delivery through a policy on the QUEUE, not this role.
// See the dead-letter queue page for the queue policy.`

const lambdaTrust = `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": { "aws:SourceAccount": "312635943953" }
    }
  }]
}`

const lambdaPerm = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Logs",
      "Effect": "Allow",
      "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:us-west-2:312635943953:log-group:/aws/lambda/kalani-bridge:*"
    },
    {
      "Sid": "ReadAppSheetKey",
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:us-west-2:312635943953:secret:kalani/appsheet-*"
    }
  ]
}

// Create the log group yourself with a retention policy instead of
// granting logs:CreateLogGroup — an auto-created group never expires
// and quietly bills forever.`

const verifyTrust = `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": { "aws:SourceAccount": "312635943953" }
    }
  }]
}`

const verifyPerm = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Logs",
      "Effect": "Allow",
      "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:us-west-2:312635943953:log-group:/aws/lambda/kalani-bridge-verify:*"
    },
    {
      "Sid": "ReadWebhookSecrets",
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:us-west-2:312635943953:secret:kalani/webhook-signing-*"
    },
    {
      "Sid": "PutToBridgeBus",
      "Effect": "Allow",
      "Action": "events:PutEvents",
      "Resource": "arn:aws:events:us-west-2:312635943953:event-bus/kalani-bridge"
    }
  ]
}`

const roles = [
  {
    value: "apigw",
    icon: IconApi,
    name: "APIGatewayToEventBridge",
    line: "API Gateway → EventBridge",
    blurb:
      "Lets the API Gateway routes drop a validated request onto the bridge bus. Nothing else.",
    trust: apigwTrust,
    perm: apigwPerm,
  },
  {
    value: "verify",
    icon: IconLock,
    name: "KalaniBridgeVerifyRole",
    line: "Verifier → EventBridge",
    blurb:
      "Execution role for the HMAC verifier that fronts the delete route. It reads the webhook signing secrets and can put events on the bridge bus — it has no access to AppSheet's key at all, so a bug in signature handling can never leak it.",
    trust: verifyTrust,
    perm: verifyPerm,
  },
  {
    value: "eventbridge",
    icon: IconArrowsSplit,
    name: "EventBridgeToLambda",
    line: "EventBridge → Lambda",
    blurb:
      "Lets a rule invoke the transform Lambda. Note what is missing: dead-letter delivery is authorized by the queue's own resource policy, not by this role, so adding sqs:SendMessage here achieves nothing.",
    trust: ebTrust,
    perm: ebPerm,
  },
  {
    value: "lambda",
    icon: IconFunction,
    name: "KalaniBridgeLambdaRole",
    line: "Lambda → AppSheet",
    blurb:
      "The transform function's execution role. It writes logs and reads the AppSheet API key from Secrets Manager. The AppSheet call itself is plain HTTPS — no AWS permission needed.",
    trust: lambdaTrust,
    perm: lambdaPerm,
  },
]

export default function IamRolesPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Deploy the bridge"
        icon={IconShieldLock}
        crumbs={[
          { title: "Runbook", href: "/overview" },
          { title: "What to build", href: "/deploy" },
          { title: "IAM roles" },
        ]}
        title="Four roles, each the smallest possible"
        description="Build these first. Every other component references one of them. Each role trusts exactly one AWS service, from this account only, and grants exactly the actions that hop needs — no wildcards on resources, no PowerUser shortcuts."
      />

      <Alert className="border-border/60">
        <IconLock className="size-4" />
        <AlertTitle>Every trust policy is scoped to this account</AlertTitle>
        <AlertDescription>
          A service principal like <code>events.amazonaws.com</code> is not one
          customer — it is the service, acting for anyone. Without an{" "}
          <code>aws:SourceAccount</code> or <code>aws:SourceArn</code>{" "}
          condition, a role that trusts a bare service principal can be assumed
          on behalf of a resource in someone else&apos;s account that happens to
          reference your ARN. The conditions below close that gap and cost
          nothing.
        </AlertDescription>
      </Alert>

      <Alert className="border-primary/30 bg-primary/5">
        <IconInfoCircle className="size-4 text-primary" />
        <AlertTitle>Names and ARNs used below</AlertTitle>
        <AlertDescription>
          Bus <code>kalani-bridge</code>, transform function{" "}
          <code>kalani-bridge</code>, verifier function{" "}
          <code>kalani-bridge-verify</code>, queue{" "}
          <code>kalani-bridge-delete-dlq</code>, account{" "}
          <code>312635943953</code>, region <code>us-west-2</code>. Keep these
          consistent across every page.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="apigw" className="w-full">
        <TabsList>
          {roles.map((r) => (
            <TabsTrigger key={r.value} value={r.value}>
              <r.icon className="size-4" />
              <span className="hidden sm:inline">{r.line}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {roles.map((r) => (
          <TabsContent key={r.value} value={r.value} className="mt-6 space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-primary/15 font-mono text-primary hover:bg-primary/15">
                {r.name}
              </Badge>
              <span className="text-sm text-muted-foreground">{r.line}</span>
            </div>
            <p className="text-sm text-muted-foreground">{r.blurb}</p>
            <div>
              <h3 className="mb-2 text-sm font-medium">Trust policy</h3>
              <CodeBlock
                language="json"
                title="trust-policy.json"
                code={r.trust}
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Permission policy</h3>
              <CodeBlock
                language="json"
                title="permissions.json"
                code={r.perm}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Alert className="border-border/60">
        <IconShieldLock className="size-4" />
        <AlertTitle>Create by hand, in the console</AlertTitle>
        <AlertDescription>
          Role creation is a sensitive action, so do it manually under the{" "}
          <em>Admins</em> permission set: IAM → Roles → Create role → Custom
          trust policy, paste the trust JSON, then attach the matching
          permission policy. Once created, the services use them automatically
          forever.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-6">
        <p className="text-sm text-muted-foreground">
          Roles exist. Build the safety net they reference.
        </p>
        <LinkButton href="/deploy/dlq">
          Next: Dead-letter queue
          <IconArrowRight className="size-4" />
        </LinkButton>
      </div>
    </div>
  )
}
