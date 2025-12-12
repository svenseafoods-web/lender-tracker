import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const PaymentPage = () => {
    const [qrCode, setQrCode] = useState('');
    const params = new URLSearchParams(window.location.search);
    const pa = params.get('pa');
    const am = params.get('am');
    const pn = params.get('pn') || 'Lender';
    const tn = params.get('tn') || 'Loan Payment';

    // Construct UPI Deep Link
    const upiLink = `upi://pay?pa=${pa}&pn=${encodeURIComponent(pn)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`;

    useEffect(() => {
        if (pa && am) {
            QRCode.toDataURL(upiLink, { width: 300, margin: 2 })
                .then(url => setQrCode(url))
                .catch(err => console.error(err));
        }
    }, [upiLink, pa, am]);

    if (!pa || !am) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
                <h2>Invalid Payment Link</h2>
                <p>Missing payment details.</p>
            </div>
        );
    }

    return (
        <div style={{
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
            maxWidth: '500px',
            margin: '0 auto',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <h1 style={{ marginBottom: '0.5rem' }}>Payment Request</h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                Pay <strong>₹{am}</strong> to<br />
                <span style={{ color: '#666' }}>{pa}</span>
            </p>

            {qrCode && (
                <div style={{
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '1rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    marginBottom: '2rem'
                }}>
                    <img src={qrCode} alt="Payment QR Code" style={{ display: 'block' }} />
                </div>
            )}

            <a href={upiLink} style={{
                display: 'inline-block',
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '50px',
                textDecoration: 'none',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
                transition: 'transform 0.1s'
            }}>
                Pay Now (PhonePe/GPay)
            </a>

            <p style={{ marginTop: '2rem', color: '#666', fontSize: '0.9rem' }}>
                Scan the QR code or click the button above to pay securely via your UPI app.
            </p>
        </div>
    );
};

export default PaymentPage;
