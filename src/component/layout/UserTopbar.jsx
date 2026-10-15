import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Menu, Bell, ChevronDown } from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const DEFAULT_SETTINGS = {
    primary_color: "#2563eb",
    secondary_color: "#0f172a",
    background_color: "#f8fafc",
    border_color: "#ffffff",
    border_line_color: "#e2e8f0",
    border_style: "solid",
    border_width: 1,
};

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function getStoredObject(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : {};
    } catch {
        return {};
    }
}

function getValidColor(value, fallback) {
    return typeof value === "string" && HEX_COLOR_REGEX.test(value.trim())
        ? value.trim()
        : fallback;
}

function normalizeSettings(settings = {}) {
    const styles = ["solid", "dashed", "dotted", "double", "none"];
    const width = Number(settings.border_width);

    return {
        ...DEFAULT_SETTINGS,
        ...settings,
        primary_color: getValidColor(
            settings.primary_color,
            DEFAULT_SETTINGS.primary_color
        ),
        secondary_color: getValidColor(
            settings.secondary_color,
            DEFAULT_SETTINGS.secondary_color
        ),
        background_color: getValidColor(
            settings.background_color,
            DEFAULT_SETTINGS.background_color
        ),
        border_color: getValidColor(
            settings.border_color,
            DEFAULT_SETTINGS.border_color
        ),
        border_line_color: getValidColor(
            settings.border_line_color,
            DEFAULT_SETTINGS.border_line_color
        ),
        border_style: styles.includes(settings.border_style)
            ? settings.border_style
            : DEFAULT_SETTINGS.border_style,
        border_width: Number.isFinite(width)
            ? Math.min(10, Math.max(0, width))
            : DEFAULT_SETTINGS.border_width,
    };
}

function getResponseSettings(data) {
    return (
        data?.settings ??
        data?.website_settings ??
        data?.data?.settings ??
        data?.data?.website_settings ??
        data?.data ??
        data
    );
}

function getInitialSettings(slug) {
    if (slug) {
        const cached = getStoredObject(`websiteSettings_${slug}`);

        if (Object.keys(cached).length > 0) {
            return normalizeSettings(cached);
        }
    }

    const generalCached = getStoredObject("websiteSettings");

    return Object.keys(generalCached).length > 0
        ? normalizeSettings(generalCached)
        : DEFAULT_SETTINGS;
}

function resolveCompanySlug(routeSlug, propSlug, company, user) {
    return (
        routeSlug ||
        propSlug ||
        company?.slug ||
        user?.company_slug ||
        user?.companySlug ||
        user?.organization_slug ||
        user?.organizationSlug ||
        localStorage.getItem("companySlug") ||
        localStorage.getItem("company_slug") ||
        ""
    );
}

export default function UserTopbar({
    openSidebar,
    notificationCount = 0,
    company,
    companySlug: propCompanySlug,
}) {
    const navigate = useNavigate();
    const { companySlug: routeCompanySlug } = useParams();

    // Read initial values lazily; no state updates are needed in an effect.
    const [user, setUser] = useState(() => getStoredObject("user"));

    const activeCompanySlug = useMemo(
        () =>
            resolveCompanySlug(
                routeCompanySlug,
                propCompanySlug,
                company || getStoredObject("company"),
                user
            ),
        [routeCompanySlug, propCompanySlug, company, user]
    );

    const [websiteSettings, setWebsiteSettings] = useState(() =>
        getInitialSettings(activeCompanySlug)
    );

    const [showUserMenu, setShowUserMenu] = useState(false);

    const companyRoute = useCallback(
        (path) => {
            const cleanPath = path.startsWith("/") ? path : `/${path}`;

            return activeCompanySlug
                ? `/company/${encodeURIComponent(activeCompanySlug)}${cleanPath}`
                : cleanPath;
        },
        [activeCompanySlug]
    );

    // Fetch the active company's published theme.
    // Cache updates and network results are asynchronous.
    useEffect(() => {
        if (!activeCompanySlug) return undefined;

        let cancelled = false;

        const loadSettings = async () => {
            try {
                const cached = getInitialSettings(activeCompanySlug);

                // Use the cache as a fallback only when this effect is still current.
                if (cancelled) return;

                setWebsiteSettings(cached);

                const response = await fetch(
                    `${API_BASE_URL}/company/public/${encodeURIComponent(
                        activeCompanySlug
                    )}/website/`
                );

                if (!response.ok || cancelled) return;

                const data = await response.json();
                const responseSettings = getResponseSettings(data);

                if (
                    !responseSettings ||
                    typeof responseSettings !== "object" ||
                    Array.isArray(responseSettings) ||
                    cancelled
                ) {
                    return;
                }

                const normalized = normalizeSettings(responseSettings);

                localStorage.setItem(
                    `websiteSettings_${activeCompanySlug}`,
                    JSON.stringify(normalized)
                );

                localStorage.setItem(
                    "websiteSettings",
                    JSON.stringify(normalized)
                );

                if (!cancelled) {
                    setWebsiteSettings(normalized);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        "Failed to load company website settings:",
                        error
                    );
                }
            }
        };

        loadSettings();

        return () => {
            cancelled = true;
        };
    }, [activeCompanySlug]);

    // Listen for changes published by the website settings editor.
    useEffect(() => {
        const handleThemeChange = (event) => {
            const detail = event?.detail;

            if (!detail) return;

            const changedSlug =
                detail.companySlug ||
                detail.company_slug ||
                detail.slug ||
                "";

            if (changedSlug && changedSlug !== activeCompanySlug) {
                return;
            }

            const changedSettings =
                detail.settings ||
                detail.websiteSettings ||
                detail.website_settings ||
                detail;

            if (
                !changedSettings ||
                typeof changedSettings !== "object" ||
                Array.isArray(changedSettings)
            ) {
                return;
            }

            const normalized = normalizeSettings(changedSettings);

            setWebsiteSettings(normalized);

            if (activeCompanySlug) {
                localStorage.setItem(
                    `websiteSettings_${activeCompanySlug}`,
                    JSON.stringify(normalized)
                );

                localStorage.setItem(
                    "websiteSettings",
                    JSON.stringify(normalized)
                );
            }
        };

        window.addEventListener("company-theme-changed", handleThemeChange);

        return () => {
            window.removeEventListener(
                "company-theme-changed",
                handleThemeChange
            );
        };
    }, [activeCompanySlug]);

    // Listen for user updates from login/logout or other app components.
    useEffect(() => {
        const handleUserUpdate = () => {
            setUser(getStoredObject("user"));
        };

        window.addEventListener("user-updated", handleUserUpdate);
        window.addEventListener("storage", handleUserUpdate);

        return () => {
            window.removeEventListener("user-updated", handleUserUpdate);
            window.removeEventListener("storage", handleUserUpdate);
        };
    }, []);

    const settings = normalizeSettings(websiteSettings);

    const fullName =
        user?.full_name ||
        user?.fullName ||
        user?.username ||
        user?.email ||
        "Customer";

    const initials =
        fullName
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0].toUpperCase())
            .join("") || "C";

    const unreadCount = Math.max(0, Number(notificationCount) || 0);

    const headerStyle = {
        backgroundColor: settings.background_color,
        color: settings.secondary_color,
        borderBottom: `${settings.border_width}px ${settings.border_style} ${settings.border_line_color}`,
    };

    const outlinedButtonStyle = {
        backgroundColor: settings.border_color,
        color: settings.secondary_color,
        border: `${settings.border_width}px ${settings.border_style} ${settings.border_line_color}`,
    };

    const avatarStyle = {
        backgroundColor: settings.primary_color,
        color: "#ffffff",
        border: `${settings.border_width}px ${settings.border_style} ${settings.border_line_color}`,
    };

    const menuStyle = {
        backgroundColor: settings.background_color,
        color: settings.secondary_color,
        border: `${settings.border_width}px ${settings.border_style} ${settings.border_line_color}`,
    };

    const handleNotifications = () => {
        setShowUserMenu(false);
        navigate(companyRoute("/notifications"));
    };

    const handleProfile = () => {
        setShowUserMenu(false);
        navigate(companyRoute("/profile"));
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");

        setUser({});
        setShowUserMenu(false);

        navigate(companyRoute("/login-page"), { replace: true });
    };

    return (
        <header
            className="sticky top-0 z-40 flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"
            style={headerStyle}
        >
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    onClick={openSidebar}
                    aria-label="Open sidebar"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-80 lg:hidden"
                    style={outlinedButtonStyle}
                >
                    <Menu size={21} />
                </button>

                <div className="min-w-0">
                    <p
                        className="truncate text-sm font-semibold sm:text-base"
                        title={
                            company?.name ||
                            company?.company_name ||
                            "Dashboard"
                        }
                    >
                        {company?.name ||
                            company?.company_name ||
                            "Dashboard"}
                    </p>

                    <p className="hidden truncate text-xs opacity-60 sm:block">
                        Welcome back
                    </p>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                <button
                    type="button"
                    onClick={handleNotifications}
                    aria-label={
                        unreadCount > 0
                            ? `Notifications, ${unreadCount} unread`
                            : "Notifications"
                    }
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg transition-opacity hover:opacity-80"
                    style={outlinedButtonStyle}
                >
                    <Bell size={20} />

                    {unreadCount > 0 && (
                        <span
                            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                            style={{
                                backgroundColor: settings.primary_color,
                            }}
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </button>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() =>
                            setShowUserMenu((previous) => !previous)
                        }
                        aria-expanded={showUserMenu}
                        aria-label="Open user menu"
                        className="flex max-w-[220px] items-center gap-2 rounded-lg p-1.5 transition-opacity hover:opacity-80 sm:gap-3"
                    >
                        <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                            style={avatarStyle}
                        >
                            {initials}
                        </span>

                        <span className="hidden min-w-0 text-left sm:block">
                            <span className="block max-w-32 truncate text-sm font-medium">
                                {fullName}
                            </span>
                            <span className="block max-w-32 truncate text-xs opacity-60">
                                {user?.email || "Account"}
                            </span>
                        </span>

                        <ChevronDown
                            size={16}
                            className={`hidden shrink-0 transition-transform sm:block ${
                                showUserMenu ? "rotate-180" : ""
                            }`}
                        />
                    </button>

                    {showUserMenu && (
                        <>
                            <button
                                type="button"
                                aria-label="Close user menu"
                                className="fixed inset-0 z-40 cursor-default"
                                onClick={() => setShowUserMenu(false)}
                            />

                            <div
                                className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl shadow-lg"
                                style={menuStyle}
                            >
                                <div
                                    className="border-b px-4 py-3"
                                    style={{
                                        borderColor:
                                            settings.border_line_color,
                                        borderWidth: settings.border_width,
                                        borderStyle: settings.border_style,
                                    }}
                                >
                                    <p className="truncate text-sm font-semibold">
                                        {fullName}
                                    </p>

                                    <p className="truncate text-xs opacity-60">
                                        {user?.email || ""}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleProfile}
                                    className="w-full px-4 py-3 text-left text-sm transition-opacity hover:opacity-70"
                                    style={{
                                        backgroundColor: "transparent",
                                    }}
                                    onMouseEnter={(event) => {
                                        event.currentTarget.style.backgroundColor =
                                            settings.border_color;
                                    }}
                                    onMouseLeave={(event) => {
                                        event.currentTarget.style.backgroundColor =
                                            "transparent";
                                    }}
                                >
                                    My Profile
                                </button>

                                <button
                                    type="button"
                                    onClick={handleNotifications}
                                    className="w-full px-4 py-3 text-left text-sm transition-opacity hover:opacity-70"
                                    onMouseEnter={(event) => {
                                        event.currentTarget.style.backgroundColor =
                                            settings.border_color;
                                    }}
                                    onMouseLeave={(event) => {
                                        event.currentTarget.style.backgroundColor =
                                            "transparent";
                                    }}
                                >
                                    Notifications
                                </button>

                                <div
                                    style={{
                                        borderTop: `${settings.border_width}px ${settings.border_style} ${settings.border_line_color}`,
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                                    >
                                        Log out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
