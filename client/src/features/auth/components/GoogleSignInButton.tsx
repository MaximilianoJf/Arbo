import { useEffect, useRef, useState, useCallback } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface GoogleSignInButtonProps {
    onSuccess: (credential: string) => void;
    onError?: () => void;
}

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    renderButton: (element: HTMLElement, config: any) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
);

export const GoogleSignInButton = ({ onSuccess, onError }: GoogleSignInButtonProps) => {
    const nativeButtonRef = useRef<HTMLDivElement>(null);
    const [gsiReady, setGsiReady] = useState(false);
    const [loading, setLoading] = useState(false);

    // Stable callback ref to avoid re-initializing Google on every render
    const callbackRef = useRef(onSuccess);
    callbackRef.current = onSuccess;
    const errorRef = useRef(onError);
    errorRef.current = onError;

    const initGoogle = useCallback(() => {
        if (!GOOGLE_CLIENT_ID || !window.google || !nativeButtonRef.current) return;

        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: any) => {
                setLoading(false);
                if (response.credential) {
                    callbackRef.current(response.credential);
                } else {
                    errorRef.current?.();
                }
            },
        });

        window.google.accounts.id.renderButton(nativeButtonRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            width: 360,
        });

        setGsiReady(true);
    }, []);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return;

        if (window.google) {
            initGoogle();
        } else {
            // Poll until the GSI script loads
            const interval = setInterval(() => {
                if (window.google) {
                    clearInterval(interval);
                    initGoogle();
                }
            }, 200);
            // Give up after 5s
            const timeout = setTimeout(() => clearInterval(interval), 5000);
            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        }
    }, [initGoogle]);

    // No client ID → no mostrar nada, login normal con email/password
    if (!GOOGLE_CLIENT_ID) return null;

    return (
        <div className="w-full flex flex-col items-center gap-4 mt-1">
            <div className="flex items-center gap-3 w-full">
                <div className="h-px flex-1 bg-[var(--arbo-border)]" />
                <span className="text-xs arbo-text-muted">o</span>
                <div className="h-px flex-1 bg-[var(--arbo-border)]" />
            </div>

            {/* Native Google button (hidden until GSI loads) */}
            <div
                ref={nativeButtonRef}
                className="flex justify-center"
                style={{ display: gsiReady ? "flex" : "none" }}
            />

            {/* Fallback while GSI loads */}
            {!gsiReady && (
                <button
                    disabled={loading}
                    onClick={() => {
                        // Try prompt if GSI loaded between renders
                        if (window.google) {
                            setLoading(true);
                            initGoogle();
                        }
                    }}
                    className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-[var(--arbo-border)] hover:bg-[var(--arbo-surface-2)] transition-colors"
                >
                    <GoogleIcon />
                    <span className="text-sm arbo-text">
                        {loading ? "Cargando..." : "Continuar con Google"}
                    </span>
                </button>
            )}
        </div>
    );
};
