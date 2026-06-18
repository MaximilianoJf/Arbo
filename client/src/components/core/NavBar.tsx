import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "../ui";

// NavBar is now only used for public/auth pages (non-logged-in)
export const NavBar = () => {
    const { t } = useTranslation();
    return (
        <header className="arbo-surface border-b border-[var(--arbo-border)]">
            <nav className="flex justify-between items-center px-6 py-3 max-w-7xl mx-auto">
                <Link to="/" className="flex items-center gap-2">
                    <Logo width={32} />
                </Link>
                <div className="flex items-center gap-3">
                    <Link
                        to="/"
                        className="text-sm font-medium arbo-text-secondary hover:arbo-text transition-colors px-3 py-1.5 rounded"
                    >
                        {t("common.login")}
                    </Link>
                    <Link
                        to="/register"
                        className="arbo-btn arbo-btn-primary text-sm px-4 py-1.5"
                    >
                        {t("common.register")}
                    </Link>
                </div>
            </nav>
        </header>
    );
};
