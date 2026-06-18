import { useEffect, useState, useCallback } from "react";
import { formApi } from "@/services/api";
import { usePortal } from "./PortalContext";
import {
    FileText, ArrowDownToLine, ChevronDown, ChevronUp,
    FileArrowDown, Printer, SealCheck,
} from "@gravity-ui/icons";

interface Response {
    id: number;
    respondentName: string | null;
    respondentEmail: string | null;
    createdAt: string;
    answers: Record<string, any>;
}

interface FormDoc {
    id: number;
    title: string;
    slug: string;
    hasPdfLayout: boolean;
    responses: Response[] | null; // null = not loaded yet
    loading: boolean;
    count: number;
}

const fmtDate = (d: string) =>
    new Date(d).toLocaleString("es-AR", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

const respondentLabel = (r: Response) =>
    r.respondentName || r.respondentEmail || `Respuesta #${r.id}`;

// ── Single form group ────────────────────────────────────────────────────────
const FormDocGroup = ({ doc, onToggle }: { doc: FormDoc; onToggle: () => void }) => {
    const [exportingId, setExportingId] = useState<number | null>(null);
    const [exportingAll, setExportingAll] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const toggle = () => {
        if (!expanded) onToggle(); // triggers load on first open
        setExpanded((v) => !v);
    };

    const downloadOne = async (responseId: number) => {
        setExportingId(responseId);
        try { await formApi.exportResponsePdf(doc.id, responseId); }
        catch { /* silent */ }
        finally { setExportingId(null); }
    };

    const downloadAll = async () => {
        setExportingAll(true);
        try { await formApi.exportPdf(doc.id); }
        catch { /* silent */ }
        finally { setExportingAll(false); }
    };

    return (
        <div className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--arbo-border)", background: "var(--arbo-surface)" }}>

            {/* Header */}
            <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                style={{ background: "var(--arbo-surface-2)" }}
                onClick={toggle}
            >
                <FileText className="size-4 shrink-0" style={{ color: "var(--arbo-accent)" }} />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold" style={{ color: "var(--arbo-text)" }}>
                            {doc.title}
                        </p>
                        {doc.hasPdfLayout && (
                            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{ background: "rgba(74,222,128,0.15)", color: "var(--arbo-accent)" }}>
                                <SealCheck className="size-2.5" /> PDF configurado
                            </span>
                        )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--arbo-text-muted)" }}>
                        {doc.count} documento{doc.count !== 1 ? "s" : ""} emitido{doc.count !== 1 ? "s" : ""}
                    </p>
                </div>

                {/* Bulk download */}
                {doc.count > 0 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); downloadAll(); }}
                        disabled={exportingAll}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                        style={{
                            background: "var(--arbo-surface-3)",
                            color: "var(--arbo-text-secondary)",
                            border: "1px solid var(--arbo-border)",
                        }}
                        title="Descargar todos como PDF"
                    >
                        <FileArrowDown className="size-3.5" />
                        {exportingAll ? "..." : "Todos"}
                    </button>
                )}

                <div style={{ color: "var(--arbo-text-muted)" }}>
                    {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </div>
            </div>

            {/* Response list */}
            {expanded && (
                <div className="divide-y" style={{ borderColor: "var(--arbo-border)" }}>
                    {doc.loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="arbo-spinner" />
                        </div>
                    )}

                    {!doc.loading && doc.responses?.length === 0 && (
                        <p className="text-sm text-center py-8" style={{ color: "var(--arbo-text-muted)" }}>
                            Sin respuestas todavía.
                        </p>
                    )}

                    {!doc.loading && doc.responses?.map((r, idx) => (
                        <div key={r.id}
                            className="flex items-center gap-3 px-4 py-2.5"
                            style={{ borderColor: "var(--arbo-border)" }}
                        >
                            {/* Document icon with index */}
                            <div className="size-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                style={{ background: "var(--arbo-surface-3)", color: "var(--arbo-text-muted)" }}>
                                {String(idx + 1).padStart(2, "0")}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: "var(--arbo-text)" }}>
                                    {respondentLabel(r)}
                                </p>
                                <p className="text-[10px]" style={{ color: "var(--arbo-text-muted)" }}>
                                    {fmtDate(r.createdAt)}
                                    {r.respondentEmail && r.respondentName &&
                                        <span> · {r.respondentEmail}</span>}
                                </p>
                            </div>

                            <button
                                onClick={() => downloadOne(r.id)}
                                disabled={exportingId === r.id}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                                style={{
                                    background: "var(--arbo-accent-subtle)",
                                    color: "var(--arbo-accent)",
                                    border: "1px solid var(--arbo-accent-muted)",
                                }}
                                title="Descargar PDF"
                            >
                                <ArrowDownToLine className="size-3.5" />
                                {exportingId === r.id ? "..." : "PDF"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Main view ────────────────────────────────────────────────────────────────
export const PortalDocs = () => {
    const { project } = usePortal();
    const rawForms: any[] = project?.forms || project?.userForms || project?.UserForms || [];

    const [docs, setDocs] = useState<FormDoc[]>([]);
    const [search, setSearch] = useState("");
    const [totalDocs, setTotalDocs] = useState(0);

    // Initialise with counts
    useEffect(() => {
        const init = async () => {
            const withCounts = await Promise.all(
                rawForms.map(async (f) => {
                    let count = 0;
                    let hasPdfLayout = false;
                    try {
                        const r = await formApi.getResponseCount(f.id);
                        count = r.data.count;
                    } catch { /* silent */ }
                    try {
                        const detail = await formApi.getById(f.id);
                        hasPdfLayout = !!detail.data?.pdfLayout;
                    } catch { /* silent */ }
                    return {
                        id: f.id,
                        title: f.title,
                        slug: f.slug,
                        hasPdfLayout,
                        responses: null,
                        loading: false,
                        count,
                    } as FormDoc;
                })
            );
            setDocs(withCounts);
            setTotalDocs(withCounts.reduce((s, d) => s + d.count, 0));
        };
        if (rawForms.length) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawForms.length]);

    // Lazy-load responses for a form when its accordion opens
    const loadResponses = useCallback(async (formId: number) => {
        setDocs((prev) => prev.map((d) =>
            d.id === formId ? { ...d, loading: true } : d
        ));
        try {
            const res = await formApi.getResponses(formId);
            setDocs((prev) => prev.map((d) =>
                d.id === formId ? { ...d, responses: res.data, loading: false } : d
            ));
        } catch {
            setDocs((prev) => prev.map((d) =>
                d.id === formId ? { ...d, responses: [], loading: false } : d
            ));
        }
    }, []);

    const filtered = docs.filter((d) =>
        d.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-5">
            {/* Summary bar */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5 flex-1">
                    <Printer className="size-4 shrink-0" style={{ color: "var(--arbo-accent)" }} />
                    <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--arbo-text)" }}>
                            Documentación emitida
                        </p>
                        <p className="text-xs" style={{ color: "var(--arbo-text-muted)" }}>
                            {totalDocs} documento{totalDocs !== 1 ? "s" : ""} en {docs.length} formulario{docs.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar formulario..."
                    className="arbo-input text-sm w-56 shrink-0"
                />
            </div>

            {/* Groups */}
            {docs.length === 0 ? (
                <div className="rounded-xl p-16 text-center"
                    style={{ background: "var(--arbo-surface-2)", border: "1px dashed var(--arbo-border)" }}>
                    <p className="text-sm" style={{ color: "var(--arbo-text-muted)" }}>
                        No hay formularios en este proyecto.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtered.map((doc) => (
                        <FormDocGroup
                            key={doc.id}
                            doc={doc}
                            onToggle={() => {
                                if (doc.responses === null) loadResponses(doc.id);
                            }}
                        />
                    ))}
                    {filtered.length === 0 && search && (
                        <p className="text-sm text-center py-8" style={{ color: "var(--arbo-text-muted)" }}>
                            Sin coincidencias para "{search}".
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
