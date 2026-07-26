// frontend/src/components/RegisterCase.tsx
import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { authFetch } from '../api';

export const RegisterCase: React.FC = () => {
    const [formData, setFormData] = useState({
        date: '',
        crimeType: '',
        location: '',
        pincode: '',
        victimName: '',
        victimAge: '',
        mobileNo: '',
        accusedName: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Auto-generate CaseMasterID based on current year and random 4-digit code
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const generatedCaseId = `KSP-${new Date().getFullYear()}-${randomCode}`;

        const payload = {
            CaseMasterID: generatedCaseId,
            ...formData
        };

        try {
            // Send to Catalyst Backend
            const response = await authFetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                alert(`FIR Registered Successfully in CaseRegistration!\nGenerated Case ID: ${generatedCaseId}`);
                // Clear form after success
                setFormData({
                    date: '', crimeType: '', location: '', pincode: '',
                    victimName: '', victimAge: '', mobileNo: '', accusedName: '', description: ''
                });
            } else {
                throw new Error(data.error || "Failed to insert record.");
            }
        } catch (error: any) {
            console.error("Submission Error:", error);
            alert("API Error: Ensure the Node.js backend is configured for the /register route.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="nb-card" style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff' }}>
            <div style={{ borderBottom: '4px solid #000', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <AlertCircle size={28} />
                <h2 style={{ margin: 0, textTransform: 'uppercase', fontWeight: 900 }}>Register Fresh FIR</h2>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Two Column Layout for standard fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                        <label style={{ fontWeight: 800, fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>DATE OF INCIDENT *</label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} className="nb-input" required style={{ width: '100%' }} />
                    </div>

                    <div>
                        <label style={{ fontWeight: 800, fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>TYPE OF CRIME *</label>
                        <select name="crimeType" value={formData.crimeType} onChange={handleChange} className="nb-input" required style={{ width: '100%', height: '42px' }}>
                            <option value="">Select Category...</option>
                            <option value="Theft">Theft / Burglary</option>
                            <option value="Assault">Assault</option>
                            <option value="Cybercrime">Cybercrime</option>
                            <option value="Fraud">Fraud / Cheating</option>
                            <option value="Missing Person">Missing Person</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ fontWeight: 800, fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>LOCATION *</label>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} className="nb-input" required style={{ width: '100%' }} />
                    </div>

                    <div>
                        <label style={{ fontWeight: 800, fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>PINCODE (DIVISION MAPPING) *</label>
                        <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="nb-input" required maxLength={6} pattern="\d{6}" title="Enter a valid 6-digit Pincode" style={{ width: '100%' }} />
                    </div>

                    <div>
                        <label style={{ fontWeight: 800, fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>VICTIM NAME *</label>
                        <input type="text" name="victimName" value={formData.victimName} onChange={handleChange} className="nb-input" required style={{ width: '100%' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem' }}>
                        <div>
                            <label style={{ fontWeight: 800, fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>AGE *</label>
                            <input type="number" name="victimAge" value={formData.victimAge} onChange={handleChange} className="nb-input" required min="1" max="120" style={{ width: '100%' }} />
                        </div>
                        <div>
                            <label style={{ fontWeight: 800, fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>MOBILE NO. *</label>
                            <input type="tel" name="mobileNo" value={formData.mobileNo} onChange={handleChange} className="nb-input" required pattern="\d{10}" title="Enter a valid 10-digit mobile number" style={{ width: '100%' }} />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontWeight: 800, fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>ACCUSED NAME (IF KNOWN)</label>
                        <input type="text" name="accusedName" value={formData.accusedName} onChange={handleChange} className="nb-input" placeholder="Leave blank if unknown" style={{ width: '100%' }} />
                    </div>
                </div>

                {/* Full Width Description */}
                <div>
                    <label style={{ fontWeight: 800, fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>INCIDENT DESCRIPTION *</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="nb-input" rows={4} required style={{ width: '100%', resize: 'vertical' }} />
                </div>

                <button type="submit" disabled={isSubmitting} className="nb-button" style={{ backgroundColor: 'var(--nb-yellow)', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%', opacity: isSubmitting ? 0.7 : 1 }}>
                    <Save size={20} /> {isSubmitting ? 'COMMITTING TO DATABASE...' : 'REGISTER FIR RECORD'}
                </button>
            </form>
        </div>
    );
};
