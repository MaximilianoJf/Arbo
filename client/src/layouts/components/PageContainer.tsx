
interface PagecontainerProps {
    children: React.ReactNode;
}

export const PageContainer = ({ children }: PagecontainerProps) => {
    return (
        <div className="relative flex flex-col min-h-dvh w-full overflow-x-hidden arbo-bg">
            {children}
        </div>
    );
};
