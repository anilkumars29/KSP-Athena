// frontend/src/components/FIRIntake.tsx
import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { authFetch } from '../api';

export const FIRIntake: React.FC = () => {
    const [formData, setFormData] = useState({
        victimName: '',
        victimAge: '',
        mobileNo: '',
        location: '',
        pincode: '',
        accusedName: '',
        crimeType: 'Theft',
        date: new Date().toISOString().split('T')[0], // Defaults to today: YYYY-MM-DD
        description: ''
    });

    const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'REGISTERING FIR TO CATALYST DATABASE...' });

        try {
            const response = await authFetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                setStatus({ type: 'success', message: `FIR SUCCESSFULLY REGISTERED. CRIME NO: ${result.data.CrimeNo}` });
                // Reset form fields after successful submission
                setFormData({ ...formData, victimName: '', victimAge: '', mobileNo: '', location: '', pincode: '', accusedName: '', description: '' });
            } else {
                setStatus({ type: 'error', message: result.error || 'FAILED TO REGISTER FIR.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'NETWORK ERROR. PLEASE CHECK SERVER CONNECTION.' });
        }
    };

    return (
        <div className="nb-card" style={{ padding: '0', border: '4px solid #000', backgroundColor: '#fff', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ padding: '1rem', backgroundColor: '#000', color: '#fff', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={24} color="var(--nb-yellow)" />
                Official FIR Intake Module
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Victim Name</label>
                        <input required type="text" name="victimName" value={formData.victimName} onChange={handleChange} className="nb-input" placeholder="e.g. Rahul Sharma" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Victim Age</label>
                        <input required type="number" name="victimAge" value={formData.victimAge} onChange={handleChange} className="nb-input" placeholder="e.g. 34" />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Mobile Number</label>
                        <input required type="text" name="mobileNo" value={formData.mobileNo} onChange={handleChange} className="nb-input" placeholder="e.g. 9876543210" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Incident Date</label>
                        <input required type="date" name="date" value={formData.date} onChange={handleChange} className="nb-input" />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Location (Address / Area)</label>
                        <input required type="text" name="location" value={formData.location} onChange={handleChange} className="nb-input" placeholder="e.g. Koramangala 5th Block" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Pincode</label>
                        <input required type="number" name="pincode" value={formData.pincode} onChange={handleChange} className="nb-input" placeholder="e.g. 560034" />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Crime Type</label>
                        <select name="crimeType" value={formData.crimeType} onChange={handleChange} className="nb-input" style={{ cursor: 'pointer' }}>
                            <option value="Theft">Theft</option>
                            <option value="Assault">Assault</option>
                            <option value="Cyber Crime">Cyber Crime</option>
                            <option value="Fraud">Fraud</option>
                            <option value="Missing Person">Missing Person</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Accused Name (If Known)</label>
                        <input type="text" name="accusedName" value={formData.accusedName} onChange={handleChange} className="nb-input" placeholder="e.g. Unknown or Name" />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Victim Statement / Description</label>
                    <textarea required name="description" value={formData.description} onChange={handleChange} className="nb-input" rows={4} placeholder="Enter the factual details of the incident..." style={{ resize: 'vertical' }} />
                </div>

                <button
                    type="submit"
                    disabled={status.type === 'loading'}
                    className="nb-button"
                    style={{
                        backgroundColor: 'var(--nb-yellow)',
                        marginTop: '1rem',
                        padding: '1rem',
                        fontSize: '1.1rem',
                        opacity: status.type === 'loading' ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {status.type === 'loading' && <span className="loading-spinner loading-spinner-small" />}
                    {status.type === 'loading' ? 'PROCESSING...' : 'REGISTER OFFICIAL FIR'}
                </button>

                {/* Status Message Display */}
                {status.type !== 'idle' && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        border: '2px solid #000',
                        fontWeight: 800,
                        backgroundColor: status.type === 'success' ? '#4ade80' : status.type === 'error' ? '#f87171' : '#f3f4f6',
                        color: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        textTransform: 'uppercase'
                    }}>
                        {status.type === 'success' && <CheckCircle size={20} />}
                        {status.type === 'error' && <AlertTriangle size={20} />}
                        {status.message}
                    </div>
                )}
            </form>
        </div>
    );
};
