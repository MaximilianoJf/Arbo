import { Outlet } from "react-router-dom"
import { WaveSvg, NavBar } from "../components"


export const AuthLayout = () => {
    return (
        <div className="relative flex flex-col min-h-dvh w-full overflow-x-hidden bg-background">
            <NavBar />

            <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
                <Outlet />
            </main>

            <div className="pointer-events-none absolute bottom-0 left-0 w-full z-0 select-none">
                <WaveSvg />
            </div>
        </div>
    );
};

export default AuthLayout