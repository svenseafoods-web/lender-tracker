import React, { useState } from 'react';
import { PlusCircle, Calendar, DollarSign, Percent, Clock, FileText } from 'lucide-react';
import BorrowerSelect from './BorrowerSelect';

const INTEREST_RATES = [6, 8, 10, 12, 15, 18, 24, 36];

const EntryForm = ({ onAddLoan, existingBorrowers, loans = [] }) => {
    const [isNewBorrower, setIsNewBorrower] = useState(false);
    const [newBorrowerName, setNewBorrowerName] = useState('');

    const [formData, setFormData] = useState({
        borrower: '',
        principal: '',
        rate: '',
        startDate: new Date().toISOString().split('T')[0],
        loanType: 'simple', // 'simple', 'emi', 'compound'
        tenure: '' // Only for EMI
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const borrowerName = isNewBorrower ? newBorrowerName : formData.borrower;

        if (!borrowerName || !formData.principal || !formData.rate || !formData.startDate) {
            alert('Please fill in all required fields');
            return;
        }

        if (formData.loanType === 'emi' && !formData.tenure) {
            alert('Please enter tenure for EMI loan');
            return;
        }

        const newLoan = {
            id: Date.now(),
            borrower: borrowerName,
            amount: parseFloat(formData.principal),
            rate: parseFloat(formData.rate),
            startDate: formData.startDate,
            loanType: formData.loanType,
            tenure: formData.loanType === 'emi' ? parseInt(formData.tenure) : null,
            status: 'active',
            history: []
        };

        onAddLoan(newLoan);

        // Reset form
        setFormData({
            borrower: '',
            principal: '',
            rate: '',
            startDate: new Date().toISOString().split('T')[0],
            loanType: 'simple',
            tenure: ''
        });
        setNewBorrowerName('');
        setIsNewBorrower(false);
    };

    return (
        <div className="card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={24} className="text-primary" />
                New Loan Entry
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

                    {/* Borrower Selection */}
                    <BorrowerSelect
                        value={formData.borrower}
                        onChange={(val) => {
                            // Auto-select loan type based on borrower's history
                            const borrowerLoans = loans.filter(l => l.borrower === val);
                            if (borrowerLoans.length > 0) {
                                // Get the most recent loan
                                const mostRecent = borrowerLoans.sort((a, b) =>
                                    new Date(b.startDate) - new Date(a.startDate)
                                )[0];

                                setFormData({
                                    ...formData,
                                    borrower: val,
                                    loanType: mostRecent.loanType || 'simple',
                                    tenure: mostRecent.tenure || ''
                                });
                            } else {
                                setFormData({ ...formData, borrower: val });
                            }
                        }}
                        existingBorrowers={existingBorrowers}
                        isNew={isNewBorrower}
                        onNewChange={setNewBorrowerName}
                        onToggleNew={() => setIsNewBorrower(!isNewBorrower)}
                    />

                    {/* Loan Type */}
                    <div className="input-group">
                        <label className="input-label">Loan Type</label>
                        <div className="input-field" style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
                            <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}><FileText size={18} /></div>
                            <select
                                className="input-field"
                                style={{ border: 'none', flex: 1, paddingLeft: 0, background: 'transparent' }}
                                value={formData.loanType}
                                onChange={e => setFormData({ ...formData, loanType: e.target.value })}
                            >
                                <option value="simple">Simple Interest</option>
                                <option value="emi">EMI (Home Loan)</option>
                                <option value="compound">Daily Compound (Line of Credit)</option>
                                <option value="daily">Daily Interest (Daily Rate)</option>
                            </select>
                        </div>
                    </div>

                    {/* Principal Amount */}
                    <div className="input-group">
                        <label className="input-label">Principal Amount (₹)</label>
                        <div className="input-field" style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
                            <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}><DollarSign size={18} /></div>
                            <input
                                type="number"
                                className="input-field"
                                style={{ border: 'none', flex: 1, paddingLeft: 0 }}
                                placeholder="e.g. 50000"
                                value={formData.principal}
                                onChange={e => setFormData({ ...formData, principal: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Interest Rate */}
                    <div className="input-group">
                        <label className="input-label">Interest Rate (% per annum)</label>
                        <div className="input-field" style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
                            <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}><Percent size={18} /></div>
                            <input
                                type="number"
                                step="0.1"
                                className="input-field"
                                style={{ border: 'none', flex: 1, paddingLeft: 0 }}
                                placeholder="e.g. 12"
                                value={formData.rate}
                                onChange={e => setFormData({ ...formData, rate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Tenure (Only for EMI) */}
                    {formData.loanType === 'emi' && (
                        <div className="input-group">
                            <label className="input-label">Tenure (Months)</label>
                            <div className="input-field" style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
                                <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}><Clock size={18} /></div>
                                <input
                                    type="number"
                                    className="input-field"
                                    style={{ border: 'none', flex: 1, paddingLeft: 0 }}
                                    placeholder="e.g. 12"
                                    value={formData.tenure}
                                    onChange={e => setFormData({ ...formData, tenure: e.target.value })}
                                    required
                                    min="1"
                                />
                            </div>
                        </div>
                    )}

                    {/* Start Date */}
                    <div className="input-group">
                        <label className="input-label">Start Date</label>
                        <div className="input-field" style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
                            <div
                                style={{ padding: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                onClick={() => {
                                    const input = document.getElementById('loan-start-date');
                                    if (input) {
                                        input.focus();
                                        input.showPicker && input.showPicker();
                                    }
                                }}
                            >
                                <Calendar size={18} />
                            </div>
                            <input
                                id="loan-start-date"
                                type="date"
                                className="input-field"
                                style={{ border: 'none', flex: 1, paddingLeft: 0 }}
                                value={formData.startDate}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start' }}>
                    <PlusCircle size={20} />
                    Add Loan
                </button>
            </form>
        </div>
    );
};

export default EntryForm;
