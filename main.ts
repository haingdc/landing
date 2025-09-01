import { Hono } from "hono";
import { metrics } from "npm:@opentelemetry/api@1";
import { trimTrailingSlash } from "hono/trailing-slash";
import { serveStatic } from "hono/deno";
import { createClient, type Client } from "@libsql/client";

const meter = metrics.getMeter("Viet-300-words", "1.0.0");
// Create some metrics
const requestCounter = meter.createCounter("http_requests_total", {
  description: "Total number of HTTP requests",
});

let db: Client;
try {
  db = createClient({
    url: Deno.env.get("TURSO_URL")!,
    syncUrl: Deno.env.get("TURSO_SYNC_URL"),
    authToken: Deno.env.get("TURSO_AUTH_TOKEN"),
    syncInterval: Number(Deno.env.get("TURSO_SYNC_INTERVAL") || 3) ,
  });
} catch (err) {
  console.log("DB init error", err);
  Deno.exit(1);
}

const app = new Hono({ strict: true });
app.use(trimTrailingSlash());

app.use("/*", serveStatic({ root: "./public" }));

app.use(
  "/ui/*",
  serveStatic({
    root: "./ui",
    onNotFound: (_path, context) => {
      context.text("Find not found", 404);
    },
    rewriteRequestPath: (path) => path.replace("/ui", ""),
  }),
);

app.get("/api/dayrecord", async (c) => {
  const query = c.req.query("listType");
  const today = Temporal.Now.plainDateISO('Asia/Ho_Chi_Minh');
  const currentDay = today.dayOfWeek; // 1 = Monday, ..., 7 = Sunday
  const mondayOffset = currentDay === 7 ? -6 : 1 - currentDay; // If Sunday, go back 6 days, else calculate days until Monday

  let startDay: Temporal.PlainDate, endDay: Temporal.PlainDate;
  if (query === "next_week") {
    startDay = today.add({ days: mondayOffset + 7 });
    endDay = startDay.add({ days: 6 });
  } else if (query === "last_week") {
    startDay = today.add({ days: mondayOffset - 7 });
    endDay = startDay.add({ days: 6 });
  } else {
    startDay = today.add({ days: mondayOffset });
    endDay = startDay.add({ days: 6 });
  }

  const startDayStr = startDay.toString(); // YYYY-MM-DD format
  const endDayStr = endDay.toString(); // YYYY-MM-DD format

  console.log('Fetching records from', startDayStr, 'to', endDayStr);
  try {
    const rs = await db.execute({
      sql:
        "SELECT * FROM DailyProgress WHERE date >= ? AND date <= ? ORDER BY date ASC",
      args: [startDayStr, endDayStr],
    });
    console.log("Fetched rows:", rs.rows);
    const rsCount = await db.execute({ sql: "SELECT COUNT(*) FROM DailyProgress", args: [] })
    console.log("Total count of records:", rsCount.rows);
    return c.json(rs.rows);
  } catch (_err) {
    return c.text("Internal Server Error", 500);
  }
});

app.get("/sync", async (c) => {
  try {
    await db.sync();
    return c.json({ status: "success" });
  } catch (err) {
    console.log("sync error", err);
    return c.text("Internal Server Error", 500);
  }
});

Deno.serve(app.fetch);
