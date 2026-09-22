import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Role } from './types';
import { AppLayout } from './components/AppLayout';
import { RequireAuth, RequireRole } from './components/RouteGuards';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { UseCaseListPage } from './features/usecases/UseCaseListPage';
import { UseCaseDetailPage } from './features/usecases/UseCaseDetailPage';
import { UsersAdminPage } from './features/admin/UsersAdminPage';
import { ActivityLogPage } from './features/admin/ActivityLogPage';

export function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="use-cases" element={<UseCaseListPage />} />
        <Route path="use-cases/:id" element={<UseCaseDetailPage />} />
        <Route
          path="admin/users"
          element={
            <RequireRole roles={[Role.ADMINISTRATOR]}>
              <UsersAdminPage />
            </RequireRole>
          }
        />
        <Route
          path="admin/activity"
          element={
            <RequireRole roles={[Role.ADMINISTRATOR, Role.AI_CORE_TEAM]}>
              <ActivityLogPage />
            </RequireRole>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
