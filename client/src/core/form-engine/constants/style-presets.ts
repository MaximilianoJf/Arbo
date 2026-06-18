import type { FormStyles } from "../types";

export interface StylePreset {
    name: string;
    label: string;
    preview: {
        pageBg: string;
        cardBg: string;
        accent: string;
        border: string;
        text: string;
    };
    styles: Partial<FormStyles>;
}

export const STYLE_PRESETS: StylePreset[] = [
    {
        name: "default",
        label: "Default",
        preview: {
            pageBg: "#0f0f14",
            cardBg: "#1a1a24",
            accent: "#4ADE80",
            border: "#2e2e3e",
            text: "#F1F1F4",
        },
        styles: {
            accentColor: "#4ADE80",
            bgColor: "#1a1a24",
            pageBgColor: "#0f0f14",
            gradient: undefined,
            borderRadius: 14,
            borderColor: "#2e2e3e",
            shadowStyle: "md",
        },
    },
    {
        name: "glass",
        label: "Glass",
        preview: {
            pageBg: "#07071a",
            cardBg: "rgba(255,255,255,0.08)",
            accent: "#818cf8",
            border: "rgba(255,255,255,0.15)",
            text: "#e2e8f0",
        },
        styles: {
            accentColor: "#818cf8",
            bgColor: "#ffffff",
            pageBgColor: "#07071a",
            gradient: undefined,
            borderRadius: 16,
            borderColor: "rgba(255,255,255,0.15)",
            shadowStyle: "glow",
            cardOpacity: 9,
            cardBlur: 16,
            // Glows are required for the glass effect to be visible
            pageGlowEnabled: true,
            pageGlowOrbs: [
                { id: "g1", x: 20, y: 15, size: 75, opacity: 55, color: "#818cf8" },
                { id: "g2", x: 80, y: 25, size: 65, opacity: 48, color: "#6366f1" },
                { id: "g3", x: 50, y: 85, size: 60, opacity: 42, color: "#a78bfa" },
            ],
        },
    },
    {
        name: "midnight",
        label: "Midnight",
        preview: {
            pageBg: "#030712",
            cardBg: "#111827",
            accent: "#3b82f6",
            border: "#1e293b",
            text: "#f1f5f9",
        },
        styles: {
            accentColor: "#3b82f6",
            bgColor: "#111827",
            pageBgColor: "#030712",
            gradient: undefined,
            borderRadius: 12,
            borderColor: "#1e293b",
            shadowStyle: "lg",
        },
    },
    {
        name: "light",
        label: "Light",
        preview: {
            pageBg: "#f8fafc",
            cardBg: "#ffffff",
            accent: "#2563eb",
            border: "#e2e8f0",
            text: "#1e293b",
        },
        styles: {
            accentColor: "#2563eb",
            bgColor: "#ffffff",
            pageBgColor: "#f8fafc",
            gradient: undefined,
            borderRadius: 12,
            borderColor: "#e2e8f0",
            shadowStyle: "sm",
        },
    },
    {
        name: "minimalist",
        label: "Minimal",
        preview: {
            pageBg: "#fafafa",
            cardBg: "#ffffff",
            accent: "#18181b",
            border: "#e4e4e7",
            text: "#18181b",
        },
        styles: {
            accentColor: "#18181b",
            bgColor: "#ffffff",
            pageBgColor: "#fafafa",
            gradient: undefined,
            borderRadius: 8,
            borderColor: "#e4e4e7",
            shadowStyle: "none",
        },
    },
    {
        name: "sunset",
        label: "Sunset",
        preview: {
            pageBg: "#1a0a1e",
            cardBg: "#1e1028",
            accent: "#f472b6",
            border: "#3b1d4e",
            text: "#fce7f3",
        },
        styles: {
            accentColor: undefined,
            bgColor: "#1e1028",
            pageBgColor: "#1a0a1e",
            gradient: "linear-gradient(135deg, #ec4899, #f97316)",
            borderRadius: 16,
            borderColor: "#3b1d4e",
            shadowStyle: "glow",
        },
    },
    {
        name: "ocean",
        label: "Ocean",
        preview: {
            pageBg: "#0a1628",
            cardBg: "#0f1d32",
            accent: "#06b6d4",
            border: "#164e63",
            text: "#cffafe",
        },
        styles: {
            accentColor: undefined,
            bgColor: "#0f1d32",
            pageBgColor: "#0a1628",
            gradient: "linear-gradient(135deg, #06b6d4, #3b82f6)",
            borderRadius: 14,
            borderColor: "#164e63",
            shadowStyle: "md",
        },
    },
    {
        name: "emerald",
        label: "Emerald",
        preview: {
            pageBg: "#022c22",
            cardBg: "#064e3b",
            accent: "#34d399",
            border: "#065f46",
            text: "#d1fae5",
        },
        styles: {
            accentColor: "#34d399",
            bgColor: "#064e3b",
            pageBgColor: "#022c22",
            gradient: undefined,
            borderRadius: 12,
            borderColor: "#065f46",
            shadowStyle: "md",
        },
    },
];

export const SHADOW_OPTIONS: { value: string; label: string; css: string }[] = [
    { value: "none", label: "None", css: "none" },
    { value: "sm", label: "Small", css: "0 1px 4px rgba(0,0,0,0.2)" },
    { value: "md", label: "Medium", css: "0 4px 16px rgba(0,0,0,0.3)" },
    { value: "lg", label: "Large", css: "0 8px 32px rgba(0,0,0,0.4)" },
    { value: "glow", label: "Glow", css: "__glow__" }, // special — computed from accent
];

export const getShadowCss = (shadowStyle?: string, accentColor?: string, gradient?: string): string => {
    if (!shadowStyle || shadowStyle === "none") return "none";
    const opt = SHADOW_OPTIONS.find((o) => o.value === shadowStyle);
    if (!opt) return "0 4px 16px rgba(0,0,0,0.3)";
    if (opt.css === "__glow__") {
        // Extract a color for glow
        const color = accentColor || "#4ADE80";
        return `0 4px 24px ${color}22, 0 0 48px ${color}11`;
    }
    return opt.css;
};
