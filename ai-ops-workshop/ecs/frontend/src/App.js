import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Timesheet from './components/Timesheet';
import Health from './components/Health';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/health" element={<Health />} />
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/timesheet" /> : 
            <Login onLogin={() => setIsAuthenticated(true)} />
          } 
        />
        <Route 
          path="/timesheet" 
          element={
            isAuthenticated ? 
            <Timesheet onLogout={() => setIsAuthenticated(false)} /> : 
            <Navigate to="/login" />
          } 
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
