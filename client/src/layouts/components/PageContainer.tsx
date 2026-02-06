
import { NavBar } from "../../components";
import { WaveSvg } from "../../components";

interface PagecontainerProps {
    children: React.ReactNode;
}

export const PageContainer = ({ children }: PagecontainerProps) => {
    return (
        <>
            <div className="relative flex flex-col min-h-dvh w-full overflow-x-hidden bg-background">
                <NavBar />
                {children}
                <div className="pointer-events-none absolute bottom-0 left-0 w-full z-0 select-none">
                    <WaveSvg />
                </div>
            </div>
        </>
    )
}