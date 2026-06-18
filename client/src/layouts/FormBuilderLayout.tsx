import { Outlet } from "react-router-dom"
import { Sidebar, TopBar } from "../components"
import { OpenRouterUsageWidget } from "../components/widgets/OpenRouterUsageWidget"

const FormBuilderLayout = () => {
    return (
        <div className="flex h-dvh overflow-hidden arbo-bg">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <TopBar showTabs />
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
            <OpenRouterUsageWidget />
        </div>
    )
}

export default FormBuilderLayout
