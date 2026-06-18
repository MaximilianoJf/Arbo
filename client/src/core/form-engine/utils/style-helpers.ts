import type { FormStyles, PageLayout, PageLayoutItem, PageElementKey, PageBreakpoint } from "../types";

// ─── Page free-grid layout helpers ───

export const PAGE_GRID_DEFAULT_COLS = 12;
export const PAGE_GRID_DEFAULT_ROWH = 44;

/** Default grid layout mirroring the classic left-contact / right-form arrangement. */
export const buildDefaultPageLayout = (): PageLayout => ({
    enabled: true,
    cols: PAGE_GRID_DEFAULT_COLS,
    rowH: PAGE_GRID_DEFAULT_ROWH,
    items: [
        { key: "logo", x: 0, y: 0, w: 2, h: 1 },
        { key: "heading", x: 2, y: 0, w: 10, h: 1 },
        { key: "contact", x: 0, y: 1, w: 4, h: 8 },
        { key: "header", x: 4, y: 1, w: 8, h: 2 },
        { key: "form", x: 4, y: 3, w: 8, h: 6 },
        { key: "footer", x: 0, y: 9, w: 12, h: 1 },
        // Image is a full-width backdrop behind everything by default
        { key: "image", x: 0, y: 0, w: 12, h: 10 },
    ],
});

export const getPageLayoutItem = (layout: PageLayout | undefined, key: PageElementKey): PageLayoutItem | undefined =>
    layout?.items.find((it) => it.key === key);

/** Items for a breakpoint, cascading down to the desktop base. */
export const getLayoutItems = (layout: PageLayout, bp: PageBreakpoint): PageLayoutItem[] => {
    if (bp === "mobile") return layout.mobile ?? layout.tablet ?? layout.items;
    if (bp === "tablet") return layout.tablet ?? layout.items;
    return layout.items;
};

export const findLayoutItem = (items: PageLayoutItem[], key: PageElementKey): PageLayoutItem | undefined =>
    items.find((it) => it.key === key);

/** Breakpoint from a viewport width. */
export const breakpointFromWidth = (w: number): PageBreakpoint =>
    w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop";

/** Backfill any missing element in an items array (older layouts miss newer ones like "header"). */
const ensureItems = (items: PageLayoutItem[], base: PageLayout): PageLayoutItem[] => {
    const byKey = new Map(items.map((it) => [it.key, it]));
    let nextY = Math.max(1, ...items.map((it) => it.y + it.h));
    return base.items.map((def) => {
        const existing = byKey.get(def.key);
        if (existing) return existing;
        if (def.key === "image") return { ...def };   // backdrop keeps its full-width default
        const added: PageLayoutItem = { ...def, x: 0, y: nextY };
        nextY += def.h;
        return added;
    });
};

/** Ensure every page element exists across all defined breakpoints. */
export const normalizePageLayout = (layout?: PageLayout): PageLayout => {
    const base = buildDefaultPageLayout();
    if (!layout || !Array.isArray(layout.items) || layout.items.length === 0) return base;
    return {
        enabled: layout.enabled,
        cols: layout.cols || base.cols,
        rowH: layout.rowH || base.rowH,
        items: ensureItems(layout.items, base),
        ...(layout.tablet?.length ? { tablet: ensureItems(layout.tablet, base) } : {}),
        ...(layout.mobile?.length ? { mobile: ensureItems(layout.mobile, base) } : {}),
        ...(layout.decors?.length ? { decors: layout.decors } : {}),
    };
};

/** Absolute CSS position for a grid item (percentage width, px vertical). */
export const gridItemStyle = (item: PageLayoutItem, cols: number, rowH: number): React.CSSProperties => ({
    position: "absolute",
    left: `${(item.x / cols) * 100}%`,
    top: item.y * rowH,
    width: `${(item.w / cols) * 100}%`,
    minHeight: item.h * rowH,
    paddingLeft: 8,
    paddingRight: 8,
    boxSizing: "border-box",
});

/** Total height the grid container needs to fit the given items. */
export const pageLayoutHeight = (items: PageLayoutItem[], rowH: number): number =>
    Math.max(1, ...items.map((it) => it.y + it.h)) * rowH;

/**
 * Applies alpha to any color string: hex (#rrggbb), rgb(), rgba(), or CSS var().
 * Returns CSS var() strings unchanged.
 */
export const applyAlpha = (color: string, alpha: number): string => {
    if (!color || color.startsWith("var(")) return color;
    const rgbaMatch = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbaMatch) return `rgba(${rgbaMatch[1]},${rgbaMatch[2]},${rgbaMatch[3]},${alpha})`;
    const clean = color.replace("#", "");
    if (clean.length !== 6) return color;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
};

/**
 * Returns true when the given hex color is perceptually light (luminance > 55%).
 * Returns false for CSS vars, rgb() strings, or invalid colors.
 */
export const isColorLight = (color: string): boolean => {
    if (!color || color.startsWith("var(") || color.startsWith("rgb")) return false;
    const clean = color.replace("#", "");
    if (clean.length !== 6) return false;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
};

/** Returns inline style for card glassmorphism (opacity + blur). */
export const getGlassStyle = (bgColor: string, styles?: FormStyles): React.CSSProperties => {
    const opacity = styles?.cardOpacity ?? 100;
    const blur = styles?.cardBlur ?? 0;
    const bg = opacity < 100 ? applyAlpha(bgColor, opacity / 100) : bgColor;
    return {
        background: bg,
        ...(blur > 0 ? { backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)` } : {}),
    };
};

/** Builds the CSS background: glow orbs + (outside grid mode) the page image, over pageBgColor.
 *  In grid mode the image is a positionable element instead. */
export const getPageBgCss = (styles?: FormStyles): string => {
    const base = styles?.pageBgColor || "#0f0f14";
    const layers: string[] = [];

    if (styles?.pageGlowEnabled && styles.pageGlowOrbs?.length) {
        for (const orb of styles.pageGlowOrbs) {
            const rgba = applyAlpha(orb.color, orb.opacity / 100);
            layers.push(`radial-gradient(ellipse ${orb.size}% ${Math.round(orb.size * 0.65)}% at ${orb.x}% ${orb.y}%, ${rgba} 0%, transparent 70%)`);
        }
    }

    // Image as a CSS background only when NOT using the free grid (there it's a positionable element).
    // Fade and opacity are simulated with page-color gradients painted over the image,
    // so the same controls work in both modes.
    if (styles?.pageBgImage && !styles?.pageLayout?.enabled) {
        const fit = styles.pageImageFit || "cover";
        const posX = styles.pageImagePosX ?? 50;
        const posY = styles.pageImagePosY ?? 50;
        const opacity = styles.pageImageOpacity ?? 100;
        const fadeTop = styles.pageImageFadeTop ?? 0;
        const fadeBottom = styles.pageImageFadeBottom ?? 0;
        if (opacity < 100) {
            const veil = applyAlpha(base, 1 - opacity / 100);
            layers.push(`linear-gradient(${veil}, ${veil})`);
        }
        if (fadeTop > 0) layers.push(`linear-gradient(to bottom, ${base} 0%, transparent ${fadeTop}%)`);
        if (fadeBottom > 0) layers.push(`linear-gradient(to top, ${base} 0%, transparent ${fadeBottom}%)`);
        layers.push(`url("${styles.pageBgImage}") ${posX}% ${posY}%/${fit} no-repeat`);
    }

    layers.push(base);
    return layers.length === 1 ? base : layers.join(", ");
};

/** Builds the CSS background for the embed area: its own glow orbs over pageBgColor. */
export const getEmbedBgCss = (styles?: FormStyles): string => {
    const base = styles?.pageBgColor || "#0f0f14";
    const layers: string[] = [];

    if (styles?.embedGlowEnabled && styles.embedGlowOrbs?.length) {
        for (const orb of styles.embedGlowOrbs) {
            const rgba = applyAlpha(orb.color, orb.opacity / 100);
            layers.push(`radial-gradient(ellipse ${orb.size}% ${Math.round(orb.size * 0.65)}% at ${orb.x}% ${orb.y}%, ${rgba} 0%, transparent 70%)`);
        }
    }

    layers.push(base);
    return layers.length === 1 ? base : layers.join(", ");
};

/** Style for the positionable background image: fit, opacity, radius and fade masks. */
export const getPageImageStyle = (styles?: FormStyles): React.CSSProperties => {
    const css: React.CSSProperties = {
        objectFit: styles?.pageImageFit || "cover",
        objectPosition: `${styles?.pageImagePosX ?? 50}% ${styles?.pageImagePosY ?? 50}%`,
    };
    const opacity = styles?.pageImageOpacity ?? 100;
    if (opacity < 100) css.opacity = opacity / 100;
    if (styles?.pageImageRadius) css.borderRadius = `${styles.pageImageRadius}px`;

    const fadeTop = styles?.pageImageFadeTop ?? 0;
    const fadeBottom = styles?.pageImageFadeBottom ?? 0;
    if (fadeTop > 0 || fadeBottom > 0) {
        const mask = `linear-gradient(to bottom, transparent 0%, black ${fadeTop}%, black ${100 - fadeBottom}%, transparent 100%)`;
        css.maskImage = mask;
        css.WebkitMaskImage = mask;
    }
    return css;
};

/** Returns the accent style object for buttons, bars, etc. */
export const getAccentStyle = (styles?: FormStyles): React.CSSProperties => {
    if (styles?.gradient) return { background: styles.gradient };
    if (styles?.accentColor) return { background: styles.accentColor };
    return { background: "var(--arbo-accent)" };
};

/** Returns max-width for the form card based on cardSize (or custom px width if resized). */
export const getCardMaxWidth = (styles?: FormStyles): string => {
    if (styles?.cardCustomWidth) return `${styles.cardCustomWidth}px`;
    const CARD_SIZES: { value: string; width: string }[] = [
        { value: "sm", width: "480px" },
        { value: "md", width: "640px" },
        { value: "lg", width: "800px" },
        { value: "xl", width: "100%" },
    ];
    const size = CARD_SIZES.find((s) => s.value === styles?.cardSize);
    return size?.width || "640px";
};

/** Returns max-width for the contact panel based on contactSize. */
export const getContactWidth = (styles?: FormStyles): string => {
    const CONTACT_SIZES: { value: string; width: string }[] = [
        { value: "sm", width: "240px" },
        { value: "md", width: "320px" },
        { value: "lg", width: "400px" },
    ];
    const size = CONTACT_SIZES.find((s) => s.value === styles?.contactSize);
    return size?.width || "320px";
};

/**
 * Computes the full page background including auto-glow for glass effects.
 * If glass is active but no explicit glow orbs exist, adds accent-based orbs.
 */
export const getPageBgWithAutoGlow = (styles?: FormStyles): string => {
    const hasGlass = (styles?.cardOpacity ?? 100) < 100 || (styles?.cardBlur ?? 0) > 0;
    const accent = styles?.accentColor || "#4ADE80";
    const glowBg = getPageBgCss(styles);

    if (hasGlass && !styles?.pageGlowEnabled) {
        return `radial-gradient(ellipse at 25% 35%, ${accent}40 0%, transparent 55%), radial-gradient(ellipse at 75% 70%, #8B5CF640 0%, transparent 55%), ${glowBg}`;
    }
    return glowBg;
};

/** Derives text colors for title/subtitle based on card background lightness. */
export const getPageHeadingSizeClass = (size?: string): string => {
    switch (size) {
        case "sm": return "text-lg";
        case "lg": return "text-3xl";
        case "xl": return "text-4xl";
        default: return "text-2xl";
    }
};

export const getCardTextColors = (bgColor?: string) => {
    const cardIsLight = isColorLight(bgColor || "#1a1a24");
    return {
        cardIsLight,
        cardTitleColor: cardIsLight ? "#1e293b" : "var(--arbo-text)",
        cardSubColor: cardIsLight ? "#475569" : "var(--arbo-text-secondary)",
        cardMutedColor: cardIsLight ? "#9ca3af" : "var(--arbo-text-muted)",
    };
};

// ─── Animation helpers ───

/** CSS class for card entrance animation */
export const getEntranceAnimClass = (styles: FormStyles): string => {
    const anim = styles.animEntrance || "none";
    if (anim === "none") return "";
    return `arbo-anim-${anim}`;
};

/** Inline style for entrance animation timing */
export const getEntranceAnimStyle = (styles: FormStyles, staggerIndex = 0): React.CSSProperties => {
    const anim = styles.animEntrance || "none";
    if (anim === "none") return {};
    const duration = styles.animEntranceDuration ?? 500;
    const easing = styles.animEntranceEasing || "ease-out";
    const delay = styles.animEntranceStagger ? staggerIndex * 80 : 0;
    return {
        animationDuration: `${duration}ms`,
        animationTimingFunction: easing,
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
    };
};

/** CSS class for card hover effect */
export const getHoverAnimClass = (styles: FormStyles): string => {
    const hover = styles.animHover || "none";
    if (hover === "none") return "";
    return `arbo-hover-${hover}`;
};

/** CSS class for field focus effect */
export const getFieldFocusClass = (styles: FormStyles): string => {
    const focus = styles.animFieldFocus || "none";
    if (focus === "none") return "";
    return `arbo-focus-${focus}`;
};

/** Transition speed CSS value */
export const getTransitionSpeed = (styles: FormStyles): string => {
    switch (styles.animTransitionSpeed) {
        case "fast": return "150ms";
        case "slow": return "400ms";
        default: return "250ms";
    }
};
