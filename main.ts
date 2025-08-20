import { Hono } from "hono";
import { metrics } from "npm:@opentelemetry/api@1";
import { trimTrailingSlash } from "hono/trailing-slash";
import { createClient } from "@libsql/client";

const meter = metrics.getMeter("Viet-300-words", "1.0.0");
// Create some metrics
const requestCounter = meter.createCounter("http_requests_total", {
  description: "Total number of HTTP requests",
});

const app = new Hono({ strict: true });
app.use(trimTrailingSlash());

app.get("/", async (c) => {
  const url = new URL(c.req.url);
  requestCounter.add(1, {
    method: c.req.method,
    path: url.pathname,
    status: 200,
  });
  console.log("env", Deno.env.get("URL"));
  const db = createClient({
    url: Deno.env.get("URL") || "",
    syncUrl: Deno.env.get("SYNC_URL"),
    authToken: Deno.env.get("AUTH_TOKEN"),
  });
  try {
    await db.sync();
  } catch (error) {
    console.error("Database connection error:", error);
  }
  return c.text("Hello Hono!", 200, {
    "Content-Type": "text/plain",
  });
});

Deno.serve(app.fetch);
