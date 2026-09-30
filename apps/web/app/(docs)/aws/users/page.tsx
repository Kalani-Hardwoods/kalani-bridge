import {
  IconArrowRight,
  IconCrown,
  IconInfoCircle,
  IconReceipt2,
  IconRocket,
  IconTool,
  IconUserPlus,
  IconUsersGroup,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-header"
import { LinkButton } from "@/components/link-button"
import { Step, Steps } from "@/components/steps"
import { CodeBlock } from "@/components/code-block"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
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

export const metadata = { title: "Adding people" }

const roles = [
  {
    icon: IconCrown,
    name: "Admins",
    set: "super admin",
    policy: "AdministratorAccess",
    duration: "1 hour",
    tone: "destructive" as const,
    who: "Break-glass only. Creating IAM roles, first-time deploys, anything this runbook marks as manual.",
    keep: "1–2 people max",
  },
  {
    icon: IconRocket,
    name: "Bridge deployer",
    set: "KalaniBridgeDeployer",
    policy: "PowerUserAccess (no IAM write)",
    duration: "4 hours",
    tone: "primary" as const,
    who: "Ships changes to the bridge: updating Lambda code, redeploying API Gateway stages, editing EventBridge rules.",
    keep: "Whoever maintains the bridge",
  },
  {
    icon: IconTool,
    name: "Bridge operator",
    set: "KalaniBridgeOperator",
    policy: "Scoped read + operate",
    duration: "8 hours",
    tone: "primary" as const,
    who: "Day-to-day operations: reading CloudWatch logs, redriving the DLQ, re-running a failed event. No code changes.",
    keep: "On-call / support",
  },
  {
    icon: IconReceipt2,
    name: "Billing viewer",
    set: "KalaniBillingViewer",
    policy: "Billing + ViewOnlyAccess",
    duration: "8 hours",
    tone: "muted" as const,
    who: "Read-only. Checking spend, budgets, and usage without touching any resource.",
    keep: "Anyone who watches cost",
  },
]

export default function AwsUsersPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="AWS foundation"
        icon={IconUsersGroup}
        crumbs={[
          { title: "Runbook", href: "/overview" },
          { title: "Adding people" },
        ]}
        title="Adding people, with the right scope"
        description="Every human is a manually-created IAM Identity Center user assigned to one permission set. These are for people, not automation — the only non-human identity is the read-only budget service account, documented separately."
      />

      <Alert className="border-border/60">
        <IconInfoCircle className="size-4" />
        <AlertTitle>Permission sets, not IAM users</AlertTitle>
        <AlertDescription>
          In Identity Center, a &quot;role&quot; is a{" "}
          <strong>permission set</strong> assigned to a user for the akahione
          account. Grant the narrowest set that lets someone do their job; reach
          for <em>Admins</em> only when a task truly needs it.
        </AlertDescription>
      </Alert>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">
          The four permission sets
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {roles.map((r) => (
            <Card
              key={r.name}
              className="flex flex-col border-border/60 bg-card/50"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div
                    className={
                      r.tone === "destructive"
                        ? "flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
                        : r.tone === "muted"
                          ? "flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                          : "flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
                    }
                  >
                    <r.icon className="size-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] text-muted-foreground"
                  >
                    {r.duration} session
                  </Badge>
                </div>
                <CardTitle className="pt-2 text-base">{r.name}</CardTitle>
                <CardDescription className="font-mono text-xs">
                  set: {r.set}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground">{r.who}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {r.policy}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Typical holders: {r.keep}
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">
          Naming conventions
        </h2>
        <p className="text-sm text-muted-foreground">
          Consistent names make the assignment screen readable at a glance.
        </p>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Thing</TableHead>
                <TableHead>Convention</TableHead>
                <TableHead className="hidden sm:table-cell">Example</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-border/50">
                <TableCell>Username</TableCell>
                <TableCell className="text-muted-foreground">
                  first.last
                </TableCell>
                <TableCell className="hidden font-mono text-xs sm:table-cell">
                  nate.bass
                </TableCell>
              </TableRow>
              <TableRow className="border-border/50">
                <TableCell>Permission set</TableCell>
                <TableCell className="text-muted-foreground">
                  Kalani + purpose (PascalCase)
                </TableCell>
                <TableCell className="hidden font-mono text-xs sm:table-cell">
                  KalaniBridgeOperator
                </TableCell>
              </TableRow>
              <TableRow className="border-border/50">
                <TableCell>Group</TableCell>
                <TableCell className="text-muted-foreground">
                  plural role name
                </TableCell>
                <TableCell className="hidden font-mono text-xs sm:table-cell">
                  BridgeOperators
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold">
          Adding a new user
        </h2>
        <Steps>
          <Step n={1} title="Open the Identity Center users list">
            <p>
              From the console, go to{" "}
              <strong>IAM Identity Center → Users</strong>. Make sure the region
              selector still reads a global service — Identity Center is not
              region-bound, but the account resources are in us-west-2.
            </p>
          </Step>
          <Step n={2} title="Create the user">
            <p>
              Choose <strong>Add user</strong>. Use the <code>first.last</code>{" "}
              username convention and the person&apos;s real email. Send the
              email invitation — the user sets their own password and MFA. You
              never type or see their password.
            </p>
          </Step>
          <Step n={3} title="Assign the account and permission set">
            <p>
              Under <strong>AWS accounts</strong>, select{" "}
              <strong>akahione (312635943953)</strong>, then attach the single
              permission set that matches their job from the table above. Resist
              stacking multiple sets on one person.
            </p>
          </Step>
          <Step n={4} title="Confirm the session duration">
            <p>
              Shorter is safer. Admins get 1 hour; everyday roles get 4–8. The
              user re-authenticates through the portal when a session expires.
            </p>
          </Step>
          <Step n={5} title="Verify from the portal">
            <p>
              Have the user sign in at the access portal and confirm they see
              only the akahione account with the expected role tile.
            </p>
            <CodeBlock
              shell
              title="access portal"
              code={"open https://d-90667b0030.awsapps.com/start/#/"}
            />
          </Step>
        </Steps>
      </section>

      <Alert className="border-primary/30 bg-primary/5">
        <IconUserPlus className="size-4 text-primary" />
        <AlertTitle>Off-boarding is the same list, in reverse</AlertTitle>
        <AlertDescription>
          When someone leaves, remove their user in Identity Center. Because
          there are no standalone IAM users or shared passwords, that one action
          fully revokes their access.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-6">
        <p className="text-sm text-muted-foreground">
          People are covered. Now the one robot we allow.
        </p>
        <LinkButton href="/aws/service-account">
          Next: Budget service account
          <IconArrowRight className="size-4" />
        </LinkButton>
      </div>
    </div>
  )
}
