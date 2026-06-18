import type { CSSProperties } from "react";
import type { FormField, FormStyles, PageBreakpoint } from "../types";

/** Columns of the fluid field grid (matches the page grid). */
export const FIELD_GRID_COLS = 12;

/** Default gap between fields (px). */
export const FIELD_GRID_DEFAULT_GAP = 16;

/** Width presets offered in the editor (label → columns). */
export const SPAN_PRESETS: { label: string; cols: number }[] = [
    { label: "25%", cols: 3 },
    { label: "33%", cols: 4 },
    { label: "50%", cols: 6 },
    { label: "66%", cols: 8 },
    { label: "75%", cols: 9 },
    { label: "100%", cols: 12 },
];

const clampSpan = (v: number) => Math.max(1, Math.min(FIELD_GRID_COLS, Math.round(v)));

/**
 * Effective span (columns) of a field for a breakpoint.
 * Desktop is the base; tablet inherits desktop; mobile defaults to full width.
 */
export const getFieldSpan = (field: FormField, bp: PageBreakpoint): number => {
    if (bp === "mobile") return clampSpan(field.spanMobile ?? FIELD_GRID_COLS);
    if (bp === "tablet") return clampSpan(field.spanTablet ?? field.span ?? FIELD_GRID_COLS);
    return clampSpan(field.span ?? FIELD_GRID_COLS);
};

/** FormField key that stores the span for a breakpoint. */
export const spanKeyForBp = (bp: PageBreakpoint): "span" | "spanTablet" | "spanMobile" =>
    bp === "mobile" ? "spanMobile" : bp === "tablet" ? "spanTablet" : "span";

/**
 * Breakpoint derived from the *container* width (not the viewport),
 * so embeds and narrow panels collapse correctly.
 */
export const getBreakpointForWidth = (w: number): PageBreakpoint =>
    w < 480 ? "mobile" : w < 760 ? "tablet" : "desktop";

/** Whether the fluid field grid is active for these styles. */
export const isFieldGridEnabled = (styles?: FormStyles): boolean => !!styles?.fieldGridEnabled;

/** Gap (px) between fields in the grid. */
export const getFieldGridGap = (styles?: FormStyles): number =>
    styles?.fieldGridGap ?? FIELD_GRID_DEFAULT_GAP;

/** Inline styles of the grid wrapper. */
export const getFieldGridStyle = (styles?: FormStyles): CSSProperties => ({
    display: "grid",
    gridTemplateColumns: `repeat(${FIELD_GRID_COLS}, minmax(0, 1fr))`,
    gap: getFieldGridGap(styles),
    width: "100%",
    alignItems: "start",
    // dense: a narrow field backfills the hole next to a previous one,
    // so resized fields actually sit side by side
    gridAutoFlow: "row dense",
});

/** Inline styles of a field cell for a breakpoint. */
export const getFieldCellStyle = (field: FormField, bp: PageBreakpoint): CSSProperties => ({
    gridColumn: `span ${getFieldSpan(field, bp)} / span ${getFieldSpan(field, bp)}`,
    minWidth: 0,
});
