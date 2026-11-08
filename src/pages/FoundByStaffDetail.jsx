import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    MapPin,
    Calendar,
    Clock,
    User,
    ShieldCheck,
    CheckCircle,
    Package,
    AlertCircle,
    Loader2,
} from "lucide-react";

import { API } from "../config";
// =========================================================
// GET STORED OBJECT
// =========================================================

function getStoredObject(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

// =========================================================
// GET WEBSITE SETTINGS
// =========================================================

function getWebsiteSettings(company) {
    const candidates = [
        company?.website_settings,
        company?.websiteSettings,
        company?.settings,
        getStoredObject("website_settings"),
        getStoredObject("websiteSettings"),
    ];

    return candidates.find(
        (value) => value && typeof value === "object"
    ) || {};
}

// =========================================================
// COMPONENT
// =========================================================

function FoundByStaffDetail() {
    const { id, companySlug } = useParams();
    const navigate = useNavigate();

    // =========================================================
    // COMPANY
    // =========================================================

    const storedCompany = getStoredObject("company");
    const storedUser = getStoredObject("user");

    const activeCompanySlug =
        companySlug ||
        localStorage.getItem("companySlug") ||
        localStorage.getItem("company_slug") ||
        storedCompany?.slug ||
        storedUser?.company_slug ||
        storedUser?.companySlug ||
        storedUser?.organization_slug ||
        storedUser?.organizationSlug ||
        "";

    const websiteSettings = getWebsiteSettings(storedCompany);

    // border_line_color = actual border line
    // border_color = inside/fill color of bordered elements
    const borderLineColor =
        websiteSettings.border_line_color ||
        websiteSettings.borderLineColor ||
        "";

    const borderColor =
        websiteSettings.border_color ||
        websiteSettings.borderColor ||
        "";

    const borderLineStyle = borderLineColor
        ? { borderColor: borderLineColor }
        : {};

    const borderFillStyle = {
        ...(borderColor ? { backgroundColor: borderColor } : {}),
        ...borderLineStyle,
    };

    // =========================================================
    // TOKEN
    // =========================================================

    const access =
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

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // =========================================================
    // AUTH CHECK
    // =========================================================

    useEffect(() => {
        if (!access) {
            navigate(
                companyRoute("/login-page"),
                { replace: true }
            );
        }
    }, [access, navigate, companyRoute]);

    // =========================================================
    // FETCH ITEM
    // =========================================================

    useEffect(() => {
        const fetchItem = async () => {
            if (!access || !id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API}/staff/found-by-staff/${id}/`,
                    {
                        headers: {
                            Authorization: `Bearer ${access}`,
                        },
                    }
                );

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    localStorage.removeItem("access");
                    localStorage.removeItem("access_token");

                    navigate(
                        companyRoute("/login-page"),
                        { replace: true }
                    );

                    return;
                }

                const data = await response.json();

                console.log(
                    "FOUND BY STAFF DETAIL STATUS:",
                    response.status
                );

                console.log(
                    "FOUND BY STAFF DETAIL RESPONSE:",
                    data
                );

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                        data.detail ||
                        data.message ||
                        "Unable to load found item."
                    );
                }

                setItem(data);
            } catch (err) {
                console.error(
                    "FOUND BY STAFF DETAIL ERROR:",
                    err
                );

                setError(
                    err.message ||
                    "Unable to load found item."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [id, access, navigate, companyRoute]);

    // =========================================================
    // STATUS COLORS
    // =========================================================

    const badgeColor = {
        Pending:
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300",

        Verified:
            "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",

        Approved:
            "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",

        Accepted:
            "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",

        Recovered:
            "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",

        Rejected:
            "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    };

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2
                        size={40}
                        className="animate-spin text-blue-600"
                    />

                    <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">
                        Loading found item...
                    </h2>
                </div>
            </div>
        );
    }

    // =========================================================
    // ERROR / NOT FOUND
    // =========================================================

    if (!item) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex items-center justify-center px-4">
                <div
                    className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-800 p-8 text-center"
                    style={borderFillStyle}
                >
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mb-5">
                        <AlertCircle
                            size={32}
                            className="text-red-600"
                        />
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                        Item Not Found
                    </h2>

                    <p className="text-gray-500 dark:text-gray-400 mt-3">
                        {error || "The found item could not be found."}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                companyRoute("/staff-dashboard")
                            )
                        }
                        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition"
                    >
                        Back to Staff Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================
    // BACK
    // =========================================================

    const handleBack = () => {
        navigate(companyRoute("/staff-dashboard"));
    };

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-950 py-8 px-4 md:px-6">
            <div className="max-w-6xl mx-auto">

                {/* BACK */}

                <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold mb-7 hover:underline"
                >
                    <ArrowLeft size={20} />
                    Back to Staff Dashboard
                </button>

                {/* HEADER */}

                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                            <Package
                                size={30}
                                className="text-green-600"
                            />
                        </div>

                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                                Found Item Details
                            </h1>

                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                View information about this staff-recorded found item.
                            </p>
                        </div>
                    </div>
                </div>

                {/* MAIN CARD */}

                <div
                    className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden"
                    style={borderFillStyle}
                >
                    <div className="grid lg:grid-cols-2">

                        {/* LEFT - IMAGE */}

                        <div className="bg-gray-100 dark:bg-slate-950/50 flex items-center justify-center p-6 md:p-8 min-h-[450px]">
                            {item.image ? (
                                <img
                                    src={item.image}
                                    alt={item.item_name || "Found item"}
                                    className="rounded-2xl shadow-lg w-full max-h-[550px] item-image zoomable"
                                />
                            ) : (
                                <div className="h-96 w-full rounded-2xl bg-gray-200 dark:bg-slate-800 flex flex-col items-center justify-center">
                                    <Package
                                        size={55}
                                        className="text-gray-400 mb-4"
                                    />

                                    <span className="text-gray-500 dark:text-gray-400 font-semibold">
                                        No Image Available
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* RIGHT - DETAILS */}

                        <div className="p-6 md:p-10">

                            {/* TITLE */}

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                                        {item.item_name}
                                    </h1>

                                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                                        {item.category || "Uncategorized"}
                                    </p>
                                </div>

                                <span
                                    className={`self-start px-4 py-2 rounded-full font-bold text-sm ${
                                        badgeColor[item.status] ||
                                        "bg-gray-200 text-gray-700 dark:bg-slate-800 dark:text-gray-300"
                                    }`}
                                >
                                    {item.status || "Unknown"}
                                </span>
                            </div>

                            {/* DETAILS */}

                            <div className="mt-8 space-y-6">

                                {/* DESCRIPTION */}

                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                                        Description
                                    </h3>

                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {item.description ||
                                            "No description provided."}
                                    </p>
                                </div>

                                {/* LOCATION */}

                                <div className="flex items-start gap-3">
                                    <MapPin
                                        className="text-blue-600 shrink-0 mt-0.5"
                                        size={20}
                                    />

                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Location Found
                                        </p>

                                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                                            {item.location_found || "N/A"}
                                        </p>
                                    </div>
                                </div>

                                {/* DATE */}

                                <div className="flex items-start gap-3">
                                    <Calendar
                                        className="text-green-600 shrink-0 mt-0.5"
                                        size={20}
                                    />

                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Date Found
                                        </p>

                                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                                            {item.date_found || "N/A"}
                                        </p>
                                    </div>
                                </div>

                                {/* TIME */}

                                {item.time_found && (
                                    <div className="flex items-start gap-3">
                                        <Clock
                                            className="text-purple-600 shrink-0 mt-0.5"
                                            size={20}
                                        />

                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Time Found
                                            </p>

                                            <p className="font-semibold text-gray-800 dark:text-gray-200">
                                                {item.time_found}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* REPORTED BY */}

                                <div className="flex items-start gap-3">
                                    <User
                                        className="text-yellow-600 shrink-0 mt-0.5"
                                        size={20}
                                    />

                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Reported By
                                        </p>

                                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                                            {item.reported_by || "N/A"}
                                        </p>
                                    </div>
                                </div>

                                {/* RECEIVED FROM */}

                                {item.received_from && (
                                    <div
                                        className="border-t border-gray-200 dark:border-slate-800 pt-5"
                                        style={borderLineStyle}
                                    >
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Received From
                                        </p>

                                        <p className="font-semibold text-gray-800 dark:text-gray-200 mt-1">
                                            {item.received_from}
                                        </p>
                                    </div>
                                )}

                                {/* FINDER */}

                                {item.finder_name && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Finder
                                        </p>

                                        <p className="font-semibold text-gray-800 dark:text-gray-200 mt-1">
                                            {item.finder_name}
                                        </p>
                                    </div>
                                )}

                                {/* FINDER PHONE */}

                                {item.finder_phone && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Finder Phone
                                        </p>

                                        <p className="font-semibold text-gray-800 dark:text-gray-200 mt-1">
                                            {item.finder_phone}
                                        </p>
                                    </div>
                                )}

                                {/* FINDER EMAIL */}

                                {item.finder_email && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Finder Email
                                        </p>

                                        <p className="font-semibold text-gray-800 dark:text-gray-200 mt-1 break-all">
                                            {item.finder_email}
                                        </p>
                                    </div>
                                )}

                                {/* VERIFIED BY */}

                                {item.verified_by && (
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck
                                            className="text-blue-600 shrink-0 mt-0.5"
                                            size={20}
                                        />

                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Verified By
                                            </p>

                                            <p className="font-semibold text-gray-800 dark:text-gray-200">
                                                {item.verified_by}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* RECOVERED BY */}

                                {item.recovered_by && (
                                    <div className="flex items-start gap-3">
                                        <CheckCircle
                                            className="text-green-600 shrink-0 mt-0.5"
                                            size={20}
                                        />

                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Recovered By
                                            </p>

                                            <p className="font-semibold text-gray-800 dark:text-gray-200">
                                                {item.recovered_by}
                                            </p>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FoundByStaffDetail;
