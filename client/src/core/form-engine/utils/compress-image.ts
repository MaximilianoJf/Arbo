/** Downscales a photo to max 1280px and re-encodes as JPEG to keep the payload small. */
export const compressImage = (file: File, maxSide = 1280, quality = 0.85): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error("Formato de imagen no soportado"));
            img.onload = () => {
                const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                const ctx = canvas.getContext("2d");
                if (!ctx) return reject(new Error("Canvas no disponible"));
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    });
