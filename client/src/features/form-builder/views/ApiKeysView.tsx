import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Key, TrashBin, CircleXmark, Eye, EyeSlash } from "@gravity-ui/icons";
import { apiKeyApi } from "@/services/api";

interface ApiKeyItem {
    id: number;
    name: string;
    key?: string; // only on creation
    isActive: boolean;
    lastUsedAt: string | null;
    createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const ApiKeysView = () => {
    const { t } = useTranslation();
    const [keys, setKeys] = useState<ApiKeyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newKeyName, setNewKeyName] = useState("");
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    const [showCreated, setShowCreated] = useState(false);
    const [creating, setCreating] = useState(false);

    const load = async () => {
        try {
            const res = await apiKeyApi.list();
            setKeys(res.data);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        if (!newKeyName.trim() || creating) return;
        setCreating(true);
        try {
            const res = await apiKeyApi.create(newKeyName.trim());
            setCreatedKey(res.data.key);
            setShowCreated(true);
            setNewKeyName("");
            load();
        } catch { /* ignore */ }
        finally { setCreating(false); }
    };

    const handleRevoke = async (keyId: number) => {
        await apiKeyApi.revoke(keyId);
        load();
    };

    const handleDelete = async (keyId: number) => {
        await apiKeyApi.delete(keyId);
        load();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    if (loading) return <div className="flex items-center justify-center py-20"><div className="arbo-spinner" /></div>;

    return (
        <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
            <div>
                <h1 className="text-xl font-bold arbo-text">{t("apiKeys.title")}</h1>
                <p className="text-sm arbo-text-muted mt-0.5">
                    {t("apiKeys.subtitle")}
                </p>
            </div>

            {/* Create new key */}
            <div className="arbo-panel p-5">
                <h2 className="text-sm font-semibold arbo-text mb-3">{t("apiKeys.createNew")}</h2>
                <div className="flex items-center gap-2">
                    <input
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        placeholder={t("apiKeys.keyNamePlaceholder")}
                        className="flex-1 px-3 py-2 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)] arbo-text text-sm placeholder:arbo-text-muted focus:outline-none focus:border-[var(--arbo-accent)]"
                    />
                    <button
                        onClick={handleCreate}
                        disabled={!newKeyName.trim() || creating}
                        className="arbo-btn arbo-btn-primary text-sm disabled:opacity-50"
                    >
                        <Key className="size-4" /> {t("apiKeys.create")}
                    </button>
                </div>
            </div>

            {/* Created key banner */}
            {createdKey && (
                <div className="arbo-panel p-5 border-[var(--arbo-accent)]/30 bg-[var(--arbo-accent-muted)]">
                    <p className="text-sm font-semibold text-[var(--arbo-accent)] mb-2">
                        {t("apiKeys.keyCreated")}
                    </p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 rounded-lg bg-[var(--arbo-surface-1)] border border-[var(--arbo-border)] text-xs arbo-text font-mono break-all">
                            {showCreated ? createdKey : "arbo_••••••••••••••••••••••••••••••••••••••••••••••••"}
                        </code>
                        <button onClick={() => setShowCreated(!showCreated)}
                            className="p-2 rounded-lg hover:bg-[var(--arbo-surface-2)] arbo-text-muted" title={showCreated ? "Hide" : "Show"}>
                            {showCreated ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
                        </button>
                        <button onClick={() => copyToClipboard(createdKey)}
                            className="p-2 rounded-lg hover:bg-[var(--arbo-surface-2)] text-[var(--arbo-accent)]" title="Copy">
                            <Copy className="size-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Keys list */}
            <div className="arbo-panel overflow-hidden">
                <div className="arbo-panel-header">{t("apiKeys.yourKeys")}</div>
                {keys.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-sm arbo-text-muted">{t("apiKeys.noKeys")}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--arbo-border)]">
                        {keys.map((k) => (
                            <div key={k.id} className="flex items-center gap-4 px-5 py-3.5">
                                <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    k.isActive ? "bg-[var(--arbo-accent-muted)]" : "bg-[var(--arbo-surface-2)]"
                                }`}>
                                    <Key className={`size-4 ${k.isActive ? "text-[var(--arbo-accent)]" : "arbo-text-muted"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium arbo-text">{k.name}</p>
                                    <p className="text-xs arbo-text-muted">
                                        Created {new Date(k.createdAt).toLocaleDateString()}
                                        {k.lastUsedAt && ` • Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                                    </p>
                                </div>
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                    k.isActive
                                        ? "bg-[var(--arbo-accent-muted)] text-[var(--arbo-accent)]"
                                        : "bg-[var(--arbo-surface-2)] arbo-text-muted"
                                }`}>
                                    {k.isActive ? t("common.active") : t("common.revoked")}
                                </span>
                                <div className="flex items-center gap-1">
                                    {k.isActive && (
                                        <button onClick={() => handleRevoke(k.id)}
                                            className="p-1.5 rounded-md hover:bg-[var(--arbo-surface-2)] arbo-text-muted transition-colors"
                                            title="Revoke">
                                            <CircleXmark className="size-4" />
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(k.id)}
                                        className="p-1.5 rounded-md hover:bg-[var(--arbo-danger-muted)] text-[var(--arbo-danger)] transition-colors"
                                        title="Delete">
                                        <TrashBin className="size-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Power BI instructions */}
            <div className="arbo-panel p-5">
                <h2 className="text-sm font-semibold arbo-text mb-3">{t("apiKeys.connectPowerBI")}</h2>
                <div className="flex flex-col gap-3 text-sm arbo-text-secondary">
                    <p>Use these endpoints with your API key in the <code className="text-xs bg-[var(--arbo-surface-2)] px-1.5 py-0.5 rounded">X-API-Key</code> header:</p>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)] px-1.5 py-0.5 rounded">GET</span>
                            <code className="text-xs arbo-text font-mono">{API_URL}/api-keys/data/forms</code>
                            <button onClick={() => copyToClipboard(`${API_URL}/api-keys/data/forms`)}
                                className="p-1 rounded hover:bg-[var(--arbo-surface-2)] arbo-text-muted"><Copy className="size-3" /></button>
                        </div>
                        <p className="text-xs arbo-text-muted ml-12">{t("apiKeys.listForms")}</p>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[var(--arbo-accent)] bg-[var(--arbo-accent-muted)] px-1.5 py-0.5 rounded">GET</span>
                            <code className="text-xs arbo-text font-mono">{API_URL}/api-keys/data/forms/:formId</code>
                            <button onClick={() => copyToClipboard(`${API_URL}/api-keys/data/forms/`)}
                                className="p-1 rounded hover:bg-[var(--arbo-surface-2)] arbo-text-muted"><Copy className="size-3" /></button>
                        </div>
                        <p className="text-xs arbo-text-muted ml-12">{t("apiKeys.getFormData")}</p>
                    </div>
                    <div className="mt-2 p-3 rounded-lg bg-[var(--arbo-surface-2)] border border-[var(--arbo-border)]">
                        <p className="text-xs font-medium arbo-text mb-1.5">{t("apiKeys.powerBIInstructions")}</p>
                        <p className="text-xs arbo-text-muted">
                            {t("apiKeys.powerBIStep1")} <code className="bg-[var(--arbo-surface-3)] px-1 rounded">X-API-Key</code> {t("apiKeys.powerBIStep2")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
