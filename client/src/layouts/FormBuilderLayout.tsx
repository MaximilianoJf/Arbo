import { useState, useEffect } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Sidebar, TopBar } from "../components"
import { OpenRouterUsageWidget } from "../components/widgets/OpenRouterUsageWidget"

const FormBuilderLayout = () => {
    const [menuOpen, setMenuOpen] = useState(false)
    const location = useLocation()

    // Close the mobile drawer whenever the route changes.
    useEffect(() => { setMenuOpen(false) }, [location.pathname])

    return (
        <div className="flex h-dvh overflow-hidden arbo-bg relative">
            {/* Atmospheric glows behind the glass shell */}
            <div className="arbo-glow-bg arbo-glow-primary" aria-hidden />
            <div className="arbo-glow-bg arbo-glow-secondary" aria-hidden />

            <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

            {/* Backdrop behind the off-canvas sidebar (tablet/mobile only) */}
            {menuOpen && (
                <div
                    className="xl:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden
                />
            )}

            <div className="flex flex-col flex-1 overflow-hidden relative z-10">
                <TopBar showTabs onMenuToggle={() => setMenuOpen((v) => !v)} />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
            <OpenRouterUsageWidget />
        </div>
    )
}

export default FormBuilderLayout
