import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './views/Login';
import Overview from './views/AdminDashboard'; // Renamed view
import Intelligence from './views/Intelligence';
import Systems from './views/Systems';
import UserDashboard from './views/UserDashboard'; // Keeping endpoint view accessible

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route element={<Layout />}>
          <Route path="/overview" element={<Overview />} />
          <Route path="/admin" element={<Navigate to="/overview" replace />} /> {/* Redirect legacy */}
          <Route path="/intelligence" element={<Intelligence />} />
          <Route path="/systems" element={<Systems />} />
        </Route>

        {/* Standalone User Dashboard */}
        <Route path="/user" element={<UserDashboard />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
