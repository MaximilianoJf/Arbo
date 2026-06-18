import { useState } from "react";

interface ApiKeyInfo {
    id: number;
    name: string;
    isActive?: boolean;
}

interface Props {
    formId: number | string;
    apiKeys: ApiKeyInfo[];
    onClose: () => void;
}

/** Instructions panel to connect Power BI Desktop to the responses API via X-API-Key. */
export const PowerBiConnectPanel = ({ formId, apiKeys, onClose }: Props) => {
    const [copied, setCopied] = useState(false);
    const apiUrl = `${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/forms/${formId}/responses`;

    const copyUrl = () => {
        navigator.clipboard.writeText(apiUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="arbo-panel overflow-hidden">
            <div className="arbo-panel-header flex items-center justify-between">
                <span className="font-semibold">Conectar Power BI Desktop</span>
                <button onClick={onClose} className="text-xs arbo-text-muted hover:arbo-text">✕</button>
            </div>
            <div className="p-5 flex flex-col gap-5">
                {/* Step 1 */}
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold arbo-text-muted uppercase tracking-wider">1 — URL del endpoint</p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] text-xs arbo-text font-mono break-all">
                            {apiUrl}
                        </code>
                        <button onClick={copyUrl} className="shrink-0 px-3 py-2 rounded-lg text-xs arbo-btn arbo-btn-secondary">
                            {copied ? "Copiado" : "Copiar"}
                        </button>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold arbo-text-muted uppercase tracking-wider">2 — Tu API Key (encabezado: X-API-Key)</p>
                    {apiKeys.length === 0 ? (
                        <div className="p-3 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] text-sm arbo-text-muted">
                            No tenés API keys. Andá a <strong>Configuración → API Keys</strong> para crear una.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="p-3 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] text-xs arbo-text-muted">
                                La key completa solo se muestra al crearla. Copiala desde <strong>Configuración → API Keys</strong> al momento de generarla.
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {apiKeys.map((k) => (
                                    <div key={k.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                                        <div className={`size-2 rounded-full shrink-0 ${k.isActive ? "bg-[var(--arbo-accent)]" : "bg-[var(--arbo-danger)]"}`} />
                                        <span className="text-xs arbo-text">{k.name}</span>
                                        <span className="text-xs arbo-text-muted ml-auto">{k.isActive ? "Activa" : "Revocada"}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Step 3 */}
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold arbo-text-muted uppercase tracking-wider">3 — Pasos en Power BI Desktop</p>
                    <ol className="flex flex-col gap-1.5 text-sm arbo-text-secondary list-decimal list-inside">
                        <li>Inicio → <strong>Obtener datos</strong> → <strong>Web</strong></li>
                        <li>Seleccioná <strong>Uso avanzado</strong></li>
                        <li>Pegá la URL de arriba en <em>Partes de la URL</em></li>
                        <li>En <em>Parámetros de encabezado HTTP</em> agregá: <code className="px-1 py-0.5 rounded bg-[var(--arbo-surface-2)] text-xs font-mono">X-API-Key</code> → tu key</li>
                        <li>Aceptar → expandí <strong>data</strong> → Cerrar y aplicar</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};
