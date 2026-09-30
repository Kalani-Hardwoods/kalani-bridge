import {
  IconArrowRight,
  IconCamera,
  IconFunction,
  IconGauge,
  IconInfoCircle,
  IconKey,
  IconRepeat,
  IconTrash,
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

export const metadata = { title: "Lambda" }

const config = [
  { k: "Function name", v: "kalani-bridge" },
  { k: "Runtime", v: "Node.js 22.x" },
  { k: "Architecture", v: "arm64" },
  { k: "Memory", v: "256 MB" },
  { k: "Timeout", v: "30s" },
  { k: "Reserved concurrency", v: "5" },
  { k: "Execution role", v: "KalaniBridgeLambdaRole" },
  { k: "Log retention", v: "30 days" },
  { k: "Region", v: "us-west-2" },
]

const routerSketch = `// The transform function fans out on the EventBridge detail-type.
// (HMAC verification happens earlier, in kalani-bridge-verify.)
// Full source lives in the locked-down bridge repo — this is the shape.
export const handler = async (event) => {
  switch (event["detail-type"]) {
    case "board.created":
      return handleBoardCreated(event.detail)
    case "product.deleted":
      return handleProductDeleted(event.detail)
    default:
      // Do NOT throw. An unknown detail-type will never become known by
      // being retried 185 times — it just burns the retry budget and
      // lands a poison message in the DLQ. Log it and drop it.
      console.error({ msg: "unhandled detail-type", event })
      return
  }
}`

const createHandler = `// Reshape Transloadit "assembly complete" -> AppSheet row edit.
// Edit is naturally idempotent: the same URLs written twice is a no-op.
async function handleBoardCreated(detail) {
  const rows = [{
    "Board ID": detail.fields.boardId,
    "Photo URLs": detail.results.map((r) => r.ssl_url).join(","),
    "Ready": true,
  }]
  await appsheet("Boards", "Edit", rows) // existing bot pushes to Shopify
}`

const deleteHandler = `// Shopify products/delete -> AppSheet row delete (cascades).
// Delete matches on the table's KEY column. If the key is "Board ID",
// passing a Shopify product id deletes nothing — and reports success.
async function handleProductDeleted(detail) {
  const boardId = await findBoardByShopifyId(detail.payload.id)

  // Already gone: a duplicate delivery, or a delete we already replayed.
  // This is success, not an error — throwing here would retry forever
  // and eventually park a no-op in the DLQ.
  if (!boardId) {
    console.info({ msg: "board already absent", shopifyId: detail.payload.id })
    return
  }

  await appsheet("Boards", "Delete", [{ "Board ID": boardId }])
}`

const appsheetClient = `// The AppSheet API answers 200 even when rows fail. A bare
// res.ok check reports success on every failed delete you will ever have.
async function appsheet(table, action, rows) {
  const { appId, accessKey } = await creds()

  const res = await fetch(
    \`https://api.appsheet.com/api/v2/apps/\${appId}/tables/\${table}/Action\`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ApplicationAccessKey: accessKey,
      },
      body: JSON.stringify({ Action: action, Properties: {}, Rows: rows }),
      signal: AbortSignal.timeout(10_000), // never hang out the full 30s
    }
  )

  const body = await res.text()
  if (!res.ok) throw new Error(\`appsheet \${res.status}: \${body}\`)

  // Inspect the payload, not just the status line.
  const parsed = body ? JSON.parse(body) : {}
  const failures = parsed.Failures ?? parsed.failures
  if (failures?.length) throw new Error(\`appsheet rows failed: \${body}\`)

  return parsed
}`

const secretCache = `// Fetch once per container, not once per invocation — but with a TTL,
// or a warm container keeps using a rotated key until it is recycled.
let cached = null

async function creds() {
  if (cached && Date.now() - cached.at < 15 * 60_000) return cached.value

  const { SecretString } = await sm.send(
    new GetSecretValueCommand({ SecretId: "kalani/appsheet" })
  )
  cached = { value: JSON.parse(SecretString), at: Date.now() }
  return cached.value
}`

export default function LambdaPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Deploy the bridge"
        icon={IconFunction}
        crumbs={[
          { title: "Runbook", href: "/overview" },
          { title: "What to build", href: "/deploy" },
          { title: "Lambda" },
        ]}
        title="The transform, in one function"
        description="This is where the old WebhookRelay Function logic lives now. One Lambda, two handlers, chosen by the event's detail-type. Its only job is to reshape each payload into the AppSheet API shape and call it — signature checking belongs to the separate verifier function at the front door, so the only thing holding AppSheet's key sits behind the bus."
      />

      <Alert className="border-border/60">
        <IconInfoCircle className="size-4" />
        <AlertTitle>Sketches, not the real source</AlertTitle>
        <AlertDescription>
          The snippets below show the <em>shape</em> of the handlers so the
          console setup makes sense. The deployable source lives in a separate,
          locked-down repository.
        </AlertDescription>
      </Alert>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">Configuration</h2>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[220px]">Setting</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.map((c) => (
                <TableRow key={c.k} className="border-border/50">
                  <TableCell className="text-muted-foreground">{c.k}</TableCell>
                  <TableCell className="font-mono text-sm">{c.v}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">The router</h2>
        <p className="text-sm text-muted-foreground">
          One entry point dispatches on <code>detail-type</code>. The two
          handlers are the create and delete transforms.
        </p>
        <CodeBlock language="ts" title="index.ts" code={routerSketch} />
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">The two handlers</h2>
        <Tabs defaultValue="create" className="w-full">
          <TabsList>
            <TabsTrigger value="create">
              <IconCamera className="size-4" />
              board.created
            </TabsTrigger>
            <TabsTrigger value="delete">
              <IconTrash className="size-4" />
              product.deleted
            </TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="mt-4">
            <CodeBlock
              language="ts"
              title="board-created.ts"
              code={createHandler}
            />
          </TabsContent>
          <TabsContent value="delete" className="mt-4">
            <CodeBlock
              language="ts"
              title="product-deleted.ts"
              code={deleteHandler}
            />
          </TabsContent>
        </Tabs>
      </section>

      <Alert className="border-destructive/30 bg-destructive/5">
        <IconRepeat className="size-4 text-destructive" />
        <AlertTitle>Assume every event arrives twice</AlertTitle>
        <AlertDescription>
          EventBridge delivers at least once, Shopify re-sends webhooks it
          thinks failed, and any replay from the DLQ is a deliberate second
          delivery. Both handlers therefore have to be safe to run again on the
          same event. The create path gets this for free — writing the same
          photo URLs twice changes nothing. The delete path does not: deleting a
          row that is already gone must be treated as success, or the retry
          budget burns down on an event that had already succeeded.
        </AlertDescription>
      </Alert>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">
          Calling AppSheet safely
        </h2>
        <p className="text-sm text-muted-foreground">
          One detail decides whether this bridge fails loudly or silently: the
          AppSheet API returns <code>200 OK</code> with per-row failures
          reported in the response body. A handler that only checks the status
          code will report a clean run while every delete quietly does nothing.
        </p>
        <CodeBlock language="ts" title="appsheet.ts" code={appsheetClient} />
      </section>

      <Alert className="border-primary/30 bg-primary/5">
        <IconKey className="size-4 text-primary" />
        <AlertTitle>The AppSheet key comes from Secrets Manager</AlertTitle>
        <AlertDescription>
          Never bake the AppSheet API key into the function or an env var in
          plaintext. Store it at <code>kalani/appsheet-*</code> and read it at
          runtime — the execution role already allows exactly that secret and
          nothing else. Cache it per container so you are not paying for a
          Secrets Manager call on every webhook, but cache it with a TTL: a
          container that lives for hours will happily keep using a key you
          rotated.
        </AlertDescription>
      </Alert>

      <CodeBlock language="ts" title="creds.ts" code={secretCache} />

      <Alert className="border-primary/30 bg-primary/5">
        <IconGauge className="size-4 text-primary" />
        <AlertTitle>Cap the concurrency at 5</AlertTitle>
        <AlertDescription>
          Reserved concurrency is doing two jobs here. It keeps a burst of
          webhooks from stampeding the AppSheet API and tripping its rate limit
          — which would turn a busy afternoon into a queue full of dead letters
          — and it puts a hard ceiling on what a runaway loop or a hostile
          caller can spend. On a project with a budget page, an unbounded
          function is the open end.
        </AlertDescription>
      </Alert>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold">Deploy steps</h2>
        <Steps>
          <Step n={1} title="Create the function">
            <p>
              Console: Lambda → Create function → Author from scratch. Use the
              name, runtime, and arm64 architecture from the table, and pick the
              existing <code>KalaniBridgeLambdaRole</code> as the execution
              role.
            </p>
          </Step>
          <Step n={2} title="Store the AppSheet secret">
            <p>Create the secret once; the function reads it on cold start.</p>
            <CodeBlock
              shell
              code={
                'aws secretsmanager create-secret \\\n  --name kalani/appsheet \\\n  --secret-string \'{"appId":"...","accessKey":"..."}\' \\\n  --region us-west-2'
              }
            />
          </Step>
          <Step n={3} title="Create the log group with a retention policy">
            <p>
              If Lambda creates its own log group on first invocation, that
              group keeps logs forever. Create it yourself first, set retention,
              and leave <code>logs:CreateLogGroup</code> out of the role so it
              cannot be recreated without one.
            </p>
            <CodeBlock
              shell
              code={
                "aws logs create-log-group \\\n  --log-group-name /aws/lambda/kalani-bridge \\\n  --region us-west-2\n\naws logs put-retention-policy \\\n  --log-group-name /aws/lambda/kalani-bridge \\\n  --retention-in-days 30 \\\n  --region us-west-2"
              }
            />
          </Step>
          <Step n={4} title="Set reserved concurrency">
            <p>Bound the blast radius before anything can invoke it.</p>
            <CodeBlock
              shell
              code={
                "aws lambda put-function-concurrency \\\n  --function-name kalani-bridge \\\n  --reserved-concurrent-executions 5 \\\n  --region us-west-2"
              }
            />
          </Step>
          <Step n={5} title="Ship the code, leave it uninvoked">
            <p>
              Deploy from the bridge repo&apos;s pipeline. Nothing calls it yet
              — EventBridge gets wired next. Test it before it is wired: invoke
              it by hand with a saved EventBridge envelope against a scratch
              AppSheet table, and confirm a delete of an already-deleted row
              returns cleanly rather than throwing.
            </p>
          </Step>
        </Steps>
      </section>

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-6">
        <p className="text-sm text-muted-foreground">
          The logic is deployed. Now route events to it.
        </p>
        <LinkButton href="/deploy/eventbridge">
          Next: EventBridge
          <IconArrowRight className="size-4" />
        </LinkButton>
      </div>
    </div>
  )
}
