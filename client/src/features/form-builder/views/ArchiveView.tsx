import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formApi } from "@/services/api";
import { FormCard } from "../components/FormCard";
import { Archive } from "@gravity-ui/icons";

export const ArchiveView = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await formApi.getArchivedForms();
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="arbo-spinner" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
            <div>
                <h1 className="text-xl font-bold arbo-text">{t("archive.title")}</h1>
                <p className="text-sm arbo-text-muted mt-0.5">
                    {t("archive.archivedForms", { count: forms.length })}
                </p>
            </div>

            {forms.length === 0 ? (
                <div className="arbo-card-static flex flex-col items-center gap-5 p-16 text-center">
                    <div className="size-16 rounded-2xl bg-[rgba(245,158,11,0.15)] flex items-center justify-center">
                        <Archive className="size-8 text-[var(--arbo-warning)]" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold arbo-text">{t("archive.noArchived")}</p>
                        <p className="text-sm arbo-text-muted mt-1">
                            {t("archive.noArchivedSubtitle")}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {forms.map((form) => (
                        <FormCard key={form.id} form={form} onAction={handleAction} variant="archived" />
                    ))}
                </div>
            )}
        </div>
    );
};
