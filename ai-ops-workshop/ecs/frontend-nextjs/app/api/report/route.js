import pool from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    const userResult = await pool.query('SELECT * FROM "Users" WHERE "Id" = $1', [userId]);
    if (userResult.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const entriesResult = await pool.query(
      'SELECT * FROM "TimesheetEntries" WHERE "UserId" = $1 ORDER BY "Date" DESC',
      [userId]
    );

    const user = userResult.rows[0];
    const entries = entriesResult.rows;
    const totalHours = entries.reduce((sum, e) => sum + parseFloat(e.Hours || 0), 0);

    const { default: ReactPDF } = await import('@react-pdf/renderer');
    const { Document, Page, Text, View, StyleSheet } = ReactPDF;

    const styles = StyleSheet.create({
      page: { padding: 30 },
      header: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
      table: { display: 'table', width: 'auto', marginTop: 10 },
      tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
      tableHeader: { backgroundColor: '#4a5568', color: '#fff' },
      tableCell: { padding: 8, fontSize: 10, flex: 1 },
      total: { marginTop: 20, fontSize: 14, fontWeight: 'bold' }
    });

    const doc = ReactPDF.createElement(Document, {},
      ReactPDF.createElement(Page, { size: 'A4', style: styles.page },
        ReactPDF.createElement(Text, { style: styles.header }, 'Timesheet Report'),
        ReactPDF.createElement(Text, {}, `User: ${user.Name} (${user.Email})`),
        ReactPDF.createElement(Text, {}, `Generated: ${new Date().toLocaleDateString()}`),
        ReactPDF.createElement(View, { style: styles.table },
          ReactPDF.createElement(View, { style: [styles.tableRow, styles.tableHeader] },
            ReactPDF.createElement(Text, { style: styles.tableCell }, 'Date'),
            ReactPDF.createElement(Text, { style: styles.tableCell }, 'Project'),
            ReactPDF.createElement(Text, { style: styles.tableCell }, 'Task'),
            ReactPDF.createElement(Text, { style: styles.tableCell }, 'Hours'),
            ReactPDF.createElement(Text, { style: styles.tableCell }, 'Description')
          ),
          ...entries.map((entry, i) =>
            ReactPDF.createElement(View, { key: i, style: styles.tableRow },
              ReactPDF.createElement(Text, { style: styles.tableCell }, entry.Date),
              ReactPDF.createElement(Text, { style: styles.tableCell }, entry.Project),
              ReactPDF.createElement(Text, { style: styles.tableCell }, entry.Task),
              ReactPDF.createElement(Text, { style: styles.tableCell }, String(entry.Hours)),
              ReactPDF.createElement(Text, { style: styles.tableCell }, entry.Description || '')
            )
          )
        ),
        ReactPDF.createElement(Text, { style: styles.total }, `Total Hours: ${totalHours}`)
      )
    );

    const stream = await ReactPDF.renderToStream(doc);

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="timesheet-${user.Name}.pdf"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
