import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import PerformanceMonitor from './components/PerformanceMonitor';

// Eager load critical routes
import Login from './pages/Login';
import Home from './pages/Home';
import PMODashboard from './pages/PMODashboard';
import DependencyAnalysis from './pages/DependencyAnalysis';
import WhatIfSimulation from './pages/WhatIfSimulation';
import ProjectMonitorCenter from './pages/ProjectMonitorCenter';

// Lazy load other routes for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetailEnhanced = lazy(() => import('./pages/ProjectDetailEnhanced'));
const Analysis = lazy(() => import('./pages/Analysis'));
const Settings = lazy(() => import('./pages/Settings'));
const Resources = lazy(() => import('./pages/UnifiedResourcesPage'));
const Profile = lazy(() => import('./pages/Profile'));
const UserWorkbench = lazy(() => import('./pages/UserWorkbench'));
const AIDecisionDashboard = lazy(() => import('./pages/AIDecisionDashboard'));
const AdvancedReports = lazy(() => import('./pages/AdvancedReports'));
const TemplateManager = lazy(() => import('./pages/TemplateManager'));
const BatchImport = lazy(() => import('./pages/BatchImport'));
const DeliveryEfficiency = lazy(() => import('./pages/DeliveryEfficiency'));
const RiskManagement = lazy(() => import('./pages/RiskManagement'));
const EVMAnalysis = lazy(() => import('./pages/EVMAnalysis'));
const EnvironmentManagement = lazy(() => import('./pages/EnvironmentManagement'));
const RequirementTraceabilityMatrix = lazy(() => import('./pages/RequirementTraceabilityMatrix'));
const ProjectTools = lazy(() => import('./pages/ProjectTools'));
const BayMachineResource = lazy(() => import('./pages/BayMachineResource'));

import SkeletonLoader from './components/SkeletonLoader';

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
    <SkeletonLoader />
  </div>
);

// Layout wrapper with Suspense (without protection)
const LayoutRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Layout>
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </Layout>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <KeyboardShortcutsHelp />
        <PerformanceMonitor />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/pmo" element={<LayoutRoute><PMODashboard /></LayoutRoute>} />
          <Route path="/pmo/monitor" element={<LayoutRoute><ProjectMonitorCenter /></LayoutRoute>} />
          <Route path="/pmo/dependencies" element={<LayoutRoute><DependencyAnalysis /></LayoutRoute>} />
          <Route path="/simulation" element={<LayoutRoute><WhatIfSimulation /></LayoutRoute>} />

          {/* Protected Routes */}
          <Route path="/" element={<LayoutRoute><Home /></LayoutRoute>} />
          <Route path="/dashboard" element={<LayoutRoute><Dashboard /></LayoutRoute>} />

          {/* Project Management */}
          <Route path="/projects" element={<LayoutRoute><Projects /></LayoutRoute>} />
          <Route path="/projects/:projectId" element={<LayoutRoute><ProjectDetailEnhanced /></LayoutRoute>} />
          <Route path="/projects/:projectId/risks" element={<LayoutRoute><RiskManagement /></LayoutRoute>} />
          <Route path="/projects/templates" element={<LayoutRoute><TemplateManager /></LayoutRoute>} />
          <Route path="/projects/import" element={<LayoutRoute><BatchImport /></LayoutRoute>} />

          {/* Resource Management */}
          <Route path="/resources" element={<LayoutRoute><Resources /></LayoutRoute>} />
          <Route path="/environments" element={<LayoutRoute><EnvironmentManagement /></LayoutRoute>} />

          {/* Delivery Efficiency Dashboard */}
          <Route path="/delivery-efficiency" element={<LayoutRoute><DeliveryEfficiency /></LayoutRoute>} />


          {/* Analysis & Reports */}
          {/* 项目组合和依赖分析已集成到PMO管控中心 */}
          <Route path="/portfolio" element={<Navigate to="/pmo" replace />} />
          <Route path="/dependencies" element={<Navigate to="/pmo" replace />} />
          <Route path="/evm" element={<LayoutRoute><EVMAnalysis /></LayoutRoute>} />
          <Route path="/analysis" element={<LayoutRoute><Analysis /></LayoutRoute>} />
          <Route path="/ai-decision" element={<LayoutRoute><AIDecisionDashboard /></LayoutRoute>} />
          <Route path="/reports" element={<LayoutRoute><AdvancedReports /></LayoutRoute>} />

          {/* PMO Strategic Tools */}
          <Route path="/projects/:projectId/rtm" element={<LayoutRoute><RequirementTraceabilityMatrix /></LayoutRoute>} />

          {/* User & Settings */}
          <Route path="/workbench" element={<LayoutRoute><UserWorkbench /></LayoutRoute>} />
          <Route path="/bay-resources" element={<LayoutRoute><BayMachineResource /></LayoutRoute>} />
          <Route path="/profile" element={<LayoutRoute><Profile /></LayoutRoute>} />
          <Route path="/settings" element={<LayoutRoute><Settings /></LayoutRoute>} />
          <Route path="/project-tools" element={<LayoutRoute><ProjectTools /></LayoutRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
