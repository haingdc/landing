import { Hono } from "hono";
import { metrics } from "@opentelemetry/api";
import { trimTrailingSlash } from "hono/trailing-slash";
import { serveStatic } from "hono/deno";
import { createClient, type Client } from "https://esm.sh/@libsql/client@0.6.0/web";
import { getTime, md5 } from "./server/util.ts";

const meter = metrics.getMeter("Viet-300-words", "1.0.0");
// Create some metrics
const requestCounter = meter.createCounter("http_requests_total", {
  description: "Total number of HTTP requests",
});

let db: Client;
try {
  db = createClient({
    url: Deno.env.get("TURSO_SYNC_URL")!,
    authToken: Deno.env.get("TURSO_AUTH_TOKEN"),
  })
} catch (err) {
  console.log("DB init error", err);
  Deno.exit(1);
}

const app = new Hono({ strict: true });
app.use(trimTrailingSlash());

// Handle chart.html with ETag caching
app.get('/chart.html', async (c) => {
  try {
    const now = new Date();
    const etag = md5(getTime(now));
    
    // Check if client sent If-None-Match header
    const ifNoneMatch = c.req.header('if-none-match'); // Changed to lowercase
    
    const clientEtag = ifNoneMatch?.replace(/^W\//, ''); // Handle both weak and strong validators
    
    console.log('-----------------')
        console.log('Serving chart.html at', now.toISOString());
    console.log('compare: ifNoneMatch vs with etag:', clientEtag === etag)
    console.log('if-none-match:', ifNoneMatch);
    console.log('with etag:', etag);
    if (clientEtag === etag) {
      console.log('ETag matches, returning 304');
      return new Response(null, { status: 304 });
    }
    
    // ETag does not match, sending full response
    const content = await Deno.readFile('./public/chart.html');
    return new Response(content, {
      headers: {
        'content-type': 'text/html',
        etag,
        // "cache-control": "public, max-age=0, must-revalidate",
        "cache-control": "max-age=604800" // 7 days
      }
    });
  } catch (error) {
    console.error('Error serving chart.html:', error);
    return c.text('Internal Server Error', 500);
  }
});

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
    return c.json(rs.rows);
  } catch (_err) {
    console.log("DB error", _err);
    return c.text("Internal Server Error", 500);
  }
});

app.get("/api/weeklyprogress", async (c) => {
  try {
    const rs = await db.execute({
      sql: `
      WITH per_day AS (
        -- 1 dòng = 1 ngày (gom tất cả note/record trong cùng 1 ngày)
        SELECT
          date(dr.date) AS d,
          SUM(COALESCE(dwc.added_words_count,0) - COALESCE(dwc.removed_words_count,0)) AS net_words
        FROM DayRecord dr
        LEFT JOIN DayWordsCount dwc ON dwc.id = dr.id
        GROUP BY date(dr.date)
      ),

      per_day_with_week AS (
        -- tính week_start (Thứ Hai) từ d
        SELECT
          d,
          net_words,
          ((CAST(strftime('%w', d) AS INTEGER) + 6) % 7) AS offset_from_monday,
          date(d, '-' || ((CAST(strftime('%w', d) AS INTEGER) + 6) % 7) || ' days') AS week_start
        FROM per_day
      ),

      weekly AS (
        SELECT
          week_start,
          date(week_start, '+6 days') AS week_end,
          SUM(net_words) AS total_net_words,
          COUNT(*) AS writing_days, -- số ngày có viết trong tuần
          GROUP_CONCAT(d) AS days_list
        FROM per_day_with_week
        GROUP BY week_start
      )

      SELECT
        week_start,
        week_end,
        total_net_words AS total_net_words_a_week,
        CASE
          WHEN writing_days > 0 THEN ROUND(total_net_words * 1.0 / writing_days, 0)
          ELSE 0
        END AS avg_daily_net_words_a_week_so_far,
        writing_days AS writing_days,  -- chỉ số ngày viết, không kèm /7
        days_list
      FROM weekly
      ORDER BY week_start DESC;
      `,
      args: [],
    });
    return c.json(rs.rows);
  } catch (error) {
    console.log("weeklyprogress error", error);
    return c.text("Internal Server Error", 500);
  }
})

Deno.serve(app.fetch);
