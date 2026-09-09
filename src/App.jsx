import React, { Suspense } from 'react'
import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ErrorBoundary from '@/components/ErrorBoundary';
const BuildMaintenance = React.lazy(() => import('./pages/BuildMaintenance'));
const GrazingManagement = React.lazy(() => import('./pages/GrazingManagement'));
const BeeHiveManagement = React.lazy(() => import('./pages/BeeHiveManagement'));
const BeeHiveDetail = React.lazy(() => import('./pages/BeeHiveDetail'));
const EquipmentDetail = React.lazy(() => import('./pages/EquipmentDetail'));
const Documents = React.lazy(() => import('./pages/Documents'));

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        } />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            }
          />
        ))}
        <Route path="/BuildMaintenance" element={
          <LayoutWrapper currentPageName="BuildMaintenance">
            <BuildMaintenance />
          </LayoutWrapper>
        } />
        <Route path="/GrazingManagement" element={
          <LayoutWrapper currentPageName="GrazingManagement">
            <GrazingManagement />
          </LayoutWrapper>
        } />
        <Route path="/BeeHiveManagement" element={
          <LayoutWrapper currentPageName="BeeHiveManagement">
            <BeeHiveManagement />
          </LayoutWrapper>
        } />
        <Route path="/BeeHiveDetail" element={
          <LayoutWrapper currentPageName="BeeHiveDetail">
            <BeeHiveDetail />
          </LayoutWrapper>
        } />
        <Route path="/EquipmentDetail" element={
          <LayoutWrapper currentPageName="EquipmentDetail">
            <EquipmentDetail />
          </LayoutWrapper>
        } />
        <Route path="/Documents" element={
          <LayoutWrapper currentPageName="Documents">
            <Documents />
          </LayoutWrapper>
        } />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <ErrorBoundary>
            <AuthenticatedApp />
          </ErrorBoundary>
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App