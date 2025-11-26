import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Analysis from './pages/Analysis';
import Settings from './pages/Settings';
import Resources from './pages/Resources';
import Login from './pages/Login';
import Profile from './pages/Profile';
import UserWorkbench from './pages/UserWorkbench';
import ProjectDetail from './pages/ProjectDetail';
import AIDecisionDashboard from './pages/AIDecisionDashboard';
import AdvancedReports from './pages/AdvancedReports';
import TemplateManager from './pages/TemplateManager';
import BatchImport from './pages/BatchImport';
import ErrorBoundary from './components/ErrorBoundary';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <KeyboardShortcutsHelp />
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Home Landing Page */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Project Management */}
          <Route path="/projects" element={
            <ProtectedRoute>
              <Layout>
                <Projects />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/projects/:projectId" element={
            <ProtectedRoute>
              <Layout>
                <ProjectDetail />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/projects/templates" element={
            <ProtectedRoute>
              <Layout>
                <TemplateManager />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/projects/import" element={
            <ProtectedRoute>
              <Layout>
                <BatchImport />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Resource Management */}
          <Route path="/resources" element={
            <ProtectedRoute>
              <Layout>
                <Resources />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Cost Analysis */}
          <Route path="/cost" element={
            <ProtectedRoute>
              <Layout>
                <Analysis />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Decision Support */}
          <Route path="/decision" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/decision/ai" element={
            <ProtectedRoute>
              <Layout>
                <AIDecisionDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/decision/reports" element={
            <ProtectedRoute>
              <Layout>
                <AdvancedReports />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Other */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/workbench" element={
            <ProtectedRoute>
              <Layout>
                <UserWorkbench />
              </Layout>
            </ProtectedRoute>
          } />

        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
