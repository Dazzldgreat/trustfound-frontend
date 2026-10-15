import React, {
    createElement,
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    ArrowLeft,
    ClipboardCheck,
    Package,
    User,
    MapPin,
    Calendar,
    ShieldCheck,
    AlertTriangle,
    RefreshCw,
    Loader2,
    ChevronRight,
    Building2,
} from "lucide-react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";


// =============================================================
// API
// =============================================================

const API = "http://127.0.0.1:8000/api";


// =============================================================
// GET STORED OBJECT
// =============================================================

function getStoredObject(key) {
    try {
        return JSON.parse(
            localStorage.getItem(key) || "null"
        );
    } catch {
        return null;
    }
}


// =============================================================
// PENDING VERIFICATION PAGE
// =============================================================

function PendingVerification() {

    const navigate = useNavigate();

    const { companySlug } = useParams();


    // =========================================================
    // STORED DATA
    // =========================================================

    const storedCompany =
        getStoredObject("company");

    const storedUser =
        getStoredObject("user");

    const storedStaff =
        getStoredObject("staff");


    // =========================================================
    // COMPANY SLUG
    // =========================================================

    const activeCompanySlug =
        companySlug ||
        localStorage.getItem("companySlug") ||
        localStorage.getItem("company_slug") ||
        storedCompany?.slug ||
        storedCompany?.company_slug ||
        storedUser?.company_slug ||
        storedUser?.companySlug ||
        storedStaff?.company_slug ||
        storedStaff?.companySlug ||
        "";


    // =========================================================
    // COMPANY
    // =========================================================

    const [company, setCompany] =
        useState({
            name:
                storedCompany?.name ||
                storedCompany?.company_name ||
                "Company",

            logo:
                storedCompany?.logo ||
                storedCompany?.logo_url ||
                null,

            slug:
                activeCompanySlug,
        });


    // =========================================================
    // DATA
    // =========================================================

    const [data, setData] =
        useState({
            found_items: [],
            claim_requests: [],
            found_items_count: 0,
            claim_requests_count: 0,
            total_pending: 0,
        });


    // =========================================================
    // STATE
    // =========================================================

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");


    // =========================================================
    // COMPANY ROUTE
    // =========================================================

    const companyRoute =
        useCallback(
            (path = "") => {

                const cleanPath =
                    path
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


    // =========================================================
    // TOKEN
    // =========================================================

    const getToken =
        useCallback(
            () =>
                localStorage.getItem(
                    "access_token"
                ) ||
                localStorage.getItem(
                    "access"
                ),
            []
        );


    // =========================================================
    // IMAGE URL
    // =========================================================

    const getImageUrl =
        useCallback(
            (image) => {

                if (!image) {
                    return "";
                }


                const value =
                    String(image).trim();


                if (
                    value.startsWith(
                        "http://"
                    ) ||
                    value.startsWith(
                        "https://"
                    ) ||
                    value.startsWith(
                        "data:"
                    )
                ) {
                    return value;
                }


                const backendBase =
                    API.replace(
                        "/api",
                        ""
                    );


                return `${backendBase}${
                    value.startsWith("/")
                        ? value
                        : `/${value}`
                }`;
            },
            []
        );


    // =========================================================
    // LOGOUT
    // =========================================================

    const logout =
        useCallback(
            () => {

                [
                    "access",
                    "refresh",
                    "access_token",
                    "refresh_token",
                    "user",
                ].forEach(
                    (key) =>
                        localStorage.removeItem(
                            key
                        )
                );


                navigate(
                    companyRoute(
                        "/login-page"
                    ),
                    {
                        replace: true,
                    }
                );
            },
            [
                navigate,
                companyRoute,
            ]
        );


    // =========================================================
    // FETCH COMPANY
    // =========================================================

    const fetchCompany =
        useCallback(
            async () => {

                if (!activeCompanySlug) {
                    return;
                }


                try {

                    const response =
                        await fetch(
                            `${API}/company/public/${encodeURIComponent(
                                activeCompanySlug
                            )}/`,
                            {
                                headers: {
                                    Accept:
                                        "application/json",
                                },
                            }
                        );


                    const contentType =
                        response.headers.get(
                            "content-type"
                        ) || "";


                    if (
                        !contentType.includes(
                            "application/json"
                        )
                    ) {
                        return;
                    }


                    const result =
                        await response.json();


                    if (!response.ok) {
                        return;
                    }


                    const companyData =
                        result.company ||
                        result;


                    const updatedCompany = {
                        name:
                            companyData.name ||
                            storedCompany?.name ||
                            storedCompany?.company_name ||
                            "Company",

                        logo:
                            companyData.logo ||
                            companyData.logo_url ||
                            storedCompany?.logo ||
                            storedCompany?.logo_url ||
                            null,

                        slug:
                            companyData.slug ||
                            activeCompanySlug,
                    };


                    setCompany(
                        updatedCompany
                    );


                    localStorage.setItem(
                        "company",
                        JSON.stringify(
                            updatedCompany
                        )
                    );

                } catch (err) {

                    console.error(
                        "Company load error:",
                        err
                    );
                }
            },
            [
                activeCompanySlug,
                storedCompany?.name,
                storedCompany?.company_name,
                storedCompany?.logo,
                storedCompany?.logo_url,
            ]
        );


    // =========================================================
    // FETCH PENDING VERIFICATION
    // =========================================================

    const fetchPendingVerification =
        useCallback(
            async () => {

                const token =
                    getToken();


                if (!token) {
                    logout();
                    return;
                }


                try {

                    setRefreshing(true);

                    setError("");


                    const response =
                        await fetch(
                            `${API}/staff/pending-verification/`,
                            {
                                method: "GET",

                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,

                                    Accept:
                                        "application/json",
                                },
                            }
                        );


                    const contentType =
                        response.headers.get(
                            "content-type"
                        ) || "";


                    let result = {};


                    if (
                        contentType.includes(
                            "application/json"
                        )
                    ) {

                        result =
                            await response.json();

                    } else {

                        throw new Error(
                            `Server returned ${response.status} instead of JSON.`
                        );
                    }


                    // =================================================
                    // AUTH FAILURE
                    // =================================================

                    if (
                        response.status === 401 ||
                        response.status === 403
                    ) {

                        logout();

                        return;
                    }


                    // =================================================
                    // API ERROR
                    // =================================================

                    if (!response.ok) {

                        throw new Error(
                            result.error ||
                            result.detail ||
                            result.message ||
                            "Unable to load pending verification."
                        );
                    }


                    // =================================================
                    // FOUND ITEMS
                    // =================================================

                    const foundItems =
                        Array.isArray(
                            result.found_items
                        )
                            ? result.found_items
                            : [];


                    // =================================================
                    // CLAIM REQUESTS
                    // =================================================

                    const claimRequests =
                        Array.isArray(
                            result.claim_requests
                        )
                            ? result.claim_requests
                            : [];


                    // =================================================
                    // SET DATA
                    // =================================================

                    setData({
                        found_items:
                            foundItems,

                        claim_requests:
                            claimRequests,

                        found_items_count:
                            Number(
                                result.found_items_count
                            ) ||
                            foundItems.length,

                        claim_requests_count:
                            Number(
                                result.claim_requests_count
                            ) ||
                            claimRequests.length,

                        total_pending:
                            Number(
                                result.total_pending
                            ) ||
                            foundItems.length +
                                claimRequests.length,
                    });

                } catch (err) {

                    console.error(
                        "Pending verification error:",
                        err
                    );


                    setError(
                        err.message ||
                        "Unable to load pending verification."
                    );

                } finally {

                    setLoading(false);

                    setRefreshing(false);
                }
            },
            [
                getToken,
                logout,
            ]
        );


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        if (!getToken()) {

            logout();

            return;
        }


        if (!activeCompanySlug) {

            navigate(
                "/",
                {
                    replace: true,
                }
            );

            return;
        }


        fetchCompany();

        fetchPendingVerification();

    }, [
        activeCompanySlug,
        fetchCompany,
        fetchPendingVerification,
        getToken,
        logout,
        navigate,
    ]);


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">

                <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm">

                    <Loader2
                        size={30}
                        className="mx-auto text-emerald-600 animate-spin"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                        Loading pending verification...
                    </p>

                </div>

            </div>
        );
    }


    // =========================================================
    // PAGE
    // =========================================================

    return (

        <div className="min-h-screen bg-slate-50">


            {/* ORGANIZATION BAR */}
            <div className="bg-slate-900">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="h-14 flex items-center justify-between">          
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
                                <Building2
                                   size={18}
                                   className="text-green-500"
                                />
                            </div>
           
                            <span className="text-sm font-bold text-slate-300">
                                taff operations and lost & found management
                            </span>
                        </div>
           
                            <div className="hidden sm:flex items-center gap-3">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                                    Organization ID
                                </span>
           
                                <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-green-400 font-mono text-xs font-bold">
                                    {activeCompanySlug}
                                </span>
                            </div>
                    </div>
                </div>
            </div>
           

            {/* =====================================================
                MAIN
            ===================================================== */}

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">


                {/* PAGE TITLE */}

                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">

                    <div>

                        <div className="flex items-center gap-2 mb-1">

                            <ClipboardCheck
                                size={17}
                                className="text-emerald-600"
                            />

                            <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-600">
                                Verification
                            </span>

                        </div>


                        <h2 className="text-2xl font-bold text-slate-900">
                            Pending verification
                        </h2>


                        <p className="text-sm text-slate-500 mt-1">
                            Review items and claims awaiting
                            staff verification.
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={
                            fetchPendingVerification
                        }
                        disabled={refreshing}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
                    >

                        <RefreshCw
                            size={15}
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}

                    </button>

                </div>


                {/* ERROR */}

                {error && (

                    <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">

                        <AlertTriangle
                            size={17}
                            className="shrink-0 mt-0.5"
                        />

                        <span>
                            {error}
                        </span>

                    </div>

                )}


                {/* =================================================
                    SUMMARY
                ================================================= */}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">

                    <SummaryCard
                        title="Total pending"
                        value={
                            data.total_pending
                        }
                        icon={
                            ClipboardCheck
                        }
                    />

                    <SummaryCard
                        title="Found items"
                        value={
                            data.found_items_count
                        }
                        icon={
                            Package
                        }
                    />

                    <SummaryCard
                        title="Claim requests"
                        value={
                            data.claim_requests_count
                        }
                        icon={
                            ShieldCheck
                        }
                    />

                </div>


                {/* =================================================
                    FOUND ITEMS
                ================================================= */}

                <section className="mb-8">

                    <SectionHeader
                        title="Found items"
                        description="Items waiting for verification."
                        count={
                            data.found_items_count
                        }
                    />


                    {data.found_items.length ===
                    0 ? (

                        <EmptyState
                            text="No found items are waiting for verification."
                        />

                    ) : (

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">

                            {data.found_items.map(
                                (item) => (

                                    <article
                                        key={item.id}
                                        className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-emerald-200 transition"
                                    >

                                        {/* IMAGE */}

                                        {item.image ? (

                                            <img
                                                src={getImageUrl(
                                                    item.image
                                                )}
                                                alt={
                                                    item.item_name ||
                                                    "Found item"
                                                }
                                                className="w-full h-32 object-cover"
                                                onError={(
                                                    event
                                                ) => {
                                                    event.currentTarget.style.display =
                                                        "none";
                                                }}
                                            />

                                        ) : (

                                            <div className="w-full h-24 bg-slate-50 flex items-center justify-center">

                                                <Package
                                                    size={25}
                                                    className="text-slate-300"
                                                />

                                            </div>

                                        )}


                                        <div className="p-4">


                                            {/* ITEM HEADER */}

                                            <div className="flex items-start justify-between gap-2">

                                                <div className="min-w-0">

                                                    <h3 className="font-bold text-slate-900 truncate">
                                                        {item.item_name ||
                                                            "Unnamed item"}
                                                    </h3>

                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {item.category ||
                                                            "No category"}
                                                    </p>

                                                </div>


                                                <span className="shrink-0 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
                                                    PENDING
                                                </span>

                                            </div>


                                            {/* INFORMATION */}

                                            <div className="mt-3 space-y-2 text-xs text-slate-500">

                                                <InfoRow
                                                    icon={
                                                        MapPin
                                                    }
                                                    value={
                                                        item.location_found ||
                                                        item.location ||
                                                        "Location not provided"
                                                    }
                                                />


                                                <InfoRow
                                                    icon={
                                                        Calendar
                                                    }
                                                    value={
                                                        item.date_found ||
                                                        "Date not provided"
                                                    }
                                                />


                                                {item.finder_name && (

                                                    <InfoRow
                                                        icon={
                                                            User
                                                        }
                                                        value={
                                                            item.finder_name
                                                        }
                                                    />

                                                )}

                                            </div>


                                            {/* VERIFY */}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        companyRoute(
                                                            `/staff/verify-found-item/${item.id}`
                                                        )
                                                    )
                                                }
                                                className="w-full mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                                            >

                                                Verify item

                                                <ChevronRight
                                                    size={15}
                                                />

                                            </button>

                                        </div>

                                    </article>

                                )
                            )}

                        </div>

                    )}

                </section>


                {/* =================================================
                    CLAIM REQUESTS
                ================================================= */}

                <section>

                    <SectionHeader
                        title="Claim requests"
                        description="Customer claims waiting for verification."
                        count={
                            data.claim_requests_count
                        }
                    />


                    {data.claim_requests.length ===
                    0 ? (

                        <EmptyState
                            text="No claim requests are waiting for verification."
                        />

                    ) : (

                        <div className="space-y-3">

                            {data.claim_requests.map(
                                (claim) => (

                                    <article
                                        key={claim.id}
                                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-emerald-200 transition"
                                    >

                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">


                                            {/* CUSTOMER */}

                                            <div className="flex items-start gap-3">

                                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">

                                                    <User
                                                        size={18}
                                                        className="text-emerald-600"
                                                    />

                                                </div>


                                                <div className="min-w-0">

                                                    <h3 className="font-bold text-slate-900">
                                                        {claim.customer?.name ||
                                                            "Unknown Customer"}
                                                    </h3>

                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {claim.customer?.phone ||
                                                            "No phone"}{" "}
                                                        ·{" "}
                                                        {claim.customer?.email ||
                                                            "No email"}
                                                    </p>

                                                </div>

                                            </div>


                                            {/* STATUS */}

                                            <div className="flex flex-wrap gap-2">

                                                <span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">
                                                    {claim.status ||
                                                        "Pending"}
                                                </span>


                                                <span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">

                                                    {Number(
                                                        claim.confidence_score ||
                                                        0
                                                    ).toFixed(
                                                        1
                                                    )}

                                                    % Match

                                                </span>

                                            </div>

                                        </div>


                                        {/* ITEMS */}

                                        <div className="grid sm:grid-cols-2 gap-3 mt-4">

                                            <ItemBox
                                                title="Lost item"
                                                item={
                                                    claim.lost_item
                                                }
                                            />


                                            <ItemBox
                                                title="Found item"
                                                item={
                                                    claim.found_item
                                                }
                                            />

                                        </div>


                                        {/* ACTION */}

                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-3 border-t border-slate-100">


                                            <div>

                                                <p className="text-[10px] uppercase font-bold tracking-wide text-slate-400">
                                                    Approved by
                                                </p>

                                                <p className="text-xs font-semibold text-emerald-600 mt-1">
                                                    {claim.approved_by ||
                                                        "Unknown"}
                                                </p>

                                            </div>


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        companyRoute(
                                                            `/staff/claim-requests/${claim.id}`
                                                        )
                                                    )
                                                }
                                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                                            >

                                                Review claim

                                                <ChevronRight
                                                    size={15}
                                                />

                                            </button>

                                        </div>

                                    </article>

                                )
                            )}

                        </div>

                    )}

                </section>


                {/* FOOTER */}

                <footer className="mt-10 pt-5 border-t border-slate-200 text-center">

                    <p className="text-xs font-semibold text-slate-500">
                        {company.name} · Staff Portal
                    </p>

                    <p className="text-[11px] text-slate-400 mt-1">
                        Lost &amp; Found Management System
                    </p>

                </footer>

            </main>

        </div>
    );
}


// =============================================================
// SUMMARY CARD
// =============================================================

function SummaryCard({
    title,
    value,
    icon,
}) {

    return (

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

            <div className="flex items-center justify-between">

                <div>

                    <p className="text-xs font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="text-2xl font-bold text-slate-900 mt-1">
                        {value}
                    </p>

                </div>


                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">

                    {createElement(
                        icon,
                        {
                            size: 18,
                            className:
                                "text-emerald-600",
                        }
                    )}

                </div>

            </div>

        </div>
    );
}


// =============================================================
// SECTION HEADER
// =============================================================

function SectionHeader({
    title,
    description,
    count,
}) {

    return (

        <div className="flex items-center justify-between mb-3">

            <div>

                <div className="flex items-center gap-2">

                    <h2 className="text-lg font-bold text-slate-900">
                        {title}
                    </h2>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
                        {count}
                    </span>

                </div>


                <p className="text-xs text-slate-500 mt-0.5">
                    {description}
                </p>

            </div>

        </div>
    );
}


// =============================================================
// INFO ROW
// =============================================================

function InfoRow({
    icon,
    value,
}) {

    return (

        <div className="flex items-center gap-2 min-w-0">

            {createElement(
                icon,
                {
                    size: 14,
                    className:
                        "shrink-0 text-emerald-500",
                }
            )}

            <span className="truncate">
                {String(value)}
            </span>

        </div>
    );
}


// =============================================================
// ITEM BOX
// =============================================================

function ItemBox({
    title,
    item,
}) {

    return (

        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">

            <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                {title}
            </p>

            <p className="text-sm font-bold text-slate-800 mt-1">
                {item?.item_name ||
                    "Unknown"}
            </p>

            <p className="text-xs text-slate-500 mt-0.5">
                {item?.category ||
                    "No category"}
            </p>

        </div>
    );
}


// =============================================================
// EMPTY STATE
// =============================================================

function EmptyState({
    text,
}) {

    return (

        <div className="bg-white border border-slate-200 rounded-xl p-7 text-center">

            <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-50 flex items-center justify-center">

                <Package
                    size={21}
                    className="text-emerald-500"
                />

            </div>


            <p className="text-sm text-slate-500 mt-2">
                {text}
            </p>

        </div>
    );
}


export default PendingVerification;