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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '300px' }}>
                <a href={`phonepe://pay?pa=${pa}&pn=${encodeURIComponent(pn)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`} style={{
                    display: 'block',
                    backgroundColor: '#5f259f',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    Pay via PhonePe
                </a>

                <a href={`tez://upi/pay?pa=${pa}&pn=${encodeURIComponent(pn)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`} style={{
                    display: 'block',
                    backgroundColor: '#1a73e8',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    Pay via GPay
                </a>

                <a href={`paytmmp://pay?pa=${pa}&pn=${encodeURIComponent(pn)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`} style={{
                    display: 'block',
                    backgroundColor: '#00b9f1',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    Pay via Paytm
                </a>

                <a href={upiLink} style={{
                    display: 'block',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    marginTop: '0.5rem'
                }}>
                    Other UPI Apps
                </a>
            </div>

            <p style={{ marginTop: '2rem', color: '#666', fontSize: '0.9rem' }}>
                Scan the QR code or click the button above to pay securely via your UPI app.
            </p>
        </div>
    );
};

export default PaymentPage;
