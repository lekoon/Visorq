import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Analysis from './pages/Analysis';
import Settings from './pages/Settings';
import Resources from './pages/Resources';
import Login from './pages/Login';
import Profile from './pages/Profile';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/projects" element={
          <ProtectedRoute>
            <Layout>
              <Projects />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/resources" element={
          <ProtectedRoute>
            <Layout>
              <Resources />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/analysis" element={
          <ProtectedRoute>
            <Layout>
              <Analysis />
            </Layout>
          </ProtectedRoute>
        } />

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
      </Routes>
    </Router>
  );
}

export default App;
