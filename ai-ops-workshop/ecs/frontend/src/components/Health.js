import React, { useEffect } from 'react';

function Health() {
  useEffect(() => {
    document.title = 'Health Check';
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>✓</h1>
        <h2>Service Healthy</h2>
        <p>Status: OK</p>
      </div>
    </div>
  );
}

export default Health;
