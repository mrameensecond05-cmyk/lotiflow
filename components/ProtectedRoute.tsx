import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
    // BYPASS: Automatically inject a session if none exists
    let userRole = localStorage.getItem('userRole');
    let token = localStorage.getItem('token');

    if (!token || !userRole) {
        console.log("No session found. Injecting Bypass Session...");
        localStorage.setItem('token', 'session-active-bypass');
        localStorage.setItem('userRole', 'admin'); // Default to Admin for full access
        localStorage.setItem('userName', 'Bypass Admin');
        localStorage.setItem('userEmail', 'admin@lotiflow.local');
        localStorage.setItem('userId', 'admin-123');

        // Refresh values
        userRole = 'admin';
        token = 'session-active-bypass';
    }

    // Always render children, effectively disabling the guard
    return <>{children}</>;
};

export default ProtectedRoute;
