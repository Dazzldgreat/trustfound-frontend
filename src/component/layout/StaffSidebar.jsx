import React, { useEffect, useState } from "react";

import { NavLink, useNavigate } from "react-router-dom";

import {
    X,
    LayoutDashboard,
    PlusCircle,
    PackageSearch,
    BadgeCheck,
    Clock3,
    Sparkles,
    ClipboardCheck,
    Bell,
    LogOut,
    Building2,
    ShieldCheck,
    ChevronRight,
} from "lucide-react";

import { API } from "../../config";
import { resolveMediaUrl } from "../../theme";

function StaffSidebar({
    sidebarOpen,
    closeSidebar,
    companySlug,
}) {
    const navigate = useNavigate();

    // ============================================================
    // SAFE LOCAL STORAGE
    // ============================================================

    const getStoredObject = (key) => {
        try {
            return JSON.parse(
                localStorage.getItem(key) || "{}"
            );
        } catch {
            return {};
        }
    };

    const [company, setCompany] = useState(() =>
        getStoredObject("company")
    );

    const [logoFailed, setLogoFailed] = useState(false);

    const activeCompanySlug =
        companySlug ||
        company.slug ||
        getStoredObject("company").slug ||
        "";

    // ============================================================
    // LOAD COMPANY PROFILE + WEBSITE LOGO
    // ============================================================

    useEffect(() => {
        if (!activeCompanySlug) return;

        let cancelled = false;

        const loadCompany = async () => {
            try {
                const [profileResult, websiteResult] =
                    await Promise.allSettled([
                        fetch(
                            `${API}/company/public/${encodeURIComponent(
                                activeCompanySlug
                            )}/`
                        ),
                        fetch(
                            `${API}/company/public/${encodeURIComponent(
                                activeCompanySlug
                            )}/website/`
                        ),
                    ]);

                let profileData = {};
                let websiteData = {};

                if (profileResult.status === "fulfilled") {
                    const response = profileResult.value;

                    if (response.ok) {
                        profileData =
                            await response.json();
                    }
                }

                if (websiteResult.status === "fulfilled") {
                    const response = websiteResult.value;

                    if (response.ok) {
                        websiteData =
                            await response.json();
                    }
                }

                const companyData =
                    profileData.company ||
                    profileData.data?.company ||
                    profileData;

                const websiteSettings =
                    websiteData.settings ||
                    websiteData.website_settings ||
                    websiteData.website ||
                    websiteData.data?.settings ||
                    websiteData.data?.website_settings ||
                    websiteData.data ||
                    websiteData;

                const latestStoredCompany =
                    getStoredObject("company");

                const logo =
                    websiteSettings.logo_url ||
                    websiteSettings.logo ||
                    companyData.logo_url ||
                    companyData.logo ||
                    latestStoredCompany.logo_url ||
                    latestStoredCompany.logo ||
                    null;

                const updatedCompany = {
                    ...latestStoredCompany,
                    ...companyData,
                    name:
                        companyData.name ||
                        latestStoredCompany.name ||
                        "Company",
                    slug:
                        companyData.slug ||
                        activeCompanySlug,
                    logo,
                    logo_url: logo,
                };

                if (!cancelled) {
                    setCompany(updatedCompany);
                    setLogoFailed(false);

                    localStorage.setItem(
                        "company",
                        JSON.stringify(updatedCompany)
                    );
                }
            } catch (error) {
                console.error(
                    "Staff sidebar company load error:",
                    error
                );
            }
        };

        loadCompany();

        return () => {
            cancelled = true;
        };
    }, [activeCompanySlug]);

    // ============================================================
    // COMPANY LOGO + INITIAL
    // ============================================================

    const companyLogoUrl = resolveMediaUrl(
        company.logo_url ||
        company.logo ||
        ""
    );

    const companyInitial = (
        company.name ||
        activeCompanySlug ||
        "C"
    )
        .charAt(0)
        .toUpperCase();

    // ============================================================
    // COMPANY ROUTE
    // ============================================================

    const companyRoute = (path = "") => {
        if (!activeCompanySlug) {
            return "/staff-login";
        }

        return `/company/${encodeURIComponent(
            activeCompanySlug
        )}${path}`;
    };

    // ============================================================
    // LOGOUT
    // ============================================================

    const logout = () => {
        localStorage.removeItem("staff");

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        navigate(
            companyRoute("/staff-login"),
            {
                replace: true,
            }
        );
    };

    // ============================================================
    // NAVIGATION
    // ============================================================

    const mainMenus = [
        {
            name: "Dashboard",
            description: "Overview & activity",
            path: companyRoute("/staff-dashboard"),
            icon: LayoutDashboard,
        },
    ];

    const reportMenus = [
        {
            name: "Report Found Item",
            description: "Register a found item",
            path: companyRoute("/staff/report-found-item"),
            icon: PlusCircle,
        },
        {
            name: "Found by Staff",
            description: "Staff-submitted items",
            path: companyRoute("/staff/found-by-staff"),
            icon: PackageSearch,
        },
        {
            name: "Verified Items",
            description: "Approved found items",
            path: companyRoute("/staff/verified-items"),
            icon: BadgeCheck,
        },
        {
            name: "Pending Verification",
            description: "Items awaiting review",
            path: companyRoute("/staff/pending"),
            icon: Clock3,
        },
    ];

    const managementMenus = [
        {
            name: "AI Matches",
            description: "Potential item matches",
            path: companyRoute("/staff/matches"),
            icon: Sparkles,
        },
        {
            name: "Claim Requests",
            description: "Review ownership claims",
            path: companyRoute("/staff/claim-requests"),
            icon: ClipboardCheck,
        },
        {
            name: "Notifications",
            description: "Staff alerts",
            path: companyRoute("/staff-notifications"),
            icon: Bell,
        },
    ];

    // ============================================================
    // NAVIGATION ITEM
    // ============================================================

    const NavigationItem = ({ menu }) => {
        const Icon = menu.icon;

        return (
            <NavLink
                to={menu.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                    `
                    group relative flex items-center gap-3
                    px-3.5 py-3
                    rounded-xl
                    transition-all duration-200
                    ${
                        isActive
                            ? `
                                bg-white/10
                                text-white
                                shadow-sm
                            `
                            : `
                                text-blue-100
                                hover:bg-white/5
                                hover:text-white
                            `
                    }
                    `
                }
            >
                {({ isActive }) => (
                    <>
                        {isActive && (
                            <span
                                className="
                                    absolute
                                    left-0
                                    top-2
                                    bottom-2
                                    w-1
                                    rounded-r-full
                                    bg-white
                                "
                            />
                        )}

                        <div
                            className={`
                                flex-shrink-0
                                w-9
                                h-9
                                rounded-lg
                                flex
                                items-center
                                justify-center
                                transition
                                ${
                                    isActive
                                        ? "bg-white/15"
                                        : "bg-white/5 group-hover:bg-white/10"
                                }
                            `}
                        >
                            <Icon
                                size={18}
                                strokeWidth={isActive ? 2.4 : 2}
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p
                                className={`
                                    text-sm
                                    truncate
                                    ${
                                        isActive
                                            ? "font-semibold"
                                            : "font-medium"
                                    }
                                `}
                            >
                                {menu.name}
                            </p>

                            <p
                                className={`
                                    text-[11px]
                                    truncate
                                    mt-0.5
                                    ${
                                        isActive
                                            ? "text-blue-100"
                                            : "text-blue-300"
                                    }
                                `}
                            >
                                {menu.description}
                            </p>
                        </div>

                        <ChevronRight
                            size={15}
                            className={`
                                flex-shrink-0
                                transition
                                ${
                                    isActive
                                        ? "opacity-100 translate-x-0"
                                        : "opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0"
                                }
                            `}
                        />
                    </>
                )}
            </NavLink>
        );
    };

    // ============================================================
    // SIDEBAR
    // ============================================================

    return (
        <>
            {/* MOBILE OVERLAY */}

            {sidebarOpen && (
                <div
                    className="
                        fixed
                        inset-0
                        bg-slate-950/60
                        backdrop-blur-sm
                        z-40
                        md:hidden
                    "
                    onClick={closeSidebar}
                    aria-hidden="true"
                />
            )}

            {/* SIDEBAR */}

            <aside
                className={`
                    fixed
                    md:sticky
                    top-0
                    left-0
                    z-50
                    h-screen
                    w-[290px]
                    bg-gradient-to-b
                    from-slate-950
                    via-blue-950
                    to-slate-950
                    text-white
                    flex
                    flex-col
                    border-r
                    border-white/10
                    shadow-2xl
                    transition-transform
                    duration-300
                    ease-in-out
                    ${
                        sidebarOpen
                            ? "translate-x-0"
                            : "-translate-x-full md:translate-x-0"
                    }
                `}
            >
                {/* BRAND HEADER */}

                <div className="
                    px-5
                    pt-5
                    pb-4
                    border-b
                    border-white/10
                ">
                    <div className="
                        flex
                        items-center
                        justify-between
                    ">
                        <div className="
                            flex
                            items-center
                            gap-3
                            min-w-0
                        ">
                            {/* COMPANY LOGO */}

                            {companyLogoUrl && !logoFailed ? (
                                <img
                                    src={companyLogoUrl}
                                    alt={`${company.name || "Company"} logo`}
                                    onError={() => setLogoFailed(true)}
                                    className="
                                        w-11
                                        h-11
                                        rounded-xl
                                        object-contain
                                        bg-white
                                        p-1
                                        shadow-lg
                                        flex-shrink-0
                                    "
                                />
                            ) : (
                                <div
                                    className="
                                        w-11
                                        h-11
                                        rounded-xl
                                        bg-white/10
                                        border
                                        border-white/10
                                        flex
                                        items-center
                                        justify-center
                                        flex-shrink-0
                                        font-bold
                                        text-lg
                                    "
                                >
                                    {companyInitial}
                                </div>
                            )}

                            <div className="min-w-0">
                                <h1 className="
                                    text-base
                                    font-bold
                                    tracking-tight
                                    truncate
                                ">
                                    {company.name || "Lost & Found"}
                                </h1>

                                <div className="
                                    flex
                                    items-center
                                    gap-1.5
                                    mt-0.5
                                ">
                                    <ShieldCheck
                                        size={12}
                                        className="text-blue-300"
                                    />

                                    <p className="
                                        text-[11px]
                                        text-blue-200
                                        font-medium
                                    ">
                                        Staff Portal
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* MOBILE CLOSE */}

                        <button
                            type="button"
                            onClick={closeSidebar}
                            className="
                                md:hidden
                                w-9
                                h-9
                                rounded-lg
                                flex
                                items-center
                                justify-center
                                text-blue-200
                                hover:text-white
                                hover:bg-white/10
                                transition
                            "
                            aria-label="Close sidebar"
                        >
                            <X size={21} />
                        </button>
                    </div>

                    {/* COMPANY SLUG */}

                    {activeCompanySlug && (
                        <div className="
                            mt-4
                            px-3
                            py-2
                            rounded-lg
                            bg-white/5
                            border
                            border-white/5
                        ">
                            <p className="
                                text-[9px]
                                uppercase
                                tracking-widest
                                text-blue-300
                                font-bold
                            ">
                                Organization
                            </p>

                            <p className="
                                text-xs
                                text-blue-100
                                truncate
                                mt-0.5
                            ">
                                {activeCompanySlug}
                            </p>
                        </div>
                    )}
                </div>

                {/* NAVIGATION */}

                <nav
                    className="
                        flex-1
                        overflow-y-auto
                        px-4
                        py-5
                        space-y-6
                        scrollbar-thin
                    "
                >
                    {/* MAIN */}

                    <section>
                        <p className="
                            px-3
                            mb-2
                            text-[10px]
                            uppercase
                            tracking-[0.18em]
                            text-blue-400
                            font-bold
                        ">
                            Main
                        </p>

                        <div className="space-y-1">
                            {mainMenus.map((menu) => (
                                <NavigationItem
                                    key={menu.path}
                                    menu={menu}
                                />
                            ))}
                        </div>
                    </section>

                    {/* REPORTS */}

                    <section>
                        <p className="
                            px-3
                            mb-2
                            text-[10px]
                            uppercase
                            tracking-[0.18em]
                            text-blue-400
                            font-bold
                        ">
                            Item Management
                        </p>

                        <div className="space-y-1">
                            {reportMenus.map((menu) => (
                                <NavigationItem
                                    key={menu.path}
                                    menu={menu}
                                />
                            ))}
                        </div>
                    </section>

                    {/* MANAGEMENT */}

                    <section>
                        <p className="
                            px-3
                            mb-2
                            text-[10px]
                            uppercase
                            tracking-[0.18em]
                            text-blue-400
                            font-bold
                        ">
                            Management
                        </p>

                        <div className="space-y-1">
                            {managementMenus.map((menu) => (
                                <NavigationItem
                                    key={menu.path}
                                    menu={menu}
                                />
                            ))}
                        </div>
                    </section>
                </nav>

                {/* COMPANY CARD */}

                <div className="px-4 pb-4">
                    <div className="
                        rounded-xl
                        bg-white/5
                        border
                        border-white/10
                        p-3
                    ">
                        <div className="
                            flex
                            items-center
                            gap-3
                        ">
                            <div className="
                                w-9
                                h-9
                                rounded-lg
                                bg-blue-500/15
                                text-blue-300
                                flex
                                items-center
                                justify-center
                                flex-shrink-0
                            ">
                                <Building2 size={18} />
                            </div>

                            <div className="min-w-0">
                                <p className="
                                    text-[9px]
                                    uppercase
                                    tracking-wider
                                    text-blue-400
                                    font-bold
                                ">
                                    Organization
                                </p>

                                <p className="
                                    text-xs
                                    text-white
                                    font-semibold
                                    truncate
                                    mt-0.5
                                ">
                                    {company.name || "Organization"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LOGOUT */}

                <div className="
                    px-4
                    py-4
                    border-t
                    border-white/10
                ">
                    <button
                        type="button"
                        onClick={logout}
                        className="
                            group
                            w-full
                            flex
                            items-center
                            gap-3
                            px-3
                            py-3
                            rounded-xl
                            text-red-200
                            hover:bg-red-500/10
                            hover:text-red-100
                            transition
                        "
                    >
                        <div className="
                            w-9
                            h-9
                            rounded-lg
                            bg-red-500/10
                            flex
                            items-center
                            justify-center
                            group-hover:bg-red-500/15
                            transition
                        ">
                            <LogOut size={18} />
                        </div>

                        <div className="text-left">
                            <p className="
                                text-sm
                                font-semibold
                            ">
                                Sign out
                            </p>

                            <p className="
                                text-[10px]
                                text-red-300
                                mt-0.5
                            ">
                                End staff session
                            </p>
                        </div>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default StaffSidebar;