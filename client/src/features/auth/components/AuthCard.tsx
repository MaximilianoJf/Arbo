interface AuthCardProps {
    children: React.ReactNode;
}

export const AuthCard = ({ children }: AuthCardProps) => {
    return (
        <div className="flex gap-5 flex-col items-center">
            {children}
        </div>
    )
}