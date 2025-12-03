// Helper to get today's date at start of day
export const getToday = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
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
