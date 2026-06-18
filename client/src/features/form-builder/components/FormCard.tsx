import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, TrashBin, Eye, Copy, Check, LayoutList, Archive, ArrowUturnCcwLeft, Code, FolderArrowRight } from "@gravity-ui/icons";
import { useNavigate } from "react-router-dom";
import { formApi, projectApi } from "@/services/api";

interface FormCardProps {
    form: {
        id: number;
        title: string;
        description?: string;
        slug: string;
        isPublished: boolean;
        isArchived?: boolean;
        deletedAt?: string | null;
        fields: any[];
        createdAt: string;
        projectId?: number | null;
        project?: { id: number; name: string; color: string } | null;
        user?: { name?: string; email?: string };
    };
    onAction: (id: number) => void;
    variant?: "active" | "archived" | "trash" | "shared";
}

/** Mini dropdown to move a form into a project */
const MoveToProjectDropdown = ({ formId, currentProjectId, onMoved }: {
    formId: number;
    currentProjectId: number | null | undefined;
    onMoved: () => void;
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        projectApi.getAll().then((res) => {
            setProjects(res.data.owned || []);
        }).catch(() => {});
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const handleAssign = async (projectId: number | null) => {
        try {
            await projectApi.assignForm(formId, projectId);
            onMoved();
        } catch { /* silent */ }
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="arbo-btn arbo-btn-ghost text-xs px-2 py-1.5"
                title={t("formCard.moveToProject")}
            >
                <FolderArrowRight className="size-3.5" />
            </button>
            {open && (
                <div className="absolute bottom-full right-0 mb-1 w-48 bg-[var(--arbo-surface)] border border-[var(--arbo-border)] rounded-lg shadow-xl z-30 py-1 max-h-52 overflow-y-auto animate-[fadeInUp_0.15s_ease-out]">
                    {currentProjectId && (
                        <button
                            onClick={() => handleAssign(null)}
                            className="w-full text-left px-3 py-2 text-xs arbo-text-muted hover:bg-[var(--arbo-surface-2)] transition-colors"
                        >
                            {t("formCard.noProject")}
                        </button>
                    )}
                    {projects.length === 0 ? (
                        <p className="px-3 py-2 text-xs arbo-text-muted">{t("formCard.noProjects")}</p>
                    ) : (
                        projects
                            .filter((p) => p.id !== currentProjectId)
                            .map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => handleAssign(p.id)}
                                    className="w-full text-left px-3 py-2 text-xs arbo-text hover:bg-[var(--arbo-surface-2)] transition-colors flex items-center gap-2"
                                >
                                    <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: p.color || "#4ADE80" }} />
                                    <span className="truncate">{p.name}</span>
                                </button>
                            ))
                    )}
                </div>
            )}
        </div>
    );
};

export const FormCard = ({ form, onAction, variant = "active" }: FormCardProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showEmbed, setShowEmbed] = useState(false);
    const [embedCopied, setEmbedCopied] = useState(false);
    const [embedContact, setEmbedContact] = useState(false);

    const handleAction = async (action: () => Promise<any>) => {
        setLoading(true);
        try {
            await action();
            onAction(form.id);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        const url = `${window.location.origin}/forms/${form.slug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const embedSrc = `${window.location.origin}/embed/${form.slug}${embedContact ? "?contact=1" : ""}`;
    const embedCode = `<iframe
  src="${embedSrc}"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; border-radius: 12px; max-width: 700px;"
  allow="clipboard-write"
></iframe>
<script>
  window.addEventListener("message", function(e) {
    if (e.data && e.data.type === "arbo-embed-resize") {
      var frames = document.querySelectorAll('iframe[src*="/embed/${form.slug}"]');
      frames.forEach(function(f) { f.style.height = e.data.height + "px"; });
    }
  });
</script>`;

    const copyEmbed = () => {
        navigator.clipboard.writeText(embedCode);
        setEmbedCopied(true);
        setTimeout(() => setEmbedCopied(false), 2000);
    };

    const styles = (form as any).styles || {};
    const accent = styles.gradient || styles.accentColor || (
        variant === "trash" ? "var(--arbo-danger)" :
        variant === "archived" ? "var(--arbo-warning)" :
        variant === "shared" ? "var(--arbo-info)" :
        "var(--arbo-accent)"
    );
    const cardBg = styles.bgColor || "#1a1a24";
    const fieldCount = form.fields?.length || 0;

    return (
        <div className={`arbo-card flex flex-col overflow-hidden ${loading ? "opacity-60 pointer-events-none" : ""}`}>
            {/* Mini preview thumbnail */}
            <div
                className="w-full aspect-[16/9] p-2.5 flex flex-col items-center justify-center gap-1 relative overflow-hidden cursor-pointer group"
                style={{ background: styles.pageBgColor || "var(--arbo-bg)" }}
                onClick={() => navigate(`/forms/${form.slug}`)}
            >
                {/* Tiny card representation */}
                <div className="w-[75%] rounded overflow-hidden shadow-sm"
                    style={{ background: cardBg, border: `1px solid ${styles.borderColor || "rgba(255,255,255,0.08)"}`, borderRadius: `${Math.min(styles.borderRadius ?? 14, 6)}px` }}>
                    <div className="h-0.5" style={{ background: accent }} />
                    <div className="px-1.5 py-1 flex flex-col gap-px">
                        <div className="h-0.5 w-[60%] rounded-full bg-white/20" />
                        <div className="h-px w-[40%] rounded-full bg-white/10" />
                    </div>
                </div>
                <div className="w-[75%] rounded p-1.5 flex flex-col gap-0.5"
                    style={{ background: cardBg, border: `1px solid ${styles.borderColor || "rgba(255,255,255,0.08)"}`, borderRadius: `${Math.min(styles.borderRadius ?? 14, 6)}px` }}>
                    {[...Array(Math.min(fieldCount || 2, 3))].map((_, i) => (
                        <div key={i} className="flex flex-col gap-px">
                            <div className="h-px w-[35%] rounded-full bg-white/15" />
                            <div className="h-1.5 w-full rounded-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
                        </div>
                    ))}
                    <div className="flex justify-end mt-px">
                        <div className="h-1 w-5 rounded-sm" style={{ background: accent }} />
                    </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-sm">
                        <Eye className="size-3 text-white" />
                        <span className="text-[10px] text-white font-medium">{t("common.preview")}</span>
                    </div>
                </div>

                {/* Status badge overlay */}
                <span className={`absolute top-1.5 right-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded-md ${
                    variant === "trash" ? "bg-[var(--arbo-danger)]/80 text-white" :
                    variant === "archived" ? "bg-[var(--arbo-warning)]/80 text-white" :
                    form.isPublished ? "bg-[var(--arbo-accent)]/80 text-white" : "bg-[var(--arbo-surface-3)]/80 arbo-text-muted"
                }`}>
                    {variant === "trash" ? t("formCard.trash") :
                     variant === "archived" ? t("formCard.archived") :
                     form.isPublished ? t("formCard.published") : t("formCard.draft")}
                </span>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1.5 px-3 py-2.5 flex-1 border-t border-[var(--arbo-border)]">
                <h3 className="text-xs font-semibold arbo-text truncate">{form.title}</h3>

                <div className="flex items-center gap-1.5 text-[10px] arbo-text-muted">
                    {form.project && (
                        <>
                            <span
                                className="inline-flex items-center px-1 py-px rounded text-[9px] font-medium text-white"
                                style={{ backgroundColor: form.project.color || "#4ADE80" }}
                            >
                                {form.project.name}
                            </span>
                            <span className="text-[var(--arbo-border-light)]">&bull;</span>
                        </>
                    )}
                    <span>{fieldCount} {t("common.fields")}</span>
                    <span className="text-[var(--arbo-border-light)]">&bull;</span>
                    <span>{new Date(form.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-1 px-3 py-2.5 border-t border-[var(--arbo-border)]">
                {variant === "active" && (
                    <>
                        <button onClick={() => navigate(`/form-builder/edit/${form.id}`)} className="arbo-btn arbo-btn-ghost text-xs px-2.5 py-1.5">
                            <Pencil className="size-3.5" /> {t("common.edit")}
                        </button>
                        <button onClick={() => navigate(`/forms/${form.slug}`)} className="arbo-btn arbo-btn-ghost text-xs px-2.5 py-1.5">
                            <Eye className="size-3.5" /> {t("common.preview")}
                        </button>
                        <button onClick={() => navigate(`/form-builder/responses/${form.id}`)} className="arbo-btn arbo-btn-ghost text-xs px-2.5 py-1.5">
                            <LayoutList className="size-3.5" /> {t("formCard.responses")}
                        </button>
                        <button onClick={copyLink} className={`arbo-btn text-xs px-2.5 py-1.5 ${copied ? "text-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)]" : "arbo-btn-ghost"}`}>
                            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                            {copied ? t("common.copied") : t("formCard.link")}
                        </button>
                        <button onClick={() => setShowEmbed(true)} className="arbo-btn arbo-btn-ghost text-xs px-2.5 py-1.5">
                            <Code className="size-3.5" /> {t("formCard.embed")}
                        </button>
                        <div className="flex-1" />
                        <MoveToProjectDropdown
                            formId={form.id}
                            currentProjectId={form.projectId ?? form.project?.id}
                            onMoved={() => onAction(form.id)}
                        />
                        <button onClick={() => handleAction(() => formApi.archive(form.id))}
                            className="arbo-btn arbo-btn-ghost text-xs px-2 py-1.5 arbo-text-muted hover:text-[var(--arbo-warning)]" title="Archive">
                            <Archive className="size-3.5" />
                        </button>
                        <button onClick={() => handleAction(() => formApi.delete(form.id))}
                            className="arbo-btn arbo-btn-ghost text-xs px-2 py-1.5 text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)]" title="Move to trash">
                            <TrashBin className="size-3.5" />
                        </button>
                    </>
                )}

                {variant === "shared" && (
                    <>
                        <button onClick={() => navigate(`/form-builder/edit/${form.id}`)} className="arbo-btn arbo-btn-ghost text-xs px-2.5 py-1.5">
                            <Pencil className="size-3.5" /> {t("common.edit")}
                        </button>
                        <button onClick={() => navigate(`/forms/${form.slug}`)} className="arbo-btn arbo-btn-ghost text-xs px-2.5 py-1.5">
                            <Eye className="size-3.5" /> {t("common.preview")}
                        </button>
                        <button onClick={() => navigate(`/form-builder/responses/${form.id}`)} className="arbo-btn arbo-btn-ghost text-xs px-2.5 py-1.5">
                            <LayoutList className="size-3.5" /> {t("formCard.responses")}
                        </button>
                    </>
                )}

                {variant === "archived" && (
                    <>
                        <button onClick={() => handleAction(() => formApi.unarchive(form.id))}
                            className="arbo-btn arbo-btn-ghost text-xs px-2.5 py-1.5">
                            <ArrowUturnCcwLeft className="size-3.5" /> {t("common.restore")}
                        </button>
                        <button onClick={() => navigate(`/forms/${form.slug}`)} className="arbo-btn arbo-btn-ghost text-xs px-2.5 py-1.5">
                            <Eye className="size-3.5" /> {t("common.preview")}
                        </button>
                        <div className="flex-1" />
                        <button onClick={() => handleAction(() => formApi.delete(form.id))}
                            className="arbo-btn arbo-btn-ghost text-xs px-2 py-1.5 text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)]" title="Move to trash">
                            <TrashBin className="size-3.5" />
                        </button>
                    </>
                )}

                {variant === "trash" && (
                    <>
                        <button onClick={() => handleAction(() => formApi.restore(form.id))}
                            className="arbo-btn arbo-btn-ghost text-xs px-2.5 py-1.5">
                            <ArrowUturnCcwLeft className="size-3.5" /> {t("common.restore")}
                        </button>
                        <div className="flex-1" />
                        <button onClick={() => handleAction(() => formApi.permanentDelete(form.id))}
                            className="arbo-btn arbo-btn-ghost text-xs px-2.5 py-1.5 text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)]">
                            <TrashBin className="size-3.5" /> {t("formCard.deleteForever")}
                        </button>
                    </>
                )}
            </div>

            {/* Embed Modal */}
            {showEmbed && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowEmbed(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div
                        className="relative arbo-panel p-6 w-full max-w-lg animate-[fadeInUp_0.2s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Code className="size-4 text-[var(--arbo-accent)]" />
                                <h3 className="text-sm font-semibold arbo-text">{t("formCard.embedCode")}</h3>
                            </div>
                            <button onClick={() => setShowEmbed(false)} className="arbo-btn-ghost p-1 rounded-md text-[var(--arbo-text-muted)] hover:text-[var(--arbo-text)]">
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-xs arbo-text-muted mb-4">
                            {t("formCard.embedSnippet")}
                        </p>

                        {/* Contact toggle */}
                        <label className="flex items-center gap-3 mb-4 cursor-pointer select-none group">
                            <div
                                className={`relative w-9 h-5 rounded-full transition-colors ${
                                    embedContact ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-surface-3)]"
                                }`}
                                onClick={() => setEmbedContact(!embedContact)}
                            >
                                <div
                                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                        embedContact ? "translate-x-4" : "translate-x-0.5"
                                    }`}
                                />
                            </div>
                            <span className="text-xs arbo-text-secondary group-hover:arbo-text transition-colors">
                                {t("formCard.includeContact")}
                            </span>
                        </label>

                        <div className="relative">
                            <pre className="bg-[var(--arbo-bg)] border border-[var(--arbo-border)] rounded-lg p-4 text-xs arbo-text-secondary overflow-x-auto whitespace-pre-wrap break-all max-h-52 font-mono">
                                {embedCode}
                            </pre>
                            <button
                                onClick={copyEmbed}
                                className={`absolute top-2 right-2 arbo-btn text-xs px-3 py-1.5 rounded-md transition-all ${
                                    embedCopied
                                        ? "bg-[var(--arbo-accent)] text-[var(--arbo-bg)]"
                                        : "bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text-secondary hover:border-[var(--arbo-border-light)]"
                                }`}
                            >
                                {embedCopied ? (
                                    <><Check className="size-3" /> {t("common.copied")}</>
                                ) : (
                                    <><Copy className="size-3" /> {t("common.copy")}</>
                                )}
                            </button>
                        </div>

                        <div className="mt-4 p-3 rounded-lg bg-[var(--arbo-accent-subtle)] border border-[var(--arbo-accent)]/10">
                            <p className="text-[11px] arbo-text-secondary leading-relaxed">
                                <span className="font-semibold arbo-text-accent">{t("common.tip")}:</span> {t("formCard.embedTip")}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
