import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Upload, FileText, Download } from 'lucide-react';

const BorrowerProfileModal = ({ isOpen, onClose, profile, existingBorrowers = [], borrowerProfiles = [], onSave, onDelete }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        documents: []
    });

    useEffect(() => {
        if (profile) {
            setFormData(profile);
        } else {
            setFormData({ name: '', email: '', phone: '', documents: [] });
        }
    }, [profile]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Please enter borrower name');
            return;
        }
        onSave(formData);
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm(`Delete profile for ${formData.name}? This will not delete their loans.`)) {
            onDelete(formData.name);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{profile ? 'Edit' : 'Add'} Borrower Profile</h3>
                    <button onClick={onClose} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="input-group">
                        <label className="input-label">Borrower Name *</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.name}
                            onChange={e => {
                                const newName = e.target.value;
                                setFormData(prev => {
                                    const existing = borrowerProfiles.find(p => p.name === newName);
                                    if (existing) {
                                        return { ...prev, name: newName, email: existing.email || '', phone: existing.phone || '', documents: existing.documents || [] };
                                    }
                                    return { ...prev, name: newName };
                                });
                            }}
                            placeholder="John Doe"
                            required
                            disabled={!!profile} // Can't change name if editing
                            list="borrower-names"
                        />
                        <datalist id="borrower-names">
                            {existingBorrowers.map(name => (
                                <option key={name} value={name} />
                            ))}
                        </datalist>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <input
                            type="email"
                            className="input-field"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Phone Number (with country code)</label>
                        <input
                            type="tel"
                            className="input-field"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="919876543210"
                        />
                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            Format: Country code + number (e.g., 919876543210 for India)
                        </small>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1rem' }}>
                        {profile && (
                            <button type="button" onClick={handleDelete} className="btn btn-secondary" style={{ backgroundColor: '#ef4444', color: 'white' }}>
                                <Trash2 size={18} /> Delete Profile
                            </button>
                        )}
                        <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
                            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                            <button type="submit" className="btn btn-primary">
                                <Save size={18} /> Save Profile
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BorrowerProfileModal;
