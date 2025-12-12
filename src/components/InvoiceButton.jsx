import React, { useState } from 'react';
import { Printer, MessageCircle, Mail } from 'lucide-react';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { UPI_ID } from '../config';
import { getLoanDetails } from '../utils/calculations';

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
        // Calculate total interest from loans using robust logic
        return loans.reduce((total, loan) => {
            const { interestValue } = getLoanDetails(loan);
            return total + interestValue;
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

    const generateMessage = () => {
        const totalInterest = calculateTotalInterest();
        let details = '';

        loans.forEach((loan, index) => {
            const { interestValue, extraInfo } = getLoanDetails(loan);
            const principal = loan.principal || loan.amount;
            const start = new Date(loan.startDate).toLocaleDateString('en-IN');
            const end = loan.endDate ? new Date(loan.endDate).toLocaleDateString('en-IN') : 'Running';

            // More verbose format as requested
            details += `\n${index + 1}. Principal: ₹${principal}\n   Period: ${start} to ${end} (${extraInfo})\n   Interest: ₹${interestValue.toFixed(0)}\n`;
        });

        // Prompt for UPI ID if not set in config
        let payeeVpa = UPI_ID;
        if (!payeeVpa) {
            // Try to guess based on user email? No, unsafe.
            // Just prompt.
            // Note: This prompt happens every time if not set. Ideally we'd save it to localStorage.
            // But for now, simple prompt is fine.
            // We can't easily prompt inside this function if we want to keep it pure-ish, but prompt is sync.
            // However, calling prompt inside generateMessage which is called by handleWhatsApp might be annoying if called multiple times?
            // It's called once per click.
        }

        // Actually, let's handle the prompt outside or just use what we have. 
        // If we want to prompt, we should do it before generating the link.
        // But for simplicity, let's just check here.
        if (!payeeVpa) {
            // We'll leave it empty if not set, user can manually add it or we can prompt in the handler.
            // Let's prompt in the handler to be safe, or just default to empty.
            // The user asked to "ask user to end UPI number".
            // So I will add the prompt logic here.
            const storedUpi = localStorage.getItem('lender_upi_id');
            if (storedUpi) {
                payeeVpa = storedUpi;
            } else {
                const input = prompt("Enter your UPI ID (e.g., phone@upi) for the payment link (Leave empty to skip):");
                if (input) {
                    payeeVpa = input;
                    localStorage.setItem('lender_upi_id', input);
                }
            }
        }

        const baseUrl = window.location.origin;
        const paymentUrl = payeeVpa ? `${baseUrl}/pay?pa=${payeeVpa}&pn=Lender&am=${totalInterest.toFixed(2)}&tn=Loan%20Interest` : '';

        const message = `Hi ${borrower},\n\nLoan Interest Invoice for ${month}:\n${details}\n💰 *Total Interest: ₹${totalInterest.toFixed(2)}*\n\n${paymentUrl ? `Click to Pay (QR & UPI):\n${paymentUrl}\n\n` : ''}Please make the payment at your earliest convenience.\n\nThank you!`;

        return { message, subject: `Loan Interest Invoice - ${month}` };
    };

    const handleWhatsApp = () => {
        console.log('WhatsApp Click:', { borrower, profile: borrowerProfile });
        const { message } = generateMessage();

        // Use profile phone if available, otherwise prompt
        let phone = borrowerProfile?.phone;
        if (!phone) {
            phone = prompt(`Enter ${borrower}'s WhatsApp number (with country code, e.g., 919876543210):`);
        }

        if (phone) {
            // Remove any spaces, dashes, or plus signs
            const cleanPhone = phone.replace(/[\s\-\+]/g, '');
            // Use wa.me which is more robust
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    const handleEmail = () => {
        console.log('Email Click:', { borrower, profile: borrowerProfile });
        const { message, subject } = generateMessage();

        // Use profile email if available, otherwise prompt
        let email = borrowerProfile?.email;
        if (!email) {
            email = prompt(`Enter ${borrower}'s email address:`);
        }

        if (email) {
            // Use Gmail web compose (works in browser)
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
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
