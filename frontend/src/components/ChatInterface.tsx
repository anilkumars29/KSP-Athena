// frontend/src/components/ChatInterface.tsx
import React, { lazy, Suspense, useEffect, useState, useRef } from 'react';
import { Send, Mic, Download, Search, TrendingUp, Users, UserCheck, ChevronDown, ChevronUp, MessageSquarePlus } from 'lucide-react';
import { authFetch } from '../api';
import { ExplainabilityPanel, legacyExplainability, type Explainability } from './ExplainabilityPanel';

const NetworkGraph = lazy(() =>
    import('./NetworkGraph').then((module) => ({ default: module.NetworkGraph }))
);
const HotspotMap = lazy(() =>
    import('./HotspotMap').then((module) => ({ default: module.HotspotMap }))
);
const MetricsDashboard = lazy(() =>
    import('./MetricsDashboard').then((module) => ({ default: module.MetricsDashboard }))
);

type AgentMode = 'investigator_helper' | 'forecasting_engine' | 'sociological_analyst' | 'profiler_engine';

interface Message {
    sender: 'user' | 'bot';
    text: string;
    isError?: boolean;
    agentUsed?: AgentMode;
    citations?: Array<string | number>;
    rawData?: any[];
    explainability?: Explainability;
}

const createConversationSessionId = () => {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return (values[0] % 2047483647) + 100000000;
};

const getConversationStorageKey = () =>
    `ksp_conversation_session_${localStorage.getItem('ksp_username') || 'unknown'}`;

const getOrCreateConversationSession = () => {
    const storageKey = getConversationStorageKey();
    const existing = Number(localStorage.getItem(storageKey));
    if (Number.isInteger(existing) && existing >= 1 && existing <= 2147483647) {
        return existing;
    }
    const created = createConversationSessionId();
    localStorage.setItem(storageKey, String(created));
    return created;
};

export const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessionId, setSessionId] = useState(getOrCreateConversationSession);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyStatus, setHistoryStatus] = useState('');
    const [inputQuery, setInputQuery] = useState('');
    const [activeAgent, setActiveAgent] = useState<AgentMode>('investigator_helper');
    const [language, setLanguage] = useState<'en' | 'kn'>('en');
    const [loading, setLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // NEW: State for toggling the plain-English agent description
    const [showAgentDesc, setShowAgentDesc] = useState(true);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chatFeedRef = useRef<HTMLDivElement>(null);
    const currentRole = localStorage.getItem('ksp_role') || 'Investigator';

    useEffect(() => {
        let cancelled = false;

        const restoreConversation = async () => {
            setHistoryLoading(true);
            setHistoryStatus('');
            try {
                const response = await authFetch(`/conversation-history?sessionId=${sessionId}`);
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Conversation history could not be loaded.');
                }
                if (!cancelled) {
                    const restored = (result.messages || []).map((message: any): Message => {
                        const sender = message.sender === 'bot' ? 'bot' : 'user';
                        const citations = Array.isArray(message.citations) ? message.citations : [];
                        return {
                            sender,
                            text: String(message.text || ''),
                            agentUsed: ['investigator_helper', 'forecasting_engine', 'sociological_analyst', 'profiler_engine'].includes(message.agentMode)
                                ? message.agentMode as AgentMode
                                : undefined,
                            citations,
                            explainability: sender === 'bot'
                                ? message.explainability || legacyExplainability(citations)
                                : undefined
                        };
                    });
                    setMessages(restored);
                    setHistoryStatus(restored.length > 0
                        ? `RESTORED ${restored.length} SAVED MESSAGES`
                        : 'NEW CONVERSATION');
                }
            } catch {
                if (!cancelled) {
                    setHistoryStatus('HISTORY UNAVAILABLE — NEW MESSAGES STILL WORK');
                }
            } finally {
                if (!cancelled) setHistoryLoading(false);
            }
        };

        restoreConversation();
        return () => {
            cancelled = true;
        };
    }, [sessionId]);

    const handleNewConversation = () => {
        const created = createConversationSessionId();
        localStorage.setItem(getConversationStorageKey(), String(created));
        setMessages([]);
        setInputQuery('');
        setSessionId(created);
    };

    // NEW: Plain English descriptions for non-technical officers
    const agentDescriptions: Record<AgentMode, string> = {
        'investigator_helper': 'Ask simple questions in plain English to instantly search through all police records and FIRs. (Example: "Show me all vehicle thefts in Koramangala last month").',
        'forecasting_engine': 'Shows observed concentrations of registered incidents on the map. This is historical monitoring, not a prediction of future crime.',
        'sociological_analyst': 'Summarizes live registered-case totals and crime-type distributions. It does not infer demographic or social causes.',
        'profiler_engine': 'Visualizes names appearing across the live records returned by your search. Shared names are leads only, not confirmed identity matches.'
    };

    const handleExportPDF = async () => {
        if (!chatFeedRef.current || messages.length === 0) return;
        setIsExporting(true);

        try {
            const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
                import('html2canvas'),
                import('jspdf')
            ]);

            // Capture the chat feed as a canvas
            const canvas = await html2canvas(chatFeedRef.current, {
                scale: 2, // High resolution
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // Add Header
            pdf.setFontSize(16);
            pdf.setFont("helvetica", "bold");
            pdf.text("KSP-ATHENA : OFFICIAL INTELLIGENCE REPORT", 10, 15);

            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
            pdf.text(`Generated By: ${currentRole} | Agent: ${activeAgent.replace('_', ' ').toUpperCase()}`, 10, 22);
            pdf.text(`Date: ${new Date().toLocaleString()}`, 10, 27);

            pdf.setLineWidth(0.5);
            pdf.line(10, 30, pdfWidth - 10, 30);

            // Add Image
            pdf.addImage(imgData, 'PNG', 10, 35, pdfWidth - 20, pdfHeight - 40);

            pdf.save(`KSP_Athena_Report_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error("PDF Export failed:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const toggleRecording = async () => {
        if (isRecording) {
            // If already recording, stop it and process the audio
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/wav' });

                // Turn off the red recording light on the browser tab
                stream.getTracks().forEach(track => track.stop());

                setLoading(true);
                const formData = new FormData();
                formData.append('audio', audioBlob);
                formData.append('language', language);

                try {
                    const response = await authFetch('/transcribe', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await response.json();

                    if (data.success) {
                        setInputQuery(prev => prev + (prev ? ' ' : '') + data.transcript);
                    } else {
                        alert('Transcription error: ' + (data.error || 'Unknown error'));
                    }
                } catch (err) {
                    console.error("Failed to send audio:", err);
                } finally {
                    setLoading(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone error:", err);
            alert("Microphone access is required to use this feature.");
        }
    };

    const handleSend = async () => {
        if (!inputQuery.trim() || historyLoading) return;

        const queryText = inputQuery;
        const userMsg: Message = { sender: 'user', text: queryText };
        setMessages((prev) => [...prev, userMsg]);
        setInputQuery('');
        setLoading(true);

        try {
            // Target Catalyst Advanced I/O Function Route
            const response = await authFetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userQuery: queryText,
                    agentMode: activeAgent,
                    language: language,
                    sessionId
                })
            });

            const data = await response.json();

            if (data.success) {
                if (data.conversation?.sessionId && Number(data.conversation.sessionId) !== sessionId) {
                    const returnedSessionId = Number(data.conversation.sessionId);
                    localStorage.setItem(getConversationStorageKey(), String(returnedSessionId));
                    setSessionId(returnedSessionId);
                }
                setHistoryStatus(data.conversation?.historyAvailable === false
                    ? 'RESPONSE READY — HISTORY COULD NOT BE SAVED'
                    : 'CONTEXT SAVED');
                const botMsg: Message = {
                    sender: 'bot',
                    text: data.response || 'Query processed successfully.',
                    agentUsed: activeAgent,
                    // If forecasting or sociological, don't show the generic data table
                    rawData: (activeAgent === 'forecasting_engine' || activeAgent === 'sociological_analyst') ? undefined : data.data,
                    citations: data.citations || data.data?.map((item: any) => item.CaseMasterID || item.CrimeNo || item.CASE_ID).filter(Boolean),
                    explainability: data.explainability || legacyExplainability(data.citations || [])
                };
                setMessages((prev) => [...prev, botMsg]);
            } else {
                throw new Error(data.error || 'Server error occurred.');
            }
        } catch (error) {
            console.error("Backend intelligence request failed:", error);
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    text: 'The live intelligence service is unavailable. No analysis or case data was generated.',
                    agentUsed: activeAgent,
                    isError: true
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const agentConfig = [
        { id: 'investigator_helper' as AgentMode, name: 'Investigator Helper', desc: 'NL2SQL Case Search', icon: <Search size={18} />, placeholder: 'Search FIRs...' },
        { id: 'forecasting_engine' as AgentMode, name: 'Hotspot Monitor', desc: 'Observed Incident Map', icon: <TrendingUp size={18} />, placeholder: 'Show registered incident concentrations...' },
        { id: 'sociological_analyst' as AgentMode, name: 'Crime Trends', desc: 'Live Case Distribution', icon: <Users size={18} />, placeholder: 'Summarize registered crime patterns...' },
        { id: 'profiler_engine' as AgentMode, name: 'Case Link Explorer', desc: 'Name-Based Record Links', icon: <UserCheck size={18} />, placeholder: 'Find names across registered cases...' }
    ];

    const currentAgentInfo = agentConfig.find(a => a.id === activeAgent)!;

    return (
        <div className="nb-card" style={{ display: 'flex', flexDirection: 'column', height: '78vh' }}>

            {/* 4 Agent Selection Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem', borderBottom: '4px solid #000', paddingBottom: '1rem' }}>
                {agentConfig.map((agent) => (
                    <button
                        key={agent.id}
                        onClick={() => {
                            setActiveAgent(agent.id);
                            setShowAgentDesc(true); // Auto-expand description when switching agents
                        }}
                        className="nb-button"
                        style={{
                            backgroundColor: activeAgent === agent.id ? 'var(--nb-yellow)' : '#fff',
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.75rem', gap: '0.25rem', textAlign: 'left'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 900, fontSize: '0.9rem' }}>
                            {agent.icon} {agent.name}
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.8 }}>{agent.desc}</span>
                    </button>
                ))}
            </div>

            {/* UPATED: Header Info & Toggle Banner Area */}
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '0.75rem', border: '2px solid #000' }}>

                {/* Main Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f5f5f5', padding: '0.5rem 1rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                        ACTIVE AGENT: <span style={{ textTransform: 'uppercase', textDecoration: 'underline' }}>{currentAgentInfo.name}</span>
                    </span>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800 }}>
                            {historyLoading ? 'LOADING CONTEXT...' : historyStatus}
                        </span>
                        <button
                            onClick={handleNewConversation}
                            disabled={historyLoading}
                            className="nb-button"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            title="Start a new conversation without deleting saved history"
                        >
                            <MessageSquarePlus size={14} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                            NEW
                        </button>
                        <button onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')} className="nb-button" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                            LANG: {language.toUpperCase()}
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting || messages.length === 0}
                            className="nb-button"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: (isExporting || messages.length === 0) ? '#ccc' : '#fff' }}
                        >
                            <Download size={14} style={{ verticalAlign: 'middle', marginRight: '2px' }} />
                            {isExporting ? 'EXPORTING...' : 'PDF'}
                        </button>

                        {/* The 'v' Toggle Button */}
                        <button
                            onClick={() => setShowAgentDesc(!showAgentDesc)}
                            className="nb-button"
                            style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Toggle Agent Description"
                        >
                            {showAgentDesc ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>
                </div>

                {/* Collapsible Simple English Description Banner */}
                {showAgentDesc && (
                    <div style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--nb-yellow)',
                        borderTop: '2px solid #000',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#000'
                    }}>
                        ℹ️ {agentDescriptions[activeAgent]}
                    </div>
                )}
            </div>

            {/* Messages Feed (Target for PDF Export) */}
            <div ref={chatFeedRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', paddingBottom: '1rem' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`nb-card ${msg.sender === 'user' ? 'yellow' : ''}`}
                        style={{
                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: (msg.agentUsed === 'forecasting_engine' || msg.agentUsed === 'profiler_engine' || msg.agentUsed === 'sociological_analyst') ? '90%' : '80%',
                            margin: '0.25rem 0',
                            width: (msg.agentUsed === 'forecasting_engine' || msg.agentUsed === 'profiler_engine' || msg.agentUsed === 'sociological_analyst') ? '100%' : 'auto',
                            backgroundColor: msg.isError ? '#f87171' : undefined
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                            <span>{msg.sender === 'user' ? 'QUERY' : msg.isError ? 'LIVE SERVICE ERROR' : 'ATHENA INTELLIGENCE'}</span>
                            {msg.agentUsed && <span style={{ textTransform: 'uppercase', backgroundColor: '#000', color: '#fff', padding: '1px 6px' }}>{msg.agentUsed}</span>}
                        </div>

                        <p style={{ margin: 0, marginBottom: (msg.agentUsed === 'forecasting_engine' || msg.agentUsed === 'profiler_engine' || msg.agentUsed === 'sociological_analyst') ? '1rem' : '0' }}>
                            {msg.text}
                        </p>

                        {/* 1. Spatial Hotspot Map */}
                        {!msg.isError && msg.agentUsed === 'forecasting_engine' && (
                            <Suspense fallback={<div>LOADING INCIDENT MAP...</div>}>
                                <HotspotMap />
                            </Suspense>
                        )}

                        {/* 2. Profiler Network Graph */}
                        {!msg.isError && msg.agentUsed === 'profiler_engine' && (
                            <Suspense fallback={<div>LOADING LINK GRAPH...</div>}>
                                <NetworkGraph data={msg.rawData || []} />
                            </Suspense>
                        )}

                        {/* 3. Sociological Analyst Dashboard */}
                        {!msg.isError && msg.agentUsed === 'sociological_analyst' && (
                            <Suspense fallback={<div>LOADING METRICS...</div>}>
                                <MetricsDashboard />
                            </Suspense>
                        )}

                        {/* 4. Standard Data Table (for Investigator Helper / default) */}
                        {msg.rawData && msg.rawData.length > 0 && msg.agentUsed !== 'forecasting_engine' && msg.agentUsed !== 'profiler_engine' && msg.agentUsed !== 'sociological_analyst' && (
                            <div style={{ marginTop: '1rem', overflowX: 'auto', border: '2px solid #000' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left', backgroundColor: '#fff' }}>
                                    <thead style={{ backgroundColor: '#000', color: '#fff' }}>
                                        <tr>
                                            {Object.keys(msg.rawData[0]).map((key) => (
                                                <th key={key} style={{ padding: '0.5rem', border: '1px solid #000', textTransform: 'uppercase' }}>
                                                    {key}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {msg.rawData.map((row, rowIndex) => (
                                            <tr key={rowIndex} style={{ borderBottom: '1px solid #000' }}>
                                                {Object.values(row).map((val: any, colIndex) => (
                                                    <td key={colIndex} style={{ padding: '0.5rem', border: '1px solid #000', fontWeight: 600 }}>
                                                        {String(val)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {!msg.isError && msg.sender === 'bot' && msg.explainability && (
                            <ExplainabilityPanel evidence={msg.explainability} />
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="nb-card processing-state" style={{ alignSelf: 'flex-start' }}>
                        <span className="loading-spinner" />
                        <strong>{currentAgentInfo.name}</strong> is processing database queries via Groq LPU...
                    </div>
                )}
            </div>

            {/* Query Input */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <input
                    className="nb-input" placeholder={currentAgentInfo.placeholder}
                    value={inputQuery} onChange={(e) => setInputQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                    onClick={toggleRecording}
                    className="nb-button"
                    style={{
                        backgroundColor: isRecording ? '#ff0000' : '#fff',
                        color: isRecording ? '#fff' : '#000',
                        transition: 'all 0.2s'
                    }}
                    title={isRecording ? "Click to Stop Recording" : "Click to Speak"}
                >
                    <Mic size={20} />
                </button>
                <button className="nb-button" onClick={handleSend} aria-label="Send query"><Send size={20} /></button>
            </div>
        </div>
    );
};
