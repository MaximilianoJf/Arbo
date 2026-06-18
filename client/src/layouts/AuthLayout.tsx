import { Outlet } from "react-router-dom"
import { Logo } from "../components/ui"

export const AuthLayout = () => {
    return (
        <div className="min-h-dvh arbo-bg flex items-center justify-center px-4 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07]"
                    style={{ background: "radial-gradient(circle, var(--arbo-accent) 0%, transparent 70%)" }}
                />
                <div
                    className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-[0.04]"
                    style={{ background: "radial-gradient(circle, var(--arbo-accent) 0%, transparent 70%)" }}
                />
            </div>

            <div className="relative z-10 flex flex-col items-center w-full">
                <div className="mb-10 flex flex-col items-center">
                    <Logo width={52} />
                </div>
                <Outlet />
            </div>
        </div>
    );
};

export default AuthLayout
