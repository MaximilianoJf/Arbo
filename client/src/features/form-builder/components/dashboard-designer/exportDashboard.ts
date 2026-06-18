// ─── Dashboard export: PDF (print) + PNG (rasterized) ───
// Dependency-free. PNG works by embedding the live DOM in an SVG <foreignObject>
// together with the document's own CSS, then rasterizing it on a canvas.

/** Collect all same-origin CSS rules currently applied in the document. */
const collectCss = (): string => {
    let css = "";
    for (const sheet of Array.from(document.styleSheets)) {
        try {
            const rules = (sheet as CSSStyleSheet).cssRules;
            if (!rules) continue;
            for (const rule of Array.from(rules)) css += rule.cssText + "\n";
        } catch {
            // Cross-origin sheet — skip (our app CSS is same-origin).
        }
    }
    return css;
};

/**
 * An SVG loaded via <img> cannot fetch ANY external subresource (fonts, images,
 * @import). Strip those so the embedded stylesheet is fully self-contained;
 * data: URIs (e.g. an uploaded background image) are kept.
 */
const sanitizeCssForSvg = (css: string): string =>
    css
        .replace(/@import[^;]+;/gi, "")
        .replace(/url\(\s*(['"]?)(?!data:)[^)]*\1\s*\)/gi, "none");

const triggerDownload = (href: string, filename: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
};

/**
 * Rasterize a DOM node to PNG. The node is cloned into an SVG foreignObject with
 * the page CSS inlined, so Tailwind classes and CSS variables render correctly.
 */
export const exportToPng = async (el: HTMLElement, filename = "dashboard.png", scale = 2): Promise<void> => {
    const rect = el.getBoundingClientRect();
    const w = Math.ceil(rect.width);
    const h = Math.ceil(rect.height);

    const clone = el.cloneNode(true) as HTMLElement;
    // Solid bg + drop effects that don't rasterize well
    clone.style.margin = "0";
    clone.querySelectorAll<HTMLElement>("*").forEach((n) => {
        n.style.backdropFilter = "none";
        (n.style as any).webkitBackdropFilter = "none";
    });

    const css = sanitizeCssForSvg(collectCss());
    const xhtml = new XMLSerializer().serializeToString(clone);

    // CSS goes in a CDATA block: Tailwind v4 emits `&` (nesting) and other chars
    // that would otherwise break XML parsing of the SVG.
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
        `<foreignObject width="100%" height="100%">` +
        `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px">` +
        `<style><![CDATA[${css}]]></style>${xhtml}</div>` +
        `</foreignObject></svg>`;

    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
        await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = w * scale;
                    canvas.height = h * scale;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return reject(new Error("No 2D context"));
                    ctx.scale(scale, scale);
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                        if (!blob) return reject(new Error("Export failed"));
                        const objUrl = URL.createObjectURL(blob);
                        triggerDownload(objUrl, filename);
                        setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
                        resolve();
                    }, "image/png");
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = () => reject(new Error("svg-load-failed"));
            img.src = svgUrl;
        });
    } catch {
        // Rasterization failed (browser quirk) — give the user the vector SVG,
        // which always renders. Same content, opens in any browser/editor.
        triggerDownload(svgUrl, filename.replace(/\.png$/i, ".svg"));
    } finally {
        setTimeout(() => URL.revokeObjectURL(svgUrl), 2000);
    }
};

/** Wrap the dashboard markup + page CSS into a standalone HTML document. */
const buildStandaloneHtml = (el: HTMLElement, title: string): string => {
    const css = collectCss();
    return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">` +
        `<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>` +
        `<style>${css}` +
        `body{margin:0;background:#0c0c18;padding:24px;-webkit-print-color-adjust:exact;print-color-adjust:exact}` +
        `*{backdrop-filter:none!important}` +
        `</style></head><body>${el.outerHTML}</body></html>`;
};

/** Download the dashboard as a self-contained .html file. */
export const exportToHtml = (el: HTMLElement, filename = "dashboard.html", title = "Dashboard"): void => {
    const blob = new Blob([buildStandaloneHtml(el, title)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Export to PDF via a print window containing the dashboard markup + page CSS.
 * The user picks "Guardar como PDF" in the print dialog.
 */
export const exportToPdf = (el: HTMLElement, title = "Dashboard"): void => {
    const css = collectCss();
    const html = el.outerHTML;
    const win = window.open("", "_blank", "width=1200,height=800");
    if (!win) return;
    win.document.open();
    win.document.write(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>` +
        `<style>${css}` +
        `@page{size:landscape;margin:12mm}` +
        `body{margin:0;background:#0c0c18;-webkit-print-color-adjust:exact;print-color-adjust:exact}` +
        `*{backdrop-filter:none!important}` +
        `</style></head><body>${html}</body></html>`,
    );
    win.document.close();
    // Give the browser a tick to lay out before printing
    win.onload = () => { win.focus(); win.print(); };
    setTimeout(() => { try { win.focus(); win.print(); } catch { /* noop */ } }, 400);
};
