import {
  IconAlertTriangle,
  IconArrowRight,
  IconKey,
  IconLock,
  IconRobot,
  IconShieldCheck,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-header"
import { LinkButton } from "@/components/link-button"
import { Step, Steps } from "@/components/steps"
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
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export const metadata = { title: "Budget service account" }

const policyJson = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadBudgetsAndCost",
      "Effect": "Allow",
      "Action": [
        "budgets:ViewBudget",
        "budgets:DescribeBudget",
        "budgets:DescribeBudgetPerformanceHistory",
        "ce:GetCostAndUsage",
        "ce:GetCostForecast",
        "ce:GetDimensionValues",
        "cloudwatch:GetMetricData"
      ],
      "Resource": "*"
    }
  ]
}`

const trustJson = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "tasks.apprunner.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}`

export default function ServiceAccountPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="AWS foundation"
        icon={IconKey}
        crumbs={[
          { title: "Runbook", href: "/overview" },
          { title: "Budget service account" },
        ]}
        title="The one read-only robot"
        description="This documentation site shows live budget and usage numbers. To read them it needs an identity — and this is the only automation identity in the whole account. It can read cost and budget data and nothing else. It can create, change, or delete nothing."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: IconRobot, t: "Role name", v: "KalaniBudgetReader" },
          { icon: IconLock, t: "Access", v: "Read-only" },
          { icon: IconShieldCheck, t: "Scope", v: "Cost & Budgets" },
        ].map((c) => (
          <Card key={c.t} className="border-border/60 bg-card/50">
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <c.icon className="size-5" />
              </div>
              <div>
                <CardDescription>{c.t}</CardDescription>
                <CardTitle className="font-mono text-sm">{c.v}</CardTitle>
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Alert className="border-primary/30 bg-primary/5">
        <IconShieldCheck className="size-4 text-primary" />
        <AlertTitle>Prefer a role over static keys — always</AlertTitle>
        <AlertDescription>
          When the site runs on AWS, give its compute an execution role that{" "}
          <strong>assumes</strong> KalaniBudgetReader. No access keys are
          created, stored, or rotated. Static keys are a fallback for off-AWS
          hosting only, and come with real handling burden.
        </AlertDescription>
      </Alert>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">
          The least-privilege policy
        </h2>
        <p className="text-sm text-muted-foreground">
          This is the entire permission surface of the robot. Nothing here can
          mutate state.
        </p>
        <CodeBlock
          language="json"
          title="KalaniBudgetReaderPolicy.json"
          code={policyJson}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">
          Create it — two paths
        </h2>
        <Tabs defaultValue="role" className="w-full">
          <TabsList>
            <TabsTrigger value="role">
              Role (preferred)
              <Badge className="ml-2 bg-primary/15 text-primary hover:bg-primary/15">
                recommended
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="keys">Static keys (fallback)</TabsTrigger>
          </TabsList>

          <TabsContent value="role" className="mt-6">
            <Steps>
              <Step n={1} title="Create the customer-managed policy">
                <p>
                  In <strong>IAM → Policies → Create policy</strong>, paste the
                  JSON above and name it <code>KalaniBudgetReaderPolicy</code>.
                </p>
              </Step>
              <Step n={2} title="Create the role with a trust policy">
                <p>
                  Create a role named <code>KalaniBudgetReader</code>. Its trust
                  policy lets your site&apos;s compute assume it — here, App
                  Runner. Adjust the principal to match your host (ECS, Lambda,
                  etc.).
                </p>
                <CodeBlock
                  language="json"
                  title="trust-policy.json"
                  code={trustJson}
                />
              </Step>
              <Step n={3} title="Attach the policy">
                <p>
                  Attach <code>KalaniBudgetReaderPolicy</code> to the role. That
                  is the role&apos;s only permission.
                </p>
              </Step>
              <Step n={4} title="Point the site's compute at it">
                <p>
                  Set the role as the instance / execution role for the
                  site&apos;s service. The AWS SDK picks up temporary
                  credentials automatically — no secrets in the app.
                </p>
              </Step>
            </Steps>
          </TabsContent>

          <TabsContent value="keys" className="mt-6">
            <Alert className="mb-6 border-destructive/30 bg-destructive/5">
              <IconAlertTriangle className="size-4 text-destructive" />
              <AlertTitle>Only if the site runs outside AWS</AlertTitle>
              <AlertDescription>
                Static keys are long-lived credentials. If you must use them,
                they belong in a secrets manager — never in the repo, never in
                an env file committed anywhere.
              </AlertDescription>
            </Alert>
            <Steps>
              <Step n={1} title="Create a dedicated IAM user">
                <p>
                  <strong>IAM → Users → Create user</strong>, named{" "}
                  <code>svc-budget-reader</code>. Do <strong>not</strong> enable
                  console access.
                </p>
              </Step>
              <Step n={2} title="Attach the same policy">
                <p>
                  Attach <code>KalaniBudgetReaderPolicy</code> directly to the
                  user.
                </p>
              </Step>
              <Step n={3} title="Generate one access key">
                <p>
                  Create a single access key and immediately store it in AWS
                  Secrets Manager. This is a manual, deliberate step — exactly
                  the kind of sensitive action this project keeps in human
                  hands.
                </p>
                <CodeBlock
                  shell
                  code={
                    "aws secretsmanager create-secret \\\n  --name kalani/budget-reader \\\n  --secret-string file://key.json \\\n  --region us-west-2"
                  }
                />
              </Step>
              <Step n={4} title="Set a rotation reminder">
                <p>
                  Rotate the key on a schedule and delete the old one. A role
                  has no such burden — which is why it is preferred.
                </p>
              </Step>
            </Steps>
          </TabsContent>
        </Tabs>
      </section>

      <Alert className="border-border/60">
        <IconLock className="size-4" />
        <AlertTitle>This robot cannot touch the bridge</AlertTitle>
        <AlertDescription>
          KalaniBudgetReader has no access to Lambda, API Gateway, EventBridge,
          SQS, or IAM. Even if its credentials leaked, the blast radius is
          read-only cost data.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-6">
        <p className="text-sm text-muted-foreground">
          With the reader in place, the budget page can show live numbers.
        </p>
        <LinkButton href="/aws/budget">
          Next: Budget &amp; usage
          <IconArrowRight className="size-4" />
        </LinkButton>
      </div>
    </div>
  )
}
