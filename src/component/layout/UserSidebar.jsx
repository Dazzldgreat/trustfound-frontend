
import { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import {
    X,
    LayoutDashboard,
    FileWarning,
    PackageCheck,
    FolderOpen,
    Archive,
    Bell,
    LogOut,
    Building2,
    ChevronRight,
    UserRound,
} from "lucide-react";

import { API } from "../../config";
const SERVER_ORIGIN = "https://trustfound-backend.onrender.com";

const DEFAULT_SETTINGS = {
    primary_color: "#2563eb",
    secondary_color: "#dfe1e8",
    background_color: "#f8fafc",
    border_color: "#ffffff",
    border_line_color: "#e2e8f0",
    border_style: "solid",
    border_width: 1,
};

const ALLOWED_BORDER_STYLES = [
    "none",
    "solid",
    "dashed",
    "dotted",
    "double",
];

function getStoredObject(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

function normalizeColor(value, fallback) {
    return typeof value === "string" &&
        /^#[0-9a-fA-F]{6}$/.test(value.trim())
        ? value.trim()
        : fallback;
}

function getBorderStyle(settings = {}) {
    const style = settings.border_style;

    return ALLOWED_BORDER_STYLES.includes(style)
        ? style
        : DEFAULT_SETTINGS.border_style;
}

function normalizeSettings(payload) {
    const raw =
        payload?.settings ||
        payload?.website_settings ||
        payload?.websiteSettings ||
        payload?.data?.settings ||
        payload?.data?.website_settings ||
        payload?.data?.websiteSettings ||
        payload?.data ||
        payload ||
        {};

    const parsedWidth = Number(
        raw.border_width ?? DEFAULT_SETTINGS.border_width
    );

    return {
        ...DEFAULT_SETTINGS,
        ...raw,

        primary_color: normalizeColor(
            raw.primary_color,
            DEFAULT_SETTINGS.primary_color
        ),

        secondary_color: normalizeColor(
            raw.secondary_color,
            DEFAULT_SETTINGS.secondary_color
        ),

        background_color: normalizeColor(
            raw.background_color,
            DEFAULT_SETTINGS.background_color
        ),

        // Fill/background inside bordered elements.
        border_color: normalizeColor(
            raw.border_color,
            DEFAULT_SETTINGS.border_color
        ),

        // Actual border outline.
        border_line_color: normalizeColor(
            raw.border_line_color,
            DEFAULT_SETTINGS.border_line_color
        ),

        border_style: getBorderStyle(raw),

        border_width: Number.isFinite(parsedWidth)
            ? Math.min(10, Math.max(0, parsedWidth))
            : DEFAULT_SETTINGS.border_width,
    };
}

function getImageUrl(value) {
    if (!value || typeof value !== "string") return "";

    if (
        /^(https?:)?\/\//i.test(value) ||
        value.startsWith("data:")
    ) {
        return value;
    }

    return `${SERVER_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
}

async function readResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return response.json();
    }

    const text = await response.text();

    return {
        error: text || `Request failed with status ${response.status}`,
    };
}

function extractSettings(data) {
    return (
        data?.settings ||
        data?.website_settings ||
        data?.websiteSettings ||
        data?.data?.settings ||
        data?.data?.website_settings ||
        data?.data?.websiteSettings ||
        data?.data ||
        data ||
        null
    );
}

export default function UserSidebar({
    sidebarOpen,
    closeSidebar = () => {},
    company,
    companySlug: propCompanySlug,
}) {
    const navigate = useNavigate();
    const { companySlug: routeCompanySlug, slug } = useParams();

    const storedCompany = getStoredObject("company") || {};
    const storedUser = getStoredObject("user") || {};

    const activeCompany = company || storedCompany;

    const activeCompanySlug =
        routeCompanySlug ||
        slug ||
        propCompanySlug ||
        activeCompany?.slug ||
        localStorage.getItem("companySlug") ||
        localStorage.getItem("company_slug") ||
        storedUser.company_slug ||
        storedUser.companySlug ||
        storedUser.organization_slug ||
        storedUser.organizationSlug ||
        "";

    const cacheKey = activeCompanySlug
        ? `websiteSettings_${activeCompanySlug}`
        : "websiteSettings";

    const [settings, setSettings] = useState(() =>
        normalizeSettings(
            getStoredObject(cacheKey) ||
            (activeCompanySlug
                ? {}
                : getStoredObject("websiteSettings")) ||
            {}
        )
    );

    // Reload cached settings immediately when switching companies.
    useEffect(() => {
        const cached =
            getStoredObject(
                activeCompanySlug
                    ? `websiteSettings_${activeCompanySlug}`
                    : "websiteSettings"
            ) || {};

        setSettings(normalizeSettings(cached));
    }, [activeCompanySlug]);

    // Load this company's published website settings.
    useEffect(() => {
        let cancelled = false;

        async function loadSettings() {
            if (!activeCompanySlug) return;

            const currentCacheKey =
                `websiteSettings_${activeCompanySlug}`;

            try {
                const response = await fetch(
                    `${API}/company/public/${encodeURIComponent(
                        activeCompanySlug
                    )}/website/`
                );

                const data = await readResponse(response);

                if (!response.ok) {
                    throw new Error(
                        data?.error ||
                        data?.detail ||
                        data?.message ||
                        "Unable to load company website settings."
                    );
                }

                const returnedSettings = extractSettings(data);

                if (
                    !returnedSettings ||
                    typeof returnedSettings !== "object" ||
                    cancelled
                ) {
                    return;
                }

                const normalized = normalizeSettings(
                    returnedSettings
                );

                setSettings(normalized);

                try {
                    localStorage.setItem(
                        currentCacheKey,
                        JSON.stringify(normalized)
                    );

                    // Keep the legacy cache for pages that still use it.
                    localStorage.setItem(
                        "websiteSettings",
                        JSON.stringify(normalized)
                    );
                } catch (error) {
                    console.error(
                        "Unable to cache sidebar settings:",
                        error
                    );
                }
            } catch (error) {
                if (!cancelled) {
                    console.warn(
                        "Unable to load sidebar theme settings:",
                        error
                    );

                    const cached = getStoredObject(currentCacheKey);

                    if (cached) {
                        setSettings(normalizeSettings(cached));
                    }
                }
            }
        }

        loadSettings();

        return () => {
            cancelled = true;
        };
    }, [activeCompanySlug]);

    // Update the sidebar immediately after settings are saved
    // or Restore Defaults is used in the settings editor.
    useEffect(() => {
        const handleThemeChange = (event) => {
            const changedSlug = event.detail?.companySlug;
            const newSettings = event.detail?.settings;

            if (!newSettings) return;

            if (
                changedSlug &&
                activeCompanySlug &&
                changedSlug !== activeCompanySlug
            ) {
                return;
            }

            const normalized = normalizeSettings(newSettings);

            setSettings(normalized);

            try {
                if (activeCompanySlug) {
                    localStorage.setItem(
                        `websiteSettings_${activeCompanySlug}`,
                        JSON.stringify(normalized)
                    );
                }

                localStorage.setItem(
                    "websiteSettings",
                    JSON.stringify(normalized)
                );
            } catch (error) {
                console.error(
                    "Unable to cache sidebar theme:",
                    error
                );
            }
        };

        window.addEventListener(
            "company-theme-changed",
            handleThemeChange
        );

        return () => {
            window.removeEventListener(
                "company-theme-changed",
                handleThemeChange
            );
        };
    }, [activeCompanySlug]);

    const primaryColor = settings.primary_color;
    const secondaryColor = settings.secondary_color;
    const backgroundColor = settings.background_color;

    // Fill colour inside bordered elements.
    const borderColor = settings.border_color;

    // Colour of the actual border outline.
    const borderLineColor = settings.border_line_color;

    const borderStyle = settings.border_style;
    const borderWidth = settings.border_width;

    const companyLogo = getImageUrl(
        activeCompany?.logo_url || activeCompany?.logo
    );

    const displayName =
        storedUser.full_name ||
        storedUser.name ||
        storedUser.username ||
        storedUser.email ||
        "Customer";

    const companyRoute = (path = "") => {
        const cleanPath = path
            ? path.startsWith("/")
                ? path
                : `/${path}`
            : "";

        if (!activeCompanySlug) {
            return cleanPath || "/dashboard";
        }

        return `/company/${encodeURIComponent(
            activeCompanySlug
        )}${cleanPath}`;
    };

    const logout = () => {
        [
            "access",
            "refresh",
            "access_token",
            "refresh_token",
            "token",
            "user",
        ].forEach((key) => localStorage.removeItem(key));

        navigate(
            activeCompanySlug
                ? `/company/${encodeURIComponent(activeCompanySlug)}`
                : "/",
            { replace: true }
        );
    };

    const menus = [
        {
            name: "Dashboard",
            description: "Overview",
            path: companyRoute("/dashboard"),
            icon: LayoutDashboard,
        },
        {
            name: "Report Lost Item",
            description: "Report something missing",
            path: companyRoute("/customer-report"),
            icon: FileWarning,
        },
        {
            name: "Report Found Item",
            description: "Help return an item",
            path: companyRoute("/found-item"),
            icon: PackageCheck,
        },
        {
            name: "My Lost Reports",
            description: "View your lost items",
            path: companyRoute("/my-lost-reports"),
            icon: FolderOpen,
        },
        {
            name: "My Found Reports",
            description: "View found items",
            path: companyRoute("/my-found-reports"),
            icon: Archive,
        },
        {
            name: "Notifications",
            description: "Updates and alerts",
            path: companyRoute("/notifications"),
            icon: Bell,
        },
    ];

    const outlineStyle = {
        borderColor: borderLineColor,
        borderStyle,
        borderWidth: `${borderWidth}px`,
    };

    return (
        <>
            {/* MOBILE OVERLAY */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 backdrop-blur-sm md:hidden"
                    style={{
                        backgroundColor: "rgba(2, 6, 23, 0.6)",
                    }}
                    onClick={closeSidebar}
                />
            )}

            {/* SIDEBAR */}
            <aside
                className={`
                    fixed md:sticky
                    top-0 left-0 z-50
                    flex h-screen w-72 flex-col
                    overflow-hidden shadow-2xl
                    transition-transform duration-300 ease-in-out
                    ${
                        sidebarOpen
                            ? "translate-x-0"
                            : "-translate-x-full md:translate-x-0"
                    }
                `}
                style={{
                    backgroundColor: secondaryColor,
                    color: "#ffffff",
                }}
            >
                {/* COMPANY HEADER */}
                <div
                    className="px-5 pb-5 pt-6"
                    style={{
                        borderBottom: `${borderWidth}px ${borderStyle} ${borderLineColor}`,
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            {companyLogo ? (
                                <img
                                    src={companyLogo}
                                    alt={activeCompany?.name || "Company"}
                                    className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm"
                                    style={{
                                        ...outlineStyle,
                                        backgroundColor: borderColor,
                                    }}
                                    onError={(event) => {
                                        event.currentTarget.style.display = "none";
                                    }}
                                />
                            ) : (
                                <div
                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black shadow-lg"
                                    style={{
                                        backgroundColor: primaryColor,
                                        color: "#ffffff",
                                        ...outlineStyle,
                                    }}
                                >
                                    {activeCompany?.name
                                        ?.substring(0, 2)
                                        .toUpperCase() || "CO"}
                                </div>
                            )}

                            <div className="min-w-0">
                                <p
                                    className="text-[11px] font-bold uppercase tracking-widest"
                                    style={{ color: "#cbd5e1" }}
                                >
                                    Organization
                                </p>

                                <h1 className="mt-1 truncate text-base font-bold">
                                    {activeCompany?.name || "TrustFound"}
                                </h1>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={closeSidebar}
                            className="rounded-lg p-2 transition md:hidden"
                            style={{ color: "#cbd5e1" }}
                            aria-label="Close sidebar"
                        >
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* USER PROFILE */}
                <div className="px-5 py-4">
                    <div
                        className="flex items-center gap-3 rounded-xl px-3 py-3"
                        style={{
                            // Fill and outline are separate settings.
                            backgroundColor: borderColor,
                            ...outlineStyle,
                        }}
                    >
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                            style={{
                                backgroundColor: primaryColor,
                                color: "#ffffff",
                            }}
                        >
                            <UserRound size={19} />
                        </div>

                        <div className="min-w-0">
                            <p
                                className="text-xs"
                                style={{ color: secondaryColor }}
                            >
                                Signed in as
                            </p>

                            <p
                                className="truncate text-sm font-semibold"
                                style={{ color: secondaryColor }}
                            >
                                {displayName}
                            </p>
                        </div>
                    </div>
                </div>

                {/* NAVIGATION LABEL */}
                <div className="px-5 pt-2">
                    <p
                        className="mb-3 px-3 text-[11px] font-bold uppercase tracking-widest"
                        style={{ color: "#94a3b8" }}
                    >
                        Customer Portal
                    </p>
                </div>

                {/* NAVIGATION */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-5">
                    {menus.map((menu) => {
                        const Icon = menu.icon;

                        return (
                            <NavLink
                                key={menu.name}
                                to={menu.path}
                                onClick={closeSidebar}
                                className="group relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200"
                                style={({ isActive }) => ({
                                    backgroundColor: isActive
                                        ? primaryColor
                                        : "transparent",
                                    color: "#ffffff",
                                })}
                                onMouseEnter={(event) => {
                                    if (
                                        !event.currentTarget.getAttribute(
                                            "aria-current"
                                        )
                                    ) {
                                        event.currentTarget.style.backgroundColor =
                                            borderColor;
                                        event.currentTarget.style.color =
                                            secondaryColor;
                                    }
                                }}
                                onMouseLeave={(event) => {
                                    if (
                                        !event.currentTarget.getAttribute(
                                            "aria-current"
                                        )
                                    ) {
                                        event.currentTarget.style.backgroundColor =
                                            "transparent";
                                        event.currentTarget.style.color =
                                            "#ffffff";
                                    }
                                }}
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <span
                                                className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full"
                                                style={{
                                                    backgroundColor: "#ffffff",
                                                }}
                                            />
                                        )}

                                        <div
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition"
                                            style={{
                                                backgroundColor: isActive
                                                    ? "rgba(255,255,255,0.15)"
                                                    : backgroundColor,
                                                color: isActive
                                                    ? "#ffffff"
                                                    : primaryColor,
                                                border: `${borderWidth}px ${borderStyle} ${borderLineColor}`,
                                            }}
                                        >
                                            <Icon size={19} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">
                                                {menu.name}
                                            </p>

                                            <p
                                                className="mt-0.5 truncate text-[11px]"
                                                style={{
                                                    color: isActive
                                                        ? "#ffffff"
                                                        : "#cbd5e1",
                                                }}
                                            >
                                                {menu.description}
                                            </p>
                                        </div>

                                        <ChevronRight
                                            size={16}
                                            className={`shrink-0 transition ${
                                                isActive
                                                    ? "opacity-100"
                                                    : "opacity-0 group-hover:opacity-70"
                                            }`}
                                        />
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* COMPANY INFORMATION */}
                {activeCompany && (
                    <div className="px-4 pb-4">
                        <button
                            type="button"
                            onClick={() => {
                                if (activeCompanySlug) {
                                    navigate(
                                        `/company/${encodeURIComponent(
                                            activeCompanySlug
                                        )}`
                                    );
                                    closeSidebar();
                                }
                            }}
                            disabled={!activeCompanySlug}
                            className="w-full rounded-xl p-3 text-left transition disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: borderColor,
                                ...outlineStyle,
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                                    style={{
                                        backgroundColor,
                                        color: primaryColor,
                                        border: `${borderWidth}px ${borderStyle} ${borderLineColor}`,
                                    }}
                                >
                                    <Building2 size={17} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p
                                        className="text-[10px] font-bold uppercase tracking-wider"
                                        style={{ color: secondaryColor }}
                                    >
                                        Active organization
                                    </p>

                                    <p
                                        className="mt-1 truncate text-sm font-semibold"
                                        style={{ color: secondaryColor }}
                                    >
                                        {activeCompany.name || "TrustFound"}
                                    </p>
                                </div>

                                <ChevronRight
                                    size={16}
                                    style={{ color: secondaryColor }}
                                />
                            </div>
                        </button>
                    </div>
                )}

                {/* LOGOUT */}
                <div
                    className="p-4"
                    style={{
                        borderTop: `${borderWidth}px ${borderStyle} ${borderLineColor}`,
                    }}
                >
                    <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition-all duration-200 hover:border-red-500 hover:bg-red-500 hover:text-white"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
