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

    const ReactPDF = await import('@react-pdf/renderer');
    const React = await import('react');

    const styles = ReactPDF.StyleSheet.create({
      page: { padding: 30 },
      header: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
      table: { display: 'table', width: 'auto', marginTop: 10 },
      tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
      tableHeader: { backgroundColor: '#4a5568', color: '#fff' },
      tableCell: { padding: 8, fontSize: 10, flex: 1 },
      total: { marginTop: 20, fontSize: 14, fontWeight: 'bold' }
    });

    const doc = React.createElement(
      ReactPDF.Document,
      null,
      React.createElement(
        ReactPDF.Page,
        { size: 'A4', style: styles.page },
        React.createElement(ReactPDF.Text, { style: styles.header }, 'Timesheet Report'),
        React.createElement(ReactPDF.Text, null, `User: ${user.Name} (${user.Email})`),
        React.createElement(ReactPDF.Text, null, `Generated: ${new Date().toLocaleDateString()}`),
        React.createElement(
          ReactPDF.View,
          { style: styles.table },
          React.createElement(
            ReactPDF.View,
            { style: [styles.tableRow, styles.tableHeader] },
            React.createElement(ReactPDF.Text, { style: styles.tableCell }, 'Date'),
            React.createElement(ReactPDF.Text, { style: styles.tableCell }, 'Project'),
            React.createElement(ReactPDF.Text, { style: styles.tableCell }, 'Task'),
            React.createElement(ReactPDF.Text, { style: styles.tableCell }, 'Hours'),
            React.createElement(ReactPDF.Text, { style: styles.tableCell }, 'Description')
          ),
          ...entries.map((entry, i) =>
            React.createElement(
              ReactPDF.View,
              { key: i, style: styles.tableRow },
              React.createElement(ReactPDF.Text, { style: styles.tableCell }, entry.Date),
              React.createElement(ReactPDF.Text, { style: styles.tableCell }, entry.Project),
              React.createElement(ReactPDF.Text, { style: styles.tableCell }, entry.Task),
              React.createElement(ReactPDF.Text, { style: styles.tableCell }, String(entry.Hours)),
              React.createElement(ReactPDF.Text, { style: styles.tableCell }, entry.Description || '')
            )
          )
        ),
        React.createElement(ReactPDF.Text, { style: styles.total }, `Total Hours: ${totalHours}`)
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
