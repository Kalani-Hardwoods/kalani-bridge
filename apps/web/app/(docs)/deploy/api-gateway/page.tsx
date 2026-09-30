import Link from "next/link"
import {
  IconAlertTriangle,
  IconApi,
  IconArrowRight,
  IconGauge,
  IconInfoCircle,
  IconLock,
} from "@tabler/icons-react"

import { PageHeader } from "@/components/page-header"
import { LinkButton } from "@/components/link-button"
import { Step, Steps } from "@/components/steps"
import { CodeBlock } from "@/components/code-block"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
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
import { Badge } from "@workspace/ui/components/badge"

export const metadata = { title: "API Gateway" }

const routes = [
  {
    method: "POST",
    path: "/hooks/board-created",
    source: "Transloadit",
    auth: "Signature verified",
    detail: "board.created",
  },
  {
    method: "POST",
    path: "/hooks/product-deleted",
    source: "Shopify",
    auth: "HMAC verified",
    detail: "product.deleted",
  },
]

const hmacSketch = `// Shopify signs the RAW body. Verify before anything reaches the bus.
// Runs in the verifier Lambda (payload format 2.0), not an authorizer.
import crypto from "node:crypto"

export function verifyShopifyHmac(event, secret) {
  // Header names arrive lowercased in payload format 2.0.
  const sent = event.headers?.["x-shopify-hmac-sha256"]
  if (!sent) return false

  // Hash the exact bytes Shopify sent — never a re-serialized object.
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body ?? "", "base64")
    : Buffer.from(event.body ?? "", "utf8")

  const digest = crypto
    .createHmac("sha256", secret)
    .update(raw)
    .digest("base64")

  // timingSafeEqual THROWS on length mismatch — compare lengths first,
  // or a junk header turns a 401 into a 500.
  const a = Buffer.from(digest, "utf8")
  const b = Buffer.from(sent, "utf8")
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}`

const verifierSketch = `// Verify → PutEvents → 200. Nothing else: Shopify wants a
// response in ~5s, and the transform Lambda runs off the bus.
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge"

const eb = new EventBridgeClient({})

export const handler = async (event) => {
  if (!verifyShopifyHmac(event, await shopifySecret())) {
    return { statusCode: 401, body: "" }
  }

  await eb.send(new PutEventsCommand({
    Entries: [{
      EventBusName: "kalani-bridge",
      Source: "kalani.bridge",
      DetailType: "product.deleted",
      // Carry the delivery id so the transform can dedupe.
      Detail: JSON.stringify({
        webhookId: event.headers?.["x-shopify-webhook-id"],
        payload: JSON.parse(event.body),
      }),
    }],
  }))

  return { statusCode: 200, body: "" }
}`

const integration = `{
  "IntegrationType": "AWS_PROXY",
  "IntegrationSubtype": "EventBridge-PutEvents",
  "CredentialsArn": "arn:aws:iam::312635943953:role/APIGatewayToEventBridge",
  "RequestParameters": {
    "EventBusName": "kalani-bridge",
    "Source": "kalani.bridge",
    "DetailType": "board.created",
    "Detail": "$request.body"
  }
}`

const throttle = `aws apigatewayv2 update-stage \\
  --api-id <api-id> \\
  --stage-name '$default' \\
  --default-route-settings 'ThrottlingRateLimit=10,ThrottlingBurstLimit=20' \\
  --region us-west-2`

export default function ApiGatewayPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Deploy the bridge"
        icon={IconApi}
        crumbs={[
          { title: "Runbook", href: "/overview" },
          { title: "What to build", href: "/deploy" },
          { title: "API Gateway" },
        ]}
        title="Two public routes, built last"
        description="The front door. An HTTP API with one route per flow. The delete route runs a small verifier Lambda that checks the Shopify HMAC against the raw body before the event reaches the bus. The create route is a direct EventBridge integration — but it is not left open."
      />

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">The two routes</h2>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Route</TableHead>
                <TableHead className="hidden sm:table-cell">Source</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead className="hidden md:table-cell">Emits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((r) => (
                <TableRow key={r.path} className="border-border/50">
                  <TableCell className="font-mono text-xs">
                    <Badge
                      variant="secondary"
                      className="mr-2 font-mono text-[10px]"
                    >
                      {r.method}
                    </Badge>
                    {r.path}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {r.source}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                      {r.auth}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                    {r.detail}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <Alert className="border-destructive/30 bg-destructive/5">
        <IconAlertTriangle className="size-4 text-destructive" />
        <AlertTitle>
          A Lambda authorizer cannot verify a Shopify HMAC
        </AlertTitle>
        <AlertDescription>
          This is the one trap worth reading twice. API Gateway does{" "}
          <strong>not</strong> pass the request body to a Lambda authorizer —
          HTTP APIs and REST APIs alike. The Shopify signature is computed over
          the raw body, so an authorizer has nothing to check. The delete route
          must therefore hit a real Lambda integration that receives the body,
          verify there, and only then call <code>EventBridge:PutEvents</code>{" "}
          itself.
        </AlertDescription>
      </Alert>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">
          How each route is wired
        </h2>
        <Tabs defaultValue="delete" className="w-full">
          <TabsList>
            <TabsTrigger value="delete">Delete · verifier Lambda</TabsTrigger>
            <TabsTrigger value="create">Create · direct to bus</TabsTrigger>
          </TabsList>
          <TabsContent value="delete" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              <code>POST /hooks/product-deleted</code> →{" "}
              <code>kalani-bridge-verify</code> (Lambda proxy, payload format
              2.0) → <code>PutEvents</code>. This function does two things and
              stops: check the signature, put the event on the bus. It never
              talks to AppSheet, so it always answers well inside Shopify&apos;s
              5-second window.
            </p>
            <CodeBlock language="ts" title="verify-hmac.ts" code={hmacSketch} />
            <CodeBlock
              language="ts"
              title="verify-handler.ts"
              code={verifierSketch}
            />
          </TabsContent>
          <TabsContent value="create" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              The create route needs no code: API Gateway calls{" "}
              <code>EventBridge:PutEvents</code> directly using the{" "}
              <code>APIGatewayToEventBridge</code> role. Two conditions before
              you use this shape, though — see the warnings below it.
            </p>
            <CodeBlock
              language="json"
              title="integration.json"
              code={integration}
            />
            <Alert className="border-destructive/30 bg-destructive/5">
              <IconLock className="size-4 text-destructive" />
              <AlertTitle>Don&apos;t leave the create route open</AlertTitle>
              <AlertDescription>
                An unauthenticated create route lets anyone who learns the URL
                set arbitrary photo URLs and flip <code>Ready</code> on a board
                — which the existing bot then pushes live to Shopify. Enable
                Transloadit&apos;s signed notifications and verify the{" "}
                <code>signature</code> field, or put the same verifier Lambda in
                front of this route with a shared secret. Obscurity is not the
                control.
              </AlertDescription>
            </Alert>
            <Alert className="border-border/60">
              <IconInfoCircle className="size-4" />
              <AlertTitle>
                Confirm Transloadit&apos;s content type before trusting{" "}
                <code>$request.body</code>
              </AlertTitle>
              <AlertDescription>
                <code>Detail</code> must be a JSON object. Transloadit posts
                assembly notifications form-encoded, with the assembly JSON
                inside a <code>transloadit</code> field — if that is what your
                account sends, <code>$request.body</code> is not JSON and the
                direct integration fails. Send one real notification and look at
                it first; if it is form-encoded, route create through the
                verifier Lambda too and parse there. Note also that a single{" "}
                <code>PutEvents</code> entry caps at 256 KB — a large assembly
                payload should be trimmed to the fields the transform needs.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </section>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold">Build it</h2>
        <Steps>
          <Step n={1} title="Create an HTTP API">
            <p>
              Console: API Gateway → Create API → <strong>HTTP API</strong> (not
              REST — cheaper and enough here), in us-west-2. HTTP APIs come with
              an auto-deploying <code>$default</code> stage, so there is no
              manual &ldquo;deploy&rdquo; button to hunt for the way there is on
              REST APIs.
            </p>
          </Step>
          <Step n={2} title="Add the create route">
            <p>
              Add <code>POST /hooks/board-created</code> with an EventBridge
              integration emitting <code>board.created</code>, using the{" "}
              <code>APIGatewayToEventBridge</code> role — plus the signature
              check above.
            </p>
          </Step>
          <Step n={3} title="Add the delete route via the verifier Lambda">
            <p>
              Add <code>POST /hooks/product-deleted</code> as a Lambda proxy
              integration pointing at <code>kalani-bridge-verify</code>. Grant
              API Gateway permission to invoke it, and give the function a role
              that allows <code>events:PutEvents</code> on the bridge bus and
              nothing else.
            </p>
          </Step>
          <Step n={4} title="Throttle both routes and turn on access logs">
            <p>
              Public ingest endpoints are also a way to run up a bill. The
              account default is thousands of requests per second; these two
              flows need single digits. Cap the stage, and enable access logging
              to CloudWatch so you can see who called what.
            </p>
            <CodeBlock shell code={throttle} />
          </Step>
          <Step n={5} title="Register the URLs, one flow at a time">
            <p>
              Paste the invoke URLs into Transloadit and Shopify. That final
              paste is what flips traffic off WebhookRelay — do it for create
              first, watch a real board land, then do delete.
            </p>
          </Step>
        </Steps>
      </section>

      <Alert className="border-primary/30 bg-primary/5">
        <IconGauge className="size-4 text-primary" />
        <AlertTitle>Which Shopify secret signs the webhook?</AlertTitle>
        <AlertDescription>
          Webhooks created by hand in Shopify admin are signed with the
          store&apos;s webhook signing secret (Settings → Notifications);
          webhooks created through a custom app are signed with that app&apos;s
          client secret. They are different values, and using the wrong one
          means every single delete returns 401. Confirm which one applies
          before you go looking for a bug in the code.
        </AlertDescription>
      </Alert>

      <Alert className="border-border/60">
        <IconInfoCircle className="size-4" />
        <AlertTitle>Cut over one flow at a time</AlertTitle>
        <AlertDescription>
          Point the create flow at the new URL first and watch a real board go
          through. Only then switch the delete flow. Keep the WebhookRelay
          endpoints alive until both have run clean for a day — the full
          sequence, including how to roll back, is on the{" "}
          <Link
            href="/monitoring"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            monitoring page
          </Link>
          .
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-6">
        <p className="text-sm text-muted-foreground">
          The bridge is complete. Last: host this runbook.
        </p>
        <LinkButton href="/deploy/hosting">
          Next: Hosting this site
          <IconArrowRight className="size-4" />
        </LinkButton>
      </div>
    </div>
  )
}
