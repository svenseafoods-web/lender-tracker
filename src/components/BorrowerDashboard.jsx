import React, { useMemo } from 'react';
import { ArrowLeft, DollarSign, Percent, Clock, PlusCircle } from 'lucide-react';
import { calculateInterest, calculateEMI, calculateDailyCompound, formatCurrency } from '../utils/calculations';
import LoanList from './LoanList'; // Reusing the list/table component

const BorrowerDashboard = ({ borrowerName, loans, onBack, onEdit, onPayInterest, onDelete }) => {

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
        </div>
    );
};

export default BorrowerDashboard;
