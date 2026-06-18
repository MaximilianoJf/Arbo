import logo from "../../assets/arbo_logo_small.png"

interface LogoProps {
    width?: number;
    showText?: boolean;
    className?: string;
}

export const Logo = ({ width = 40, showText = true, className }: LogoProps) => {
    return (
        <div className={`flex items-end ${className}`}>
            <img
                src={logo}
                alt="Logo"
                width={width}
                className="hidden dark:block object-contain"
            />
            <img
                src={logo}
                alt="Logo"
                width={width}
                className="block dark:hidden object-contain"
            />

            {/* arbo-text (palette var) instead of text-foreground: the auth pages are
                always dark, and text-foreground turns black without the .dark class */}
            {showText && (
                <span className="text-4xl font-bold arbo-text">
                    rbo
                </span>
            )}
        </div>
    );
};
