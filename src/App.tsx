import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider } from './features/auth/AuthContext';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { LoginPage } from './features/auth/LoginPage';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { RegisterPage } from './features/auth/RegisterPage';
import { AppStateProvider } from './features/campus/AppStateContext';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { BinsPage } from './pages/BinsPage';
import { CampusMapPage } from './pages/CampusMapPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { DashboardPage } from './pages/DashboardPage';
import { IoTConsolePage } from './pages/IoTConsolePage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppStateProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected Campus Operations Shell */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="bins" element={<BinsPage />} />
              <Route path="campus-map" element={<CampusMapPage />} />
              <Route path="collections" element={<CollectionsPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="iot-console" element={<IoTConsolePage />} />
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['Super Admin', 'Administrator']}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppStateProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
