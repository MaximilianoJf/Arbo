import { useEffect, useState, useCallback } from "react";
import { projectApi } from "@/services/api";
import { usePortal } from "./PortalContext";
import { TrashBin } from "@gravity-ui/icons";

const ROLES = [
    { value: "editor", label: "Editor" },
    { value: "viewer", label: "Viewer" },
];

const roleColor = (role: string) =>
    role === "owner" ? "rgba(74,222,128,0.15)" :
    role === "editor" ? "rgba(59,130,246,0.15)" :
    "rgba(160,160,180,0.15)";

const roleText = (role: string) =>
    role === "owner" ? "var(--arbo-accent)" :
    role === "editor" ? "var(--arbo-info)" :
    "var(--arbo-text-muted)";

export const PortalUsers = () => {
    const { projectId, isOwner, project } = usePortal();
    const [collabs, setCollabs] = useState<any[]>([]);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("editor");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [ok, setOk] = useState("");

    const load = useCallback(async () => {
        try {
            const res = await projectApi.getCollaborators(projectId);
            setCollabs(res.data);
        } catch { /* silent */ }
    }, [projectId]);

    useEffect(() => { load(); }, [load]);

    const handleAdd = async () => {
        if (!email.trim()) return setErr("Ingresá un email");
        setLoading(true); setErr(""); setOk("");
        try {
            await projectApi.addCollaborator(projectId, email.trim(), role);
            setEmail("");
            setOk("Colaborador agregado");
            load();
            setTimeout(() => setOk(""), 2500);
        } catch (e: any) {
            setErr(e.message || "Error al agregar");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (colEmail: string) => {
        try {
            await projectApi.removeCollaborator(projectId, colEmail);
            load();
        } catch { /* silent */ }
    };

    const handleRoleChange = async (colEmail: string, newRole: string) => {
        try {
            await projectApi.updateCollaboratorRole(projectId, colEmail, newRole);
            load();
        } catch { /* silent */ }
    };

    // Owner row from project.user
    const owner = project?.user;

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--arbo-text-muted)" }}>
                    Usuarios con acceso
                </h2>
                <p className="text-xs" style={{ color: "var(--arbo-text-muted)" }}>
                    Los usuarios con acceso pueden ver y responder los formularios del proyecto.
                </p>
            </div>

            {/* Invite form */}
            {isOwner && (
                <div
                    className="rounded-xl p-4 flex flex-col gap-3"
                    style={{ background: "var(--arbo-surface)", border: "1px solid var(--arbo-border)" }}
                >
                    <p className="text-sm font-semibold" style={{ color: "var(--arbo-text)" }}>Invitar colaborador</p>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                            placeholder="email@ejemplo.com"
                            className="arbo-input flex-1 text-sm"
                        />
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="arbo-input text-sm w-28"
                        >
                            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <button
                            onClick={handleAdd}
                            disabled={loading}
                            className="arbo-btn arbo-btn-primary text-sm px-4 disabled:opacity-50"
                        >
                            {loading ? "..." : "Invitar"}
                        </button>
                    </div>
                    {err && <p className="text-xs text-[var(--arbo-danger)]">{err}</p>}
                    {ok && <p className="text-xs text-[var(--arbo-accent)]">{ok}</p>}
                </div>
            )}

            {/* User list */}
            <div className="flex flex-col gap-2">
                {/* Owner */}
                {owner && (
                    <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: "var(--arbo-surface)", border: "1px solid var(--arbo-border)" }}
                    >
                        <div
                            className="size-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                            style={{ background: "var(--arbo-accent-muted)", color: "var(--arbo-accent)" }}
                        >
                            {(owner.name || owner.email)?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--arbo-text)" }}>
                                {owner.name || owner.email}
                            </p>
                            <p className="text-xs truncate" style={{ color: "var(--arbo-text-muted)" }}>{owner.email}</p>
                        </div>
                        <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                            style={{ background: roleColor("owner"), color: roleText("owner") }}
                        >
                            Propietario
                        </span>
                    </div>
                )}

                {/* Collaborators */}
                {collabs.map((c) => (
                    <div
                        key={c.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: "var(--arbo-surface)", border: "1px solid var(--arbo-border)" }}
                    >
                        <div
                            className="size-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                            style={{ background: "var(--arbo-surface-3)", color: "var(--arbo-text-secondary)" }}
                        >
                            {(c.user?.name || c.email)?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--arbo-text)" }}>
                                {c.user?.name || c.email}
                            </p>
                            <p className="text-xs truncate" style={{ color: "var(--arbo-text-muted)" }}>{c.email}</p>
                        </div>
                        {isOwner ? (
                            <>
                                <select
                                    value={c.role}
                                    onChange={(e) => handleRoleChange(c.email, e.target.value)}
                                    className="arbo-input text-xs w-24 py-1"
                                >
                                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                                <button
                                    onClick={() => handleRemove(c.email)}
                                    className="p-2 rounded-lg transition-colors hover:bg-[var(--arbo-danger-muted)]"
                                    style={{ color: "var(--arbo-text-muted)" }}
                                    title="Quitar acceso"
                                >
                                    <TrashBin className="size-3.5" />
                                </button>
                            </>
                        ) : (
                            <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                                style={{ background: roleColor(c.role), color: roleText(c.role) }}
                            >
                                {c.role}
                            </span>
                        )}
                    </div>
                ))}

                {collabs.length === 0 && (
                    <p className="text-sm text-center py-8" style={{ color: "var(--arbo-text-muted)" }}>
                        No hay colaboradores. Invitá a alguien arriba.
                    </p>
                )}
            </div>
        </div>
    );
};
