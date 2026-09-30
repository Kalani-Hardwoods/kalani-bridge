import {
  IconArrowLeft,
  IconBellRinging,
  IconExternalLink,
  IconInfoCircle,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-header"
import { LinkButton } from "@/components/link-button"
import { Step, Steps } from "@/components/steps"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"

export const metadata = { title: "Change a budget in AWS" }

export default function ConsoleBudgetsPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Console reference"
        crumbs={[
          { title: "Runbook", href: "/overview" },
          { title: "Budget & usage", href: "/aws/budget" },
          { title: "Change a budget" },
        ]}
        title="Changing the budget in AWS"
        description="The budget page in this app is read-only. When you actually need to raise the cap, adjust an alert threshold, or change who gets notified, that happens in AWS Billing → Budgets. Here is exactly where to go."
      />

      <Alert className="border-primary/30 bg-primary/5">
        <IconInfoCircle className="size-4 text-primary" />
        <AlertTitle>You need billing access</AlertTitle>
        <AlertDescription>
          Editing budgets requires the <em>Admins</em> permission set. The{" "}
          <code>KalaniBillingViewer</code> role can see budgets but not change
          them — by design.
        </AlertDescription>
      </Alert>

      <div className="rounded-xl border border-border/60 bg-card/40 p-5">
        <Button
          size="lg"
          nativeButton={false}
          render={
            <a
              href="https://us-east-1.console.aws.amazon.com/billing/home#/budgets"
              target="_blank"
              rel="noreferrer noopener"
            />
          }
        >
          Open AWS Budgets
          <IconExternalLink className="size-4" />
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Budgets is a global (billing) console — it opens under us-east-1 even
          though your resources live in us-west-2. That is expected.
        </p>
      </div>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold">
          Raise or lower the cap
        </h2>
        <Steps>
          <Step n={1} title="Open Budgets">
            <p>
              Console → Billing and Cost Management → <strong>Budgets</strong>.
              You&apos;ll see the monthly cost budget for the bridge.
            </p>
          </Step>
          <Step n={2} title="Edit the budget">
            <p>
              Select the budget → <strong>Edit</strong>. Change the budgeted
              amount. Keep it realistic — a low cap that alerts early is more
              useful than a high one that never fires.
            </p>
          </Step>
          <Step n={3} title="Adjust alert thresholds">
            <p>
              Under <strong>Alerts</strong>, set percentage thresholds (e.g. 80%
              and 100%) and the notification emails. This is how you find out
              before a runaway bill, not after.
            </p>
          </Step>
          <Step n={4} title="Save">
            <p>
              Save. The read-only reader picks up the new numbers on its next
              sync, and the{" "}
              <LinkButton
                href="/aws/budget"
                variant="link"
                className="h-auto p-0 align-baseline"
              >
                budget page
              </LinkButton>{" "}
              reflects them.
            </p>
          </Step>
        </Steps>
      </section>

      <Alert className="border-border/60">
        <IconBellRinging className="size-4" />
        <AlertTitle>If a budget alert fires</AlertTitle>
        <AlertDescription>
          Open the budget page here first to see which service jumped, then use
          Cost Explorer for the day-by-day breakdown. A spike almost always
          traces to a retry storm or an unexpected traffic source hitting a
          route.
        </AlertDescription>
      </Alert>

      <div className="flex justify-start">
        <LinkButton href="/aws/budget" variant="outline">
          <IconArrowLeft className="size-4" />
          Back to Budget &amp; usage
        </LinkButton>
      </div>
    </div>
  )
}
