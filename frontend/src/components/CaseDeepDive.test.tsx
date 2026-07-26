import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CaseDeepDive } from './CaseDeepDive';
import { authFetch } from '../api';

vi.mock('../api', () => ({ authFetch: vi.fn() }));

const reportMocks = vi.hoisted(() => ({
    capture: vi.fn(),
    addImage: vi.fn(),
    save: vi.fn()
}));

vi.mock('html2canvas', () => ({
    default: reportMocks.capture
}));

vi.mock('jspdf', () => ({
    default: class MockPdf {
        internal = {
            pageSize: {
                getWidth: () => 210,
                getHeight: () => 297
            }
        };
        addImage = reportMocks.addImage;
        save = reportMocks.save;
    }
}));

const response = (body: unknown, ok = true) => ({
    ok,
    json: () => Promise.resolve(body)
} as Response);

test('shows explainable similar cases and repeat name associations', async () => {
    vi.mocked(authFetch)
        .mockResolvedValueOnce(response({
            success: true,
            data: [{
                CrimeNo: 1001,
                CrimeTypeName: 'Vehicle Theft',
                RegisteredAt: '2026-07-18 19:40:00',
                VictimName: 'Test Victim',
                AccusedName: 'Ravi Kumar',
                VictimStatement: 'A motorcycle was stolen.'
            }]
        }))
        .mockResolvedValueOnce(response({
            success: true,
            data: {
                targetCrimeNo: '1001',
                similarCases: [{
                    crimeNo: '1002',
                    crimeType: 'Vehicle Theft',
                    registeredAt: '2026-06-20 20:00:00',
                    division: 'Bengaluru South',
                    pincode: 560034,
                    caseStatus: 'Registered',
                    score: 85,
                    reasons: ['Same crime type', 'Same pincode 560034']
                }],
                repeatAssociations: [{
                    name: 'Ravi Kumar',
                    caseCount: 2,
                    cases: [
                        { crimeNo: '1001', crimeType: 'Vehicle Theft', registeredAt: null, division: 'South' },
                        { crimeNo: '1002', crimeType: 'Robbery', registeredAt: null, division: 'East' }
                    ]
                }],
                sensitiveSignalsIncluded: true,
                coverage: {
                    recordsCompared: 20,
                    recordCapReached: false,
                    method: 'Deterministic matching.'
                }
            }
        }))
        .mockResolvedValueOnce(response({
            success: true,
            data: {
                crimeNo: '1001',
                overview: 'FIR 1001 records vehicle theft and is currently marked Registered.',
                keyFacts: [
                    { label: 'Crime number', value: '1001', source: 'CrimeNo' },
                    { label: 'Crime type', value: 'Vehicle Theft', source: 'CrimeTypeName' }
                ],
                statementExcerpts: ['A motorcycle was stolen.'],
                timeline: [{
                    order: 0,
                    label: 'Recorded incident date',
                    event: '2026-07-18 19:40:00',
                    source: 'RegisteredAt',
                    precision: 'Structured FIR field'
                }],
                evidenceLeads: [{
                    category: 'Vehicle',
                    excerpt: 'A motorcycle was stolen.',
                    source: 'VictimStatement',
                    suggestedCheck: 'Verify the vehicle identifier.'
                }],
                statementAnalysisAvailable: true,
                method: 'Extractive rules.'
            }
        }));

    render(<CaseDeepDive />);
    fireEvent.change(screen.getByPlaceholderText('Enter Crime No...'), { target: { value: '1001' } });
    fireEvent.click(screen.getByRole('button', { name: /PULL RECORD/ }));

    expect((await screen.findAllByText(/FIR 1002/)).length).toBeGreaterThan(0);
    expect(screen.getByText('Same crime type')).toBeInTheDocument();
    expect(screen.getByText(/Ravi Kumar · 2 recorded FIR associations/)).toBeInTheDocument();
    expect(await screen.findByText(/FIR 1001 records vehicle theft/)).toBeInTheDocument();
    expect(screen.getByText('EVIDENCE LEADS & SUGGESTED CHECKS')).toBeInTheDocument();
    expect(authFetch).toHaveBeenNthCalledWith(
        2,
        '/case-intelligence',
        expect.objectContaining({ body: JSON.stringify({ CrimeNo: '1001' }) })
    );
    expect(authFetch).toHaveBeenNthCalledWith(
        3,
        '/case-brief',
        expect.objectContaining({ body: JSON.stringify({ CrimeNo: '1001' }) })
    );
});

test('holds a bilingual Sarvam conversation scoped to the selected FIR', async () => {
    vi.mocked(authFetch).mockReset();
    vi.mocked(authFetch)
        .mockResolvedValueOnce(response({
            success: true,
            data: [{
                CrimeNo: 1001,
                CrimeTypeName: 'Vehicle Theft',
                RegisteredAt: '2026-07-18 19:40:00',
                VictimName: 'Test Victim',
                AccusedName: 'Unknown',
                VictimStatement: 'The two people wore helmets, so their faces were not visible.'
            }]
        }))
        .mockResolvedValueOnce(response({
            success: true,
            data: {
                targetCrimeNo: '1001',
                similarCases: [],
                repeatAssociations: [],
                sensitiveSignalsIncluded: true,
                coverage: { recordsCompared: 1, recordCapReached: false, method: 'Deterministic matching.' }
            }
        }))
        .mockResolvedValueOnce(response({
            success: true,
            data: {
                crimeNo: '1001',
                overview: 'Vehicle theft FIR.',
                keyFacts: [],
                statementExcerpts: [],
                timeline: [],
                evidenceLeads: [],
                statementAnalysisAvailable: true,
                method: 'Extractive rules.'
            }
        }))
        .mockResolvedValueOnce(response({
            success: true,
            response: 'No. Their faces were not visible because they wore helmets. Source: VictimStatement.',
            audio: null,
            audioMimeType: null,
            grounding: {
                crimeNo: '1001',
                fields: ['CrimeNo', 'VictimStatement'],
                scope: 'SELECTED_FIR_ONLY',
                model: 'sarvam-30b'
            }
        }));

    render(<CaseDeepDive />);
    fireEvent.change(screen.getByPlaceholderText('Enter Crime No...'), { target: { value: '1001' } });
    fireEvent.click(screen.getByRole('button', { name: /PULL RECORD/ }));

    const questionInput = await screen.findByPlaceholderText('Ask anything about this FIR...');
    fireEvent.change(questionInput, { target: { value: 'Were their faces visible?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send case question' }));

    expect(await screen.findByText(/Their faces were not visible/)).toBeInTheDocument();
    await waitFor(() => expect(authFetch).toHaveBeenCalledTimes(4));
    expect(authFetch).toHaveBeenNthCalledWith(
        4,
        '/case-conversation',
        expect.objectContaining({
            body: expect.stringContaining('"CrimeNo":"1001"')
        })
    );
    const requestBody = JSON.parse(
        vi.mocked(authFetch).mock.calls[3][1]?.body as string
    );
    expect(requestBody.statement).toBeUndefined();
    expect(requestBody.language).toBe('en');
    expect(requestBody.speak).toBe(true);
});

test('downloads a one-page case report with all available FIR fields', async () => {
    vi.mocked(authFetch).mockReset();
    reportMocks.capture.mockReset();
    reportMocks.addImage.mockReset();
    reportMocks.save.mockReset();
    reportMocks.capture.mockResolvedValue({
        toDataURL: () => 'data:image/jpeg;base64,report'
    });
    vi.mocked(authFetch)
        .mockResolvedValueOnce(response({
            success: true,
            data: [{
                CrimeNo: 1001,
                CrimeTypeName: 'Vehicle Theft',
                CaseStatus: 'Under Investigation',
                RegisteredAt: '2026-07-18 19:40:00',
                DivisionName: 'Bengaluru South',
                Pincode: 560034,
                VictimName: 'Test Victim',
                VictimAge: 31,
                VictimMobile: '9000000010',
                VictimAddress: 'Koramangala, Bengaluru',
                AccusedName: 'Unknown',
                VictimStatement: 'A motorcycle was stolen from the recorded address.'
            }]
        }))
        .mockResolvedValueOnce(response({
            success: true,
            data: {
                targetCrimeNo: '1001',
                similarCases: [],
                repeatAssociations: [],
                sensitiveSignalsIncluded: true,
                coverage: { recordsCompared: 1, recordCapReached: false, method: 'Deterministic matching.' }
            }
        }))
        .mockResolvedValueOnce(response({
            success: true,
            data: {
                crimeNo: '1001',
                overview: 'Vehicle theft FIR.',
                keyFacts: [],
                statementExcerpts: [],
                timeline: [],
                evidenceLeads: [],
                statementAnalysisAvailable: true,
                method: 'Extractive rules.'
            }
        }));

    render(<CaseDeepDive />);
    fireEvent.change(screen.getByPlaceholderText('Enter Crime No...'), { target: { value: '1001' } });
    fireEvent.click(screen.getByRole('button', { name: /PULL RECORD/ }));

    const downloadButton = await screen.findByRole('button', { name: 'DOWNLOAD CASE REPORT' });
    expect(screen.getByText('KSP-ATHENA Report')).toBeInTheDocument();
    expect(screen.getByText('VICTIM MOBILE')).toBeInTheDocument();
    expect(screen.getByText('VICTIM ADDRESS')).toBeInTheDocument();
    fireEvent.click(downloadButton);

    await waitFor(() => {
        expect(reportMocks.capture).toHaveBeenCalledTimes(1);
        expect(reportMocks.addImage).toHaveBeenCalledWith(
            'data:image/jpeg;base64,report',
            'JPEG',
            0,
            0,
            210,
            297
        );
        expect(reportMocks.save).toHaveBeenCalledWith('KSP-ATHENA_Case_1001_Report.pdf');
    });
});
