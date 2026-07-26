import React, { JSX, lazy, Suspense, useEffect, useState } from 'react';
import {
  BellRing,
  ChartNoAxesCombined,
  Fingerprint,
  GitBranch,
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  PlusCircle,
  ScrollText,
  Search,
  Shield,
  TrendingUp,
  UsersRound
} from 'lucide-react';
import { Login } from './components/Login';
import { UserRegistration } from './components/UserRegistration';
import { getHashPath, hashHref } from './hashRouting';

const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const ChatInterface = lazy(() => import('./components/ChatInterface').then(module => ({ default: module.ChatInterface })));
const FIRIntake = lazy(() => import('./components/FIRIntake').then(module => ({ default: module.FIRIntake })));
const CaseDeepDive = lazy(() => import('./components/CaseDeepDive').then(module => ({ default: module.CaseDeepDive })));
const CrimeTrendAnalytics = lazy(() => import('./components/CrimeTrendAnalytics').then(module => ({ default: module.CrimeTrendAnalytics })));
const AuditTrail = lazy(() => import('./components/AuditTrail').then(module => ({ default: module.AuditTrail })));
const SpatialIntelligence = lazy(() => import('./components/SpatialIntelligence').then(module => ({ default: module.SpatialIntelligence })));
const OffenderProfiles = lazy(() => import('./components/OffenderProfiles').then(module => ({ default: module.OffenderProfiles })));
const SociologicalInsights = lazy(() => import('./components/SociologicalInsights').then(module => ({ default: module.SociologicalInsights })));
const CrimeForecast = lazy(() => import('./components/CrimeForecast').then(module => ({ default: module.CrimeForecast })));
const CriminalNetworkAnalysis = lazy(() => import('./components/CriminalNetworkAnalysis').then(module => ({ default: module.CriminalNetworkAnalysis })));
const EarlyWarningCenter = lazy(() => import('./components/EarlyWarningCenter').then(module => ({ default: module.EarlyWarningCenter })));

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = localStorage.getItem('ksp_auth_token') !== null;
  return isAuthenticated ? children : <Login />;
};

const NavigationSidebar = ({ currentPath }: { currentPath: string }) => {
  const role = localStorage.getItem('ksp_role');
  const canInvestigate = ['Investigator', 'Analyst', 'Supervisor', 'Argos'].includes(role || '');
  const item = (path: string, label: string, icon: JSX.Element, important = false) => (
    <a href={hashHref(path)} className="sidebar-link" style={{ textDecoration: 'none' }}>
      <button
        className={`nb-button sidebar-link-button${important ? ' sidebar-link-primary' : ''}${currentPath === path ? ' is-active' : ''}`}
        type="button"
      >
        <span className="sidebar-link-icon">{icon}</span>
        <span>{label}</span>
      </button>
    </a>
  );

  return (
    <nav className="sidebar-navigation" aria-label="Primary">
      <div className="sidebar-group">
        <div className="sidebar-group-label">Core Operations</div>
        {item('/dashboard', 'Dashboard', <LayoutDashboard size={18} />, true)}
        {item('/chat', 'Conversational Hub', <MessageSquare size={18} />, true)}
        {item('/deep-dive', 'Case Deep Dive', <Search size={18} />, true)}
      </div>

      {canInvestigate && (
        <div className="sidebar-group">
          <div className="sidebar-group-label">Intelligence</div>
          {item('/early-warnings', 'Early Warnings', <BellRing size={16} />)}
          {item('/network', 'Criminal Network', <GitBranch size={16} />)}
          {item('/profiles', 'Offender Profiles', <Fingerprint size={16} />)}
        </div>
      )}

      <div className="sidebar-group">
        <div className="sidebar-group-label">Analytics</div>
        {item('/trends', 'Trend Analytics', <ChartNoAxesCombined size={16} />)}
        {item('/spatial', 'Spatial Alerts', <MapPinned size={16} />)}
        {item('/forecast', 'Crime Forecast', <TrendingUp size={16} />)}
        {item('/social-insights', 'Social Insights', <UsersRound size={16} />)}
      </div>

      {(role === 'Supervisor' || role === 'Argos') && (
        <div className="sidebar-group">
          <div className="sidebar-group-label">Governance</div>
          {item('/audit', 'Audit Trail', <ScrollText size={16} />)}
        </div>
      )}
    </nav>
  );
};

const DashboardLayout = ({ children, currentPath }: { children: JSX.Element; currentPath: string }) => {
  const currentRole = localStorage.getItem('ksp_role') || 'Unknown';
  const isDemo = currentRole === 'Argos';
  const handleLogout = () => {
    localStorage.removeItem('ksp_auth_token');
    localStorage.removeItem('ksp_role');
    localStorage.removeItem('ksp_username');
    window.location.href = `${import.meta.env.BASE_URL}#/login`;
  };

  return (
    <div className="athena-shell">
      <aside className="athena-sidebar">
        <div className="sidebar-brand">
          <Shield size={32} strokeWidth={3} />
          <div>
            <h1>KSP-ATHENA</h1>
            <p>Karnataka State Police<br />Intelligence Platform</p>
          </div>
        </div>
        <div className="sidebar-role"><span className="status-dot" /> System online · {currentRole}</div>
        <NavigationSidebar currentPath={currentPath} />
      </aside>

      <div className="athena-workspace">
        <header className="athena-topbar">
          <div>
            <div className="workspace-eyebrow">Secure Intelligence Workspace</div>
            <strong className="workspace-route">{currentPath.replace('/', '').replaceAll('-', ' ') || 'dashboard'}</strong>
          </div>
          <div className="topbar-actions">
            <button className="nb-button session-button" onClick={handleLogout}>End Session</button>
            {isDemo && (
              <div style={{ background: '#22d3ee', border: '2px solid #000', padding: '0.45rem 0.7rem', fontSize: '0.72rem', fontWeight: 900, textAlign: 'center' }}>
                ARGOS · FULL DEMO ACCESS
              </div>
            )}
            <a href={hashHref('/register-case')} style={{ textDecoration: 'none' }}>
              <button className={`nb-button register-fir-button${currentPath === '/register-case' ? ' is-active' : ''}`} type="button">
                <PlusCircle size={16} /> Register Fresh FIR
              </button>
            </a>
          </div>
        </header>
        <main className="athena-content">{children}</main>
      </div>
    </div>
  );
};

function App() {
  const [currentPath, setCurrentPath] = useState(getHashPath);
  const [, setAuthRevision] = useState(0);

  useEffect(() => {
    const handleHashChange = () => setCurrentPath(getHashPath());
    const handleAuthSessionChange = () => setAuthRevision(revision => revision + 1);
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('ksp-auth-session-changed', handleAuthSessionChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('ksp-auth-session-changed', handleAuthSessionChange);
    };
  }, []);

  if (currentPath === '/login') return <Login />;
  if (currentPath === '/register') return <UserRegistration />;

  const protectedScreen = (() => {
    switch (currentPath) {
      case '/chat': return <ChatInterface />;
      case '/register-case': return <FIRIntake />;
      case '/deep-dive': return <CaseDeepDive />;
      case '/trends': return <CrimeTrendAnalytics />;
      case '/audit': return <AuditTrail />;
      case '/spatial': return <SpatialIntelligence />;
      case '/profiles': return <OffenderProfiles />;
      case '/social-insights': return <SociologicalInsights />;
      case '/forecast': return <CrimeForecast />;
      case '/network': return <CriminalNetworkAnalysis />;
      case '/early-warnings': return <EarlyWarningCenter />;
      default: return <Dashboard />;
    }
  })();

  return (
    <RequireAuth>
      <DashboardLayout currentPath={currentPath}>
        <Suspense fallback={<div className="nb-card processing-state"><span className="loading-spinner" /> LOADING SECURE MODULE...</div>}>
          {protectedScreen}
        </Suspense>
      </DashboardLayout>
    </RequireAuth>
  );
}

export default App;
