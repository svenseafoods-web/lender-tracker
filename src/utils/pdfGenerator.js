import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateInterest, formatCurrency } from './calculations';
import { UPI_ID } from '../config';

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// Generate UPI QR code URL
const generateUPIQRCode = (upiId, amount, name) => {
    if (!upiId) return null;
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
    // Using Google Charts API for QR code generation
    return `https://chart.googleapis.com/chart?cht=qr&chs=150x150&chl=${encodeURIComponent(upiString)}`;
};

export const generateInvoicePDF = async (borrowerName, month, loans) => {
    if (!loans || !Array.isArray(loans)) {
        throw new Error("Invalid loans data");
    }

    const doc = new jsPDF();

    // Header - Reduced font sizes
    doc.setFontSize(16); // Reduced from 20
    doc.setTextColor(40, 40, 40);
    doc.text("LENDING COMPANY INVOICE", 105, 15, null, null, "center");

    doc.setFontSize(10); // Reduced from 12
    doc.setTextColor(100, 100, 100);
    doc.text(`Borrower: ${borrowerName || 'Unknown'}`, 14, 28);
    doc.text(`Billing Month: ${month || 'N/A'}`, 14, 34);

    const today = new Date();
    doc.text(`Date Generated: ${formatDate(today.toISOString().split('T')[0])}`, 14, 40);

    // Table Data
    const tableRows = [];
    let totalPrincipal = 0;
    let totalInterest = 0;
    let totalDays = 0;
    let ongoingPrincipal = 0; // Only for ongoing loans

    // Sort loans by Date Taken (Start Date)
    const sortedLoans = [...loans].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    sortedLoans.forEach((loan, index) => {
        try {
            if (!loan.startDate) return;

            const principal = Number(loan.principal || loan.amount) || 0;

            const { days, interest } = calculateInterest(
                principal,
                Number(loan.rate) || 0,
                loan.startDate,
                loan.endDate
            );

            totalPrincipal += principal;
            totalInterest += interest;
            totalDays += days;

            // Only add to ongoing principal if loan is not returned
            if (!loan.endDate) {
                ongoingPrincipal += principal;
            }

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

    // Table with smaller fonts
    autoTable(doc, {
        startY: 50, // Adjusted for smaller header
        head: [['Date Taken', 'Date Returned', 'Principal', 'Rate', 'Days', 'Interest']],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 }, // Reduced font size
        headStyles: { fillColor: [59, 130, 246], halign: 'center', fontSize: 9 },
        foot: [['Total', '', formatCurrency(totalPrincipal), '', '', formatCurrency(totalInterest)]],
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 }
    });

    // Add summary section
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11); // Reduced from 14
    doc.setTextColor(40, 40, 40);
    doc.text(`Total Interest: ${formatCurrency(totalInterest)}`, 14, finalY);
    doc.text(`Total Amount Due (Ongoing Principal + Interest): ${formatCurrency(ongoingPrincipal + totalInterest)}`, 14, finalY + 7);

    // Add UPI QR Code if UPI_ID is configured
    if (UPI_ID) {
        const totalAmount = ongoingPrincipal + totalInterest;
        const qrCodeUrl = generateUPIQRCode(UPI_ID, totalAmount, 'Loan Payment');

        try {
            const qrY = finalY + 20;

            // Add section title
            doc.setFontSize(10);
            doc.setTextColor(40, 40, 40);
            doc.text('Scan to Pay:', 14, qrY);

            // Add UPI details
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`UPI ID: ${UPI_ID}`, 14, qrY + 6);
            doc.text(`Amount: ${formatCurrency(totalAmount)}`, 14, qrY + 12);

            // Load and add QR code image
            await new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';

                img.onload = function () {
                    try {
                        doc.addImage(img, 'PNG', 14, qrY + 18, 40, 40);
                        resolve();
                    } catch (e) {
                        console.error('Error adding QR image:', e);
                        reject(e);
                    }
                };

                img.onerror = function () {
                    console.error('Failed to load QR code image');
                    resolve(); // Continue even if QR fails
                };

                img.src = qrCodeUrl;
            });

        } catch (error) {
            console.error('Error adding QR code:', error);
        }
    }

    return doc;
};
