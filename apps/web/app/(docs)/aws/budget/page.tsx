import {
  IconAlertTriangle,
  IconArrowRight,
  IconExternalLink,
  IconReceipt2,
  IconRefresh,
  IconSettings,
  IconTrendingUp,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-header"
import { LinkButton } from "@/components/link-button"
import { UsageChart } from "@/components/usage-chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/progress"
import { Badge } from "@workspace/ui/components/badge"
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
import { Separator } from "@workspace/ui/components/separator"

export const metadata = { title: "Budget & usage" }

const services = [
  { name: "Lambda", spend: "$1.42", pct: 36 },
  { name: "API Gateway", spend: "$1.08", pct: 27 },
  { name: "EventBridge", spend: "$0.71", pct: 18 },
  { name: "CloudWatch", spend: "$0.49", pct: 12 },
  { name: "SQS", spend: "$0.24", pct: 7 },
]

export default function BudgetPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="AWS foundation"
        icon={IconReceipt2}
        crumbs={[
          { title: "Runbook", href: "/overview" },
          { title: "Budget & usage" },
        ]}
        title="Budget & usage"
        description="A small always-on bridge should cost a few dollars a month. These numbers come from the read-only budget service account. If anything here looks wrong — or you need to change a cap — every card links to exactly where to do it in the AWS console."
      />

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <IconRefresh className="size-3.5" />
        <span>
          Sample figures shown. Live values are fetched via{" "}
          <span className="font-mono">KalaniBudgetReader</span>.
        </span>
        <Badge
          variant="outline"
          className="ml-auto border-primary/30 bg-primary/5 text-primary"
        >
          Last synced: just now
        </Badge>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardDescription>Month to date</CardDescription>
            <CardTitle className="font-heading text-3xl">$3.94</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-primary">
              <IconTrendingUp className="size-3.5" /> +4% vs last month
            </span>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription>Monthly budget cap</CardDescription>
            <CardTitle className="font-heading text-3xl">$25.00</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Alert threshold at 80% ($20.00)
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription>Forecast (month end)</CardDescription>
            <CardTitle className="font-heading text-3xl">$4.30</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Comfortably under cap
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Budget consumed</CardTitle>
          <CardDescription>$3.94 of $25.00 monthly cap</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={16}>
            <ProgressLabel>Utilization</ProgressLabel>
            <ProgressValue />
          </Progress>
          <p className="text-xs text-muted-foreground">
            16% used — you would need a ~6× spike to reach the alert threshold.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Spend over time</CardTitle>
          <CardDescription>Last six months, all services</CardDescription>
        </CardHeader>
        <CardContent>
          <UsageChart />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">By service</h2>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Service</TableHead>
                <TableHead className="w-[120px]">MTD</TableHead>
                <TableHead>Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.name} className="border-border/50">
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono">{s.spend}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full max-w-[160px] overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                      <span className="w-9 text-right font-mono text-xs text-muted-foreground">
                        {s.pct}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <Separator className="bg-border/60" />

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <IconSettings className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-semibold">
            Need to change something?
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          This page is read-only by design. Anything you actually change happens
          in the AWS console — here is the door.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">
                Change the cap or alerts
              </CardTitle>
              <CardDescription>
                Edit the budget amount, thresholds, and notification emails.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LinkButton href="/console/budgets" variant="outline" size="sm">
                How to access in AWS
                <IconArrowRight className="size-4" />
              </LinkButton>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">Cost Explorer</CardTitle>
              <CardDescription>
                Slice spend by service, tag, or day for deeper digging.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="https://us-east-1.console.aws.amazon.com/cost-management/home#/cost-explorer"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Open Cost Explorer
                <IconExternalLink className="size-4" />
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      <Alert className="border-destructive/30 bg-destructive/5">
        <IconAlertTriangle className="size-4 text-destructive" />
        <AlertTitle>Numbers not updating?</AlertTitle>
        <AlertDescription>
          If this page shows stale or zero data, the budget reader likely lost
          access. Confirm the KalaniBudgetReader role still exists and its
          policy is attached — see the{" "}
          <LinkButton
            href="/aws/service-account"
            variant="link"
            className="h-auto p-0 align-baseline"
          >
            service account page
          </LinkButton>
          .
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-6">
        <p className="text-sm text-muted-foreground">
          Foundation done. Time to build the bridge itself.
        </p>
        <LinkButton href="/deploy">
          Next: What to build
          <IconArrowRight className="size-4" />
        </LinkButton>
      </div>
    </div>
  )
}
