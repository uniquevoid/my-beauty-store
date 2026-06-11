import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import BrandingProvider from './components/BrandingProvider';
import CareersHeader from './components/CareersHeader';
import CareersFooter from './components/CareersFooter';
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import ApplyPage from './pages/ApplyPage';
import CandidateLoginPage from './pages/CandidateLoginPage';
import CandidateRegisterPage from './pages/CandidateRegisterPage';
import CandidateDashboardPage from './pages/CandidateDashboardPage';
import RecommendationsPage from './pages/RecommendationsPage';
import JobAlertsHubPage from './pages/job-alerts/JobAlertsHubPage';
import JobAlertRegisterPage from './pages/job-alerts/JobAlertRegisterPage';
import JobAlertLoginPage from './pages/job-alerts/JobAlertLoginPage';
import CreateJobAlertPage from './pages/job-alerts/CreateJobAlertPage';
import AdminLayout from './admin/AdminLayout';
import AdminLoginPage from './admin/AdminLoginPage';
import AdminChangePasswordPage from './admin/AdminChangePasswordPage';
import AdminDashboardPage from './admin/AdminDashboardPage';
import AdminJobsPage from './admin/AdminJobsPage';
import AdminImportPage from './admin/AdminImportPage';
import AdminPipelinePage from './admin/AdminPipelinePage';
import AdminScreenedCandidatePage from './admin/AdminScreenedCandidatePage';
import AdminPresentationPage from './admin/AdminPresentationPage';
import DemoBuilderPage from './pages/DemoBuilderPage';
import PresentationPage from './pages/PresentationPage';
import CareerChatWidget from './components/chat/CareerChatWidget';

const demoBuilderEnabled = import.meta.env.VITE_ENABLE_DEMO_BUILDER === 'true';

function CareersShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-background text-brand-text font-sans font-light">
      <CareersHeader />
      <main>{children}</main>
      <CareersFooter />
      <CareerChatWidget />
    </div>
  );
}

function withCareersShell(element: React.ReactNode) {
  return <CareersShell>{element}</CareersShell>;
}

export default function App() {
  return (
    <HelmetProvider>
      <BrandingProvider>
        <Router>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="login" element={<AdminLoginPage />} />
              <Route path="change-password" element={<AdminChangePasswordPage />} />
              <Route index element={<AdminDashboardPage />} />
              <Route path="jobs" element={<AdminJobsPage />} />
              <Route path="import" element={<AdminImportPage />} />
              <Route path="pipeline" element={<AdminPipelinePage />} />
              <Route path="pipeline/new" element={<AdminScreenedCandidatePage />} />
              <Route path="pipeline/:id/presentation" element={<AdminPresentationPage />} />
            </Route>

            <Route path="/present/:shareToken" element={<PresentationPage />} />

            <Route path="/" element={withCareersShell(<HomePage />)} />
            <Route path="/recommendations" element={withCareersShell(<RecommendationsPage />)} />
            <Route path="/jobs" element={withCareersShell(<JobsPage />)} />
            <Route path="/jobs/:slug" element={withCareersShell(<JobDetailPage />)} />
            <Route path="/apply/:jobSlug" element={withCareersShell(<ApplyPage />)} />
            <Route path="/login" element={withCareersShell(<CandidateLoginPage />)} />
            <Route path="/register" element={withCareersShell(<CandidateRegisterPage />)} />
            <Route path="/candidate" element={withCareersShell(<CandidateDashboardPage />)} />
            <Route path="/job-alerts" element={withCareersShell(<JobAlertsHubPage />)} />
            <Route
              path="/job-alerts/register"
              element={withCareersShell(<JobAlertRegisterPage />)}
            />
            <Route path="/job-alerts/login" element={withCareersShell(<JobAlertLoginPage />)} />
            <Route
              path="/job-alerts/create"
              element={withCareersShell(<CreateJobAlertPage />)}
            />

            {demoBuilderEnabled && (
              <Route path="/demo-builder" element={<DemoBuilderPage />} />
            )}
          </Routes>
        </Router>
      </BrandingProvider>
    </HelmetProvider>
  );
}
