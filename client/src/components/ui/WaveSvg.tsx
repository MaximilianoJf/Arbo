import { motion } from "framer-motion";

export const WaveSvg = () => {
    // ONDA 1 
    // Estado A: Curvas originales
    const d1_A = "M 0,600 L 0,300 C 73,301 147,302 258,308 C 368,313 517,324 611,299 C 704,273 743,213 824,183 C 904,152 1027,153 1137,128 C 1246,102 1343,51 1440,0 L 1440,600 L 0,600 Z";
    // Estado B: Curvas deformadas (puntos movidos ligeramente)
    const d1_B = "M 0,600 L 0,350 C 80,330 150,310 260,320 C 370,330 520,350 620,320 C 710,290 750,230 830,210 C 910,190 1030,180 1140,150 C 1250,120 1350,70 1440,20 L 1440,600 L 0,600 Z";

    // ONDA 2
    // Estado A: Curvas originales
    const d2_A = "M 0,600 L 0,500 C 121,547 243,595 339,557 C 434,518 504,393 597,366 C 689,338 805,408 907,399 C 1008,389 1096,300 1183,254 C 1269,207 1354,203 1440,200 L 1440,600 L 0,600 Z";
    // Estado B: Curvas deformadas
    const d2_B = "M 0,600 L 0,480 C 130,520 250,570 350,540 C 450,510 520,420 610,390 C 700,360 820,430 920,410 C 1020,390 1110,330 1200,280 C 1280,230 1360,220 1440,230 L 1440,600 L 0,600 Z";

    return (
        <svg
            className="absolute bottom-0 left-0 w-full h-auto pointer-events-none -z-10"
            viewBox="0 0 1440 590"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id="gradient" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="5%" stopColor="#7ff889" />
                    <stop offset="95%" stopColor="#8ED1FC" />
                </linearGradient>
            </defs>

            <motion.path
                animate={{ d: [d1_A, d1_B, d1_A] }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                fill="url(#gradient)"
                fillOpacity="0.53"
            />


            <motion.path
                animate={{ d: [d2_A, d2_B, d2_A] }}
                transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                fill="url(#gradient)"
            />
        </svg>
    );
};

