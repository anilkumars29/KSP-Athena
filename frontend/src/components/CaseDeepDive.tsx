// frontend/src/components/CaseDeepDive.tsx
import React, { useState, useRef } from 'react';
import {
    Search, Mic, Send, AlertCircle, MessageSquare, GitCompareArrows, Link2,
    ShieldCheck, ClipboardList, Clock3, Lightbulb, Quote, Volume2, VolumeX, Play,
    Download
} from 'lucide-react';
import { authFetch } from '../api';

interface CaseRecord {
    crimeNo: string;
    crimeType: string;
    date: string;
    victim: string;
    accused: string;
    statement: string;
    statementAvailable: boolean;
    reportFields: Array<{ label: string; value: string }>;
}

interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
    audio?: string | null;
    audioMimeType?: string | null;
    grounding?: {
        crimeNo: string;
        fields: string[];
        scope: string;
        model: string;
    };
}

interface SimilarCase {
    crimeNo: string;
    crimeType: string;
    registeredAt: string | null;
    division: string;
    pincode: string | number | null;
    caseStatus: string;
    score: number;
    reasons: string[];
}

interface RepeatAssociation {
    name: string;
    caseCount: number;
    cases: Array<{
        crimeNo: string;
        crimeType: string;
        registeredAt: string | null;
        division: string;
    }>;
}

interface CaseIntelligence {
    targetCrimeNo: string;
    similarCases: SimilarCase[];
    repeatAssociations: RepeatAssociation[];
    sensitiveSignalsIncluded: boolean;
    coverage: {
        recordsCompared: number;
        recordCapReached: boolean;
        method: string;
    };
}

interface CaseBrief {
    crimeNo: string;
    overview: string;
    keyFacts: Array<{ label: string; value: string; source: string }>;
    statementExcerpts: string[];
    timeline: Array<{
        order: number;
        label: string;
        event: string;
        source: string;
        precision: string;
    }>;
    evidenceLeads: Array<{
        category: string;
        excerpt: string;
        source: string;
        suggestedCheck: string;
    }>;
    statementAnalysisAvailable: boolean;
    method: string;
}

export const CaseDeepDive: React.FC = () => {
    const [searchId, setSearchId] = useState('');
    const [activeCase, setActiveCase] = useState<CaseRecord | null>(null);
    const [loadingRecord, setLoadingRecord] = useState(false);
    const [recordError, setRecordError] = useState('');
    const [intelligence, setIntelligence] = useState<CaseIntelligence | null>(null);
    const [intelligenceError, setIntelligenceError] = useState('');
    const [caseBrief, setCaseBrief] = useState<CaseBrief | null>(null);
    const [caseBriefError, setCaseBriefError] = useState('');
    const [isDownloadingReport, setIsDownloadingReport] = useState(false);
    const [reportError, setReportError] = useState('');
    const [reportDownloadedAt, setReportDownloadedAt] = useState(new Date());
    const reportRef = useRef<HTMLDivElement | null>(null);

    // Interrogation AI State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputQuery, setInputQuery] = useState('');
    const [language, setLanguage] = useState<'en' | 'kn'>('en');
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isInterrogating, setIsInterrogating] = useState(false);
    const [voiceReplies, setVoiceReplies] = useState(true);
    const [conversationError, setConversationError] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const replyAudioRef = useRef<HTMLAudioElement | null>(null);

    const handlePullRecord = async () => {
        if (!searchId.trim()) return;
        setLoadingRecord(true);
        setRecordError('');
        setActiveCase(null);
        setMessages([]);
        setIntelligence(null);
        setIntelligenceError('');
        setCaseBrief(null);
        setCaseBriefError('');
        setConversationError('');
        replyAudioRef.current?.pause();

        try {
            const crimeNo = searchId.trim();
            const response = await authFetch('/fetch-case', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ CrimeNo: crimeNo })
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Unable to retrieve this case.');
            }
            if (!result.data || result.data.length === 0) {
                throw new Error('No FIR was found for that crime number.');
            }

            const record = result.data[0];
            const reportFieldDefinitions = [
                ['Crime Number', record.CrimeNo],
                ['Crime Type', record.CrimeTypeName],
                ['Case Status', record.CaseStatus],
                ['Registered At', record.RegisteredAt],
                ['Division', record.DivisionName],
                ['Pincode', record.Pincode],
                ['Victim Name', record.VictimName],
                ['Victim Age', record.VictimAge],
                ['Victim Mobile', record.VictimMobile],
                ['Victim Address', record.VictimAddress],
                ['Accused Name', record.AccusedName],
                ['Accused Age', record.AccusedAge],
                ['Accused Mobile', record.AccusedMobile],
                ['Crime Type ID', record.CrimeTypeID],
                ['Registered By', record.RegisteredBy]
            ];
            setActiveCase({
                crimeNo: String(record.CrimeNo),
                crimeType: record.CrimeTypeName || 'Unclassified',
                date: record.RegisteredAt || 'Not available',
                victim: [record.VictimName, record.VictimMobile ? `(${record.VictimMobile})` : ''].filter(Boolean).join(' ') || 'Restricted or unavailable',
                accused: record.AccusedName || 'Unknown',
                statement: record.VictimStatement || 'This statement is restricted for your role or unavailable.',
                statementAvailable: Boolean(record.VictimStatement),
                reportFields: reportFieldDefinitions
                    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
                    .map(([label, value]) => ({ label: String(label), value: String(value) }))
            });
            setMessages([{
                sender: 'bot',
                text: record.VictimStatement
                    ? 'Live FIR statement loaded. What would you like to verify?'
                    : 'The FIR was loaded, but its statement is not available to your role.'
            }]);

            try {
                const intelligenceResponse = await authFetch('/case-intelligence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ CrimeNo: crimeNo })
                });
                const intelligenceResult = await intelligenceResponse.json();
                if (!intelligenceResponse.ok || !intelligenceResult.success) {
                    throw new Error(intelligenceResult.error || 'Unable to generate case intelligence.');
                }
                setIntelligence(intelligenceResult.data);
            } catch (analysisError) {
                setIntelligenceError(
                    analysisError instanceof Error ? analysisError.message : 'Unable to generate case intelligence.'
                );
            }

            try {
                const briefResponse = await authFetch('/case-brief', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ CrimeNo: crimeNo })
                });
                const briefResult = await briefResponse.json();
                if (!briefResponse.ok || !briefResult.success) {
                    throw new Error(briefResult.error || 'Unable to generate the case brief.');
                }
                setCaseBrief(briefResult.data);
            } catch (briefError) {
                setCaseBriefError(
                    briefError instanceof Error ? briefError.message : 'Unable to generate the case brief.'
                );
            }
        } catch (error) {
            setRecordError(error instanceof Error ? error.message : 'Unable to retrieve this case.');
        } finally {
            setLoadingRecord(false);
        }
    };

    const playReply = (audioBase64: string, mimeType = 'audio/wav') => {
        replyAudioRef.current?.pause();
        const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
        replyAudioRef.current = audio;
        void audio.play().catch(() => {
            setConversationError(
                language === 'kn'
                    ? 'ಸ್ವಯಂಚಾಲಿತ ಧ್ವನಿ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ಉತ್ತರದ ಪ್ಲೇ ಬಟನ್ ಒತ್ತಿರಿ.'
                    : 'Automatic playback was blocked. Use the play button on the answer.'
            );
        });
    };

    const sendCaseQuestion = async (question: string) => {
        const queryText = question.trim();
        if (!queryText || !activeCase || !activeCase.statementAvailable || isInterrogating) return;

        const history = messages.slice(-8).map(message => ({
            role: message.sender === 'user' ? 'user' : 'assistant',
            content: message.text
        }));
        setMessages(prev => [...prev, { sender: 'user', text: queryText }]);
        setInputQuery('');
        setIsInterrogating(true);
        setConversationError('');

        try {
            const response = await authFetch('/case-conversation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    CrimeNo: activeCase.crimeNo,
                    question: queryText,
                    language,
                    history,
                    speak: voiceReplies
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'The case conversation could not be completed.');
            }
            setMessages(prev => [...prev, {
                sender: 'bot',
                text: data.response,
                audio: data.audio,
                audioMimeType: data.audioMimeType,
                grounding: data.grounding
            }]);
            if (data.audio && voiceReplies) playReply(data.audio, data.audioMimeType || 'audio/wav');
            if (data.audioError) setConversationError(data.audioError);
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'The case conversation service is currently unavailable.';
            setConversationError(message);
            setMessages(prev => [...prev, {
                sender: 'bot',
                text: language === 'kn'
                    ? 'ಪ್ರಕರಣ ಸಂಭಾಷಣೆ ಸೇವೆ ಈಗ ಲಭ್ಯವಿಲ್ಲ. ಯಾವುದೇ ಉತ್ತರ ರಚಿಸಲಾಗಿಲ್ಲ.'
                    : 'The case conversation service is currently unavailable. No answer was generated.'
            }]);
        } finally {
            setIsInterrogating(false);
        }
    };

    const toggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) chunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const mimeType = mediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(chunks, { type: mimeType });
                stream.getTracks().forEach(track => track.stop());
                setIsTranscribing(true);
                setConversationError('');

                const formData = new FormData();
                formData.append('audio', audioBlob, 'case-question.webm');
                formData.append('language', language);

                try {
                    const response = await authFetch('/transcribe', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await response.json();
                    if (!response.ok || !data.success || !String(data.transcript || '').trim()) {
                        throw new Error(data.error || 'No speech was recognised.');
                    }
                    const transcript = String(data.transcript).trim();
                    setInputQuery(transcript);
                    await sendCaseQuestion(transcript);
                } catch (error) {
                    setConversationError(
                        error instanceof Error ? error.message : 'Voice transcription failed.'
                    );
                } finally {
                    setIsTranscribing(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch {
            setConversationError(
                language === 'kn'
                    ? 'ಧ್ವನಿ ಪ್ರಶ್ನೆಗೆ ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ಅಗತ್ಯವಿದೆ.'
                    : 'Microphone permission is required for a voice question.'
            );
        }
    };

    const handleSendInterrogation = () => {
        void sendCaseQuestion(inputQuery);
    };

    const handleDownloadCaseReport = async () => {
        if (!activeCase || !reportRef.current || isDownloadingReport) return;

        setIsDownloadingReport(true);
        setReportError('');
        setReportDownloadedAt(new Date());

        try {
            // Allow the exact download timestamp to render before the report is captured.
            await new Promise<void>(resolve => window.setTimeout(resolve, 0));
            const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
                import('html2canvas'),
                import('jspdf')
            ]);
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false
            });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, pageWidth, pageHeight);
            pdf.save(`KSP-ATHENA_Case_${activeCase.crimeNo}_Report.pdf`);
        } catch (error) {
            console.error('Case report download failed:', error);
            setReportError('The case report could not be generated. Please try again.');
        } finally {
            setIsDownloadingReport(false);
        }
    };

    const reportTimestamp = new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: 'Asia/Kolkata'
    }).format(reportDownloadedAt);
    const reportStatementFontSize = activeCase
        ? activeCase.statement.length > 4000 ? '7px'
            : activeCase.statement.length > 2800 ? '8px'
                : activeCase.statement.length > 1600 ? '9px'
                    : '10px'
        : '10px';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Top Search Bar */}
            <div className="nb-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem', marginBottom: '0' }}>
                <AlertCircle size={24} />
                <h2 style={{ margin: 0, fontSize: '1.2rem', whiteSpace: 'nowrap' }}>CASE DEEP DIVE</h2>
                <input
                    type="text"
                    className="nb-input"
                    placeholder="Enter Crime No..."
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePullRecord()}
                    style={{ flex: 1, fontSize: '1.1rem' }}
                />
                <button
                    onClick={handlePullRecord}
                    disabled={loadingRecord}
                    className="nb-button"
                    style={{ backgroundColor: 'var(--nb-yellow)', padding: '0.6rem 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    {loadingRecord ? <span className="loading-spinner loading-spinner-small" /> : <Search size={18} />}
                    {loadingRecord ? 'PULLING...' : 'PULL RECORD'}
                </button>
            </div>

            {recordError && (
                <div className="nb-card" role="alert" style={{ backgroundColor: '#f87171', fontWeight: 800 }}>
                    LIVE DATA ERROR: {recordError}
                </div>
            )}

            {/* Split Layout */}
            {activeCase && (
                <div style={{ display: 'flex', gap: '1rem', minHeight: '620px' }}>

                    {/* Left Panel: Case Details */}
                    <div className="nb-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', overflowY: 'auto' }}>
                        <h3 style={{ borderBottom: '2px solid #000', paddingBottom: '0.5rem', marginTop: 0 }}>FILE: {activeCase.crimeNo}</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                            <div>
                                <div style={{ opacity: 0.7, fontSize: '0.75rem' }}>CRIME TYPE:</div>
                                <div>{activeCase.crimeType}</div>
                            </div>
                            <div>
                                <div style={{ opacity: 0.7, fontSize: '0.75rem' }}>DATE:</div>
                                <div>{activeCase.date}</div>
                            </div>
                            <div>
                                <div style={{ opacity: 0.7, fontSize: '0.75rem' }}>VICTIM:</div>
                                <div>{activeCase.victim}</div>
                            </div>
                            <div>
                                <div style={{ opacity: 0.7, fontSize: '0.75rem' }}>ACCUSED:</div>
                                <div>{activeCase.accused}</div>
                            </div>
                        </div>

                        <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>VICTIM STATEMENT:</div>
                        <div style={{
                            border: '2px solid #000',
                            padding: '1rem',
                            fontSize: '0.95rem',
                            lineHeight: 1.6,
                            backgroundColor: '#fff',
                            flex: 1
                        }}>
                            {activeCase.statement}
                        </div>
                        <button
                            type="button"
                            onClick={() => void handleDownloadCaseReport()}
                            disabled={isDownloadingReport}
                            className="nb-button"
                            style={{
                                marginTop: '0.9rem',
                                backgroundColor: 'var(--nb-yellow)',
                                padding: '0.75rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                fontSize: '0.85rem'
                            }}
                        >
                            {isDownloadingReport
                                ? <span className="loading-spinner loading-spinner-small" />
                                : <Download size={17} />}
                            {isDownloadingReport ? 'GENERATING REPORT...' : 'DOWNLOAD CASE REPORT'}
                        </button>
                        {reportError && (
                            <div role="alert" style={{ marginTop: '0.6rem', fontSize: '0.75rem', fontWeight: 800 }}>
                                {reportError}
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Case-scoped Sarvam conversation */}
                    <div className="nb-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.6rem', borderBottom: '2px solid #000', paddingBottom: '0.5rem', marginBottom: '0.7rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <MessageSquare size={20} /> TALK ABOUT THIS CASE
                            </h3>
                            <div style={{ display: 'flex', gap: '0.45rem' }}>
                                <button
                                    onClick={() => setVoiceReplies(enabled => !enabled)}
                                    className="nb-button"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                    title="Toggle spoken Sarvam replies"
                                >
                                    {voiceReplies ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                    VOICE {voiceReplies ? 'ON' : 'OFF'}
                                </button>
                                <button
                                    onClick={() => setLanguage(language === 'en' ? 'kn' : 'en')}
                                    className="nb-button"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.68rem' }}
                                    aria-label="Change conversation language"
                                >
                                    {language === 'en' ? 'ENGLISH' : 'ಕನ್ನಡ'}
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '0.8rem', padding: '0.55rem', border: '2px solid #000', background: '#FFE600', fontSize: '0.72rem', fontWeight: 800 }}>
                            SARVAM AI · FIR {activeCase.crimeNo} ONLY · SAARAS V3 → SARVAM-105B → BULBUL V3
                        </div>

                        {/* Chat Feed */}
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                            {messages.map((msg, idx) => (
                                <div key={idx} style={{
                                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                    backgroundColor: msg.sender === 'user' ? '#fff' : '#000',
                                    color: msg.sender === 'user' ? '#000' : '#fff',
                                    border: '2px solid #000',
                                    padding: '0.75rem 1rem',
                                    maxWidth: '85%',
                                    fontSize: '0.9rem',
                                    fontWeight: 600
                                }}>
                                    {msg.text}
                                    {msg.sender === 'bot' && msg.grounding && (
                                        <div style={{
                                            marginTop: '0.65rem',
                                            paddingTop: '0.5rem',
                                            borderTop: `1px solid ${msg.sender === 'bot' ? '#fff' : '#000'}`,
                                            fontSize: '0.62rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase'
                                        }}>
                                            EVIDENCE: FIR {msg.grounding.crimeNo} ONLY · {msg.grounding.model}
                                            <br />
                                            FIELDS: {msg.grounding.fields.join(', ')}
                                        </div>
                                    )}
                                    {msg.sender === 'bot' && msg.audio && (
                                        <button
                                            type="button"
                                            onClick={() => playReply(msg.audio!, msg.audioMimeType || 'audio/wav')}
                                            className="nb-button"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.65rem', padding: '0.25rem 0.45rem', fontSize: '0.65rem' }}
                                            aria-label="Play spoken answer"
                                        >
                                            <Play size={12} /> PLAY ANSWER
                                        </button>
                                    )}
                                </div>
                            ))}
                            {(isTranscribing || isInterrogating) && (
                                <div className="processing-state" style={{ border: '2px solid #000', padding: '0.6rem', fontSize: '0.78rem' }}>
                                    <span className="loading-spinner loading-spinner-small" />
                                    {isTranscribing
                                        ? (language === 'kn' ? 'ಧ್ವನಿಯನ್ನು ಪಠ್ಯಕ್ಕೆ ಪರಿವರ್ತಿಸಲಾಗುತ್ತಿದೆ...' : 'Transcribing your voice...')
                                        : (language === 'kn' ? 'ಆಯ್ದ ಎಫ್‌ಐಆರ್ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Reviewing the selected FIR...')}
                                </div>
                            )}
                        </div>

                        {conversationError && (
                            <div role="alert" style={{ marginBottom: '0.65rem', border: '2px solid #000', background: '#fecaca', padding: '0.55rem', fontSize: '0.75rem', fontWeight: 800 }}>
                                {conversationError}
                            </div>
                        )}

                        {/* Input Area with Integrated Mic */}
                        <div style={{ display: 'flex', border: '2px solid #000', backgroundColor: '#fff' }}>
                            <input
                                type="text"
                                value={inputQuery}
                                onChange={(e) => setInputQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendInterrogation()}
                                placeholder={language === 'kn' ? 'ಈ ಪ್ರಕರಣದ ಬಗ್ಗೆ ಪ್ರಶ್ನಿಸಿ...' : 'Ask anything about this FIR...'}
                                disabled={!activeCase.statementAvailable || isTranscribing || isInterrogating}
                                style={{ flex: 1, border: 'none', padding: '0.75rem', fontSize: '0.9rem', outline: 'none' }}
                            />

                            {/* The perfectly nested bilingual microphone */}
                            <button
                                onClick={toggleRecording}
                                disabled={!activeCase.statementAvailable || isTranscribing || isInterrogating}
                                style={{
                                    border: 'none',
                                    borderLeft: '2px solid #000',
                                    backgroundColor: isRecording ? '#ff0000' : '#fff',
                                    color: isRecording ? '#fff' : '#000',
                                    padding: '0 0.75rem',
                                    cursor: 'pointer',
                                    transition: '0.2s'
                                }}
                                title={isRecording ? 'Stop and ask' : 'Ask by voice'}
                                aria-label={isRecording ? 'Stop recording and ask' : 'Ask by voice'}
                            >
                                <Mic size={18} />
                            </button>

                            <button
                                onClick={handleSendInterrogation}
                                disabled={!activeCase.statementAvailable || isTranscribing || isInterrogating || !inputQuery.trim()}
                                style={{
                                    border: 'none',
                                    borderLeft: '2px solid #000',
                                    backgroundColor: '#000',
                                    color: '#fff',
                                    padding: '0 1rem',
                                    cursor: 'pointer'
                                }}
                                aria-label="Send case question"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>

                </div>
            )}

            {activeCase && (
                <div
                    ref={reportRef}
                    aria-hidden="true"
                    style={{
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        zIndex: -10000,
                        pointerEvents: 'none',
                        width: '794px',
                        height: '1123px',
                        padding: '32px',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        background: '#fff',
                        color: '#000',
                        fontFamily: 'Arial, sans-serif'
                    }}
                >
                    <header style={{ background: '#FFE600', border: '4px solid #000', padding: '18px 20px' }}>
                        <div style={{ fontSize: '28px', lineHeight: 1, fontWeight: 900 }}>KSP-ATHENA Report</div>
                        <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 800 }}>
                            KARNATAKA STATE POLICE INTELLIGENCE PLATFORM
                        </div>
                    </header>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', borderBottom: '3px solid #000', padding: '14px 2px 10px' }}>
                        <div style={{ fontSize: '18px', fontWeight: 900 }}>CASE FILE: {activeCase.crimeNo}</div>
                        <div style={{ fontSize: '10px', fontWeight: 700, textAlign: 'right' }}>
                            REPORT DOWNLOADED<br />{reportTimestamp} IST
                        </div>
                    </div>

                    <section style={{ marginTop: '14px' }}>
                        <div style={{ display: 'inline-block', background: '#000', color: '#fff', padding: '6px 10px', fontSize: '12px', fontWeight: 900 }}>
                            CASE DETAILS
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '2px solid #000', borderLeft: '2px solid #000', marginTop: '8px' }}>
                            {activeCase.reportFields.map(field => (
                                <div key={field.label} style={{ minHeight: '37px', borderRight: '2px solid #000', borderBottom: '2px solid #000', padding: '6px 8px', boxSizing: 'border-box' }}>
                                    <div style={{ fontSize: '8px', fontWeight: 900 }}>{field.label.toUpperCase()}</div>
                                    <div style={{ marginTop: '3px', fontSize: '10px', lineHeight: 1.15, fontWeight: 600, overflowWrap: 'anywhere' }}>{field.value}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section style={{ marginTop: '14px' }}>
                        <div style={{ display: 'inline-block', background: '#FFE600', border: '2px solid #000', padding: '5px 9px', fontSize: '12px', fontWeight: 900 }}>
                            VICTIM STATEMENT
                        </div>
                        <div style={{
                            marginTop: '7px',
                            border: '2px solid #000',
                            padding: '10px',
                            fontSize: reportStatementFontSize,
                            lineHeight: 1.25,
                            fontWeight: 500,
                            textAlign: 'justify',
                            overflowWrap: 'anywhere'
                        }}>
                            {activeCase.statement}
                        </div>
                    </section>

                    <footer style={{ position: 'absolute', left: '32px', right: '32px', bottom: '26px', borderTop: '3px solid #000', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800 }}>
                        <span>Generated from the live FIR record available to the signed-in role.</span>
                        <span>PAGE 1 OF 1</span>
                    </footer>
                </div>
            )}

            {activeCase && (
                <section aria-labelledby="case-brief-title">
                    <div className="nb-card yellow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ClipboardList size={24} />
                        <div>
                            <h2 id="case-brief-title">AUTOMATED CASE BRIEF & TIMELINE</h2>
                            <p style={{ margin: 0, fontWeight: 700 }}>
                                A sourced operational brief extracted from this FIR. Suggested checks require investigator verification.
                            </p>
                        </div>
                    </div>

                    {caseBriefError && (
                        <div className="nb-card" role="alert" style={{ backgroundColor: '#f87171', fontWeight: 800 }}>
                            CASE BRIEF ERROR: {caseBriefError}
                        </div>
                    )}

                    {!caseBrief && !caseBriefError && (
                        <div className="nb-card">BUILDING EVIDENCE-GROUNDED CASE BRIEF...</div>
                    )}

                    {caseBrief && (
                        <>
                            <div className="nb-card" style={{ borderLeft: '12px solid #000' }}>
                                <h3>EXECUTIVE OVERVIEW</h3>
                                <p style={{ fontSize: '1.05rem', fontWeight: 800 }}>{caseBrief.overview}</p>
                                <div style={{ fontSize: '0.75rem', fontWeight: 650 }}>
                                    METHOD: {caseBrief.method}
                                </div>
                            </div>

                            <div className="nb-card">
                                <h3>VERIFIED STRUCTURED FACTS</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
                                    {caseBrief.keyFacts.map(fact => (
                                        <div key={fact.source} style={{ border: '2px solid #000', background: '#fff', padding: '0.7rem' }}>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 900, opacity: 0.7 }}>{fact.label.toUpperCase()}</div>
                                            <div style={{ fontWeight: 800, margin: '0.25rem 0' }}>{fact.value}</div>
                                            <code style={{ fontSize: '0.68rem' }}>SOURCE: {fact.source}</code>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
                                <div className="nb-card">
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock3 size={20} /> EVENT TIMELINE
                                    </h3>
                                    {caseBrief.timeline.length === 0 ? (
                                        <p style={{ fontWeight: 700 }}>No dated or sequenced event was available to this role.</p>
                                    ) : caseBrief.timeline.map((event, index) => (
                                        <div key={`${event.source}-${event.order}-${index}`} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: '0.65rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#FFE600', border: '2px solid #000' }} />
                                                {index < caseBrief.timeline.length - 1 && <div style={{ width: 3, flex: 1, minHeight: 45, background: '#000' }} />}
                                            </div>
                                            <div style={{ border: '2px solid #000', padding: '0.7rem', marginBottom: '0.7rem', background: '#fff' }}>
                                                <div style={{ fontWeight: 900 }}>{event.label}</div>
                                                <p style={{ margin: '0.3rem 0' }}>{event.event}</p>
                                                <code style={{ fontSize: '0.68rem' }}>SOURCE: {event.source} · {event.precision}</code>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="nb-card">
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Lightbulb size={20} /> EVIDENCE LEADS & SUGGESTED CHECKS
                                    </h3>
                                    {!caseBrief.statementAnalysisAvailable ? (
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontWeight: 700 }}>
                                            <ShieldCheck size={20} />
                                            Statement-derived leads are unavailable to this role or the statement is missing.
                                        </div>
                                    ) : caseBrief.evidenceLeads.length === 0 ? (
                                        <p style={{ fontWeight: 700 }}>No supported evidence category was detected in the statement.</p>
                                    ) : caseBrief.evidenceLeads.map(lead => (
                                        <article key={lead.category} style={{ border: '2px solid #000', padding: '0.8rem', marginTop: '0.75rem', background: '#fff' }}>
                                            <div style={{ fontWeight: 900, background: '#FFE600', display: 'inline-block', padding: '0.15rem 0.4rem', border: '2px solid #000' }}>
                                                {lead.category}
                                            </div>
                                            <blockquote style={{ margin: '0.65rem 0', borderLeft: '4px solid #000', paddingLeft: '0.7rem' }}>
                                                “{lead.excerpt}”
                                            </blockquote>
                                            <div style={{ fontWeight: 750 }}><strong>SUGGESTED CHECK:</strong> {lead.suggestedCheck}</div>
                                            <code style={{ fontSize: '0.68rem' }}>SOURCE: {lead.source}</code>
                                        </article>
                                    ))}
                                </div>
                            </div>

                            {caseBrief.statementExcerpts.length > 0 && (
                                <div className="nb-card">
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Quote size={20} /> OPENING STATEMENT EXCERPTS
                                    </h3>
                                    {caseBrief.statementExcerpts.map((excerpt, index) => (
                                        <blockquote key={index} style={{ borderLeft: '5px solid #FFE600', margin: '0.6rem 0', padding: '0.45rem 0.8rem', background: '#fff' }}>
                                            {excerpt}
                                        </blockquote>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>
            )}

            {activeCase && (
                <section aria-labelledby="case-intelligence-title">
                    <div className="nb-card yellow" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <GitCompareArrows size={24} />
                        <div>
                            <h2 id="case-intelligence-title">EXPLAINABLE CASE INTELLIGENCE</h2>
                            <p style={{ margin: 0, fontWeight: 700 }}>
                                Recorded similarities are investigative leads only. They do not establish identity, guilt, or causation.
                            </p>
                        </div>
                    </div>

                    {intelligenceError && (
                        <div className="nb-card" role="alert" style={{ backgroundColor: '#f87171', fontWeight: 800 }}>
                            CASE INTELLIGENCE ERROR: {intelligenceError}
                        </div>
                    )}

                    {!intelligence && !intelligenceError && (
                        <div className="nb-card">COMPARING BOUNDED CASE HISTORY...</div>
                    )}

                    {intelligence && (
                        <>
                            <div className="nb-card" style={{ fontWeight: 700 }}>
                                Compared FIR {intelligence.targetCrimeNo} with {intelligence.coverage.recordsCompared} recent records.
                                {' '}{intelligence.coverage.method}
                                {intelligence.coverage.recordCapReached && (
                                    <div style={{ marginTop: '0.5rem', background: '#FFE600', padding: '0.5rem', border: '2px solid #000' }}>
                                        Coverage limit reached: repeat associations and similarities are limited to the 300 most recent records.
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
                                <div className="nb-card">
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <GitCompareArrows size={20} /> SIMILAR RECORDED CASES
                                    </h3>
                                    {intelligence.similarCases.length === 0 ? (
                                        <p style={{ fontWeight: 700 }}>No case crossed the minimum explainable similarity threshold.</p>
                                    ) : intelligence.similarCases.map(similar => (
                                        <article key={similar.crimeNo} style={{ border: '2px solid #000', padding: '0.8rem', marginTop: '0.75rem', background: '#fff' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontWeight: 900 }}>
                                                <span>FIR {similar.crimeNo} · {similar.crimeType}</span>
                                                <span style={{ background: '#FFE600', border: '2px solid #000', padding: '0.15rem 0.4rem', whiteSpace: 'nowrap' }}>
                                                    {similar.score}/100
                                                </span>
                                            </div>
                                            <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', fontWeight: 650 }}>
                                                {similar.division} · {similar.pincode || 'Pincode unavailable'} · {similar.caseStatus}
                                            </div>
                                            <ul style={{ marginBottom: 0, paddingLeft: '1.25rem' }}>
                                                {similar.reasons.map(reason => <li key={reason}>{reason}</li>)}
                                            </ul>
                                        </article>
                                    ))}
                                </div>

                                <div className="nb-card">
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Link2 size={20} /> REPEAT ACCUSED-NAME ASSOCIATIONS
                                    </h3>
                                    {!intelligence.sensitiveSignalsIncluded ? (
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontWeight: 700 }}>
                                            <ShieldCheck size={20} />
                                            Accused-name and statement matching are hidden for the Constable role.
                                        </div>
                                    ) : intelligence.repeatAssociations.length === 0 ? (
                                        <p style={{ fontWeight: 700 }}>
                                            No accused name from this FIR appears in another record within the comparison set.
                                        </p>
                                    ) : intelligence.repeatAssociations.map(association => (
                                        <article key={association.name} style={{ border: '2px solid #000', padding: '0.8rem', marginTop: '0.75rem', background: '#fff' }}>
                                            <div style={{ fontWeight: 900 }}>
                                                {association.name} · {association.caseCount} recorded FIR associations
                                            </div>
                                            <p style={{ margin: '0.35rem 0', fontSize: '0.8rem', fontWeight: 650 }}>
                                                Name matching can include different people with similar names. Verify identity using independent evidence.
                                            </p>
                                            <ul style={{ marginBottom: 0, paddingLeft: '1.25rem' }}>
                                                {association.cases.map(caseRecord => (
                                                    <li key={caseRecord.crimeNo}>
                                                        FIR {caseRecord.crimeNo} — {caseRecord.crimeType}, {caseRecord.division}
                                                    </li>
                                                ))}
                                            </ul>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </section>
            )}
        </div>
    );
};
