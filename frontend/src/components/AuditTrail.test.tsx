import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuditTrail } from './AuditTrail';
import { authFetch } from '../api';

vi.mock('../api', () => ({ authFetch: vi.fn() }));

const response = (body: unknown, ok = true) => ({
    ok,
    json: () => Promise.resolve(body)
} as Response);

beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
});

test('blocks non-supervisors before requesting audit data', () => {
    localStorage.setItem('ksp_role', 'Investigator');
    render(<AuditTrail />);
    expect(screen.getByText(/restricted to the Supervisor role/)).toBeInTheDocument();
    expect(authFetch).not.toHaveBeenCalled();
});

test('shows signed events and integrity flags to supervisors', async () => {
    localStorage.setItem('ksp_role', 'Supervisor');
    vi.mocked(authFetch).mockResolvedValue(response({
        success: true,
        data: [
            {
                auditId: '1001',
                actorId: '44',
                username: 'officer.test',
                role: 'Investigator',
                action: 'CASE_VIEWED',
                outcome: 'SUCCESS',
                targetType: 'FIR',
                targetId: '4589',
                details: { found: true },
                createdAt: '2026-07-26 10:00:00',
                intact: true,
                version: 'audit-v1'
            },
            {
                auditId: '1002',
                actorId: '45',
                username: 'analyst.test',
                role: 'Analyst',
                action: 'CHAT_QUERY',
                outcome: 'SUCCESS',
                targetType: 'CaseRegistration',
                targetId: '',
                details: {},
                createdAt: '2026-07-26 10:01:00',
                intact: false,
                version: 'audit-v1'
            }
        ]
    }));

    render(<AuditTrail />);

    expect(await screen.findByText('officer.test')).toBeInTheDocument();
    expect(screen.getByText('analyst.test')).toBeInTheDocument();
    expect(screen.getByText('VERIFIED')).toBeInTheDocument();
    expect(screen.getByText('FLAGGED')).toBeInTheDocument();
    expect(authFetch).toHaveBeenCalledWith('/audit-events?limit=100');
});
