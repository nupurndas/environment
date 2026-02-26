import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Timesheet({ onLogout }) {
  const [formData, setFormData] = useState({
    date: '',
    project: '',
    task: '',
    hours: '',
    description: ''
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [entries, setEntries] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [reportUrl, setReportUrl] = useState('');

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
  const reportApiUrl = process.env.REACT_APP_REPORT_URL || 'http://localhost:3002';

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/timesheet`);
      setEntries(response.data);
    } catch (error) {
      console.error('Failed to fetch entries');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('userId') || 1;
      const payload = {
        ...formData,
        userId: parseInt(userId)
      };
      await axios.post(`${backendUrl}/api/timesheet`, payload);
      setMessage('Timesheet entry added successfully!');
      setIsError(false);
      setFormData({ date: '', project: '', task: '', hours: '', description: '' });
      fetchEntries();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to add timesheet entry');
      setIsError(true);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleGetReport = async () => {
    try {
      const userId = localStorage.getItem('userId') || 1;
      const response = await axios.get(`${reportApiUrl}/api/report?userId=${userId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setReportUrl(url);
      setShowReport(true);
      
      setMessage('Report loaded successfully!');
      setIsError(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to load report');
      setIsError(true);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDownloadReport = () => {
    const userId = localStorage.getItem('userId') || 1;
    const link = document.createElement('a');
    link.href = reportUrl;
    link.setAttribute('download', `timesheet-report-${userId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCloseReport = () => {
    if (reportUrl) {
      window.URL.revokeObjectURL(reportUrl);
    }
    setShowReport(false);
    setReportUrl('');
  };

  return (
    <div className="app-container">
      <div className="card card-wide">
        <div className="header">
          <h1 className="title">Timesheet Entry</h1>
        </div>
        
        {message && (
          <div className={isError ? 'error-message' : 'success-message'}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              name="date"
              className="form-input"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Project</label>
            <input
              type="text"
              name="project"
              className="form-input"
              value={formData.project}
              onChange={handleChange}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Task</label>
            <input
              type="text"
              name="task"
              className="form-input"
              value={formData.task}
              onChange={handleChange}
              placeholder="Enter task description"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hours</label>
            <input
              type="number"
              name="hours"
              className="form-input"
              value={formData.hours}
              onChange={handleChange}
              placeholder="Enter hours worked"
              step="0.5"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter additional details"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Insert
          </button>
          <button type="button" onClick={handleGetReport} className="btn btn-primary" style={{ marginLeft: '10px' }}>
            Get Timesheet Reports
          </button>
          <button type="button" onClick={onLogout} className="btn btn-secondary">
            Logout
          </button>
        </form>

        {entries.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#333' }}>My Timesheet Entries</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Project</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Task</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Hours</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={entry.id} style={{ 
                      background: index % 2 === 0 ? '#f9f9f9' : 'white',
                      borderBottom: '1px solid #e0e0e0'
                    }}>
                      <td style={{ padding: '12px' }}>{entry.date}</td>
                      <td style={{ padding: '12px' }}>{entry.project}</td>
                      <td style={{ padding: '12px' }}>{entry.task}</td>
                      <td style={{ padding: '12px' }}>{entry.hours}</td>
                      <td style={{ padding: '12px' }}>{entry.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '20px',
            width: '90%',
            height: '90%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0, color: '#333' }}>Timesheet Report</h2>
              <div>
                <button 
                  onClick={handleDownloadReport}
                  className="btn btn-primary"
                  style={{ marginRight: '10px' }}
                >
                  Download PDF
                </button>
                <button 
                  onClick={handleCloseReport}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
            <iframe
              src={reportUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '10px'
              }}
              title="Timesheet Report"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Timesheet;
