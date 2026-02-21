'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallbackPage() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Completing authentication...');

    useEffect(() => {
        // 1. Get the URL parameters (both search and hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);

        // Check for errors
        const error = searchParams.get('error') || hashParams.get('error');
        if (error) {
            setStatus('error');
            setMessage(`Authentication failed: ${error}`);
            setTimeout(() => window.close(), 3000);
            return;
        }

        // 2. Extract Implicit Grant matching token
        const accessToken = hashParams.get('access_token');
        const expiresIn = hashParams.get('expires_in');

        if (accessToken) {
            // Send token back to the opening window (Settings Page)
            if (window.opener) {
                window.opener.postMessage(
                    {
                        type: 'NEXORA_OAUTH_SUCCESS',
                        payload: {
                            provider: 'googleCalendar',
                            accessToken,
                            expiresIn: expiresIn ? parseInt(expiresIn, 10) : 3600
                        }
                    },
                    window.location.origin
                );
            }

            setStatus('success');
            setMessage('Successfully connected! You can close this window.');
            setTimeout(() => window.close(), 1500);
            return;
        }

        // 3. Fallback: No token found
        setStatus('error');
        setMessage('No authentication token found in URL.');
        setTimeout(() => window.close(), 3000);

    }, []);

    return (
        <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full p-8 rounded-2xl bg-dark-900 border border-glass-border shadow-2xl text-center space-y-6">

                {status === 'loading' && (
                    <Loader2 className="w-16 h-16 text-neon-cyan animate-spin mx-auto" />
                )}

                {status === 'success' && (
                    <CheckCircle className="w-16 h-16 text-neon-green mx-auto" />
                )}

                {status === 'error' && (
                    <XCircle className="w-16 h-16 text-status-error mx-auto" />
                )}

                <div>
                    <h1 className="text-xl font-bold text-white mb-2">
                        {status === 'loading' && 'Authenticating'}
                        {status === 'success' && 'Connected!'}
                        {status === 'error' && 'Connection Failed'}
                    </h1>
                    <p className="text-dark-400">
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
}
