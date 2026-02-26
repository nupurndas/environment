'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleGetReport = async () => {
    if (!selectedUser) {
      alert('Please select a user');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/report?userId=${selectedUser}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timesheet-report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center', marginBottom: '30px' }}>
          Timesheet Report Generator
        </h1>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
            Select User
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '1rem' }}
          >
            <option value="">-- Select User --</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGetReport}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          {loading ? 'Generating Report...' : 'Get Report'}
        </button>
      </div>
    </div>
  );
}
