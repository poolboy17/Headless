const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  const result = await sql`SELECT id, title, substring(content, 1, 3000) as content_sample FROM posts WHERE status = 'published' LIMIT 1`;
  console.log(JSON.stringify(result[0], null, 2));
}
main().catch(console.error);
