import Link from "next/link"
import {
  IconArrowLeft,
  IconLock,
  IconMail,
  IconShieldLock,
  IconTree,
} from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"

export const metadata = { title: "Sign in" }

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-primary/10 lg:block">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 30% 20%, oklch(0.852 0.199 91.936 / 0.35), transparent 70%), radial-gradient(50% 50% at 90% 90%, oklch(0.681 0.162 75.834 / 0.25), transparent 70%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <IconTree className="size-5" />
            </div>
            <span className="font-heading text-lg font-semibold text-foreground">
              Kalani Bridge
            </span>
          </Link>
          <div>
            <h1 className="max-w-md font-heading text-3xl font-semibold tracking-tight text-balance">
              Internal runbook for the AppSheet → Shopify webhook bridge.
            </h1>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              Sign in to view setup guides, deploy steps, and live budget
              figures for the Kalani Hardwoods AWS bridge.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Waimānalo, Hawaiʻi · us-west-2
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <IconTree className="size-5" />
              </div>
              <span className="font-heading text-lg font-semibold">
                Kalani Bridge
              </span>
            </Link>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                Sign in
              </h2>
              <Badge variant="outline" className="text-[10px]">
                Internal
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Use your organization account to continue.
            </p>
          </div>

          <form className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <div className="relative">
                  <IconMail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@kalanihardwoods.com"
                    className="pl-9"
                    disabled
                  />
                </div>
              </Field>
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <span className="text-xs text-muted-foreground">Forgot?</span>
                </div>
                <div className="relative">
                  <IconLock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    disabled
                  />
                </div>
                <FieldDescription>
                  Access is provisioned manually in IAM Identity Center.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <Button type="button" className="w-full" disabled>
              Continue
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            <Button type="button" variant="outline" className="w-full" disabled>
              <IconShieldLock className="size-4" />
              Continue with SSO
            </Button>
          </form>

          <Alert className="border-primary/30 bg-primary/5">
            <IconShieldLock className="size-4 text-primary" />
            <AlertTitle>Scaffold only</AlertTitle>
            <AlertDescription>
              This form is intentionally non-functional. Authentication will be
              wired up manually — see{" "}
              <Link
                href="/deploy/hosting"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Hosting this site
              </Link>
              .
            </AlertDescription>
          </Alert>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconArrowLeft className="size-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
