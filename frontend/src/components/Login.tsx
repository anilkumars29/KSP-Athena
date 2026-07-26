// frontend/src/components/Login.tsx
import React, { useEffect, useState } from 'react';
import { Eye, Shield } from 'lucide-react';
import { apiUrl } from '../api';
import { hashHref, navigateTo } from '../hashRouting';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState({ loading: false, error: '' });
    const [demoLoading, setDemoLoading] = useState(false);
    const [registrationComplete] = useState(
        () => sessionStorage.getItem('ksp_registration_complete') === 'true'
    );

    useEffect(() => {
        sessionStorage.removeItem('ksp_registration_complete');
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ loading: true, error: '' });

        try {
            const response = await fetch(apiUrl('/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Login failed.');
            }

            localStorage.setItem('ksp_auth_token', result.token);
            localStorage.setItem('ksp_role', result.user.role);
            localStorage.setItem('ksp_username', result.user.username);
            navigateTo('/dashboard');
        } catch (error) {
            setStatus({
                loading: false,
                error: error instanceof Error ? error.message : 'Login failed.'
            });
            return;
        }

        setStatus({ loading: false, error: '' });
    };

    const handleDemo = async () => {
        setDemoLoading(true);
        setStatus({ loading: false, error: '' });

        try {
            const response = await fetch(apiUrl('/auth/demo'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'The public demo is unavailable.');
            }

            localStorage.setItem('ksp_auth_token', result.token);
            localStorage.setItem('ksp_role', result.user.role);
            localStorage.setItem('ksp_username', result.user.username);
            navigateTo('/dashboard');
        } catch (error) {
            setStatus({
                loading: false,
                error: error instanceof Error ? error.message : 'The public demo is unavailable.'
            });
        } finally {
            setDemoLoading(false);
        }
    };

    return (
        <div className="nb-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--nb-yellow)' }}>
            <div className="nb-card" style={{ maxWidth: '450px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <Shield size={56} color="#000" strokeWidth={3} style={{ margin: '0 auto', display: 'block' }} />
                    <h2 style={{ marginTop: '1rem' }}>KSP-ATHENA</h2>
                    <p style={{ fontWeight: 700, margin: 0 }}>RESTRICTED ACCESS PORTAL</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label htmlFor="login-username" style={{ fontWeight: 900, display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                            Username
                        </label>
                        <input
                            type="text"
                            id="login-username"
                            className="nb-input"
                            placeholder="Enter ID..."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="login-password" style={{ fontWeight: 900, display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                            Secure Password
                        </label>
                        <input
                            type="password"
                            id="login-password"
                            className="nb-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {registrationComplete && !status.error && (
                        <div style={{ backgroundColor: '#4ade80', border: '2px solid #000', padding: '0.75rem', fontWeight: 800 }}>
                            Registration successful. Log in to continue.
                        </div>
                    )}
                    {status.error && (
                        <div role="alert" style={{ backgroundColor: '#f87171', border: '2px solid #000', padding: '0.75rem', fontWeight: 800 }}>
                            {status.error}
                        </div>
                    )}

                    <button type="submit" disabled={status.loading || demoLoading} className="nb-button" style={{ marginTop: '0.5rem', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        {status.loading && <span className="loading-spinner loading-spinner-small" />}
                        {status.loading ? 'AUTHENTICATING...' : 'LOG IN'}
                    </button>
                </form>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', margin: '1.1rem 0 0.8rem', fontSize: '0.72rem', fontWeight: 900 }}>
                    <span style={{ height: 2, flex: 1, background: '#000' }} />
                    OR EXPLORE
                    <span style={{ height: 2, flex: 1, background: '#000' }} />
                </div>
                <button
                    type="button"
                    onClick={() => void handleDemo()}
                    disabled={status.loading || demoLoading}
                    className="nb-button"
                    style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1.05rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.55rem',
                        background: '#22d3ee',
                        boxShadow: '6px 6px 0 #000'
                    }}
                >
                    {demoLoading ? <span className="loading-spinner loading-spinner-small" /> : <Eye size={20} />}
                    {demoLoading ? 'OPENING DEMO...' : 'TRY DEMO AS ARGOS'}
                </button>
                <p style={{ margin: '0.65rem 0 0', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                    Public full-feature demo · 30-minute session
                </p>
                <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: 0 }}>
                    New user? <a href={hashHref('/register')}>Register here</a>
                </p>
            </div>
        </div>
    );
};
