import React, {
    useCallback,
    useEffect,
    useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import ReportCard from "../../component/Reports/ReportCard";
import ReportFilters from "../../component/Reports/ReportFilters";
import SearchBar from "../../component/Reports/SearchBar";

const API = "http://127.0.0.1:8000/api";
const SERVER = "http://127.0.0.1:8000";

// ============================================================
// DEFAULT WEBSITE SETTINGS
// ============================================================

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
    content_width: 1280,
    font_family: "Inter",
};

// ============================================================
// HELPERS
// ============================================================

function getStoredObject(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
        return {};
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
            !candidate ||
            typeof candidate !== "object" ||
            Array.isArray(candidate)
        ) {
            continue;
        }

        const keys = [
            "primary_color",
            "primaryColor",
            "secondary_color",
            "secondaryColor",
            "background_color",
            "backgroundColor",
            "border_color",
            "borderColor",
            "border_line_color",
            "borderLineColor",
        ];

        if (keys.some((key) => candidate[key] !== undefined)) {
            return candidate;
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

// ============================================================
// MAIN COMPONENT
// ============================================================

function MyLostReports() {
    const navigate = useNavigate();
    const { companySlug } = useParams();

    // ============================================================
    // AUTH / COMPANY
    // ============================================================

    const access =
        localStorage.getItem("access_token") ||
        localStorage.getItem("access");

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

    // ============================================================
    // COMPANY ROUTE
    // ============================================================

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

    // ============================================================
    // IMAGE URL
    // ============================================================

    const getImageUrl = useCallback((image) => {
        if (!image) {
            return "";
        }

        let imageUrl = String(image).trim();

        // Fix malformed URL such as:
        // http//127.0.0.1:8000/media/...
        imageUrl = imageUrl.replace(
            /^https?:\/\/https?:\/\//i,
            "http://"
        );

        imageUrl = imageUrl.replace(
            /^https?\/\/127\.0\.0\.1:8000/i,
            SERVER
        );

        imageUrl = imageUrl.replace(
            /^http\/\/127\.0\.0\.1:8000/i,
            SERVER
        );

        // Already a valid absolute URL
        if (
            imageUrl.startsWith("http://") ||
            imageUrl.startsWith("https://")
        ) {
            return imageUrl;
        }

        // Relative media URL
        if (imageUrl.startsWith("/")) {
            return `${SERVER}${imageUrl}`;
        }

        // Relative path without /
        return `${SERVER}/${imageUrl}`;
    }, []);

    // ============================================================
    // STATE
    // ============================================================

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const [websiteSettings, setWebsiteSettings] = useState(
        DEFAULT_WEBSITE_SETTINGS
    );

    // ============================================================
    // FETCH WEBSITE SETTINGS
    // ============================================================

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
                    throw new Error(
                        "Unable to load website settings."
                    );
                }

                const data = await response.json();

                const normalized = normalizeWebsiteSettings(
                    getWebsiteSettings(data)
                );

                if (!cancelled) {
                    setWebsiteSettings(normalized);
                }
            } catch (err) {
                console.error(
                    "WEBSITE SETTINGS ERROR:",
                    err
                );

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

    // ============================================================
    // THEME VARIABLES
    // ============================================================

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

    // ============================================================
    // FETCH LOST REPORTS
    // ============================================================

    const fetchReports = useCallback(async () => {
        const token =
            localStorage.getItem("access_token") ||
            localStorage.getItem("access");

        if (!token) {
            navigate(companyRoute("/login-page"), {
                replace: true,
            });

            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API}/my-lost-items/`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            const data = await response.json().catch(() => ({}));

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

                    navigate(companyRoute("/login-page"), {
                        replace: true,
                    });

                    return;
                }

                throw new Error(
                    data.detail ||
                    data.error ||
                    "Unable to load lost reports."
                );
            }

            const items = Array.isArray(data)
                ? data
                : Array.isArray(data.results)
                    ? data.results
                    : Array.isArray(data.reports)
                        ? data.reports
                        : [];

            const formatted = items.map((item) => {
                const rawImage =
                    item.image ||
                    item.image_url ||
                    item.photo ||
                    item.photo_url ||
                    "";

                return {
                    ...item,
                    type: "Lost",
                    image: getImageUrl(rawImage),
                };
            });

            console.log(
                "FORMATTED LOST REPORTS:",
                formatted
            );

            setReports(formatted);
        } catch (err) {
            console.error(
                "MY LOST REPORTS ERROR:",
                err
            );

            setError(
                err.message ||
                "Unable to load your lost reports."
            );
        } finally {
            setLoading(false);
        }
    }, [navigate, companyRoute, getImageUrl]);

    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {
        if (!access) {
            navigate(companyRoute("/login-page"), {
                replace: true,
            });

            return;
        }

        fetchReports();
    }, [
        access,
        activeCompanySlug,
        companyRoute,
        fetchReports,
        navigate,
    ]);

    // ============================================================
    // STATISTICS
    // ============================================================

    const stats = {
        total: reports.length,

        pending: reports.filter(
            (report) =>
                String(report.status || "")
                    .trim()
                    .toLowerCase() === "pending"
        ).length,

        matched: reports.filter(
            (report) =>
                String(report.status || "")
                    .trim()
                    .toLowerCase() === "matched"
        ).length,

        approved: reports.filter(
            (report) =>
                String(report.status || "")
                    .trim()
                    .toLowerCase() === "approved"
        ).length,

        recovered: reports.filter(
            (report) =>
                String(report.status || "")
                    .trim()
                    .toLowerCase() === "recovered"
        ).length,
    };

    // ============================================================
    // SEARCH + FILTER
    // ============================================================

    const filteredReports = reports.filter((report) => {
        const searchValue = search.trim().toLowerCase();

        const matchesSearch =
            !searchValue ||
            String(report.item_name || "")
                .toLowerCase()
                .includes(searchValue) ||
            String(report.category || "")
                .toLowerCase()
                .includes(searchValue) ||
            String(report.location || "")
                .toLowerCase()
                .includes(searchValue) ||
            String(report.description || "")
                .toLowerCase()
                .includes(searchValue);

        if (!matchesSearch) {
            return false;
        }

        if (filter === "all" || filter === "lost") {
            return true;
        }

        const status = String(report.status || "")
            .trim()
            .toLowerCase();

        if (filter === "Pending") {
            return status === "pending";
        }

        if (filter === "Matched") {
            return status === "matched";
        }

        if (filter === "Approved") {
            return status === "approved";
        }

        if (filter === "Recovered") {
            return status === "recovered";
        }

        return true;
    });

    // ============================================================
    // VIEW REPORT
    // ============================================================

    const handleView = (report) => {
        const status = String(report.status || "")
            .trim()
            .toLowerCase();

        if (
            report.match_id &&
            [
                "matched",
                "approved",
                "recovery requested",
                "recovered",
            ].includes(status)
        ) {
            navigate(
                companyRoute(
                    `/customer-match/${report.match_id}`
                )
            );

            return;
        }

        navigate(
            companyRoute(`/lost-item/${report.id}`)
        );
    };

    // ============================================================
    // EDIT REPORT
    // ============================================================

    const handleEdit = (report) => {
        const status = String(report.status || "")
            .trim()
            .toLowerCase();

        if (
            [
                "matched",
                "approved",
                "recovery requested",
                "recovered",
            ].includes(status)
        ) {
            return;
        }

        navigate(
            companyRoute(`/edit-lost-item/${report.id}`)
        );
    };

    // ============================================================
    // DELETE REPORT
    // ============================================================

    const handleDelete = async (report) => {
        const status = String(report.status || "")
            .trim()
            .toLowerCase();

        if (
            [
                "matched",
                "approved",
                "recovery requested",
                "recovered",
            ].includes(status)
        ) {
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this lost report?"
        );

        if (!confirmed) {
            return;
        }

        const token =
            localStorage.getItem("access_token") ||
            localStorage.getItem("access");

        if (!token) {
            navigate(companyRoute("/login-page"), {
                replace: true,
            });

            return;
        }

        try {
            const response = await fetch(
                `${API}/lost-items/${report.id}/delete/`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                localStorage.removeItem("access");
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("user");

                navigate(companyRoute("/login-page"), {
                    replace: true,
                });

                return;
            }

            if (!response.ok) {
                const data = await response
                    .json()
                    .catch(() => ({}));

                throw new Error(
                    data.detail ||
                    data.error ||
                    "Unable to delete report."
                );
            }

            await fetchReports();
        } catch (err) {
            console.error(
                "DELETE LOST REPORT ERROR:",
                err
            );

            alert(
                err.message ||
                "Unable to delete this report."
            );
        }
    };

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <div
                className="my-lost-theme min-h-screen flex items-center justify-center p-6"
                style={themeStyle}
            >
                <ThemeStyles />

                <div className="theme-card w-full max-w-md p-10 text-center shadow-xl">
                    <div className="theme-outline w-16 h-16 mx-auto flex items-center justify-center">
                        <div className="theme-spinner w-8 h-8 border-4 rounded-full animate-spin" />
                    </div>

                    <h2 className="theme-heading text-xl font-bold mt-6">
                        Loading Lost Reports
                    </h2>

                    <p className="theme-muted mt-2">
                        We're getting your lost item reports...
                    </p>
                </div>
            </div>
        );
    }

    // ============================================================
    // PAGE
    // ============================================================

    return (
        <div
            className="my-lost-theme min-h-screen p-5 sm:p-8"
            style={themeStyle}
        >
            <ThemeStyles />

            <div
                className="mx-auto"
                style={{
                    maxWidth: "var(--content-width)",
                }}
            >
                {/* HEADER */}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
                    <div>
                        <p className="text-xs uppercase tracking-widest font-bold theme-primary-text">
                            Reports
                        </p>

                        <h1 className="theme-heading text-3xl sm:text-4xl font-black mt-1">
                            My Lost Reports
                        </h1>

                        <p className="theme-muted mt-2">
                            View and manage every lost item you've reported.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                companyRoute("/customer-report")
                            )
                        }
                        className="theme-primary-button px-5 py-3 font-semibold"
                    >
                        Report Lost Item
                    </button>
                </div>

                {/* ERROR */}

                {error && (
                    <div className="theme-error mb-8 p-5">
                        <p className="font-semibold">
                            Unable to load reports
                        </p>

                        <p className="text-sm mt-1">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={fetchReports}
                            className="mt-3 text-sm font-bold underline"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* STATISTICS */}

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {[
                        {
                            label: "Total",
                            value: stats.total,
                            filter: "all",
                        },
                        {
                            label: "Pending",
                            value: stats.pending,
                            filter: "Pending",
                        },
                        {
                            label: "Matched",
                            value: stats.matched,
                            filter: "Matched",
                        },
                        {
                            label: "Approved",
                            value: stats.approved,
                            filter: "Approved",
                        },
                        {
                            label: "Recovered",
                            value: stats.recovered,
                            filter: "Recovered",
                        },
                    ].map((stat) => (
                        <button
                            key={stat.label}
                            type="button"
                            onClick={() => setFilter(stat.filter)}
                            className={`theme-stat-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
                                filter === stat.filter
                                    ? "theme-stat-active"
                                    : ""
                            }`}
                        >
                            <p className="theme-muted text-sm font-medium">
                                {stat.label}
                            </p>

                            <h2 className="theme-heading text-4xl font-black mt-2">
                                {stat.value}
                            </h2>
                        </button>
                    ))}
                </div>

                {/* SEARCH */}

                <div className="theme-component">
                    <SearchBar
                        search={search}
                        setSearch={setSearch}
                        placeholder="Search lost reports..."
                    />
                </div>

                {/* FILTERS */}

                <div className="theme-component mt-6">
                    <ReportFilters
                        filter={filter}
                        setFilter={setFilter}
                    />
                </div>

                {/* REPORT COUNT */}

                <div className="flex items-center justify-between mt-8 mb-5 gap-4">
                    <div>
                        <h2 className="theme-heading text-xl font-black">
                            Lost Reports
                        </h2>

                        <p className="theme-muted text-sm mt-1">
                            Showing{" "}
                            <span className="theme-heading font-semibold">
                                {filteredReports.length}
                            </span>{" "}
                            of{" "}
                            <span className="theme-heading font-semibold">
                                {reports.length}
                            </span>{" "}
                            reports
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchReports}
                        className="theme-primary-text text-sm font-semibold hover:underline"
                    >
                        Refresh
                    </button>
                </div>

                {/* REPORTS */}

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredReports.length === 0 ? (
                        <div className="theme-card col-span-full p-10 sm:p-16 text-center">
                            <div className="theme-outline w-16 h-16 mx-auto flex items-center justify-center">
                                <span className="text-2xl">
                                    🔍
                                </span>
                            </div>

                            <h2 className="theme-heading text-2xl font-bold mt-5">
                                No Reports Found
                            </h2>

                            <p className="theme-muted mt-2">
                                {search
                                    ? "Try changing your search."
                                    : "You haven't reported any lost items yet."}
                            </p>

                            {!search && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            companyRoute("/customer-report")
                                        )
                                    }
                                    className="theme-primary-button mt-6 px-5 py-2.5 font-semibold"
                                >
                                    Report Lost Item
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredReports.map((report) => (
                            <div
                                key={report.id}
                                className="theme-component"
                            >
                                <ReportCard
                                    report={report}
                                    onView={handleView}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            </div>
                        ))
                    )}
                </div>

                {/* FOOTER */}

                <div className="theme-footer mt-10 pt-6 text-sm text-center">
                    Your lost reports are securely managed by TrustFound.
                </div>
            </div>
        </div>
    );
}

// ============================================================
// THEME STYLES
// ============================================================

function ThemeStyles() {
    return (
        <style>{`
            .my-lost-theme {
                background: var(--page-background);
                color: var(--text-color);
                font-family: var(--font-family);
            }

            .my-lost-theme .theme-heading {
                color: var(--heading-color);
            }

            .my-lost-theme .theme-muted {
                color: var(--text-color);
                opacity: 0.75;
            }

            .my-lost-theme .theme-primary-text {
                color: var(--primary-color);
            }

            .my-lost-theme .theme-card {
                background: var(--card-color);
                border: var(--border-width) var(--border-style) var(--border-line-color);
                border-radius: var(--border-radius);
            }

            .my-lost-theme .theme-outline {
                background: var(--border-fill-color);
                border: var(--border-width) var(--border-style) var(--border-line-color);
                border-radius: var(--border-radius);
            }

            .my-lost-theme .theme-primary-button {
                background: var(--primary-color);
                color: var(--button-text-color);
                border: var(--border-width) var(--border-style) var(--border-line-color);
                border-radius: var(--border-radius);
            }

            .my-lost-theme .theme-primary-button:hover {
                background: var(--secondary-color);
            }

            .my-lost-theme .theme-stat-card {
                background: var(--card-color);
                border: var(--border-width) var(--border-style) var(--border-line-color);
                border-radius: var(--border-radius);
            }

            .my-lost-theme .theme-stat-active {
                outline: 2px solid var(--primary-color);
                outline-offset: 1px;
            }

            .my-lost-theme .theme-spinner {
                border-color: var(--primary-color);
                border-top-color: transparent;
            }

            .my-lost-theme .theme-error {
                background: var(--border-fill-color);
                color: var(--text-color);
                border: var(--border-width) var(--border-style) var(--border-line-color);
                border-radius: var(--border-radius);
            }

            .my-lost-theme .theme-footer {
                color: var(--text-color);
                opacity: 0.7;
                border-top: var(--border-width) var(--border-style) var(--border-line-color);
            }

            /* Shared report components */

            .my-lost-theme .theme-component {
                font-family: var(--font-family);
            }

            .my-lost-theme .theme-component .bg-white {
                background-color: var(--card-color);
            }

            .my-lost-theme .theme-component .bg-slate-50,
            .my-lost-theme .theme-component .bg-gray-50 {
                background-color: var(--border-fill-color);
            }

            .my-lost-theme .theme-component .text-slate-900,
            .my-lost-theme .theme-component .text-slate-800,
            .my-lost-theme .theme-component .text-gray-900,
            .my-lost-theme .theme-component .text-gray-800 {
                color: var(--heading-color);
            }

            .my-lost-theme .theme-component .text-slate-700,
            .my-lost-theme .theme-component .text-slate-600,
            .my-lost-theme .theme-component .text-slate-500,
            .my-lost-theme .theme-component .text-gray-700,
            .my-lost-theme .theme-component .text-gray-600,
            .my-lost-theme .theme-component .text-gray-500 {
                color: var(--text-color);
            }

            .my-lost-theme .theme-component .border-slate-200,
            .my-lost-theme .theme-component .border-slate-300,
            .my-lost-theme .theme-component .border-gray-200,
            .my-lost-theme .theme-component .border-gray-300 {
                border-color: var(--border-line-color);
                border-style: var(--border-style);
                border-width: var(--border-width);
            }

            .my-lost-theme .theme-component .rounded-xl,
            .my-lost-theme .theme-component .rounded-2xl,
            .my-lost-theme .theme-component .rounded-3xl {
                border-radius: var(--border-radius);
            }

            .my-lost-theme .theme-component input,
            .my-lost-theme .theme-component select,
            .my-lost-theme .theme-component textarea {
                font-family: var(--font-family);
                color: var(--text-color);
                background-color: var(--card-color);
                border-color: var(--border-line-color);
                border-radius: var(--border-radius);
            }

            .my-lost-theme .theme-component input:focus,
            .my-lost-theme .theme-component select:focus,
            .my-lost-theme .theme-component textarea:focus {
                border-color: var(--primary-color);
                outline-color: var(--primary-color);
            }

            .my-lost-theme .theme-component .bg-blue-600 {
                background-color: var(--primary-color);
                color: var(--button-text-color);
            }

            .my-lost-theme .theme-component .hover\\:bg-blue-700:hover {
                background-color: var(--secondary-color);
            }

            .my-lost-theme .theme-component .text-blue-600 {
                color: var(--primary-color);
            }
        `}</style>
    );
}

export default MyLostReports;
