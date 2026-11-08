
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
    ChevronRight,
    UserRound,
} from "lucide-react";

import { API } from "../../config";
import { BRAND, isLightColor, readableTextColor, resolveMediaUrl, withAlpha, upgradeLegacyColor } from "../../theme";

const DEFAULT_SETTINGS = {
    primary_color: BRAND.primary,
    secondary_color: BRAND.graphite,
    background_color: BRAND.background,
    border_color: BRAND.card,
    border_line_color: BRAND.border,
    border_style: "solid",
    border_width: 1,
};

// Website Settings caches the live theme under this key; the
// sidebar keeps its own cache under websiteSettings_<slug>.
function getCachedTheme(slug) {
    if (!slug) return getStoredObject("websiteSettings");

    return (
        getStoredObject(`trustfound_theme_${slug}`) ||
        getStoredObject(`websiteSettings_${slug}`)
    );
}

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
    value = upgradeLegacyColor(value);
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

const getImageUrl = resolveMediaUrl;

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
        normalizeSettings(getCachedTheme(activeCompanySlug) || {})
    );

    // Reload cached settings immediately when switching companies.
    useEffect(() => {
        setSettings(
            normalizeSettings(getCachedTheme(activeCompanySlug) || {})
        );
    }, [activeCompanySlug, cacheKey]);

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

            // Website Settings sends the theme flat in event.detail;
            // older callers nest it under detail.settings.
            const newSettings =
                event.detail?.settings || event.detail;

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

    // ============================================================
    // SIDEBAR COLOURS
    // The sidebar follows the company theme (secondary colour for
    // the panel, primary colour for the active item). Text colour is
    // picked automatically so it stays readable on any background.
    // ============================================================

    const primaryColor = settings.primary_color;
    const panelColor = settings.secondary_color;
    const panelIsLight = isLightColor(panelColor);
    const panelText = readableTextColor(panelColor);
    const panelMuted = panelIsLight
        ? withAlpha(BRAND.graphite, 0.6)
        : "rgba(255, 255, 255, 0.6)";
    const panelSoft = panelIsLight
        ? withAlpha(BRAND.graphite, 0.06)
        : "rgba(255, 255, 255, 0.07)";
    const panelHover = panelIsLight
        ? withAlpha(BRAND.graphite, 0.08)
        : "rgba(255, 255, 255, 0.1)";
    const panelDivider = panelIsLight
        ? withAlpha(BRAND.graphite, 0.1)
        : "rgba(255, 255, 255, 0.1)";
    const activeText = readableTextColor(primaryColor);

    // Prefer the logo uploaded in Website Settings, then the
    // company profile logo.
    const companyLogo = getImageUrl(
        (typeof settings.logo === "string" && settings.logo) ||
            activeCompany?.logo_url ||
            activeCompany?.logo
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


    return (
        <>
            {/* MOBILE OVERLAY */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-sm md:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* SIDEBAR */}
            <aside
                className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col overflow-hidden shadow-2xl transition-[transform,background-color] duration-300 ease-in-out md:sticky md:shadow-none ${
                    sidebarOpen
                        ? "translate-x-0"
                        : "-translate-x-full md:translate-x-0"
                }`}
                style={{
                    backgroundColor: panelColor,
                    color: panelText,
                    "--sb-hover": panelHover,
                }}
            >
                {/* COMPANY HEADER */}
                <div
                    className="flex items-center justify-between px-5 pb-5 pt-6"
                    style={{ borderBottom: `1px solid ${panelDivider}` }}
                >
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
                        className="flex min-w-0 items-center gap-3 text-left"
                        title="Open organisation page"
                    >
                        {companyLogo ? (
                            <img
                                src={companyLogo}
                                alt={activeCompany?.name || "Company"}
                                className="h-11 w-11 shrink-0 rounded-xl bg-white object-contain p-1 shadow-sm"
                                onError={(event) => {
                                    event.currentTarget.style.display =
                                        "none";
                                }}
                            />
                        ) : (
                            <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold shadow-sm"
                                style={{
                                    backgroundColor: primaryColor,
                                    color: activeText,
                                }}
                            >
                                {activeCompany?.name
                                    ?.substring(0, 2)
                                    .toUpperCase() || "TF"}
                            </div>
                        )}

                        <div className="min-w-0">
                            <p
                                className="text-[11px] font-bold uppercase tracking-widest"
                                style={{ color: panelMuted }}
                            >
                                Organisation
                            </p>
                            <h1 className="mt-0.5 truncate text-base font-bold">
                                {activeCompany?.name || "TrustFound"}
                            </h1>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={closeSidebar}
                        className="rounded-lg p-2 transition hover:bg-[var(--sb-hover)] md:hidden"
                        style={{ color: panelMuted }}
                        aria-label="Close sidebar"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* USER PROFILE */}
                <div className="px-4 py-4">
                    <div
                        className="flex items-center gap-3 rounded-2xl px-3 py-3"
                        style={{ backgroundColor: panelSoft }}
                    >
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                            style={{
                                backgroundColor: primaryColor,
                                color: activeText,
                            }}
                        >
                            <UserRound size={19} />
                        </div>

                        <div className="min-w-0">
                            <p
                                className="text-xs"
                                style={{ color: panelMuted }}
                            >
                                Signed in as
                            </p>
                            <p className="truncate text-sm font-semibold">
                                {displayName}
                            </p>
                        </div>
                    </div>
                </div>

                {/* NAVIGATION LABEL */}
                <p
                    className="px-7 pb-2 pt-1 text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: panelMuted }}
                >
                    Customer portal
                </p>

                {/* NAVIGATION */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-5">
                    {menus.map((menu) => {
                        const Icon = menu.icon;

                        return (
                            <NavLink
                                key={menu.name}
                                to={menu.path}
                                end
                                onClick={closeSidebar}
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 ${
                                        isActive
                                            ? "shadow-md"
                                            : "hover:bg-[var(--sb-hover)]"
                                    }`
                                }
                                style={({ isActive }) =>
                                    isActive
                                        ? {
                                              backgroundColor: primaryColor,
                                              color: activeText,
                                          }
                                        : { color: panelText }
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <div
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition"
                                            style={{
                                                backgroundColor: isActive
                                                    ? "rgba(255,255,255,0.18)"
                                                    : panelSoft,
                                                color: isActive
                                                    ? activeText
                                                    : primaryColor,
                                            }}
                                        >
                                            <Icon size={18} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">
                                                {menu.name}
                                            </p>
                                            <p
                                                className="truncate text-[11px]"
                                                style={{
                                                    color: isActive
                                                        ? activeText
                                                        : panelMuted,
                                                    opacity: isActive
                                                        ? 0.85
                                                        : 1,
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
                                                    : "opacity-0 group-hover:opacity-60"
                                            }`}
                                        />
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* LOGOUT */}
                <div
                    className="p-4"
                    style={{ borderTop: `1px solid ${panelDivider}` }}
                >
                    <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500 transition hover:border-red-500 hover:bg-red-500 hover:text-white"
                    >
                        <LogOut size={18} />
                        Sign out
                    </button>
                </div>
            </aside>
        </>
    );
}
