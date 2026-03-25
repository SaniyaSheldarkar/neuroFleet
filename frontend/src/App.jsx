import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FleetPage from './pages/FleetPage';
import MapPage from './pages/MapPage';
import BookingPage from './pages/BookingPage';
import RoutePage from './pages/RoutePage';
import MaintenancePage from './pages/MaintenancePage';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="fleet"       element={<FleetPage />} />
            <Route path="map"         element={<MapPage />} />
            <Route path="bookings"    element={<BookingPage />} />
            <Route path="route"       element={<RoutePage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
