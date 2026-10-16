import React, {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    Bell,
    CheckCircle,
    Clock,
    RefreshCw,
    ArrowLeft,
} from "lucide-react";

import { API } from "../../config";
const DEFAULT_WEBSITE_SETTINGS = {
    primary_color: "#2563eb",
    secondary_color: "#1d4ed8",
    background_color: "#f8fafc",
    text_color: "#475569",
    heading_color: "#0f172a",
    card_color: "#ffffff",
    button_text_color: "#ffffff",
    border_color: "#ffffff",
    border_line_color: "#e2e8f0",
    border_style: "solid",
    border_width: 1,
    border_radius: 16,
    content_width: 1024,
    font_family: "Inter",
};


// ============================================================
// GET STORED OBJECT
// ============================================================

function getStoredObject(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}


// ============================================================
// VALIDATE WEBSITE COLORS
// ============================================================

function getValidColor(value, fallback) {
    if (typeof value !== "string") {
        return fallback;
    }

    const color = value.trim();

    // Hex, RGB, RGBA, HSL, HSLA, and named CSS colors.
    const validColor =
        /^#[0-9a-f]{3,8}$/i.test(color) ||
        /^rgba?\([\d\s.,%/+-]+\)$/i.test(color) ||
        /^hsla?\([\d\s.,%/+-]+\)$/i.test(color) ||
        /^[a-z]+$/i.test(color);

    return validColor ? color : fallback;
}


// ============================================================
// NORMALIZE WEBSITE SETTINGS
// ============================================================

function normalizeWebsiteSettings(data) {
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

    const fontFamilies = {
        Inter: "Inter, sans-serif",
        Arial: "Arial, sans-serif",
        Roboto: "Roboto, sans-serif",
        Poppins: "Poppins, sans-serif",
        Montserrat: "Montserrat, sans-serif",
        "Open Sans": "'Open Sans', sans-serif",
        Lato: "Lato, sans-serif",
        Georgia: "Georgia, serif",
        "Times New Roman": "'Times New Roman', serif",
        system: "system-ui, sans-serif",
    };

    const requestedFont = source.font_family;

    const fontFamily =
        fontFamilies[requestedFont] ||
        (typeof requestedFont === "string" &&
        requestedFont.trim() &&
        /^[a-zA-Z0-9 ,'"-]+$/.test(requestedFont)
            ? requestedFont
            : "Inter, sans-serif");

    const borderWidth = Number(source.border_width);
    const borderRadius = Number(source.border_radius);
    const contentWidth = Number(source.content_width);

    return {
        primary_color: getValidColor(
            source.primary_color,
            DEFAULT_WEBSITE_SETTINGS.primary_color
        ),

        secondary_color: getValidColor(
            source.secondary_color,
            DEFAULT_WEBSITE_SETTINGS.secondary_color
        ),

        background_color: getValidColor(
            source.background_color,
            DEFAULT_WEBSITE_SETTINGS.background_color
        ),

        text_color: getValidColor(
            source.text_color,
            DEFAULT_WEBSITE_SETTINGS.text_color
        ),

        heading_color: getValidColor(
            source.heading_color,
            DEFAULT_WEBSITE_SETTINGS.heading_color
        ),

        card_color: getValidColor(
            source.card_color,
            DEFAULT_WEBSITE_SETTINGS.card_color
        ),

        button_text_color: getValidColor(
            source.button_text_color,
            DEFAULT_WEBSITE_SETTINGS.button_text_color
        ),

        // Fill inside bordered elements.
        border_color: getValidColor(
            source.border_color,
            DEFAULT_WEBSITE_SETTINGS.border_color
        ),

        // Actual border stroke.
        border_line_color: getValidColor(
            source.border_line_color,
            DEFAULT_WEBSITE_SETTINGS.border_line_color
        ),

        border_style: borderStyles.includes(source.border_style)
            ? source.border_style
            : DEFAULT_WEBSITE_SETTINGS.border_style,

        border_width:
            Number.isFinite(borderWidth) &&
            borderWidth >= 0 &&
            borderWidth <= 12
                ? borderWidth
                : DEFAULT_WEBSITE_SETTINGS.border_width,

        border_radius:
            Number.isFinite(borderRadius) &&
            borderRadius >= 0 &&
            borderRadius <= 100
                ? borderRadius
                : DEFAULT_WEBSITE_SETTINGS.border_radius,

        content_width:
            Number.isFinite(contentWidth) &&
            contentWidth >= 320 &&
            contentWidth <= 2400
                ? contentWidth
                : DEFAULT_WEBSITE_SETTINGS.content_width,

        font_family: fontFamily,
    };
}


// ============================================================
// COMPONENT
// ============================================================

function Notifications() {
    const navigate = useNavigate();

    const { companySlug } = useParams();


    // ==========================================================
    // AUTH
    // ==========================================================

    const access =
        localStorage.getItem("access_token") ||
        localStorage.getItem("access");


    // ==========================================================
    // STORED COMPANY / USER
    // ==========================================================

    const storedCompany = getStoredObject("company");

    const storedUser = getStoredObject("user");


    // ==========================================================
    // ACTIVE COMPANY
    // ==========================================================

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


    // ==========================================================
    // COMPANY ROUTE
    // ==========================================================

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


    // ==========================================================
    // STATE
    // ==========================================================

    const [notifications, setNotifications] = useState([]);

    const [notificationCount, setNotificationCount] = useState(0);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [websiteSettings, setWebsiteSettings] = useState(
        DEFAULT_WEBSITE_SETTINGS
    );


    // ==========================================================
    // LOAD COMPANY WEBSITE SETTINGS
    // ==========================================================

    useEffect(() => {
        let cancelled = false;

        async function loadWebsiteSettings() {
            if (!activeCompanySlug) {
                setWebsiteSettings(DEFAULT_WEBSITE_SETTINGS);
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
                    throw new Error(
                        "Unable to load company website settings."
                    );
                }

                const data = await response.json();

                if (!cancelled) {
                    setWebsiteSettings(
                        normalizeWebsiteSettings(data)
                    );
                }
            } catch (err) {
                console.warn(
                    "WEBSITE SETTINGS ERROR:",
                    err
                );

                if (!cancelled) {
                    setWebsiteSettings(
                        DEFAULT_WEBSITE_SETTINGS
                    );
                }
            }
        }

        loadWebsiteSettings();

        return () => {
            cancelled = true;
        };
    }, [activeCompanySlug]);


    // ==========================================================
    // THEME STYLES
    // ==========================================================

    const themeStyle = {
        "--tf-primary": websiteSettings.primary_color,
        "--tf-secondary": websiteSettings.secondary_color,
        "--tf-background": websiteSettings.background_color,
        "--tf-text": websiteSettings.text_color,
        "--tf-heading": websiteSettings.heading_color,
        "--tf-card": websiteSettings.card_color,
        "--tf-button-text": websiteSettings.button_text_color,

        // Inside/fill of bordered elements.
        "--tf-border-fill": websiteSettings.border_color,

        // Actual border stroke.
        "--tf-border-line": websiteSettings.border_line_color,

        "--tf-border-style": websiteSettings.border_style,
        "--tf-border-width": `${websiteSettings.border_width}px`,
        "--tf-radius": `${websiteSettings.border_radius}px`,
        "--tf-content-width": `${websiteSettings.content_width}px`,
        "--tf-font-family": websiteSettings.font_family,

        backgroundColor: websiteSettings.background_color,
        color: websiteSettings.text_color,
        fontFamily: websiteSettings.font_family,
    };


    // ==========================================================
    // AUTH ERROR
    // ==========================================================

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


    // ==========================================================
    // FETCH NOTIFICATIONS
    // ==========================================================

    const loadNotifications = useCallback(async () => {
        const token =
            localStorage.getItem("access_token") ||
            localStorage.getItem("access");

        if (!token) {
            handleUnauthorized();
            return;
        }

        try {
            setLoading(true);
            setError("");

            const headers = {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            };


            // ==================================================
            // GET NOTIFICATIONS
            // ==================================================

            const notificationsResponse = await fetch(
                `${API}/notifications/`,
                {
                    method: "GET",
                    headers,
                }
            );

            const notificationsData =
                await notificationsResponse.json();


            // ==================================================
            // AUTH FAILURE
            // ==================================================

            if (
                notificationsResponse.status === 401 ||
                notificationsResponse.status === 403
            ) {
                handleUnauthorized();
                return;
            }


            // ==================================================
            // API ERROR
            // ==================================================

            if (!notificationsResponse.ok) {
                throw new Error(
                    notificationsData.detail ||
                    notificationsData.error ||
                    "Unable to load notifications."
                );
            }


            // ==================================================
            // SUPPORT DIFFERENT RESPONSE FORMATS
            // ==================================================

            const notificationList = Array.isArray(
                notificationsData
            )
                ? notificationsData
                : Array.isArray(notificationsData.results)
                    ? notificationsData.results
                    : Array.isArray(
                        notificationsData.notifications
                    )
                        ? notificationsData.notifications
                        : [];

            setNotifications(notificationList);


            // ==================================================
            // GET UNREAD COUNT
            // ==================================================

            const countResponse = await fetch(
                `${API}/notifications/count/`,
                {
                    method: "GET",
                    headers,
                }
            );

            const countData = await countResponse.json();


            // ==================================================
            // COUNT AUTH FAILURE
            // ==================================================

            if (
                countResponse.status === 401 ||
                countResponse.status === 403
            ) {
                handleUnauthorized();
                return;
            }


            // ==================================================
            // COUNT ERROR
            // ==================================================

            if (!countResponse.ok) {
                throw new Error(
                    countData.detail ||
                    countData.error ||
                    "Unable to load notification count."
                );
            }

            setNotificationCount(
                Number(countData.count) || 0
            );


            // ==================================================
            // MARK ALL AS READ
            // ==================================================

            if (Number(countData.count) > 0) {
                const markReadResponse = await fetch(
                    `${API}/notifications/mark-all-read/`,
                    {
                        method: "POST",
                        headers,
                    }
                );


                // ==============================================
                // AUTH FAILURE
                // ==============================================

                if (
                    markReadResponse.status === 401 ||
                    markReadResponse.status === 403
                ) {
                    handleUnauthorized();
                    return;
                }


                // ==============================================
                // DO NOT FAIL PAGE IF MARK READ FAILS
                // ==============================================

                if (!markReadResponse.ok) {
                    console.warn(
                        "Unable to mark notifications as read."
                    );
                }


                // ==============================================
                // UPDATE LOCAL STATE
                // ==============================================

                if (markReadResponse.ok) {
                    setNotificationCount(0);

                    setNotifications((previous) =>
                        previous.map((notification) => ({
                            ...notification,
                            is_read: true,
                        }))
                    );
                }
            }
        } catch (err) {
            console.error(
                "NOTIFICATIONS ERROR:",
                err
            );

            setError(
                err.message ||
                "Unable to load notifications."
            );
        } finally {
            setLoading(false);
        }
    }, [handleUnauthorized]);


    // ==========================================================
    // INITIAL LOAD
    // ==========================================================

    useEffect(() => {
        if (!access) {
            handleUnauthorized();
            return;
        }

        loadNotifications();
    }, [
        access,
        activeCompanySlug,
        handleUnauthorized,
        loadNotifications,
    ]);


    // ==========================================================
    // LOADING
    // ==========================================================

    if (loading) {
        return (
            <div
                className="notifications-theme min-h-screen flex items-center justify-center p-6"
                style={themeStyle}
            >
                <style>{`
                    .notifications-theme {
                        background: var(--tf-background);
                        color: var(--tf-text);
                        font-family: var(--tf-font-family);
                    }

                    .notifications-theme .tf-heading {
                        color: var(--tf-heading);
                    }

                    .notifications-theme .tf-primary-text {
                        color: var(--tf-primary);
                    }

                    .notifications-theme .tf-card {
                        background: var(--tf-card);
                        border-color: var(--tf-border-line);
                        border-style: var(--tf-border-style);
                        border-width: var(--tf-border-width);
                        border-radius: var(--tf-radius);
                    }
                `}</style>

                <div className="tf-card w-full max-w-md shadow-xl p-10 text-center">
                    <div
                        className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
                        style={{
                            backgroundColor: websiteSettings.border_color,
                            border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                        }}
                    >
                        <RefreshCw
                            size={30}
                            className="animate-spin tf-primary-text"
                        />
                    </div>

                    <h2 className="text-xl font-bold tf-heading mt-6">
                        Loading Notifications
                    </h2>

                    <p className="mt-2">
                        Checking your latest updates...
                    </p>
                </div>
            </div>
        );
    }


    // ==========================================================
    // PAGE
    // ==========================================================

    return (
        <div
            className="notifications-theme min-h-screen p-5 sm:p-8"
            style={themeStyle}
        >
            <style>{`
                .notifications-theme {
                    background: var(--tf-background);
                    color: var(--tf-text);
                    font-family: var(--tf-font-family);
                }

                .notifications-theme .tf-heading {
                    color: var(--tf-heading);
                }

                .notifications-theme .tf-body-text {
                    color: var(--tf-text);
                }

                .notifications-theme .tf-primary-text {
                    color: var(--tf-primary);
                }

                .notifications-theme .tf-secondary-text {
                    color: var(--tf-secondary);
                }

                .notifications-theme .tf-card {
                    background: var(--tf-card);
                    border-color: var(--tf-border-line);
                    border-style: var(--tf-border-style);
                    border-width: var(--tf-border-width);
                    border-radius: var(--tf-radius);
                }

                .notifications-theme .tf-bordered-fill {
                    background: var(--tf-border-fill);
                    border-color: var(--tf-border-line);
                    border-style: var(--tf-border-style);
                    border-width: var(--tf-border-width);
                    border-radius: var(--tf-radius);
                }

                .notifications-theme .tf-primary-button {
                    background-color: var(--tf-primary);
                    color: var(--tf-button-text);
                    border-color: var(--tf-border-line);
                    border-style: var(--tf-border-style);
                    border-width: var(--tf-border-width);
                    border-radius: var(--tf-radius);
                    transition: background-color 0.2s ease;
                }

                .notifications-theme .tf-primary-button:hover {
                    background-color: var(--tf-secondary);
                }

                .notifications-theme .tf-secondary-button {
                    background: var(--tf-border-fill);
                    color: var(--tf-text);
                    border-color: var(--tf-border-line);
                    border-style: var(--tf-border-style);
                    border-width: var(--tf-border-width);
                    border-radius: var(--tf-radius);
                }

                .notifications-theme .tf-secondary-button:hover {
                    color: var(--tf-primary);
                    border-color: var(--tf-primary);
                }

                .notifications-theme .tf-notification {
                    background: var(--tf-border-fill);
                    border-color: var(--tf-border-line);
                    border-style: var(--tf-border-style);
                    border-width: var(--tf-border-width);
                    border-radius: var(--tf-radius);
                    transition: box-shadow 0.2s ease;
                }

                .notifications-theme .tf-notification:hover {
                    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
                }

                .notifications-theme .tf-notification-unread {
                    border-color: var(--tf-primary);
                }

                .notifications-theme .tf-divider {
                    border-color: var(--tf-border-line);
                    border-style: var(--tf-border-style);
                    border-width: var(--tf-border-width);
                }

                .notifications-theme .tf-soft-primary {
                    background: color-mix(in srgb, var(--tf-primary) 10%, white);
                }

                .notifications-theme .tf-soft-primary-text {
                    color: var(--tf-primary);
                }

                .notifications-theme .tf-content-width {
                    max-width: var(--tf-content-width);
                }
            `}</style>

            <div className="tf-content-width mx-auto">


                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div
                                className="p-3 rounded-2xl tf-soft-primary"
                                style={{
                                    border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                                }}
                            >
                                <Bell
                                    className="tf-primary-text"
                                    size={28}
                                />
                            </div>

                            {notificationCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold min-w-[22px] h-[22px] rounded-full flex items-center justify-center">
                                    {notificationCount}
                                </span>
                            )}
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-widest font-bold tf-primary-text">
                                Updates
                            </p>

                            <h1 className="text-3xl sm:text-4xl font-black tf-heading mt-1">
                                Notifications
                            </h1>

                            <p className="mt-1">
                                Stay updated on your reports, matches and recoveries.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* REFRESH */}

                        <button
                            type="button"
                            onClick={loadNotifications}
                            className="tf-secondary-button inline-flex items-center gap-2 px-4 py-2.5 font-semibold transition"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>

                        {/* UNREAD */}

                        <div className="tf-bordered-fill px-4 py-2.5 shadow-sm">
                            <span className="font-semibold">
                                Unread:
                            </span>{" "}

                            <span className="tf-primary-text font-bold">
                                {notificationCount}
                            </span>
                        </div>
                    </div>
                </div>


                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (
                    <div
                        className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5"
                    >
                        <p className="font-semibold">
                            Unable to load notifications
                        </p>

                        <p className="text-sm mt-1">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={loadNotifications}
                            className="mt-3 text-sm font-bold underline"
                        >
                            Try Again
                        </button>
                    </div>
                )}


                {/* ==================================================
                    EMPTY STATE
                ================================================== */}

                {notifications.length === 0 ? (
                    <div className="tf-bordered-fill shadow-sm p-12 sm:p-16 text-center">
                        <div
                            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
                            style={{
                                backgroundColor: websiteSettings.card_color,
                                border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                            }}
                        >
                            <Bell
                                className="text-slate-400"
                                size={30}
                            />
                        </div>

                        <h2 className="text-xl font-bold tf-heading mt-5">
                            No Notifications Yet
                        </h2>

                        <p className="mt-2 max-w-md mx-auto">
                            Notifications will appear here when matches,
                            approvals, recoveries or verifications occur.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(companyRoute("/dashboard"))
                            }
                            className="tf-primary-button mt-6 inline-flex items-center gap-2 px-5 py-2.5 font-semibold transition"
                        >
                            <ArrowLeft size={17} />
                            Back to Dashboard
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`tf-notification p-5 sm:p-6 ${
                                    !notification.is_read
                                        ? "tf-notification-unread"
                                        : ""
                                }`}
                            >
                                <div className="flex justify-between gap-4">

                                    {/* NOTIFICATION CONTENT */}

                                    <div className="flex gap-4 min-w-0">

                                        {/* ICON */}

                                        <div className="flex-shrink-0">
                                            {notification.is_read ? (
                                                <div
                                                    className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"
                                                    style={{
                                                        border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                                                    }}
                                                >
                                                    <CheckCircle
                                                        className="text-emerald-500"
                                                        size={21}
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-10 h-10 rounded-xl tf-soft-primary flex items-center justify-center"
                                                    style={{
                                                        border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                                                    }}
                                                >
                                                    <Bell
                                                        className="tf-primary-text"
                                                        size={21}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* CONTENT */}

                                        <div className="min-w-0">
                                            <h2 className="font-bold text-lg tf-heading">
                                                {notification.title}
                                            </h2>

                                            <p className="mt-2 leading-6">
                                                {notification.message}
                                            </p>

                                            {notification.notification_type && (
                                                <span
                                                    className="inline-flex mt-3 text-xs font-semibold px-3 py-1 rounded-full"
                                                    style={{
                                                        backgroundColor: websiteSettings.card_color,
                                                        color: websiteSettings.text_color,
                                                        border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                                                    }}
                                                >
                                                    {notification.notification_type}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* NEW */}

                                    {!notification.is_read && (
                                        <span
                                            className="flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-full h-fit"
                                            style={{
                                                backgroundColor: websiteSettings.primary_color,
                                                color: websiteSettings.button_text_color,
                                            }}
                                        >
                                            New
                                        </span>
                                    )}
                                </div>

                                {/* DATE */}

                                <div className="flex items-center gap-2 mt-5 pt-4 border-t text-sm">
                                    <Clock size={16} />

                                    <span>
                                        {notification.created_at}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}


                {/* ==================================================
                    FOOTER
                ================================================== */}

                <div className="mt-10 pt-6 border-t tf-divider flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                    <span>
                        TrustFound Notifications
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(companyRoute("/dashboard"))
                        }
                        className="inline-flex items-center gap-2 transition tf-primary-text"
                    >
                        <ArrowLeft size={15} />
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Notifications;