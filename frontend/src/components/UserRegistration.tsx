import React, { useState } from 'react';
import { ShieldPlus } from 'lucide-react';
import { apiUrl } from '../api';
import { hashHref, navigateTo } from '../hashRouting';

export const UserRegistration: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        registrationCode: '',
        role: ''
    });
    const [status, setStatus] = useState({ loading: false, error: '' });
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setStatus({ loading: true, error: '' });

        try {
            const response = await fetch(apiUrl('/auth/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Registration failed.');
            }

            sessionStorage.setItem('ksp_registration_complete', 'true');
            navigateTo('/login');
        } catch (error) {
            setStatus({
                loading: false,
                error: error instanceof Error ? error.message : 'Registration failed.'
            });
            return;
        }

        setStatus({ loading: false, error: '' });
    };

    return (
        <div className="nb-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--nb-yellow)' }}>
            <div className="nb-card" style={{ maxWidth: '480px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <ShieldPlus size={54} strokeWidth={3} style={{ margin: '0 auto', display: 'block' }} />
                    <h2 style={{ marginTop: '0.75rem' }}>REGISTER OFFICER</h2>
                    <p style={{ fontWeight: 700, margin: 0 }}>CREATE A KSP-ATHENA ACCOUNT</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ fontWeight: 900 }}>
                        USERNAME
                        <input
                            className="nb-input"
                            value={formData.username}
                            onChange={(event) => setFormData({ ...formData, username: event.target.value })}
                            minLength={3}
                            maxLength={50}
                            autoComplete="username"
                            required
                        />
                    </label>

                    <label style={{ fontWeight: 900 }}>
                        PASSWORD
                        <input
                            type="password"
                            className="nb-input"
                            value={formData.password}
                            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                            minLength={8}
                            maxLength={128}
                            autoComplete="new-password"
                            required
                        />
                    </label>

                    <label style={{ fontWeight: 900 }}>
                        4-DIGIT REGISTRATION CODE
                        <input
                            type="password"
                            inputMode="numeric"
                            pattern="\d{4}"
                            maxLength={4}
                            className="nb-input"
                            value={formData.registrationCode}
                            onChange={(event) => setFormData({ ...formData, registrationCode: event.target.value.replace(/\D/g, '').slice(0, 4) })}
                            autoComplete="one-time-code"
                            required
                        />
                    </label>

                    <label style={{ fontWeight: 900 }}>
                        ROLE
                        <select
                            className="nb-input"
                            value={formData.role}
                            onChange={(event) => setFormData({ ...formData, role: event.target.value })}
                            required
                        >
                            <option value="" disabled>Select your role...</option>
                            <option value="Constable">Constable</option>
                            <option value="Investigator">Investigator</option>
                            <option value="Supervisor">Supervisor</option>
                            <option value="Analyst">Intelligence Analyst</option>
                        </select>
                    </label>

                    {status.error && (
                        <div role="alert" style={{ backgroundColor: '#f87171', border: '2px solid #000', padding: '0.75rem', fontWeight: 800 }}>
                            {status.error}
                        </div>
                    )}

                    <button type="submit" className="nb-button" disabled={status.loading} style={{ backgroundColor: 'var(--nb-yellow)', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        {status.loading && <span className="loading-spinner loading-spinner-small" />}
                        {status.loading ? 'REGISTERING...' : 'REGISTER ACCOUNT'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: 0 }}>
                    Already registered? <a href={hashHref('/login')}>Log in</a>
                </p>
            </div>
        </div>
    );
};
