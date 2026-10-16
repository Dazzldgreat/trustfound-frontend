import React, {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    Clock,
    Package,
    User,
    MapPin,
    ChevronRight,
    RefreshCw,
    ClipboardList,
    AlertCircle,
    ShieldCheck,
    Building2,
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
// GET STORED OBJECT
// =============================================================

function getStoredObject(key) {
    try {
        const value = localStorage.getItem(key);

        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

// =============================================================
// GET FIRST VALID VALUE
// =============================================================

function firstValidValue(...values) {
    for (const value of values) {
        if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
        ) {
            return value;
        }
    }

    return "";
}

// =============================================================
// IMAGE URL
// =============================================================

function getImageUrl(image) {
    if (!image) {
        return "";
    }

    const value = String(image).trim();

    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:") ||
        value.startsWith("blob:")
    ) {
        return value;
    }

    const backendBase = API.replace(/\/api\/?$/, "");

    return `${backendBase}${value.startsWith("/") ? value : `/${value}`}`;
}

// =============================================================
// CLAIM REQUESTS PAGE
// =============================================================

function ClaimRequests() {
    const navigate = useNavigate();
    const { companySlug } = useParams();

    // =========================================================
    // COMPANY DATA
    // =========================================================

    const storedCompany = getStoredObject("company");
    const storedUser = getStoredObject("user");

    // =========================================================
    // COMPANY SLUG
    // =========================================================

    const activeCompanySlug = firstValidValue(
        companySlug,
        localStorage.getItem("companySlug"),
        localStorage.getItem("company_slug"),
        storedCompany?.slug,
        storedCompany?.company_slug,
        storedUser?.company_slug,
        storedUser?.companySlug,
        storedUser?.organization_slug,
        storedUser?.organizationSlug
    );

    // =========================================================
    // COMPANY NAME
    // =========================================================

    const companyNameFromStorage = firstValidValue(
        storedCompany?.name,
        storedCompany?.company_name,
        storedCompany?.school_name,
        storedCompany?.organization_name,
        storedCompany?.organization,
        storedCompany?.title,

        storedUser?.company_name,
        storedUser?.companyName,
        storedUser?.school_name,
        storedUser?.schoolName,
        storedUser?.organization_name,
        storedUser?.organizationName,

        localStorage.getItem("companyName"),
        localStorage.getItem("company_name"),
        localStorage.getItem("school_name"),
        localStorage.getItem("organization_name")
    );

    // =========================================================
    // FORMAT SLUG AS NAME
    // =========================================================

    const formatCompanySlug = (slug) => {
        if (!slug) {
            return "Organization";
        }

        return String(slug)
            .replace(/[-_]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .split(" ")
            .filter(Boolean)
            .map(
                (word) =>
                    word.charAt(0).toUpperCase() +
                    word.slice(1)
            )
            .join(" ");
    };

    const companyName =
        companyNameFromStorage ||
        formatCompanySlug(activeCompanySlug);

    // =========================================================
    // COMPANY LOGO
    // =========================================================

    const companyLogo = firstValidValue(
        storedCompany?.logo,
        storedCompany?.logo_url,
        storedCompany?.logoUrl,
        storedCompany?.image,
        storedCompany?.image_url,
        storedCompany?.imageUrl,
        storedCompany?.school_logo,
        storedCompany?.school_logo_url,
        storedCompany?.schoolLogo,
        storedCompany?.organization_logo,
        storedCompany?.organization_logo_url,
        storedCompany?.organizationLogo,

        storedUser?.company_logo,
        storedUser?.company_logo_url,
        storedUser?.companyLogo,
        storedUser?.organization_logo,
        storedUser?.organization_logo_url,
        storedUser?.organizationLogo,

        localStorage.getItem("companyLogo"),
        localStorage.getItem("company_logo"),
        localStorage.getItem("company_logo_url")
    );

    const companyLogoUrl = getImageUrl(companyLogo);

    // =========================================================
    // TOKEN
    // =========================================================

    const getToken = () =>
        localStorage.getItem("access_token") ||
        localStorage.getItem("access");

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
    // STATE
    // =========================================================

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    // =========================================================
    // LOGOUT
    // =========================================================

    const logout = useCallback(() => {
        [
            "access",
            "access_token",
            "refresh",
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
    }, [navigate, companyRoute]);

    // =========================================================
    // FETCH CLAIM REQUESTS
    // =========================================================

    const fetchClaimRequests = useCallback(async () => {
        const token = getToken();

        if (!token) {
            logout();
            return;
        }

        try {
            setRefreshing(true);
            setError("");

            const response = await fetch(
                `${API}/staff/claim-requests/`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            const contentType =
                response.headers.get("content-type") || "";

            let result = {};

            if (contentType.includes("application/json")) {
                result = await response.json();
            } else {
                const responseText = await response.text();

                console.error(
                    "REST API returned non-JSON:",
                    responseText
                );

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
                    result?.error ||
                    result?.detail ||
                    result?.message ||
                    "Failed to load claim requests."
                );
            }

            console.log("CLAIM REQUESTS:", result);

            // =================================================
            // RESPONSE FORMATS
            // =================================================

            let claimRequests = [];

            if (Array.isArray(result)) {
                claimRequests = result;
            } else if (
                Array.isArray(result?.claim_requests)
            ) {
                claimRequests = result.claim_requests;
            } else if (Array.isArray(result?.claims)) {
                claimRequests = result.claims;
            } else if (Array.isArray(result?.requests)) {
                claimRequests = result.requests;
            } else if (Array.isArray(result?.data)) {
                claimRequests = result.data;
            } else if (
                Array.isArray(result?.results)
            ) {
                claimRequests = result.results;
            }

            setRequests(claimRequests);
        } catch (err) {
            console.error("CLAIM REQUEST ERROR:", err);

            setError(
                err?.message ||
                "Unable to load claim requests."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [logout]);

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        if (!getToken()) {
            logout();
            return;
        }

        fetchClaimRequests();
    }, [fetchClaimRequests, logout]);

    // =========================================================
    // OPEN CLAIM
    // =========================================================

    const openClaim = (id) => {
        if (id === null || id === undefined) {
            return;
        }

        navigate(
            companyRoute(`/staff/claim-requests/${id}`)
        );
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white border border-slate-200 rounded-xl p-7 text-center shadow-sm">
                    <RefreshCw
                        size={34}
                        className="mx-auto text-emerald-500 animate-spin"
                    />

                    <p className="mt-4 text-sm font-semibold text-slate-600">
                        Loading claim requests...
                    </p>
                </div>
            </div>
        );
    }

    // =============================================================
    // PAGE
    // =============================================================

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ORGANIZATION BAR */}

            <div className="bg-slate-900">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="h-14 flex items-center justify-between">
                        {/* COMPANY */}

                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden">
                                {companyLogoUrl ? (
                                    <img
                                        src={companyLogoUrl}
                                        alt={`${companyName} logo`}
                                        className="w-full h-full object-cover"
                                        onError={(event) => {
                                            event.currentTarget.style.display =
                                                "none";
                                        }}
                                    />
                                ) : (
                                    <Building2
                                        size={18}
                                        className="text-green-500"
                                    />
                                )}
                            </div>

                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500 leading-none">
                                    Active Organization
                                </span>

                                <span className="text-sm font-bold text-slate-300 mt-1">
                                    {companyName}
                                </span>
                            </div>
                        </div>

                        {/* ORGANIZATION ID */}

                        <div className="hidden sm:flex items-center gap-3">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                                Organization ID
                            </span>

                            <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-green-400 font-mono text-xs font-bold">
                                {activeCompanySlug || "N/A"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* STAFF TABS */}

            <div className="bg-white border-b border-slate-200">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="flex items-center gap-1 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    companyRoute(
                                        "/staff/pending-verification"
                                    )
                                )
                            }
                            className="px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 border-b-2 border-transparent hover:border-emerald-500 whitespace-nowrap transition"
                        >
                            Pending Verification
                        </button>

                        <button
                            type="button"
                            className="px-3 py-2.5 text-xs font-bold text-emerald-600 border-b-2 border-emerald-500 whitespace-nowrap"
                            aria-current="page"
                        >
                            Claim Requests
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN */}

            <main className="max-w-[1400px] mx-auto px-6 py-7">
                {/* PAGE HEADER */}

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-7">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 mb-2">
                            Recovery Management
                        </p>

                        <h2 className="text-3xl font-bold text-slate-900">
                            Claim Requests
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            Review customers requesting recovery of found items.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchClaimRequests}
                        disabled={refreshing}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition"
                    >
                        <RefreshCw
                            size={16}
                            className={
                                refreshing ? "animate-spin" : ""
                            }
                        />

                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {/* ERROR */}

                {error && (
                    <div
                        role="alert"
                        className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        <AlertCircle
                            size={19}
                            className="shrink-0 mt-0.5"
                        />

                        <span>{error}</span>
                    </div>
                )}

                {/* SUMMARY */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
                    <SummaryCard
                        title="Pending Claims"
                        value={requests.length}
                        icon={ClipboardList}
                    />

                    <SummaryCard
                        title="Awaiting Review"
                        value={requests.length}
                        icon={Clock}
                    />

                    <SummaryCard
                        title="Staff Action"
                        value="Required"
                        icon={ShieldCheck}
                    />
                </div>

                {/* SECTION HEADER */}

                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">
                            Customer Claim Requests
                        </h3>

                        <p className="text-xs text-slate-500 mt-0.5">
                            Claims requiring staff review and verification.
                        </p>
                    </div>

                    <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                        {requests.length} pending
                    </span>
                </div>

                {/* EMPTY */}

                {requests.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
                        <div className="w-14 h-14 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center">
                            <ClipboardList
                                size={28}
                                className="text-emerald-500"
                            />
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mt-4">
                            No Claim Requests
                        </h3>

                        <p className="text-sm text-slate-500 mt-1">
                            There are currently no customers waiting for item recovery.
                        </p>

                        {error && (
                            <button
                                type="button"
                                onClick={fetchClaimRequests}
                                disabled={refreshing}
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                                <RefreshCw
                                    size={15}
                                    className={
                                        refreshing ? "animate-spin" : ""
                                    }
                                />
                                Try again
                            </button>
                        )}
                    </div>
                )}

                {/* CLAIM LIST */}

                {requests.length > 0 && (
                    <div className="space-y-3">
                        {requests.map((request) => {
                            const lostItem =
                                request?.lost_item || {};

                            const foundItem =
                                request?.found_item || {};

                            const itemName =
                                request?.lost_item_name ||
                                lostItem?.item_name ||
                                request?.found_item_name ||
                                foundItem?.item_name ||
                                "Unknown Item";

                            const customerName =
                                request?.customer_name ||
                                lostItem?.contact_name ||
                                request?.customer ||
                                "Customer";

                            const location =
                                request?.lost_item_location ||
                                lostItem?.location ||
                                request?.found_item_location ||
                                foundItem?.location_found ||
                                null;

                            const image =
                                request?.lost_item_image ||
                                lostItem?.image ||
                                request?.found_item_image ||
                                foundItem?.image ||
                                null;

                            const imageUrl = getImageUrl(image);

                            return (
                                <button
                                    key={request?.id}
                                    type="button"
                                    onClick={() =>
                                        openClaim(request?.id)
                                    }
                                    className="w-full text-left bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition overflow-hidden"
                                >
                                    <div className="p-4 md:p-5">
                                        <div className="flex flex-col md:flex-row md:items-center gap-5">
                                            {/* IMAGE */}

                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={itemName}
                                                    className="w-full md:w-28 h-28 object-cover rounded-xl border border-slate-200 shrink-0"
                                                    onError={(event) => {
                                                        event.currentTarget.style.display =
                                                            "none";
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full md:w-28 h-28 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                                                    <Package
                                                        size={38}
                                                        className="text-slate-300"
                                                    />
                                                </div>
                                            )}

                                            {/* MAIN */}

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h4 className="text-lg font-bold text-slate-900">
                                                        {itemName}
                                                    </h4>

                                                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">
                                                        Recovery Requested
                                                    </span>
                                                </div>

                                                <p className="text-xs text-slate-400 mt-1">
                                                    Claim #{request?.id}
                                                </p>

                                                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-xs text-slate-500">
                                                    {/* CUSTOMER */}

                                                    <span className="flex items-center gap-1.5">
                                                        <User
                                                            size={14}
                                                            className="text-emerald-500"
                                                        />

                                                        {customerName}
                                                    </span>

                                                    {/* LOCATION */}

                                                    {location && (
                                                        <span className="flex items-center gap-1.5">
                                                            <MapPin
                                                                size={14}
                                                                className="text-emerald-500"
                                                            />

                                                            {location}
                                                        </span>
                                                    )}

                                                    {/* TIME */}

                                                    {request?.recovery_requested_at && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock
                                                                size={14}
                                                                className="text-emerald-500"
                                                            />

                                                            {new Date(
                                                                request.recovery_requested_at
                                                            ).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* RIGHT */}

                                            <div className="flex items-center justify-between md:justify-end gap-4 md:min-w-[180px]">
                                                <div className="text-right hidden lg:block">
                                                    <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">
                                                        Customer Response
                                                    </p>

                                                    <p className="text-xs font-bold text-emerald-600 mt-1">
                                                        {request?.customer_response ||
                                                            "Accepted"}
                                                    </p>
                                                </div>

                                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                                                    <ChevronRight
                                                        size={20}
                                                        className="text-emerald-600"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
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

                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    {React.createElement(icon, {
                        size: 19,
                        className: "text-emerald-600",
                    })}
                </div>
            </div>
        </div>
    );
}

export default ClaimRequests;