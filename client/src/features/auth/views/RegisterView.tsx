import { useCallback, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { registerFields } from "../constants";
import { GoogleSignInButton } from "../components";
import { FormBuilder } from "@/core/form-engine/FormBuilder";
import { authApi } from "@/services/api";
import type { FormSchema } from "@/core/form-engine/types";

export const registerAction = async () => {
    return null;
};

const registerSchema: FormSchema = {
    ...registerFields,
    onSubmit: "__auth_register__",
};

export const RegisterView = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (data: Record<string, any>) => {
        setError(null);
        try {
            const res = await authApi.register({
                name: String(data.name || ""),
                email: String(data.email || ""),
                password: String(data.password || ""),
            });
            localStorage.setItem("token", res.token);
            navigate("/form-builder");
        } catch (err: any) {
            setError(err.message || "Registration failed");
        }
    };

    const handleGoogleSuccess = useCallback(async (credential: string) => {
        setError(null);
        try {
            const res = await authApi.google(credential);
            localStorage.setItem("token", res.token);
            navigate("/form-builder");
        } catch (err: any) {
            setError(err.message || "Google login failed");
        }
    }, [navigate]);

    return (
        <div className="flex flex-col items-center w-full max-w-[420px] animate-[fadeInUp_0.4s_ease-out]">
            <div className="arbo-auth-card w-full">
                <div className="flex flex-col items-center gap-2 mb-8">
                    <h2 className="text-2xl font-semibold tracking-tight arbo-text">
                        {t("auth.createAccountTitle")}
                    </h2>
                    <p className="text-sm arbo-text-muted">
                        {t("auth.registerSubtitle")}
                    </p>
                </div>

                <FormBuilder
                    formSchema={registerSchema}
                    mode="view"
                    isSystemForm={true}
                    onAuthSubmit={handleRegister}
                />

                <div className="mt-4">
                    <GoogleSignInButton
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError(t("auth.googleRegisterError"))}
                    />
                </div>

                {error && (
                    <div className="mt-5 px-4 py-3 rounded-lg bg-[var(--arbo-danger-muted)] border border-[var(--arbo-danger)]/20">
                        <p className="text-sm text-[var(--arbo-danger)]">{error}</p>
                    </div>
                )}
            </div>

            <p className="mt-8 text-sm arbo-text-muted">
                {t("auth.hasAccount")}{" "}
                <Link
                    to="/"
                    className="arbo-text-accent font-medium hover:underline underline-offset-4 transition-colors"
                >
                    {t("auth.signIn")}
                </Link>
            </p>
        </div>
    );
};
