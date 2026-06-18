import { createContext, useContext } from "react";

export type PortalTheme = "dark" | "light" | "glass";

export interface PortalContextValue {
    project: any;
    projectId: number;
    theme: PortalTheme;
    setTheme: (t: PortalTheme) => void;
    reload: () => void;
    isOwner: boolean;
}

export const PortalContext = createContext<PortalContextValue | undefined>(undefined);

export const usePortal = () => {
    const ctx = useContext(PortalContext);
    if (!ctx) throw new Error("usePortal must be inside ProjectPortalView");
    return ctx;
};

// ── CSS variables injected per theme on the portal root ──
export const THEME_VARS: Record<PortalTheme, React.CSSProperties> = {
    dark: {},
    light: {
        "--arbo-bg": "#f1f5f9",
        "--arbo-surface": "#ffffff",
        "--arbo-surface-2": "#f8fafc",
        "--arbo-surface-3": "#e2e8f0",
        "--arbo-border": "#e2e8f0",
        "--arbo-border-light": "#cbd5e1",
        "--arbo-text": "#0f172a",
        "--arbo-text-secondary": "#475569",
        "--arbo-text-muted": "#94a3b8",
        "--arbo-text-dim": "#cbd5e1",
        "--arbo-accent-subtle": "rgba(74,222,128,0.10)",
        "--arbo-accent-muted": "rgba(74,222,128,0.18)",
        "--arbo-shadow": "0 2px 8px rgba(0,0,0,.08)",
        "--arbo-shadow-lg": "0 8px 32px rgba(0,0,0,.12)",
    } as React.CSSProperties,
    glass: {
        "--arbo-surface": "rgba(255,255,255,0.07)",
        "--arbo-surface-2": "rgba(255,255,255,0.11)",
        "--arbo-surface-3": "rgba(255,255,255,0.16)",
        "--arbo-border": "rgba(255,255,255,0.15)",
        "--arbo-border-light": "rgba(255,255,255,0.22)",
        "--arbo-text": "#f1f5f9",
        "--arbo-text-secondary": "#94a3b8",
        "--arbo-text-muted": "#64748b",
        "--arbo-shadow": "0 2px 12px rgba(0,0,0,.5)",
        "--arbo-shadow-lg": "0 8px 40px rgba(0,0,0,.6)",
    } as React.CSSProperties,
};
