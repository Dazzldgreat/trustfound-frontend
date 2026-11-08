import { useEffect, useState } from "react";
import { Download, X, ZoomIn, ZoomOut } from "lucide-react";

/* ============================================================
   GLOBAL IMAGE VIEWER
   Any <img className="... zoomable"> anywhere in the app opens
   here at full size when clicked, so users can see every detail
   of an item photo. Mounted once in App.jsx.
============================================================ */

export default function ImageViewer() {
    const [image, setImage] = useState(null);
    const [zoomed, setZoomed] = useState(false);

    useEffect(() => {
        const onClick = (event) => {
            const target = event.target;

            if (
                !(target instanceof HTMLImageElement) ||
                !target.classList.contains("zoomable") ||
                !target.currentSrc ||
                target.currentSrc.endsWith("/placeholder.svg")
            ) {
                return;
            }

            event.preventDefault();
            setZoomed(false);
            setImage({
                src: target.currentSrc || target.src,
                alt: target.alt || "Item photo",
            });
        };

        document.addEventListener("click", onClick);
        return () => document.removeEventListener("click", onClick);
    }, []);

    useEffect(() => {
        if (!image) return undefined;

        const onKey = (event) => {
            if (event.key === "Escape") setImage(null);
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKey);
        };
    }, [image]);

    if (!image) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={image.alt}
            className="fixed inset-0 z-[100] flex flex-col bg-stone-950/90 backdrop-blur-sm"
            onClick={() => setImage(null)}
        >
            {/* Toolbar */}
            <div
                className="flex items-center justify-between gap-3 px-4 py-3 text-white"
                onClick={(event) => event.stopPropagation()}
            >
                <p className="truncate text-sm font-semibold opacity-80">
                    {image.alt}
                </p>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setZoomed((value) => !value)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
                        aria-label={zoomed ? "Fit to screen" : "Zoom in"}
                        title={zoomed ? "Fit to screen" : "Zoom in"}
                    >
                        {zoomed ? <ZoomOut size={19} /> : <ZoomIn size={19} />}
                    </button>

                    <a
                        href={image.src}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
                        aria-label="Open original"
                        title="Open original"
                    >
                        <Download size={19} />
                    </a>

                    <button
                        type="button"
                        onClick={() => setImage(null)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary transition hover:bg-primary-dark"
                        aria-label="Close"
                        title="Close (Esc)"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Image */}
            <div
                className={`flex flex-1 p-4 ${
                    zoomed ? "items-start justify-start overflow-auto" : "items-center justify-center overflow-hidden"
                }`}
            >
                <img
                    src={image.src}
                    alt={image.alt}
                    onClick={(event) => {
                        event.stopPropagation();
                        setZoomed((value) => !value);
                    }}
                    className={`rounded-xl bg-white shadow-2xl ${
                        zoomed
                            ? "max-w-none cursor-zoom-out"
                            : "max-h-full max-w-full cursor-zoom-in object-contain"
                    }`}
                />
            </div>
        </div>
    );
}
