import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { renderToStream } from '@react-pdf/renderer';
import pool from '../../../lib/db';

const styles = StyleSheet.create({
  page: { padding: 30 },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  table: { display: 'table', width: 'auto', marginTop: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000' },
  tableHeader: { backgroundColor: '#4a5568', color: '#fff' },
  tableCell: { padding: 8, fontSize: 10, flex: 1 },
  total: { marginTop: 20, fontSize: 14, fontWeight: 'bold' }
});

const TimesheetPDF = ({ user, entries, totalHours }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Timesheet Report</Text>
      <Text>User: {user.Name} ({user.Email})</Text>
      <Text>Generated: {new Date().toLocaleDateString()}</Text>
      
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableCell}>Date</Text>
          <Text style={styles.tableCell}>Project</Text>
          <Text style={styles.tableCell}>Task</Text>
          <Text style={styles.tableCell}>Hours</Text>
          <Text style={styles.tableCell}>Description</Text>
        </View>
        {entries.map((entry, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.tableCell}>{entry.Date}</Text>
            <Text style={styles.tableCell}>{entry.Project}</Text>
            <Text style={styles.tableCell}>{entry.Task}</Text>
            <Text style={styles.tableCell}>{entry.Hours}</Text>
            <Text style={styles.tableCell}>{entry.Description}</Text>
          </View>
        ))}
      </View>
      
      <Text style={styles.total}>Total Hours: {totalHours}</Text>
    </Page>
  </Document>
);

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

    const stream = await renderToStream(
      <TimesheetPDF user={user} entries={entries} totalHours={totalHours} />
    );

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
