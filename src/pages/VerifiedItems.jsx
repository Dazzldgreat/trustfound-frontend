import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowLeft,
    CheckCircle2,
    Search,
    ShieldCheck,
    MapPin,
    UserRound,
    Mail,
    Phone,
    CalendarDays,
    Clock3,
    Package,
    RefreshCw,
    Building2,
    Eye,
    X,
} from "lucide-react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";


// =============================================================
// API
// =============================================================

import { API } from "../config";
// =============================================================
// STORED OBJECT
// =============================================================

function getStored(key) {
    try {
        const value = localStorage.getItem(key);

        if (!value) {
            return {};
        }

        return JSON.parse(value);

    } catch (error) {

        console.error(
            `Unable to read localStorage "${key}":`,
            error
        );

        return {};
    }
}


// =============================================================
// DETAIL COMPONENT
// =============================================================

function Detail({
    icon,
    label,
    value,
}) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    return (
        <div className="flex gap-2 min-w-0">

            <div className="shrink-0 mt-0.5">
                {React.createElement(icon, {
                    size: 14,
                    className: "text-slate-400",
                })}
            </div>

            <div className="min-w-0">

                <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                    {label}
                </p>

                <p className="text-xs font-semibold text-slate-700 truncate">
                    {String(value)}
                </p>

            </div>

        </div>
    );
}


// =============================================================
// PAGE
// =============================================================

function VerifiedItems() {

    const navigate = useNavigate();

    const { companySlug } = useParams();


    // =========================================================
    // STORED DATA
    // =========================================================

    const staff = getStored("staff");

    const savedCompany = getStored("company");


    const storedStaffUsername =
        staff?.username || "";

    const storedCompanyId =
        savedCompany?.id || null;

    const storedCompanyName =
        savedCompany?.name || "Company";

    const storedCompanyLogo =
        savedCompany?.logo || null;


    // =========================================================
    // COMPANY SLUG
    // =========================================================

    const slug =
        companySlug ||
        localStorage.getItem("companySlug") ||
        localStorage.getItem("company_slug") ||
        savedCompany?.slug ||
        staff?.company_slug ||
        staff?.companySlug ||
        "";


    // =========================================================
    // COMPANY
    // =========================================================

    const [company, setCompany] = useState({
        id: storedCompanyId,
        name: storedCompanyName,
        slug,
        logo: storedCompanyLogo,
    });


    // =========================================================
    // STATE
    // =========================================================

    const [items, setItems] =
        useState([]);

    const [search, setSearch] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [selected, setSelected] =
        useState(null);


    // =========================================================
    // ROUTE
    // =========================================================

    const route = useCallback(
        (path = "") => {

            const cleanPath = path
                ? path.startsWith("/")
                    ? path
                    : `/${path}`
                : "";

            if (!slug) {
                return "/staff-login";
            }

            return `/company/${encodeURIComponent(
                slug
            )}${cleanPath}`;
        },
        [slug]
    );


    // =========================================================
    // IMAGE URL
    // =========================================================

    const imageUrl = useCallback(
        (image) => {

            if (!image) {
                return "";
            }

            let value =
                String(image).trim();

            const backend =
                API.replace("/api", "");


            // Prevent duplicated backend URL
            const duplicatedBackend =
                `${backend}${backend}`;

            if (
                value.includes(
                    duplicatedBackend
                )
            ) {
                value =
                    value.replace(
                        duplicatedBackend,
                        backend
                    );
            }


            // Already absolute URL
            if (
                value.startsWith("http://") ||
                value.startsWith("https://") ||
                value.startsWith("data:")
            ) {
                return value;
            }


            return `${backend}/${value.replace(
                /^\/+/,
                ""
            )}`;
        },
        []
    );


    // =========================================================
    // LOGOUT
    // =========================================================

    const logout = useCallback(
        (redirect = true) => {

            [
                "access",
                "refresh",
                "access_token",
                "refresh_token",
                "staff",
            ].forEach(
                (key) =>
                    localStorage.removeItem(key)
            );


            if (redirect) {

                navigate(
                    route("/staff-login"),
                    {
                        replace: true,
                    }
                );

            }

        },
        [
            navigate,
            route,
        ]
    );


    // =========================================================
    // FETCH COMPANY
    // =========================================================

    const fetchCompany = useCallback(
        async () => {

            if (!slug) {
                return;
            }


            try {

                const response =
                    await fetch(
                        `${API}/company/public/${encodeURIComponent(
                            slug
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

                    throw new Error(
                        "Unable to load company."
                    );
                }


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data?.error ||
                        data?.detail ||
                        "Unable to load company."
                    );
                }


                const c =
                    data?.company ||
                    data;


                const updated = {
                    id:
                        c?.id ||
                        storedCompanyId ||
                        null,

                    name:
                        c?.name ||
                        storedCompanyName ||
                        "Company",

                    slug:
                        c?.slug ||
                        slug,

                    logo:
                        c?.logo ||
                        storedCompanyLogo ||
                        null,
                };


                setCompany(updated);


                localStorage.setItem(
                    "company",
                    JSON.stringify(updated)
                );

            } catch (err) {

                console.error(
                    "COMPANY LOAD ERROR:",
                    err
                );

            }

        },
        [
            slug,
            storedCompanyId,
            storedCompanyName,
            storedCompanyLogo,
        ]
    );


    // =========================================================
    // FETCH VERIFIED ITEMS
    // =========================================================

    const fetchItems = useCallback(
        async () => {

            const token =
                localStorage.getItem(
                    "access_token"
                ) ||
                localStorage.getItem(
                    "access"
                );


            // -------------------------------------------------
            // NO TOKEN
            // -------------------------------------------------

            if (!token) {

                navigate(
                    route("/staff-login"),
                    {
                        replace: true,
                    }
                );

                return;
            }


            // -------------------------------------------------
            // NO COMPANY
            // -------------------------------------------------

            if (!slug) {

                navigate(
                    "/",
                    {
                        replace: true,
                    }
                );

                return;
            }


            try {

                setRefreshing(true);

                setError("");


                const response =
                    await fetch(
                        `${API}/staff/verified-items/?company_slug=${encodeURIComponent(
                            slug
                        )}`,
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


                let data = null;


                if (
                    contentType.includes(
                        "application/json"
                    )
                ) {

                    data =
                        await response.json();

                } else {

                    const text =
                        await response.text();

                    console.error(
                        "NON-JSON RESPONSE:",
                        text
                    );

                    throw new Error(
                        `Server returned HTTP ${response.status}.`
                    );
                }


                // -------------------------------------------------
                // AUTH FAILURE
                // -------------------------------------------------

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {

                    logout(false);

                    return;
                }


                // -------------------------------------------------
                // SERVER ERROR
                // -------------------------------------------------

                if (!response.ok) {

                    throw new Error(
                        data?.error ||
                        data?.detail ||
                        data?.message ||
                        `Server returned ${response.status}.`
                    );
                }


                // -------------------------------------------------
                // EXTRACT ITEMS
                // -------------------------------------------------

                let verifiedItems = [];


                if (
                    Array.isArray(data)
                ) {

                    verifiedItems =
                        data;

                } else if (
                    Array.isArray(
                        data?.items
                    )
                ) {

                    verifiedItems =
                        data.items;

                } else if (
                    Array.isArray(
                        data?.verified_items
                    )
                ) {

                    verifiedItems =
                        data.verified_items;

                } else if (
                    Array.isArray(
                        data?.results
                    )
                ) {

                    verifiedItems =
                        data.results;

                } else if (
                    Array.isArray(
                        data?.data
                    )
                ) {

                    verifiedItems =
                        data.data;
                }


                setItems(
                    verifiedItems
                );

            } catch (err) {

                console.error(
                    "VERIFIED ITEMS ERROR:",
                    err
                );


                setItems([]);


                setError(
                    err?.message ||
                    "Unable to load verified items."
                );

            } finally {

                setLoading(false);

                setRefreshing(false);
            }

        },
        [
            slug,
            navigate,
            route,
            logout,
        ]
    );


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        const token =
            localStorage.getItem(
                "access_token"
            ) ||
            localStorage.getItem(
                "access"
            );


        if (
            !token ||
            !storedStaffUsername
        ) {

            navigate(
                route("/staff-login"),
                {
                    replace: true,
                }
            );

            return;
        }


        if (!slug) {

            navigate(
                "/",
                {
                    replace: true,
                }
            );

            return;
        }


        fetchCompany();

        fetchItems();

    }, [
        slug,
        storedStaffUsername,
        navigate,
        route,
        fetchCompany,
        fetchItems,
    ]);


    // =========================================================
    // ESCAPE MODAL
    // =========================================================

    useEffect(() => {

        const handleEscape = (event) => {

            if (
                event.key === "Escape"
            ) {
                setSelected(null);
            }

        };


        window.addEventListener(
            "keydown",
            handleEscape
        );


        return () => {

            window.removeEventListener(
                "keydown",
                handleEscape
            );

        };

    }, []);


    // =========================================================
    // FILTER
    // =========================================================

    const filtered = useMemo(() => {

        const query =
            search
                .trim()
                .toLowerCase();


        if (!query) {
            return items;
        }


        return items.filter(
            (item) => {

                return [
                    item?.item_name,
                    item?.category,
                    item?.finder_name,
                    item?.finder_phone,
                    item?.finder_email,
                    item?.location,
                    item?.description,
                    item?.status,
                    item?.verified_by,
                    item?.source,
                    item?.page,
                    item?.received_from,
                    item?.staff_receiver,
                    item?.found_by_staff,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(query);
            }
        );

    }, [
        items,
        search,
    ]);


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">

                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">

                    <RefreshCw
                        size={24}
                        className="mx-auto text-blue-600 animate-spin"
                    />

                    <h2 className="font-bold text-slate-900 mt-4">
                        Loading verified items
                    </h2>

                    <p className="text-xs text-slate-500 mt-1">
                        Preparing records...
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

            <main className="max-w-6xl mx-auto px-4 md:px-6 py-5">


                {/* =================================================
                    COMPANY
                ================================================= */}

                <header className="bg-slate-900 text-white rounded-xl px-4 py-3 mb-5 flex items-center justify-between gap-4">

                    <div className="flex items-center gap-3 min-w-0">

                        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden shrink-0">

                            {company.logo ? (

                                <img
                                    src={imageUrl(
                                        company.logo
                                    )}
                                    alt={
                                        company.name
                                    }
                                    className="w-full h-full item-image"
                                />

                            ) : (

                                <Building2
                                    size={18}
                                />

                            )}

                        </div>


                        <div className="min-w-0">

                            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                                Active organization
                            </p>

                            <h2 className="font-bold text-sm truncate">
                                {company.name}
                            </h2>

                        </div>

                    </div>


                    <span className="text-[10px] text-blue-300 font-mono hidden sm:block">
                        {slug}
                    </span>

                </header>


                {/* =================================================
                    TITLE
                ================================================= */}

                <section className="flex items-center justify-between mb-5 gap-3">

                    <div>

                        <div className="flex items-center gap-1.5 text-blue-600">

                            <ShieldCheck
                                size={15}
                            />

                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                Verification
                            </span>

                        </div>


                        <h1 className="text-2xl font-bold text-slate-900 mt-1">
                            Verified items
                        </h1>


                        <p className="text-xs text-slate-500 mt-1">
                            Items completed through staff verification.
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            navigate(-1)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >

                        <ArrowLeft
                            size={14}
                        />

                        Back

                    </button>

                </section>


                {/* =================================================
                    STATS
                ================================================= */}

                <div className="grid grid-cols-3 gap-3 mb-5">

                    <div className="bg-white border border-slate-200 rounded-xl p-4">

                        <p className="text-[10px] text-slate-500 font-medium">
                            Total verified
                        </p>

                        <p className="text-2xl font-bold mt-1">
                            {items.length}
                        </p>

                    </div>


                    <div className="bg-white border border-slate-200 rounded-xl p-4">

                        <p className="text-[10px] text-slate-500 font-medium">
                            Showing
                        </p>

                        <p className="text-2xl font-bold mt-1">
                            {filtered.length}
                        </p>

                    </div>


                    <div className="bg-white border border-slate-200 rounded-xl p-4">

                        <p className="text-[10px] text-slate-500 font-medium">
                            Status
                        </p>

                        <p className="text-lg font-bold text-emerald-600 mt-2">
                            Verified
                        </p>

                    </div>

                </div>


                {/* =================================================
                    SEARCH
                ================================================= */}

                <div className="bg-white border border-slate-200 rounded-xl p-3 mb-5 flex gap-2">

                    <div className="relative flex-1">

                        <Search
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />


                        <input
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Search items, finder, location..."
                            className="w-full border border-slate-200 rounded-lg pl-9 pr-8 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        />


                        {search && (

                            <button
                                type="button"
                                onClick={() =>
                                    setSearch("")
                                }
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >

                                <X
                                    size={14}
                                />

                            </button>

                        )}

                    </div>


                    <button
                        type="button"
                        onClick={fetchItems}
                        disabled={refreshing}
                        aria-label="Refresh verified items"
                        className="px-3 py-2 rounded-lg bg-slate-100 text-xs font-semibold hover:bg-slate-200 disabled:opacity-50"
                    >

                        <RefreshCw
                            size={14}
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                    </button>

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">

                        <b>
                            Unable to load items:
                        </b>{" "}

                        {error}

                    </div>

                )}


                {/* =================================================
                    LIST
                ================================================= */}

                {filtered.length === 0 ? (

                    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">

                        <Package
                            size={28}
                            className="mx-auto text-slate-300"
                        />

                        <h3 className="font-bold text-slate-800 mt-3">

                            {search
                                ? "No matching items"
                                : "No verified items"}

                        </h3>


                        <p className="text-xs text-slate-500 mt-1">

                            {search
                                ? "Try another search."
                                : "No items have completed verification."}

                        </p>

                    </div>

                ) : (

                    <div className="space-y-3">

                        {filtered.map(
                            (item) => (

                                <article
                                    key={
                                        item?.id
                                    }
                                    className="bg-white border border-slate-200 rounded-xl p-3 hover:shadow-sm transition"
                                >

                                    <div className="flex gap-4">


                                        {/* IMAGE */}

                                        {item?.image ? (

                                            <img
                                                src={imageUrl(
                                                    item.image
                                                )}
                                                alt={
                                                    item?.item_name ||
                                                    "Item"
                                                }
                                                className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg item-image border border-slate-200 shrink-0"
                                                onError={(
                                                    event
                                                ) => {

                                                    event.currentTarget.style.display =
                                                        "none";

                                                }}
                                            />

                                        ) : (

                                            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">

                                                <Package
                                                    size={25}
                                                    className="text-slate-300"
                                                />

                                            </div>

                                        )}


                                        {/* CONTENT */}

                                        <div className="flex-1 min-w-0">

                                            <div className="flex flex-wrap gap-1.5 mb-1.5">

                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">

                                                    <CheckCircle2
                                                        size={10}
                                                    />

                                                    VERIFIED

                                                </span>


                                                {item?.category && (

                                                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[9px] font-bold">

                                                        {
                                                            item.category
                                                        }

                                                    </span>

                                                )}

                                            </div>


                                            <h3 className="text-base font-bold text-slate-900 truncate">
                                                {item?.item_name ||
                                                    "Unnamed item"}
                                            </h3>


                                            {item?.description && (

                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                                    {
                                                        item.description
                                                    }
                                                </p>

                                            )}


                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-3">

                                                <Detail
                                                    icon={
                                                        UserRound
                                                    }
                                                    label="Finder"
                                                    value={
                                                        item?.finder_name
                                                    }
                                                />


                                                <Detail
                                                    icon={
                                                        Phone
                                                    }
                                                    label="Phone"
                                                    value={
                                                        item?.finder_phone
                                                    }
                                                />


                                                <Detail
                                                    icon={
                                                        MapPin
                                                    }
                                                    label="Location"
                                                    value={
                                                        item?.location
                                                    }
                                                />


                                                <Detail
                                                    icon={
                                                        CalendarDays
                                                    }
                                                    label="Date found"
                                                    value={
                                                        item?.date_found
                                                    }
                                                />

                                            </div>


                                            <div className="flex flex-wrap gap-3 mt-3 pt-2 border-t border-slate-100 text-[10px]">

                                                {item?.verified_by && (

                                                    <span className="text-blue-700 font-semibold">

                                                        ✓ Verified by{" "}

                                                        {
                                                            item.verified_by
                                                        }

                                                    </span>

                                                )}


                                                {item?.verified_at && (

                                                    <span className="text-slate-500">
                                                        {
                                                            item.verified_at
                                                        }
                                                    </span>

                                                )}

                                            </div>

                                        </div>


                                        {/* VIEW BUTTON */}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelected(
                                                    item
                                                )
                                            }
                                            className="self-center shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-[10px] font-semibold hover:bg-slate-800"
                                        >

                                            <Eye
                                                size={13}
                                            />

                                            <span className="hidden sm:inline">
                                                View
                                            </span>

                                        </button>

                                    </div>

                                </article>

                            )
                        )}

                    </div>

                )}


                {/* =================================================
                    FOOTER
                ================================================= */}

                <footer className="mt-8 pt-4 border-t border-slate-200 text-center">

                    <p className="text-xs font-medium text-slate-500">
                        {company.name} · Staff Portal
                    </p>

                    <p className="text-[10px] text-slate-400 mt-1">
                        Lost & Found Management System
                    </p>

                </footer>

            </main>


            {/* =====================================================
                MODAL
            ===================================================== */}

            {selected && (

                <div
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3"
                    onClick={() =>
                        setSelected(null)
                    }
                >

                    <div
                        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >


                        {/* MODAL HEADER */}

                        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center">

                            <div className="min-w-0">

                                <div className="flex items-center gap-1.5 text-emerald-600">

                                    <CheckCircle2
                                        size={15}
                                    />

                                    <span className="text-[10px] font-bold uppercase">
                                        Verified
                                    </span>

                                </div>


                                <h2 className="font-bold text-slate-900 truncate">
                                    {selected?.item_name ||
                                        "Unnamed item"}
                                </h2>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    setSelected(
                                        null
                                    )
                                }
                                aria-label="Close"
                                className="p-2 rounded-lg hover:bg-slate-100"
                            >

                                <X
                                    size={17}
                                />

                            </button>

                        </div>


                        {/* MODAL BODY */}

                        <div className="p-4">


                            {/* IMAGE */}

                            {selected?.image ? (

                                <img
                                    src={imageUrl(
                                        selected.image
                                    )}
                                    alt={
                                        selected?.item_name ||
                                        "Item"
                                    }
                                    className="w-full h-52 item-image zoomable rounded-xl border border-slate-200"
                                    onError={(
                                        event
                                    ) => {

                                        event.currentTarget.style.display =
                                            "none";

                                    }}
                                />

                            ) : (

                                <div className="h-52 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">

                                    <Package
                                        size={40}
                                        className="text-slate-300"
                                    />

                                </div>

                            )}


                            {/* TAGS */}

                            <div className="flex flex-wrap gap-1.5 mt-3">

                                <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                    VERIFIED
                                </span>


                                {selected?.category && (

                                    <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                                        {
                                            selected.category
                                        }
                                    </span>

                                )}


                                {selected?.source && (

                                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                                        {
                                            selected.source
                                        }
                                    </span>

                                )}

                            </div>


                            {/* DESCRIPTION */}

                            {selected?.description && (

                                <div className="mt-4">

                                    <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                                        Description
                                    </p>

                                    <p className="text-xs text-slate-700 mt-1 leading-5">
                                        {
                                            selected.description
                                        }
                                    </p>

                                </div>

                            )}


                            {/* DETAILS */}

                            <div className="grid grid-cols-2 gap-2 mt-4">

                                <Detail
                                    icon={
                                        UserRound
                                    }
                                    label="Finder"
                                    value={
                                        selected?.finder_name
                                    }
                                />


                                <Detail
                                    icon={
                                        Phone
                                    }
                                    label="Phone"
                                    value={
                                        selected?.finder_phone
                                    }
                                />


                                <Detail
                                    icon={
                                        Mail
                                    }
                                    label="Email"
                                    value={
                                        selected?.finder_email
                                    }
                                />


                                <Detail
                                    icon={
                                        MapPin
                                    }
                                    label="Location"
                                    value={
                                        selected?.location
                                    }
                                />


                                <Detail
                                    icon={
                                        CalendarDays
                                    }
                                    label="Date found"
                                    value={
                                        selected?.date_found
                                    }
                                />


                                <Detail
                                    icon={
                                        ShieldCheck
                                    }
                                    label="Status"
                                    value={
                                        selected?.status
                                    }
                                />

                            </div>


                            {/* RECORD INFORMATION */}

                            <div className="mt-5 pt-4 border-t border-slate-200">

                                <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400 mb-2">
                                    Record information
                                </p>


                                <div className="grid grid-cols-2 gap-2">

                                    <Detail
                                        icon={
                                            Package
                                        }
                                        label="Source"
                                        value={
                                            selected?.source
                                        }
                                    />


                                    <Detail
                                        icon={
                                            Package
                                        }
                                        label="Record type"
                                        value={
                                            selected?.page
                                        }
                                    />


                                    <Detail
                                        icon={
                                            UserRound
                                        }
                                        label="Received from"
                                        value={
                                            selected?.received_from
                                        }
                                    />


                                    <Detail
                                        icon={
                                            UserRound
                                        }
                                        label="Staff receiver"
                                        value={
                                            selected?.staff_receiver
                                        }
                                    />


                                    <Detail
                                        icon={
                                            UserRound
                                        }
                                        label="Found by staff"
                                        value={
                                            selected?.found_by_staff
                                        }
                                    />

                                </div>

                            </div>


                            {/* VERIFICATION INFORMATION */}

                            <div className="mt-5 pt-4 border-t border-slate-200 space-y-2 text-xs text-slate-600">

                                {selected?.verified_by && (

                                    <div className="flex items-center gap-2">

                                        <ShieldCheck
                                            size={14}
                                            className="text-blue-600"
                                        />

                                        Verified by{" "}

                                        <b>
                                            {
                                                selected.verified_by
                                            }
                                        </b>

                                    </div>

                                )}


                                {selected?.verified_at && (

                                    <div className="flex items-center gap-2">

                                        <Clock3
                                            size={14}
                                        />

                                        {
                                            selected.verified_at
                                        }

                                    </div>

                                )}


                                {selected?.created_at && (

                                    <div className="flex items-center gap-2">

                                        <CalendarDays
                                            size={14}
                                        />

                                        Created:{" "}

                                        {
                                            selected.created_at
                                        }

                                    </div>

                                )}


                                {selected?.updated_at && (

                                    <div className="flex items-center gap-2">

                                        <Clock3
                                            size={14}
                                        />

                                        Updated:{" "}

                                        {
                                            selected.updated_at
                                        }

                                    </div>

                                )}

                            </div>

                        </div>


                        {/* MODAL FOOTER */}

                        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 flex justify-end">

                            <button
                                type="button"
                                onClick={() =>
                                    setSelected(
                                        null
                                    )
                                }
                                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}


export default VerifiedItems;