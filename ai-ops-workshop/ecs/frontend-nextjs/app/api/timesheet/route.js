import pool from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    let query = 'SELECT * FROM "TimesheetEntries" WHERE 1=1';
    const params = [];

    if (userId) {
      params.push(userId);
      query += ` AND "UserId" = $${params.length}`;
    }

    if (date) {
      params.push(date);
      query += ` AND "Date" = $${params.length}`;
    }

    query += ' ORDER BY "Date" DESC';

    const result = await pool.query(query, params);
    return Response.json(result.rows);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

