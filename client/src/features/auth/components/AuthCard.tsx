interface AuthCardProps {
    tittle: string;
    children: React.ReactNode;
}

export const AuthCard = ({ tittle, children }: AuthCardProps) => {
    return (
        <div className="flex gap-5 flex-col items-center">
            <h1 className="text-4xl font-bold text-foreground/80 text-center">
                {tittle}
            </h1>
            {children}
        </div>
    )
}