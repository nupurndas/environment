import pool from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await pool.query('SELECT "Id", "Uid", "Name", "Email" FROM "Users"');
    return Response.json(result.rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
