import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/ui";
import { ArrowLeft } from "@gravity-ui/icons";

export const NotFoundView = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="min-h-dvh arbo-bg flex flex-col items-center justify-center gap-8 px-4">
            {/* Logo */}
            <Logo width={56} />

            {/* 404 badge */}
            <div className="flex flex-col items-center gap-3">
                <span className="text-7xl font-black tracking-tight"
                    style={{ color: "var(--arbo-accent)", opacity: 0.8 }}>
                    {t("notFound.code")}
                </span>
                <h1 className="text-xl font-bold arbo-text">{t("notFound.title")}</h1>
                <p className="text-sm arbo-text-muted text-center max-w-xs">
                    {t("notFound.subtitle")}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="arbo-btn arbo-btn-secondary text-sm"
                >
                    <ArrowLeft className="size-4" /> {t("notFound.goBack")}
                </button>
                <button
                    onClick={() => navigate("/form-builder")}
                    className="arbo-btn arbo-btn-primary text-sm"
                >
                    {t("notFound.dashboard")}
                </button>
            </div>
        </div>
    );
};
