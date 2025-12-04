import React from 'react';
import { ArrowLeft, Calendar, DollarSign, Clock, Percent, Trash2, Edit2, CheckCircle } from 'lucide-react';
import { calculateInterest, calculateEMI, calculateDailyCompound, formatCurrency } from '../utils/calculations';

const getLoanDetails = (loan) => {
    if (loan.loanType === 'emi') {
        const emi = calculateEMI(loan.principal || loan.amount, loan.rate, loan.tenure);
        return {
            typeLabel: 'EMI Loan',
            interestLabel: 'Monthly EMI',
            interestValue: emi,
            totalDue: emi, // Monthly due
            extraInfo: `${loan.tenure} Months Tenure`,
            description: `Monthly installment of ${formatCurrency(emi)} for ${loan.tenure} months.`
        };
    } else if (loan.loanType === 'compound') {
        const { interest, totalAmount, days } = calculateDailyCompound(loan.principal || loan.amount, loan.rate, loan.startDate);
        return {
            typeLabel: 'Daily Compound',
            interestLabel: 'Acc. Interest',
            interestValue: interest,
            totalDue: totalAmount,
            extraInfo: `${days} Days Elapsed`,
            description: `Interest compounds daily. Total accrued: ${formatCurrency(interest)}.`
        };
    } else {
        const { days, interest } = calculateInterest(loan.principal || loan.amount, loan.rate, loan.startDate, loan.endDate);
        return {
            typeLabel: 'Simple Interest',
            interestLabel: 'Interest',
            interestValue: interest,
            totalDue: (loan.principal || loan.amount) + interest,
            extraInfo: `${days} Days Elapsed`,
            description: `Simple interest calculated over ${days} days.`
        };
    }
};

const SingleLoanView = ({ loan, onBack, onEdit, onPayInterest, onDelete }) => {
    const { typeLabel, interestLabel, interestValue, totalDue, extraInfo, description } = getLoanDetails(loan);
    const isReturned = !!loan.endDate;
    const principal = loan.principal || loan.amount;

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
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{loan.borrower}</h2>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {typeLabel} • {new Date(loan.startDate).toLocaleDateString()}
                    </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    {isReturned ? (
                        <span className="badge badge-info" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                            <CheckCircle size={16} /> Returned
                        </span>
                    ) : (
                        <span className="badge badge-success" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                            <Clock size={16} /> Active
                        </span>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Principal Card */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DollarSign size={18} /> Principal
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{formatCurrency(principal)}</div>
                </div>

                {/* Interest/EMI Card */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Percent size={18} /> {interestLabel}
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--warning)' }}>{formatCurrency(interestValue)}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        {loan.rate}% Rate • {extraInfo}
                    </div>
                </div>

                {/* Total Due Card */}
                {!isReturned && (
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)' }}>
                        <div style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <DollarSign size={18} /> Total Due Now
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(totalDue)}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            {description}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <button
                    className="btn btn-secondary"
                    onClick={() => onEdit(loan)}
                    style={{ flex: 1, justifyContent: 'center' }}
                >
                    <Edit2 size={18} /> Edit Loan
                </button>
                {!isReturned && (
                    <button
                        className="btn btn-primary"
                        onClick={() => onPayInterest(loan)}
                        style={{ flex: 1, justifyContent: 'center', backgroundColor: 'var(--success)' }}
                    >
                        <DollarSign size={18} /> Record Payment
                    </button>
                )}
                <button
                    className="btn btn-secondary"
                    onClick={() => onDelete(loan)}
                    style={{ flex: 1, justifyContent: 'center', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                    <Trash2 size={18} /> Delete Loan
                </button>
            </div>
        </div>
    );
};

export default SingleLoanView;
