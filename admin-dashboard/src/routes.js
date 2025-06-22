import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';

const Login = lazy(() => import('./components/Auth/Login'));
const Register = lazy(() => import('./components/Auth/Register'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const Orders = lazy(() => import('./components/Orders/Orders'));
const Menu = lazy(() => import('./components/Menu/Menu'));
const Users = lazy(() => import('./components/Users/Users'));
const Notifications = lazy(() => import('./components/Notifications/Notifications'));
const Reports = lazy(() => import('./components/Reports/Reports'));
const Layout = lazy(() => import('./components/Layout/Layout'));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}><CircularProgress /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}><CircularProgress /></div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="orders/*" element={<Orders />} />
          <Route path="menu/*" element={<Menu />} />
          <Route path="users/*" element={<Users />} />
          <Route path="notifications/*" element={<Notifications />} />
          <Route path="reports/*" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
} 