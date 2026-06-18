// ─── PDF visual designer model ───

export type BlockKind = "field" | "title" | "meta" | "text" | "shape" | "icon";

export type MetaField = "name" | "email" | "date";

export interface PdfBlock {
    id: string;
    kind: BlockKind;
    fieldName?: string;     // for kind="field"
    metaField?: MetaField;  // for kind="meta": render a single contact piece (free positioning)
    text?: string;          // for kind="text" (static custom text)
    shape?: "rect" | "line"; // for kind="shape"
    iconId?: string;        // for kind="icon"
    // Grid position (units, 0-based)
    x: number;
    y: number;
    w: number;
    h: number;
    // Styling
    bgColor?: string;       // block background / shape fill (omit = transparent)
    textColor?: string;     // value text / icon color
    labelColor?: string;    // label text color
    borderColor?: string;   // box / shape border (omit = none)
    borderWidth?: number;   // border / line thickness (pt)
    showLabel?: boolean;    // show the field label / question
    labelPos?: "top" | "left";  // label above the answer or beside it
    fontSize?: number;      // value font size (pt)
    align?: "left" | "center" | "right";
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
}

export interface PdfDesign {
    version: 2;
    cols: number;           // grid columns
    rows: number;           // grid rows (one A4 page)
    pageBg?: string;
    accentColor?: string;
    numberQuestions?: boolean;   // prefix field labels with 1. 2. 3. …
    blocks: PdfBlock[];
}

export const META_LABELS: Record<MetaField, string> = {
    name: "Respondente",
    email: "Email",
    date: "Enviado",
};

/** Number field blocks by reading order (top→bottom, left→right). Returns id → number. */
export const computeQuestionNumbers = (blocks: PdfBlock[]): Map<string, number> => {
    const map = new Map<string, number>();
    blocks
        .filter((b) => b.kind === "field")
        .slice()
        .sort((a, b) => (a.y - b.y) || (a.x - b.x))
        .forEach((b, i) => map.set(b.id, i + 1));
    return map;
};

export interface DesignerField {
    name: string;
    label?: string;
    componentType?: string;
    options?: string[];
}

export const DEFAULT_COLS = 12;
export const DEFAULT_ROWS = 17;   // ≈ A4 portrait aspect at 12 cols

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Build a default stacked design from the form fields. */
export const buildDefaultDesign = (fields: DesignerField[], accent = "#4ADE80"): PdfDesign => {
    const cols = DEFAULT_COLS;
    const rows = DEFAULT_ROWS;
    const blocks: PdfBlock[] = [];
    let y = 0;

    // Title
    blocks.push({ id: crypto.randomUUID(), kind: "title", x: 0, y, w: cols, h: 1, showLabel: false, align: "center", textColor: "#111827", fontSize: 18 });
    y += 1;
    // Meta
    blocks.push({ id: crypto.randomUUID(), kind: "meta", x: 0, y, w: cols, h: 2, bgColor: "#F3F4F6", textColor: "#374151", borderColor: accent, fontSize: 9 });
    y += 2;
    // Fields stacked full width (label + answer only, 1 row each)
    for (const f of fields) {
        if (y + 1 > rows) break;
        blocks.push({
            id: crypto.randomUUID(),
            kind: "field",
            fieldName: f.name,
            x: 0, y, w: cols, h: 1,
            showLabel: true,
            labelColor: "#6B7280",
            textColor: "#111827",
            fontSize: 10,
            align: "left",
        });
        y += 1;
    }

    return { version: 2, cols, rows, pageBg: "#FFFFFF", accentColor: accent, blocks };
};

/** Normalize a saved design: keep valid field blocks, drop blocks whose field no longer exists. */
export const normalizeDesign = (
    fields: DesignerField[],
    saved: any,
    accent = "#4ADE80",
): PdfDesign => {
    if (!saved || saved.version !== 2 || !Array.isArray(saved.blocks)) {
        return buildDefaultDesign(fields, accent);
    }
    const validNames = new Set(fields.map((f) => f.name));
    const cols = clamp(saved.cols ?? DEFAULT_COLS, 4, 24);
    const rows = clamp(saved.rows ?? DEFAULT_ROWS, 4, 40);
    const blocks: PdfBlock[] = (saved.blocks as PdfBlock[])
        .filter((b) => b.kind !== "field" || (b.fieldName && validNames.has(b.fieldName)))
        .map((b) => ({
            ...b,
            x: clamp(b.x ?? 0, 0, cols - 1),
            y: clamp(b.y ?? 0, 0, rows - 1),
            w: clamp(b.w ?? 1, 1, cols),
            h: clamp(b.h ?? 1, 1, rows),
        }));
    return { version: 2, cols, rows, pageBg: saved.pageBg || "#FFFFFF", accentColor: saved.accentColor || accent, blocks };
};
