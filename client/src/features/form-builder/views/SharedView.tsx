import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formApi } from "@/services/api";
import { FormCard } from "../components/FormCard";
import { FolderOpen } from "@gravity-ui/icons";

export const SharedView = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [sharedItems, setSharedItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await formApi.getSharedForms();
                setSharedItems(res.data);
            } catch {
                navigate("/");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [navigate]);

    const handleAction = (id: number) => {
        setSharedItems((prev) => prev.filter((s) => (s.form?.id || s.formId) !== id));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="arbo-spinner" />
            </div>
        );
    }

    // Map collaborator records → form objects
    const forms = sharedItems
        .map((item) => item.form)
        .filter(Boolean)
        .filter((f) => !f.deletedAt);

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
            <div>
                <h1 className="text-xl font-bold arbo-text">{t("shared.title")}</h1>
                <p className="text-sm arbo-text-muted mt-0.5">
                    {t("shared.sharedForms", { count: forms.length })}
                </p>
            </div>

            {forms.length === 0 ? (
                <div className="arbo-card-static flex flex-col items-center gap-5 p-16 text-center">
                    <div className="size-16 rounded-2xl bg-[rgba(59,130,246,0.15)] flex items-center justify-center">
                        <FolderOpen className="size-8 text-[var(--arbo-info)]" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold arbo-text">{t("shared.noShared")}</p>
                        <p className="text-sm arbo-text-muted mt-1">
                            {t("shared.noSharedSubtitle")}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {forms.map((form: any) => (
                        <FormCard key={form.id} form={form} onAction={handleAction} variant="shared" />
                    ))}
                </div>
            )}
        </div>
    );
};
