// Shared icon set for the PDF designer.
// Paths are in a 24×24 viewBox and work for both the canvas (<path>) and pdfkit (doc.path).

export interface IconDef {
    label: string;
    path: string;
    mode: "fill" | "stroke";
}

export const PDF_ICONS: Record<string, IconDef> = {
    star: { label: "Estrella", mode: "fill", path: "M12 2.5l2.7 5.9 6.4.6-4.85 4.3 1.45 6.3L12 16.3 6.3 19.6l1.45-6.3L2.9 9l6.4-.6z" },
    check: { label: "Check", mode: "stroke", path: "M4 12.5l5 5L20 6.5" },
    circle: { label: "Círculo", mode: "fill", path: "M12 3a9 9 0 100 18 9 9 0 000-18z" },
    square: { label: "Cuadrado", mode: "fill", path: "M4 4h16v16H4z" },
    heart: { label: "Corazón", mode: "fill", path: "M12 20.5l-1.4-1.3C5.4 14.6 2 11.4 2 7.6 2 5.1 4 3.1 6.5 3.1c1.7 0 3.3.8 4.3 2.1h.4c1-1.3 2.6-2.1 4.3-2.1C18 3.1 20 5.1 20 7.6c0 3.8-3.4 7-8.6 11.6z" },
    diamond: { label: "Rombo", mode: "fill", path: "M12 2l10 10-10 10L2 12z" },
    arrowRight: { label: "Flecha", mode: "stroke", path: "M4 12h15M13 6l6 6-6 6" },
    dot: { label: "Punto", mode: "fill", path: "M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" },
};

export const DEFAULT_ICON = "star";
