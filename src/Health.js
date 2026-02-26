function Health() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Health Check</h1>
      <p>Status: OK</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}

export default Health;
