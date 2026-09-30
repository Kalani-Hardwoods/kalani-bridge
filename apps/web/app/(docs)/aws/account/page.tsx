import {
  IconArrowRight,
  IconBuildingBank,
  IconExternalLink,
  IconId,
  IconMail,
  IconMapPin,
  IconShieldCheck,
  IconUserShield,
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
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item"
import { Badge } from "@workspace/ui/components/badge"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

export const metadata = { title: "AWS account & region" }

const account = [
  { icon: IconId, label: "Account name", value: "akahione" },
  { icon: IconId, label: "Account ID", value: "312635943953", mono: true },
  { icon: IconMail, label: "Root email", value: "akahione597@gmail.com" },
  { icon: IconMapPin, label: "Preferred region", value: "us-west-2 (Oregon)" },
]

export default function AwsAccountPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="AWS foundation"
        icon={IconBuildingBank}
        crumbs={[
          { title: "Runbook", href: "/overview" },
          { title: "Account & region" },
        ]}
        title="The akahione account"
        description="One AWS account holds the whole bridge. Access is managed through IAM Identity Center — no long-lived console passwords handed around, no IAM users for people."
      />

      <section className="grid gap-4 sm:grid-cols-2">
        {account.map((a) => (
          <Item key={a.label} variant="outline" className="border-border/60">
            <ItemMedia variant="icon">
              <a.icon className="size-5" />
            </ItemMedia>
            <ItemContent>
              <ItemDescription>{a.label}</ItemDescription>
              <ItemTitle className={a.mono ? "font-mono" : undefined}>
                {a.value}
              </ItemTitle>
            </ItemContent>
          </Item>
        ))}
      </section>

      <Alert className="border-primary/30 bg-primary/5">
        <IconMapPin className="size-4 text-primary" />
        <AlertTitle>Always build in us-west-2</AlertTitle>
        <AlertDescription>
          Kalani is based in Hawaiʻi, so <strong>us-west-2 (Oregon)</strong> is
          the closest low-latency region. Create every resource — API Gateway,
          EventBridge, Lambda, SQS — there. Mixing regions is the most common
          way these pieces silently fail to see each other.
        </AlertDescription>
      </Alert>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">
          IAM Identity Center
        </h2>
        <p className="text-sm text-muted-foreground">
          This is the front door for every human. Sign-in, roles, and adding
          teammates all happen here.
        </p>
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconShieldCheck className="size-5 text-primary" />
              Access portal
            </CardTitle>
            <CardDescription>
              Bookmark this. It is where people log in to reach the console.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <code className="font-mono text-sm break-all text-foreground/90">
                https://d-90667b0030.awsapps.com/start/#/
              </code>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                nativeButton={false}
                render={
                  <a
                    href="https://d-90667b0030.awsapps.com/start/#/"
                    target="_blank"
                    rel="noreferrer noopener"
                  />
                }
              >
                Open portal
                <IconExternalLink className="size-4" />
              </Button>
            </div>
            <Separator className="bg-border/60" />
            <Item className="p-0">
              <ItemMedia variant="icon">
                <IconUserShield className="size-5 text-primary" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="flex items-center gap-2">
                  super admin
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                    AdministratorAccess
                  </Badge>
                </ItemTitle>
                <ItemDescription>
                  The existing permission set with full administrator access. It
                  is already assigned to <strong>nate.bass</strong>. Use it only
                  for the manual setup work in this runbook.
                </ItemDescription>
              </ItemContent>
            </Item>
          </CardContent>
        </Card>
      </section>

      <Alert className="border-destructive/30 bg-destructive/5">
        <IconShieldCheck className="size-4 text-destructive" />
        <AlertTitle>Treat AdministratorAccess as a scalpel</AlertTitle>
        <AlertDescription>
          Full admin is needed to create roles and deploy services, but it
          should not be anyone&apos;s day-to-day identity. The next page defines
          narrower roles for everyday work, so admin is reached for only when a
          task genuinely needs it.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-6">
        <p className="text-sm text-muted-foreground">
          Need to add someone, or decide which role they get?
        </p>
        <LinkButton href="/aws/users">
          Next: Adding people
          <IconArrowRight className="size-4" />
        </LinkButton>
      </div>
    </div>
  )
}
