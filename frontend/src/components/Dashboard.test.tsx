import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { authFetch } from '../api';

vi.mock('../api', () => ({ authFetch: vi.fn() }));

const response = (data: unknown) => ({
    ok: true,
    json: () => Promise.resolve({ success: true, data })
} as Response);

const metrics = (division: string, divisionCases: unknown[]) => ({
    totalCases: divisionCases.length || 2,
    statusCounts: { registered: 1, pending: 1, inCourt: 0, closed: 0 },
    casesByType: [{ name: 'Theft', count: divisionCases.length || 2 }],
    availableDivisions: ['Mysuru Division'],
    recordCapReached: false,
    division,
    divisionCases
});

test('keeps the all-divisions view unchanged and lists basic FIR data for a selected division', async () => {
    vi.mocked(authFetch).mockReset();
    vi.mocked(authFetch)
        .mockResolvedValueOnce(response(metrics('All Divisions', [])))
        .mockResolvedValueOnce(response(metrics('Mysuru Division', [{
            crimeNo: '1002',
            crimeType: 'Vehicle Theft',
            caseStatus: 'Under Investigation',
            registeredAt: '2026-07-18T19:40:00Z'
        }])));

    render(<Dashboard />);

    expect(await screen.findByText('Primary Crime Classification Breakdown')).toBeInTheDocument();
    expect(screen.queryByText(/CASES IN MYSURU DIVISION/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Mysuru Division' } });

    expect(await screen.findByText('CASES IN MYSURU DIVISION')).toBeInTheDocument();
    expect(screen.getByText('1002')).toBeInTheDocument();
    expect(screen.getByText('Vehicle Theft')).toBeInTheDocument();
    expect(screen.getAllByText('Under Investigation').length).toBeGreaterThan(1);
    await waitFor(() => expect(authFetch).toHaveBeenLastCalledWith(
        '/dashboard-metrics?division=Mysuru%20Division'
    ));
});
