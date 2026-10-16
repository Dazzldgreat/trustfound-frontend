import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { API } from "../../config";
const DEFAULT_WEBSITE_SETTINGS = {
    primary_color: "#2563eb",
    secondary_color: "#1d4ed8",
    background_color: "#f3f4f6",
    text_color: "#374151",
    heading_color: "#111827",
    card_color: "#ffffff",
    button_text_color: "#ffffff",
    border_color: "#ffffff",
    border_line_color: "#e5e7eb",
    border_style: "solid",
    border_width: 1,
    border_radius: 16,
    content_width: 1152,
    font_family: "Inter",
};

function getStoredObject(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

function getSetting(settings, ...keys) {
    for (const key of keys) {
        if (
            settings?.[key] !== undefined &&
            settings?.[key] !== null &&
            settings?.[key] !== ""
        ) {
            return settings[key];
        }
    }

    return undefined;
}

function getWebsiteSettings(data) {
    const candidates = [
        data?.settings,
        data?.website_settings,
        data?.websiteSettings,
        data?.website?.settings,
        data,
    ];

    for (const candidate of candidates) {
        if (
            candidate &&
            typeof candidate === "object" &&
            !Array.isArray(candidate)
        ) {
            const hasSettings = [
                "primary_color",
                "primaryColor",
                "secondary_color",
                "secondaryColor",
                "background_color",
                "backgroundColor",
                "border_line_color",
                "borderLineColor",
                "border_color",
                "borderColor",
            ].some((key) => candidate[key] !== undefined);

            if (hasSettings) {
                return candidate;
            }
        }
    }

    return {};
}

function normalizeWebsiteSettings(raw = {}) {
    const settings = {
        ...DEFAULT_WEBSITE_SETTINGS,
    };

    const colorFields = [
        ["primary_color", ["primary_color", "primaryColor"]],
        ["secondary_color", ["secondary_color", "secondaryColor"]],
        ["background_color", ["background_color", "backgroundColor"]],
        ["text_color", ["text_color", "textColor"]],
        ["heading_color", ["heading_color", "headingColor"]],
        ["card_color", ["card_color", "cardColor"]],
        [
            "button_text_color",
            ["button_text_color", "buttonTextColor"],
        ],
        ["border_color", ["border_color", "borderColor"]],
        [
            "border_line_color",
            ["border_line_color", "borderLineColor"],
        ],
    ];

    colorFields.forEach(([field, aliases]) => {
        const value = getSetting(raw, ...aliases);

        if (
            typeof value === "string" &&
            /^(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)$/i.test(
                value.trim()
            )
        ) {
            settings[field] = value.trim();
        }
    });

    const borderStyle = getSetting(
        raw,
        "border_style",
        "borderStyle"
    );

    if (
        typeof borderStyle === "string" &&
        ["solid", "dashed", "dotted", "double", "none"].includes(
            borderStyle.toLowerCase()
        )
    ) {
        settings.border_style = borderStyle.toLowerCase();
    }

    const borderWidth = Number(
        getSetting(raw, "border_width", "borderWidth")
    );

    if (
        Number.isFinite(borderWidth) &&
        borderWidth >= 0 &&
        borderWidth <= 20
    ) {
        settings.border_width = borderWidth;
    }

    const borderRadius = Number(
        getSetting(raw, "border_radius", "borderRadius")
    );

    if (
        Number.isFinite(borderRadius) &&
        borderRadius >= 0 &&
        borderRadius <= 100
    ) {
        settings.border_radius = borderRadius;
    }

    const contentWidth = Number(
        getSetting(
            raw,
            "content_width",
            "contentWidth",
            "max_content_width",
            "maxContentWidth"
        )
    );

    if (
        Number.isFinite(contentWidth) &&
        contentWidth >= 320 &&
        contentWidth <= 2400
    ) {
        settings.content_width = contentWidth;
    }

    const fontFamily = getSetting(
        raw,
        "font_family",
        "fontFamily"
    );

    const allowedFonts = [
        "Inter",
        "Arial",
        "Roboto",
        "Poppins",
        "Open Sans",
        "Lato",
        "Montserrat",
        "Nunito",
        "system-ui",
        "Georgia",
        "Times New Roman",
    ];

    if (
        typeof fontFamily === "string" &&
        allowedFonts.includes(fontFamily)
    ) {
        settings.font_family = fontFamily;
    }

    return settings;
}

function LostItemDetails() {
    const { id, companySlug } = useParams();
    const navigate = useNavigate();

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [websiteSettings, setWebsiteSettings] = useState(
        DEFAULT_WEBSITE_SETTINGS
    );

    // =========================================================
    // COMPANY
    // =========================================================

    const storedCompany = getStoredObject("company");
    const storedUser = getStoredObject("user");

    const activeCompanySlug =
        companySlug ||
        localStorage.getItem("companySlug") ||
        localStorage.getItem("company_slug") ||
        storedCompany?.slug ||
        storedUser?.company_slug ||
        storedUser?.companySlug ||
        storedUser?.organization_slug ||
        storedUser?.organizationSlug ||
        "";

    // =========================================================
    // TOKEN
    // =========================================================

    const access =
        localStorage.getItem("access_token") ||
        localStorage.getItem("access");

    // =========================================================
    // COMPANY ROUTE
    // =========================================================

    const companyRoute = useCallback(
        (path = "") => {
            if (!activeCompanySlug) {
                return path || "/";
            }

            const cleanPath = path.startsWith("/")
                ? path
                : `/${path}`;

            return `/company/${encodeURIComponent(
                activeCompanySlug
            )}${cleanPath}`;
        },
        [activeCompanySlug]
    );

    // =========================================================
    // FETCH WEBSITE SETTINGS
    // =========================================================

    useEffect(() => {
        let cancelled = false;

        const fetchWebsiteSettings = async () => {
            if (!activeCompanySlug) {
                setWebsiteSettings(DEFAULT_WEBSITE_SETTINGS);
                return;
            }

            try {
                const response = await fetch(
                    `${API}/company/public/${encodeURIComponent(
                        activeCompanySlug
                    )}/website/`
                );

                if (!response.ok) {
                    throw new Error("Unable to load website settings.");
                }

                const data = await response.json();
                const rawSettings = getWebsiteSettings(data);
                const normalized = normalizeWebsiteSettings(
                    rawSettings
                );

                if (!cancelled) {
                    setWebsiteSettings(normalized);
                }
            } catch (err) {
                console.error("WEBSITE SETTINGS ERROR:", err);

                if (!cancelled) {
                    setWebsiteSettings(DEFAULT_WEBSITE_SETTINGS);
                }
            }
        };

        fetchWebsiteSettings();

        return () => {
            cancelled = true;
        };
    }, [activeCompanySlug]);

    // =========================================================
    // THEME STYLES
    // =========================================================

    const themeStyle = {
        "--primary-color": websiteSettings.primary_color,
        "--secondary-color": websiteSettings.secondary_color,
        "--page-background": websiteSettings.background_color,
        "--text-color": websiteSettings.text_color,
        "--heading-color": websiteSettings.heading_color,
        "--card-color": websiteSettings.card_color,
        "--button-text-color": websiteSettings.button_text_color,

        // Inside/background color of bordered elements
        "--border-fill-color": websiteSettings.border_color,

        // Actual border outline color
        "--border-line-color": websiteSettings.border_line_color,

        "--border-style": websiteSettings.border_style,
        "--border-width": `${websiteSettings.border_width}px`,
        "--border-radius": `${websiteSettings.border_radius}px`,
        "--content-width": `${websiteSettings.content_width}px`,
        "--font-family": `"${websiteSettings.font_family}", sans-serif`,
    };

    // =========================================================
    // FETCH REPORT
    // =========================================================

    useEffect(() => {
        let cancelled = false;

        const fetchReport = async () => {
            try {
                setLoading(true);
                setError("");

                if (!access) {
                    navigate(companyRoute("/login-page"));
                    return;
                }

                const response = await fetch(
                    `${API}/lost-items/${id}/`,
                    {
                        headers: {
                            Authorization: `Bearer ${access}`,
                        },
                    }
                );

                const data = await response.json();

                console.log("LOST ITEM DETAIL:", data);

                if (!response.ok) {
                    throw new Error(
                        data.error || "Unable to load lost item."
                    );
                }

                if (!cancelled) {
                    setReport(data);
                }
            } catch (err) {
                console.error("DETAIL ERROR:", err);

                if (!cancelled) {
                    setError(err.message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        if (id) {
            fetchReport();
        } else {
            setLoading(false);
            setError("Lost item ID is missing.");
        }

        return () => {
            cancelled = true;
        };
    }, [id, access, navigate, companyRoute]);

    // =========================================================
    // DELETE
    // =========================================================

    const handleDelete = async () => {
        if (
            !window.confirm(
                `Delete "${report?.item_name || "this item"}" report?`
            )
        ) {
            return;
        }

        try {
            const response = await fetch(
                `${API}/lost-items/${id}/`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${access}`,
                    },
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.error || "Unable to delete report."
                );
            }

            alert("Lost item report deleted successfully.");

            navigate(companyRoute("/dashboard"));
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div
                className="lost-details-theme min-h-screen flex items-center justify-center px-4"
                style={themeStyle}
            >
                <style>{`
                    .lost-details-theme {
                        background: var(--page-background);
                        color: var(--text-color);
                        font-family: var(--font-family);
                    }

                    .lost-details-theme .theme-heading {
                        color: var(--heading-color);
                    }

                    .lost-details-theme .theme-card {
                        background: var(--card-color);
                        border: var(--border-width) var(--border-style) var(--border-line-color);
                        border-radius: var(--border-radius);
                    }

                    .lost-details-theme .theme-primary {
                        background: var(--primary-color);
                        color: var(--button-text-color);
                    }

                    .lost-details-theme .theme-primary:hover {
                        background: var(--secondary-color);
                    }

                    .lost-details-theme .theme-link {
                        color: var(--primary-color);
                    }

                    .lost-details-theme .theme-outline {
                        border: var(--border-width) var(--border-style) var(--border-line-color);
                        background: var(--border-fill-color);
                    }

                    .lost-details-theme .theme-muted {
                        color: var(--text-color);
                        opacity: 0.75;
                    }

                    .lost-details-theme .theme-spinner {
                        border-color: var(--primary-color);
                        border-top-color: transparent;
                    }
                `}</style>

                <div className="text-center">
                    <div className="theme-spinner w-14 h-14 mx-auto rounded-full border-4 animate-spin" />

                    <h2 className="theme-heading mt-5 text-xl font-black">
                        Loading item...
                    </h2>

                    <p className="theme-muted mt-2">
                        Please wait while we retrieve the report.
                    </p>
                </div>
            </div>
        );
    }

    // =========================================================
    // ERROR
    // =========================================================

    if (error || !report) {
        return (
            <div
                className="lost-details-theme min-h-screen flex items-center justify-center px-6 py-8"
                style={themeStyle}
            >
                <style>{`
                    .lost-details-theme {
                        background: var(--page-background);
                        color: var(--text-color);
                        font-family: var(--font-family);
                    }

                    .lost-details-theme .theme-heading {
                        color: var(--heading-color);
                    }

                    .lost-details-theme .theme-card {
                        background: var(--card-color);
                        border: var(--border-width) var(--border-style) var(--border-line-color);
                        border-radius: var(--border-radius);
                    }

                    .lost-details-theme .theme-primary {
                        background: var(--primary-color);
                        color: var(--button-text-color);
                    }

                    .lost-details-theme .theme-primary:hover {
                        background: var(--secondary-color);
                    }

                    .lost-details-theme .theme-muted {
                        color: var(--text-color);
                        opacity: 0.75;
                    }
                `}</style>

                <div className="theme-card shadow-xl p-10 max-w-md w-full text-center">
                    <div className="text-6xl mb-5">📦</div>

                    <h1 className="theme-heading text-2xl font-black">
                        Item not found
                    </h1>

                    <p className="theme-muted mt-3">
                        {error ||
                            "This lost item could not be found."}
                    </p>

                    <button
                        onClick={() => navigate(-1)}
                        className="theme-primary mt-7 px-7 py-3 font-bold transition"
                        style={{
                            borderRadius: `${websiteSettings.border_radius}px`,
                        }}
                    >
                        ← Go Back
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================
    // STATUS
    // =========================================================

    const status = String(
        report.status || "Pending"
    ).toLowerCase();

    const isMatched = status === "matched";
    const isRecovered = status === "recovered";

    // =========================================================
    // IMAGE
    // =========================================================

    const imageUrl = report.image
        ? report.image.startsWith("http")
            ? report.image
            : `https://trustfound-backend.onrender.com${report.image}`
        : null;

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div
            className="lost-details-theme min-h-screen py-8 px-4 md:px-6"
            style={themeStyle}
        >
            <style>{`
                .lost-details-theme {
                    background: var(--page-background);
                    color: var(--text-color);
                    font-family: var(--font-family);
                }

                .lost-details-theme .theme-heading {
                    color: var(--heading-color);
                }

                .lost-details-theme .theme-card {
                    background: var(--card-color);
                    border: var(--border-width) var(--border-style) var(--border-line-color);
                    border-radius: var(--border-radius);
                }

                .lost-details-theme .theme-outline {
                    background: var(--border-fill-color);
                    border: var(--border-width) var(--border-style) var(--border-line-color);
                    border-radius: var(--border-radius);
                }

                .lost-details-theme .theme-primary {
                    background: var(--primary-color);
                    color: var(--button-text-color);
                }

                .lost-details-theme .theme-primary:hover {
                    background: var(--secondary-color);
                }

                .lost-details-theme .theme-link {
                    color: var(--primary-color);
                }

                .lost-details-theme .theme-muted {
                    color: var(--text-color);
                    opacity: 0.75;
                }

                .lost-details-theme .theme-text {
                    color: var(--text-color);
                }

                .lost-details-theme .theme-detail {
                    background: var(--border-fill-color);
                    border: var(--border-width) var(--border-style) var(--border-line-color);
                    border-radius: var(--border-radius);
                }

                .lost-details-theme .theme-section-divider {
                    border-color: var(--border-line-color);
                    border-style: var(--border-style);
                    border-width: var(--border-width);
                }

                .lost-details-theme .theme-image-panel {
                    background: var(--border-fill-color);
                    border-right: var(--border-width) var(--border-style) var(--border-line-color);
                }

                .lost-details-theme .theme-status {
                    border: var(--border-width) var(--border-style) var(--border-line-color);
                    background: var(--border-fill-color);
                    color: var(--primary-color);
                }

                .lost-details-theme .theme-notice {
                    background: var(--border-fill-color);
                    border: var(--border-width) var(--border-style) var(--border-line-color);
                    border-radius: var(--border-radius);
                }

                .lost-details-theme .theme-danger {
                    background: #dc2626;
                    color: #ffffff;
                }

                .lost-details-theme .theme-danger:hover {
                    background: #b91c1c;
                }

                .lost-details-theme button {
                    transition: background-color 150ms ease, opacity 150ms ease;
                }

                @media (max-width: 1023px) {
                    .lost-details-theme .theme-image-panel {
                        border-right: none;
                        border-bottom: var(--border-width) var(--border-style) var(--border-line-color);
                    }
                }
            `}</style>

            <div
                className="mx-auto"
                style={{
                    maxWidth: `${websiteSettings.content_width}px`,
                }}
            >
                {/* BACK */}

                <button
                    onClick={() => navigate(-1)}
                    className="mb-7 flex items-center gap-2 theme-link font-bold hover:underline"
                >
                    <span className="text-xl">←</span>
                    Back
                </button>

                {/* MAIN CARD */}

                <div className="theme-card shadow-xl overflow-hidden">
                    {/* HEADER */}

                    <div className="p-6 md:p-8 border-b theme-section-divider">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                            <div>
                                <p className="text-sm font-bold tracking-widest theme-link uppercase">
                                    Lost Item Report
                                </p>

                                <h1 className="theme-heading text-4xl md:text-5xl font-black mt-2 break-words">
                                    {report.item_name ||
                                        "Unnamed Item"}
                                </h1>

                                <p className="theme-muted mt-2">
                                    {report.category || "No category"}
                                </p>
                            </div>

                            {/* STATUS */}

                            <div>
                                <span
                                    className="theme-status inline-flex px-5 py-3 text-sm font-black"
                                    style={{
                                        borderRadius: "9999px",
                                    }}
                                >
                                    {report.status || "Pending"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ITEM CONTENT */}

                    <div className="grid lg:grid-cols-2 gap-0">
                        {/* IMAGE */}

                        <div className="theme-image-panel p-6 md:p-8 flex items-center justify-center min-h-[400px]">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={`${report.item_name || "Lost item"} image`}
                                    className="w-full max-h-[520px] object-cover shadow-lg"
                                    style={{
                                        borderRadius: `${websiteSettings.border_radius}px`,
                                        border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                                    }}
                                />
                            ) : (
                                <div className="text-center">
                                    <div className="text-8xl">📦</div>

                                    <p className="theme-muted mt-4">
                                        No image uploaded
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* INFORMATION */}

                        <div className="p-6 md:p-8">
                            {/* ITEM NAME */}

                            <div className="theme-outline p-5 mb-7">
                                <p className="text-sm theme-link font-bold uppercase tracking-wide">
                                    Item Name
                                </p>

                                <h2 className="theme-heading text-2xl md:text-3xl font-black mt-1">
                                    {report.item_name ||
                                        "Unnamed Item"}
                                </h2>
                            </div>

                            {/* DESCRIPTION */}

                            <div className="mb-7">
                                <h3 className="text-sm font-black uppercase tracking-wide theme-muted">
                                    Description
                                </h3>

                                <p className="mt-2 theme-text leading-relaxed">
                                    {report.description ||
                                        "No description provided."}
                                </p>
                            </div>

                            {/* DETAILS */}

                            <div className="grid sm:grid-cols-2 gap-5">
                                <Detail
                                    icon="📍"
                                    title="Lost Location"
                                    value={report.location}
                                />

                                <Detail
                                    icon="📅"
                                    title="Date Lost"
                                    value={report.date_lost}
                                />

                                <Detail
                                    icon="⏰"
                                    title="Time Lost"
                                    value={
                                        report.time_lost ||
                                        "Not provided"
                                    }
                                />

                                <Detail
                                    icon="👤"
                                    title="Contact Name"
                                    value={
                                        report.contact_name ||
                                        "Not provided"
                                    }
                                />

                                <Detail
                                    icon="📞"
                                    title="Phone"
                                    value={
                                        report.contact_phone ||
                                        "Not provided"
                                    }
                                />

                                <Detail
                                    icon="✉️"
                                    title="Email"
                                    value={
                                        report.contact_email ||
                                        "Not provided"
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* MATCHED NOTICE */}

                    {isMatched && (
                        <div className="mx-6 md:mx-8 mb-8">
                            <div className="theme-notice p-6">
                                <div className="flex gap-4">
                                    <div className="text-3xl">🔎</div>

                                    <div>
                                        <h2 className="theme-heading text-xl font-black">
                                            Your item has been matched
                                        </h2>

                                        <p className="theme-text mt-2">
                                            A possible match has been
                                            found for this lost item.
                                            Open the matched item
                                            details to continue the
                                            recovery process.
                                        </p>

                                        <button
                                            onClick={() =>
                                                navigate(
                                                    companyRoute(
                                                        `/customer-match/${report.id}`
                                                    )
                                                )
                                            }
                                            className="theme-primary mt-5 px-6 py-3 font-black"
                                            style={{
                                                borderRadius: `${websiteSettings.border_radius}px`,
                                            }}
                                        >
                                            View Matched Item →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RECOVERED NOTICE */}

                    {isRecovered && (
                        <div className="mx-6 md:mx-8 mb-8">
                            <div className="theme-notice p-6">
                                <h2 className="theme-heading text-xl font-black">
                                    Item Recovered ✓
                                </h2>

                                <p className="theme-text mt-2">
                                    This lost item has already been
                                    marked as recovered.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ACTIONS */}

                    {![
                        "matched",
                        "recovered",
                        "approved",
                    ].includes(status) && (
                        <div className="p-6 md:p-8 border-t theme-section-divider">
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* EDIT */}

                                <button
                                    onClick={() =>
                                        navigate(
                                            companyRoute(
                                                `/edit-lost-item/${id}`
                                            )
                                        )
                                    }
                                    className="theme-primary flex-1 px-7 py-4 font-black"
                                    style={{
                                        borderRadius: `${websiteSettings.border_radius}px`,
                                    }}
                                >
                                    ✏️ Edit Report
                                </button>

                                {/* DELETE */}

                                <button
                                    onClick={handleDelete}
                                    className="theme-danger flex-1 px-7 py-4 font-black"
                                    style={{
                                        borderRadius: `${websiteSettings.border_radius}px`,
                                    }}
                                >
                                    🗑️ Delete Report
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}

                <div className="text-center mt-7 text-sm theme-muted">
                    Report ID:{" "}
                    <span className="font-bold">
                        #{report.id}
                    </span>
                </div>
            </div>
        </div>
    );
}

// =============================================================
// DETAIL COMPONENT
// =============================================================

function Detail({ icon, title, value }) {
    return (
        <div className="lost-detail-card p-4">
            <div className="flex items-center gap-2">
                <span>{icon}</span>

                <p className="text-xs uppercase tracking-wide font-black lost-detail-label">
                    {title}
                </p>
            </div>

            <p className="mt-2 font-semibold lost-detail-value break-words">
                {value || "Not provided"}
            </p>

            <style>{`
                .lost-detail-card {
                    background: var(--border-fill-color);
                    border: var(--border-width) var(--border-style) var(--border-line-color);
                    border-radius: var(--border-radius);
                }

                .lost-detail-label {
                    color: var(--text-color);
                    opacity: 0.75;
                }

                .lost-detail-value {
                    color: var(--text-color);
                }
            `}</style>
        </div>
    );
}

export default LostItemDetails;
