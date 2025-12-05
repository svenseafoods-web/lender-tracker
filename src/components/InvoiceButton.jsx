import React, { useState } from 'react';
import { Printer, MessageCircle, Mail } from 'lucide-react';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { UPI_ID } from '../config';

const InvoiceButton = ({ borrower, month, loans }) => {
    const [generating, setGenerating] = useState(false);

    const getDocAndFilename = async () => {
        try {
            const doc = await generateInvoicePDF(borrower, month, loans);
            const filename = `Invoice_${borrower}_${month.replace(' ', '_')}.pdf`;
            return { doc, filename };
        } catch (e) {
            console.error("PDF Gen Error:", e);
            throw e;
        }
    };

    const calculateTotalInterest = () => {
        // Calculate total interest from loans
        return loans.reduce((total, loan) => {
            const principal = loan.principal || loan.amount;
            const rate = loan.rate || 0;
            const days = Math.floor((new Date() - new Date(loan.startDate)) / (1000 * 60 * 60 * 24));
            const interest = (principal * rate * days) / (365 * 100);
            return total + interest;
        }, 0);
    };

    const handlePrint = async () => {
        try {
            setGenerating(true);
            const { doc } = await getDocAndFilename();
            window.open(doc.output('bloburl'), '_blank');
        } catch (error) {
            alert(`Print failed: ${error.message}`);
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = async () => {
        try {
            setGenerating(true);
            const { doc, filename } = await getDocAndFilename();
            doc.save(filename);
            alert(`✅ Invoice downloaded: ${filename}`);
        } catch (error) {
            alert(`Download failed: ${error.message}`);
        } finally {
            setGenerating(false);
        }
    };

    const handleWhatsApp = () => {
        const totalInterest = calculateTotalInterest();
        const message = `Hi ${borrower},\n\nYour loan interest invoice for ${month} is ready.\n\n💰 Interest Amount: ₹${totalInterest.toFixed(2)}\n\n${UPI_ID ? `Pay via UPI: ${UPI_ID}\n\n` : ''}Please make the payment at your earliest convenience.\n\nThank you!`;

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleEmail = () => {
        const totalInterest = calculateTotalInterest();
        const subject = `Loan Interest Invoice - ${month}`;
        const body = `Dear ${borrower},\n\nYour loan interest invoice for ${month} is ready.\n\nInterest Amount: ₹${totalInterest.toFixed(2)}\n\n${UPI_ID ? `You can pay via UPI: ${UPI_ID}\n\n` : ''}Please make the payment at your earliest convenience.\n\nThank you!`;

        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoUrl);
    };

    return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
                onClick={handlePrint}
                disabled={generating}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', gap: '0.25rem' }}
                title="Print Invoice"
            >
                <Printer size={14} />
                {generating ? 'Generating...' : 'Print'}
            </button>

            <button
                onClick={handleDownload}
                disabled={generating}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', gap: '0.25rem' }}
                title="Download PDF Invoice"
            >
                📥 Download
            </button>

            <button
                onClick={handleWhatsApp}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', gap: '0.25rem', backgroundColor: '#25D366', color: 'white' }}
                title="Send via WhatsApp"
            >
                <MessageCircle size={14} />
                WhatsApp
            </button>

            <button
                onClick={handleEmail}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', gap: '0.25rem' }}
                title="Send via Email"
            >
                <Mail size={14} />
                Email
            </button>
        </div>
    );
};

export default InvoiceButton;
