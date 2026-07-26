import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

vi.mock('./components/Dashboard', () => ({
  Dashboard: () => <div>Authenticated dashboard</div>
}));
vi.mock('./components/ChatInterface', () => ({
  ChatInterface: () => <div>Chat interface</div>
}));
vi.mock('./components/FIRIntake', () => ({
  FIRIntake: () => <div>FIR intake</div>
}));
vi.mock('./components/CaseDeepDive', () => ({
  CaseDeepDive: () => <div>Case deep dive</div>
}));
vi.mock('./components/CrimeTrendAnalytics', () => ({
  CrimeTrendAnalytics: () => <div>Crime trend analytics</div>
}));
vi.mock('./components/AuditTrail', () => ({
  AuditTrail: () => <div>Persistent audit trail</div>
}));
vi.mock('./components/SpatialIntelligence', () => ({
  SpatialIntelligence: () => <div>Spatial intelligence screen</div>
}));
vi.mock('./components/OffenderProfiles', () => ({
  OffenderProfiles: () => <div>Offender profiles screen</div>
}));
vi.mock('./components/SociologicalInsights', () => ({
  SociologicalInsights: () => <div>Sociological insights screen</div>
}));
vi.mock('./components/CrimeForecast', () => ({
  CrimeForecast: () => <div>Transparent crime forecast screen</div>
}));
vi.mock('./components/CriminalNetworkAnalysis', () => ({
  CriminalNetworkAnalysis: () => <div>Explainable criminal network screen</div>
}));
vi.mock('./components/EarlyWarningCenter', () => ({
  EarlyWarningCenter: () => <div>Early warning intelligence screen</div>
}));

const jsonResponse = (body: unknown, ok = true) =>
  Promise.resolve({
    ok,
    json: () => Promise.resolve(body)
  } as Response);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.hash = '';
  vi.restoreAllMocks();
});

test('redirects an unauthenticated user to login', async () => {
  window.location.hash = '#/dashboard';

  render(<App />);

  expect(await screen.findByText('RESTRICTED ACCESS PORTAL')).toBeInTheDocument();
});

test('registers with username, password, code, and selected role, then opens login', async () => {
  window.location.hash = '#/register';
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
    jsonResponse({ success: true })
  );

  render(<App />);

  fireEvent.change(screen.getByLabelText('USERNAME'), { target: { value: 'officer.test' } });
  fireEvent.change(screen.getByLabelText('PASSWORD'), { target: { value: 'SecurePass123!' } });
  fireEvent.change(screen.getByLabelText('4-DIGIT REGISTRATION CODE'), { target: { value: '3024' } });
  fireEvent.change(screen.getByLabelText('ROLE'), { target: { value: 'Investigator' } });
  fireEvent.click(screen.getByRole('button', { name: 'REGISTER ACCOUNT' }));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  expect(fetchMock).toHaveBeenCalledWith(
    '/server/ks_intelli_pol_function/auth/register',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        username: 'officer.test',
        password: 'SecurePass123!',
        registrationCode: '3024',
        role: 'Investigator'
      })
    })
  );
  expect(await screen.findByText('Registration successful. Log in to continue.')).toBeInTheDocument();
});

test('stores a successful login session and opens the protected dashboard', async () => {
  window.location.hash = '#/login';
  vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
    jsonResponse({
      success: true,
      token: 'signed-test-token',
      user: { username: 'officer.test', role: 'Investigator' }
    })
  );

  render(<App />);

  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'officer.test' } });
  fireEvent.change(screen.getByLabelText('Secure Password'), { target: { value: 'SecurePass123!' } });
  fireEvent.click(screen.getByRole('button', { name: 'LOG IN' }));

  expect(await screen.findByText('Authenticated dashboard')).toBeInTheDocument();
  expect(localStorage.getItem('ksp_auth_token')).toBe('signed-test-token');
  expect(localStorage.getItem('ksp_role')).toBe('Investigator');
  expect(localStorage.getItem('ksp_username')).toBe('officer.test');
});

test('opens a public full-access Argos demo without credentials', async () => {
  window.location.hash = '#/login';
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
    jsonResponse({
      success: true,
      token: 'signed-argos-token',
      user: { username: 'demo.argos', role: 'Argos' },
      access: 'FULL_DEMO'
    })
  );

  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'TRY DEMO AS ARGOS' }));

  expect(await screen.findByText('Authenticated dashboard')).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    '/server/ks_intelli_pol_function/auth/demo',
    expect.objectContaining({ method: 'POST' })
  );
  expect(localStorage.getItem('ksp_role')).toBe('Argos');
  expect(screen.getByText(/ARGOS · FULL DEMO ACCESS/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Register Fresh FIR/i })).toBeInTheDocument();
  expect(screen.getByText('Intelligence')).toBeInTheDocument();
  expect(screen.getByText('Governance')).toBeInTheDocument();
});

test('opens the Argos demo from the public root URL without an explicit hash route', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
    jsonResponse({
      success: true,
      token: 'signed-argos-token',
      user: { username: 'demo.argos', role: 'Argos' },
      access: 'FULL_DEMO'
    })
  );

  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'TRY DEMO AS ARGOS' }));

  expect(await screen.findByText('Authenticated dashboard')).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    '/server/ks_intelli_pol_function/auth/demo',
    expect.objectContaining({ method: 'POST' })
  );
  expect(window.location.hash).toBe('#/dashboard');
  expect(localStorage.getItem('ksp_role')).toBe('Argos');
});

test('allows an Argos user to open FIR registration directly', async () => {
  localStorage.setItem('ksp_auth_token', 'signed-argos-token');
  localStorage.setItem('ksp_role', 'Argos');
  window.location.hash = '#/register-case';

  render(<App />);

  expect(await screen.findByText('FIR intake')).toBeInTheDocument();
});

test('opens the protected trend analytics route', async () => {
  localStorage.setItem('ksp_auth_token', 'signed-test-token');
  window.location.hash = '#/trends';

  render(<App />);

  expect(await screen.findByText('Crime trend analytics')).toBeInTheDocument();
});

test('groups the vertical workspace navigation and keeps FIR registration in the header', async () => {
  localStorage.setItem('ksp_auth_token', 'signed-test-token');
  localStorage.setItem('ksp_role', 'Investigator');
  window.location.hash = '#/dashboard';

  render(<App />);

  expect(await screen.findByText('Authenticated dashboard')).toBeInTheDocument();
  expect(screen.getByText('Core Operations')).toBeInTheDocument();
  expect(screen.getByText('Intelligence')).toBeInTheDocument();
  expect(screen.getByText('Analytics')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Conversational Hub/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Case Deep Dive/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Register Fresh FIR/i })).toBeInTheDocument();
});

test('shows the audit route to an authenticated supervisor', async () => {
  localStorage.setItem('ksp_auth_token', 'signed-test-token');
  localStorage.setItem('ksp_role', 'Supervisor');
  window.location.hash = '#/audit';

  render(<App />);

  expect(await screen.findByText('Persistent audit trail')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Audit Trail/i })).toBeInTheDocument();
});

test('opens the protected spatial intelligence route', async () => {
  localStorage.setItem('ksp_auth_token', 'signed-test-token');
  window.location.hash = '#/spatial';

  render(<App />);

  expect(await screen.findByText('Spatial intelligence screen')).toBeInTheDocument();
});

test('shows offender profiles navigation to an investigator', async () => {
  localStorage.setItem('ksp_auth_token', 'signed-test-token');
  localStorage.setItem('ksp_role', 'Investigator');
  window.location.hash = '#/profiles';

  render(<App />);

  expect(await screen.findByText('Offender profiles screen')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Offender Profiles/i })).toBeInTheDocument();
});

test('opens the protected sociological insights route', async () => {
  localStorage.setItem('ksp_auth_token', 'signed-test-token');
  window.location.hash = '#/social-insights';

  render(<App />);

  expect(await screen.findByText('Sociological insights screen')).toBeInTheDocument();
});

test('opens the protected transparent forecast route', async () => {
  localStorage.setItem('ksp_auth_token', 'signed-test-token');
  window.location.hash = '#/forecast';

  render(<App />);

  expect(await screen.findByText('Transparent crime forecast screen')).toBeInTheDocument();
});

test('shows criminal-network analysis to an investigator', async () => {
  localStorage.setItem('ksp_auth_token', 'valid-token');
  localStorage.setItem('ksp_role', 'Investigator');
  window.location.hash = '#/network';

  render(<App />);

  expect(await screen.findByText('Explainable criminal network screen')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Criminal Network/i })).toBeInTheDocument();
});

test('shows early-warning intelligence to an analyst', async () => {
  localStorage.setItem('ksp_auth_token', 'valid-token');
  localStorage.setItem('ksp_role', 'Analyst');
  window.location.hash = '#/early-warnings';

  render(<App />);

  expect(await screen.findByText('Early warning intelligence screen')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Early Warnings/i })).toBeInTheDocument();
});
