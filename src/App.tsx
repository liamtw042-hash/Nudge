import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { Loading } from '@/components/ui';
import { ParentSlip } from '@/pages/ParentSlip';

// Teacher-side pages load on demand so the parent's page stays small.
const Landing = lazy(() => import('@/pages/Landing').then((m) => ({ default: m.Landing })));
const SignIn = lazy(() => import('@/pages/SignIn').then((m) => ({ default: m.SignIn })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const StudentPage = lazy(() => import('@/pages/StudentPage').then((m) => ({ default: m.StudentPage })));
const Billing = lazy(() => import('@/pages/Billing').then((m) => ({ default: m.Billing })));
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })));
const Admin = lazy(() => import('@/pages/Admin').then((m) => ({ default: m.Admin })));
const FeedbackButton = lazy(() => import('@/components/FeedbackButton').then((m) => ({ default: m.FeedbackButton })));

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/signin" replace />;
  return (
    <>
      <Outlet />
      <FeedbackButton />
    </>
  );
}

function TeacherArea() {
  return (
    <AuthProvider>
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </AuthProvider>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Parent pages: no auth, no teacher code. */}
        <Route path="/s/:token" element={<ParentSlip />} />
        <Route path="/s/:token/print" element={<ParentSlip print />} />

        <Route element={<TeacherArea />}>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/app" element={<RequireAuth />}>
            <Route index element={<Dashboard />} />
            <Route path="students/:id" element={<StudentPage />} />
            <Route path="billing" element={<Billing />} />
            <Route path="settings" element={<Settings />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
