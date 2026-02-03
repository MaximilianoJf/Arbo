import logo from "../../assets/arbo_logo_small.png"
import logoDark from "../../assets/arbo_logo_small_dark.png"

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

            {showText && (
                <span className="text-4xl font-bold text-foreground">
                    rbo
                </span>
            )}
        </div>
    );
};
