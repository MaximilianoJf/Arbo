import { useState } from "react";
import { Plus, TrashBin, ArrowRight, TriangleExclamation, Link } from "@gravity-ui/icons";
import { REL_TYPE_META, REL_TYPE_ORDER, type FormLite, type RelationEdgeData } from "./relation-meta";
import type { RelationType } from "@/services/api";

const FieldChips = ({ form }: { form: FormLite }) => (
    <div className="rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] p-2">
        <p className="text-xs font-semibold arbo-text truncate mb-1.5">{form.title}</p>
        {form.fields.length === 0 ? (
            <p className="text-[10px] arbo-text-muted italic">Sin campos todavía</p>
        ) : (
            <div className="flex flex-wrap gap-1">
                {form.fields.map((f) => (
                    <span key={f.name} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--arbo-surface-3)] arbo-text-secondary">
                        {f.label || f.name}
                    </span>
                ))}
            </div>
        )}
    </div>
);

interface Props {
    source: FormLite;
    target: FormLite;
    data: RelationEdgeData;
    forms: FormLite[];
    creatingJoin: boolean;
    hasData?: boolean;
    creatingFk?: boolean;
    onChange: (patch: Partial<RelationEdgeData>) => void;
    onCreateJoinForm: () => void;
    onCreateFkField?: (labelField?: string) => void;
    /** Persist a styles patch onto the TARGET (child) form: restriction toggles live here. */
    onPatchTargetStyles?: (patch: Record<string, any>) => void;
    onDelete: () => void;
}

export const RelationInspector = ({ source, target, data, forms, creatingJoin, hasData, creatingFk, onChange, onCreateJoinForm, onCreateFkField, onPatchTargetStyles, onDelete }: Props) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [fkLabelField, setFkLabelField] = useState("");

    const keyFieldOptions = Array.from(
        new Map([...source.fields, ...target.fields].map((f) => [f.name, f])).values()
    );

    const handleDelete = () => {
        if (hasData && !confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        onDelete();
    };

    return (
        <div className="p-3 flex flex-col gap-4 overflow-y-auto">
            {/* The two connected forms with their fields */}
            <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">Conexión</p>
                <FieldChips form={source} />
                <div className="flex items-center justify-center"><ArrowRight className="size-4 text-[var(--arbo-accent)]" /></div>
                <FieldChips form={target} />
            </div>

            {/* Warning banner when child already has responses */}
            {hasData && (
                <div className="flex gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <TriangleExclamation className="size-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[11px] font-semibold text-amber-500">El formulario hijo tiene respuestas</p>
                        <p className="text-[10px] text-amber-500/80 mt-0.5 leading-snug">
                            No podés modificar el tipo ni el identificador mientras existan datos vinculados.
                            Para cambiarlo, primero eliminá las respuestas del formulario hijo.
                        </p>
                    </div>
                </div>
            )}

            {/* Cardinality type */}
            <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">Tipo de relación</p>
                {hasData && (
                    <p className="text-[10px] arbo-text-muted -mt-0.5">Bloqueado — hay respuestas vinculadas.</p>
                )}
                <div className={hasData ? "opacity-40 pointer-events-none select-none" : ""}>
                    {REL_TYPE_ORDER.map((tp) => {
                        const meta = REL_TYPE_META[tp];
                        const active = data.type === tp;
                        return (
                            <button
                                key={tp}
                                onClick={() => onChange({ type: tp as RelationType })}
                                disabled={hasData}
                                className={`w-full text-left p-2 rounded-lg border transition-colors mb-1.5 ${
                                    active ? "border-[var(--arbo-accent)] bg-[var(--arbo-accent-subtle)]" : "border-[var(--arbo-border)] bg-[var(--arbo-surface-2)] hover:border-[var(--arbo-accent)]/40"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: `${meta.color}22`, color: meta.color }}>{meta.short}</span>
                                    <span className="text-xs font-medium arbo-text">{meta.label}</span>
                                </div>
                                <p className="text-[10px] arbo-text-muted mt-1 leading-snug">{meta.desc}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bridge form for many-to-many */}
            {data.type === "many_to_many" && (
                <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">Formulario puente</p>
                    <p className="text-[10px] arbo-text-muted -mt-0.5">Acá se guarda cada vínculo entre las dos partes.</p>
                    <select
                        value={data.joinFormId ?? ""}
                        onChange={(e) => onChange({ joinFormId: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-2 py-1.5 rounded-md bg-[var(--arbo-surface-2)] arbo-text text-xs border border-[var(--arbo-border)] focus:border-[var(--arbo-accent)] focus:outline-none"
                    >
                        <option value="">Elegí un formulario…</option>
                        {forms
                            .filter((f) => f.id !== source.id && f.id !== target.id)
                            .map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
                    </select>
                    <button
                        onClick={onCreateJoinForm}
                        disabled={creatingJoin}
                        className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs arbo-text-muted hover:text-[var(--arbo-accent)] border border-dashed border-[var(--arbo-border)] hover:border-[var(--arbo-accent)]/50 transition-colors disabled:opacity-50"
                    >
                        <Plus className="size-3.5" /> {creatingJoin ? "Creando…" : "Crear formulario puente"}
                    </button>
                </div>
            )}

            {/* Linking key field */}
            <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">Identificador de vínculo</p>
                <p className="text-[10px] arbo-text-muted -mt-0.5">
                    Cómo se asocia cada respuesta hijo con su padre. Por defecto usa el ID interno (primary key).
                </p>
                <div className={hasData ? "opacity-40 pointer-events-none select-none" : ""}>
                    <select
                        value={data.keyField ?? ""}
                        onChange={(e) => onChange({ keyField: e.target.value || null })}
                        disabled={hasData}
                        className="w-full px-2 py-1.5 rounded-md bg-[var(--arbo-surface-2)] arbo-text text-xs border border-[var(--arbo-border)] focus:border-[var(--arbo-accent)] focus:outline-none disabled:cursor-not-allowed"
                    >
                        <option value="">Primary key (automático)</option>
                        {keyFieldOptions.map((f) => <option key={f.name} value={f.name}>{f.label || f.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Materialize the relation as a selectable (FK) field in the child form */}
            {onCreateFkField && data.type !== "many_to_many" && (
                <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">Campo de selección (FK)</p>
                    <p className="text-[10px] arbo-text-muted -mt-0.5 leading-snug">
                        Agrega un combo box en <span className="arbo-text font-semibold">{target.title}</span> para elegir un registro de <span className="arbo-text font-semibold">{source.title}</span> al cargar datos.
                    </p>
                    <div>
                        <p className="text-[9px] arbo-text-muted mb-0.5">Campo a mostrar de {source.title} <span className="opacity-60">(opcional)</span></p>
                        <select
                            value={fkLabelField}
                            onChange={(e) => setFkLabelField(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-md bg-[var(--arbo-surface-2)] arbo-text text-xs border border-[var(--arbo-border)] focus:border-[var(--arbo-accent)] focus:outline-none"
                        >
                            <option value="">Automático (primer dato / nombre)</option>
                            {source.fields.map((f) => <option key={f.name} value={f.name}>{f.label || f.name}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={() => onCreateFkField(fkLabelField || undefined)}
                        disabled={creatingFk}
                        className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs arbo-text-muted hover:text-[var(--arbo-accent)] border border-dashed border-[var(--arbo-border)] hover:border-[var(--arbo-accent)]/50 transition-colors disabled:opacity-50"
                    >
                        <Link className="size-3.5" /> {creatingFk ? "Creando…" : `Crear combo box en ${target.title}`}
                    </button>
                </div>
            )}

            {/* ── Restrictions: all the access/uniqueness rules of the CHILD form, in one place ── */}
            {onPatchTargetStyles && (() => {
                const strict = target.requiresParentChain !== false;
                const allowMultiple = !!target.allowMultiple;
                const requiresLogin = !!target.requiresGoogleAuth;

                const RestrictionToggle = ({
                    on, onToggle, onLabel, offLabel, onDesc, offDesc, accent = "var(--arbo-accent)",
                }: {
                    on: boolean; onToggle: () => void;
                    onLabel: string; offLabel: string; onDesc: string; offDesc: string; accent?: string;
                }) => (
                    <div
                        className="flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer select-none transition-colors hover:border-[var(--arbo-accent)]/50"
                        style={{
                            borderColor: on ? accent : "var(--arbo-border)",
                            background: on ? "var(--arbo-accent-muted)" : "var(--arbo-surface-2)",
                        }}
                        onClick={onToggle}
                    >
                        <div
                            className="mt-0.5 size-3.5 rounded-full shrink-0 border-2 transition-colors"
                            style={{
                                background: on ? accent : "transparent",
                                borderColor: on ? accent : "var(--arbo-border)",
                            }}
                        />
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold arbo-text">{on ? onLabel : offLabel}</p>
                            <p className="text-[10px] arbo-text-muted mt-0.5 leading-snug">{on ? onDesc : offDesc}</p>
                        </div>
                    </div>
                );

                return (
                    <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] font-bold arbo-text-muted uppercase tracking-wider">Restricciones de {target.title}</p>
                        <p className="text-[10px] arbo-text-muted -mt-0.5 leading-snug">
                            Todas las reglas de respuesta del formulario hijo, en este mismo flujo.
                        </p>

                        {/* Strict flow (requires parent ?ref= link) */}
                        <RestrictionToggle
                            on={strict}
                            accent="var(--arbo-warning, #f59e0b)"
                            onToggle={() => onPatchTargetStyles({ requiresParentChain: !strict })}
                            onLabel="Flujo estricto (requiere padre)"
                            offLabel="Acceso libre (sin padre)"
                            onDesc={`Solo se puede responder "${target.title}" desde el link de una respuesta del formulario padre. Administradores autenticados pueden responder sin restricción.`}
                            offDesc={`Cualquier persona puede responder "${target.title}" directamente, sin pasar por el formulario padre.`}
                        />

                        {/* One response per person (allowMultiple OFF = una sola) */}
                        <RestrictionToggle
                            on={!allowMultiple}
                            onToggle={() => onPatchTargetStyles({ allowMultiple: !allowMultiple })}
                            onLabel="Una respuesta por persona"
                            offLabel="Múltiples respuestas permitidas"
                            onDesc={`Cada usuario autenticado responde "${target.title}" una sola vez. Ideal para formularios obligatorios.`}
                            offDesc={`Una misma cuenta puede cargar varias respuestas. Ideal para registros internos (un admin que crea muchos clientes, mascotas, etc.).`}
                        />

                        {/* Requires Google login */}
                        <RestrictionToggle
                            on={requiresLogin}
                            onToggle={() => onPatchTargetStyles({ requiresGoogleAuth: !requiresLogin })}
                            onLabel="Requiere iniciar sesión"
                            offLabel="No requiere sesión"
                            onDesc={`Solo usuarios autenticados con Google pueden responder "${target.title}". Identifica con certeza a cada persona.`}
                            offDesc={`Cualquiera con el link puede responder "${target.title}", sin iniciar sesión.`}
                        />

                        {/* Unique fields (read-only summary; edited from the field editor) */}
                        <div className="p-2.5 rounded-lg border border-[var(--arbo-border)] bg-[var(--arbo-surface-2)]">
                            <p className="text-[11px] font-semibold arbo-text">Campos que no se pueden repetir</p>
                            {target.uniqueFields && target.uniqueFields.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {target.uniqueFields.map((f) => (
                                        <span key={f.name} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--arbo-accent-muted)] text-[var(--arbo-accent)] font-medium">
                                            {f.label || f.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[10px] arbo-text-muted mt-1 leading-snug">
                                    Ningún campo está marcado como único. Marcá un campo (ej. email, DNI) desde el editor del formulario para evitar valores repetidos entre respuestas.
                                </p>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Delete */}
            {confirmDelete ? (
                <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-[var(--arbo-danger-muted)] border border-[var(--arbo-danger)]/30">
                    <p className="text-[11px] font-semibold text-[var(--arbo-danger)]">¿Eliminar la conexión?</p>
                    <p className="text-[10px] text-[var(--arbo-danger)]/80 leading-snug">
                        Los datos vinculados quedarán huérfanos. Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-2 mt-1">
                        <button
                            onClick={() => setConfirmDelete(false)}
                            className="flex-1 px-2 py-1.5 rounded-md text-xs arbo-text-muted border border-[var(--arbo-border)] hover:bg-[var(--arbo-surface-2)] transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onDelete}
                            className="flex-1 px-2 py-1.5 rounded-md text-xs text-white bg-[var(--arbo-danger)] hover:opacity-90 transition-opacity"
                        >
                            Sí, eliminar
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={handleDelete}
                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-[var(--arbo-danger)] hover:bg-[var(--arbo-danger-muted)] border border-[var(--arbo-danger)]/20 transition-colors mt-1"
                >
                    <TrashBin className="size-3.5" /> Eliminar conexión
                </button>
            )}
        </div>
    );
};
