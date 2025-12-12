// Helper to get today's date at start of day
export const getToday = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
};

export const calculateMonthlyInterest = (principal, rate) => {
    if (!principal || isNaN(principal) || !rate || isNaN(rate)) return 0;
    return (principal * rate) / 100 / 12;
};

export const calculateEMI = (principal, rate, tenureMonths) => {
    if (!principal || isNaN(principal) || !rate || isNaN(rate) || !tenureMonths || tenureMonths <= 0) return 0;
    const monthlyRate = rate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return isNaN(emi) ? 0 : emi;
};

export const calculateDailyCompound = (principal, rate, startDate, endDate = null) => {
    if (!principal || isNaN(principal) || !rate || isNaN(rate) || !startDate) {
        return { totalAmount: 0, interest: 0, days: 0 };
    }

    const differenceInDays = (date2, date1) => {
        const diffTime = Math.abs(date2.getTime() - date1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const start = new Date(startDate);
    if (isNaN(start.getTime())) return { totalAmount: 0, interest: 0, days: 0 };

    // Use endDate if provided, otherwise use today
    const end = endDate ? new Date(endDate) : new Date();
    // Ensure end date is at least start date
    if (end < start) end.setTime(start.getTime());

    const daysElapsed = differenceInDays(end, start) + 1;

    // Daily rate
    const dailyRate = rate / 100 / 365;

    // Compound interest formula: A = P * (1 + r/n)^(nt)
    // Here n=365 (daily compounding), t = days/365
    // Simplified: A = P * (1 + dailyRate)^days
    const amount = principal * Math.pow(1 + dailyRate, daysElapsed);

    return {
        totalAmount: amount,
        interest: amount - principal,
        days: daysElapsed
    };
};

export const calculateDailySimpleInterest = (principal, rate, startDate, endDate = null) => {
    if (!principal || isNaN(principal) || !rate || isNaN(rate) || !startDate) {
        return { totalAmount: 0, interest: 0, days: 0 };
    }

    const start = new Date(startDate);
    if (isNaN(start.getTime())) return { totalAmount: 0, interest: 0, days: 0 };

    // Use endDate if provided, otherwise use today
    const end = endDate ? new Date(endDate) : new Date();
    // Ensure end date is at least start date
    if (end < start) end.setTime(start.getTime());

    // Calculate days difference
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Simple Interest with Daily Rate

    // Simple Interest with Daily Rate
    // Formula: P * (R/100) * Days
    const interest = principal * (rate / 100) * days;

    return {
        totalAmount: principal + interest,
        interest: interest,
        days: days
    };
};

export const calculateInterest = (principal, rate, startDate, endDate = null) => {
    try {
        // Parse dates - ensure both are treated as local midnight to avoid timezone offsets
        const parseLocal = (dateInput) => {
            if (!dateInput) return getToday();
            const d = new Date(dateInput);
            // If it's a string like "2025-01-01", it might parse as UTC. 
            // We want to ensure we compare apples to apples (local midnight).
            // Best way for YYYY-MM-DD string is to split and create date
            if (typeof dateInput === 'string' && dateInput.includes('-')) {
                const [y, m, d] = dateInput.split('-').map(Number);
                return new Date(y, m - 1, d, 0, 0, 0, 0);
            }
            const local = new Date(d);
            local.setHours(0, 0, 0, 0);
            return local;
        };

        const start = parseLocal(startDate);
        const end = endDate ? parseLocal(endDate) : getToday();

        // Calculate days difference (Inclusive: Start Date + End Date)
        const diffTime = Math.abs(end - start);
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Interest calculation for ANNUAL rate converted to daily using 360-day commercial year
        // Formula: (Principal * Annual_Rate * Days) / (100 * 360)
        // This ensures 30 days = 1 month exactly (e.g., 24% annual = 2% per 30 days)
        const interest = (principal * rate * days) / (100 * 360);

        return { days, interest };
    } catch (error) {
        console.error('Interest calculation error:', error);
        return { days: 0, interest: 0 };
    }
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};
