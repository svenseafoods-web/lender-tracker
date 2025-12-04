import React, { useMemo, useState } from 'react';
import { ArrowLeft, DollarSign, Percent, Clock, PlusCircle, RefreshCw, X } from 'lucide-react';
import { calculateInterest, calculateEMI, calculateDailyCompound, formatCurrency } from '../utils/calculations';
import LoanList from './LoanList'; // Reusing the list/table component

const BorrowerDashboard = ({ borrowerName, loans, onBack, onEdit, onPayInterest, onDelete, onBulkUpdateLoanType }) => {
    const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
    const [selectedLoanType, setSelectedLoanType] = useState('simple');
    const [selectedTenure, setSelectedTenure] = useState('');


    const totals = useMemo(() => {
        let totalPrincipal = 0;
        let totalInterest = 0;
        let totalDue = 0;
        let activeCount = 0;

        loans.forEach(loan => {
            if (!loan.endDate) { // Only count active loans for totals
                activeCount++;
                const principal = loan.principal || loan.amount;
                totalPrincipal += principal;

                if (loan.loanType === 'emi') {
                    const emi = calculateEMI(principal, loan.rate, loan.tenure);
                    totalInterest += emi; // For EMI, we sum the monthly installment as "current interest/due"
                    totalDue += emi;
                } else if (loan.loanType === 'compound') {
                    const { interest, totalAmount } = calculateDailyCompound(principal, loan.rate, loan.startDate);
                    totalInterest += interest;
                    totalDue += totalAmount;
                } else {
                    const { interest } = calculateInterest(principal, loan.rate, loan.startDate, loan.endDate);
                    totalInterest += interest;
                    totalDue += (principal + interest);
                }
            }
        });

        return { totalPrincipal, totalInterest, totalDue, activeCount };
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
                <div style={{ marginLeft: 'auto' }}>
                    <button
                        onClick={() => setShowBulkUpdateModal(true)}
                        className="btn btn-secondary"
                        style={{ gap: '0.5rem' }}
                    >
                        <RefreshCw size={16} /> Update All Loan Types
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
        </div>
    );
};

export default BorrowerDashboard;
