import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Role } from './types';
import { AppLayout } from './components/AppLayout';
import { RequireAuth, RequireEmployee, RequireRole } from './components/RouteGuards';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { UseCaseListPage } from './features/usecases/UseCaseListPage';
import { UseCaseDetailPage } from './features/usecases/UseCaseDetailPage';
import { UsersAdminPage } from './features/admin/UsersAdminPage';
import { ActivityLogPage } from './features/admin/ActivityLogPage';
import { MasterDataPage } from './features/admin/MasterDataPage';
import { IdeaLandingPage } from './features/ideas/IdeaLandingPage';
import { IdeaLayout } from './features/ideas/IdeaLayout';
import { SubmitIdeaPage } from './features/ideas/SubmitIdeaPage';
import { EmailAccessPage } from './features/ideas/EmailAccessPage';
import { VerifyEmailPage } from './features/ideas/VerifyEmailPage';
import { MyIdeasPage } from './features/ideas/MyIdeasPage';

export function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          !user ? (
            <IdeaLandingPage />
          ) : user.role === Role.EMPLOYEE ? (
            <Navigate to="/meine-ideen" replace />
          ) : (
            <AppLayout />
          )
        }
      >
        <Route index element={<DashboardPage />} />
      </Route>
      <Route element={<IdeaLayout />}>
        <Route path="idee-melden" element={<SubmitIdeaPage />} />
        <Route path="zugang" element={<EmailAccessPage />} />
        <Route path="zugang/bestaetigen" element={<VerifyEmailPage />} />
      </Route>
      <Route
        path="meine-ideen"
        element={
          <RequireEmployee>
            <IdeaLayout />
          </RequireEmployee>
        }
      >
        <Route index element={<MyIdeasPage />} />
        <Route path=":id" element={<UseCaseDetailPage employeeView />} />
      </Route>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
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
        <Route
          path="admin/master-data"
          element={
            <RequireRole roles={[Role.ADMINISTRATOR]}>
              <MasterDataPage />
            </RequireRole>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
