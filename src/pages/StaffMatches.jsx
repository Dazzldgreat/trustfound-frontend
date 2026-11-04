import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    ArrowLeft,
    Loader2,
    AlertTriangle,
    CheckCircle,
    MapPin,
    Calendar,
    ShieldCheck,
    Sparkles,
    Building2,
} from "lucide-react";

import { API } from "../config";

function StaffMatches() {
    const navigate = useNavigate();
    const { companySlug } = useParams();

    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ============================================================
    // STORED OBJECT
    // ============================================================

    const getStoredObject = (key) => {
        try {
            return JSON.parse(localStorage.getItem(key) || "{}");
        } catch {
            return {};
        }
    };

    // ============================================================
    // COMPANY
    // ============================================================

    const storedCompany = getStoredObject("company");
    const storedUser = getStoredObject("user");

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

   

    // ============================================================
    // COMPANY ROUTE
    // ============================================================

    const companyRoute = useCallback(
        (path = "") => {
            const cleanPath = path.startsWith("/")
                ? path
                : `/${path}`;

            if (!activeCompanySlug) {
                return cleanPath;
            }

            return `/company/${encodeURIComponent(
                activeCompanySlug
            )}${cleanPath}`;
        },
        [activeCompanySlug]
    );

    // ============================================================
    // ACCESS TOKEN
    // ============================================================

    const getAccessToken = () => {
        return (
            localStorage.getItem("access_token") ||
            localStorage.getItem("access")
        );
    };

    // ============================================================
    // UNAUTHORIZED
    // ============================================================

    const handleUnauthorized = useCallback(() => {
        localStorage.removeItem("access");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");

        navigate(companyRoute("/staff-login"), {
            replace: true,
        });
    }, [navigate, companyRoute]);

    // ============================================================
    // FETCH MATCHES
    // ============================================================

    const fetchMatches = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const access = getAccessToken();

            if (!access) {
                handleUnauthorized();
                return;
            }

            const response = await fetch(
                `${API}/staff/matches/`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${access}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const contentType =
                response.headers.get("content-type");

            if (
                !contentType ||
                !contentType.includes("application/json")
            ) {
                const text = await response.text();

                console.error(
                    "Unexpected server response:",
                    text
                );

                throw new Error(
                    "Server returned an unexpected response."
                );
            }

            const data = await response.json();

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data?.error ||
                        data?.detail ||
                        "Failed to load matches."
                );
            }

            if (Array.isArray(data)) {
                setMatches(data);
            } else if (Array.isArray(data?.results)) {
                setMatches(data.results);
            } else if (Array.isArray(data?.matches)) {
                setMatches(data.matches);
            } else {
                setMatches([]);
            }
        } catch (err) {
            console.error(
                "Failed to fetch matches:",
                err
            );

            setError(
                err.message ||
                    "Something went wrong while loading matches."
            );

            setMatches([]);
        } finally {
            setLoading(false);
        }
    }, [handleUnauthorized]);

    // ============================================================
    // LOAD
    // ============================================================

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    // ============================================================
    // HELPERS
    // ============================================================

    const getScore = (score) => {
        const value = Number(score);

        if (Number.isNaN(value)) {
            return 0;
        }

        return Math.round(value);
    };

    const getConfidenceClass = (score) => {
        const value = getScore(score);

        if (value >= 80) {
            return "bg-emerald-50 text-emerald-700 border border-emerald-200";
        }

        if (value >= 60) {
            return "bg-amber-50 text-amber-700 border border-amber-200";
        }

        return "bg-red-50 text-red-700 border border-red-200";
    };

    const formatDate = (date) => {
        if (!date) {
            return "Not available";
        }

        try {
            return new Date(date).toLocaleString();
        } catch {
            return String(date);
        }
    };

    // ============================================================
    // NAVIGATION
    // ============================================================

    const viewMatch = (matchId) => {
        navigate(
            companyRoute(`/staff/matches/${matchId}`)
        );
    };

    const goToDashboard = () => {
        navigate(
            companyRoute("/staff-dashboard")
        );
    };

    // ============================================================
    // PAGE
    // ============================================================

    return (
        <div className="min-h-screen bg-slate-50">

            {/* =====================================================
                TOP WHITE ORGANIZATION BAR
            ===================================================== */}

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
                                            Staff operations and lost & found management
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

            <main className="px-5 md:px-10 py-7">

                <div className="max-w-7xl mx-auto">

                    {/* =================================================
                        PAGE TITLE
                    ================================================= */}

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

                        <div>

                            <div className="flex items-center gap-2">

                                <Sparkles
                                    size={21}
                                    className="text-emerald-600"
                                />

                                <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                                    AI Match Results
                                </h2>

                            </div>

                            <p className="text-sm text-slate-500 mt-1">
                                Review potential matches between lost and found items.
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={goToDashboard}
                            className="w-fit bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg transition font-bold flex items-center gap-2 text-sm"
                        >
                            <ArrowLeft size={17} />
                            Back to Dashboard
                        </button>

                    </div>


                    {/* =================================================
                        COMPANY ERROR
                    ================================================= */}

                    {!activeCompanySlug && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-5">

                            <div className="flex gap-3">

                                <AlertTriangle
                                    size={20}
                                    className="shrink-0"
                                />

                                <div>

                                    <h2 className="font-bold">
                                        Company not found
                                    </h2>

                                    <p className="text-sm mt-1">
                                        We could not determine which company this staff account belongs to.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate("/staff-login")
                                        }
                                        className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-semibold"
                                    >
                                        Go to Staff Login
                                    </button>

                                </div>

                            </div>

                        </div>
                    )}


                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-5">

                            <div className="flex gap-3">

                                <AlertTriangle
                                    size={20}
                                    className="shrink-0"
                                />

                                <div>

                                    <h2 className="font-bold text-sm">
                                        Unable to load matches
                                    </h2>

                                    <p className="text-sm mt-1">
                                        {error}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={fetchMatches}
                                        className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-semibold"
                                    >
                                        Try Again
                                    </button>

                                </div>

                            </div>

                        </div>
                    )}


                    {/* =================================================
                        STATS
                    ================================================= */}

                    {!loading &&
                        matches.length > 0 && (

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

                                <div className="bg-white border border-slate-200 rounded-xl p-4">

                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Total Matches
                                    </p>

                                    <p className="text-2xl font-black text-slate-900 mt-1">
                                        {matches.length}
                                    </p>

                                </div>


                                <div className="bg-white border border-slate-200 rounded-xl p-4">

                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        High Confidence
                                    </p>

                                    <p className="text-2xl font-black text-emerald-600 mt-1">
                                        {
                                            matches.filter(
                                                (match) =>
                                                    getScore(
                                                        match.confidence_score
                                                    ) >= 80
                                            ).length
                                        }
                                    </p>

                                </div>


                                <div className="bg-white border border-slate-200 rounded-xl p-4">

                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Average Confidence
                                    </p>

                                    <p className="text-2xl font-black text-emerald-600 mt-1">
                                        {Math.round(
                                            matches.reduce(
                                                (total, match) =>
                                                    total +
                                                    getScore(
                                                        match.confidence_score
                                                    ),
                                                0
                                            ) / matches.length
                                        )}
                                        %
                                    </p>

                                </div>

                            </div>
                        )}


                    {/* =================================================
                        LOADING
                    ================================================= */}

                    {loading ? (

                        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">

                            <Loader2
                                size={36}
                                className="animate-spin mx-auto text-emerald-600"
                            />

                            <p className="text-slate-500 mt-3 text-sm font-semibold">
                                Loading matches...
                            </p>

                        </div>

                    ) : matches.length === 0 ? (

                        /* =================================================
                           EMPTY
                        ================================================= */

                        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">

                            <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto">

                                <ShieldCheck
                                    size={28}
                                    className="text-emerald-600"
                                />

                            </div>

                            <h2 className="text-xl font-bold text-slate-800 mt-4">
                                No Matches Found
                            </h2>

                            <p className="text-sm text-slate-500 mt-2">
                                No lost items currently match any found items.
                            </p>

                        </div>

                    ) : (

                        /* =================================================
                           MATCHES
                        ================================================= */

                        <div className="grid gap-4">

                            {matches.map((match) => {

                                const confidence =
                                    getScore(
                                        match.confidence_score
                                    );

                                return (

                                    <div
                                        key={match.id}
                                        className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-sm transition"
                                    >

                                        {/* =================================
                                            MATCH HEADER
                                        ================================= */}

                                        <div className="px-5 py-4 border-b border-slate-100">

                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                                                <div className="flex items-center gap-3">

                                                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">

                                                        <ShieldCheck
                                                            size={20}
                                                            className="text-emerald-600"
                                                        />

                                                    </div>

                                                    <div>

                                                        <h2 className="text-base font-bold text-slate-800">
                                                            Match #{match.id}
                                                        </h2>

                                                        {match.status && (
                                                            <p className="text-xs text-slate-500 mt-0.5">
                                                                Status:{" "}
                                                                <span className="font-semibold text-slate-700">
                                                                    {match.status}
                                                                </span>
                                                            </p>
                                                        )}

                                                    </div>

                                                </div>


                                                <span
                                                    className={`inline-flex w-fit px-3 py-1.5 rounded-full text-xs font-bold ${getConfidenceClass(
                                                        confidence
                                                    )}`}
                                                >
                                                    {confidence}% Match
                                                </span>

                                            </div>


                                            {/* CONFIDENCE */}

                                            <div className="mt-3">

                                                <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">

                                                    <span>
                                                        Match confidence
                                                    </span>

                                                    <span>
                                                        {confidence}%
                                                    </span>

                                                </div>

                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">

                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full"
                                                        style={{
                                                            width: `${confidence}%`,
                                                        }}
                                                    />

                                                </div>

                                            </div>

                                        </div>


                                        {/* =================================
                                            LOST / FOUND
                                        ================================= */}

                                        <div className="grid md:grid-cols-2 gap-4 p-4 md:p-5">

                                            {/* LOST */}

                                            <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/40">

                                                <div className="flex items-center gap-2 mb-3">

                                                    <AlertTriangle
                                                        size={17}
                                                        className="text-amber-600"
                                                    />

                                                    <h3 className="font-bold text-amber-700">
                                                        Lost Item
                                                    </h3>

                                                </div>

                                                <div className="space-y-2 text-sm text-slate-700">

                                                    <p>
                                                        <strong>Name:</strong>{" "}
                                                        {match.lost_item_name ||
                                                            match.lost_item?.item_name ||
                                                            "N/A"}
                                                    </p>

                                                    <p>
                                                        <strong>Category:</strong>{" "}
                                                        {match.lost_category ||
                                                            match.lost_item?.category ||
                                                            "N/A"}
                                                    </p>

                                                    <p className="flex gap-2">

                                                        <MapPin
                                                            size={16}
                                                            className="text-slate-400 shrink-0 mt-0.5"
                                                        />

                                                        <span>
                                                            {match.lost_location ||
                                                                match.lost_item?.location ||
                                                                "N/A"}
                                                        </span>

                                                    </p>

                                                    {match.lost_item?.date_lost && (
                                                        <p className="flex gap-2">

                                                            <Calendar
                                                                size={16}
                                                                className="text-slate-400 shrink-0 mt-0.5"
                                                            />

                                                            <span>
                                                                {formatDate(
                                                                    match.lost_item.date_lost
                                                                )}
                                                            </span>

                                                        </p>
                                                    )}

                                                </div>

                                            </div>


                                            {/* FOUND */}

                                            <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50/40">

                                                <div className="flex items-center gap-2 mb-3">

                                                    <CheckCircle
                                                        size={17}
                                                        className="text-emerald-600"
                                                    />

                                                    <h3 className="font-bold text-emerald-700">
                                                        Found Item
                                                    </h3>

                                                </div>

                                                <div className="space-y-2 text-sm text-slate-700">

                                                    <p>
                                                        <strong>Name:</strong>{" "}
                                                        {match.found_item_name ||
                                                            match.found_item?.item_name ||
                                                            "N/A"}
                                                    </p>

                                                    <p>
                                                        <strong>Category:</strong>{" "}
                                                        {match.found_category ||
                                                            match.found_item?.category ||
                                                            "N/A"}
                                                    </p>

                                                    <p className="flex gap-2">

                                                        <MapPin
                                                            size={16}
                                                            className="text-slate-400 shrink-0 mt-0.5"
                                                        />

                                                        <span>
                                                            {match.found_location ||
                                                                match.found_item?.location_found ||
                                                                match.found_item?.location ||
                                                                "N/A"}
                                                        </span>

                                                    </p>

                                                    {match.found_item?.date_found && (
                                                        <p className="flex gap-2">

                                                            <Calendar
                                                                size={16}
                                                                className="text-slate-400 shrink-0 mt-0.5"
                                                            />

                                                            <span>
                                                                {formatDate(
                                                                    match.found_item.date_found
                                                                )}
                                                            </span>

                                                        </p>
                                                    )}

                                                </div>

                                            </div>

                                        </div>


                                        {/* =================================
                                            SCORE BREAKDOWN
                                        ================================= */}

                                        <div className="px-4 md:px-5 pb-4">

                                            <div className="border-t border-slate-100 pt-4">

                                                <div className="flex items-center gap-2 mb-3">

                                                    <Sparkles
                                                        size={17}
                                                        className="text-emerald-600"
                                                    />

                                                    <h3 className="text-sm font-bold text-slate-800">
                                                        Match Breakdown
                                                    </h3>

                                                </div>


                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                                                    {/* NAME */}

                                                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">

                                                        <div className="text-xs text-slate-500">
                                                            Name
                                                        </div>

                                                        <div className="text-xl font-black text-emerald-600 mt-1">
                                                            {getScore(
                                                                match.name_score
                                                            )}
                                                            %
                                                        </div>

                                                        <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">

                                                            <div
                                                                className="h-full bg-emerald-500 rounded-full"
                                                                style={{
                                                                    width: `${getScore(
                                                                        match.name_score
                                                                    )}%`,
                                                                }}
                                                            />

                                                        </div>

                                                    </div>


                                                    {/* DESCRIPTION */}

                                                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">

                                                        <div className="text-xs text-slate-500">
                                                            Description
                                                        </div>

                                                        <div className="text-xl font-black text-emerald-600 mt-1">
                                                            {getScore(
                                                                match.description_score
                                                            )}
                                                            %
                                                        </div>

                                                        <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">

                                                            <div
                                                                className="h-full bg-emerald-500 rounded-full"
                                                                style={{
                                                                    width: `${getScore(
                                                                        match.description_score
                                                                    )}%`,
                                                                }}
                                                            />

                                                        </div>

                                                    </div>


                                                    {/* LOCATION */}

                                                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">

                                                        <div className="text-xs text-slate-500">
                                                            Location
                                                        </div>

                                                        <div className="text-xl font-black text-emerald-600 mt-1">
                                                            {getScore(
                                                                match.location_score
                                                            )}
                                                            %
                                                        </div>

                                                        <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">

                                                            <div
                                                                className="h-full bg-emerald-500 rounded-full"
                                                                style={{
                                                                    width: `${getScore(
                                                                        match.location_score
                                                                    )}%`,
                                                                }}
                                                            />

                                                        </div>

                                                    </div>


                                                    {/* IMAGE */}

                                                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">

                                                        <div className="text-xs text-slate-500">
                                                            Image
                                                        </div>

                                                        <div className="text-xl font-black text-emerald-600 mt-1">
                                                            {getScore(
                                                                match.image_score
                                                            )}
                                                            %
                                                        </div>

                                                        <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">

                                                            <div
                                                                className="h-full bg-emerald-500 rounded-full"
                                                                style={{
                                                                    width: `${getScore(
                                                                        match.image_score
                                                                    )}%`,
                                                                }}
                                                            />

                                                        </div>

                                                    </div>

                                                </div>

                                            </div>

                                        </div>


                                        {/* =================================
                                            APPROVAL
                                        ================================= */}

                                        <div className="px-4 md:px-5 pb-4">

                                            <div className="border-t border-slate-100 pt-3">

                                                <div className="grid md:grid-cols-2 gap-2">

                                                    <p className="text-xs text-slate-500">

                                                        <strong className="text-slate-700">
                                                            Approved By:
                                                        </strong>{" "}

                                                        {match.approved_by ||
                                                            "Not approved"}

                                                    </p>

                                                    <p className="text-xs text-slate-500">

                                                        <strong className="text-slate-700">
                                                            Approved On:
                                                        </strong>{" "}

                                                        {formatDate(
                                                            match.approved_at
                                                        )}

                                                    </p>

                                                </div>

                                            </div>

                                        </div>


                                        {/* =================================
                                            ACTION
                                        ================================= */}

                                        <div className="px-4 md:px-5 py-3 bg-slate-50 border-t border-slate-100">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    viewMatch(
                                                        match.id
                                                    )
                                                }
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition font-bold flex items-center gap-2 text-sm"
                                            >

                                                <ShieldCheck
                                                    size={17}
                                                />

                                                View Match Details

                                            </button>

                                        </div>

                                    </div>
                                );
                            })}

                        </div>
                    )}

                </div>

            </main>

        </div>
    );
}

export default StaffMatches;