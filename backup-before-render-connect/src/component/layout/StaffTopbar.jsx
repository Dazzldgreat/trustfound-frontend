import React, {
    useEffect,
    useState,
    useCallback,
} from "react";

import {
    Menu,
    Bell,
    ChevronRight,
    ShieldCheck,
    Building2,
    UserCircle,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

const API = "http://127.0.0.1:8000/api";

function StaffTopbar({
    openSidebar,
    companySlug,
}) {
    const navigate = useNavigate();

    const [staff, setStaff] = useState({});
    const [company, setCompany] = useState({});
    const [notificationCount, setNotificationCount] =
        useState(0);

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

    // ============================================================
    // COMPANY
    // ============================================================

    const storedCompany =
        getStoredObject("company");

    const activeCompanySlug =
        companySlug ||
        storedCompany.slug ||
        "";

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
    // LOAD STAFF + COMPANY
    // ============================================================

    useEffect(() => {
        const storedStaff =
            getStoredObject("staff");

        const latestCompany =
            getStoredObject("company");

        setStaff(storedStaff);
        setCompany(latestCompany);
    }, [activeCompanySlug]);

    // ============================================================
    // STAFF NAME
    // ============================================================

    const staffName =
        staff.name ||
        staff.full_name ||
        staff.username ||
        staff.email ||
        "Staff";

    // ============================================================
    // STAFF INITIALS
    // ============================================================

    const getInitials = (name) => {
        if (!name) {
            return "S";
        }

        const parts = name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (parts.length === 1) {
            return parts[0]
                .substring(0, 2)
                .toUpperCase();
        }

        return (
            parts[0].charAt(0) +
            parts[parts.length - 1].charAt(0)
        ).toUpperCase();
    };

    const staffInitials =
        getInitials(staffName);

    // ============================================================
    // COMPANY INITIAL
    // ============================================================

    const companyInitial =
        (
            company.name ||
            activeCompanySlug ||
            "C"
        )
            .charAt(0)
            .toUpperCase();

    // ============================================================
    // FETCH NOTIFICATION COUNT
    // ============================================================

    const fetchNotificationCount =
        useCallback(async () => {
            const access =
                localStorage.getItem(
                    "access_token"
                ) ||
                localStorage.getItem(
                    "access"
                );

            if (!access) {
                setNotificationCount(0);
                return;
            }

            if (!activeCompanySlug) {
                setNotificationCount(0);
                return;
            }

            try {
                const url =
                    `${API}/staff/notifications/count/` +
                    `?company_slug=${encodeURIComponent(
                        activeCompanySlug
                    )}`;

                const response =
                    await fetch(url, {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${access}`,

                            Accept:
                                "application/json",
                        },
                    });

                let data = {};

                try {
                    data =
                        await response.json();
                } catch {
                    data = {};
                }

                // ==================================================
                // AUTH ERROR
                // ==================================================

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    setNotificationCount(0);
                    return;
                }

                // ==================================================
                // SERVER ERROR
                // ==================================================

                if (!response.ok) {
                    setNotificationCount(0);
                    return;
                }

                // ==================================================
                // COUNT
                // ==================================================

                const count = Number(
                    data.count ??
                        data.notification_count ??
                        0
                );

                setNotificationCount(
                    Number.isFinite(count)
                        ? count
                        : 0
                );
            } catch {
                setNotificationCount(0);
            }
        }, [activeCompanySlug]);

    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {
        fetchNotificationCount();
    }, [fetchNotificationCount]);

    // ============================================================
    // AUTO REFRESH
    // ============================================================

    useEffect(() => {
        const interval =
            setInterval(() => {
                fetchNotificationCount();
            }, 10000);

        return () => {
            clearInterval(interval);
        };
    }, [fetchNotificationCount]);

    // ============================================================
    // OPEN NOTIFICATIONS
    // ============================================================

    const openNotifications = () => {
        navigate(
            companyRoute(
                "/staff-notifications"
            )
        );
    };

    // ============================================================
    // TOPBAR
    // ============================================================

    return (
        <header
            className="
                sticky
                top-0
                z-30
                h-[76px]
                bg-white/95
                backdrop-blur-xl
                border-b
                border-slate-200
            "
        >
            <div
                className="
                    h-full
                    px-4
                    sm:px-6
                    lg:px-8
                    flex
                    items-center
                    justify-between
                    gap-4
                "
            >

                {/* =================================================
                    LEFT SIDE
                ================================================= */}

                <div className="
                    flex
                    items-center
                    min-w-0
                    gap-3
                ">

                    {/* MOBILE MENU */}

                    <button
                        type="button"
                        onClick={openSidebar}
                        className="
                            md:hidden
                            w-10
                            h-10
                            rounded-xl
                            flex
                            items-center
                            justify-center
                            text-slate-600
                            hover:bg-slate-100
                            hover:text-blue-600
                            transition
                        "
                        aria-label="Open navigation"
                    >
                        <Menu size={23} />
                    </button>

                    {/* COMPANY LOGO */}

                    <div className="
                        flex-shrink-0
                    ">

                        {company.logo ? (
                            <img
                                src={
                                    company.logo
                                }
                                alt={
                                    company.name ||
                                    "Company"
                                }
                                className="
                                    w-10
                                    h-10
                                    sm:w-11
                                    sm:h-11
                                    rounded-xl
                                    object-cover
                                    border
                                    border-slate-200
                                    shadow-sm
                                    bg-white
                                "
                            />
                        ) : (
                            <div
                                className="
                                    w-10
                                    h-10
                                    sm:w-11
                                    sm:h-11
                                    rounded-xl
                                    bg-gradient-to-br
                                    from-blue-600
                                    to-indigo-700
                                    text-white
                                    flex
                                    items-center
                                    justify-center
                                    font-bold
                                    shadow-sm
                                "
                            >
                                {companyInitial}
                            </div>
                        )}

                    </div>

                    {/* PAGE CONTEXT */}

                    <div className="
                        min-w-0
                        hidden
                        sm:block
                    ">

                        <div className="
                            flex
                            items-center
                            gap-1.5
                            text-xs
                            text-slate-400
                            mb-0.5
                        ">

                            <span>
                                Staff Portal
                            </span>

                            <ChevronRight
                                size={13}
                            />

                            <span className="
                                text-slate-500
                            ">
                                Dashboard
                            </span>

                        </div>

                        <div className="
                            flex
                            items-center
                            gap-2
                            min-w-0
                        ">

                            <h1 className="
                                text-base
                                lg:text-lg
                                font-bold
                                text-slate-800
                                truncate
                                max-w-[220px]
                                lg:max-w-[350px]
                            ">
                                {company.name ||
                                    "Staff Dashboard"}
                            </h1>

                            <span
                                className="
                                    hidden
                                    lg:inline-flex
                                    items-center
                                    gap-1
                                    px-2
                                    py-0.5
                                    rounded-full
                                    bg-blue-50
                                    text-blue-700
                                    text-[10px]
                                    font-bold
                                "
                            >
                                <ShieldCheck
                                    size={11}
                                />

                                STAFF
                            </span>

                        </div>

                    </div>

                    {/* MOBILE TITLE */}

                    <div className="
                        sm:hidden
                        min-w-0
                    ">

                        <p className="
                            text-sm
                            font-bold
                            text-slate-800
                            truncate
                            max-w-[150px]
                        ">
                            Staff Dashboard
                        </p>

                        <p className="
                            text-[11px]
                            text-slate-400
                            truncate
                            max-w-[150px]
                        ">
                            {company.name ||
                                "Organization"}
                        </p>

                    </div>

                </div>

                {/* =================================================
                    RIGHT SIDE
                ================================================= */}

                <div className="
                    flex
                    items-center
                    gap-2
                    sm:gap-4
                ">

                    {/* ORGANIZATION INDICATOR */}

                    <div className="
                        hidden
                        lg:flex
                        items-center
                        gap-2
                        px-3
                        py-2
                        rounded-xl
                        bg-slate-50
                        border
                        border-slate-200
                    ">

                        <Building2
                            size={16}
                            className="text-slate-500"
                        />

                        <span className="
                            text-xs
                            font-semibold
                            text-slate-600
                            max-w-[160px]
                            truncate
                        ">
                            {company.name ||
                                "Organization"}
                        </span>

                    </div>

                    {/* DIVIDER */}

                    <div className="
                        hidden
                        sm:block
                        h-8
                        w-px
                        bg-slate-200
                    " />

                    {/* NOTIFICATIONS */}

                    <button
                        type="button"
                        onClick={
                            openNotifications
                        }
                        className="
                            relative
                            w-10
                            h-10
                            rounded-xl
                            flex
                            items-center
                            justify-center
                            text-slate-600
                            bg-white
                            border
                            border-slate-200
                            hover:bg-slate-50
                            hover:text-blue-600
                            hover:border-blue-200
                            transition-all
                            duration-200
                        "
                        title="Notifications"
                        aria-label="Open notifications"
                    >

                        <Bell
                            size={20}
                            strokeWidth={2}
                        />

                        {/* Notification dot */}

                        {notificationCount >
                            0 && (
                            <span
                                className="
                                    absolute
                                    -top-1
                                    -right-1
                                    min-w-[19px]
                                    h-[19px]
                                    px-1
                                    rounded-full
                                    bg-red-500
                                    text-white
                                    text-[9px]
                                    font-bold
                                    flex
                                    items-center
                                    justify-center
                                    border-2
                                    border-white
                                    shadow-sm
                                "
                            >
                                {notificationCount >
                                99
                                    ? "99+"
                                    : notificationCount}
                            </span>
                        )}

                    </button>

                    {/* STAFF PROFILE */}

                    <div className="
                        flex
                        items-center
                        gap-2.5
                        pl-1
                    ">

                        {/* Avatar */}

                        <div
                            className="
                                w-10
                                h-10
                                rounded-xl
                                bg-gradient-to-br
                                from-slate-700
                                to-slate-900
                                text-white
                                flex
                                items-center
                                justify-center
                                text-xs
                                font-bold
                                shadow-sm
                                flex-shrink-0
                            "
                        >
                            {staffInitials}
                        </div>

                        {/* Staff details */}

                        <div className="
                            hidden
                            sm:block
                            min-w-0
                        ">

                            <p className="
                                text-sm
                                font-semibold
                                text-slate-800
                                truncate
                                max-w-[130px]
                            ">
                                {staffName}
                            </p>

                            <div className="
                                flex
                                items-center
                                gap-1.5
                                mt-0.5
                            ">

                                <span
                                    className="
                                        w-1.5
                                        h-1.5
                                        rounded-full
                                        bg-emerald-500
                                    "
                                />

                                <span className="
                                    text-[10px]
                                    text-slate-400
                                    font-medium
                                ">
                                    Staff Account
                                </span>

                            </div>

                        </div>

                    </div>

                </div>

            </div>
        </header>
    );
}

export default StaffTopbar;