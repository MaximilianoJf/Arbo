import { useEffect, useMemo, useState } from "react";
import { formApi } from "@/services/api";
import { usePortal } from "./PortalContext";
import { ChevronDown, ChevronUp, Magnifier, Persons } from "@gravity-ui/icons";

interface Resp {
    id: number;
    answers: Record<string, any>;
    respondentName: string | null;
    respondentEmail: string | null;
    createdAt: string;
    formId: number;
    formTitle: string;
}

interface Person {
    key: string;
    name: string;
    email: string | null;
    responses: Resp[];
    formIds: Set<number>;
}

const fmtDate = (d: string) => new Date(d).toLocaleString("es-AR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
});

// ─── Respuestas agrupadas por persona (todos los formularios del proyecto) ───
// Agrega las respuestas de cada formulario del proyecto y las agrupa por respondente
// (email, o nombre como respaldo). Permite ver, por persona, TODOS los formularios
// que completó dentro del proyecto. Usa los endpoints existentes (sin backend nuevo).
export const PortalRespondents = () => {
    const { project } = usePortal();
    const forms: any[] = project?.forms || project?.userForms || project?.UserForms || [];
    const formIdsKey = forms.map((f) => f.id).join(",");

    const [all, setAll] = useState<Resp[]>([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [openKey, setOpenKey] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const perForm = await Promise.all(forms.map(async (f) => {
                    try {
                        const r = await formApi.getResponses(f.id);
                        return (r.data || []).map((x: any) => ({ ...x, formId: f.id, formTitle: f.title }));
                    } catch { return []; }
                }));
                if (!cancelled) setAll(perForm.flat());
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formIdsKey]);

    const people = useMemo(() => {
        const map = new Map<string, Person>();
        for (const r of all) {
            const key = (r.respondentEmail || r.respondentName || "anónimo").toLowerCase();
            let p = map.get(key);
            if (!p) {
                p = { key, name: r.respondentName || r.respondentEmail || "Anónimo", email: r.respondentEmail, responses: [], formIds: new Set() };
                map.set(key, p);
            }
            p.responses.push(r);
            p.formIds.add(r.formId);
        }
        let list = Array.from(map.values());
        list.forEach((p) => p.responses.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
        list.sort((a, b) => b.responses.length - a.responses.length);
        if (q.trim()) {
            const s = q.toLowerCase();
            list = list.filter((p) => p.name.toLowerCase().includes(s) || (p.email || "").toLowerCase().includes(s));
        }
        return list;
    }, [all, q]);

    return (
        <div className="flex flex-col gap-5 max-w-3xl">
            {/* Header */}
            <div>
                <h2 className="arbo-font-display text-2xl font-bold arbo-text mb-1">Respuestas por persona</h2>
                <p className="text-sm arbo-text-muted">
                    Quién respondió y qué formularios del proyecto completó cada persona.
                </p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Magnifier className="size-4 absolute left-3 top-1/2 -translate-y-1/2 arbo-text-muted" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por nombre o email..."
                    className="arbo-input w-full text-sm pl-9 rounded-full"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16"><div className="arbo-spinner" /></div>
            ) : people.length === 0 ? (
                <div className="arbo-glass rounded-2xl p-12 text-center">
                    <Persons className="size-8 mx-auto mb-3 arbo-text-muted" />
                    <p className="text-sm arbo-text-muted">Todavía no hay respuestas en este proyecto.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <p className="text-xs arbo-text-muted">{people.length} persona{people.length !== 1 ? "s" : ""}</p>
                    {people.map((p) => {
                        const open = openKey === p.key;
                        return (
                            <div key={p.key} className="arbo-glass arbo-glass-hover rounded-2xl overflow-hidden">
                                {/* Person header */}
                                <button
                                    onClick={() => setOpenKey(open ? null : p.key)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                                >
                                    <div className="size-10 rounded-full bg-[var(--arbo-accent-muted)] border border-[var(--arbo-accent)]/30 flex items-center justify-center shrink-0">
                                        <span className="text-sm font-bold arbo-text-accent">{p.name.trim().charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold arbo-text truncate">{p.name}</p>
                                        {p.email && <p className="text-[11px] arbo-text-muted truncate">{p.email}</p>}
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right">
                                            <p className="text-sm font-bold arbo-text-accent leading-none">{p.responses.length}</p>
                                            <p className="text-[9px] uppercase tracking-wider arbo-text-muted">respuestas</p>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--arbo-accent-muted)] arbo-text-accent border border-[var(--arbo-accent)]/20">
                                            {p.formIds.size} form{p.formIds.size !== 1 ? "s" : ""}
                                        </span>
                                        {open ? <ChevronUp className="size-4 arbo-text-muted" /> : <ChevronDown className="size-4 arbo-text-muted" />}
                                    </div>
                                </button>

                                {/* Expanded: all this person's responses across the project */}
                                {open && (
                                    <div className="px-4 pb-3 border-t border-white/10 flex flex-col gap-2 pt-3">
                                        {p.responses.map((r) => (
                                            <div key={`${r.formId}-${r.id}`} className="rounded-xl px-3 py-2" style={{ background: "var(--arbo-surface-2)" }}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-medium arbo-text truncate">{r.formTitle}</span>
                                                    <span className="text-[10px] arbo-text-muted shrink-0">{fmtDate(r.createdAt)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
