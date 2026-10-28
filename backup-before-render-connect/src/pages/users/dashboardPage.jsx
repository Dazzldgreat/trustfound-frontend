
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    AlertCircle,
    ArrowRight,
    Building2,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Eye,
    FileSearch,
    FolderOpen,
    MapPin,
    Package,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    TrendingUp,
    XCircle,
} from "lucide-react";

const API = "http://127.0.0.1:8000/api";

const DEFAULT_WEBSITE_SETTINGS = {
    primary_color: "#4f46e5",
    secondary_color: "#0f172a",
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

    font_family: "Inter, Arial, sans-serif",
    content_width: 1280,

    logo_url: "",
    logo_alt: "",
    favicon_url: "",

    show_hero: true,
    show_logo: true,
    show_company_name: true,
    show_about: true,
    show_featured_items: true,
    show_contact: true,
    is_published: true,
};

function DashboardPage() {
    const navigate = useNavigate();
    const params = useParams();

    const { companySlug, slug } = params;

    // ============================================================
    // STORAGE
    // ============================================================

    const getStoredObject = useCallback((key) => {
        try {
            return JSON.parse(localStorage.getItem(key) || "{}");
        } catch {
            return {};
        }
    }, []);

    const storedCompany = getStoredObject("company");
    const storedUser = getStoredObject("user");

    const activeCompanySlug =
        companySlug ||
        slug ||
        localStorage.getItem("companySlug") ||
        localStorage.getItem("company_slug") ||
        storedCompany.slug ||
        storedUser.company_slug ||
        storedUser.companySlug ||
        storedUser.organization_slug ||
        storedUser.organizationSlug ||
        "";

    // ============================================================
    // COMPANY ROUTE
    // ============================================================

    const companyRoute = useCallback(
        (path = "") => {
            const cleanPath = path.startsWith("/")
                ? path
                : `/${path}`;

            if (!activeCompanySlug) {
                return path || "/";
            }

            return `/company/${encodeURIComponent(
                activeCompanySlug
            )}${cleanPath === "/" ? "" : cleanPath}`;
        },
        [activeCompanySlug]
    );

    // ============================================================
    // STATE
    // ============================================================

    const [loading, setLoading] = useState(true);
    const [companyLoading, setCompanyLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [logoLoadFailed, setLogoLoadFailed] = useState(false);

    const [company, setCompany] = useState({
        id: storedCompany.id || null,
        name: storedCompany.name || "TrustFound",
        slug: activeCompanySlug,
        logo:
            storedCompany.logo ||
            storedCompany.logo_url ||
            storedCompany.logo_image ||
            "",
        description:
            storedCompany.description ||
            storedCompany.about ||
            "Lost & Found Management Platform",
        location:
            storedCompany.location ||
            storedCompany.address ||
            "",
    });

    const [websiteSettings, setWebsiteSettings] = useState({
        ...DEFAULT_WEBSITE_SETTINGS,
    });

    const [stats, setStats] = useState({
        lost: 0,
        found: 0,
        pending: 0,
        matched: 0,
        recovered: 0,
    });

    const [reports, setReports] = useState([]);

    // ============================================================
    // WEBSITE SETTINGS / THEME
    // ============================================================

    const applyWebsiteTheme = useCallback((incomingSettings = {}) => {
        const settings = {
            ...DEFAULT_WEBSITE_SETTINGS,
            ...incomingSettings,
        };

        const isValidColor = (value, fallback) =>
            /^#[0-9a-fA-F]{6}$/.test(value || "")
                ? value
                : fallback;

        const normalized = {
            ...settings,

            primary_color: isValidColor(
                settings.primary_color,
                DEFAULT_WEBSITE_SETTINGS.primary_color
            ),

            secondary_color: isValidColor(
                settings.secondary_color,
                DEFAULT_WEBSITE_SETTINGS.secondary_color
            ),

            background_color: isValidColor(
                settings.background_color,
                DEFAULT_WEBSITE_SETTINGS.background_color
            ),

            text_color: isValidColor(
                settings.text_color,
                DEFAULT_WEBSITE_SETTINGS.text_color
            ),

            heading_color: isValidColor(
                settings.heading_color,
                DEFAULT_WEBSITE_SETTINGS.heading_color
            ),

            card_color: isValidColor(
                settings.card_color,
                DEFAULT_WEBSITE_SETTINGS.card_color
            ),

            button_text_color: isValidColor(
                settings.button_text_color,
                DEFAULT_WEBSITE_SETTINGS.button_text_color
            ),

            border_color: isValidColor(
                settings.border_color,
                DEFAULT_WEBSITE_SETTINGS.border_color
            ),

            border_line_color: isValidColor(
                settings.border_line_color,
                DEFAULT_WEBSITE_SETTINGS.border_line_color
            ),
        };

        const root = document.documentElement;

        root.style.setProperty(
            "--company-primary",
            normalized.primary_color
        );

        root.style.setProperty(
            "--company-secondary",
            normalized.secondary_color
        );

        root.style.setProperty(
            "--company-background",
            normalized.background_color
        );

        root.style.setProperty(
            "--company-text",
            normalized.text_color
        );

        root.style.setProperty(
            "--company-heading",
            normalized.heading_color
        );

        root.style.setProperty(
            "--company-card",
            normalized.card_color
        );

        root.style.setProperty(
            "--company-button-text",
            normalized.button_text_color
        );

        // Border fill / inside color.
        root.style.setProperty(
            "--company-border-color",
            normalized.border_color
        );

        // Visible border line color.
        root.style.setProperty(
            "--company-border-line-color",
            normalized.border_line_color
        );

        root.style.setProperty(
            "--company-border-style",
            normalized.border_style || "solid"
        );

        root.style.setProperty(
            "--company-border-width",
            `${Math.max(
                0,
                Number(normalized.border_width) || 0
            )}px`
        );

        root.style.setProperty(
            "--company-border-radius",
            `${Math.max(
                0,
                Number(normalized.border_radius) || 0
            )}px`
        );

        root.style.setProperty(
            "--company-content-width",
            `${Math.max(
                320,
                Number(normalized.content_width) || 1280
            )}px`
        );

        root.style.setProperty(
            "--company-font-family",
            normalized.font_family ||
                DEFAULT_WEBSITE_SETTINGS.font_family
        );

        setWebsiteSettings(normalized);
    }, []);

    // ============================================================
    // IMAGE URL
    // ============================================================

    const getImageUrl = useCallback((image) => {
        if (!image) return "";

        const value = String(image).trim();

        if (
            value.startsWith("http://") ||
            value.startsWith("https://") ||
            value.startsWith("data:")
        ) {
            return value;
        }

        const serverRoot = API.replace("/api", "");

        if (value.startsWith("/")) {
            return `${serverRoot}${value}`;
        }

        return `${serverRoot}/${value}`;
    }, []);

    const companyLogo =
        websiteSettings.show_logo !== false
            ? (
                websiteSettings.logo_url ||
                company.logo ||
                storedCompany.logo_url ||
                storedCompany.logo_image ||
                ""
            )
            : "";

    const companyLogoUrl = getImageUrl(companyLogo);

    useEffect(() => {
        setLogoLoadFailed(false);
    }, [companyLogoUrl]);

    // ============================================================
    // FETCH COMPANY
    // ============================================================

    const fetchCompany = useCallback(async () => {
        if (!activeCompanySlug) {
            setCompanyLoading(false);
            return;
        }

        try {
            setCompanyLoading(true);

            const response = await fetch(
                `${API}/company/public/${encodeURIComponent(
                    activeCompanySlug
                )}/`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                        data.detail ||
                        "Unable to load company."
                );
            }

            const companyData = data.company || data;

            const updatedCompany = {
                id:
                    companyData.id ??
                    storedCompany.id ??
                    null,

                name:
                    companyData.name ||
                    storedCompany.name ||
                    "TrustFound",

                slug:
                    companyData.slug ||
                    activeCompanySlug,

                logo:
                    companyData.logo ||
                    companyData.logo_url ||
                    companyData.logo_image ||
                    storedCompany.logo ||
                    storedCompany.logo_url ||
                    storedCompany.logo_image ||
                    "",

                description:
                    companyData.description ||
                    companyData.about ||
                    storedCompany.description ||
                    storedCompany.about ||
                    "Lost & Found Management Platform",

                location:
                    companyData.location ||
                    companyData.address ||
                    storedCompany.location ||
                    storedCompany.address ||
                    "",
            };

            setCompany(updatedCompany);

            localStorage.setItem(
                "company",
                JSON.stringify({
                    ...storedCompany,
                    ...updatedCompany,
                })
            );

            localStorage.setItem(
                "companySlug",
                updatedCompany.slug
            );

            localStorage.setItem(
                "company_slug",
                updatedCompany.slug
            );

            // Load published website settings for this company.
            try {
                const settingsResponse = await fetch(
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

                const settingsData =
                    await settingsResponse.json();

                if (settingsResponse.ok) {
                    const loadedSettings =
                        settingsData.settings ||
                        settingsData.website_settings ||
                        settingsData;

                    applyWebsiteTheme(loadedSettings);
                }
            } catch (settingsError) {
                console.warn(
                    "WEBSITE SETTINGS LOAD ERROR:",
                    settingsError
                );
            }
        } catch (error) {
            console.error("COMPANY LOAD ERROR:", error);

            if (storedCompany.name) {
                setCompany((previous) => ({
                    ...previous,

                    id:
                        storedCompany.id ??
                        previous.id,

                    name:
                        storedCompany.name ||
                        previous.name,

                    slug:
                        storedCompany.slug ||
                        activeCompanySlug,

                    logo:
                        storedCompany.logo ||
                        storedCompany.logo_url ||
                        storedCompany.logo_image ||
                        previous.logo,

                    description:
                        storedCompany.description ||
                        storedCompany.about ||
                        previous.description,

                    location:
                        storedCompany.location ||
                        storedCompany.address ||
                        previous.location,
                }));
            }
        } finally {
            setCompanyLoading(false);
        }
    }, [
        activeCompanySlug,
        storedCompany.id,
        storedCompany.name,
        storedCompany.slug,
        storedCompany.logo,
        storedCompany.logo_url,
        storedCompany.logo_image,
        storedCompany.description,
        storedCompany.about,
        storedCompany.location,
        storedCompany.address,
        applyWebsiteTheme,
    ]);

    // ============================================================
    // FETCH DASHBOARD
    // ============================================================

    const fetchDashboard = useCallback(async () => {
        const token =
            localStorage.getItem("access_token") ||
            localStorage.getItem("access");

        if (!token) {
            navigate(
                companyRoute("/login-page"),
                { replace: true }
            );
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API}/dashboard/`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    localStorage.removeItem("access");
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh");
                    localStorage.removeItem("refresh_token");
                    localStorage.removeItem("user");

                    navigate(
                        companyRoute("/login-page"),
                        { replace: true }
                    );

                    return;
                }

                throw new Error(
                    data.detail ||
                        data.error ||
                        "Unable to load dashboard."
                );
            }

            const backendStats = data.stats || {};

            setStats({
                lost:
                    backendStats.lost ??
                    backendStats.lost_reports ??
                    0,

                found:
                    backendStats.found ??
                    backendStats.found_reports ??
                    0,

                pending:
                    backendStats.pending ??
                    0,

                matched:
                    backendStats.matched ??
                    0,

                recovered:
                    backendStats.recovered ??
                    0,
            });

            setReports(
                Array.isArray(data.reports)
                    ? data.reports
                    : []
            );
        } catch (error) {
            console.error("DASHBOARD ERROR:", error);
        } finally {
            setLoading(false);
        }
    }, [companyRoute, navigate]);

    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {
        const token =
            localStorage.getItem("access_token") ||
            localStorage.getItem("access");

        if (!token) {
            navigate(
                companyRoute("/login-page"),
                { replace: true }
            );
            return;
        }

        fetchCompany();
        fetchDashboard();
    }, [
        companyRoute,
        fetchCompany,
        fetchDashboard,
        navigate,
    ]);

    // ============================================================
    // FILTER REPORTS
    // ============================================================

    const filteredReports = reports.filter((report) => {
        const type = String(
            report.type || ""
        ).toLowerCase();

        const status = String(
            report.status || ""
        ).toLowerCase();

        if (filter === "all") return true;

        if (filter === "lost") {
            return type === "lost";
        }

        if (filter === "found") {
            return type === "found";
        }

        if (filter === "pending") {
            return status === "pending";
        }

        if (filter === "matched") {
            return [
                "matched",
                "approved",
                "recovery requested",
            ].includes(status);
        }

        if (filter === "recovered") {
            return status === "recovered";
        }

        return true;
    });

    // ============================================================
    // VIEW REPORT
    // ============================================================

    const handleView = (report) => {
        const normalizedType = String(
            report.type || ""
        ).toLowerCase();

        const normalizedStatus = String(
            report.status || ""
        ).trim().toLowerCase();

        if (report.match_id) {
            const matchStatuses = [
                "matched",
                "approved",
                "recovery requested",
                "recovered",
            ];

            if (matchStatuses.includes(normalizedStatus)) {
                navigate(
                    companyRoute(
                        `/customer-match/${report.match_id}`
                    )
                );
                return;
            }
        }

        if (normalizedType === "lost") {
            navigate(
                companyRoute(
                    `/lost-item/${report.id}`
                )
            );
            return;
        }

        if (normalizedType === "found") {
            navigate(
                companyRoute(
                    `/found-item/${report.id}`
                )
            );
        }
    };

    // ============================================================
    // RECOVER
    // ============================================================

    const handleRecover = (report) => {
        if (!report.match_id) return;

        navigate(
            companyRoute(
                `/recover-item/${report.match_id}`
            )
        );
    };

    // ============================================================
    // EDIT
    // ============================================================

    const handleEdit = (report) => {
        const normalizedType = String(
            report.type || ""
        ).toLowerCase();

        if (normalizedType === "lost") {
            navigate(
                companyRoute(
                    `/edit-lost-item/${report.id}`
                )
            );
        } else {
            navigate(
                companyRoute(
                    `/edit-found-item/${report.id}`
                )
            );
        }
    };

    // ============================================================
    // DELETE
    // ============================================================

    const handleDelete = async (report) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this report?"
        );

        if (!confirmed) return;

        const normalizedType = String(
            report.type || ""
        ).toLowerCase();

        const endpoint =
            normalizedType === "lost"
                ? `${API}/lost-items/${report.id}/delete/`
                : `${API}/found-items/${report.id}/delete/`;

        const token =
            localStorage.getItem("access_token") ||
            localStorage.getItem("access");

        if (!token) {
            navigate(
                companyRoute("/login-page"),
                { replace: true }
            );
            return;
        }

        try {
            const response = await fetch(endpoint, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                console.error(
                    "Delete failed:",
                    await response.text()
                );
                return;
            }

            await fetchDashboard();
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    // ============================================================
    // STATUS STYLE
    // ============================================================

    const getStatusStyle = (status) => {
        const value = String(status || "")
            .trim()
            .toLowerCase();

        if (value === "matched") {
            return "bg-blue-50 text-blue-700 border-blue-100";
        }

        if (value === "approved") {
            return "bg-emerald-50 text-emerald-700 border-emerald-100";
        }

        if (value === "recovered") {
            return "bg-green-50 text-green-700 border-green-100";
        }

        if (value === "recovery requested") {
            return "bg-indigo-50 text-indigo-700 border-indigo-100";
        }

        if (value === "pending") {
            return "bg-amber-50 text-amber-700 border-amber-100";
        }

        if (value === "rejected") {
            return "bg-red-50 text-red-700 border-red-100";
        }

        return "bg-slate-50 text-slate-600 border-slate-200";
    };

    // ============================================================
    // TYPE STYLE
    // ============================================================

    const getTypeStyle = (type) => {
        return String(type || "").toLowerCase() === "lost"
            ? "bg-red-50 text-red-700 border-red-100"
            : "bg-emerald-50 text-emerald-700 border-emerald-100";
    };

    // ============================================================
    // STAT CARDS
    // ============================================================

    const statCards = [
        {
            key: "lost",
            title: "Lost Reports",
            value: stats.lost,
            icon: AlertCircle,
            iconBg: "bg-red-50",
            iconColor: "text-red-600",
            filter: "lost",
        },
        {
            key: "found",
            title: "Found Reports",
            value: stats.found,
            icon: Package,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            filter: "found",
        },
        {
            key: "pending",
            title: "Pending",
            value: stats.pending,
            icon: Clock3,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            filter: "pending",
        },
        {
            key: "matched",
            title: "Matched",
            value: stats.matched,
            icon: Search,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            filter: "matched",
        },
        {
            key: "recovered",
            title: "Recovered",
            value: stats.recovered,
            icon: CheckCircle2,
            iconBg: "bg-indigo-50",
            iconColor: "text-indigo-600",
            filter: "recovered",
        },
    ];

    // ============================================================
    // LOADING
    // ============================================================

    if (loading || companyLoading) {
        return (
            <div
                className="dashboard-theme min-h-screen flex items-center justify-center p-6"
                style={{
                    backgroundColor:
                        websiteSettings.background_color,
                    color: websiteSettings.text_color,
                    fontFamily: websiteSettings.font_family,
                }}
            >
                <div
                    className="w-full max-w-md rounded-3xl shadow-xl p-10 text-center"
                    style={{
                        backgroundColor: websiteSettings.card_color,
                        border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                        borderRadius:
                            `${websiteSettings.border_radius}px`,
                    }}
                >
                    <div
                        className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
                        style={{
                            backgroundColor:
                                websiteSettings.primary_color + "15",
                        }}
                    >
                        <RefreshCw
                            size={30}
                            className="animate-spin"
                            style={{
                                color: websiteSettings.primary_color,
                            }}
                        />
                    </div>

                    <h2
                        className="text-xl font-bold mt-6"
                        style={{
                            color: websiteSettings.heading_color,
                        }}
                    >
                        Preparing your dashboard
                    </h2>

                    <p
                        className="mt-2"
                        style={{
                            color: websiteSettings.text_color,
                        }}
                    >
                        Loading your organization and recent activity...
                    </p>
                </div>
            </div>
        );
    }

    // ============================================================
    // PAGE
    // ============================================================

    return (
        <>
            <style>{`
                .dashboard-theme {
                    font-family: var(--company-font-family);
                    background-color: var(--company-background);
                    color: var(--company-text);
                }

                .dashboard-theme .dashboard-content {
                    max-width: var(--company-content-width);
                }

                .dashboard-theme .bg-white {
                    background-color: var(--company-card) !important;
                }

                .dashboard-theme .bg-slate-50 {
                    background-color: var(--company-background) !important;
                }

                .dashboard-theme .text-slate-900,
                .dashboard-theme .text-slate-800 {
                    color: var(--company-heading) !important;
                }

                .dashboard-theme .text-slate-500,
                .dashboard-theme .text-slate-600 {
                    color: var(--company-text) !important;
                }

                .dashboard-theme .bg-blue-600,
                .dashboard-theme .bg-indigo-600 {
                    background-color: var(--company-primary) !important;
                }

                .dashboard-theme .hover\\:bg-blue-700:hover,
                .dashboard-theme .hover\\:bg-indigo-700:hover {
                    background-color: color-mix(
                        in srgb,
                        var(--company-primary) 85%,
                        black
                    ) !important;
                }

                .dashboard-theme .text-blue-600,
                .dashboard-theme .text-indigo-600,
                .dashboard-theme .hover\\:text-blue-600:hover,
                .dashboard-theme .hover\\:text-indigo-600:hover {
                    color: var(--company-primary) !important;
                }

                .dashboard-theme .border-blue-400 {
                    border-color: var(--company-border-line-color) !important;
                }

                .dashboard-theme .ring-blue-100 {
                    --tw-ring-color: color-mix(
                        in srgb,
                        var(--company-primary) 15%,
                        transparent
                    ) !important;
                }

                .dashboard-theme .rounded-2xl,
                .dashboard-theme .rounded-xl {
                    border-radius: var(--company-border-radius);
                }

                .dashboard-theme .dashboard-card {
                    background-color: var(--company-card);
                    border-color: var(--company-border-line-color);
                    border-style: var(--company-border-style);
                    border-width: var(--company-border-width);
                    border-radius: var(--company-border-radius);
                }

                .dashboard-theme .dashboard-card-fill {
                    background-color: var(--company-border-color);
                    border-color: var(--company-border-line-color);
                    border-style: var(--company-border-style);
                    border-width: var(--company-border-width);
                    border-radius: var(--company-border-radius);
                }

                .dashboard-theme .dashboard-button {
                    background-color: var(--company-primary);
                    color: var(--company-button-text);
                }

                .dashboard-theme .dashboard-button:hover {
                    filter: brightness(0.92);
                }

                .dashboard-theme .dashboard-company-logo {
                    object-fit: contain;
                }
            `}</style>

            <div
                className="dashboard-theme min-h-screen"
                style={{
                    "--company-primary":
                        websiteSettings.primary_color,
                    "--company-secondary":
                        websiteSettings.secondary_color,
                    "--company-background":
                        websiteSettings.background_color,
                    "--company-text":
                        websiteSettings.text_color,
                    "--company-heading":
                        websiteSettings.heading_color,
                    "--company-card":
                        websiteSettings.card_color,
                    "--company-button-text":
                        websiteSettings.button_text_color,

                    // The inside/fill of the bordered element.
                    "--company-border-color":
                        websiteSettings.border_color,

                    // The visible border outline.
                    "--company-border-line-color":
                        websiteSettings.border_line_color,

                    "--company-border-style":
                        websiteSettings.border_style,
                    "--company-border-width":
                        `${websiteSettings.border_width}px`,
                    "--company-border-radius":
                        `${websiteSettings.border_radius}px`,
                    "--company-content-width":
                        `${websiteSettings.content_width}px`,
                    "--company-font-family":
                        websiteSettings.font_family,
                }}
            >
                {/* COMPANY HEADER */}

                <header
                    className="border-b"
                    style={{
                        backgroundColor:
                            websiteSettings.card_color,
                        borderColor:
                            websiteSettings.border_line_color,
                        borderStyle:
                            websiteSettings.border_style,
                        borderBottomWidth:
                            `${websiteSettings.border_width}px`,
                    }}
                >
                    <div className="dashboard-content max-w-7xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            {companyLogoUrl && !logoLoadFailed ? (
                                <img
                                    src={companyLogoUrl}
                                    alt={
                                        websiteSettings.logo_alt ||
                                        company.name
                                    }
                                    onError={() =>
                                        setLogoLoadFailed(true)
                                    }
                                    className="dashboard-company-logo w-12 h-12 rounded-xl"
                                />
                            ) : (
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{
                                        backgroundColor:
                                            websiteSettings.primary_color,
                                        color:
                                            websiteSettings.button_text_color,
                                    }}
                                >
                                    <Building2 size={23} />
                                </div>
                            )}

                            <div className="min-w-0">
                                {websiteSettings.show_company_name !==
                                    false && (
                                    <h1 className="font-black text-lg truncate">
                                        {company.name}
                                    </h1>
                                )}

                                <p className="text-xs opacity-70">
                                    Lost &amp; Found Dashboard
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={fetchDashboard}
                            className="dashboard-button inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                        >
                            <RefreshCw size={16} />
                            <span className="hidden sm:inline">
                                Refresh
                            </span>
                        </button>
                    </div>
                </header>

                <main className="dashboard-content max-w-7xl mx-auto px-5 sm:px-6 py-8">
                    {/* QUICK ACTIONS */}

                    <section>
                        <div className="mb-5">
                            <p
                                className="text-xs uppercase tracking-widest font-bold"
                                style={{
                                    color: websiteSettings.primary_color,
                                }}
                            >
                                Get started
                            </p>

                            <h2 className="text-2xl font-black mt-1">
                                Quick Actions
                            </h2>

                            <p className="text-sm mt-1 opacity-75">
                                Manage your lost and found reports.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            <QuickAction
                                icon={AlertCircle}
                                title="Report Lost Item"
                                description="Tell us about something you've lost."
                                iconClass="bg-red-50 text-red-600"
                                onClick={() =>
                                    navigate(
                                        companyRoute("/customer-report")
                                    )
                                }
                            />

                            <QuickAction
                                icon={Package}
                                title="Report Found Item"
                                description="Help return an item to its owner."
                                iconClass="bg-emerald-50 text-emerald-600"
                                onClick={() =>
                                    navigate(
                                        companyRoute("/found-item")
                                    )
                                }
                            />

                            <QuickAction
                                icon={FolderOpen}
                                title="My Lost Reports"
                                description="Review and manage lost reports."
                                iconClass="bg-blue-50 text-blue-600"
                                onClick={() =>
                                    navigate(
                                        companyRoute("/my-lost-reports")
                                    )
                                }
                            />

                            <QuickAction
                                icon={FileSearch}
                                title="My Found Reports"
                                description="Review items you've reported."
                                iconClass="bg-indigo-50 text-indigo-600"
                                onClick={() =>
                                    navigate(
                                        companyRoute("/my-found-reports")
                                    )
                                }
                            />
                        </div>
                    </section>

                    {/* STATS */}

                    <section className="mt-10">
                        <div className="flex items-end justify-between mb-5">
                            <div>
                                <p
                                    className="text-xs uppercase tracking-widest font-bold"
                                    style={{
                                        color: websiteSettings.primary_color,
                                    }}
                                >
                                    Overview
                                </p>

                                <h2 className="text-2xl font-black mt-1">
                                    Your Activity
                                </h2>

                                <p className="text-sm mt-1 opacity-75">
                                    A summary of your current reports.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                            {statCards.map((card) => {
                                const active =
                                    filter === card.filter;

                                const CardIcon = card.icon;

                                return (
                                    <button
                                        type="button"
                                        key={card.key}
                                        onClick={() =>
                                            setFilter(
                                                active
                                                    ? "all"
                                                    : card.filter
                                            )
                                        }
                                        className="dashboard-card text-left p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                        style={{
                                            backgroundColor:
                                                websiteSettings.card_color,
                                            borderColor: active
                                                ? websiteSettings.primary_color
                                                : websiteSettings.border_line_color,
                                            boxShadow: active
                                                ? `0 0 0 2px ${websiteSettings.primary_color}20`
                                                : undefined,
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div
                                                className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.iconBg} ${card.iconColor}`}
                                            >
                                                <CardIcon size={21} />
                                            </div>

                                            <ChevronRight
                                                size={17}
                                                className="opacity-40"
                                            />
                                        </div>

                                        <p className="text-sm font-medium mt-5 opacity-75">
                                            {card.title}
                                        </p>

                                        <p className="text-3xl font-black mt-1">
                                            {card.value}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* COMPANY */}

                    <section className="mt-10">
                        <div
                            className="dashboard-card p-6"
                            style={{
                                backgroundColor:
                                    websiteSettings.card_color,
                                borderColor:
                                    websiteSettings.border_line_color,
                                borderStyle:
                                    websiteSettings.border_style,
                                borderWidth:
                                    `${websiteSettings.border_width}px`,
                                borderRadius:
                                    `${websiteSettings.border_radius}px`,
                            }}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                                <div className="flex items-center gap-4 min-w-0">
                                    {companyLogoUrl && !logoLoadFailed ? (
                                        <img
                                            src={companyLogoUrl}
                                            alt={
                                                websiteSettings.logo_alt ||
                                                company.name
                                            }
                                            onError={() =>
                                                setLogoLoadFailed(true)
                                            }
                                            className="dashboard-company-logo w-14 h-14 rounded-xl flex-shrink-0"
                                        />
                                    ) : (
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{
                                                backgroundColor:
                                                    websiteSettings.primary_color + "15",
                                                color:
                                                    websiteSettings.primary_color,
                                            }}
                                        >
                                            <Building2 size={22} />
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <p className="text-xs uppercase tracking-wider font-bold opacity-60">
                                            Organization
                                        </p>

                                        <h3 className="text-lg font-bold">
                                            {company.name}
                                        </h3>

                                        <p className="text-sm mt-0.5 opacity-75">
                                            {company.description ||
                                                "Lost & Found Management Platform"}
                                        </p>

                                        {company.location && (
                                            <p className="flex items-center gap-1 text-xs mt-1 opacity-65">
                                                <MapPin size={13} />
                                                {company.location}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (company.slug) {
                                            navigate(
                                                `/company/${encodeURIComponent(
                                                    company.slug
                                                )}`
                                            );
                                        }
                                    }}
                                    className="dashboard-button inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition"
                                >
                                    View Organization
                                    <ArrowRight size={17} />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* RECENT ACTIVITY */}

                    <section className="mt-10">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
                            <div>
                                <p
                                    className="text-xs uppercase tracking-widest font-bold"
                                    style={{
                                        color: websiteSettings.primary_color,
                                    }}
                                >
                                    Reports
                                </p>

                                <h2 className="text-2xl font-black mt-1">
                                    {filter === "all"
                                        ? "Recent Activity"
                                        : `${filter
                                              .charAt(0)
                                              .toUpperCase()}${filter.slice(1)} Reports`}
                                </h2>
                            </div>

                            <div className="flex items-center gap-2">
                                {filter !== "all" && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFilter("all")
                                        }
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition"
                                        style={{
                                            backgroundColor:
                                                websiteSettings.border_color,
                                            border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                                        }}
                                    >
                                        <XCircle size={16} />
                                        Clear Filter
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={fetchDashboard}
                                    className="sm:hidden dashboard-button inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                                >
                                    <RefreshCw size={16} />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {filteredReports.length === 0 ? (
                            <div
                                className="dashboard-card p-12 text-center"
                                style={{
                                    backgroundColor:
                                        websiteSettings.card_color,
                                    borderColor:
                                        websiteSettings.border_line_color,
                                    borderStyle:
                                        websiteSettings.border_style,
                                    borderWidth:
                                        `${websiteSettings.border_width}px`,
                                    borderRadius:
                                        `${websiteSettings.border_radius}px`,
                                }}
                            >
                                <div
                                    className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
                                    style={{
                                        backgroundColor:
                                            websiteSettings.primary_color + "12",
                                        color:
                                            websiteSettings.primary_color,
                                    }}
                                >
                                    <FolderOpen size={28} />
                                </div>

                                <h3 className="text-lg font-bold mt-5">
                                    No reports found
                                </h3>

                                <p className="text-sm mt-2 max-w-md mx-auto opacity-75">
                                    Your recent lost and found reports
                                    will appear here.
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            companyRoute("/customer-report")
                                        )
                                    }
                                    className="dashboard-button mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition"
                                >
                                    <Plus size={17} />
                                    Create Report
                                </button>
                            </div>
                        ) : (
                            <div
                                className="dashboard-card overflow-hidden"
                                style={{
                                    backgroundColor:
                                        websiteSettings.card_color,
                                    borderColor:
                                        websiteSettings.border_line_color,
                                    borderStyle:
                                        websiteSettings.border_style,
                                    borderWidth:
                                        `${websiteSettings.border_width}px`,
                                    borderRadius:
                                        `${websiteSettings.border_radius}px`,
                                }}
                            >
                                <div
                                    className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b text-xs uppercase tracking-wider font-bold opacity-70"
                                    style={{
                                        backgroundColor:
                                            websiteSettings.border_color,
                                        borderColor:
                                            websiteSettings.border_line_color,
                                    }}
                                >
                                    <span>Item</span>
                                    <span>Type</span>
                                    <span>Status</span>
                                    <span>Date</span>
                                    <span>Action</span>
                                </div>

                                {filteredReports.map((report) => {
                                    const customerResponse = String(
                                        report.customer_response || ""
                                    )
                                        .trim()
                                        .toLowerCase();

                                    const reportStatus = String(
                                        report.status || ""
                                    )
                                        .trim()
                                        .toLowerCase();

                                    const canRecover =
                                        Boolean(report.match_id) &&
                                        (
                                            customerResponse === "accepted" ||
                                            customerResponse === "recovery requested" ||
                                            reportStatus === "recovery requested"
                                        );

                                    const lockedStatuses = [
                                        "matched",
                                        "approved",
                                        "recovered",
                                        "recovery requested",
                                    ];

                                    return (
                                        <div
                                            key={`${report.type}-${report.id}`}
                                            className="border-b last:border-b-0"
                                            style={{
                                                borderColor:
                                                    websiteSettings.border_line_color,
                                            }}
                                        >
                                            {/* DESKTOP */}

                                            <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-6 py-5">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    {report.image ? (
                                                        <img
                                                            src={getImageUrl(
                                                                report.image
                                                            )}
                                                            alt={
                                                                report.item_name ||
                                                                "Item"
                                                            }
                                                            className="w-14 h-14 rounded-xl object-cover"
                                                            style={{
                                                                border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                                                            }}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="w-14 h-14 rounded-xl flex items-center justify-center"
                                                            style={{
                                                                backgroundColor:
                                                                    websiteSettings.border_color,
                                                                border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                                                            }}
                                                        >
                                                            <Package
                                                                size={22}
                                                                className="opacity-50"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="min-w-0">
                                                        <h3 className="font-bold truncate">
                                                            {report.item_name ||
                                                                "Unnamed item"}
                                                        </h3>

                                                        <p className="text-sm truncate mt-1 opacity-70">
                                                            {report.category ||
                                                                "Uncategorized"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <span
                                                        className={`inline-flex px-2.5 py-1 rounded-lg border text-xs font-bold ${getTypeStyle(
                                                            report.type
                                                        )}`}
                                                    >
                                                        {report.type || "Unknown"}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span
                                                        className={`inline-flex px-2.5 py-1 rounded-lg border text-xs font-bold ${getStatusStyle(
                                                            report.status
                                                        )}`}
                                                    >
                                                        {report.status || "Unknown"}
                                                    </span>
                                                </div>

                                                <p className="text-sm opacity-70">
                                                    {report.created_at || "—"}
                                                </p>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleView(report)
                                                        }
                                                        title="View"
                                                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                                    >
                                                        <Eye size={17} />
                                                    </button>

                                                    {canRecover && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRecover(report)
                                                            }
                                                            title="Recover"
                                                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                                                        >
                                                            <CheckCircle2 size={17} />
                                                        </button>
                                                    )}

                                                    {!lockedStatuses.includes(
                                                        reportStatus
                                                    ) && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleEdit(report)
                                                                }
                                                                title="Edit"
                                                                className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition"
                                                            >
                                                                <Pencil size={17} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDelete(report)
                                                                }
                                                                title="Delete"
                                                                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                                                            >
                                                                <Trash2 size={17} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* MOBILE */}

                                            <div className="lg:hidden p-5">
                                                <div className="flex gap-4">
                                                    {report.image ? (
                                                        <img
                                                            src={getImageUrl(
                                                                report.image
                                                            )}
                                                            alt={
                                                                report.item_name ||
                                                                "Item"
                                                            }
                                                            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                                                            style={{
                                                                border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                                                            }}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0"
                                                            style={{
                                                                backgroundColor:
                                                                    websiteSettings.border_color,
                                                                border: `${websiteSettings.border_width}px ${websiteSettings.border_style} ${websiteSettings.border_line_color}`,
                                                            }}
                                                        >
                                                            <Package
                                                                size={28}
                                                                className="opacity-50"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap gap-2">
                                                            <span
                                                                className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${getTypeStyle(
                                                                    report.type
                                                                )}`}
                                                            >
                                                                {report.type || "Unknown"}
                                                            </span>

                                                            <span
                                                                className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${getStatusStyle(
                                                                    report.status
                                                                )}`}
                                                            >
                                                                {report.status || "Unknown"}
                                                            </span>
                                                        </div>

                                                        <h3 className="font-bold text-lg mt-3">
                                                            {report.item_name ||
                                                                "Unnamed item"}
                                                        </h3>

                                                        <p className="text-sm mt-1 opacity-70">
                                                            {report.category ||
                                                                "Uncategorized"}
                                                        </p>

                                                        <p className="text-xs mt-2 opacity-60">
                                                            {report.created_at || "—"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mt-5">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleView(report)
                                                        }
                                                        className="dashboard-button inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                                                    >
                                                        <Eye size={16} />
                                                        View
                                                    </button>

                                                    {canRecover && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRecover(report)
                                                            }
                                                            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                            Recover
                                                        </button>
                                                    )}

                                                    {!lockedStatuses.includes(
                                                        reportStatus
                                                    ) && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleEdit(report)
                                                                }
                                                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                                                            >
                                                                <Pencil size={16} />
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDelete(report)
                                                                }
                                                                className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold"
                                                            >
                                                                <Trash2 size={16} />
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* FOOTER */}

                    <footer
                        className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4 border-t pt-6 text-sm opacity-70"
                        style={{
                            borderColor:
                                websiteSettings.border_line_color,
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={17} />
                            Your reports are securely managed.
                        </div>

                        <div className="flex items-center gap-2">
                            <TrendingUp size={17} />
                            {company.name} Lost &amp; Found
                        </div>
                    </footer>
                </main>
            </div>
        </>
    );
}

// ================================================================
// QUICK ACTION
// ================================================================

function QuickAction({
    icon,
    title,
    description,
    iconClass,
    onClick,
}) {
    const IconComponent = icon;

    return (
        <button
            type="button"
            onClick={onClick}
            className="dashboard-card group w-full text-left p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
            <div className="flex items-start justify-between">
                <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconClass}`}
                >
                    <IconComponent size={21} />
                </div>

                <ArrowRight
                    size={18}
                    className="opacity-40 group-hover:translate-x-1 transition-all"
                />
            </div>

            <h3 className="font-bold mt-5">
                {title}
            </h3>

            <p className="text-sm mt-1.5 leading-5 opacity-75">
                {description}
            </p>
        </button>
    );
}

export default DashboardPage;
