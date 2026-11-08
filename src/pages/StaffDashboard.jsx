import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    CheckCircle2,
    Package,
    Search,
    ShieldCheck,
    PartyPopper,
    Clock3,
    Bell,
    ScanLine,
    FilePlus2,
    Archive,
    ClipboardCheck,
    ClipboardList,
    Eye,
    RefreshCw,
    Building2,
    ChevronRight,
    MapPin,
    UserRound,
    Activity,
} from "lucide-react";

import { API } from "../config";
function StaffDashboard() {
    const navigate = useNavigate();
    const { companySlug } = useParams();

    // ============================================================
    // STORAGE
    // ============================================================

    const getStoredObject = (key) => {
        try {
            return JSON.parse(localStorage.getItem(key) || "{}");
        } catch {
            return {};
        }
    };

    const storedStaff = getStoredObject("staff");
    const storedCompany = getStoredObject("company");

    const storedCompanyId = storedCompany.id ?? null;
    const storedCompanyName = storedCompany.name || "Company";
    const storedCompanyLogo = storedCompany.logo || null;

    const storedSlug =
        localStorage.getItem("companySlug") ||
        localStorage.getItem("company_slug") ||
        storedCompany.slug ||
        storedStaff.company_slug ||
        storedStaff.companySlug ||
        "";

    const activeCompanySlug = companySlug || storedSlug;

    // ============================================================
    // STATE
    // ============================================================

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activityFilter, setActivityFilter] = useState("all");

    const [stats, setStats] = useState({
        pendingVerification: 0,
        foundByStaff: 0,
        verifiedByStaff: 0,
        approvedItems: 0,
        recoveredItems: 0,
        reportFoundItems: 0,
        claimRequests: 0,
    });

    const [recentActivity, setRecentActivity] = useState([]);

    const [company, setCompany] = useState({
        id: storedCompanyId,
        name: storedCompanyName,
        slug: activeCompanySlug,
        logo: storedCompanyLogo,
    });

    // ============================================================
    // COMPANY ROUTE
    // ============================================================

    const companyRoute = useCallback(
        (path = "") => {
            if (!activeCompanySlug) {
                return "/staff-login";
            }

            return `/company/${encodeURIComponent(
                activeCompanySlug
            )}${path}`;
        },
        [activeCompanySlug]
    );

    // ============================================================
    // IMAGE URL
    // ============================================================

    const getImageUrl = (image) => {
        if (!image) return "";

        let cleanImage = String(image).trim();

        const duplicatedUrl =
            "https://trustfound-backend.onrender.comhttps://trustfound-backend.onrender.com";

        if (cleanImage.includes(duplicatedUrl)) {
            cleanImage = cleanImage.replace(
                duplicatedUrl,
                "https://trustfound-backend.onrender.com"
            );
        }

        if (
            cleanImage.startsWith("http://") ||
            cleanImage.startsWith("https://")
        ) {
            return cleanImage;
        }

        if (cleanImage.startsWith("/")) {
            return `${API.replace("/api", "")}${cleanImage}`;
        }

        return `${API.replace("/api", "")}/${cleanImage}`;
    };

    // ============================================================
    // BADGES
    // ============================================================

    const badgeColor = {
        Pending:
            "bg-amber-50 text-amber-700 border-amber-200",

        Verified:
            "bg-blue-50 text-blue-700 border-blue-200",

        Approved:
            "bg-emerald-50 text-emerald-700 border-emerald-200",

        Accepted:
            "bg-emerald-50 text-emerald-700 border-emerald-200",

        Rejected:
            "bg-red-50 text-red-700 border-red-200",

        Recovered:
            "bg-violet-50 text-violet-700 border-violet-200",

        "Recovery Requested":
            "bg-orange-50 text-orange-700 border-orange-200",
    };

    // ============================================================
    // ACTIVITY ICON
    // ============================================================

    const getActivityIcon = (activity) => {
        if (
            activity.recovered_by ||
            activity.status === "Recovered"
        ) {
            return (
                <PartyPopper
                    size={21}
                    className="text-violet-600"
                />
            );
        }

        if (
            activity.approved_by ||
            activity.status === "Approved"
        ) {
            return (
                <CheckCircle2
                    size={21}
                    className="text-emerald-600"
                />
            );
        }

        if (
            activity.verified_by ||
            activity.status === "Verified"
        ) {
            return (
                <ShieldCheck
                    size={21}
                    className="text-violet-600"
                />
            );
        }

        if (activity.page === "staff_found") {
            return (
                <Search
                    size={21}
                    className="text-sky-600"
                />
            );
        }

        if (activity.page === "received") {
            return (
                <FilePlus2
                    size={21}
                    className="text-blue-600"
                />
            );
        }

        if (activity.page === "claim") {
            return (
                <ClipboardList
                    size={21}
                    className="text-orange-600"
                />
            );
        }

        return (
            <Package
                size={21}
                className="text-slate-500"
            />
        );
    };

    // ============================================================
    // COMBINE ACTIVITIES
    // ============================================================

    const combineActivities = (activities) => {
        if (!Array.isArray(activities)) {
            return [];
        }

        const grouped = new Map();

        activities.forEach((activity) => {
            const itemId =
                activity.item_id ||
                activity.found_item_id ||
                activity.lost_item_id ||
                activity.id;

            const itemName = String(
                activity.item ||
                    activity.item_name ||
                    ""
            )
                .trim()
                .toLowerCase();

            const key =
                itemId ||
                itemName ||
                `activity-${activity.id}`;

            if (!grouped.has(key)) {
                grouped.set(key, {
                    ...activity,
                    activities: [],
                    pages: [],
                });
            }

            const existing = grouped.get(key);

            existing.activities.push(activity);

            if (
                activity.page &&
                !existing.pages.includes(activity.page)
            ) {
                existing.pages.push(activity.page);
            }

            if (
                activity.created_at &&
                (!existing.created_at ||
                    new Date(activity.created_at) >
                        new Date(existing.created_at))
            ) {
                existing.created_at =
                    activity.created_at;
            }

            if (activity.status) {
                existing.status = activity.status;
            }

            if (activity.image) {
                existing.image = activity.image;
            }

            if (activity.category) {
                existing.category =
                    activity.category;
            }

            if (activity.location) {
                existing.location =
                    activity.location;
            }

            if (activity.finder) {
                existing.finder = activity.finder;
            }

            if (activity.approved_by) {
                existing.approved_by =
                    activity.approved_by;
            }

            if (activity.verified_by) {
                existing.verified_by =
                    activity.verified_by;
            }

            if (activity.recovered_by) {
                existing.recovered_by =
                    activity.recovered_by;
            }
        });

        return Array.from(grouped.values())
            .map((item) => {
                const activityNames =
                    item.activities
                        .map(
                            (activity) =>
                                activity.activity
                        )
                        .filter(Boolean);

                const uniqueActivities = [
                    ...new Set(activityNames),
                ];

                return {
                    ...item,
                    activity:
                        uniqueActivities.length > 0
                            ? uniqueActivities[
                                  uniqueActivities.length - 1
                              ]
                            : "Item activity updated",
                    activityHistory:
                        uniqueActivities,
                };
            })
            .sort((a, b) => {
                if (!a.created_at) return 1;
                if (!b.created_at) return -1;

                return (
                    new Date(b.created_at) -
                    new Date(a.created_at)
                );
            });
    };

    // ============================================================
    // FILTERED ACTIVITY
    // ============================================================

    const filteredActivity =
        recentActivity.filter((item) => {
            switch (activityFilter) {
                case "pending":
                    return (
                        item.status === "Pending" ||
                        item.status ===
                            "Recovery Requested"
                    );

                case "verified":
                    return (
                        item.pages?.includes(
                            "verified"
                        ) ||
                        item.status === "Verified"
                    );

                case "approved":
                    return (
                        item.pages?.includes(
                            "approved"
                        ) ||
                        item.status === "Approved"
                    );

                case "recovered":
                    return (
                        item.pages?.includes(
                            "recovered"
                        ) ||
                        item.status === "Recovered"
                    );

                case "staff_found":
                    return item.pages?.includes(
                        "staff_found"
                    );

                case "received":
                    return item.pages?.includes(
                        "received"
                    );

                case "claim":
                    return item.pages?.includes(
                        "claim"
                    );

                default:
                    return true;
            }
        });

    // ============================================================
    // LOGOUT
    // ============================================================

    const handleLogout = useCallback(
        (redirect = true) => {
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("staff");

            if (redirect) {
                navigate(
                    companyRoute("/staff-login"),
                    {
                        replace: true,
                    }
                );
            }
        },
        [navigate, companyRoute]
    );

    // ============================================================
    // FETCH COMPANY
    // ============================================================

    const fetchCompany = useCallback(async () => {
        if (!activeCompanySlug) {
            return;
        }

        try {
            const response = await fetch(
                `${API}/company/public/${encodeURIComponent(
                    activeCompanySlug
                )}/`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                        data.detail ||
                        "Unable to load company."
                );
            }

            const companyData =
                data.company || data;

            const updatedCompany = {
                id:
                    companyData.id ??
                    storedCompanyId ??
                    null,

                name:
                    companyData.name ||
                    storedCompanyName ||
                    "Company",

                slug:
                    companyData.slug ||
                    activeCompanySlug,

                logo:
                    companyData.logo ||
                    storedCompanyLogo ||
                    null,
            };

            setCompany(updatedCompany);

            localStorage.setItem(
                "company",
                JSON.stringify(updatedCompany)
            );
        } catch (error) {
            console.error(
                "Company load error:",
                error
            );
        }
    }, [
        activeCompanySlug,
        storedCompanyId,
        storedCompanyName,
        storedCompanyLogo,
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
                companyRoute("/staff-login"),
                {
                    replace: true,
                }
            );

            return;
        }

        if (!activeCompanySlug) {
            navigate("/", {
                replace: true,
            });

            return;
        }

        try {
            setRefreshing(true);

            const url =
                `${API}/staff/dashboard/` +
                `?company_slug=${encodeURIComponent(
                    activeCompanySlug
                )}`;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    handleLogout(false);
                    return;
                }

                throw new Error(
                    data.error ||
                        data.detail ||
                        "Failed to load staff dashboard."
                );
            }

            // ====================================================
            // COMPANY
            // ====================================================

            if (data.company) {
                const backendCompany =
                    data.company;

                const updatedCompany = {
                    id:
                        backendCompany.id ??
                        storedCompanyId ??
                        null,

                    name:
                        backendCompany.name ||
                        storedCompanyName ||
                        "Company",

                    slug:
                        backendCompany.slug ||
                        activeCompanySlug,

                    logo:
                        backendCompany.logo ||
                        storedCompanyLogo ||
                        null,
                };

                setCompany(updatedCompany);

                localStorage.setItem(
                    "company",
                    JSON.stringify(
                        updatedCompany
                    )
                );
            }

            // ====================================================
            // STATISTICS
            // ====================================================

            const backendStats =
                data.stats || {};

            setStats({
                pendingVerification:
                    backendStats.pendingVerification ??
                    backendStats.pending_verification ??
                    0,

                foundByStaff:
                    backendStats.foundByStaff ??
                    backendStats.found_by_staff ??
                    0,

                verifiedByStaff:
                    backendStats.verifiedByStaff ??
                    backendStats.verified_by_staff ??
                    0,

                approvedItems:
                    backendStats.approvedItems ??
                    backendStats.approved_items ??
                    0,

                recoveredItems:
                    backendStats.recoveredItems ??
                    backendStats.recovered_items ??
                    0,

                reportFoundItems:
                    backendStats.reportFoundItems ??
                    backendStats.report_found_items ??
                    0,

                claimRequests:
                    backendStats.claimRequests ??
                    backendStats.claim_requests ??
                    0,
            });

            // ====================================================
            // RECENT ACTIVITY
            // ====================================================

            const activities =
                Array.isArray(
                    data.recent_activity
                )
                    ? data.recent_activity
                    : [];

            setRecentActivity(
                combineActivities(activities)
            );
        } catch (error) {
            console.error(
                "Staff dashboard error:",
                error
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [
        activeCompanySlug,
        navigate,
        companyRoute,
        handleLogout,
        storedCompanyId,
        storedCompanyName,
        storedCompanyLogo,
    ]);

    // ============================================================
    // VIEW ACTIVITY
    // ============================================================

    const handleActivityView = (activity) => {
        const history =
            activity.activities || [];

        const latest =
            [...history].sort((a, b) => {
                if (!a.created_at) return 1;
                if (!b.created_at) return -1;

                return (
                    new Date(b.created_at) -
                    new Date(a.created_at)
                );
            })[0] || activity;

        const id = latest.id || activity.id;

        if (
            activity.approved_by ||
            latest.page === "approved"
        ) {
            navigate(
                companyRoute(
                    `/staff/approved/${id}`
                )
            );
            return;
        }

        if (
            activity.verified_by ||
            latest.page === "verified"
        ) {
            navigate(
                companyRoute(
                    `/staff/found-item/${id}`
                )
            );
            return;
        }

        if (latest.page === "staff_found") {
            navigate(
                companyRoute(
                    `/staff/found-by-staff/${id}`
                )
            );
            return;
        }

        if (latest.page === "received") {
            navigate(
                companyRoute(
                    `/staff/report-found-item/${id}`
                )
            );
            return;
        }

        if (latest.page === "recovered") {
            navigate(
                companyRoute(
                    `/staff/recovered/${id}`
                )
            );
            return;
        }

        if (latest.page === "claim") {
            navigate(
                companyRoute(
                    `/staff/claim-requests/${id}`
                )
            );
        }
    };

    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {
        const access =
            localStorage.getItem(
                "access_token"
            ) ||
            localStorage.getItem("access");

        if (!access) {
            navigate(
                companyRoute("/staff-login"),
                {
                    replace: true,
                }
            );
            return;
        }

        if (!storedStaff.username) {
            navigate(
                companyRoute("/staff-login"),
                {
                    replace: true,
                }
            );
            return;
        }

        if (!activeCompanySlug) {
            navigate("/", {
                replace: true,
            });
            return;
        }

        fetchCompany();
        fetchDashboard();
    }, [
        activeCompanySlug,
        navigate,
        companyRoute,
        fetchCompany,
        fetchDashboard,
        storedStaff.username,
    ]);

    // ============================================================
    // STAT CARD
    // ============================================================

    const StatCard = ({
        label,
        value,
        icon,
        iconColor,
        iconBg,
        filter,
        description,
    }) => {
        const IconComponent = icon;

        return (
            <button
                type="button"
                onClick={() => {
                    if (filter) {
                        setActivityFilter(filter);
                    }
                }}
                className="
                    group
                    w-full
                    text-left
                    bg-white
                    border
                    border-slate-200
                    rounded-2xl
                    p-6
                    shadow-sm
                    hover:shadow-md
                    hover:border-slate-300
                    transition-all
                    duration-200
                "
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-500">
                            {label}
                        </p>

                        <p className="text-3xl md:text-4xl font-bold text-slate-900 mt-3">
                            {value}
                        </p>

                        {description && (
                            <p className="text-xs text-slate-400 mt-2">
                                {description}
                            </p>
                        )}
                    </div>

                    {IconComponent && (
                        <div
                            className={`
                                w-11
                                h-11
                                rounded-xl
                                flex
                                items-center
                                justify-center
                                shrink-0
                                ${
                                    iconBg ||
                                    "bg-slate-50"
                                }
                            `}
                        >
                            <IconComponent
                                size={21}
                                className={
                                    iconColor ||
                                    "text-slate-600"
                                }
                            />
                        </div>
                    )}
                </div>

                {filter && (
                    <div
                        className="
                            flex
                            items-center
                            gap-1
                            mt-5
                            text-xs
                            font-semibold
                            text-slate-400
                            group-hover:text-blue-600
                            transition
                        "
                    >
                        View activity
                        <ChevronRight size={14} />
                    </div>
                )}
            </button>
        );
    };

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-10 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center">
                        <RefreshCw
                            size={26}
                            className="text-blue-600 animate-spin"
                        />
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 mt-6">
                        Preparing your dashboard
                    </h2>

                    <p className="text-sm text-slate-500 mt-2">
                        Loading {company.name}{" "}
                        staff operations...
                    </p>
                </div>
            </div>
        );
    }

    // ============================================================
    // PAGE
    // ============================================================

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="max-w-7xl mx-auto px-5 md:px-8 py-8">

                {/* COMPANY */}

                <section className="bg-slate-900 text-white rounded-2xl p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                <Building2 size={21} />
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                                    Active organization
                                </p>

                                <h2 className="text-xl font-bold mt-1">
                                    {company.name}
                                </h2>

                                <p className="text-sm text-slate-400 mt-1">
                                    Staff operations and
                                    lost & found
                                    management
                                </p>
                            </div>
                        </div>

                        <div className="md:text-right">
                            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                                Organization ID
                            </p>

                            <p className="font-mono text-sm text-blue-300 mt-1">
                                {activeCompanySlug}
                            </p>
                        </div>
                    </div>
                </section>

                {/* OVERVIEW */}

                <section>
                    <div className="mb-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                            Overview
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-1">
                            Operations summary
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            Monitor the current state
                            of your organization's
                            lost and found activity.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

                        <StatCard
                            label="Pending verification"
                            value={
                                stats.pendingVerification
                            }
                            icon={Clock3}
                            iconColor="text-amber-600"
                            iconBg="bg-amber-50"
                            filter="pending"
                            description="Items awaiting review"
                        />

                        <StatCard
                            label="Found by staff"
                            value={
                                stats.foundByStaff
                            }
                            icon={Search}
                            iconColor="text-blue-600"
                            iconBg="bg-blue-50"
                            filter="staff_found"
                            description="Items recorded by staff"
                        />

                        <StatCard
                            label="Found reports"
                            value={
                                stats.reportFoundItems
                            }
                            icon={FilePlus2}
                            iconColor="text-cyan-600"
                            iconBg="bg-cyan-50"
                            filter="received"
                            description="Submitted found-item reports"
                        />

                        <StatCard
                            label="Verified items"
                            value={
                                stats.verifiedByStaff
                            }
                            icon={ShieldCheck}
                            iconColor="text-violet-600"
                            iconBg="bg-violet-50"
                            filter="verified"
                            description="Items verified by staff"
                        />

                        <StatCard
                            label="Approved matches"
                            value={
                                stats.approvedItems
                            }
                            icon={CheckCircle2}
                            iconColor="text-emerald-600"
                            iconBg="bg-emerald-50"
                            filter="approved"
                            description="Confirmed item matches"
                        />

                        <StatCard
                            label="Recovered"
                            value={
                                stats.recoveredItems
                            }
                            icon={PartyPopper}
                            iconColor="text-emerald-600"
                            iconBg="bg-emerald-50"
                            filter="recovered"
                            description="Successfully returned items"
                        />

                        <StatCard
                            label="Claim requests"
                            value={
                                stats.claimRequests
                            }
                            icon={ClipboardList}
                            iconColor="text-orange-600"
                            iconBg="bg-orange-50"
                            filter="claim"
                            description="Customers awaiting recovery"
                        />
                    </div>
                </section>

                {/* QUICK ACTIONS */}

                <section className="mt-12">
                    <div className="mb-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                            Shortcuts
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-1">
                            Quick actions
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            Frequently used staff
                            operations.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    companyRoute(
                                        "/staff/report-found-item"
                                    )
                                )
                            }
                            className="group bg-blue-600 text-white rounded-2xl p-6 text-left hover:bg-blue-700 transition"
                        >
                            <FilePlus2 size={25} />

                            <h3 className="font-bold mt-5">
                                Report found item
                            </h3>

                            <p className="text-sm text-blue-100 mt-1">
                                Register an item that
                                has been handed to
                                staff.
                            </p>

                            <div className="flex items-center gap-1 text-xs font-semibold mt-5">
                                Continue
                                <ChevronRight size={14} />
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    companyRoute(
                                        "/staff/scan"
                                    )
                                )
                            }
                            className="group bg-emerald-600 text-white rounded-2xl p-6 text-left hover:bg-emerald-700 transition"
                        >
                            <ScanLine size={25} />

                            <h3 className="font-bold mt-5">
                                Scan QR code
                            </h3>

                            <p className="text-sm text-emerald-100 mt-1">
                                Quickly identify and
                                process registered
                                items.
                            </p>

                            <div className="flex items-center gap-1 text-xs font-semibold mt-5">
                                Open scanner
                                <ChevronRight size={14} />
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    companyRoute(
                                        "/staff/found-by-staff"
                                    )
                                )
                            }
                            className="group bg-amber-500 text-white rounded-2xl p-6 text-left hover:bg-amber-600 transition"
                        >
                            <Archive size={25} />

                            <h3 className="font-bold mt-5">
                                Found by staff
                            </h3>

                            <p className="text-sm text-amber-50 mt-1">
                                Review items
                                personally recorded
                                by staff.
                            </p>

                            <div className="flex items-center gap-1 text-xs font-semibold mt-5">
                                Review items
                                <ChevronRight size={14} />
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    companyRoute(
                                        "/staff/verified-items"
                                    )
                                )
                            }
                            className="group bg-violet-600 text-white rounded-2xl p-6 text-left hover:bg-violet-700 transition"
                        >
                            <ClipboardCheck
                                size={25}
                            />

                            <h3 className="font-bold mt-5">
                                Verified items
                            </h3>

                            <p className="text-sm text-violet-100 mt-1">
                                Review items that
                                have completed
                                verification.
                            </p>

                            <div className="flex items-center gap-1 text-xs font-semibold mt-5">
                                View verified
                                <ChevronRight size={14} />
                            </div>
                        </button>
                    </div>
                </section>

                {/* RECENT ACTIVITY */}

                <section className="mt-12">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">

                        <div>
                            <div className="flex items-center gap-2">
                                <Activity
                                    size={18}
                                    className="text-blue-600"
                                />

                                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                                    Activity
                                </p>
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 mt-1">
                                Recent activity
                            </h2>

                            <p className="text-sm text-slate-500 mt-1">
                                One activity record per
                                item, showing its
                                latest state.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {refreshing && (
                                <RefreshCw
                                    size={17}
                                    className="text-blue-600 animate-spin"
                                />
                            )}

                            {activityFilter !==
                                "all" && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setActivityFilter(
                                            "all"
                                        )
                                    }
                                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
                                >
                                    Clear filter
                                </button>
                            )}
                        </div>
                    </div>

                    {/* FILTER */}

                    {activityFilter !==
                        "all" && (
                        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-semibold text-blue-700">
                            Showing:{" "}
                            {activityFilter.replace(
                                "_",
                                " "
                            )}
                        </div>
                    )}

                    {/* ACTIVITY LIST */}

                    <div className="space-y-4">

                        {filteredActivity.length ===
                            0 && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">

                                <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center">
                                    <Bell
                                        size={22}
                                        className="text-slate-400"
                                    />
                                </div>

                                <h3 className="font-bold text-slate-800 mt-4">
                                    No activity found
                                </h3>

                                <p className="text-sm text-slate-500 mt-1">
                                    There is nothing to
                                    display for the
                                    current filter.
                                </p>
                            </div>
                        )}

                        {filteredActivity.map(
                            (activity) => (
                                <article
                                    key={`activity-${
                                        activity.item_id ||
                                        activity.id
                                    }`}
                                    className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-sm transition"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-5">

                                        {/* ICON */}

                                        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                            {getActivityIcon(
                                                activity
                                            )}
                                        </div>

                                        {/* INFO */}

                                        <div className="flex-1 min-w-0">

                                            <div className="flex flex-wrap items-center gap-2">

                                                <h3 className="text-base font-bold text-slate-900">
                                                    {activity.item ||
                                                        activity.item_name ||
                                                        "Unnamed item"}
                                                </h3>

                                                {activity.status && (
                                                    <span
                                                        className={`
                                                            inline-flex
                                                            items-center
                                                            px-2.5
                                                            py-1
                                                            rounded-full
                                                            border
                                                            text-[11px]
                                                            font-bold
                                                            ${
                                                                badgeColor[
                                                                    activity
                                                                        .status
                                                                ] ||
                                                                "bg-slate-50 text-slate-600 border-slate-200"
                                                            }
                                                        `}
                                                    >
                                                        {
                                                            activity.status
                                                        }
                                                    </span>
                                                )}
                                            </div>

                                            {activity.activity && (
                                                <p className="text-sm text-slate-600 mt-1">
                                                    {
                                                        activity.activity
                                                    }
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-xs text-slate-500">

                                                {activity.category && (
                                                    <span>
                                                        <strong className="text-slate-700">
                                                            Category:
                                                        </strong>{" "}
                                                        {
                                                            activity.category
                                                        }
                                                    </span>
                                                )}

                                                {activity.finder && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <UserRound
                                                            size={
                                                                13
                                                            }
                                                        />
                                                        {
                                                            activity.finder
                                                        }
                                                    </span>
                                                )}

                                                {activity.location && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <MapPin
                                                            size={
                                                                13
                                                            }
                                                        />
                                                        {
                                                            activity.location
                                                        }
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-3 mt-3">

                                                {activity.approved_by && (
                                                    <span className="text-xs font-semibold text-emerald-700">
                                                        Approved by{" "}
                                                        {
                                                            activity.approved_by
                                                        }
                                                    </span>
                                                )}

                                                {activity.verified_by && (
                                                    <span className="text-xs font-semibold text-blue-700">
                                                        Verified by{" "}
                                                        {
                                                            activity.verified_by
                                                        }
                                                    </span>
                                                )}

                                                {activity.recovered_by && (
                                                    <span className="text-xs font-semibold text-violet-700">
                                                        Recovered by{" "}
                                                        {
                                                            activity.recovered_by
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* IMAGE + VIEW */}

                                        <div className="flex flex-row lg:flex-col items-center gap-3 lg:w-36 shrink-0">

                                            {activity.image ? (
                                                <img
                                                    src={getImageUrl(
                                                        activity.image
                                                    )}
                                                    alt={
                                                        activity.item ||
                                                        "Item"
                                                    }
                                                    onError={(
                                                        event
                                                    ) => {
                                                        event.currentTarget.style.display =
                                                            "none";
                                                    }}
                                                    className="w-20 h-16 lg:w-32 lg:h-20 rounded-xl item-image border border-slate-200 bg-slate-50"
                                                />
                                            ) : (
                                                <div className="w-20 h-16 lg:w-32 lg:h-20 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                                                    <Package
                                                        size={
                                                            25
                                                        }
                                                        className="text-slate-300"
                                                    />
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleActivityView(
                                                        activity
                                                    )
                                                }
                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                                            >
                                                <Eye
                                                    size={
                                                        15
                                                    }
                                                />
                                                View
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            )
                        )}
                    </div>
                </section>

                {/* FOOTER */}

                <footer className="mt-14 pt-6 border-t border-slate-200 text-center">
                    <p className="text-sm font-medium text-slate-500">
                        {company.name} · Staff Portal
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                        Lost & Found Management System
                    </p>
                </footer>
            </main>
        </div>
    );
}

export default StaffDashboard;