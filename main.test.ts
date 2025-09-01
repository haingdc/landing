// import { assertEquals } from "jsr:@std/assert";
// import app from './main.ts'

// Deno.test("simple test", () => {
//   const x = 1 + 2;
//   assertEquals(x, 3);
// });

// === Chưa thể làm test được do app đang sử dụng server thật từ turso và đọc hoặc thậm chí ghi file database/daily_progress.db
// Deno.test('GET / returns "Hello, Hono!"', async () => {
//   const res = await app.request('/');
//   assertEquals(res.status, 200);
//   assertEquals(await res.text(), 'Hello, Hono!');
// });

// Deno.test('GET /posts', async () => {
//   const res = await app.request('/api/dayrecord?listType=next_week')
//   assertEquals(res.status, 200)
//   assertEquals(await res.text(), '[]')
// })