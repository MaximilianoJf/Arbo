import { useEffect, useState, useCallback } from "react";
import { formApi } from "@/services/api";
import { usePortal } from "./PortalContext";
import { TrashBin, ArrowDownToLine, ChevronDown, ChevronUp, FileText } from "@gravity-ui/icons";

interface FormResponse {
    id: number;
    answers: Record<string, any>;
    respondentName: string | null;
    respondentEmail: string | null;
    createdAt: string;
}

const fmtDate = (d: string) => new Date(d).toLocaleString("es-AR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
});

const ResponseRow = ({ resp, fields, formId, onDeleted }: {
    resp: FormResponse;
    fields: { name: string; label: string }[];
    formId: number;
    onDeleted: () => void;
}) => {
    const [open, setOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleDelete = async () => {
        if (!confirm("¿Eliminar esta respuesta?")) return;
        setDeleting(true);
        try { await formApi.deleteResponse(formId, resp.id); onDeleted(); } catch { /* silent */ } finally { setDeleting(false); }
    };

    const handleExportPdf = async () => {
        setExporting(true);
        try { await formApi.exportResponsePdf(formId, resp.id); } catch { /* silent */ } finally { setExporting(false); }
    };

    return (
        <div className="arbo-glass rounded-2xl overflow-hidden">
            {/* Header row */}
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "var(--arbo-surface-3)", color: "var(--arbo-text-secondary)" }}>
                    {(resp.respondentName || resp.respondentEmail || "?")?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--arbo-text)" }}>
                        {resp.respondentName || resp.respondentEmail || "Anónimo"}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--arbo-text-muted)" }}>{fmtDate(resp.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={handleExportPdf} disabled={exporting}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--arbo-surface-2)] disabled:opacity-50"
                        style={{ color: "var(--arbo-text-muted)" }} title="Exportar PDF">
                        <FileText className="size-3.5" />
                    </button>
                    <button onClick={handleDelete} disabled={deleting}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--arbo-danger-muted)] disabled:opacity-50"
                        style={{ color: "var(--arbo-text-muted)" }} title="Eliminar">
                        <TrashBin className="size-3.5" />
                    </button>
                    <button onClick={() => setOpen((v) => !v)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--arbo-surface-2)]"
                        style={{ color: "var(--arbo-text-muted)" }}>
                        {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    </button>
                </div>
            </div>
            {/* Expanded answers */}
            {open && (
                <div className="px-4 pb-3 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <div className="grid gap-2 pt-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                        {fields.filter((f) => resp.answers[f.name] != null).map((f) => (
                            <div key={f.name} className="rounded-lg px-3 py-2" style={{ background: "var(--arbo-surface-2)" }}>
                                <p className="text-[10px] font-medium mb-0.5" style={{ color: "var(--arbo-text-muted)" }}>{f.label || f.name}</p>
                                <p className="text-xs truncate" style={{ color: "var(--arbo-text)" }}>
                                    {String(resp.answers[f.name] ?? "—")}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const PortalResponses = () => {
    const { project } = usePortal();
    const forms: any[] = project?.forms || project?.userForms || project?.UserForms || [];
    const [selectedFormId, setSelectedFormId] = useState<number | null>(forms[0]?.id ?? null);
    const [responses, setResponses] = useState<FormResponse[]>([]);
    const [formDetail, setFormDetail] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        if (!selectedFormId) return;
        setLoading(true);
        try {
            const [rRes, fRes] = await Promise.all([
                formApi.getResponses(selectedFormId),
                formApi.getById(selectedFormId),
            ]);
            setResponses(rRes.data);
            setFormDetail(fRes.data);
        } catch { /* silent */ } finally { setLoading(false); }
    }, [selectedFormId]);

    useEffect(() => { load(); }, [load]);

    const fields: { name: string; label: string }[] = (formDetail?.FormFields || formDetail?.fields || [])
        .filter((f: any) => !f.name?.startsWith("__page_break_"))
        .map((f: any) => ({ name: f.name, label: f.label || f.name }));

    const handleExportExcel = () => selectedFormId && formApi.exportExcel(selectedFormId);
    const handleExportPdf = () => selectedFormId && formApi.exportPdf(selectedFormId);

    return (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                <select
                    value={selectedFormId ?? ""}
                    onChange={(e) => setSelectedFormId(Number(e.target.value))}
                    className="arbo-input text-sm flex-1 min-w-48"
                >
                    {forms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
                <div className="flex gap-2 shrink-0">
                    <button onClick={handleExportExcel}
                        className="arbo-btn arbo-btn-ghost text-xs gap-1.5"
                        disabled={!selectedFormId}>
                        <ArrowDownToLine className="size-3.5" /> Excel
                    </button>
                    <button onClick={handleExportPdf}
                        className="arbo-btn arbo-btn-ghost text-xs gap-1.5"
                        disabled={!selectedFormId}>
                        <ArrowDownToLine className="size-3.5" /> PDF masivo
                    </button>
                </div>
            </div>

            {/* Count */}
            {!loading && (
                <p className="text-xs" style={{ color: "var(--arbo-text-muted)" }}>
                    {responses.length} respuesta{responses.length !== 1 ? "s" : ""}
                    {formDetail?.title ? ` en "${formDetail.title}"` : ""}
                </p>
            )}

            {/* Responses */}
            {loading ? (
                <div className="flex items-center justify-center py-16"><div className="arbo-spinner" /></div>
            ) : responses.length === 0 ? (
                <div className="rounded-xl p-16 text-center" style={{ background: "var(--arbo-surface-2)", border: "1px dashed var(--arbo-border)" }}>
                    <p className="text-sm" style={{ color: "var(--arbo-text-muted)" }}>Sin respuestas todavía.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {responses.map((r) => (
                        <ResponseRow key={r.id} resp={r} fields={fields} formId={selectedFormId!} onDeleted={load} />
                    ))}
                </div>
            )}
        </div>
    );
};
