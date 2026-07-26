import React from 'react';
import { render, screen } from '@testing-library/react';
import { OffenderProfiles } from './OffenderProfiles';
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

test('blocks constables before requesting profile data', () => {
    localStorage.setItem('ksp_role', 'Constable');
    render(<OffenderProfiles />);
    expect(screen.getByText(/require the Investigator, Analyst, or Supervisor role/)).toBeInTheDocument();
    expect(authFetch).not.toHaveBeenCalled();
});

test('shows explainable profiles without exposing mobile values', async () => {
    localStorage.setItem('ksp_role', 'Investigator');
    vi.mocked(authFetch).mockResolvedValue(response({
        success: true,
        data: {
            profiles: [{
                id: 'ravi kumar',
                displayName: 'Ravi Kumar',
                caseCount: 2,
                activeCaseCount: 2,
                firstRecordedAt: '2026-06-20T00:00:00.000Z',
                lastRecordedAt: '2026-07-20T00:00:00.000Z',
                crimeTypes: ['Vehicle Theft', 'Robbery'],
                divisions: ['South', 'East'],
                pincodes: ['560034', '560038'],
                statuses: ['Registered'],
                cases: [
                    { crimeNo: '1', crimeType: 'Vehicle Theft', division: 'South', pincode: 560034, status: 'Registered', registeredAt: '2026-07-20' },
                    { crimeNo: '2', crimeType: 'Robbery', division: 'East', pincode: 560038, status: 'Registered', registeredAt: '2026-06-20' }
                ],
                modusIndicators: [{ name: 'Identity concealment', caseCount: 1, crimeNos: ['1'] }],
                identityAssessment: {
                    status: 'SHARED IDENTIFIER PRESENT',
                    distinctMobileIdentifierCount: 1,
                    warning: 'Verify identity independently.'
                },
                priority: {
                    score: 65,
                    label: 'MEDIUM REVIEW PRIORITY',
                    breakdown: [{ factor: 'Repeated recorded associations', points: 20, evidence: '2 records' }]
                }
            }],
            coverage: { recordsReviewed: 20, namedAccusedGroups: 5, profilesReturned: 1, minCases: 2, recordCapReached: false, analysisAsOf: '2026-07-26' },
            method: 'Explainable recorded-history scoring.'
        }
    }));

    render(<OffenderProfiles />);

    expect(await screen.findByText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.getByText('65/100')).toBeInTheDocument();
    expect(screen.getByText(/Identity concealment/)).toBeInTheDocument();
    expect(screen.queryByText(/9999999999/)).not.toBeInTheDocument();
    expect(authFetch).toHaveBeenCalledWith('/offender-profiles?minCases=2');
});
