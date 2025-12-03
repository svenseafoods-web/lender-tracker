import React from 'react';
import { calculateInterest, formatCurrency } from '../utils/calculations';

const SummaryCards = ({ loans }) => {
    const stats = loans.reduce((acc, loan) => {
        const isReturned = !!loan.endDate;
        const { interest } = calculateInterest(loan.principal, loan.rate, loan.startDate, loan.endDate);

        acc.totalPrincipal += loan.principal;

        if (!isReturned) {
            acc.activePrincipal += loan.principal;
            acc.pendingInterest += interest;
        } else {
            // For returned loans, count the interest as earned
            acc.totalEarned += interest;
        }

        return acc;
    }, { totalPrincipal: 0, activePrincipal: 0, pendingInterest: 0, totalEarned: 0 });

    const totalToReceive = stats.activePrincipal + stats.pendingInterest;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Active Principal</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(stats.activePrincipal)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Total Lent: {formatCurrency(stats.totalPrincipal)}
                </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Pending Interest</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>
                    {formatCurrency(stats.pendingInterest)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    On active loans
                </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Interest Earned</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                    {formatCurrency(stats.totalEarned)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    From returned loans
                </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total To Receive</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                    {formatCurrency(totalToReceive)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Principal + Interest
                </div>
            </div>
        </div>
    );
};

export default SummaryCards;
