import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ChatInterface } from './ChatInterface';
import { authFetch } from '../api';

vi.mock('../api', () => ({
    authFetch: vi.fn()
}));

const authFetchMock = vi.mocked(authFetch);
const response = (body: unknown, ok = true) => ({
    ok,
    json: async () => body
} as Response);

beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('ksp_username', 'officer.test');
    localStorage.setItem('ksp_role', 'Investigator');
    authFetchMock.mockReset();
});

test('restores saved messages and sends follow-up queries in the same session', async () => {
    authFetchMock.mockResolvedValueOnce(response({
        success: true,
        messages: [
            { sender: 'user', text: 'Show thefts in Koramangala.' },
            { sender: 'bot', text: 'Two cases were found.', agentMode: 'investigator_helper', citations: [123456] }
        ]
    }));

    render(<ChatInterface />);

    expect(await screen.findByText('Show thefts in Koramangala.')).toBeInTheDocument();
    expect(screen.getByText('Two cases were found.')).toBeInTheDocument();

    const historyCall = String(authFetchMock.mock.calls[0][0]);
    const sessionId = Number(new URLSearchParams(historyCall.split('?')[1]).get('sessionId'));
    expect(sessionId).toBeGreaterThan(0);

    authFetchMock.mockResolvedValueOnce(response({
        success: true,
        response: 'One case was found last month.',
        data: [{ CrimeNo: 654321 }],
        citations: [654321],
        explainability: {
            version: 'evidence-v1',
            dataSource: 'CaseRegistration',
            evidenceStatus: 'MATCHING_RECORDS',
            resultCount: 1,
            citedFirs: ['654321'],
            selectedFields: ['CrimeNo'],
            appliedFilters: [{ name: 'registeredFrom', label: 'Registered from', value: '2026-06-01 00:00:00' }],
            sort: 'newest',
            requestedLimit: 20,
            limitReached: false,
            dataReferences: [{ crimeNo: '654321', availableFields: ['CrimeNo'] }],
            processingTrace: ['Executed a server-constructed read-only lookup.'],
            safeguards: ['The language model did not generate database code.'],
            limitations: ['Verify the generated prose.']
        },
        conversation: { sessionId, historyAvailable: true }
    }));

    fireEvent.change(screen.getByPlaceholderText('Search FIRs...'), {
        target: { value: 'What about last month?' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send query' }));

    expect(await screen.findByText('One case was found last month.')).toBeInTheDocument();
    expect(screen.getAllByText('EVIDENCE & REASONING').length).toBeGreaterThan(0);
    expect(screen.getAllByText('654321').length).toBeGreaterThan(0);
    await waitFor(() => expect(authFetchMock).toHaveBeenCalledTimes(2));

    const [, request] = authFetchMock.mock.calls[1];
    expect(JSON.parse(String(request?.body))).toEqual(expect.objectContaining({
        userQuery: 'What about last month?',
        sessionId
    }));
});
