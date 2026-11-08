import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    ArrowLeft,
    Calendar,
    MapPin,
    User,
    CheckCircle,
    ImageIcon,
    ShieldCheck,
    Loader2,
    AlertTriangle,
} from "lucide-react";

import { API, API_BASE_URL } from "../config";
const SERVER = API_BASE_URL;

const DEFAULT_SETTINGS = {
    primary_color: "#EA580C",
    secondary_color: "#C2410C",
    background_color: "#F6EFE7",
    text_color: "#57534E",
    heading_color: "#292524",
    card_color: "#ffffff",
    button_text_color: "#ffffff",
    border_color: "#ffffff",
    border_line_color: "#E9E1D8",
    border_style: "solid",
    border_width: 1,
    border_radius: 16,
    content_width: 1280,
    font_family: "Inter",
};


// ============================================================
// GET STORED OBJECT
// ============================================================

function getStoredObject(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
        return {};
    }
}


// ============================================================
// VALIDATE COLOR
// ============================================================

function getValidColor(value, fallback) {
    if (typeof value !== "string") {
        return fallback;
    }

    const color = value.trim();

    const valid =
        /^#[0-9a-f]{3,8}$/i.test(color) ||
        /^rgba?\([\d\s.,%/+-]+\)$/i.test(color) ||
        /^hsla?\([\d\s.,%/+-]+\)$/i.test(color) ||
        /^[a-z]+$/i.test(color);

    return valid ? color : fallback;
}


// ============================================================
// NORMALIZE WEBSITE SETTINGS
// ============================================================

function normalizeSettings(data) {
    const source =
        data?.settings ||
        data?.website_settings ||
        data?.websiteSettings ||
        data ||
        {};

    const borderStyles = [
        "solid",
        "dashed",
        "dotted",
        "double",
        "none",
    ];

    const borderWidth = Number(source.border_width);
    const borderRadius = Number(source.border_radius);
    const contentWidth = Number(source.content_width);

    const requestedFont = source.font_family;

    const fontFamily =
        typeof requestedFont === "string" &&
        requestedFont.trim() &&
        /^[a-zA-Z0-9 ,'"-]+$/.test(requestedFont)
            ? requestedFont
            : DEFAULT_SETTINGS.font_family;

    return {
        primary_color: getValidColor(
            source.primary_color,
            DEFAULT_SETTINGS.primary_color
        ),

        secondary_color: getValidColor(
            source.secondary_color,
            DEFAULT_SETTINGS.secondary_color
        ),

        background_color: getValidColor(
            source.background_color,
            DEFAULT_SETTINGS.background_color
        ),

        text_color: getValidColor(
            source.text_color,
            DEFAULT_SETTINGS.text_color
        ),

        heading_color: getValidColor(
            source.heading_color,
            DEFAULT_SETTINGS.heading_color
        ),

        card_color: getValidColor(
            source.card_color,
            DEFAULT_SETTINGS.card_color
        ),

        button_text_color: getValidColor(
            source.button_text_color,
            DEFAULT_SETTINGS.button_text_color
        ),

        // Fill inside bordered elements.
        border_color: getValidColor(
            source.border_color,
            DEFAULT_SETTINGS.border_color
        ),

        // Actual border stroke.
        border_line_color: getValidColor(
            source.border_line_color,
            DEFAULT_SETTINGS.border_line_color
        ),

        border_style: borderStyles.includes(source.border_style)
            ? source.border_style
            : DEFAULT_SETTINGS.border_style,

        border_width:
            Number.isFinite(borderWidth) &&
            borderWidth >= 0 &&
            borderWidth <= 12
                ? borderWidth
                : DEFAULT_SETTINGS.border_width,

        border_radius:
            Number.isFinite(borderRadius) &&
            borderRadius >= 0 &&
            borderRadius <= 100
                ? borderRadius
                : DEFAULT_SETTINGS.border_radius,

        content_width:
            Number.isFinite(contentWidth) &&
            contentWidth >= 320 &&
            contentWidth <= 2400
                ? contentWidth
                : DEFAULT_SETTINGS.content_width,

        font_family: fontFamily,
    };
}


// ============================================================
// IMAGE URL
// ============================================================

function getImageUrl(image) {
    if (!image || typeof image !== "string") {
        return "";
    }

    const cleanedImage = image.trim();

    if (
        cleanedImage.startsWith("http://") ||
        cleanedImage.startsWith("https://")
    ) {
        return cleanedImage;
    }

    if (cleanedImage.startsWith("/")) {
        return `${SERVER}${cleanedImage}`;
    }

    return `${SERVER}/${cleanedImage}`;
}


// ============================================================
// COMPONENT
// ============================================================

function ApprovedMatchDetail() {
    const { id, companySlug } = useParams();
    const navigate = useNavigate();

    // =========================================================
    // COMPANY
    // =========================================================

    const storedCompany = getStoredObject("company");
    const storedUser = getStoredObject("user");

    const activeCompanySlug =
        companySlug ||
        localStorage.getItem("companySlug") ||
        localStorage.getItem("company_slug") ||
        storedCompany.slug ||
        storedUser.company_slug ||
        storedUser.companySlug ||
        storedUser.organization_slug ||
        storedUser.organizationSlug ||
        "";

    // =========================================================
    // STATE
    // =========================================================

    const [loading, setLoading] = useState(true);
    const [match, setMatch] = useState(null);
    const [error, setError] = useState("");

    const [websiteSettings, setWebsiteSettings] = useState(
        DEFAULT_SETTINGS
    );

    // =========================================================
    // TOKEN
    // =========================================================

    const getAccessToken = () =>
        localStorage.getItem("access_token") ||
        localStorage.getItem("access");

    // =========================================================
    // COMPANY ROUTE
    // =========================================================

    const companyRoute = useCallback(
        (path = "") => {
            const cleanPath = path
                ? path.startsWith("/")
                    ? path
                    : `/${path}`
                : "";

            if (!activeCompanySlug) {
                return cleanPath || "/";
            }

            return `/company/${encodeURIComponent(
                activeCompanySlug
            )}${cleanPath}`;
        },
        [activeCompanySlug]
    );

    // =========================================================
    // LOAD COMPANY WEBSITE SETTINGS
    // =========================================================

    useEffect(() => {
        let cancelled = false;

        const loadWebsiteSettings = async () => {
            if (!activeCompanySlug) {
                setWebsiteSettings(DEFAULT_SETTINGS);
                return;
            }

            try {
                const response = await fetch(
                    `${API}/company/public/${encodeURIComponent(
                        activeCompanySlug
                    )}/website/`,
                    {
                        headers: {
                            Accept: "application/json",
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Unable to load website settings."
                    );
                }

                const data = await response.json();

                if (!cancelled) {
                    setWebsiteSettings(normalizeSettings(data));
                }
            } catch (err) {
                console.warn(
                    "WEBSITE SETTINGS ERROR:",
                    err
                );

                if (!cancelled) {
                    setWebsiteSettings(DEFAULT_SETTINGS);
                }
            }
        };

        loadWebsiteSettings();

        return () => {
            cancelled = true;
        };
    }, [activeCompanySlug]);

    // =========================================================
    // THEME STYLES
    // =========================================================

    const themeStyle = {
        "--match-primary": websiteSettings.primary_color,
        "--match-secondary": websiteSettings.secondary_color,
        "--match-background": websiteSettings.background_color,
        "--match-text": websiteSettings.text_color,
        "--match-heading": websiteSettings.heading_color,
        "--match-card": websiteSettings.card_color,
        "--match-button-text": websiteSettings.button_text_color,

        // Fill/interior of bordered elements.
        "--match-border-fill": websiteSettings.border_color,

        // Actual border stroke.
        "--match-border-line": websiteSettings.border_line_color,

        "--match-border-style": websiteSettings.border_style,
        "--match-border-width": `${websiteSettings.border_width}px`,
        "--match-radius": `${websiteSettings.border_radius}px`,
        "--match-content-width": `${websiteSettings.content_width}px`,
        "--match-font": websiteSettings.font_family,

        backgroundColor: websiteSettings.background_color,
        color: websiteSettings.text_color,
        fontFamily: websiteSettings.font_family,
    };

    // =========================================================
    // UNAUTHORIZED
    // =========================================================

    const handleUnauthorized = useCallback(() => {
        localStorage.removeItem("access");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");

        navigate(companyRoute("/login-page"), {
            replace: true,
        });
    }, [navigate, companyRoute]);

    // =========================================================
    // FETCH APPROVED MATCH
    // =========================================================

    useEffect(() => {
        let cancelled = false;

        const fetchMatch = async () => {
            const access = getAccessToken();

            if (!access) {
                handleUnauthorized();
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API}/staff/approved/${id}/`,
                    {
                        headers: {
                            Authorization: `Bearer ${access}`,
                            Accept: "application/json",
                        },
                    }
                );

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    handleUnauthorized();
                    return;
                }

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                        data.detail ||
                        "Unable to load approved match."
                    );
                }

                if (!cancelled) {
                    setMatch(data);
                }
            } catch (err) {
                console.error(
                    "APPROVED MATCH DETAIL ERROR:",
                    err
                );

                if (!cancelled) {
                    setError(
                        err.message ||
                        "Unable to load approved match."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchMatch();

        return () => {
            cancelled = true;
        };
    }, [id, handleUnauthorized]);

    // =========================================================
    // BACK
    // =========================================================

    const goBack = () => {
        navigate(companyRoute("/staff/approved-matches"));
    };

    // =========================================================
    // SHARED THEME CSS
    // =========================================================

    const themeCSS = `
        .approved-match-theme {
            background: var(--match-background);
            color: var(--match-text);
            font-family: var(--match-font);
        }

        .approved-match-theme .match-content {
            max-width: var(--match-content-width);
        }

        .approved-match-theme .match-card {
            background: var(--match-card);
            border: var(--match-border-width)
                var(--match-border-style)
                var(--match-border-line);
            border-radius: var(--match-radius);
        }

        .approved-match-theme .match-bordered-fill {
            background: var(--match-border-fill);
            border: var(--match-border-width)
                var(--match-border-style)
                var(--match-border-line);
            border-radius: var(--match-radius);
        }

        .approved-match-theme .match-heading {
            color: var(--match-heading);
        }

        .approved-match-theme .match-body-text {
            color: var(--match-text);
        }

        .approved-match-theme .match-primary-text {
            color: var(--match-primary);
        }

        .approved-match-theme .match-primary-button {
            background: var(--match-primary);
            color: var(--match-button-text);
            border: var(--match-border-width)
                var(--match-border-style)
                var(--match-border-line);
            border-radius: var(--match-radius);
        }

        .approved-match-theme .match-primary-button:hover {
            background: var(--match-secondary);
        }

        .approved-match-theme .match-soft-primary {
            background: color-mix(
                in srgb,
                var(--match-primary) 10%,
                white
            );
            color: var(--match-primary);
        }

        .approved-match-theme .match-divider {
            border-color: var(--match-border-line);
            border-style: var(--match-border-style);
            border-width: var(--match-border-width);
        }

        .approved-match-theme .match-section-header {
            background: var(--match-primary);
            color: var(--match-button-text);
        }

        .approved-match-theme .match-muted-panel {
            background: var(--match-border-fill);
            border: var(--match-border-width)
                var(--match-border-style)
                var(--match-border-line);
            border-radius: var(--match-radius);
        }
    `;

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div
                className="approved-match-theme min-h-screen flex items-center justify-center p-6"
                style={themeStyle}
            >
                <style>{themeCSS}</style>

                <div className="text-center">
                    <Loader2
                        size={50}
                        className="mx-auto animate-spin match-primary-text"
                    />

                    <p className="mt-4 font-semibold">
                        Loading approved match...
                    </p>
                </div>
            </div>
        );
    }

    // =========================================================
    // ERROR / NOT FOUND
    // =========================================================

    if (!match) {
        return (
            <div
                className="approved-match-theme min-h-screen p-6 md:p-10"
                style={themeStyle}
            >
                <style>{themeCSS}</style>

                <div className="match-content mx-auto">
                    <button
                        type="button"
                        onClick={goBack}
                        className="flex items-center gap-2 match-primary-text hover:opacity-80 font-semibold mb-8"
                    >
                        <ArrowLeft size={20} />
                        Back to Approved Matches
                    </button>

                    <div className="match-card p-10 text-center">
                        <AlertTriangle
                            size={60}
                            className="mx-auto text-red-500"
                        />

                        <h2 className="text-2xl font-bold match-heading mt-5">
                            Approved Match Not Found
                        </h2>

                        <p className="mt-3 text-red-600">
                            {error ||
                                "Unable to find this approved match."}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================
    // MAIN PAGE
    // =========================================================

    return (
        <div
            className="approved-match-theme min-h-screen p-4 md:p-8"
            style={themeStyle}
        >
            <style>{themeCSS}</style>

            <div className="match-content mx-auto">

                {/* BACK */}

                <button
                    type="button"
                    onClick={goBack}
                    className="flex items-center gap-2 match-primary-text hover:opacity-80 font-semibold mb-6"
                >
                    <ArrowLeft size={20} />
                    Back to Approved Matches
                </button>

                {/* HEADER */}

                <div className="match-card overflow-hidden mb-8 shadow-sm">
                    <div
                        className="p-6 md:p-8"
                        style={{
                            backgroundColor: websiteSettings.primary_color,
                            color: websiteSettings.button_text_color,
                        }}
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                            <div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle size={32} />

                                    <h1 className="text-3xl md:text-4xl font-black">
                                        Approved Match
                                    </h1>
                                </div>

                                <p className="mt-2 opacity-90">
                                    Match ID #{match.id}
                                </p>

                                {activeCompanySlug && (
                                    <p className="mt-1 text-sm opacity-90">
                                        Company:{" "}
                                        {storedCompany.name ||
                                            activeCompanySlug}
                                    </p>
                                )}
                            </div>

                            <span
                                className="px-5 py-2 rounded-full font-bold w-fit"
                                style={{
                                    backgroundColor: websiteSettings.card_color,
                                    color: websiteSettings.primary_color,
                                    border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                                }}
                            >
                                Approved
                            </span>
                        </div>
                    </div>
                </div>

                {/* ITEMS */}

                <div className="grid lg:grid-cols-2 gap-8 mb-8">

                    {/* LOST ITEM */}

                    <div className="match-card overflow-hidden shadow-sm">
                        <div
                            className="px-6 py-5"
                            style={{
                                backgroundColor: websiteSettings.secondary_color,
                                color: websiteSettings.button_text_color,
                            }}
                        >
                            <h2 className="text-2xl font-bold">
                                Lost Item
                            </h2>

                            <p className="text-sm mt-1 opacity-90">
                                Item reported by the customer
                            </p>
                        </div>

                        <div className="p-6">
                            {match.lost_item?.image ? (
                                <img
                                    src={getImageUrl(
                                        match.lost_item.image
                                    )}
                                    alt={
                                        match.lost_item.item_name ||
                                        "Lost item"
                                    }
                                    className="w-full h-72 object-cover mb-6"
                                    style={{
                                        borderRadius: `${websiteSettings.border_radius}px`,
                                        border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                                    }}
                                />
                            ) : (
                                <div
                                    className="h-72 flex items-center justify-center mb-6 match-bordered-fill"
                                >
                                    <ImageIcon
                                        size={60}
                                        className="opacity-50"
                                    />
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm opacity-70">
                                        Item Name
                                    </p>

                                    <p className="text-xl font-bold match-heading">
                                        {match.lost_item?.item_name ||
                                            "Not provided"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm opacity-70">
                                        Category
                                    </p>

                                    <p className="font-semibold">
                                        {match.lost_item?.category ||
                                            "Not provided"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm opacity-70">
                                        Description
                                    </p>

                                    <p>
                                        {match.lost_item?.description ||
                                            "No description provided."}
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <MapPin
                                        size={19}
                                        className="match-primary-text mt-0.5 shrink-0"
                                    />

                                    <div>
                                        <p className="text-sm opacity-70">
                                            Lost Location
                                        </p>

                                        <p className="font-medium">
                                            {match.lost_item?.location ||
                                                "Not provided"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar
                                        size={19}
                                        className="match-primary-text mt-0.5 shrink-0"
                                    />

                                    <div>
                                        <p className="text-sm opacity-70">
                                            Date Lost
                                        </p>

                                        <p className="font-medium">
                                            {match.lost_item?.date_lost ||
                                                "Not provided"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FOUND ITEM */}

                    <div className="match-card overflow-hidden shadow-sm">
                        <div
                            className="px-6 py-5"
                            style={{
                                backgroundColor: websiteSettings.primary_color,
                                color: websiteSettings.button_text_color,
                            }}
                        >
                            <h2 className="text-2xl font-bold">
                                Found Item
                            </h2>

                            <p className="text-sm mt-1 opacity-90">
                                Item received by the company
                            </p>
                        </div>

                        <div className="p-6">
                            {match.found_item?.image ? (
                                <img
                                    src={getImageUrl(
                                        match.found_item.image
                                    )}
                                    alt={
                                        match.found_item.item_name ||
                                        "Found item"
                                    }
                                    className="w-full h-72 object-cover mb-6"
                                    style={{
                                        borderRadius: `${websiteSettings.border_radius}px`,
                                        border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                                    }}
                                />
                            ) : (
                                <div className="h-72 flex items-center justify-center mb-6 match-bordered-fill">
                                    <ImageIcon
                                        size={60}
                                        className="opacity-50"
                                    />
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm opacity-70">
                                        Item Name
                                    </p>

                                    <p className="text-xl font-bold match-heading">
                                        {match.found_item?.item_name ||
                                            "Not provided"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm opacity-70">
                                        Category
                                    </p>

                                    <p className="font-semibold">
                                        {match.found_item?.category ||
                                            "Not provided"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm opacity-70">
                                        Description
                                    </p>

                                    <p>
                                        {match.found_item?.description ||
                                            "No description provided."}
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <User
                                        size={19}
                                        className="match-primary-text mt-0.5 shrink-0"
                                    />

                                    <div>
                                        <p className="text-sm opacity-70">
                                            Finder
                                        </p>

                                        <p className="font-medium">
                                            {match.found_item?.finder ||
                                                match.found_item?.contact_name ||
                                                "Not provided"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <MapPin
                                        size={19}
                                        className="match-primary-text mt-0.5 shrink-0"
                                    />

                                    <div>
                                        <p className="text-sm opacity-70">
                                            Found Location
                                        </p>

                                        <p className="font-medium">
                                            {match.found_item?.location_found ||
                                                match.found_item?.location ||
                                                "Not provided"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar
                                        size={19}
                                        className="match-primary-text mt-0.5 shrink-0"
                                    />

                                    <div>
                                        <p className="text-sm opacity-70">
                                            Date Found
                                        </p>

                                        <p className="font-medium">
                                            {match.found_item?.date_found ||
                                                "Not provided"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CUSTOMER */}

                {(match.lost_item?.contact_name ||
                    match.lost_item?.contact_phone ||
                    match.lost_item?.contact_email) && (
                    <div className="match-card p-6 md:p-8 mb-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <User
                                className="match-primary-text"
                                size={28}
                            />

                            <div>
                                <h2 className="text-2xl font-bold match-heading">
                                    Customer Information
                                </h2>

                                <p>
                                    Customer associated with this lost item
                                </p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-5">
                            <div className="match-muted-panel p-5">
                                <p className="text-sm opacity-70">
                                    Name
                                </p>

                                <p className="font-bold text-lg mt-1 match-heading">
                                    {match.lost_item?.contact_name ||
                                        "Not provided"}
                                </p>
                            </div>

                            <div className="match-muted-panel p-5">
                                <p className="text-sm opacity-70">
                                    Phone
                                </p>

                                <p className="font-bold text-lg mt-1 match-heading">
                                    {match.lost_item?.contact_phone ||
                                        "Not provided"}
                                </p>
                            </div>

                            <div className="match-muted-panel p-5">
                                <p className="text-sm opacity-70">
                                    Email
                                </p>

                                <p className="font-bold text-lg mt-1 break-all match-heading">
                                    {match.lost_item?.contact_email ||
                                        "Not provided"}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* MATCH INFORMATION */}

                <div className="match-card p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <ShieldCheck
                            className="match-primary-text"
                            size={30}
                        />

                        <div>
                            <h2 className="text-2xl font-bold match-heading">
                                Match Information
                            </h2>

                            <p>
                                Approval and matching details
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">

                        {/* APPROVED BY */}

                        <div className="match-muted-panel p-6">
                            <ShieldCheck
                                className="match-primary-text mb-4"
                                size={30}
                            />

                            <h3 className="font-semibold opacity-70">
                                Approved By
                            </h3>

                            <p className="text-xl font-bold mt-2 match-heading">
                                {match.approved_by ||
                                    match.approval?.approved_by ||
                                    "Not available"}
                            </p>
                        </div>

                        {/* APPROVAL DATE */}

                        <div className="match-muted-panel p-6">
                            <Calendar
                                className="match-primary-text mb-4"
                                size={30}
                            />

                            <h3 className="font-semibold opacity-70">
                                Approval Date
                            </h3>

                            <p className="font-medium mt-2">
                                {match.approved_at ||
                                match.approval?.approved_at
                                    ? new Date(
                                        match.approved_at ||
                                        match.approval?.approved_at
                                    ).toLocaleString()
                                    : "Not available"}
                            </p>
                        </div>

                        {/* CONFIDENCE */}

                        <div className="match-muted-panel p-6">
                            <CheckCircle
                                className="match-primary-text mb-4"
                                size={30}
                            />

                            <h3 className="font-semibold opacity-70">
                                Confidence Score
                            </h3>

                            <p className="text-3xl font-black match-primary-text mt-2">
                                {Number(
                                    match.confidence ??
                                    match.confidence_score ??
                                    0
                                ).toFixed(1)}
                                %
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default ApprovedMatchDetail;