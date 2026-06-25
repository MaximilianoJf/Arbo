import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Person, Magnifier, LayoutHeaderCells, ArrowRight, Link, Copy, ArrowUpRightFromSquare, Check as CheckIcon } from "@gravity-ui/icons";
import { formApi, projectApi } from "@/services/api";
import { FieldAnswer, getOrderedAnswers, type ChainResponse, type RespField } from "./answer-render";

interface ChainData {
    forms: Record<string, { id: number; title: string; fields: RespField[] }>;
    parents: Record<string, { id: number; formId: number; respondentName: string | null; respondentEmail: string | null; createdAt: string }>;
    tree: ChainResponse[];
}

interface FormLite { id: number; title: string }

const fmtDate = (iso: string) =>
    `${new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })} ${new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;

const respondentLabel = (r: ChainResponse, t: (k: string) => string) =>
    r.respondentName || r.respondentEmail || t("responses.anonymous");

// Total descendants under a node (for the "N relacionadas" badge)
const countDescendants = (node: ChainResponse): number =>
    (node.children || []).reduce((acc, c) => acc + 1 + countDescendants(c), 0);

// ── Form-level chain: the related forms, navigable to review each one ──
const FormChainNode = ({
    formId, currentFormId, formsById, childrenOf, depth, onOpen,
}: {
    formId: number;
    currentFormId: number;
    formsById: Map<number, FormLite>;
    childrenOf: Map<number, number[]>;
    depth: number;
    onOpen: (id: number) => void;
}) => {
    const f = formsById.get(formId);
    const kids = childrenOf.get(formId) || [];
    const isCurrent = formId === currentFormId;
    return (
        <div>
            <div className="flex items-center gap-2">
                {depth > 0 && <ArrowRight className="size-3.5 arbo-text-muted shrink-0" />}
                <button
                    onClick={() => !isCurrent && onOpen(formId)}
                    disabled={isCurrent}
                    className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                        isCurrent
                            ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)] border-[var(--arbo-accent)] cursor-default"
                            : "bg-[var(--arbo-surface-2)] arbo-text border-[var(--arbo-border)] hover:border-[var(--arbo-accent)]/50 hover:text-[var(--arbo-accent)]"
                    }`}
                    title={isCurrent ? "Formulario actual" : "Ver respuestas de este formulario"}
                >
                    {f?.title || `#${formId}`}
                </button>
            </div>
            {kids.length > 0 && (
                <div className="ml-3 mt-1.5 pl-3 border-l border-dashed border-[var(--arbo-border)] flex flex-col gap-1.5">
                    {kids.map((k) => (
                        <FormChainNode
                            key={k}
                            formId={k}
                            currentFormId={currentFormId}
                            formsById={formsById}
                            childrenOf={childrenOf}
                            depth={depth + 1}
                            onOpen={onOpen}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ── A single response node in the tree (recursive) ──
const ResponseNode = ({ node, data, t, depth }: { node: ChainResponse; data: ChainData; t: (k: string) => string; depth: number }) => {
    const [open, setOpen] = useState(depth < 1);
    const [showAnswers, setShowAnswers] = useState(false);
    const [linkMenu, setLinkMenu] = useState<{ formId: number; title: string; url: string }[] | null>(null);
    const [linkBusy, setLinkBusy] = useState(false);
    const [copied, setCopied] = useState<number | null>(null);

    // Build a full shareable URL for a child form, chained to THIS response/session.
    const absoluteUrl = (relative: string) => `${window.location.origin}${relative}`;

    const copyChildLink = async (url: string, formId: number) => {
        try {
            await navigator.clipboard.writeText(absoluteUrl(url));
            setCopied(formId);
            setTimeout(() => setCopied(null), 1800);
        } catch {
            // Clipboard blocked — surface the link so it can be copied manually.
            window.prompt("Copiá el link de esta respuesta:", absoluteUrl(url));
        }
    };

    // Open the related child in a new tab to respond it right away, chained to this response.
    const openChildLink = (url: string) => window.open(absoluteUrl(url), "_blank");

    // Toggle the dropdown of related forms. Always opens the menu (even with a single
    // option) so the user can choose between "Ir" and "Copiar link" per relation.
    const handleRelateClick = async () => {
        if (linkMenu) { setLinkMenu(null); return; }
        if (node.formId == null) return;
        setLinkBusy(true);
        try {
            const res = await formApi.getChildLinks(node.formId, node.id);
            const links = (res.data || []).map((l) => ({ formId: l.formId, title: l.title, url: l.url }));
            setLinkMenu(links);
        } catch (e: any) {
            window.alert(e?.message || "No se pudo obtener el link.");
        } finally {
            setLinkBusy(false);
        }
    };
    const form = node.formId != null ? data.forms[node.formId] : undefined;
    const childCount = node.children?.length || 0;
    const descendants = countDescendants(node);
    const answers = form ? getOrderedAnswers(node.answers, form.fields) : [];
    const filledAnswers = answers.filter((a) => a.value !== null && a.value !== undefined && a.value !== "");

    return (
        <div className="relative">
            <div className="rounded-xl border border-[var(--arbo-border)] bg-[var(--arbo-surface)]">
                {/* Header row */}
                <div className="flex items-center gap-3 px-3 py-2.5">
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="shrink-0 arbo-text-muted hover:arbo-text transition-colors"
                        aria-label={open ? "Colapsar" : "Expandir"}
                    >
                        {childCount > 0
                            ? (open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />)
                            : <span className="inline-block size-4" />}
                    </button>

                    <div className="flex items-center justify-center size-8 rounded-full bg-[var(--arbo-accent-muted)] shrink-0">
                        <Person className="size-4 text-[var(--arbo-accent)]" />
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium arbo-text truncate">{respondentLabel(node, t)}</span>
                            {form && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--arbo-surface-2)] arbo-text-muted shrink-0">
                                    {form.title}
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] arbo-text-muted truncate">
                            {node.respondentEmail || t("responses.noEmail")} · {fmtDate(node.createdAt)}
                        </span>
                    </div>

                    {descendants > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--arbo-accent-subtle)] text-[var(--arbo-accent)] shrink-0">
                            {descendants} {descendants === 1 ? "relacionada" : "relacionadas"}
                        </span>
                    )}

                    <button
                        onClick={() => setShowAnswers((v) => !v)}
                        className="text-[10px] arbo-text-muted hover:arbo-text border border-[var(--arbo-border)] rounded-md px-2 py-1 shrink-0 transition-colors"
                    >
                        {showAnswers ? "Ocultar" : "Ver respuestas"}
                    </button>

                    <div className="relative shrink-0">
                        <button
                            onClick={handleRelateClick}
                            disabled={linkBusy}
                            title="Responder un formulario relacionado, encadenado a esta respuesta"
                            className="flex items-center gap-1 text-[10px] text-[var(--arbo-accent)] hover:bg-[var(--arbo-accent-muted)] border border-[var(--arbo-accent)]/40 rounded-md px-2 py-1 transition-colors disabled:opacity-50"
                        >
                            <Link className="size-3" />
                            Relacionar
                            <ChevronDown className={`size-3 transition-transform ${linkMenu != null ? "rotate-180" : ""}`} />
                        </button>
                        {linkMenu != null && (
                            <div className="absolute right-0 top-full mt-1 z-20 w-72 rounded-lg border border-[var(--arbo-border)] bg-[var(--arbo-surface)] shadow-lg p-1">
                                {linkMenu.length === 0 ? (
                                    <p className="text-[10px] arbo-text-muted px-2 py-2">Este formulario no tiene formularios relacionados para encadenar.</p>
                                ) : (
                                    <>
                                        <p className="text-[10px] arbo-text-muted px-2 pt-1.5 pb-1 uppercase tracking-wider font-semibold">Continuar en</p>
                                        {linkMenu.map((l) => (
                                            <div
                                                key={l.formId}
                                                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[var(--arbo-surface-2)] transition-colors"
                                            >
                                                <span className="truncate flex-1 text-[11px] arbo-text">{l.title}</span>
                                                <button
                                                    onClick={() => openChildLink(l.url)}
                                                    title="Abrir para responder ahora"
                                                    className="flex items-center gap-1 text-[10px] text-[var(--arbo-accent)] hover:bg-[var(--arbo-accent-muted)] border border-[var(--arbo-accent)]/40 rounded px-1.5 py-0.5 transition-colors shrink-0"
                                                >
                                                    <ArrowUpRightFromSquare className="size-3" /> Ir
                                                </button>
                                                <button
                                                    onClick={() => copyChildLink(l.url, l.formId)}
                                                    title="Copiar link"
                                                    className="flex items-center gap-1 text-[10px] arbo-text-muted hover:arbo-text border border-[var(--arbo-border)] rounded px-1.5 py-0.5 transition-colors shrink-0"
                                                >
                                                    {copied === l.formId ? <CheckIcon className="size-3 text-[var(--arbo-accent)]" /> : <Copy className="size-3" />}
                                                    {copied === l.formId ? "Copiado" : "Copiar"}
                                                </button>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Answers */}
                {showAnswers && (
                    <div className="px-3 pb-3 pt-1 border-t border-[var(--arbo-border)]">
                        {filledAnswers.length === 0 ? (
                            <p className="text-xs arbo-text-muted py-2">{t("responses.noRecordedResponses")}</p>
                        ) : (
                            <div className="flex flex-col gap-3 pt-2">
                                {filledAnswers.map(({ key, field, value }) =>
                                    field ? (
                                        <FieldAnswer key={key} field={field} value={value} t={t} />
                                    ) : (
                                        <div key={key}>
                                            <label className="text-xs font-medium arbo-text-secondary block mb-1.5">{key}</label>
                                            <div className="w-full px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] text-sm arbo-text">{String(value)}</div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Children — indented with a guide line */}
            {open && childCount > 0 && (
                <div className="ml-5 mt-2 pl-4 border-l border-dashed border-[var(--arbo-border)] flex flex-col gap-2">
                    {node.children!.map((c) => (
                        <ResponseNode key={c.id} node={c} data={data} t={t} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Tab: nested forms + their responses, grouped by user/relation ──
export const ChainTab = ({ formId, projectId, t }: { formId: number; projectId: number | null; t: (k: string) => string }) => {
    const navigate = useNavigate();
    const [data, setData] = useState<ChainData | null>(null);
    const [relations, setRelations] = useState<{ parentFormId: number; childFormId: number }[]>([]);
    const [projectForms, setProjectForms] = useState<FormLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        let alive = true;
        setLoading(true);
        Promise.all([
            formApi.getResponseChain(formId),
            projectId ? projectApi.getRelations(projectId).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
            projectId ? projectApi.getById(projectId).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        ])
            .then(([chainRes, relRes, projRes]) => {
                if (!alive) return;
                setData(chainRes.data as ChainData);
                setRelations((relRes.data || []) as any);
                const raw = (projRes.data as any)?.forms || (projRes.data as any)?.userForms || [];
                setProjectForms(raw.map((f: any) => ({ id: f.id, title: f.title })));
            })
            .catch((e: any) => { if (alive) setError(e.message || "Error al cargar la cadena"); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [formId, projectId]);

    // Build the form-level chain (titles from project forms, falling back to the response chain)
    const formChain = useMemo(() => {
        const formsById = new Map<number, FormLite>();
        projectForms.forEach((f) => formsById.set(f.id, f));
        if (data) {
            Object.values(data.forms).forEach((f) => { if (!formsById.has(f.id)) formsById.set(f.id, { id: f.id, title: f.title }); });
        }
        const childrenOf = new Map<number, number[]>();
        const childIds = new Set<number>();
        relations.forEach((r) => {
            // Self-referential: the form is its own child — don't mark it as non-root
            if (r.parentFormId === r.childFormId) return;
            const arr = childrenOf.get(r.parentFormId) || [];
            arr.push(r.childFormId);
            childrenOf.set(r.parentFormId, arr);
            childIds.add(r.childFormId);
        });
        // Roots = forms that are a parent but never a child (self-refs are always roots)
        const roots = [...new Set(relations.map((r) => r.parentFormId))].filter((id) => !childIds.has(id));
        return { formsById, childrenOf, roots };
    }, [relations, projectForms, data]);

    const roots = useMemo(() => {
        const all = data?.tree || [];
        const q = query.trim().toLowerCase();
        if (!q) return all;
        return all.filter((r) =>
            (r.respondentName || "").toLowerCase().includes(q) ||
            (r.respondentEmail || "").toLowerCase().includes(q)
        );
    }, [data, query]);

    if (loading) return <div className="flex items-center justify-center py-16"><div className="arbo-spinner" /></div>;
    if (error) return <p className="text-sm text-[var(--arbo-danger)] p-4">{error}</p>;

    return (
        <div className="flex flex-col gap-4">
            {/* Form chain — review the related forms */}
            {formChain.roots.length > 0 && (
                <div className="arbo-panel p-4">
                    <p className="text-[11px] font-bold arbo-text-muted uppercase tracking-wider mb-3">Formularios de la cadena</p>
                    <div className="flex flex-col gap-2">
                        {formChain.roots.map((rootId) => (
                            <FormChainNode
                                key={rootId}
                                formId={rootId}
                                currentFormId={formId}
                                formsById={formChain.formsById}
                                childrenOf={formChain.childrenOf}
                                depth={0}
                                onOpen={(id) => navigate(`/form-builder/responses/${id}`)}
                            />
                        ))}
                    </div>
                    <p className="text-[11px] arbo-text-muted mt-3">Tocá un formulario para revisar sus respuestas.</p>
                </div>
            )}

            {/* Nested responses */}
            {!data || data.tree.length === 0 ? (
                <div className="arbo-card-static flex flex-col items-center gap-3 p-12 text-center">
                    <LayoutHeaderCells className="size-8 arbo-text-muted" />
                    <p className="text-sm arbo-text-muted">Todavía no hay respuestas para mostrar anidadas.</p>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] max-w-sm">
                        <Magnifier className="size-4 arbo-text-muted shrink-0" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por nombre o email…"
                            className="flex-1 bg-transparent text-sm arbo-text placeholder:arbo-text-muted focus:outline-none min-w-0"
                        />
                    </div>

                    <p className="text-xs arbo-text-muted -mt-1">
                        Cada respuesta de este formulario con sus respuestas relacionadas anidadas debajo. Expandí para recorrer la cadena por usuario.
                    </p>

                    <div className="flex flex-col gap-3">
                        {roots.length === 0 ? (
                            <p className="text-sm arbo-text-muted py-6 text-center">Sin resultados para “{query}”.</p>
                        ) : (
                            roots.map((node) => (
                                <ResponseNode key={node.id} node={node} data={data} t={t} depth={0} />
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
