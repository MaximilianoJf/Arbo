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
    {
        name: "sunrise",
        label: "Sunrise",
        preview: {
            pageBg: "#1c1009",
            cardBg: "#2a1810",
            accent: "#fb923c",
            border: "#7c2d12",
            text: "#ffedd5",
        },
        styles: {
            accentColor: undefined,
            bgColor: "#2a1810",
            pageBgColor: "#1c1009",
            gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
            borderRadius: 14,
            borderColor: "#7c2d12",
            shadowStyle: "glow",
        },
    },
    {
        name: "lavender",
        label: "Lavender",
        preview: {
            pageBg: "#f5f3ff",
            cardBg: "#ffffff",
            accent: "#8b5cf6",
            border: "#ddd6fe",
            text: "#4c1d95",
        },
        styles: {
            accentColor: "#8b5cf6",
            bgColor: "#ffffff",
            pageBgColor: "#f5f3ff",
            gradient: undefined,
            borderRadius: 16,
            borderColor: "#ddd6fe",
            shadowStyle: "sm",
        },
    },
    {
        name: "forest",
        label: "Forest",
        preview: {
            pageBg: "#0c1a12",
            cardBg: "#13261b",
            accent: "#84cc16",
            border: "#1e3a29",
            text: "#ecfccb",
        },
        styles: {
            accentColor: "#84cc16",
            bgColor: "#13261b",
            pageBgColor: "#0c1a12",
            gradient: undefined,
            borderRadius: 12,
            borderColor: "#1e3a29",
            shadowStyle: "md",
        },
    },
    {
        name: "cyber",
        label: "Cyber",
        preview: {
            pageBg: "#0a0a0f",
            cardBg: "#12121c",
            accent: "#e879f9",
            border: "#3b0764",
            text: "#fae8ff",
        },
        styles: {
            accentColor: undefined,
            bgColor: "#12121c",
            pageBgColor: "#0a0a0f",
            gradient: "linear-gradient(135deg, #e879f9, #22d3ee)",
            borderRadius: 10,
            borderColor: "#3b0764",
            shadowStyle: "glow",
            pageGlowEnabled: true,
            pageGlowOrbs: [
                { id: "cy1", x: 15, y: 20, size: 70, opacity: 45, color: "#e879f9" },
                { id: "cy2", x: 85, y: 75, size: 65, opacity: 40, color: "#22d3ee" },
            ],
        },
    },
    {
        name: "coffee",
        label: "Coffee",
        preview: {
            pageBg: "#1c1410",
            cardBg: "#2a201a",
            accent: "#d4a574",
            border: "#44352b",
            text: "#f5ede4",
        },
        styles: {
            accentColor: "#d4a574",
            bgColor: "#2a201a",
            pageBgColor: "#1c1410",
            gradient: undefined,
            borderRadius: 14,
            borderColor: "#44352b",
            shadowStyle: "md",
        },
    },
    {
        name: "rose",
        label: "Rose",
        preview: {
            pageBg: "#fff1f2",
            cardBg: "#ffffff",
            accent: "#f43f5e",
            border: "#fecdd3",
            text: "#881337",
        },
        styles: {
            accentColor: "#f43f5e",
            bgColor: "#ffffff",
            pageBgColor: "#fff1f2",
            gradient: undefined,
            borderRadius: 16,
            borderColor: "#fecdd3",
            shadowStyle: "sm",
        },
    },
    {
        name: "slate",
        label: "Slate",
        preview: {
            pageBg: "#0f172a",
            cardBg: "#1e293b",
            accent: "#94a3b8",
            border: "#334155",
            text: "#f1f5f9",
        },
        styles: {
            accentColor: "#94a3b8",
            bgColor: "#1e293b",
            pageBgColor: "#0f172a",
            gradient: undefined,
            borderRadius: 10,
            borderColor: "#334155",
            shadowStyle: "lg",
        },
    },
    {
        name: "aurora",
        label: "Aurora",
        preview: {
            pageBg: "#021016",
            cardBg: "#06222e",
            accent: "#2dd4bf",
            border: "#134e4a",
            text: "#ccfbf1",
        },
        styles: {
            accentColor: undefined,
            bgColor: "#06222e",
            pageBgColor: "#021016",
            gradient: "linear-gradient(135deg, #2dd4bf, #818cf8)",
            borderRadius: 16,
            borderColor: "#134e4a",
            shadowStyle: "glow",
            pageGlowEnabled: true,
            pageGlowOrbs: [
                { id: "au1", x: 25, y: 15, size: 80, opacity: 40, color: "#2dd4bf" },
                { id: "au2", x: 75, y: 60, size: 70, opacity: 35, color: "#818cf8" },
            ],
        },
    },
    {
        name: "sand",
        label: "Sand",
        preview: {
            pageBg: "#faf6f0",
            cardBg: "#ffffff",
            accent: "#b45309",
            border: "#e7dccd",
            text: "#451a03",
        },
        styles: {
            accentColor: "#b45309",
            bgColor: "#ffffff",
            pageBgColor: "#faf6f0",
            gradient: undefined,
            borderRadius: 12,
            borderColor: "#e7dccd",
            shadowStyle: "sm",
        },
    },
    {
        name: "crimson",
        label: "Crimson",
        preview: {
            pageBg: "#170a0a",
            cardBg: "#251112",
            accent: "#ef4444",
            border: "#450a0a",
            text: "#fee2e2",
        },
        styles: {
            accentColor: "#ef4444",
            bgColor: "#251112",
            pageBgColor: "#170a0a",
            gradient: undefined,
            borderRadius: 12,
            borderColor: "#450a0a",
            shadowStyle: "glow",
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
