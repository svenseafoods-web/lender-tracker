import React, { useMemo, useState } from 'react';
import { ArrowLeft, DollarSign, Percent, Clock, PlusCircle, RefreshCw, X, Edit3 } from 'lucide-react';
import { calculateInterest, calculateEMI, calculateDailyCompound, formatCurrency } from '../utils/calculations';
import LoanList from './LoanList'; // Reusing the list/table component

const BorrowerDashboard = ({ borrowerName, loans, onBack, onEdit, onPayInterest, onDelete, onBulkUpdateLoanType, onBulkUpdateRate }) => {
    const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
    const [selectedLoanType, setSelectedLoanType] = useState('simple');
    const [selectedTenure, setSelectedTenure] = useState('');

    // State for bulk rate update
    const [showRateUpdateModal, setShowRateUpdateModal] = useState(false);
    const [selectedLoans, setSelectedLoans] = useState([]);
    const [newRate, setNewRate] = useState('');


    const totals = useMemo(() => {
        let totalPrincipal = 0;
        let totalInterest = 0;
        let totalDue = 0;
        let activeCount = 0;
        let earnedInterest = 0; // Interest from closed loans

        loans.forEach(loan => {
            const principal = loan.principal || loan.amount;

            // Calculate earned interest from CLOSED loans
            if (loan.endDate) {
                if (loan.loanType === 'emi') {
                    const emi = calculateEMI(principal, loan.rate, loan.tenure);
                    const totalPaid = emi * loan.tenure;
                    earnedInterest += (totalPaid - principal); // Only the interest portion
                } else if (loan.loanType === 'compound') {
                    const { interest } = calculateDailyCompound(principal, loan.rate, loan.startDate, loan.endDate);
                    earnedInterest += interest;
                } else if (loan.loanType === 'daily') {
                    const { interest } = calculateInterest(principal, loan.rate, loan.startDate, loan.endDate);
                    earnedInterest += interest;
                } else {
                    // Simple interest
                    const { interest } = calculateInterest(principal, loan.rate, loan.startDate, loan.endDate);
                    earnedInterest += interest;
                }
            }

            // Calculate current dues from ACTIVE loans only
            if (!loan.endDate) {
                activeCount++;
                totalPrincipal += principal;

                if (loan.loanType === 'emi') {
                    const emi = calculateEMI(principal, loan.rate, loan.tenure);
                    totalInterest += emi; // For EMI, we sum the monthly installment as "current interest/due"
                    totalDue += emi;
                } else if (loan.loanType === 'compound') {
                    const { interest, totalAmount } = calculateDailyCompound(principal, loan.rate, loan.startDate);
                    totalInterest += interest;
                    totalDue += totalAmount;
                } else if (loan.loanType === 'daily') {
                    const { interest, totalAmount } = calculateInterest(principal, loan.rate, loan.startDate);
                    totalInterest += interest;
                    totalDue += totalAmount;
                } else {
                    const { interest } = calculateInterest(principal, loan.rate, loan.startDate, loan.endDate);
                    totalInterest += interest;
                    totalDue += (principal + interest);
                }
            }
        });

        return { totalPrincipal, totalInterest, totalDue, activeCount, earnedInterest };
    }, [loans]);

    const handleBulkUpdate = () => {
        if (selectedLoanType === 'emi' && !selectedTenure) {
            alert('Please enter tenure for EMI loans');
            return;
        }

        if (window.confirm(`Update ALL ${loans.length} loans for ${borrowerName} to ${selectedLoanType.toUpperCase()} type?`)) {
            onBulkUpdateLoanType(borrowerName, selectedLoanType, selectedTenure ? parseInt(selectedTenure) : null);
            setShowBulkUpdateModal(false);
        }
    };

    const handleRateUpdate = () => {
        if (selectedLoans.length === 0) {
            alert('Please select at least one loan');
            return;
        }
        if (!newRate || parseFloat(newRate) <= 0) {
            alert('Please enter a valid interest rate');
            return;
        }

        if (window.confirm(`Update interest rate to ${newRate}% for ${selectedLoans.length} selected loans?`)) {
            onBulkUpdateRate(selectedLoans, parseFloat(newRate));
            setShowRateUpdateModal(false);
            setSelectedLoans([]);
            setNewRate('');
        }
    };

    const toggleLoanSelection = (loanId) => {
        setSelectedLoans(prev =>
            prev.includes(loanId)
                ? prev.filter(id => id !== loanId)
                : [...prev, loanId]
        );
    };

    const selectAll = () => {
        setSelectedLoans(loans.map(l => l.id));
    };

    const deselectAll = () => {
        setSelectedLoans([]);
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={onBack}
                    className="btn-icon"
                    style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '50%' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{borrowerName}</h2>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {totals.activeCount} Active Loans
                    </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setShowBulkUpdateModal(true)}
                        className="btn btn-secondary"
                        style={{ gap: '0.5rem' }}
                    >
                        <RefreshCw size={16} /> Update All Loan Types
                    </button>
                    <button
                        onClick={() => setShowRateUpdateModal(true)}
                        className="btn btn-secondary"
                        style={{ gap: '0.5rem' }}
                    >
                        <Edit3 size={16} /> Update Interest Rates
                    </button>
                </div>
            </div>

            {/* Aggregated Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DollarSign size={18} /> Total Principal
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(totals.totalPrincipal)}</div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Percent size={18} /> Total Interest / EMI
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>{formatCurrency(totals.totalInterest)}</div>
                </div>

                <div style={{ backgroundColor: 'var(--success-bg)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--success)' }}>
                    <div style={{ color: 'var(--success)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={18} /> Earned Interest So Far
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(totals.earnedInterest)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        From {loans.filter(l => l.endDate).length} closed loans
                    </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)' }}>
                    <div style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DollarSign size={18} /> Total Due Now
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(totals.totalDue)}</div>
                </div>
            </div>

            <h3 style={{ marginBottom: '1rem' }}>Loan Details</h3>

            {/* Reusing LoanList but passing only this borrower's loans */}
            <LoanList
                loans={loans}
                onEdit={onEdit}
                onPayInterest={onPayInterest}
                onDelete={onDelete}
            />

            {/* Bulk Update Modal */}
            {showBulkUpdateModal && (
                <div className="modal-overlay" onClick={() => setShowBulkUpdateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Update All Loan Types</h3>
                            <button onClick={() => setShowBulkUpdateModal(false)} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                This will update ALL {loans.length} loans for <strong>{borrowerName}</strong> to the selected loan type.
                            </p>

                            <div className="input-group">
                                <label className="input-label">New Loan Type</label>
                                <select
                                    className="input-field"
                                    value={selectedLoanType}
                                    onChange={e => setSelectedLoanType(e.target.value)}
                                >
                                    <option value="simple">Simple Interest</option>
                                    <option value="emi">EMI (Home Loan)</option>
                                    <option value="compound">Daily Compound (Line of Credit)</option>
                                </select>
                            </div>

                            {selectedLoanType === 'emi' && (
                                <div className="input-group">
                                    <label className="input-label">Tenure (Months)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={selectedTenure}
                                        onChange={e => setSelectedTenure(e.target.value)}
                                        placeholder="Enter tenure in months"
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button onClick={() => setShowBulkUpdateModal(false)} className="btn btn-secondary">Cancel</button>
                                <button onClick={handleBulkUpdate} className="btn btn-primary"><RefreshCw size={18} /> Update All</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Rate Update Modal */}
            {showRateUpdateModal && (
                <div className="modal-overlay" onClick={() => setShowRateUpdateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Update Interest Rates</h3>
                            <button onClick={() => setShowRateUpdateModal(false)} className="btn-icon" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                    Select loans to update ({selectedLoans.length} selected)
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={selectAll} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>
                                        Select All
                                    </button>
                                    <button onClick={deselectAll} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                                {loans.map(loan => {
                                    const principal = loan.principal || loan.amount;
                                    return (
                                        <div key={loan.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedLoans.includes(loan.id)}
                                                onChange={() => toggleLoanSelection(loan.id)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500 }}>{new Date(loan.startDate).toLocaleDateString()}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    Principal: {formatCurrency(principal)} | Current Rate: {loan.rate}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="input-group">
                                <label className="input-label">New Interest Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input-field"
                                    value={newRate}
                                    onChange={e => setNewRate(e.target.value)}
                                    placeholder="Enter new rate (e.g., 12)"
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button onClick={() => setShowRateUpdateModal(false)} className="btn btn-secondary">Cancel</button>
                                <button onClick={handleRateUpdate} className="btn btn-primary"><Edit3 size={18} /> Update Rates</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BorrowerDashboard;
