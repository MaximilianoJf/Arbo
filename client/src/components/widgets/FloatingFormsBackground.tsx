import { useMemo } from "react";

/**
 * Animated auth background: small glass form cards drift toward the viewer
 * through 3D space and fade away, looping forever. Pure CSS transforms
 * (translateZ + opacity), no video, GPU-friendly.
 */

const ACCENTS = ["#4ADE80", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#06B6D4"];

interface CardSpec {
    id: number;
    x: number;        // % horizontal
    y: number;        // % vertical
    delay: number;    // s (negative = already mid-flight)
    duration: number; // s
    accent: string;
    variant: number;  // 0..2 fake-form layout
    width: number;    // px
}

const mulberry = (seed: number) => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const FakeRow = ({ w }: { w: string }) => (
    <div className="flex flex-col gap-1">
        <div className="h-1 rounded-full bg-white/25" style={{ width: w }} />
        <div className="h-3 rounded bg-white/10 border border-white/10 w-full" />
    </div>
);

const FakeCard = ({ spec }: { spec: CardSpec }) => (
    <div
        className="absolute arbo-form-float"
        style={{
            left: `${spec.x}%`,
            top: `${spec.y}%`,
            width: spec.width,
            animationDelay: `${spec.delay}s`,
            animationDuration: `${spec.duration}s`,
        }}
        aria-hidden
    >
        <div
            className="rounded-xl border p-2.5 flex flex-col gap-1.5"
            style={{
                background: "rgba(26, 26, 36, 0.55)",
                borderColor: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(6px)",
                boxShadow: `0 0 24px ${spec.accent}22`,
            }}
        >
            <div className="h-1 rounded-full" style={{ background: spec.accent, width: "38%" }} />
            {spec.variant === 0 && (<><FakeRow w="55%" /><FakeRow w="40%" /></>)}
            {spec.variant === 1 && (
                <>
                    <FakeRow w="48%" />
                    <div className="flex gap-1.5">
                        <div className="h-3 rounded bg-white/10 border border-white/10 flex-1" />
                        <div className="h-3 rounded bg-white/10 border border-white/10 flex-1" />
                    </div>
                </>
            )}
            {spec.variant === 2 && (
                <>
                    <FakeRow w="60%" />
                    <div className="flex items-center gap-1.5">
                        <div className="size-2.5 rounded-sm border" style={{ borderColor: spec.accent }} />
                        <div className="h-1 rounded-full bg-white/20 w-1/2" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="size-2.5 rounded-full border border-white/25" />
                        <div className="h-1 rounded-full bg-white/20 w-1/3" />
                    </div>
                </>
            )}
            <div className="h-3.5 rounded-md mt-0.5" style={{ background: spec.accent, opacity: 0.75, width: "45%" }} />
        </div>
    </div>
);

export const FloatingFormsBackground = ({ count = 14 }: { count?: number }) => {
    const cards = useMemo<CardSpec[]>(() => {
        const rnd = mulberry(20260612);
        return Array.from({ length: count }, (_, i) => {
            const duration = 14 + rnd() * 10;             // 14–24s per flight
            return {
                id: i,
                x: 4 + rnd() * 88,
                y: 4 + rnd() * 80,
                delay: -rnd() * duration,                  // pre-populate the space
                duration,
                accent: ACCENTS[Math.floor(rnd() * ACCENTS.length)],
                variant: Math.floor(rnd() * 3),
                width: 120 + Math.floor(rnd() * 70),       // 120–190px
            };
        });
    }, [count]);

    return (
        <div
            className="absolute inset-0 overflow-hidden pointer-events-none select-none"
            style={{ perspective: "900px", perspectiveOrigin: "50% 45%" }}
            aria-hidden
        >
            <style>{`
                @keyframes arboFormFloat {
                    0%   { transform: translate3d(-50%, -50%, -1400px); opacity: 0; }
                    12%  { opacity: 0.55; }
                    70%  { opacity: 0.45; }
                    92%  { opacity: 0; }
                    100% { transform: translate3d(-50%, -50%, 420px); opacity: 0; }
                }
                .arbo-form-float {
                    transform-style: preserve-3d;
                    animation-name: arboFormFloat;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                    will-change: transform, opacity;
                }
                @media (prefers-reduced-motion: reduce) {
                    .arbo-form-float { animation: none; opacity: 0.15; transform: translate3d(-50%, -50%, 0) scale(0.6); }
                }
            `}</style>
            {cards.map((c) => <FakeCard key={c.id} spec={c} />)}
        </div>
    );
};
