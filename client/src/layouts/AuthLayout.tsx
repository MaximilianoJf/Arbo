import { Outlet } from "react-router-dom"
import { WaveSvg, NavBar } from "../components"


export const AuthLayout = () => {
    return (
        <>
            <div className="relative flex flex-col h-screen">
                <NavBar />

                <main className="relative z-10 flex-1 justify-center flex flex-col items-stretch">
                    <Outlet />
                </main>
                <div className="absolute bottom-0 left-0 w-full z-0">
                    <WaveSvg />
                </div>

            </div>

        </>
    )
}

export default AuthLayout