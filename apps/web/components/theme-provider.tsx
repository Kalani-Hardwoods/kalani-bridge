"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * The site does not expose a dark-mode toggle. The root document is forced to a
 * neutral light base; individual pages opt into the darker palette by wrapping
 * their content in an element with the `dark` class (see globals.css). This keeps
 * theming explicit and per-page, per the project design.
 */
function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
