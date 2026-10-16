import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Package,
    MapPin,
    Calendar,
    Clock,
    User,
    Phone,
    Mail,
    ShieldCheck,
    CheckCircle,
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

    return (
        candidates.find(
            (value) => value && typeof value === "object"
        ) || {}
    );
}

// =========================================================
// COMPONENT
// =========================================================

function FoundItemDetails() {
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

    // border_line_color controls the actual border line.
    // border_color controls the fill/inside of bordered elements.

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
        ...(borderColor
            ? { backgroundColor: borderColor }
            : {}),
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
    // FETCH FOUND ITEM
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
                    `${API}/found-items/${id}/`,
                    {
                        headers: {
                            Authorization: `Bearer ${access}`,
                        },
                    }
                );

                // AUTH ERROR

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
                    "FOUND ITEM DETAIL STATUS:",
                    response.status
                );

                console.log(
                    "FOUND ITEM DETAIL RESPONSE:",
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
                    "FOUND ITEM DETAIL ERROR:",
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
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex items-center justify-center px-4">
                <div className="text-center">
                    <Loader2
                        size={48}
                        className="mx-auto text-blue-600 animate-spin"
                    />

                    <h2 className="mt-5 text-xl font-black text-gray-800 dark:text-white">
                        Loading found item...
                    </h2>

                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Please wait while we retrieve the item.
                    </p>
                </div>
            </div>
        );
    }

    // =========================================================
    // ERROR
    // =========================================================

    if (!item || error) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex items-center justify-center px-6">
                <div
                    className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-200 dark:border-slate-800 p-10 max-w-md w-full text-center"
                    style={borderFillStyle}
                >
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                        <AlertCircle
                            size={34}
                            className="text-red-600"
                        />
                    </div>

                    <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-5">
                        Found item not found
                    </h1>

                    <p className="text-gray-500 dark:text-gray-400 mt-3">
                        {error ||
                            "This found item could not be found."}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                companyRoute("/dashboard")
                            )
                        }
                        className="mt-7 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl font-bold transition"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================
    // STATUS
    // =========================================================

    const status = String(
        item.status || "Pending"
    ).toLowerCase();

    const isVerified = status === "verified";
    const isMatched = status === "matched";
    const isRecovered = status === "recovered";

    // =========================================================
    // IMAGE
    // =========================================================

    const imageUrl = item.image
        ? item.image.startsWith("http")
            ? item.image
            : `${API}${item.image}`
        : null;

    // =========================================================
    // BACK
    // =========================================================

    const handleBack = () => {
        navigate(companyRoute("/dashboard"));
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
                    className="mb-7 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                {/* MAIN CARD */}

                <div
                    className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden"
                    style={borderFillStyle}
                >
                    {/* HEADER */}

                    <div
                        className="p-6 md:p-8 border-b border-gray-200 dark:border-slate-700"
                        style={borderLineStyle}
                    >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                                        <Package
                                            size={25}
                                            className="text-green-600"
                                        />
                                    </div>

                                    <p className="text-sm font-bold tracking-widest text-green-600 uppercase">
                                        Found Item Report
                                    </p>
                                </div>

                                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mt-4 break-words">
                                    {item.item_name ||
                                        "Unnamed Item"}
                                </h1>

                                <p className="text-gray-500 dark:text-gray-400 mt-2">
                                    {item.category || "No category"}
                                </p>
                            </div>

                            {/* STATUS */}

                            <div>
                                <span
                                    className={`inline-flex px-5 py-3 rounded-full text-sm font-black ${
                                        isRecovered
                                            ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                                            : isMatched
                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                            : isVerified
                                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300"
                                    }`}
                                >
                                    {item.status || "Pending"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ITEM CONTENT */}

                    <div className="grid lg:grid-cols-2 gap-0">

                        {/* IMAGE */}

                        <div className="bg-gray-100 dark:bg-slate-800 p-6 md:p-8 flex items-center justify-center min-h-[400px]">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={`${
                                        item.item_name ||
                                        "Found item"
                                    } image`}
                                    className="w-full max-h-[520px] object-cover rounded-2xl shadow-lg"
                                />
                            ) : (
                                <div className="text-center">
                                    <div className="w-24 h-24 mx-auto rounded-3xl bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                                        <Package
                                            size={50}
                                            className="text-gray-400"
                                        />
                                    </div>

                                    <p className="mt-4 text-gray-500 dark:text-gray-400">
                                        No image uploaded
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* INFORMATION */}

                        <div className="p-6 md:p-8">

                            {/* ITEM NAME */}

                            <div
                                className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-2xl p-5 mb-7"
                                style={borderFillStyle}
                            >
                                <p className="text-sm text-green-600 dark:text-green-400 font-bold uppercase tracking-wide">
                                    Item Name
                                </p>

                                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mt-1">
                                    {item.item_name ||
                                        "Unnamed Item"}
                                </h2>
                            </div>

                            {/* DESCRIPTION */}

                            <div className="mb-7">
                                <h3 className="text-sm font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Description
                                </h3>

                                <p className="mt-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {item.description ||
                                        "No description provided."}
                                </p>
                            </div>

                            {/* DETAILS */}

                            <div className="grid sm:grid-cols-2 gap-5">
                                <Detail
                                    icon={
                                        <MapPin
                                            size={18}
                                            className="text-blue-600"
                                        />
                                    }
                                    title="Location Found"
                                    value={item.location_found}
                                    borderFillStyle={borderFillStyle}
                                />

                                <Detail
                                    icon={
                                        <Calendar
                                            size={18}
                                            className="text-green-600"
                                        />
                                    }
                                    title="Date Found"
                                    value={item.date_found}
                                    borderFillStyle={borderFillStyle}
                                />

                                <Detail
                                    icon={
                                        <Clock
                                            size={18}
                                            className="text-purple-600"
                                        />
                                    }
                                    title="Time Found"
                                    value={
                                        item.time_found ||
                                        "Not provided"
                                    }
                                    borderFillStyle={borderFillStyle}
                                />

                                <Detail
                                    icon={
                                        <User
                                            size={18}
                                            className="text-yellow-600"
                                        />
                                    }
                                    title="Finder"
                                    value={
                                        item.finder_name ||
                                        "Not provided"
                                    }
                                    borderFillStyle={borderFillStyle}
                                />

                                <Detail
                                    icon={
                                        <Phone
                                            size={18}
                                            className="text-blue-600"
                                        />
                                    }
                                    title="Finder Phone"
                                    value={
                                        item.finder_phone ||
                                        "Not provided"
                                    }
                                    borderFillStyle={borderFillStyle}
                                />

                                <Detail
                                    icon={
                                        <Mail
                                            size={18}
                                            className="text-red-600"
                                        />
                                    }
                                    title="Finder Email"
                                    value={
                                        item.finder_email ||
                                        "Not provided"
                                    }
                                    borderFillStyle={borderFillStyle}
                                />
                            </div>
                        </div>
                    </div>

                    {/* VERIFIED NOTICE */}

                    {isVerified && (
                        <div className="mx-6 md:mx-8 mb-8">
                            <div
                                className="rounded-3xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 p-6"
                                style={borderFillStyle}
                            >
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                                        <ShieldCheck
                                            size={25}
                                            className="text-purple-600"
                                        />
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-black text-purple-800 dark:text-purple-300">
                                            Found item verified
                                        </h2>

                                        <p className="text-purple-700 dark:text-purple-400 mt-2">
                                            This item has been verified
                                            by staff and is currently
                                            available for matching with
                                            lost-item reports.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MATCHED NOTICE */}

                    {isMatched && (
                        <div className="mx-6 md:mx-8 mb-8">
                            <div
                                className="rounded-3xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-6"
                                style={borderFillStyle}
                            >
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                                        <Package
                                            size={25}
                                            className="text-blue-600"
                                        />
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-black text-blue-800 dark:text-blue-300">
                                            This item has been matched
                                        </h2>

                                        <p className="text-blue-700 dark:text-blue-400 mt-2">
                                            This found item has been
                                            matched with a customer's
                                            lost-item report.
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    companyRoute(
                                                        "/dashboard"
                                                    )
                                                )
                                            }
                                            className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black transition"
                                        >
                                            View Dashboard →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RECOVERED NOTICE */}

                    {isRecovered && (
                        <div className="mx-6 md:mx-8 mb-8">
                            <div
                                className="rounded-3xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 p-6"
                                style={borderFillStyle}
                            >
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                                        <CheckCircle
                                            size={25}
                                            className="text-green-600"
                                        />
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-black text-green-800 dark:text-green-300">
                                            Item Recovered
                                        </h2>

                                        <p className="text-green-700 dark:text-green-400 mt-2">
                                            This found item has already
                                            been successfully recovered.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VERIFICATION INFORMATION */}

                    {item.verified_by && (
                        <div className="mx-6 md:mx-8 mb-8">
                            <div
                                className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6"
                                style={borderFillStyle}
                            >
                                <div className="flex items-center gap-3">
                                    <ShieldCheck
                                        size={24}
                                        className="text-blue-600"
                                    />

                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">
                                        Verification Information
                                    </h2>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-5 mt-5">
                                    <Detail
                                        icon="👮"
                                        title="Verified By"
                                        value={
                                            item.verified_by_name ||
                                            item.verified_by ||
                                            "Staff"
                                        }
                                        borderFillStyle={borderFillStyle}
                                    />

                                    <Detail
                                        icon="🕐"
                                        title="Verified At"
                                        value={
                                            item.verified_at ||
                                            "Recorded in system"
                                        }
                                        borderFillStyle={borderFillStyle}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FOOTER ACTIONS */}

                    <div
                        className="p-6 md:p-8 border-t border-gray-200 dark:border-slate-700"
                        style={borderLineStyle}
                    >
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-7 py-4 rounded-xl font-black transition"
                            >
                                <ArrowLeft size={20} />
                                Back
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        companyRoute("/dashboard")
                                    )
                                }
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-7 py-4 rounded-xl font-black transition"
                            >
                                Dashboard
                            </button>
                        </div>
                    </div>
                </div>

                {/* REPORT ID */}

                <div className="text-center mt-7 text-sm text-gray-500 dark:text-gray-400">
                    Found Item ID:{" "}
                    <span className="font-bold">
                        #{item.id}
                    </span>
                </div>
            </div>
        </div>
    );
}

// =============================================================
// DETAIL COMPONENT
// =============================================================

function Detail({
    icon,
    title,
    value,
    borderFillStyle = {},
}) {
    return (
        <div
            className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 border border-transparent"
            style={borderFillStyle}
        >
            <div className="flex items-center gap-2">
                <span className="shrink-0">{icon}</span>

                <p className="text-xs uppercase tracking-wide font-black text-gray-500 dark:text-gray-400">
                    {title}
                </p>
            </div>

            <p className="mt-2 font-semibold text-gray-800 dark:text-gray-200 break-words">
                {value || "Not provided"}
            </p>
        </div>
    );
}

export default FoundItemDetails;