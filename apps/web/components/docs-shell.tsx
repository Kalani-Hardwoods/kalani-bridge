"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { IconArrowUpRight, IconTree } from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { Separator } from "@workspace/ui/components/separator"
import { Badge } from "@workspace/ui/components/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { findNav, nav } from "@/lib/nav"

export function DocsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const current = findNav(pathname)

  return (
    <div className="dark min-h-svh bg-background text-foreground">
      <SidebarProvider>
        <Sidebar variant="inset" className="border-border/60">
          <SidebarHeader>
            <Link
              href="/overview"
              className="flex items-center gap-2.5 px-2 py-1.5"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <IconTree className="size-5" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-heading text-sm font-semibold">
                  Kalani Bridge
                </span>
                <span className="text-xs text-muted-foreground">
                  Webhook → AWS runbook
                </span>
              </div>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            {nav.map((section) => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const active = pathname === item.href
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            render={<Link href={item.href} />}
                            isActive={active}
                            tooltip={item.title}
                          >
                            <item.icon className="size-4" />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <Link
              href="/login"
              className="flex items-center justify-between rounded-lg border border-border/60 bg-card/50 px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>Internal access</span>
              <IconArrowUpRight className="size-3.5" />
            </Link>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset className="bg-background">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-1 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:block">
                  <BreadcrumbLink render={<Link href="/overview" />}>
                    Runbook
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{current?.title ?? "Page"}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Badge
              variant="outline"
              className="ml-auto hidden border-primary/30 bg-primary/5 font-mono text-[10px] text-primary md:inline-flex"
            >
              us-west-2 · akahione
            </Badge>
          </header>
          <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
