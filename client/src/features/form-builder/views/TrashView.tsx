import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formApi } from "@/services/api";
import { FormCard } from "../components/FormCard";
import { TrashBin } from "@gravity-ui/icons";

export const TrashView = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await formApi.getTrashedForms();
                setForms(res.data);
            } catch {
                navigate("/");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [navigate]);

    const handleAction = (id: number) => {
        setForms((prev) => prev.filter((f) => f.id !== id));
    };

    const handleEmptyTrash = async () => {
        if (!confirm("Permanently delete all forms in trash? This cannot be undone.")) return;
        try {
            await Promise.all(forms.map((f) => formApi.permanentDelete(f.id)));
            setForms([]);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="arbo-spinner" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold arbo-text">{t("trash.title")}</h1>
                    <p className="text-sm arbo-text-muted mt-0.5">
                        {t("trash.formsInTrash", { count: forms.length })}
                    </p>
                </div>
                {forms.length > 0 && (
                    <button onClick={handleEmptyTrash} className="arbo-btn arbo-btn-danger text-sm">
                        <TrashBin className="size-4" /> {t("trash.emptyTrash")}
                    </button>
                )}
            </div>

            {forms.length === 0 ? (
                <div className="arbo-card-static flex flex-col items-center gap-5 p-16 text-center">
                    <div className="size-16 rounded-2xl bg-[var(--arbo-danger-muted)] flex items-center justify-center">
                        <TrashBin className="size-8 text-[var(--arbo-danger)]" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold arbo-text">{t("trash.empty")}</p>
                        <p className="text-sm arbo-text-muted mt-1">
                            {t("trash.emptySubtitle")}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {forms.map((form) => (
                        <FormCard key={form.id} form={form} onAction={handleAction} variant="trash" />
                    ))}
                </div>
            )}
        </div>
    );
};
