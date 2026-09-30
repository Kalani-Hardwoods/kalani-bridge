import * as React from "react"
import Link from "next/link"
import type { Route } from "next"

import { Button } from "@workspace/ui/components/button"

type ButtonProps = React.ComponentProps<typeof Button>

type LinkButtonProps = Omit<ButtonProps, "render"> & {
  href: Route
  children: React.ReactNode
}

/**
 * A Button rendered as a Next.js Link. The base-ui Button uses a `render` prop
 * for polymorphism (instead of shadcn's `asChild`), so this wraps that pattern.
 */
export function LinkButton({ href, children, ...props }: LinkButtonProps) {
  return (
    <Button {...props} nativeButton={false} render={<Link href={href} />}>
      {children}
    </Button>
  )
}
