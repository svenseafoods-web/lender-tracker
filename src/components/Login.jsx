import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Lock } from 'lucide-react';
import { SCOPES } from '../config';

const Login = ({ onSuccess, onError }) => {
    const login = useGoogleLogin({
        onSuccess: (tokenResponse) => onSuccess(tokenResponse),
        onError: () => onError(),
        scope: SCOPES,
    });

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom right, var(--bg-primary), var(--bg-secondary))'
        }}>
            <div className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '400px', width: '100%' }}>
                <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    color: 'var(--accent-primary)'
                }}>
                    <Lock size={32} />
                </div>

                <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Lender Tracker</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Secure access for company owners only.
                </p>

                <button
                    onClick={() => login()}
                    className="btn"
                    style={{
                        width: '100%',
                        backgroundColor: 'white',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        padding: '0.75rem'
                    }}
                >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        style={{ width: '20px', height: '20px' }}
                    />
                    Sign in with Google
                </button>
            </div>
        </div>
    );
};

export default Login;
