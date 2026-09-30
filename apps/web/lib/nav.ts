import type { Icon } from "@tabler/icons-react"
import type { Route } from "next"
import {
  IconActivityHeartbeat,
  IconAlertTriangle,
  IconApi,
  IconArrowsSplit,
  IconBuildingBank,
  IconCloudUpload,
  IconFunction,
  IconKey,
  IconLayoutDashboard,
  IconMailbox,
  IconReceipt2,
  IconRoute,
  IconServer2,
  IconShieldLock,
  IconUsersGroup,
  IconWebhook,
} from "@tabler/icons-react"

export type NavItem = {
  title: string
  href: Route
  icon: Icon
  description?: string
}

export type NavSection = {
  label: string
  items: NavItem[]
}

export const nav: NavSection[] = [
  {
    label: "Start here",
    items: [
      {
        title: "Overview",
        href: "/overview",
        icon: IconLayoutDashboard,
        description: "What this bridge is and why it exists.",
      },
      {
        title: "Architecture",
        href: "/architecture",
        icon: IconRoute,
        description: "The end-to-end ingest path, component by component.",
      },
      {
        title: "Leaving WebhookRelay",
        href: "/webhookrelay",
        icon: IconWebhook,
        description: "What WebhookRelay did, and its AWS equivalent.",
      },
    ],
  },
  {
    label: "AWS foundation",
    items: [
      {
        title: "Account & region",
        href: "/aws/account",
        icon: IconBuildingBank,
        description: "The akahione account and us-west-2.",
      },
      {
        title: "Adding people",
        href: "/aws/users",
        icon: IconUsersGroup,
        description: "IAM Identity Center users, roles, and naming.",
      },
      {
        title: "Budget service account",
        href: "/aws/service-account",
        icon: IconKey,
        description: "The one read-only automation identity.",
      },
      {
        title: "Budget & usage",
        href: "/aws/budget",
        icon: IconReceipt2,
        description: "Live spend, caps, and where to change them.",
      },
    ],
  },
  {
    label: "Deploy the bridge",
    items: [
      {
        title: "What to build",
        href: "/deploy",
        icon: IconServer2,
        description: "Every AWS component, in build order.",
      },
      {
        title: "API Gateway",
        href: "/deploy/api-gateway",
        icon: IconApi,
        description: "Two public routes, HMAC on delete.",
      },
      {
        title: "EventBridge",
        href: "/deploy/eventbridge",
        icon: IconArrowsSplit,
        description: "Bus, rules, retries, fan-out.",
      },
      {
        title: "Lambda",
        href: "/deploy/lambda",
        icon: IconFunction,
        description: "The payload transformation, two handlers.",
      },
      {
        title: "Dead-letter queue",
        href: "/deploy/dlq",
        icon: IconMailbox,
        description: "SQS safety net on the delete path.",
      },
      {
        title: "IAM roles",
        href: "/deploy/iam-roles",
        icon: IconShieldLock,
        description: "The three least-privilege service roles.",
      },
      {
        title: "Hosting this site",
        href: "/deploy/hosting",
        icon: IconCloudUpload,
        description: "How the docs app itself runs on AWS.",
      },
    ],
  },
  {
    label: "Make it survive",
    items: [
      {
        title: "Gotchas",
        href: "/hardening",
        icon: IconAlertTriangle,
        description: "The traps in this design, and how each is closed.",
      },
      {
        title: "Monitoring",
        href: "/monitoring",
        icon: IconActivityHeartbeat,
        description: "Alarms, log retention, and the cutover checklist.",
      },
    ],
  },
]

export const flatNav: NavItem[] = nav.flatMap((section) => section.items)

export function findNav(href: string): NavItem | undefined {
  return flatNav.find((item) => item.href === href)
}
