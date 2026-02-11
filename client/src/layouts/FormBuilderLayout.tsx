import { Outlet } from "react-router-dom"
import { PageContainer } from "./components/PageContainer"


const FormBuilderLayout = () => {
    return (
        <PageContainer>
            <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
                <Outlet />
            </main>
        </PageContainer>
    )
}

export default FormBuilderLayout