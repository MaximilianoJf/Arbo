import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "../ui";
import { LanguageSwitcher } from "../widgets/LanguageSwitcher";
import { LayoutList, FolderOpen, Archive, TrashBin, CircleQuestion, Gear, SquarePlus, Key, Sparkles, LayoutCellsLarge } from "@gravity-ui/icons";

const getToken = () => localStorage.getItem("token");
const parseToken = (): { name?: string; email?: string } | null => {
    const token = getToken();
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch {
        return null;
    }
};

export const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const user = parseToken();

    const navItems = [
        { label: t("nav.myForms"), icon: LayoutList, path: "/form-builder" },
        { label: "Componentes", icon: LayoutCellsLarge, path: "/form-builder/components" },
        { label: t("nav.sharedWithMe"), icon: FolderOpen, path: "/form-builder/shared" },
        { label: t("nav.archive"), icon: Archive, path: "/form-builder/archive" },
        { label: t("nav.trash"), icon: TrashBin, path: "/form-builder/trash" },
        { label: t("nav.apiKeys"), icon: Key, path: "/form-builder/api-keys" },
        { label: t("nav.aiSettings"), icon: Sparkles, path: "/form-builder/settings/openrouter" },
    ];

    const bottomItems = [
        { label: t("nav.helpCenter"), icon: CircleQuestion, path: "#", disabled: true },
        { label: t("nav.account"), icon: Gear, path: "#", disabled: true },
    ];

    if (!user) return null;

    return (
        <aside className="arbo-sidebar">
            {/* Logo + Plan */}
            <div className="px-5 pt-5 pb-3">
                <Link to="/form-builder" className="flex items-center gap-2.5">
                    <div className="size-9 rounded-lg bg-[var(--arbo-surface-3)] flex items-center justify-center">
                        <Logo width={22} showText={false} />
                    </div>
                    <div>
                        <p className="text-sm font-bold arbo-text">{t("nav.editorName")}</p>
                        <p className="text-[10px] font-semibold tracking-wider arbo-text-accent uppercase">
                            {t("nav.formBuilder")}
                        </p>
                    </div>
                </Link>
            </div>

            {/* New Form Button */}
            <div className="px-3 pb-2">
                <button
                    onClick={() => navigate("/form-builder/create-form")}
                    className="arbo-btn arbo-btn-primary w-full"
                >
                    <SquarePlus className="size-4" />
                    {t("nav.newForm")}
                </button>
            </div>

            {/* Main Nav */}
            <nav className="flex flex-col gap-0.5 px-1 mt-2 flex-1">
                {navItems.map((item) => {
                    const isActive =
                        item.path === "/form-builder"
                            ? location.pathname === "/form-builder" ||
                              location.pathname.startsWith("/form-builder/edit") ||
                              location.pathname.startsWith("/form-builder/create") ||
                              location.pathname.startsWith("/form-builder/responses") ||
                              location.pathname.startsWith("/form-builder/projects")
                            : item.path === "/form-builder/api-keys"
                            ? location.pathname.startsWith("/form-builder/api-keys")
                            : item.path === "/form-builder/settings/openrouter"
                            ? location.pathname.startsWith("/form-builder/settings")
                            : location.pathname === item.path;

                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={`arbo-sidebar-item ${isActive ? "active" : ""}`}
                        >
                            <item.icon className="size-4 shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Nav */}
            <div className="flex flex-col gap-0.5 px-1 pb-4 border-t border-[var(--arbo-border)] pt-3 mt-auto">
                <LanguageSwitcher />
                {bottomItems.map((item) => (
                    <Link
                        key={item.label}
                        to={item.disabled ? "#" : item.path}
                        className={`arbo-sidebar-item ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                        onClick={(e) => item.disabled && e.preventDefault()}
                    >
                        <item.icon className="size-4 shrink-0" />
                        {item.label}
                    </Link>
                ))}
            </div>
        </aside>
    );
};
