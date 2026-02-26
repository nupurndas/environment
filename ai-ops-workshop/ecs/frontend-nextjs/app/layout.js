export const metadata = {
  title: 'TMS Report Generator',
  description: 'Timesheet Report Generator',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif' }}>{children}</body>
    </html>
  );
}
