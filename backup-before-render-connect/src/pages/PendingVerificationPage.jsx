import React, {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    ArrowLeft,
    Package,
    User,
    MapPin,
    Calendar,
    RefreshCw,
    Loader2,
    AlertTriangle,
    ChevronRight,
    ShieldCheck,
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
        const value = localStorage.getItem(key);

        if (!value) {
            return null;
        }

        return JSON.parse(value);
    } catch (error) {
        console.error(
            `Unable to read localStorage "${key}":`,
            error
        );

        return null;
    }
}


// =============================================================
// COMPONENT
// =============================================================

function PendingVerificationPage() {

    const navigate = useNavigate();

    const { companySlug } = useParams();


    // =========================================================
    // STORED DATA
    // =========================================================

    const storedCompany =
        getStoredObject("company");

    const storedUser =
        getStoredObject("user");


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
        storedUser?.organization_slug ||
        storedUser?.organizationSlug ||
        "";


    // =========================================================
    // COMPANY ROUTE
    // =========================================================

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


    // =========================================================
    // TOKEN
    // =========================================================

    const getToken = useCallback(() => {

        return (
            localStorage.getItem("access_token") ||
            localStorage.getItem("access") ||
            ""
        );

    }, []);


    // =========================================================
    // IMAGE URL
    // =========================================================

    const getImageUrl = useCallback((image) => {

        if (!image) {
            return "";
        }

        const value =
            String(image).trim();

        if (
            value.startsWith("http://") ||
            value.startsWith("https://") ||
            value.startsWith("data:")
        ) {
            return value;
        }

        const baseURL =
            API.replace("/api", "");

        return `${baseURL}${
            value.startsWith("/")
                ? value
                : `/${value}`
        }`;

    }, []);


    // =========================================================
    // STATE
    // =========================================================

    const [items, setItems] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");


    // =========================================================
    // LOGOUT
    // =========================================================

    const logout = useCallback(() => {

        [
            "access",
            "refresh",
            "access_token",
            "refresh_token",
            "user",
        ].forEach((key) => {

            localStorage.removeItem(key);

        });

        navigate(
            companyRoute("/login-page"),
            {
                replace: true,
            }
        );

    }, [
        navigate,
        companyRoute,
    ]);


    // =========================================================
    // FETCH PENDING ITEMS
    // =========================================================

    const fetchItems = useCallback(
        async () => {

            const token =
                getToken();


            // -----------------------------------------------------
            // NO TOKEN
            // -----------------------------------------------------

            if (!token) {

                logout();

                return;
            }


            try {

                setRefreshing(true);
                setError("");


                console.log(
                    "Fetching pending items from:",
                    `${API}/staff/pending-items/`
                );


                const response =
                    await fetch(
                        `${API}/staff/pending-items/`,
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


                // -------------------------------------------------
                // RESPONSE TYPE
                // -------------------------------------------------

                const contentType =
                    response.headers.get(
                        "content-type"
                    ) || "";


                // -------------------------------------------------
                // READ RESPONSE
                // -------------------------------------------------

                let result = null;


                if (
                    contentType.includes(
                        "application/json"
                    )
                ) {

                    result =
                        await response.json();

                } else {

                    const text =
                        await response.text();


                    console.error(
                        "NON-JSON API RESPONSE:",
                        text
                    );


                    throw new Error(
                        `Server returned HTTP ${response.status} instead of JSON.`
                    );
                }


                // -------------------------------------------------
                // DEBUG
                // -------------------------------------------------

                console.log(
                    "PENDING ITEMS STATUS:",
                    response.status
                );

                console.log(
                    "PENDING ITEMS RESPONSE:",
                    result
                );


                // -------------------------------------------------
                // AUTH FAILURE
                // -------------------------------------------------

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {

                    logout();

                    return;
                }


                // -------------------------------------------------
                // SERVER ERROR
                // -------------------------------------------------

                if (!response.ok) {

                    const message =
                        result?.error ||
                        result?.detail ||
                        result?.message ||
                        result?.non_field_errors?.[0] ||
                        `Unable to load pending items. HTTP ${response.status}.`;


                    throw new Error(
                        String(message)
                    );
                }


                // -------------------------------------------------
                // EXTRACT ITEMS
                // -------------------------------------------------

                let pendingItems = null;


                if (
                    Array.isArray(result)
                ) {

                    pendingItems =
                        result;

                } else if (
                    Array.isArray(
                        result?.items
                    )
                ) {

                    pendingItems =
                        result.items;

                } else if (
                    Array.isArray(
                        result?.pending_items
                    )
                ) {

                    pendingItems =
                        result.pending_items;

                } else if (
                    Array.isArray(
                        result?.found_items
                    )
                ) {

                    pendingItems =
                        result.found_items;

                } else if (
                    Array.isArray(
                        result?.data
                    )
                ) {

                    pendingItems =
                        result.data;

                } else if (
                    Array.isArray(
                        result?.results
                    )
                ) {

                    pendingItems =
                        result.results;
                }


                // -------------------------------------------------
                // UNKNOWN RESPONSE
                // -------------------------------------------------

                if (!pendingItems) {

                    console.error(
                        "Unexpected pending-items response format:",
                        result
                    );


                    throw new Error(
                        "The server returned an unexpected pending-items response format."
                    );
                }


                // -------------------------------------------------
                // SAVE ITEMS
                // -------------------------------------------------

                setItems(
                    pendingItems
                );

            } catch (err) {

                console.error(
                    "PENDING ITEMS ERROR:",
                    err
                );


                setItems([]);


                setError(
                    err?.message ||
                    "Unable to load pending items."
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

        const token =
            getToken();


        if (!token) {

            logout();

            return;
        }


        fetchItems();

    }, [
        getToken,
        fetchItems,
        logout,
    ]);


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">

                <div className="bg-white border border-slate-200 rounded-xl p-7 text-center shadow-sm">

                    <Loader2
                        size={32}
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

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5">


                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                    <div>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    companyRoute(
                                        "/staff/dashboard"
                                    )
                                )
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 mb-2 transition"
                        >

                            <ArrowLeft
                                size={15}
                            />

                            Dashboard

                        </button>


                        <h1 className="text-2xl font-bold text-slate-900">
                            Pending Verification
                        </h1>


                        <p className="text-sm text-slate-500 mt-1">
                            Review found items waiting
                            for staff verification.
                        </p>

                    </div>


                    {/* REFRESH */}

                    <button
                        type="button"
                        onClick={fetchItems}
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


                {/* =================================================
                    NAVIGATION
                ================================================= */}

                <div className="mb-6 border-b border-slate-200">

                    <div className="flex items-center gap-6">

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    companyRoute(
                                        "/staff/dashboard"
                                    )
                                )
                            }
                            className="pb-3 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition"
                        >
                            Staff Dashboard
                        </button>


                        <button
                            type="button"
                            className="relative pb-3 text-sm font-bold text-emerald-600"
                        >

                            Pending Verification

                            <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">

                                {items.length}

                            </span>


                            <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-emerald-600 rounded-full" />

                        </button>

                    </div>

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">

                        <AlertTriangle
                            size={17}
                            className="shrink-0 mt-0.5"
                        />

                        <div className="flex-1">

                            <p className="font-semibold">
                                Unable to load pending items
                            </p>

                            <p className="mt-1">
                                {error}
                            </p>

                        </div>

                    </div>

                )}


                {/* =================================================
                    SUMMARY
                ================================================= */}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">

                    <SummaryCard
                        title="Total Pending"
                        value={items.length}
                        icon={Package}
                    />


                    <SummaryCard
                        title="Verification Status"
                        value="Pending"
                        icon={ShieldCheck}
                    />


                    <SummaryCard
                        title="Organization"
                        value={
                            activeCompanySlug ||
                            "Organization"
                        }
                        icon={User}
                        breakValue
                    />

                </div>


                {/* =================================================
                    SECTION HEADER
                ================================================= */}

                <div className="flex items-center justify-between mb-3">

                    <div>

                        <h2 className="text-lg font-bold text-slate-900">
                            Found Items
                        </h2>

                        <p className="text-xs text-slate-500 mt-0.5">
                            Items waiting for verification.
                        </p>

                    </div>


                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">

                        {items.length}

                    </span>

                </div>


                {/* =================================================
                    EMPTY STATE
                ================================================= */}

                {items.length === 0 ? (

                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">

                        <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center">

                            <Package
                                size={25}
                                className="text-emerald-500"
                            />

                        </div>


                        <h2 className="text-base font-bold text-slate-800 mt-3">
                            No Pending Items
                        </h2>


                        <p className="text-sm text-slate-500 mt-1">
                            There are currently no found
                            items waiting for verification.
                        </p>

                    </div>

                ) : (

                    /* =================================================
                       ITEMS
                    ================================================= */

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">

                        {items.map((item) => {

                            const imageUrl =
                                getImageUrl(
                                    item?.image
                                );


                            return (

                                <article
                                    key={
                                        item?.id ??
                                        `pending-${Math.random()}`
                                    }
                                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
                                >

                                    {/* IMAGE */}

                                    {imageUrl ? (

                                        <img
                                            src={imageUrl}
                                            alt={
                                                item?.item_name ||
                                                "Found item"
                                            }
                                            className="w-full h-36 object-cover"
                                            onError={(event) => {

                                                event.currentTarget.style.display =
                                                    "none";

                                            }}
                                        />

                                    ) : (

                                        <div className="w-full h-36 bg-emerald-50 flex items-center justify-center">

                                            <Package
                                                size={42}
                                                className="text-emerald-300"
                                            />

                                        </div>

                                    )}


                                    {/* CONTENT */}

                                    <div className="p-4">

                                        {/* TITLE */}

                                        <div className="flex items-start justify-between gap-2">

                                            <div className="min-w-0">

                                                <h3 className="font-bold text-slate-900 truncate">

                                                    {item?.item_name ||
                                                        "Unnamed Item"}

                                                </h3>


                                                <p className="text-xs text-slate-500 mt-0.5">

                                                    {item?.category ||
                                                        "No category"}

                                                </p>

                                            </div>


                                            {/* STATUS */}

                                            <span className="shrink-0 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">

                                                PENDING

                                            </span>

                                        </div>


                                        {/* DETAILS */}

                                        <div className="mt-3 space-y-2 text-xs text-slate-500">


                                            {/* FINDER */}

                                            {item?.finder_name && (

                                                <InfoRow
                                                    icon={User}
                                                    value={
                                                        item.finder_name
                                                    }
                                                />

                                            )}


                                            {/* LOCATION */}

                                            {(
                                                item?.location_found ||
                                                item?.location
                                            ) && (

                                                <InfoRow
                                                    icon={MapPin}
                                                    value={
                                                        item.location_found ||
                                                        item.location
                                                    }
                                                />

                                            )}


                                            {/* DATE */}

                                            {item?.date_found && (

                                                <InfoRow
                                                    icon={Calendar}
                                                    value={
                                                        item.date_found
                                                    }
                                                />

                                            )}

                                        </div>


                                        {/* VERIFY BUTTON */}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    companyRoute(
                                                        `/staff/verify-found-item/${item?.id}`
                                                    )
                                                )
                                            }
                                            className="w-full mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                                        >

                                            Verify Item

                                            <ChevronRight
                                                size={15}
                                            />

                                        </button>

                                    </div>

                                </article>

                            );

                        })}

                    </div>

                )}

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
    breakValue = false,
}) {

    return (

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

            <div className="flex items-center justify-between gap-3">

                <div className="min-w-0">

                    <p className="text-xs font-medium text-slate-500">
                        {title}
                    </p>


                    <p
                        className={`text-xl font-bold text-slate-900 mt-1 ${
                            breakValue
                                ? "break-all"
                                : ""
                        }`}
                    >
                        {value}
                    </p>

                </div>


                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">

                    {React.createElement(
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
// INFO ROW
// =============================================================

function InfoRow({
    icon,
    value,
}) {

    return (

        <div className="flex items-center gap-2 min-w-0">

            {React.createElement(
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


export default PendingVerificationPage;