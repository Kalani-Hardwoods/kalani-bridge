import {
  IconArrowRight,
  IconBrandAws,
  IconMapPin,
  IconReceipt2,
  IconRoute,
  IconShieldLock,
  IconTree,
  IconWebhook,
} from "@tabler/icons-react"

import { LinkButton } from "@/components/link-button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ArchDiagram } from "@/components/arch-diagram"

const highlights = [
  {
    icon: IconWebhook,
    title: "Feature parity, without the vendor",
    body: "Everything WebhookRelay did — public endpoints, transforms, routing, durable retries — rebuilt on AWS primitives you own.",
  },
  {
    icon: IconShieldLock,
    title: "Manual by design",
    body: "Sensitive setup stays in the AWS console by hand. No self-serve user system, no automation with write access. Locked down on purpose.",
  },
  {
    icon: IconReceipt2,
    title: "One read-only robot",
    body: "The only automation identity is a service account that can read the budget and usage — nothing else.",
  },
]

export default function LandingPage() {
  return (
    <div className="dark min-h-svh bg-background text-foreground">
      {/* backdrop */}
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 80% -10%, oklch(0.795 0.184 86.047 / 0.18), transparent 70%), radial-gradient(50% 40% at 0% 0%, oklch(0.681 0.162 75.834 / 0.12), transparent 60%)",
          }}
        />
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <IconTree className="size-5" />
            </div>
            <span className="font-heading text-lg font-semibold">
              Kalani Bridge
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LinkButton href="/login" variant="ghost" size="sm">
              Sign in
            </LinkButton>
            <LinkButton href="/overview" size="sm">
              Open the runbook
              <IconArrowRight className="size-4" />
            </LinkButton>
          </div>
        </header>

        <section className="mx-auto w-full max-w-6xl px-6 pt-12 pb-8 sm:pt-20">
          <Badge
            variant="outline"
            className="mb-6 gap-1.5 border-primary/30 bg-primary/5 py-1 text-primary"
          >
            <IconMapPin className="size-3.5" />
            Waimānalo, Hawaiʻi · us-west-2
          </Badge>
          <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            The webhook bridge that keeps{" "}
            <span className="text-primary">hardwood inventory</span> in sync.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
            Kalani Hardwoods photographs every one-of-a-kind slab in an AppSheet
            app; those boards flow into the Shopify store automatically. This is
            the internal runbook for moving that bridge off WebhookRelay and
            onto AWS — set up once, by hand, then it just runs.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LinkButton href="/overview" size="lg">
              Start the runbook
              <IconArrowRight className="size-4" />
            </LinkButton>
            <LinkButton href="/architecture" size="lg" variant="outline">
              <IconRoute className="size-4" />
              See the architecture
            </LinkButton>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-12">
          <ArchDiagram />
        </section>
      </div>

      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((h) => (
            <Card
              key={h.title}
              className="border-border/60 bg-card/50 transition-colors hover:border-primary/30"
            >
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <h.icon className="size-5" />
                </div>
                <CardTitle className="text-base">{h.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-relaxed">
                  {h.body}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card/40 to-card/40">
          <CardContent className="flex flex-col items-start gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <IconBrandAws className="size-7" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-semibold">
                  Everything you need is in the sidebar.
                </h2>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  AWS account setup, adding teammates, the read-only budget
                  robot, and step-by-step deploys for each service in the
                  bridge.
                </p>
              </div>
            </div>
            <LinkButton href="/overview" size="lg" className="shrink-0">
              Get started
              <IconArrowRight className="size-4" />
            </LinkButton>
          </CardContent>
        </Card>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Internal documentation for Kalani Hardwoods. Not affiliated with AWS,
          Shopify, Google AppSheet, or WebhookRelay.
        </p>
      </section>
    </div>
  )
}
