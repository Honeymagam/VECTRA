import type { ReactElement } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import StatePanel from '@/components/ui/StatePanel';
import { DEFAULT_ROUTE_PATH, ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import ConceptGraphPage from '@/pages/ConceptGraphPage';
import DashboardPage from '@/pages/DashboardPage';
import FrameworkOverviewPage from '@/pages/FrameworkOverviewPage';
import KnowledgeExtractionPage from '@/pages/KnowledgeExtractionPage';
import LandingPage from '@/pages/LandingPage';
import ModulePlaceholderPage from '@/pages/ModulePlaceholderPage';
import MockTestsPage from '@/pages/MockTestsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import PracticePage from '@/pages/PracticePage';
import ReadinessPage from '@/pages/ReadinessPage';
import SignInPage from '@/pages/SignInPage';
import VectorMemoryPage from '@/pages/VectorMemoryPage';
import ReasoningCorePage from '@/pages/ReasoningCorePage';
import AITutorPage from '@/pages/AITutorPage';
import MistakeAnalysisPage from '@/pages/MistakeAnalysisPage';
import FeedbackLoopPage from '@/pages/FeedbackLoopPage';
import RevisionPage from '@/pages/RevisionPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import ProfilePage from '@/pages/ProfilePage';
import DatasetReviewPage from '@/pages/DatasetReviewPage';
import FormulasPage from '@/pages/FormulasPage';
import ModelAccuracyPage from '@/pages/ModelAccuracyPage';

const PAGE_OVERRIDES: Record<string, ReactElement> = {
  [DEFAULT_ROUTE_PATH]: <DashboardPage />,
  '/framework': <FrameworkOverviewPage />,
  '/knowledge-extraction': <KnowledgeExtractionPage />,
  '/practice': <PracticePage />,
  '/mock-tests': <MockTestsPage />,
  '/readiness': <ReadinessPage />,
  '/concept-graph': <ConceptGraphPage />,
  '/vector-memory': <VectorMemoryPage />,
  '/dataset-review': <DatasetReviewPage />,
  '/formulas': <FormulasPage />,
  '/reasoning-core': <ReasoningCorePage />,
  '/ai-tutor': <AITutorPage />,
  '/mistake-analysis': <MistakeAnalysisPage />,
  '/feedback-loop': <FeedbackLoopPage />,
  '/revision': <RevisionPage />,
  '/analytics': <AnalyticsPage />,
  '/reports': <ReportsPage />,
  '/model-accuracy': <ModelAccuracyPage />,
  '/settings': <SettingsPage />,
  '/profile': <ProfilePage />,
};

function App() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Keep public routes interactive while a stored session is checked. A slow
    // /auth/me response should not hide the landing navigation or sign-in form.
    if (location.pathname === '/' || location.pathname === '/sign-in') {
      return (
        <Routes>
          <Route index element={<LandingPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
        </Routes>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
        <StatePanel variant="loading" title="Loading VECTRA" message="Checking your session." />
      </div>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route index element={<LandingPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/sign-in" element={<Navigate to={DEFAULT_ROUTE_PATH} replace />} />
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to={DEFAULT_ROUTE_PATH} replace />} />
        {ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={PAGE_OVERRIDES[route.path] ?? <ModulePlaceholderPage route={route} />}
          />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
