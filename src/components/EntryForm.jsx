import React, { useState } from 'react';
import { Plus, Calendar, DollarSign, Percent } from 'lucide-react';
import BorrowerSelect from './BorrowerSelect';

const INTEREST_RATES = [6, 8, 10, 12, 15, 18, 24, 36];
const PRINCIPAL_AMOUNTS = [
    { label: 'Custom', value: '' },
    { label: '₹50,000', value: 50000 },
    { label: '₹1,00,000', value: 100000 },
    { label: '₹2,00,000', value: 200000 },
    { label: '₹3,00,000', value: 300000 },
    { label: '₹5,00,000', value: 500000 },
    { label: '₹10,00,000', value: 1000000 }
];

const EntryForm = ({ onAddLoan, existingBorrowers }) => {
    const [formData, setFormData] = useState({
        borrower: '',
        principal: '',
        principalMode: 'custom',
        rate: '8',
        rateMode: 'dropdown', // 'custom' or 'dropdown'
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.borrower || !formData.principal || !formData.rate || !formData.startDate) return;

        onAddLoan({
            borrower: formData.borrower,
            principal: parseFloat(formData.principal),
            rate: parseFloat(formData.rate),
            startDate: formData.startDate,
            endDate: formData.endDate,
            id: Date.now().toString(),
            history: []
        });

        // Reset form but keep date
        setFormData(prev => ({
            ...prev,
            borrower: '',
            principal: '',
            principalMode: 'custom',
            rate: '8',
            rateMode: 'dropdown',
            endDate: ''
        }));
    };

    const handlePrincipalModeChange = (mode) => {
        setFormData({
            ...formData,
            principalMode: mode,
            principal: mode === 'custom' ? '' : formData.principal
        });
    };

    const handleRateModeChange = (mode) => {
        setFormData({
            ...formData,
            rateMode: mode,
            rate: mode === 'custom' ? '' : '8'
        });
    };

    return (
        <div className="card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus className="text-accent-primary" /> New Loan Entry
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>

                <BorrowerSelect
                    value={formData.borrower}
                    onChange={(val) => setFormData({ ...formData, borrower: val })}
                    existingBorrowers={existingBorrowers}
                />

                <div className="input-group">
                    <label className="input-label">Principal Amount</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => handlePrincipalModeChange('custom')}
                            className={formData.principalMode === 'custom' ? 'btn btn-primary' : 'btn btn-secondary'}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', flex: 1 }}
                        >
                            Custom
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePrincipalModeChange('dropdown')}
                            className={formData.principalMode === 'dropdown' ? 'btn btn-primary' : 'btn btn-secondary'}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', flex: 1 }}
                        >
                            Preset
                        </button>
                    </div>

                    {formData.principalMode === 'custom' ? (
                        <div className="input-field" style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
                            <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}><DollarSign size={18} /></div>
                            <input
                                type="number"
                                className="input-field"
                                style={{ border: 'none', flex: 1, paddingLeft: 0 }}
                                placeholder="Enter amount"
                                value={formData.principal}
                                onChange={e => setFormData({ ...formData, principal: e.target.value })}
                                tabIndex={1}
                                required
                            />
                        </div>
                    ) : (
                        <div className="input-field" style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
                            <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}><DollarSign size={18} /></div>
                            <select
                                className="input-field"
                                style={{ border: 'none', flex: 1, paddingLeft: 0, background: 'transparent' }}
                                value={formData.principal}
                                onChange={e => setFormData({ ...formData, principal: e.target.value })}
                                tabIndex={1}
                                required
                            >
                                {PRINCIPAL_AMOUNTS.map(amount => (
                                    <option key={amount.value} value={amount.value}>
                                        {amount.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="input-group">
                    <label className="input-label">Interest Rate (% per annum)</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => handleRateModeChange('dropdown')}
                            className={formData.rateMode === 'dropdown' ? 'btn btn-primary' : 'btn btn-secondary'}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', flex: 1 }}
                        >
                            Preset
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRateModeChange('custom')}
                            className={formData.rateMode === 'custom' ? 'btn btn-primary' : 'btn btn-secondary'}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', flex: 1 }}
                        >
                            Custom
                        </button>
                    </div>

                    {formData.rateMode === 'dropdown' ? (
                        <div className="input-field" style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
                            <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}><Percent size={18} /></div>
                            <select
                                className="input-field"
                                style={{ border: 'none', flex: 1, paddingLeft: 0, background: 'transparent' }}
                                value={formData.rate}
                                onChange={e => setFormData({ ...formData, rate: e.target.value })}
                                tabIndex={2}
                                required
                            >
                                {INTEREST_RATES.map(rate => (
                                    <option key={rate} value={rate}>{rate}%</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="input-field" style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
                            <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}><Percent size={18} /></div>
                            <input
                                type="number"
                                step="0.1"
                                className="input-field"
                                style={{ border: 'none', flex: 1, paddingLeft: 0 }}
                                placeholder="Enter rate %"
                                value={formData.rate}
                                onChange={e => setFormData({ ...formData, rate: e.target.value })}
                                tabIndex={2}
                                required
                            />
                        </div>
                    )}
                </div>

                <div className="input-group">
                    <label className="input-label">Start Date</label>
                    <div className="input-field" style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
                        <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}><Calendar size={18} /></div>
                        <input
                            type="date"
                            className="input-field"
                            style={{ border: 'none', flex: 1, paddingLeft: 0 }}
                            value={formData.startDate}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            tabIndex={3}
                            required
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label className="input-label">End Date (Optional)</label>
                    <div className="input-field" style={{ display: 'flex', alignItems: 'center', padding: 0 }}>
                        <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}><Calendar size={18} /></div>
                        <input
                            type="date"
                            className="input-field"
                            style={{ border: 'none', flex: 1, paddingLeft: 0 }}
                            value={formData.endDate}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            tabIndex={4}
                        />
                    </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ height: '48px' }} tabIndex={5}>
                    <Plus size={20} /> Add Loan
                </button>
            </form>
        </div>
    );
};

export default EntryForm;
