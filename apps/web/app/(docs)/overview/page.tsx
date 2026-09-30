import Link from "next/link"
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCamera,
  IconCircleCheck,
  IconInfoCircle,
  IconLayoutDashboard,
  IconTrash,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-header"
import { ArchDiagram } from "@/components/arch-diagram"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { LinkButton } from "@/components/link-button"
import { Separator } from "@workspace/ui/components/separator"

export const metadata = { title: "Overview" }

const flows = [
  {
    icon: IconCamera,
    tag: "Flow 1 · create",
    title: "Board creation",
    body: 'A Transloadit "assembly complete" callback carries the finished S3 photo URLs. The bridge writes those URLs and a ready flag onto the AppSheet row; the existing bot then pushes the product to Shopify.',
    tone: "primary" as const,
  },
  {
    icon: IconTrash,
    tag: "Flow 2 · delete",
    title: "Product delete (cascade)",
    body: "A Shopify products/delete webhook removes the matching AppSheet row, which cascades deletes across related tables. This path is HMAC-verified and protected by a dead-letter queue.",
    tone: "destructive" as const,
  },
]

export default function OverviewPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Start here"
        icon={IconLayoutDashboard}
        title="The Kalani webhook bridge"
        description="We are replacing WebhookRelay with an AWS-native ingest path for the two inbound flows that keep AppSheet and Shopify in sync. This runbook is the single place to set it up — and to find things later without digging through the AWS console."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { k: "Inbound flows", v: "2", d: "create + delete" },
          { k: "Region", v: "us-west-2", d: "closest to Hawaiʻi" },
          { k: "Automation identities", v: "1", d: "read-only budget" },
        ].map((s) => (
          <Card key={s.k} className="border-border/60 bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription>{s.k}</CardDescription>
              <CardTitle className="font-heading text-3xl">{s.v}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {s.d}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">The two flows</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {flows.map((f) => (
            <Card key={f.title} className="border-border/60 bg-card/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={
                      f.tone === "primary"
                        ? "flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
                        : "flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
                    }
                  >
                    <f.icon className="size-5" />
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className="mb-1 border-border/60 font-mono text-[10px] uppercase"
                    >
                      {f.tag}
                    </Badge>
                    <CardTitle className="text-base">{f.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-relaxed">
                  {f.body}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">
          The path, end to end
        </h2>
        <ArchDiagram />
        <p className="text-sm text-muted-foreground">
          Want the reasoning behind each hop — and why EventBridge sits in the
          middle instead of a direct API Gateway → Lambda wire?{" "}
          <Link
            href="/architecture"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Read the architecture breakdown
          </Link>
          .
        </p>
      </section>

      <Separator className="bg-border/60" />

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">
          Ground rules for this project
        </h2>
        <div className="grid gap-3">
          <Alert className="border-primary/30 bg-primary/5">
            <IconCircleCheck className="size-4 text-primary" />
            <AlertTitle>Set up manually, run automatically.</AlertTitle>
            <AlertDescription>
              Every sensitive step — creating IAM roles, deploying services,
              issuing keys — is done by a human in the AWS console. Once it is
              done, the bridge runs on its own with no ongoing manual work.
            </AlertDescription>
          </Alert>
          <Alert className="border-border/60">
            <IconInfoCircle className="size-4" />
            <AlertTitle>This site is documentation, not the bridge.</AlertTitle>
            <AlertDescription>
              The AWS service code (API Gateway, Lambda, EventBridge) lives in
              separate, locked-down repositories. This app only documents the
              setup and reads a little budget data. See{" "}
              <Link
                href="/deploy/hosting"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Hosting this site
              </Link>
              .
            </AlertDescription>
          </Alert>
          <Alert className="border-destructive/30 bg-destructive/5">
            <IconAlertTriangle className="size-4 text-destructive" />
            <AlertTitle>No self-serve accounts.</AlertTitle>
            <AlertDescription>
              There is no dynamic user system. People are added by hand in IAM
              Identity Center. The only non-human identity is the read-only
              budget service account.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/40 p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-heading text-lg font-semibold">
              Recommended reading order
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Architecture → AWS account → add people → budget robot → deploy
              each service.
            </p>
          </div>
          <LinkButton href="/architecture">
            Next: Architecture
            <IconArrowRight className="size-4" />
          </LinkButton>
        </div>
      </section>
    </div>
  )
}
