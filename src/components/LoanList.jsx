import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, DollarSign, Edit2, CheckCircle, Clock, Trash2, Printer } from 'lucide-react';
import { calculateInterest, calculateEMI, calculateDailyCompound, calculateDailySimpleInterest, formatCurrency } from '../utils/calculations';
import InvoiceButton from './InvoiceButton';
import { generateInvoicePDF } from '../utils/pdfGenerator';

const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
};

const formatMonth = (dateStr) => {
    const date = new Date(dateStr);
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${month} ${year}`;
};

const getLoanDetails = (loan) => {
    if (loan.loanType === 'emi') {
        const emi = calculateEMI(loan.principal || loan.amount, loan.rate, loan.tenure);
        return {
            typeLabel: 'EMI Loan',
            interestLabel: 'Monthly EMI',
            interestValue: emi,
            totalDue: emi, // For EMI, usually the due amount is the monthly installment
            extraInfo: `${loan.tenure} Months`
        };
    } else if (loan.loanType === 'compound') {
        const { interest, totalAmount, days } = calculateDailyCompound(loan.principal || loan.amount, loan.rate, loan.startDate);
        return {
            typeLabel: 'Daily Compound',
            interestLabel: 'Acc. Interest',
            interestValue: interest,
            totalDue: totalAmount,
            extraInfo: `${days} Days`
        };
        totalDue: totalAmount,
            extraInfo: `${days} Days`
    };
} else if (loan.loanType === 'daily') {
    const { interest, totalAmount, days } = calculateDailySimpleInterest(loan.principal || loan.amount, loan.rate, loan.startDate);
    return {
        typeLabel: 'Daily Interest',
        interestLabel: 'Interest',
        interestValue: interest,
        totalDue: totalAmount,
        extraInfo: `${days} Days`
    };
} else {
    // Default to Simple Interest
    const { days, interest } = calculateInterest(loan.principal || loan.amount, loan.rate, loan.startDate, loan.endDate);
    return {
        typeLabel: 'Simple Interest',
        interestLabel: 'Interest',
        interestValue: interest,
        totalDue: (loan.principal || loan.amount) + interest,
        extraInfo: `${days} Days`
    };
}
};

const MobileLoanCard = ({ loan, onEdit, onPayInterest, onDelete }) => {
    const { typeLabel, interestLabel, interestValue, totalDue, extraInfo } = getLoanDetails(loan);
    const isReturned = !!loan.endDate;
    const principal = loan.principal || loan.amount;

    const handlePrint = async () => {
        try {
            const doc = await generateInvoicePDF(loan.borrower, formatMonth(loan.startDate), [loan]);
            window.open(doc.output('bloburl'), '_blank');
        } catch (error) {
            alert('Failed to generate invoice: ' + error.message);
        }
    };

    return (
        <div style={{
            backgroundColor: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '0.75rem',
            border: '1px solid var(--border-color)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 600 }}>{formatDate(loan.startDate)}</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{typeLabel}</span>
                    {isReturned ? (
                        <span className="badge badge-info" style={{ gap: '4px' }}><CheckCircle size={12} /> Returned</span>
                    ) : (
                        <span className="badge badge-success" style={{ gap: '4px' }}><Clock size={12} /> Ongoing</span>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <div>Principal: <span style={{ color: 'var(--text-primary)' }}>{formatCurrency(principal)}</span></div>
                <div>Rate: <span style={{ color: 'var(--text-primary)' }}>{loan.rate}%</span></div>
                <div>Duration: <span style={{ color: 'var(--text-primary)' }}>{extraInfo}</span></div>
                <div>{interestLabel}: <span style={{ color: 'var(--warning)' }}>{formatCurrency(interestValue)}</span></div>
            </div>

            {!isReturned && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>Total Due:</span>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatCurrency(totalDue)}</span>
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={handlePrint} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} title="Print Invoice">
                    <Printer size={14} />
                </button>
                <button className="btn btn-secondary" onClick={() => onEdit(loan)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    <Edit2 size={14} /> Edit
                </button>
                {!isReturned && (
                    <button className="btn btn-primary" onClick={() => onPayInterest(loan)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--success)' }}>
                        <DollarSign size={14} /> Pay
                    </button>
                )}
                <button className="btn btn-secondary" onClick={() => onDelete(loan)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                    <Trash2 size={14} /> Delete
                </button>
            </div>
        </div>
    );
};

const LoanTable = ({ loans, onEdit, onPayInterest, onDelete }) => {
    const [sortConfig, setSortConfig] = useState({ key: 'startDate', direction: 'asc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedLoans = useMemo(() => {
        let sortableLoans = [...loans];
        sortableLoans.sort((a, b) => {
            let aValue, bValue;

            // Helper to get comparable values
            const getVal = (item, key) => {
                if (key === 'interest' || key === 'days') {
                    const details = getLoanDetails(item);
                    return key === 'interest' ? details.interestValue : details.extraInfo; // Simplified sort
                }
                return item[key] || item.amount; // Handle principal/amount legacy
            };

            aValue = getVal(a, sortConfig.key);
            bValue = getVal(b, sortConfig.key);

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableLoans;
    }, [loans, sortConfig]);

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <div style={{ width: 16 }}></div>;
        return sortConfig.direction === 'asc' ? <ChevronDown size={16} /> : <ChevronDown size={16} style={{ transform: 'rotate(180deg)' }} />;
    };

    const thStyle = { cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '4px' };

    return (
        <>
            {/* Desktop Table View */}
            <div className="mobile-hidden">
                <table className="table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('startDate')}><div style={thStyle}>Date <SortIcon column="startDate" /></div></th>
                            <th>Type</th>
                            <th onClick={() => handleSort('principal')}><div style={thStyle}>Principal <SortIcon column="principal" /></div></th>
                            <th onClick={() => handleSort('rate')}><div style={thStyle}>Rate <SortIcon column="rate" /></div></th>
                            <th>Duration</th>
                            <th>Interest / EMI</th>
                            <th>Total Due</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedLoans.map(loan => {
                            const { typeLabel, interestLabel, interestValue, totalDue, extraInfo } = getLoanDetails(loan);
                            const isReturned = !!loan.endDate;
                            const principal = loan.principal || loan.amount;

                            return (
                                <tr key={loan.id} style={{ opacity: isReturned ? 0.7 : 1 }}>
                                    <td>{formatDate(loan.startDate)}</td>
                                    <td><span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>{typeLabel}</span></td>
                                    <td>{formatCurrency(principal)}</td>
                                    <td>{loan.rate}%</td>
                                    <td>{extraInfo}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ color: 'var(--warning)', fontWeight: 500 }}>{formatCurrency(interestValue)}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{interestLabel}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{isReturned ? '-' : formatCurrency(totalDue)}</td>
                                    <td>
                                        {isReturned ? (
                                            <span className="badge badge-info" style={{ gap: '4px' }}><CheckCircle size={12} /> Returned</span>
                                        ) : (
                                            <span className="badge badge-success" style={{ gap: '4px' }}><Clock size={12} /> Ongoing</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn-icon"
                                                title="Print Invoice"
                                                onClick={async () => {
                                                    try {
                                                        const doc = await generateInvoicePDF(loan.borrower, formatMonth(loan.startDate), [loan]);
                                                        window.open(doc.output('bloburl'), '_blank');
                                                    } catch (error) {
                                                        alert('Failed to generate invoice: ' + error.message);
                                                    }
                                                }}
                                                style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
                                            >
                                                <Printer size={16} />
                                            </button>
                                            <button
                                                className="btn-icon"
                                                title="Edit Loan"
                                                onClick={() => onEdit(loan)}
                                                style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            {!isReturned && (
                                                <button
                                                    className="btn-icon"
                                                    title="Pay"
                                                    onClick={() => onPayInterest(loan)}
                                                    style={{ color: 'var(--success)', cursor: 'pointer' }}
                                                >
                                                    <DollarSign size={16} />
                                                </button>
                                            )}
                                            <button
                                                className="btn-icon"
                                                title="Delete Loan"
                                                onClick={() => onDelete(loan)}
                                                style={{ color: 'var(--danger)', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="desktop-hidden">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                    <select
                        onChange={(e) => handleSort(e.target.value)}
                        value={sortConfig.key}
                        style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <option value="startDate">Sort by Date</option>
                        <option value="principal">Sort by Principal</option>
                        <option value="days">Sort by Days</option>
                        <option value="interest">Sort by Interest</option>
                    </select>
                </div>
                {sortedLoans.map(loan => (
                    <MobileLoanCard
                        key={loan.id}
                        loan={loan}
                        onEdit={onEdit}
                        onPayInterest={onPayInterest}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </>
    );
};

const LoanList = ({ loans, onEdit, onPayInterest, onDelete }) => {
    const [expandedBorrowers, setExpandedBorrowers] = useState({});
    const [expandedMonths, setExpandedMonths] = useState({});

    const toggleBorrower = (name) => {
        setExpandedBorrowers(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const toggleMonth = (key) => {
        setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleDelete = (loan) => {
        if (window.confirm(`Are you sure you want to delete this loan for ${loan.borrower}?`)) {
            onDelete(loan.id);
        }
    };

    // Group loans by Borrower -> Month
    const groupedLoans = useMemo(() => {
        const groups = {};
        loans.forEach(loan => {
            if (!groups[loan.borrower]) {
                groups[loan.borrower] = {};
            }
            const monthKey = formatMonth(loan.startDate);
            if (!groups[loan.borrower][monthKey]) {
                groups[loan.borrower][monthKey] = [];
            }
            groups[loan.borrower][monthKey].push(loan);
        });
        return groups;
    }, [loans]);

    // Sort borrowers alphabetically
    const sortedBorrowers = Object.keys(groupedLoans).sort();

    return (
        <div className="card">
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Active Loans</h2>

            {loans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No loans found. Add one above to get started.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {sortedBorrowers.map(borrower => {
                        const isExpanded = expandedBorrowers[borrower];
                        const borrowerLoans = Object.values(groupedLoans[borrower]).flat();
                        const totalPrincipal = borrowerLoans.reduce((sum, l) => {
                            if (l.endDate) return sum; // Skip returned loans
                            const principal = l.principal || l.amount || 0;
                            return sum + principal;
                        }, 0);

                        return (
                            <div key={borrower} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                <div
                                    onClick={() => toggleBorrower(borrower)}
                                    style={{
                                        padding: '1rem',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        {borrower}
                                    </div>
                                    <div className="badge badge-info">
                                        Active Principal: {formatCurrency(totalPrincipal)}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                        {Object.keys(groupedLoans[borrower]).map(month => {
                                            const monthKey = `${borrower}-${month}`;
                                            const isMonthExpanded = expandedMonths[monthKey];
                                            const monthLoans = groupedLoans[borrower][month];

                                            return (
                                                <div key={monthKey} style={{ borderTop: '1px solid var(--border-color)' }}>
                                                    <div
                                                        style={{
                                                            padding: '0.75rem 1rem',
                                                            paddingLeft: '2rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            gap: '0.5rem',
                                                            color: 'var(--text-secondary)',
                                                            fontSize: '0.9rem'
                                                        }}
                                                    >
                                                        <div
                                                            onClick={() => toggleMonth(monthKey)}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                                        >
                                                            {isMonthExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                            {month} ({monthLoans.length} loans)
                                                        </div>

                                                        <InvoiceButton
                                                            borrower={borrower}
                                                            month={month}
                                                            loans={monthLoans}
                                                        />
                                                    </div>

                                                    {isMonthExpanded && (
                                                        <div className="table-container">
                                                            <LoanTable
                                                                loans={monthLoans}
                                                                onEdit={onEdit}
                                                                onPayInterest={onPayInterest}
                                                                onDelete={handleDelete}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LoanList;
