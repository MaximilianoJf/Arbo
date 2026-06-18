import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getCardMaxWidth } from "../../../utils/style-helpers";
import { useEditorContext } from "../EditorContext";

export const EmbedTab = () => {
    const { t } = useTranslation();
    const { schema, styles, updateStyles } = useEditorContext();

    return (
        <div className="flex flex-col gap-4">
            <p className="text-[10px] arbo-text-muted">{t("editor.embedTab.subtitle")}</p>

            {/* Embed contact toggle */}
            <div>
                <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-2">{t("editor.embedTab.contactInEmbed")}</label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                    <span className="text-xs arbo-text">{t("editor.embedTab.showContact")}</span>
                    <button onClick={() => updateStyles({ embedContactEnabled: !(styles.embedContactEnabled ?? false) })}
                        className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${(styles.embedContactEnabled ?? false) ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}>
                        <div className={`size-4 rounded-full bg-white transition-transform ${(styles.embedContactEnabled ?? false) ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                </div>
            </div>

            {(styles.embedContactEnabled ?? false) && (
                <div>
                    <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1.5">{t("editor.embedTab.contactPosition")}</label>
                    <div className="grid grid-cols-2 gap-1">
                        {(["left", "right"] as const).map((pos) => (
                            <button key={pos} onClick={() => updateStyles({ embedContactPosition: pos })}
                                className={`px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors ${(styles.embedContactPosition || "left") === pos ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]" : "bg-[var(--arbo-surface-2)] arbo-text-muted border border-[var(--arbo-border)]"}`}>
                                {pos === "left" ? t("editor.embedTab.left") : t("editor.embedTab.right")}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Transparent BG */}
            <div>
                <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-2">{t("editor.embedTab.transparentBg")}</label>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                    <span className="text-xs arbo-text">{t("editor.embedTab.noBg")}</span>
                    <button onClick={() => updateStyles({ embedBgTransparent: !(styles.embedBgTransparent ?? false) })}
                        className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${(styles.embedBgTransparent ?? false) ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-border)]"}`}>
                        <div className={`size-4 rounded-full bg-white transition-transform ${(styles.embedBgTransparent ?? false) ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                </div>
            </div>

            <div className="border-t border-[var(--arbo-border)]" />

            {/* Embed code */}
            <div>
                <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1.5">{t("editor.embedTab.embedCode")}</label>
                {schema.slug ? (
                    <EmbedCodeBlock schema={schema} styles={styles} />
                ) : (
                    <p className="text-[10px] arbo-text-muted">{t("editor.embedTab.saveFirst")}</p>
                )}
            </div>

            <div className="border-t border-[var(--arbo-border)]" />

            {/* Export HTML */}
            <div>
                <label className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider block mb-1.5">{t("editor.embedTab.exportHtml")}</label>
                <p className="text-[9px] arbo-text-muted mb-2">{t("editor.embedTab.exportHtmlDesc")}</p>
                {schema.slug ? (
                    <ExportHtmlButton schema={schema} styles={styles} />
                ) : (
                    <p className="text-[10px] arbo-text-muted">{t("editor.embedTab.saveFirst")}</p>
                )}
            </div>
        </div>
    );
};

// --- Helpers shared by code block & export ---
const buildIframeUrl = (schema: any, styles: any) => {
    const contactParam = (styles.embedContactEnabled ?? false) ? "?contact=1" : "";
    return `${window.location.origin}/embed/${schema.slug}${contactParam}`;
};

const buildIframeTag = (schema: any, styles: any) => {
    const src = buildIframeUrl(schema, styles);
    const radius = styles.borderRadius ?? 14;
    const maxWidth = getCardMaxWidth(styles);
    return `<iframe src="${src}" width="100%" height="600" frameborder="0" style="border:none; border-radius:${radius}px; max-width:${maxWidth};"></iframe>`;
};

// --- Embed code block with copy button ---
const EmbedCodeBlock = ({ schema, styles }: { schema: any; styles: any }) => {
    const { t } = useTranslation();
    const code = buildIframeTag(schema, styles);

    return (
        <div className="relative">
            <pre className="p-3 rounded-lg bg-[var(--arbo-bg)] border border-[var(--arbo-border)] text-[9px] arbo-text-muted font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {code}
            </pre>
            <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="absolute top-1.5 right-1.5 arbo-btn arbo-btn-secondary text-[9px] py-1 px-2"
            >{t("common.copy")}</button>
        </div>
    );
};

// --- Export as standalone HTML file ---
const ExportHtmlButton = ({ schema, styles }: { schema: any; styles: any }) => {
    const { t } = useTranslation();

    const handleExport = useCallback(() => {
        const title = schema.title || "Form";
        const accentColor = styles.accentColor || "#4ADE80";

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
        body {
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0f0f17;
            color: #e2e2e8;
        }
        iframe {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
        .footer {
            position: fixed;
            bottom: 0.5rem;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 0.65rem;
            color: #555;
            pointer-events: none;
            z-index: 10;
        }
        .footer a { color: ${escapeHtml(accentColor)}; text-decoration: none; pointer-events: auto; }
        .footer a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <iframe src="${escapeHtml(buildIframeUrl(schema, styles))}" allowtransparency="true"></iframe>
    <p class="footer">Powered by <a href="${window.location.origin}" target="_blank" rel="noopener">Arbo Forms</a></p>
</body>
</html>`;

        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(schema.slug || "form")}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [schema, styles]);

    return (
        <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text hover:border-[var(--arbo-accent)]/50 hover:text-[var(--arbo-accent)]"
        >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t("editor.embedTab.downloadHtml")}
        </button>
    );
};

/** Escapes HTML special characters to prevent injection in the exported file. */
const escapeHtml = (str: string): string =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
