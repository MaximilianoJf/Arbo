import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, ArrowRightFromSquare } from "@gravity-ui/icons";

const getToken = () => localStorage.getItem("token");

interface TopBarProps {
    showTabs?: boolean;
    showPublish?: boolean;
    formSlug?: string;
}

export const TopBar = ({ showTabs = true, showPublish = false, formSlug }: TopBarProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const tabs: { label: string; path: string; disabled?: boolean }[] = [
        { label: t("nav.dashboard"), path: "/form-builder" },
    ];

    const isTabActive = (path: string) => {
        if (path === "/form-builder") {
            return location.pathname === "/form-builder";
        }
        return location.pathname === path;
    };

    return (
        <div className="arbo-topbar">
            <span className="text-sm font-bold arbo-text-accent mr-3">{t("nav.appName")}</span>

            {showTabs && (
                <div className="flex items-center gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.label}
                            onClick={() => !tab.disabled && navigate(tab.path)}
                            className={`arbo-tab ${isTabActive(tab.path) ? "active" : ""} ${tab.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex-1" />

            {showPublish && formSlug && (
                <button
                    onClick={() => navigate(`/forms/${formSlug}`)}
                    className="arbo-btn arbo-btn-ghost text-xs"
                >
                    <Eye className="size-3.5" />
                    {t("common.preview")}
                </button>
            )}

            {showPublish && (
                <button className="arbo-btn arbo-btn-primary text-sm px-5 py-1.5">
                    {t("common.publish")}
                </button>
            )}

            <button
                onClick={handleLogout}
                className="arbo-btn arbo-btn-ghost text-xs ml-2"
                title={t("common.logout")}
            >
                <ArrowRightFromSquare className="size-3.5" />
            </button>
        </div>
    );
};
