import { API_BASE_URL } from "./config";

/* ============================================================
   TRUSTFOUND BRAND — Orange & Graphite
   Single source of truth for brand colours and the default
   company website settings used by "Restore Defaults".
============================================================ */

export const BRAND = {
    primary: "#EA580C",
    primaryDark: "#C2410C",
    graphite: "#292524",
    background: "#FFF7ED",
    card: "#FFFFFF",
    text: "#44403C",
    muted: "#78716C",
    border: "#E9E1D8",
};

export const DEFAULT_WEBSITE_SETTINGS = {
    hero_title: "Welcome to our Lost & Found",
    hero_subtitle:
        "Helping our community reconnect with the things that matter.",
    about_title: "About our service",
    about_text:
        "We help people report lost belongings, register found items, and reconnect owners with their property.",
    template: "modern",

    primary_color: BRAND.primary,
    secondary_color: BRAND.graphite,
    background_color: BRAND.background,

    // Fill/background INSIDE bordered elements
    border_color: BRAND.card,

    // Visible border outline
    border_line_color: BRAND.border,

    border_style: "solid",
    border_width: 1,

    show_about: true,
    show_featured_items: true,
    show_contact: true,

    footer_text: "Helping people find what matters.",
    is_published: false,
    logo: null,
};

/* ============================================================
   COLOUR HELPERS
============================================================ */

function hexToRgb(hex) {
    const value = String(hex || "").replace("#", "").trim();

    if (!/^[0-9a-fA-F]{6}$/.test(value)) return null;

    return [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16),
    ];
}

/** Relative luminance (WCAG). */
function luminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map((channel) => {
        const c = channel / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** True when a background colour is light enough to need dark text. */
export function isLightColor(hex) {
    return luminance(hex) > 0.45;
}

/** Text colour that stays readable on the given background. */
export function readableTextColor(background, dark = BRAND.graphite, light = "#FFFFFF") {
    return isLightColor(background) ? dark : light;
}

/** Hex colour with alpha, e.g. withAlpha("#EA580C", 0.1). */
export function withAlpha(hex, alpha) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

/* ============================================================
   MEDIA URL
   Turns any image value the API returns (absolute URL, /media/…
   path, or bare media path) into a loadable URL.
============================================================ */

export const PLACEHOLDER_IMAGE = "/placeholder.svg";

export function resolveMediaUrl(value) {
    if (!value || typeof value !== "string") return "";

    let url = value.trim();

    // Fix malformed URLs such as http//host/...
    if (/^https?\/\//i.test(url)) {
        url = url.replace(/^(https?)\/\//i, "$1://");
    }

    // Fix doubled origins such as https://hosthttps://host/media/...
    const doubled = url.match(/^(https?:\/\/[^/]+)(https?:\/\/.+)$/i);
    if (doubled) url = doubled[2];

    if (
        /^(https?:)?\/\//i.test(url) ||
        url.startsWith("data:") ||
        url.startsWith("blob:")
    ) {
        return url;
    }

    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}
