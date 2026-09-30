import {
  IconArrowRight,
  IconCloudUpload,
  IconGitBranch,
  IconLock,
  IconReceipt2,
  IconServer,
  IconShieldCheck,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-header"
import { LinkButton } from "@/components/link-button"
import { Step, Steps } from "@/components/steps"
import { CodeBlock } from "@/components/code-block"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item"

export const metadata = { title: "Hosting this site" }

export default function HostingPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Deploy the bridge"
        icon={IconCloudUpload}
        crumbs={[
          { title: "Runbook", href: "/overview" },
          { title: "What to build", href: "/deploy" },
          { title: "Hosting this site" },
        ]}
        title="Hosting this runbook on AWS"
        description="This documentation app is deliberately tiny: a Next.js site that renders these pages and reads a little budget data. It runs separately from the bridge, in its own repo, and gets exactly one AWS capability — the read-only budget role."
      />

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">The shape of it</h2>
        <div className="space-y-3">
          <Item variant="outline" className="border-border/60">
            <ItemMedia variant="icon">
              <IconServer className="size-5 text-primary" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Compute: AWS App Runner</ItemTitle>
              <ItemDescription>
                A container from this repo, scaled to near-zero. Amplify Hosting
                or ECS Fargate work equally well — the only requirement is an
                attachable IAM role.
              </ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="outline" className="border-border/60">
            <ItemMedia variant="icon">
              <IconShieldCheck className="size-5 text-primary" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Identity: assumes KalaniBudgetReader</ItemTitle>
              <ItemDescription>
                The service&apos;s instance role assumes the read-only budget
                role. The AWS SDK gets temporary credentials automatically — no
                keys in the container.
              </ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="outline" className="border-border/60">
            <ItemMedia variant="icon">
              <IconLock className="size-5 text-primary" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Access: internal only</ItemTitle>
              <ItemDescription>
                Front it with your auth of choice (the login page here is a
                scaffold). This is an internal tool — it should not be publicly
                indexable.
              </ItemDescription>
            </ItemContent>
          </Item>
        </div>
      </section>

      <Alert className="border-primary/30 bg-primary/5">
        <IconReceipt2 className="size-4 text-primary" />
        <AlertTitle>The only thing this site can touch in AWS</AlertTitle>
        <AlertDescription>
          Its role assumes <code>KalaniBudgetReader</code> and nothing else. It
          cannot see or change the bridge. If the site were fully compromised,
          the worst case is exposure of read-only cost figures.
        </AlertDescription>
      </Alert>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold">Deploy steps</h2>
        <Steps>
          <Step n={1} title="Keep it in its own repo">
            <p>
              This app is separate from the bridge repositories. It holds no
              bridge code and no write credentials.
            </p>
          </Step>
          <Step n={2} title="Create the App Runner service in us-west-2">
            <p>
              Connect the repo (or push an image to ECR) and let App Runner
              build from the Dockerfile. Health check the root path.
            </p>
          </Step>
          <Step n={3} title="Give it an instance role that assumes the reader">
            <p>
              The instance role needs only permission to assume{" "}
              <code>KalaniBudgetReader</code>:
            </p>
            <CodeBlock
              language="json"
              title="instance-role-inline.json"
              code={`{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "sts:AssumeRole",
    "Resource": "arn:aws:iam::312635943953:role/KalaniBudgetReader"
  }]
}`}
            />
          </Step>
          <Step n={4} title="Set the region and role ARN as config">
            <p>
              Non-secret configuration only — the region and the role ARN to
              assume. Credentials are never configured; they are fetched at
              runtime.
            </p>
            <CodeBlock
              shell
              title="app runner env"
              code={
                "AWS_REGION=us-west-2\nBUDGET_READER_ROLE_ARN=arn:aws:iam::312635943953:role/KalaniBudgetReader"
              }
            />
          </Step>
          <Step n={5} title="Put it behind internal auth">
            <p>
              Wire real authentication into the login scaffold (Cognito, an IdP,
              or an ALB auth rule), then share the URL internally.
            </p>
          </Step>
        </Steps>
      </section>

      <Alert className="border-border/60">
        <IconGitBranch className="size-4" />
        <AlertTitle>Separation of concerns, on purpose</AlertTitle>
        <AlertDescription>
          Bridge code and write permissions live in locked-down repos and roles.
          This site lives on its own with a read-only view. Neither can escalate
          into the other.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-6">
        <p className="text-sm text-muted-foreground">
          That&apos;s the whole migration. Back to the top?
        </p>
        <LinkButton href="/overview" variant="outline">
          Return to overview
          <IconArrowRight className="size-4" />
        </LinkButton>
      </div>
    </div>
  )
}
