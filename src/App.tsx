import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { QueryProvider } from './providers/QueryProvider';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { RequireMetaConnection } from './components/RequireMetaConnection';
import DashboardLayout from './layouts/DashboardLayout';
import { Loader2 } from 'lucide-react';

// Lazy loaded pages for code splitting
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Onboarding = lazy(() => import('./pages/onboarding/Onboarding'));
const DashboardHome = lazy(() => import('./pages/dashboard/Home'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const Campaigns = lazy(() => import('./pages/campaigns/Campaigns'));

// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="text-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
      <p className="text-slate-500 text-sm">Carregando...</p>
    </div>
  </div>
);

// Placeholder for AI tools page
const AiPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Ferramentas de IA</h1>
    <p>Em breve...</p>
  </div>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Onboarding Route (Protected but no Layout) */}
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <RequireMetaConnection>
                        <DashboardLayout />
                      </RequireMetaConnection>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardHome />} />
                  <Route path="campaigns" element={<Campaigns />} />
                  <Route path="ai-tools" element={<AiPage />} />
                </Route>

                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Settings />} />
                </Route>

                {/* Default Redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;
