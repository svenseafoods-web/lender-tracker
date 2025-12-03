import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateInterest, formatCurrency } from './calculations';

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export const generateInvoicePDF = (borrowerName, month, loans) => {
    if (!loans || !Array.isArray(loans)) {
        throw new Error("Invalid loans data");
    }

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("LENDING COMPANY INVOICE", 105, 20, null, null, "center");

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Borrower: ${borrowerName || 'Unknown'}`, 14, 40);
    doc.text(`Billing Month: ${month || 'N/A'}`, 14, 48);

    const today = new Date();
    doc.text(`Date Generated: ${formatDate(today.toISOString().split('T')[0])}`, 14, 56);

    // Table Data
    const tableRows = [];
    let totalPrincipal = 0;
    let totalInterest = 0;
    let totalDays = 0;

    // Sort loans by Date Taken (Start Date)
    const sortedLoans = [...loans].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    sortedLoans.forEach((loan, index) => {
        try {
            if (!loan.startDate) return;

            const { days, interest } = calculateInterest(
                Number(loan.principal) || 0,
                Number(loan.rate) || 0,
                loan.startDate,
                loan.endDate
            );

            const principal = Number(loan.principal) || 0;

            totalPrincipal += principal;
            totalInterest += interest;
            totalDays += days;

            const dateTaken = formatDate(loan.startDate);
            const dateReturned = loan.endDate ? formatDate(loan.endDate) : 'Ongoing';

            tableRows.push([
                dateTaken,
                dateReturned,
                formatCurrency(principal),
                `${loan.rate}%`,
                days,
                formatCurrency(interest)
            ]);
        } catch (err) {
            console.error(`Error processing loan at index ${index}:`, err);
        }
    });

    if (tableRows.length === 0) {
        throw new Error("No valid loan data found to generate invoice.");
    }

    // Table
    autoTable(doc, {
        startY: 65,
        head: [['Date Taken', 'Date Returned', 'Principal', 'Rate', 'Days', 'Interest']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], halign: 'center' },
        foot: [['Total', '', formatCurrency(totalPrincipal), '', totalDays, formatCurrency(totalInterest)]],
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    // Add summary section
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total Interest to be Paid: ${formatCurrency(totalInterest)}`, 14, finalY);

    return doc;
};
