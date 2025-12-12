import React, { useState } from 'react';
import { Printer, MessageCircle, Mail } from 'lucide-react';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { UPI_ID } from '../config';

const InvoiceButton = ({ borrower, month, loans, borrowerProfile, compact = false }) => {
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
        console.log('WhatsApp Click:', { borrower, profile: borrowerProfile });
        const totalInterest = calculateTotalInterest();
        const message = `Hi ${borrower},\n\nYour loan interest invoice for ${month} is ready.\n\n💰 Interest Amount: ₹${totalInterest.toFixed(2)}\n\n${UPI_ID ? `Pay via UPI: ${UPI_ID}\n\n` : ''}Please make the payment at your earliest convenience.\n\nThank you!`;

        // Use profile phone if available, otherwise prompt
        let phone = borrowerProfile?.phone;
        if (!phone) {
            phone = prompt(`Enter ${borrower}'s WhatsApp number (with country code, e.g., 919876543210):`);
        }

        if (phone) {
            // Remove any spaces, dashes, or plus signs
            const cleanPhone = phone.replace(/[\s\-\+]/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    const handleEmail = () => {
        console.log('Email Click:', { borrower, profile: borrowerProfile });
        const totalInterest = calculateTotalInterest();
        const subject = `Loan Interest Invoice - ${month}`;
        const body = `Dear ${borrower},\n\nYour loan interest invoice for ${month} is ready.\n\nInterest Amount: ₹${totalInterest.toFixed(2)}\n\n${UPI_ID ? `You can pay via UPI: ${UPI_ID}\n\n` : ''}Please make the payment at your earliest convenience.\n\nThank you!`;

        // Use profile email if available, otherwise prompt
        let email = borrowerProfile?.email;
        if (!email) {
            email = prompt(`Enter ${borrower}'s email address:`);
        }

        if (email) {
            // Use Gmail web compose (works in browser)
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(gmailUrl, '_blank');
        }
    };

    if (compact) {
        return (
            <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                    onClick={handlePrint}
                    disabled={generating}
                    className="btn-icon"
                    style={{ color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                    title="Print Invoice"
                >
                    <Printer size={16} />
                </button>
                <button
                    onClick={handleWhatsApp}
                    className="btn-icon"
                    style={{ color: '#25D366', cursor: 'pointer', padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                    title="Send via WhatsApp"
                >
                    <MessageCircle size={16} />
                </button>
                <button
                    onClick={handleEmail}
                    className="btn-icon"
                    style={{ color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                    title="Send via Email"
                >
                    <Mail size={16} />
                </button>
            </div>
        );
    }

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
