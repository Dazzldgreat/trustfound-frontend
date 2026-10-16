import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    MapPin,
    Package,
    RefreshCw,
    ShieldCheck,
    XCircle,
} from "lucide-react";

import { API } from "../../config";
const API_ORIGIN = API.replace("/api", "");

const DEFAULT_WEBSITE_SETTINGS = {
    primary_color: "#2563eb",
    secondary_color: "#164ed1",
    background_color: "#f8fafc",
    text_color: "#475569",
    heading_color: "#0f172a",
    card_color: "#ffffff",
    button_text_color: "#ffffff",

    // Border Color = inside/fill of bordered elements.
    border_color: "#ffffff",

    // Border Line Color = actual border stroke.
    border_line_color: "#e2e8f0",

    border_style: "solid",
    border_width: 1,
    border_radius: 16,
    content_width: 1280,
    font_family: "system-ui, sans-serif",
};

const isValidColor = (value) =>
    typeof value === "string" &&
    /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(
        value.trim()
    );

const safeColor = (value, fallback) =>
    isValidColor(value) ? value.trim() : fallback;

const safeNumber = (value, fallback, min, max) => {
    const number = Number(value);

    return Number.isFinite(number)
        ? Math.min(max, Math.max(min, number))
        : fallback;
};

const safeBorderStyle = (value) =>
    ["solid", "dashed", "dotted", "double", "none"].includes(
        value
    )
        ? value
        : "solid";

const safeFontFamily = (value) => {
    if (typeof value !== "string" || !value.trim()) {
        return DEFAULT_WEBSITE_SETTINGS.font_family;
    }

    // Prevent CSS injection through the settings response.
    if (/[;{}<>]/.test(value)) {
        return DEFAULT_WEBSITE_SETTINGS.font_family;
    }

    return value.trim();
};

function CustomerMatchDetail() {
    const navigate = useNavigate();
    const { id, companySlug } = useParams();

    // =========================================================
    // STORAGE
    // =========================================================

    const getStoredObject = (key) => {
        try {
            return JSON.parse(localStorage.getItem(key) || "{}");
        } catch {
            return {};
        }
    };

    const storedCompany = getStoredObject("company");
    const storedUser = getStoredObject("user");

    const access =
        localStorage.getItem("access_token") ||
        localStorage.getItem("access");

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
    // COMPANY ROUTE
    // =========================================================

    const companyRoute = useCallback(
        (path = "") => {
            if (!activeCompanySlug) {
                return path || "/";
            }

            return `/company/${encodeURIComponent(
                activeCompanySlug
            )}${path}`;
        },
        [activeCompanySlug]
    );

    // =========================================================
    // STATE
    // =========================================================

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(false);
    const [error, setError] = useState("");

    const [websiteSettings, setWebsiteSettings] = useState(
        DEFAULT_WEBSITE_SETTINGS
    );

    // =========================================================
    // WEBSITE SETTINGS
    // =========================================================

    const applyWebsiteTheme = useCallback((rawSettings = {}) => {
        const settings = {
            ...DEFAULT_WEBSITE_SETTINGS,
            ...(rawSettings || {}),
        };

        const nextSettings = {
            primary_color: safeColor(
                settings.primary_color,
                DEFAULT_WEBSITE_SETTINGS.primary_color
            ),
            secondary_color: safeColor(
                settings.secondary_color,
                DEFAULT_WEBSITE_SETTINGS.secondary_color
            ),
            background_color: safeColor(
                settings.background_color,
                DEFAULT_WEBSITE_SETTINGS.background_color
            ),
            text_color: safeColor(
                settings.text_color,
                DEFAULT_WEBSITE_SETTINGS.text_color
            ),
            heading_color: safeColor(
                settings.heading_color,
                DEFAULT_WEBSITE_SETTINGS.heading_color
            ),
            card_color: safeColor(
                settings.card_color,
                DEFAULT_WEBSITE_SETTINGS.card_color
            ),
            button_text_color: safeColor(
                settings.button_text_color,
                DEFAULT_WEBSITE_SETTINGS.button_text_color
            ),
            border_color: safeColor(
                settings.border_color,
                DEFAULT_WEBSITE_SETTINGS.border_color
            ),
            border_line_color: safeColor(
                settings.border_line_color,
                DEFAULT_WEBSITE_SETTINGS.border_line_color
            ),
            border_style: safeBorderStyle(
                settings.border_style
            ),
            border_width: safeNumber(
                settings.border_width,
                DEFAULT_WEBSITE_SETTINGS.border_width,
                0,
                10
            ),
            border_radius: safeNumber(
                settings.border_radius,
                DEFAULT_WEBSITE_SETTINGS.border_radius,
                0,
                60
            ),
            content_width: safeNumber(
                settings.content_width,
                DEFAULT_WEBSITE_SETTINGS.content_width,
                320,
                2400
            ),
            font_family: safeFontFamily(settings.font_family),
        };

        setWebsiteSettings(nextSettings);
    }, []);

    const fetchWebsiteSettings = useCallback(async () => {
        if (!activeCompanySlug) {
            applyWebsiteTheme(DEFAULT_WEBSITE_SETTINGS);
            return;
        }

        try {
            const response = await fetch(
                `${API}/company/public/${encodeURIComponent(
                    activeCompanySlug
                )}/website/`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            if (!response.ok) {
                console.warn(
                    "Unable to load company website settings."
                );
                return;
            }

            const data = await response.json();

            // Support settings returned directly or nested in the
            // public website/company response.
            const settings =
                data.settings ||
                data.website_settings ||
                data.websiteSettings ||
                data;

            applyWebsiteTheme(settings);
        } catch (err) {
            console.error(
                "FETCH WEBSITE SETTINGS ERROR:",
                err
            );
        }
    }, [activeCompanySlug, applyWebsiteTheme]);

    useEffect(() => {
        fetchWebsiteSettings();
    }, [fetchWebsiteSettings]);

    // =========================================================
    // THEME VARIABLES
    // =========================================================

    const themeStyle = {
        "--company-primary": websiteSettings.primary_color,
        "--company-secondary": websiteSettings.secondary_color,
        "--company-background": websiteSettings.background_color,
        "--company-text": websiteSettings.text_color,
        "--company-heading": websiteSettings.heading_color,
        "--company-card": websiteSettings.card_color,
        "--company-button-text": websiteSettings.button_text_color,

        // Separate settings: fill versus border stroke.
        "--company-border-color": websiteSettings.border_color,
        "--company-border-line-color":
            websiteSettings.border_line_color,

        "--company-border-style": websiteSettings.border_style,
        "--company-border-width": `${websiteSettings.border_width}px`,
        "--company-border-radius": `${websiteSettings.border_radius}px`,
        "--company-content-width": `${websiteSettings.content_width}px`,
        "--company-font-family": websiteSettings.font_family,
    };

    // =========================================================
    // IMAGE URL
    // =========================================================

    const getImageUrl = (image) => {
        if (!image) return "";

        const value = String(image).trim();

        if (
            value.startsWith("http://") ||
            value.startsWith("https://")
        ) {
            return value;
        }

        if (value.startsWith("/")) {
            return `${API_ORIGIN}${value}`;
        }

        return `${API_ORIGIN}/${value}`;
    };

    // =========================================================
    // FETCH MATCH
    // =========================================================

    const fetchMatch = useCallback(async () => {
        if (!access) {
            setError(
                "Your session has expired. Please log in again."
            );
            setLoading(false);
            return;
        }

        if (!id) {
            setError("Match ID is missing.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API}/matches/${encodeURIComponent(id)}/`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${access}`,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            console.log("CUSTOMER MATCH DETAIL:", data);

            if (!response.ok) {
                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    localStorage.removeItem("access");
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh");
                    localStorage.removeItem("refresh_token");

                    navigate(
                        companyRoute("/login-page"),
                        { replace: true }
                    );

                    return;
                }

                throw new Error(
                    data.detail ||
                        data.error ||
                        "Unable to load match."
                );
            }

            setMatch(data);
        } catch (err) {
            console.error("FETCH MATCH ERROR:", err);
            setError(err.message || "Unable to load match.");
        } finally {
            setLoading(false);
        }
    }, [access, id, companyRoute, navigate]);

    useEffect(() => {
        fetchMatch();
    }, [fetchMatch]);

    // =========================================================
    // CUSTOMER RESPONSE
    // =========================================================

    const respondToMatch = async (responseType) => {
        if (responding) return;

        const message =
            responseType === "Accepted"
                ? "Are you sure this is your item?"
                : "Are you sure you want to reject this match?";

        if (!window.confirm(message)) {
            return;
        }

        try {
            setResponding(true);

            const response = await fetch(
                `${API}/matches/${encodeURIComponent(
                    id
                )}/customer-response/`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${access}`,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        customer_response: responseType,
                    }),
                }
            );

            const data = await response.json();

            console.log("CUSTOMER RESPONSE:", data);

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                        data.error ||
                        "Unable to submit response."
                );
            }

            alert(
                responseType === "Accepted"
                    ? "Match accepted successfully."
                    : "Match rejected successfully."
            );

            await fetchMatch();
        } catch (err) {
            console.error("CUSTOMER RESPONSE ERROR:", err);

            alert(
                err.message || "Unable to submit response."
            );
        } finally {
            setResponding(false);
        }
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div
                style={themeStyle}
                className="customer-match-theme min-h-screen bg-slate-50 flex items-center justify-center px-4"
            >
                <div className="settings-surface border border-slate-200 rounded-3xl shadow-xl p-10 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center">
                        <RefreshCw
                            size={28}
                            className="text-blue-600 animate-spin"
                        />
                    </div>

                    <h2 className="text-xl font-black text-slate-900 mt-5">
                        Loading match...
                    </h2>

                    <p className="text-sm text-slate-500 mt-2">
                        Please wait while we load the match details.
                    </p>
                </div>
            </div>
        );
    }

    // =========================================================
    // SESSION ERROR
    // =========================================================

    if (!access) {
        return (
            <div
                style={themeStyle}
                className="customer-match-theme min-h-screen bg-slate-50 flex items-center justify-center px-4"
            >
                <div className="settings-surface border border-slate-200 rounded-3xl shadow-xl p-10 text-center max-w-md">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                        <XCircle size={30} />
                    </div>

                    <h1 className="text-2xl font-black text-slate-900 mt-5">
                        Session Expired
                    </h1>

                    <p className="text-slate-500 mt-3">
                        Please log in again to continue.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(companyRoute("/login-page"))
                        }
                        className="company-primary-button mt-6 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl font-bold"
                    >
                        Login
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================
    // MATCH ERROR
    // =========================================================

    if (error || !match) {
        return (
            <div
                style={themeStyle}
                className="customer-match-theme min-h-screen bg-slate-50 flex items-center justify-center px-4"
            >
                <div className="settings-surface border border-slate-200 rounded-3xl shadow-xl p-10 text-center max-w-md">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                        <XCircle size={30} />
                    </div>

                    <h1 className="text-2xl font-black text-slate-900 mt-5">
                        Unable to load match
                    </h1>

                    <p className="text-slate-500 mt-3">
                        {error || "Match not found."}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                        <button
                            type="button"
                            onClick={fetchMatch}
                            className="company-primary-button inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
                        >
                            <RefreshCw size={17} />
                            Try Again
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(companyRoute("/dashboard"))
                            }
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-3 rounded-xl font-bold"
                        >
                            Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================
    // NORMALIZED STATUS
    // =========================================================

    const matchStatus = String(match.status || "")
        .trim()
        .toLowerCase();

    const customerResponse = String(
        match.customer_response || ""
    )
        .trim()
        .toLowerCase();

    const isApproved =
        matchStatus === "approved" ||
        match.is_approved === true ||
        match.approved === true;

    const isRecoveryRequested =
        matchStatus === "recovery requested" ||
        match.is_recovery_requested === true;

    const isRecovered =
        matchStatus === "recovered" ||
        match.is_recovered === true ||
        match.recovered === true;

    const customerAccepted = customerResponse === "accepted";
    const customerRejected = customerResponse === "rejected";

    const customerPending =
        customerResponse === "pending" ||
        customerResponse === "";

    // =========================================================
    // STATUS DISPLAY
    // =========================================================

    let statusText = match.status || "Pending";

    let statusClass =
        "bg-amber-50 text-amber-700 border-amber-200";

    if (isRecovered) {
        statusText = "RECOVERED";
        statusClass =
            "bg-purple-50 text-purple-700 border-purple-200";
    } else if (isRecoveryRequested) {
        statusText = "RECOVERY REQUESTED";
        statusClass =
            "bg-indigo-50 text-indigo-700 border-indigo-200";
    } else if (isApproved) {
        statusText = "APPROVED";
        statusClass =
            "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (customerRejected) {
        statusText = "REJECTED";
        statusClass =
            "bg-red-50 text-red-700 border-red-200";
    } else if (matchStatus === "matched") {
        statusText = "MATCHED";
        statusClass =
            "bg-blue-50 text-blue-700 border-blue-200";
    }

    // =========================================================
    // ITEM DATA
    // =========================================================

    const lostItem = match.lost_item || {};
    const foundItem = match.found_item || {};

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <>
            <style>{`
                .customer-match-theme {
                    background-color: var(--company-background) !important;
                    color: var(--company-text);
                    font-family: var(--company-font-family);
                }

                .customer-match-theme .settings-surface {
                    background-color: var(--company-border-color) !important;
                    border-color: var(--company-border-line-color) !important;
                    border-style: var(--company-border-style) !important;
                    border-width: var(--company-border-width) !important;
                    border-radius: var(--company-border-radius) !important;
                }

                .customer-match-theme .bg-white {
                    background-color: var(--company-card) !important;
                }

                .customer-match-theme .text-slate-900 {
                    color: var(--company-heading) !important;
                }

                .customer-match-theme .text-slate-700,
                .customer-match-theme .text-slate-600,
                .customer-match-theme .text-slate-500 {
                    color: var(--company-text) !important;
                }

                .customer-match-theme .border-slate-200,
                .customer-match-theme .border-slate-100 {
                    border-color: var(--company-border-line-color) !important;
                    border-style: var(--company-border-style) !important;
                    border-width: var(--company-border-width) !important;
                }

                .customer-match-theme .rounded-xl {
                    border-radius: var(--company-border-radius);
                }

                .customer-match-theme .rounded-2xl {
                    border-radius: var(--company-border-radius);
                }

                .customer-match-theme .rounded-3xl {
                    border-radius: var(--company-border-radius);
                }

                .customer-match-theme .company-primary-button {
                    background-color: var(--company-primary) !important;
                    color: var(--company-button-text) !important;
                    border-color: var(--company-primary) !important;
                }

                .customer-match-theme .company-primary-button:hover {
                    filter: brightness(0.94);
                }

                .customer-match-theme .text-blue-600,
                .customer-match-theme .text-indigo-600 {
                    color: var(--company-primary) !important;
                }

                .customer-match-theme .bg-blue-600,
                .customer-match-theme .bg-indigo-600 {
                    background-color: var(--company-primary) !important;
                    color: var(--company-button-text) !important;
                }

                .customer-match-theme .settings-content {
                    width: 100%;
                    max-width: var(--company-content-width);
                    margin-left: auto;
                    margin-right: auto;
                }
            `}</style>

            <div
                style={themeStyle}
                className="customer-match-theme min-h-screen py-8 px-4"
            >
                <div className="settings-content">

                    {/* BACK */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate(companyRoute("/dashboard"))
                        }
                        className="inline-flex items-center gap-2 mb-6 text-slate-600 hover:text-blue-600 font-bold transition"
                    >
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </button>

                    {/* MAIN CARD */}

                    <div className="settings-surface bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">

                        {/* HEADER */}

                        <div className="p-6 md:p-8 border-b border-slate-200">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck
                                            size={18}
                                            className="text-blue-600"
                                        />

                                        <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">
                                            Customer Match Details
                                        </p>
                                    </div>

                                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-2">
                                        {lostItem.item_name ||
                                            foundItem.item_name ||
                                            "Matched Item"}
                                    </h1>

                                    <p className="text-slate-500 mt-2">
                                        A lost item has been matched
                                        with a found item.
                                    </p>
                                </div>

                                <div
                                    className={`inline-flex items-center justify-center px-6 py-3 rounded-full border font-black ${statusClass}`}
                                >
                                    {statusText}
                                </div>
                            </div>
                        </div>

                        {/* ITEMS */}

                        <div className="grid lg:grid-cols-2 gap-6 p-6 md:p-8">

                            {/* LOST ITEM */}

                            <div className="settings-surface border border-slate-200 rounded-2xl overflow-hidden">
                                <div className="bg-red-50 border-b border-red-100 p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                                            <Package size={21} />
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase tracking-wider font-bold text-red-500">
                                                Customer Report
                                            </p>

                                            <h2 className="text-xl font-black text-red-700">
                                                Lost Item
                                            </h2>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5">
                                    {getImageUrl(lostItem.image) ? (
                                        <img
                                            src={getImageUrl(lostItem.image)}
                                            alt={lostItem.item_name || "Lost item"}
                                            className="w-full h-72 object-cover rounded-2xl border border-slate-200"
                                        />
                                    ) : (
                                        <div className="w-full h-72 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                            <div className="text-center">
                                                <Package
                                                    size={36}
                                                    className="mx-auto"
                                                />
                                                <p className="mt-2 font-semibold">
                                                    No Image
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <h3 className="text-2xl font-black text-slate-900 mt-5">
                                        {lostItem.item_name || "Unknown Item"}
                                    </h3>

                                    <p className="text-slate-500 mt-1">
                                        {lostItem.category || "No category"}
                                    </p>

                                    <div className="mt-6 space-y-4 text-sm">
                                        <InfoRow
                                            label="Description"
                                            value={lostItem.description}
                                        />

                                        <InfoRow
                                            label="Location Lost"
                                            value={lostItem.location}
                                            icon={<MapPin size={15} />}
                                        />

                                        <InfoRow
                                            label="Date Lost"
                                            value={lostItem.date_lost}
                                            icon={<Clock3 size={15} />}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* FOUND ITEM */}

                            <div className="settings-surface border border-slate-200 rounded-2xl overflow-hidden">
                                <div className="bg-emerald-50 border-b border-emerald-100 p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                            <Package size={21} />
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase tracking-wider font-bold text-emerald-500">
                                                Matching Report
                                            </p>

                                            <h2 className="text-xl font-black text-emerald-700">
                                                Found Item
                                            </h2>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5">
                                    {getImageUrl(foundItem.image) ? (
                                        <img
                                            src={getImageUrl(foundItem.image)}
                                            alt={foundItem.item_name || "Found item"}
                                            className="w-full h-72 object-cover rounded-2xl border border-slate-200"
                                        />
                                    ) : (
                                        <div className="w-full h-72 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                            <div className="text-center">
                                                <Package
                                                    size={36}
                                                    className="mx-auto"
                                                />
                                                <p className="mt-2 font-semibold">
                                                    No Image
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <h3 className="text-2xl font-black text-slate-900 mt-5">
                                        {foundItem.item_name || "Unknown Item"}
                                    </h3>

                                    <p className="text-slate-500 mt-1">
                                        {foundItem.category || "No category"}
                                    </p>

                                    <div className="mt-6 space-y-4 text-sm">
                                        <InfoRow
                                            label="Description"
                                            value={foundItem.description}
                                        />

                                        <InfoRow
                                            label="Location Found"
                                            value={foundItem.location_found}
                                            icon={<MapPin size={15} />}
                                        />

                                        <InfoRow
                                            label="Date Found"
                                            value={foundItem.date_found}
                                            icon={<Clock3 size={15} />}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MATCH ANALYSIS */}

                        <div className="px-6 md:px-8 pb-8">
                            <div className="settings-surface bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                <h2 className="text-2xl font-black text-slate-900">
                                    Match Analysis
                                </h2>

                                <p className="text-sm text-slate-500 mt-1">
                                    Comparison scores generated for this match.
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                                    <Score
                                        title="Overall"
                                        value={match.confidence_score}
                                        main
                                    />

                                    <Score
                                        title="Name"
                                        value={match.name_score}
                                    />

                                    <Score
                                        title="Description"
                                        value={match.description_score}
                                    />

                                    <Score
                                        title="Location"
                                        value={match.location_score}
                                    />

                                    <Score
                                        title="Image AI"
                                        value={match.image_score}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* STAFF APPROVAL */}

                        {(isApproved ||
                            isRecoveryRequested ||
                            isRecovered) && (
                            <div className="px-6 md:px-8 pb-8">
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck
                                            size={22}
                                            className="text-blue-600"
                                        />

                                        <h2 className="text-xl font-black text-blue-700">
                                            Staff Approval
                                        </h2>
                                    </div>

                                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                                        <InfoRow
                                            label="Approved By"
                                            value={
                                                match.approved_by ||
                                                "Staff member"
                                            }
                                        />

                                        <InfoRow
                                            label="Approved At"
                                            value={
                                                match.approved_at ||
                                                "Recorded in system"
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CUSTOMER RESPONSE */}

                        <div className="px-6 md:px-8 pb-8">
                            <div className="settings-surface border border-slate-200 rounded-2xl p-6">
                                <h2 className="text-xl font-black text-slate-900">
                                    Customer Response
                                </h2>

                                <p className="text-sm text-slate-500 mt-2">
                                    Current response
                                </p>

                                <span
                                    className={`inline-flex mt-3 px-4 py-2 rounded-full font-bold ${
                                        customerAccepted
                                            ? "bg-emerald-50 text-emerald-700"
                                            : customerRejected
                                            ? "bg-red-50 text-red-700"
                                            : "bg-amber-50 text-amber-700"
                                    }`}
                                >
                                    {match.customer_response || "Pending"}
                                </span>

                                {/* ACCEPT / REJECT */}

                                {isApproved &&
                                    !isRecoveryRequested &&
                                    !isRecovered &&
                                    customerPending && (
                                        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
                                            <h3 className="text-lg font-black text-amber-800">
                                                Is this your item?
                                            </h3>

                                            <p className="text-sm text-slate-600 mt-2">
                                                Staff has approved this
                                                match. Please confirm
                                                whether the found item
                                                belongs to you.
                                            </p>

                                            <div className="flex flex-col sm:flex-row gap-3 mt-5">
                                                <button
                                                    type="button"
                                                    disabled={responding}
                                                    onClick={() =>
                                                        respondToMatch("Accepted")
                                                    }
                                                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-7 py-3 rounded-xl font-black"
                                                >
                                                    <CheckCircle2 size={18} />

                                                    {responding
                                                        ? "Processing..."
                                                        : "Accept Match"}
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={responding}
                                                    onClick={() =>
                                                        respondToMatch("Rejected")
                                                    }
                                                    className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-7 py-3 rounded-xl font-black"
                                                >
                                                    <XCircle size={18} />

                                                    {responding
                                                        ? "Processing..."
                                                        : "Reject Match"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </div>

                        {/* ACCEPTED */}

                        {customerAccepted &&
                            !isRecoveryRequested &&
                            !isRecovered && (
                                <div className="px-6 md:px-8 pb-8">
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                <CheckCircle2 size={26} />
                                            </div>

                                            <div>
                                                <h2 className="text-2xl font-black text-emerald-700">
                                                    Match Accepted
                                                </h2>

                                                <p className="text-sm text-slate-600 mt-2">
                                                    You have confirmed that
                                                    this is your item.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        companyRoute(
                                                            `/recover-item/${match.id}`
                                                        )
                                                    )
                                                }
                                                className="company-primary-button bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl font-black"
                                            >
                                                Continue to Recovery →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        {/* RECOVERY REQUESTED */}

                        {isRecoveryRequested &&
                            !isRecovered && (
                                <div className="px-6 md:px-8 pb-10">
                                    <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-6 md:p-8">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 shrink-0 rounded-2xl bg-white/10 flex items-center justify-center">
                                                <ShieldCheck size={30} />
                                            </div>

                                            <div>
                                                <span className="inline-flex px-3 py-1 rounded-full bg-white/10 text-sm font-bold">
                                                    RECOVERY REQUESTED
                                                </span>

                                                <h2 className="text-2xl md:text-3xl font-black mt-3">
                                                    Your recovery request is active
                                                </h2>

                                                <p className="text-blue-100 mt-3">
                                                    Continue with the recovery
                                                    process to collect your item.
                                                </p>
                                            </div>
                                        </div>

                                        {/* RECOVERY CODE */}

                                        {match.recovery_code && (
                                            <div className="mt-7 bg-white rounded-2xl p-6 text-center">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    Recovery Code
                                                </p>

                                                <p className="text-4xl md:text-5xl font-black tracking-[0.25em] text-blue-700 mt-3">
                                                    {match.recovery_code}
                                                </p>

                                                <p className="text-sm text-slate-500 mt-3">
                                                    Show this code to Lost &
                                                    Found staff.
                                                </p>
                                            </div>
                                        )}

                                        {/* QR */}

                                        {match.recovery_qr_data && (
                                            <div className="mt-6 bg-white rounded-2xl p-6 text-center">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    Recovery QR Code
                                                </p>

                                                <div className="mt-5 flex justify-center">
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                                                            match.recovery_qr_data
                                                        )}`}
                                                        alt="Recovery QR Code"
                                                        className="w-56 h-56 rounded-xl"
                                                    />
                                                </div>

                                                <p className="text-sm text-slate-500 mt-4">
                                                    Show this QR code to staff
                                                    during collection.
                                                </p>
                                            </div>
                                        )}

                                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        companyRoute(
                                                            `/recover-item/${match.id}`
                                                        )
                                                    )
                                                }
                                                className="bg-white text-blue-700 px-7 py-4 rounded-xl font-black hover:bg-blue-50"
                                            >
                                                View Recovery Details →
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        companyRoute("/dashboard")
                                                    )
                                                }
                                                className="border border-white/30 bg-white/10 px-7 py-4 rounded-xl font-bold hover:bg-white/20"
                                            >
                                                Dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        {/* REJECTED */}

                        {customerRejected && (
                            <div className="px-6 md:px-8 pb-8">
                                <div className="bg-red-50 border border-red-200 rounded-3xl p-6">
                                    <div className="flex items-center gap-3">
                                        <XCircle
                                            size={25}
                                            className="text-red-600"
                                        />

                                        <h2 className="text-2xl font-black text-red-700">
                                            Match Rejected
                                        </h2>
                                    </div>

                                    <p className="mt-3 text-sm text-slate-600">
                                        You rejected this match.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* RECOVERED */}

                        {isRecovered && (
                            <div className="px-6 md:px-8 pb-10">
                                <div className="bg-purple-50 border border-purple-200 rounded-3xl p-6">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2
                                            size={27}
                                            className="text-purple-600"
                                        />

                                        <h2 className="text-2xl font-black text-purple-700">
                                            Item Recovered
                                        </h2>
                                    </div>

                                    <p className="mt-3 text-sm text-slate-600">
                                        This item has already been marked
                                        as recovered.
                                    </p>

                                    {match.recovered_by && (
                                        <p className="mt-4 text-sm text-slate-600">
                                            <strong>Recovered By:</strong>{" "}
                                            {match.recovered_by}
                                        </p>
                                    )}

                                    {match.recovered_at && (
                                        <p className="mt-2 text-sm text-slate-600">
                                            <strong>Recovered At:</strong>{" "}
                                            {match.recovered_at}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// =========================================================
// INFO ROW
// =========================================================

function InfoRow({ label, value, icon }) {
    return (
        <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-slate-400">
                {icon}
                {label}
            </div>

            <p className="text-slate-700 mt-1">
                {value || "Not provided"}
            </p>
        </div>
    );
}

// =========================================================
// SCORE
// =========================================================

function Score({ title, value, main = false }) {
    return (
        <div className="settings-surface bg-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {title}
            </p>

            <p
                className={`font-black mt-1 ${
                    main
                        ? "text-3xl text-blue-600"
                        : "text-xl text-slate-900"
                }`}
            >
                {value ?? 0}%
            </p>
        </div>
    );
}

export default CustomerMatchDetail;
