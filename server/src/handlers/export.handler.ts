import { Request, Response } from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import * as formRepo from "../repositories/form.repository";
import { getUserByEmail } from "../repositories/user.repository";

// ─── Helpers ───

/** Flatten JSON answers into a row using field labels as column headers */
const buildExportData = (
    fields: { name: string; label: string }[],
    responses: { answers: Record<string, any>; respondentName?: string; respondentEmail?: string; createdAt?: Date }[],
) => {
    const columns = [
        { header: "#", key: "_index" },
        { header: "Respondent", key: "_respondent" },
        { header: "Email", key: "_email" },
        { header: "Date", key: "_date" },
        ...fields
            .filter((f) => !f.name.startsWith("__page_break_"))
            .map((f) => ({ header: f.label || f.name, key: f.name })),
    ];

    const rows = responses.map((r, i) => {
        const row: Record<string, any> = {
            _index: i + 1,
            _respondent: r.respondentName || "Anonymous",
            _email: r.respondentEmail || "",
            _date: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 16).replace("T", " ") : "",
        };
        for (const f of fields) {
            const val = r.answers[f.name];
            row[f.name] = Array.isArray(val) ? val.join(", ") : val ?? "";
        }
        return row;
    });

    return { columns, rows };
};

/** Verify ownership or collaborator access and return form + responses */
const loadFormAndResponses = async (formId: number, userId: number, userEmail?: string) => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");

    if (form.userId !== userId) {
        if (!userEmail) throw new Error("Unauthorized");
        const collab = await formRepo.isCollaborator(formId, userEmail);
        if (!collab) throw new Error("Unauthorized");
    }

    const responses = await formRepo.getFormResponses(formId);
    return { form, responses };
};

/** Verify access and return form + a single response */
const loadFormAndResponse = async (formId: number, responseId: number, userId: number, userEmail?: string) => {
    const form = await formRepo.getFormById(formId);
    if (!form) throw new Error("Form not found");

    if (form.userId !== userId) {
        if (!userEmail) throw new Error("Unauthorized");
        const collab = await formRepo.isCollaborator(formId, userEmail);
        if (!collab) throw new Error("Unauthorized");
    }

    const response = await formRepo.getFormResponseById(formId, responseId);
    if (!response) throw new Error("Respuesta no encontrada");
    return { form, response };
};

// ─── Excel export ───

export const exportExcel = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const { form, responses } = await loadFormAndResponses(Number(req.params.id), user.id, user.email);
        const fields = (form.fields || []).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        const { columns, rows } = buildExportData(fields, responses);

        const wb = new ExcelJS.Workbook();
        wb.creator = "Arbo Forms";
        const ws = wb.addWorksheet("Responses");

        // Columns
        ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.key.startsWith("_") ? 18 : 24 }));

        // Style header row
        const headerRow = ws.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4ADE80" } };
        headerRow.alignment = { vertical: "middle" };

        // Data rows
        rows.forEach((row) => ws.addRow(row));

        // Auto-filter
        ws.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + columns.length)}1` };

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${form.title.replace(/[^a-zA-Z0-9 ]/g, "")}_responses.xlsx"`);

        await wb.xlsx.write(res);
        res.end();
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 400;
        return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
    }
};

// ─── PDF export ───

export const exportPdf = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const { form, responses } = await loadFormAndResponses(Number(req.params.id), user.id, user.email);
        const fields = (form.fields || []).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .filter((f: any) => !f.name.startsWith("__page_break_"));

        const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${form.title.replace(/[^a-zA-Z0-9 ]/g, "")}_responses.pdf"`);
        doc.pipe(res);

        // Title
        doc.fontSize(18).font("Helvetica-Bold").text(form.title, { align: "center" });
        if (form.description) {
            doc.moveDown(0.3).fontSize(10).font("Helvetica").fillColor("#666666").text(form.description, { align: "center" });
        }
        doc.moveDown(0.5).fontSize(9).fillColor("#999999").text(`${responses.length} response(s) — exported ${new Date().toLocaleDateString()}`, { align: "center" });
        doc.moveDown(1);

        // Each response as a card
        responses.forEach((r: any, idx: number) => {
            // Check if we need a new page (rough estimate)
            if (doc.y > 650) doc.addPage();

            // Response header
            doc.fillColor("#4ADE80").fontSize(11).font("Helvetica-Bold")
                .text(`Response #${idx + 1}`, 40);
            doc.moveDown(0.2);
            doc.fillColor("#333333").fontSize(8).font("Helvetica")
                .text(`${r.respondentName || "Anonymous"} • ${r.respondentEmail || "No email"} • ${new Date(r.createdAt).toLocaleString()}`);
            doc.moveDown(0.4);

            // Separator line
            doc.strokeColor("#E0E0E0").lineWidth(0.5)
                .moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown(0.4);

            // Fields
            for (const field of fields) {
                if (doc.y > 720) doc.addPage();

                const val = r.answers[field.name];
                const display = val === null || val === undefined || val === ""
                    ? "—"
                    : Array.isArray(val) ? val.join(", ") : String(val);

                doc.fillColor("#666666").fontSize(8).font("Helvetica-Bold")
                    .text(field.label || field.name, 50, undefined, { continued: false });
                doc.fillColor("#111111").fontSize(9).font("Helvetica")
                    .text(display, 50);
                doc.moveDown(0.3);
            }

            doc.moveDown(0.8);
        });

        // Footer on each page
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            doc.fillColor("#BBBBBB").fontSize(7).font("Helvetica")
                .text(`Arbo Forms — Page ${i + 1} of ${pages.count}`, 40, 780, { align: "center", width: 515 });
        }

        doc.end();
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 400;
        if (!res.headersSent) {
            return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
        }
    }
};

// ─── Single-response PDF (grid layout) ───

// ── Visual designer model (version 2) ──
type BlockKind = "field" | "title" | "meta" | "text" | "shape" | "icon";
type MetaField = "name" | "email" | "date";
interface PdfBlock {
    id?: string;
    kind: BlockKind;
    fieldName?: string;
    metaField?: MetaField;
    text?: string;
    shape?: "rect" | "line";
    iconId?: string;
    x: number; y: number; w: number; h: number;
    bgColor?: string;
    textColor?: string;
    labelColor?: string;
    borderColor?: string;
    borderWidth?: number;
    showLabel?: boolean;
    labelPos?: "top" | "left";
    fontSize?: number;
    align?: "left" | "center" | "right";
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
}
interface PdfDesign {
    version: 2;
    cols: number;
    rows: number;
    pageBg?: string;
    accentColor?: string;
    numberQuestions?: boolean;
    blocks: PdfBlock[];
}

const META_LABELS: Record<MetaField, string> = { name: "Respondente", email: "Email", date: "Enviado" };

// Same 24×24 icon paths as the client designer
const PDF_ICON_MAP: Record<string, { path: string; mode: "fill" | "stroke" }> = {
    star: { mode: "fill", path: "M12 2.5l2.7 5.9 6.4.6-4.85 4.3 1.45 6.3L12 16.3 6.3 19.6l1.45-6.3L2.9 9l6.4-.6z" },
    check: { mode: "stroke", path: "M4 12.5l5 5L20 6.5" },
    circle: { mode: "fill", path: "M12 3a9 9 0 100 18 9 9 0 000-18z" },
    square: { mode: "fill", path: "M4 4h16v16H4z" },
    heart: { mode: "fill", path: "M12 20.5l-1.4-1.3C5.4 14.6 2 11.4 2 7.6 2 5.1 4 3.1 6.5 3.1c1.7 0 3.3.8 4.3 2.1h.4c1-1.3 2.6-2.1 4.3-2.1C18 3.1 20 5.1 20 7.6c0 3.8-3.4 7-8.6 11.6z" },
    diamond: { mode: "fill", path: "M12 2l10 10-10 10L2 12z" },
    arrowRight: { mode: "stroke", path: "M4 12h15M13 6l6 6-6 6" },
    dot: { mode: "fill", path: "M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" },
};

const fontFor = (bold?: boolean, italic?: boolean): string =>
    bold && italic ? "Helvetica-BoldOblique" : bold ? "Helvetica-Bold" : italic ? "Helvetica-Oblique" : "Helvetica";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

const clampInt = (n: any, min: number, max: number, fallback: number): number => {
    const v = Number(n);
    if (!Number.isFinite(v)) return fallback;
    return Math.max(min, Math.min(max, Math.round(v)));
};

const displayValue = (value: any): string => {
    if (value === null || value === undefined || value === "") return "—";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "string" && value.includes(",")) return value.split(",").map((s) => s.trim()).filter(Boolean).join(", ");
    return String(value);
};

interface RenderCtx {
    formTitle: string;
    fieldsMap: Record<string, any>;
    answers: Record<string, any>;
    respondentName: string;
    respondentEmail: string;
    date: string;
    qNumbers?: Map<string, number>;   // block.id → question number
}

/** Render a label + value pair (used by field blocks and single meta-field blocks). */
const renderLabelValue = (
    doc: InstanceType<typeof PDFDocument>,
    block: PdfBlock, rect: { px: number; py: number; pw: number; ph: number },
    labelText: string, val: string,
): void => {
    const { px, py, pw, ph } = rect;
    const pad = 4;
    const ix = px + pad;
    const iw = Math.max(8, pw - pad * 2);
    const align = block.align || "left";
    const textColor = block.textColor || "#111827";
    const labelColor = block.labelColor || "#6B7280";
    const valFs = block.fontSize || 10;
    const showLabel = block.showLabel !== false;

    const valFont = fontFor(block.bold, block.italic);
    const underline = !!block.underline;

    if (showLabel && (block.labelPos || "top") === "left") {
        const labelW = Math.min(Math.max(50, iw * 0.4), 160);
        doc.fillColor(labelColor).font("Helvetica-Bold").fontSize(8)
            .text(labelText, ix, py + pad, { width: labelW, height: ph - pad * 2, ellipsis: true });
        doc.fillColor(textColor).font(valFont).fontSize(valFs)
            .text(val, ix + labelW + 6, py + pad, { width: Math.max(8, iw - labelW - 6), height: ph - pad * 2, align, ellipsis: true, underline });
        return;
    }

    let cy = py + pad;
    if (showLabel) {
        doc.fillColor(labelColor).font("Helvetica-Bold").fontSize(8)
            .text(labelText, ix, cy, { width: iw, height: 12, ellipsis: true });
        cy = doc.y + 2;
    }
    doc.fillColor(textColor).font(valFont).fontSize(valFs)
        .text(val, ix, cy, { width: iw, height: Math.max(10, py + ph - pad - cy), align, ellipsis: true, underline });
};

/** Render one block at its absolute page rect. */
const renderBlock = (
    doc: InstanceType<typeof PDFDocument>,
    block: PdfBlock,
    rect: { px: number; py: number; pw: number; ph: number },
    ctx: RenderCtx,
): void => {
    const { px, py, pw, ph } = rect;
    const pad = 4;
    const ix = px + pad;
    const iw = Math.max(8, pw - pad * 2);
    const align = block.align || "left";
    const textColor = block.textColor || "#111827";
    const bw = block.borderWidth || 0.8;

    // Shapes — own bg/border handling
    if (block.kind === "shape") {
        if (block.shape === "line") {
            const color = block.bgColor || block.borderColor || "#111827";
            const ly = py + ph / 2;
            doc.lineWidth(block.borderWidth || 2).strokeColor(color).moveTo(px + pad, ly).lineTo(px + pw - pad, ly).stroke();
            return;
        }
        if (block.bgColor) doc.roundedRect(px, py, pw, ph, 3).fillColor(block.bgColor).fill();
        if (block.borderColor) doc.roundedRect(px, py, pw, ph, 3).lineWidth(bw).strokeColor(block.borderColor).stroke();
        return;
    }

    // Background & border (text/title/meta/field/icon)
    if (block.bgColor) doc.roundedRect(px, py, pw, ph, 3).fillColor(block.bgColor).fill();
    if (block.borderColor) doc.roundedRect(px, py, pw, ph, 3).lineWidth(bw).strokeColor(block.borderColor).stroke();

    // Icon — scale the 24×24 path into the box
    if (block.kind === "icon") {
        const def = PDF_ICON_MAP[block.iconId || "star"] || PDF_ICON_MAP.star;
        const inner = Math.min(pw, ph) - pad * 2;
        const s = Math.max(0.1, inner / 24);
        const ox = px + (pw - 24 * s) / 2;
        const oy = py + (ph - 24 * s) / 2;
        doc.save();
        doc.translate(ox, oy).scale(s);
        if (def.mode === "fill") doc.path(def.path).fill(textColor);
        else doc.lineJoin("round").lineCap("round").path(def.path).lineWidth(2 / s).strokeColor(textColor).stroke();
        doc.restore();
        return;
    }

    if (block.kind === "title") {
        doc.fillColor(textColor).font(fontFor(block.bold !== false, block.italic)).fontSize(block.fontSize || 18)
            .text(ctx.formTitle || "", ix, py + pad, { width: iw, height: ph - pad * 2, align, ellipsis: true, underline: !!block.underline });
        return;
    }

    // Combined meta box (legacy, no metaField)
    if (block.kind === "meta" && !block.metaField) {
        const lines = [
            `Respondente: ${ctx.respondentName}`,
            `Email: ${ctx.respondentEmail}`,
            `Enviado: ${ctx.date}`,
        ];
        const fs = block.fontSize || 9;
        doc.font("Helvetica").fontSize(fs).fillColor(textColor);
        let ly = py + pad;
        for (const line of lines) {
            if (ly + fs + 2 > py + ph - pad) break;
            doc.text(line, ix, ly, { width: iw, height: fs + 3, ellipsis: true });
            ly += fs + 4;
        }
        return;
    }

    if (block.kind === "text") {
        doc.fillColor(textColor).font(fontFor(block.bold, block.italic)).fontSize(block.fontSize || 11)
            .text(block.text || "", ix, py + pad, { width: iw, height: ph - pad * 2, align, ellipsis: true, underline: !!block.underline });
        return;
    }

    // Single meta-field (freely positioned contact piece)
    if (block.kind === "meta") {
        const labelText = META_LABELS[block.metaField!] || "";
        const val = block.metaField === "name" ? ctx.respondentName
            : block.metaField === "email" ? ctx.respondentEmail
            : ctx.date;
        renderLabelValue(doc, block, rect, labelText, val);
        return;
    }

    // field — label + answer text
    const field = block.fieldName ? ctx.fieldsMap[block.fieldName] : undefined;
    if (!field) return;
    const num = block.id && ctx.qNumbers ? ctx.qNumbers.get(block.id) : undefined;
    const labelText = (num ? `${num}. ` : "") + (field.label || field.name);
    const val = displayValue(ctx.answers?.[block.fieldName!]);
    renderLabelValue(doc, block, rect, labelText, val);
};

/** Default stacked design when the form has no saved visual design. */
const buildDefaultDesign = (fields: any[]): PdfDesign => {
    const cols = 12;
    const rows = 17;
    const blocks: PdfBlock[] = [];
    let y = 0;
    blocks.push({ kind: "title", x: 0, y, w: cols, h: 1, align: "center", textColor: "#111827", fontSize: 18 }); y += 1;
    blocks.push({ kind: "meta", x: 0, y, w: cols, h: 2, bgColor: "#F3F4F6", textColor: "#374151", borderColor: "#4ADE80", fontSize: 9 }); y += 2;
    for (const f of fields) {
        if (y + 1 > rows) break;
        blocks.push({ kind: "field", fieldName: f.name, x: 0, y, w: cols, h: 1, showLabel: true, labelColor: "#6B7280", textColor: "#111827", fontSize: 10, align: "left" });
        y += 1;
    }
    return { version: 2, cols, rows, pageBg: "#FFFFFF", accentColor: "#4ADE80", blocks };
};

/** Stream a single-response PDF using the given design. Shared by export & preview. */
const streamResponsePdf = (
    res: Response,
    form: any,
    fields: any[],
    response: any,
    design: PdfDesign,
    opts: { disposition: "attachment" | "inline" },
): void => {
    const fieldsMap: Record<string, any> = {};
    fields.forEach((f: any) => { fieldsMap[f.name] = f; });

    const cols = clampInt(design.cols, 4, 24, 12);
    const rows = clampInt(design.rows, 4, 40, 17);
    const cellW = CONTENT_W / cols;
    const cellH = (PAGE_H - MARGIN * 2) / rows;
    const r: any = response;

    // Question numbering (reading order) when enabled
    let qNumbers: Map<string, number> | undefined;
    if (design.numberQuestions) {
        qNumbers = new Map();
        design.blocks
            .filter((b) => b.kind === "field" && b.id)
            .slice()
            .sort((a, b) => (a.y - b.y) || (a.x - b.x))
            .forEach((b, i) => qNumbers!.set(b.id!, i + 1));
    }

    const doc = new PDFDocument({ size: "A4", margin: MARGIN });
    res.setHeader("Content-Type", "application/pdf");
    const safeTitle = form.title.replace(/[^a-zA-Z0-9 ]/g, "");
    res.setHeader("Content-Disposition", `${opts.disposition}; filename="${safeTitle}_respuesta_${r.id}.pdf"`);
    doc.pipe(res);

    if (design.pageBg && design.pageBg.toUpperCase() !== "#FFFFFF") {
        doc.rect(0, 0, PAGE_W, PAGE_H).fillColor(design.pageBg).fill();
    }

    const ctx: RenderCtx = {
        formTitle: form.title,
        fieldsMap,
        answers: r.answers || {},
        respondentName: r.respondentName || "Anónimo",
        respondentEmail: r.respondentEmail || "—",
        date: new Date(r.createdAt).toLocaleString("es-AR"),
        qNumbers,
    };

    for (const block of design.blocks) {
        const bx = clampInt(block.x, 0, cols - 1, 0);
        const by = clampInt(block.y, 0, rows - 1, 0);
        const bw = clampInt(block.w, 1, cols - bx, 1);
        const bh = clampInt(block.h, 1, rows - by, 1);
        renderBlock(doc, block, {
            px: MARGIN + bx * cellW,
            py: MARGIN + by * cellH,
            pw: bw * cellW,
            ph: bh * cellH,
        }, ctx);
    }

    doc.fillColor("#BBBBBB").fontSize(7).font("Helvetica")
        .text("Arbo Forms", MARGIN, PAGE_H - MARGIN + 6, { align: "center", width: CONTENT_W });

    doc.end();
};

const getResponseFields = (form: any) =>
    (form.fields || [])
        .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .filter((f: any) => !f.name.startsWith("__page_break_"));

const isValidDesign = (d: any): d is PdfDesign =>
    d && d.version === 2 && Array.isArray(d.blocks);

export const exportSingleResponsePdf = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const { form, response } = await loadFormAndResponse(
            Number(req.params.id), Number(req.params.responseId), user.id, user.email,
        );
        const fields = getResponseFields(form);
        const saved = (form.styles as any)?.pdfLayout;
        const design = isValidDesign(saved) ? saved : buildDefaultDesign(fields);

        streamResponsePdf(res, form, fields, response, design, { disposition: "attachment" });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 400;
        if (!res.headersSent) {
            return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
        }
    }
};

/** Preview a response with a design sent in the request body (not persisted). */
export const previewSingleResponsePdf = async (req: Request, res: Response) => {
    try {
        const user = await getUserByEmail(req.email!);
        if (!user) return res.status(401).json({ ok: false, errors: [{ msg: "Unauthorized" }] });

        const { form, response } = await loadFormAndResponse(
            Number(req.params.id), Number(req.params.responseId), user.id, user.email,
        );
        const fields = getResponseFields(form);
        const incoming = req.body?.design;
        const design = isValidDesign(incoming) ? incoming : buildDefaultDesign(fields);

        streamResponsePdf(res, form, fields, response, design, { disposition: "inline" });
    } catch (error: any) {
        const status = error.message === "Unauthorized" ? 403 : 400;
        if (!res.headersSent) {
            return res.status(status).json({ ok: false, errors: [{ msg: error.message }] });
        }
    }
};
