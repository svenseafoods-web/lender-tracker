import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { generateInvoicePDF } from '../utils/pdfGenerator';

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

    return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
        </div>
    );
};

export default InvoiceButton;
