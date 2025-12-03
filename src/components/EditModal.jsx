import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const EditModal = ({ loan, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState(loan || {});

    useEffect(() => {
        if (loan) setFormData(loan);
    }, [loan]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            principal: parseFloat(formData.principal),
            rate: parseFloat(formData.rate)
        });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Edit Loan Details</h3>
                    <button onClick={onClose} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="input-group">
                        <label className="input-label">Borrower Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.borrower || ''}
                            onChange={e => setFormData({ ...formData, borrower: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Principal</label>
                        <input
                            type="number"
                            className="input-field"
                            value={formData.principal || ''}
                            onChange={e => setFormData({ ...formData, principal: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Interest Rate</label>
                        <input
                            type="number"
                            step="0.01"
                            className="input-field"
                            value={formData.rate || ''}
                            onChange={e => setFormData({ ...formData, rate: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Start Date</label>
                        <input
                            type="date"
                            className="input-field"
                            value={formData.startDate || ''}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">End Date (Return Date)</label>
                        <input
                            type="date"
                            className="input-field"
                            value={formData.endDate || ''}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                        />
                        <small style={{ color: 'var(--text-secondary)' }}>Set this date to mark principle as returned.</small>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary"><Save size={18} /> Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditModal;
