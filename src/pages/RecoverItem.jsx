import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    QRCodeCanvas,
} from "qrcode.react";


// ============================================================
// API
// ============================================================

import { API } from "../config";
// ============================================================
// GET STORED OBJECT
// ============================================================

function getStoredObject(key) {
    try {
        const value = localStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : null;

    } catch {
        return null;
    }
}


// ============================================================
// COMPONENT
// ============================================================

function RecoverItem() {

    const {
        id,
        companySlug,
    } = useParams();

    const navigate = useNavigate();


    // ========================================================
    // COMPANY
    // ========================================================

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


    // ========================================================
    // TOKEN
    // ========================================================

    const access =
        localStorage.getItem("access_token") ||
        localStorage.getItem("access");


    // ========================================================
    // COMPANY ROUTE
    // ========================================================

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


    // ========================================================
    // STATE
    // ========================================================

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    // ========================================================
    // AUTH CHECK
    // ========================================================

    useEffect(() => {

        if (!access) {

            navigate(
                companyRoute("/login-page"),
                {
                    replace: true,
                }
            );

        }

    }, [
        access,
        navigate,
        companyRoute,
    ]);


    // ========================================================
    // LOAD RECOVERY DETAILS
    // ========================================================

    const fetchRecoveryDetails = useCallback(
        async () => {

            if (!access || !id) {
                return;
            }

            try {

                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API}/matches/${id}/recovery/`,
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${access}`,

                            "Content-Type":
                                "application/json",
                        },
                    }
                );


                // ==================================================
                // AUTH FAILURE
                // ==================================================

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {

                    localStorage.removeItem("access");
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh");
                    localStorage.removeItem("refresh_token");
                    localStorage.removeItem("user");

                    navigate(
                        companyRoute("/login-page"),
                        {
                            replace: true,
                        }
                    );

                    return;
                }


                const data = await response.json();

                console.log(
                    "RECOVERY DETAILS:",
                    data
                );


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        data.detail ||
                        data.message ||
                        "Unable to load recovery details."
                    );

                }


                setMatch(data);

            } catch (err) {

                console.error(
                    "Recovery details error:",
                    err
                );

                setError(
                    err.message ||
                    "Unable to load recovery details."
                );

            } finally {

                setLoading(false);

            }

        },
        [
            access,
            id,
            navigate,
            companyRoute,
        ]
    );


    // ========================================================
    // INITIAL FETCH
    // ========================================================

    useEffect(() => {

        if (access && id) {

            fetchRecoveryDetails();

        } else {

            setError(
                "Your session has expired. Please log in again."
            );

            setLoading(false);

        }

    }, [
        access,
        id,
        fetchRecoveryDetails,
    ]);


    // ========================================================
    // REQUEST RECOVERY
    // ========================================================

    const requestRecovery = async () => {

        if (!match) {
            return;
        }


        // STAFF APPROVAL

        if (
            String(match.status || "")
                .toLowerCase() !== "approved"
        ) {

            setError(
                "This match has not been approved by staff."
            );

            return;
        }


        // CUSTOMER ACCEPTANCE

        if (
            String(match.customer_response || "")
                .toLowerCase() !== "accepted"
        ) {

            setError(
                "You must accept the match before requesting recovery."
            );

            return;
        }


        // ALREADY RECOVERED

        if (
            String(match.status || "")
                .toLowerCase() === "recovered"
        ) {

            setError(
                "This item has already been recovered."
            );

            return;
        }


        try {

            setSubmitting(true);
            setError("");
            setSuccess("");


            const response = await fetch(
                `${API}/matches/${id}/recovery/`,
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${access}`,

                        "Content-Type":
                            "application/json",
                    },
                }
            );


            // AUTH FAILURE

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                localStorage.removeItem("access");
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("user");

                navigate(
                    companyRoute("/login-page"),
                    {
                        replace: true,
                    }
                );

                return;
            }


            const data = await response.json();


            console.log(
                "RECOVERY RESPONSE:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    data.detail ||
                    data.message ||
                    "Unable to send recovery request."
                );

            }


            setMatch(previous => ({
                ...previous,

                status:
                    data.status ||
                    "Recovery Requested",

                customer_response:
                    data.customer_response ||
                    previous.customer_response,

                recovery_code:
                    data.recovery_code ||
                    previous.recovery_code,

                recovery_qr_data:
                    data.recovery_qr_data ||
                    previous.recovery_qr_data,

                recovery_requested_at:
                    data.recovery_requested_at ||
                    previous.recovery_requested_at,

                recovery_verified:
                    data.recovery_verified ||
                    false,

                recovery_verified_at:
                    data.recovery_verified_at ||
                    null,
            }));


            setSuccess(
                data.message ||
                "Recovery request sent successfully."
            );


        } catch (err) {

            console.error(
                "Recovery request error:",
                err
            );

            setError(
                err.message ||
                "Unable to send recovery request."
            );

        } finally {

            setSubmitting(false);

        }

    };


    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 text-center">

                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />

                    <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                        Loading recovery details...
                    </p>

                </div>

            </div>

        );

    }


    // ========================================================
    // ERROR WITHOUT MATCH
    // ========================================================

    if (!match) {

        return (

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">

                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-7 max-w-md w-full text-center">

                    <div className="w-14 h-14 mx-auto rounded-xl bg-red-50 flex items-center justify-center">

                        <span className="text-2xl font-black text-red-600">
                            !
                        </span>

                    </div>

                    <h1 className="text-xl font-black mt-4 dark:text-white">
                        Unable to load recovery
                    </h1>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        {error || "Recovery details could not be found."}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                companyRoute(`/matches/${id}`)
                            )
                        }
                        className="mt-5 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                    >
                        ← Go Back
                    </button>

                </div>

            </div>

        );

    }


    // ========================================================
    // STATUS
    // ========================================================

    const status =
        String(match.status || "").toLowerCase();

    const customerResponse =
        String(match.customer_response || "").toLowerCase();

    const isApproved =
        status === "approved";

    const isRecoveryRequested =
        status === "recovery requested";

    const isRecovered =
        status === "recovered";

    const customerAccepted =
        customerResponse === "accepted";

    const hasRecovery =
        isRecoveryRequested ||
        Boolean(match.recovery_code) ||
        Boolean(match.recovery_qr_data);


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-5 px-4">

            <div className="max-w-5xl mx-auto">


                {/* ==================================================
                    BACK
                ================================================== */}

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            companyRoute(
                                `/matches/${match.id}`
                            )
                        )
                    }
                    className="mb-4 text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                    ← Back to Match
                </button>


                {/* ==================================================
                    MAIN CARD
                ================================================== */}

                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">


                    {/* ==================================================
                        HEADER — REDUCED
                    ================================================== */}

                    <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-5 py-5 md:px-6">

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                            <div>

                                <p className="text-blue-200 text-[11px] font-bold uppercase tracking-wide">
                                    Recovery Request
                                </p>

                                <h1 className="text-2xl md:text-3xl font-black mt-1">
                                    Recover Your Item
                                </h1>

                                <p className="text-blue-100 text-sm mt-1.5 max-w-xl">
                                    Review your recovery information and follow
                                    the instructions provided by Lost & Found staff.
                                </p>

                            </div>


                            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center">

                                <p className="text-[10px] text-blue-100 font-bold">
                                    MATCH STATUS
                                </p>

                                <p className="text-base font-black mt-0.5">
                                    {match.status}
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* ==================================================
                        ERROR
                    ================================================== */}

                    {error && (

                        <div className="mx-5 md:mx-6 mt-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-3">

                            <div className="flex gap-2">

                                <div className="font-black text-red-600">
                                    !
                                </div>

                                <p className="text-sm text-red-700 dark:text-red-300 font-semibold">
                                    {error}
                                </p>

                            </div>

                        </div>

                    )}


                    {/* ==================================================
                        SUCCESS
                    ================================================== */}

                    {success && (

                        <div className="mx-5 md:mx-6 mt-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl p-4">

                            <div className="flex gap-3">

                                <div className="w-8 h-8 shrink-0 rounded-lg bg-green-100 flex items-center justify-center">

                                    <span className="text-green-700 font-black">
                                        ✓
                                    </span>

                                </div>

                                <div>

                                    <h2 className="text-sm font-black text-green-700 dark:text-green-400">
                                        Recovery Request Sent
                                    </h2>

                                    <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                                        {success}
                                    </p>

                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                        Lost & Found staff have been notified.
                                    </p>

                                </div>

                            </div>

                        </div>

                    )}


                    {/* ==================================================
                        ITEM COMPARISON
                    ================================================== */}

                    <div className="grid lg:grid-cols-2 gap-4 p-5 md:p-6">


                        {/* ==================================================
                            LOST ITEM
                        ================================================== */}

                        <div className="border dark:border-slate-700 rounded-xl overflow-hidden">

                            <div className="bg-red-50 dark:bg-red-950/30 px-4 py-3">

                                <h2 className="text-base font-black text-red-600">
                                    Your Lost Item
                                </h2>

                            </div>


                            <div className="p-4">

                                {match.lost_item?.image ? (

                                    <img
                                        src={match.lost_item.image}
                                        alt={
                                            match.lost_item.item_name ||
                                            "Lost item"
                                        }
                                        className="w-full h-48 object-cover rounded-xl"
                                    />

                                ) : (

                                    <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-sm text-slate-400">
                                        No Image
                                    </div>

                                )}


                                <h3 className="text-xl font-black mt-4 dark:text-white">
                                    {match.lost_item?.item_name ||
                                        "Unknown Item"}
                                </h3>


                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {match.lost_item?.category ||
                                        "No category"}
                                </p>


                                <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">

                                    <p>
                                        <strong>Description:</strong>{" "}
                                        {match.lost_item?.description ||
                                            "Not provided"}
                                    </p>

                                    <p>
                                        <strong>Location Lost:</strong>{" "}
                                        {match.lost_item?.location ||
                                            "Not provided"}
                                    </p>

                                    <p>
                                        <strong>Date Lost:</strong>{" "}
                                        {match.lost_item?.date_lost ||
                                            "Not provided"}
                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* ==================================================
                            FOUND ITEM
                        ================================================== */}

                        <div className="border dark:border-slate-700 rounded-xl overflow-hidden">

                            <div className="bg-green-50 dark:bg-green-950/30 px-4 py-3">

                                <h2 className="text-base font-black text-green-600">
                                    Found Item
                                </h2>

                            </div>


                            <div className="p-4">

                                {match.found_item?.image ? (

                                    <img
                                        src={match.found_item.image}
                                        alt={
                                            match.found_item.item_name ||
                                            "Found item"
                                        }
                                        className="w-full h-48 object-cover rounded-xl"
                                    />

                                ) : (

                                    <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-sm text-slate-400">
                                        No Image
                                    </div>

                                )}


                                <h3 className="text-xl font-black mt-4 dark:text-white">
                                    {match.found_item?.item_name ||
                                        "Unknown Item"}
                                </h3>


                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {match.found_item?.category ||
                                        "No category"}
                                </p>


                                <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">

                                    <p>
                                        <strong>Description:</strong>{" "}
                                        {match.found_item?.description ||
                                            "Not provided"}
                                    </p>

                                    <p>
                                        <strong>Location Found:</strong>{" "}
                                        {match.found_item?.location_found ||
                                            "Not provided"}
                                    </p>

                                    <p>
                                        <strong>Date Found:</strong>{" "}
                                        {match.found_item?.date_found ||
                                            "Not provided"}
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* ==================================================
                        RECOVERY INFORMATION
                    ================================================== */}

                    <div className="px-5 md:px-6 pb-5">

                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">

                            <h2 className="text-base font-black dark:text-white">
                                Recovery Information
                            </h2>


                            <div className="grid md:grid-cols-3 gap-3 mt-3">

                                <Info
                                    title="Staff Approval"
                                    value={
                                        isApproved || hasRecovery
                                            ? "Approved"
                                            : match.status
                                    }
                                />

                                <Info
                                    title="Your Response"
                                    value={
                                        match.customer_response ||
                                        "Pending"
                                    }
                                />

                                <Info
                                    title="Recovery Status"
                                    value={
                                        isRecovered
                                            ? "Recovered"
                                            : hasRecovery
                                                ? "Recovery Requested"
                                                : "Recovery Pending"
                                    }
                                />

                            </div>

                        </div>

                    </div>


                    {/* ==================================================
                        RECOVERY CODE + QR
                    ================================================== */}

                    {hasRecovery && !isRecovered && (

                        <div className="px-5 md:px-6 pb-5">

                            <div className="border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 rounded-xl p-5">


                                <div className="text-center">

                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50">

                                        <span className="text-xl">
                                            ✓
                                        </span>

                                    </div>


                                    <h2 className="text-xl md:text-2xl font-black text-blue-700 dark:text-blue-400 mt-3">
                                        Recovery Pending Staff Verification
                                    </h2>


                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-xl mx-auto">
                                        Your recovery request has been sent.
                                        Bring your recovery code or QR code to
                                        the Lost & Found desk for verification.
                                    </p>

                                </div>


                                {/* CODE + QR */}

                                <div className="mt-5 grid md:grid-cols-2 gap-4">


                                    {/* RECOVERY CODE */}

                                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 text-center shadow-sm">

                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                            Recovery Code
                                        </p>


                                        <p className="text-3xl md:text-4xl font-black tracking-[0.2em] text-blue-700 dark:text-blue-400 mt-3 break-all">

                                            {match.recovery_code ||
                                                "------"}

                                        </p>


                                        {match.recovery_requested_at && (

                                            <p className="text-xs text-slate-500 mt-3">
                                                Requested{" "}
                                                {match.recovery_requested_at}
                                            </p>

                                        )}

                                    </div>


                                    {/* QR CODE */}

                                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 text-center shadow-sm">

                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                            Recovery QR Code
                                        </p>


                                        {match.recovery_qr_data ? (

                                            <div className="mt-3 flex flex-col items-center">

                                                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">

                                                    <QRCodeCanvas
                                                        value={
                                                            match.recovery_qr_data
                                                        }
                                                        size={160}
                                                        bgColor="#ffffff"
                                                        fgColor="#000000"
                                                        level="H"
                                                        includeMargin={true}
                                                    />

                                                </div>


                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
                                                    Scan this QR code at the
                                                    Lost & Found desk.
                                                </p>

                                            </div>

                                        ) : (

                                            <div className="mt-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">

                                                <p className="text-xs text-yellow-700 dark:text-yellow-300 font-semibold">
                                                    QR code is not available yet.
                                                </p>

                                            </div>

                                        )}

                                    </div>

                                </div>


                                {/* INSTRUCTIONS */}

                                <div className="mt-4 bg-white/70 dark:bg-slate-900/50 rounded-xl p-4">

                                    <h3 className="text-sm font-black text-slate-800 dark:text-white">
                                        What to bring
                                    </h3>

                                    <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">

                                        <li>
                                            ✓ Your 6-digit recovery code
                                        </li>

                                        <li>
                                            ✓ Your recovery QR code
                                        </li>

                                        <li>
                                            ✓ Be prepared to verify your identity
                                        </li>

                                    </ul>

                                </div>

                            </div>

                        </div>

                    )}


                    {/* ==================================================
                        REQUEST RECOVERY
                    ================================================== */}

                    {!hasRecovery && !isRecovered && (

                        <div className="px-5 md:px-6 pb-6">

                            <div className="border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 rounded-xl p-5">

                                <h2 className="text-xl font-black text-blue-700 dark:text-blue-400">
                                    Request Recovery
                                </h2>


                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                    By requesting recovery, you are asking
                                    Lost & Found staff to prepare the item
                                    for collection.
                                </p>


                                {!isApproved && (

                                    <div className="mt-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">

                                        <p className="text-xs text-yellow-800 dark:text-yellow-300 font-semibold">
                                            Staff approval is required before
                                            requesting recovery.
                                        </p>

                                    </div>

                                )}


                                {isApproved && !customerAccepted && (

                                    <div className="mt-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">

                                        <p className="text-xs text-yellow-800 dark:text-yellow-300 font-semibold">
                                            You must accept the match before
                                            you can request recovery.
                                        </p>


                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    companyRoute(
                                                        `/matches/${match.id}`
                                                    )
                                                )
                                            }
                                            className="mt-3 bg-yellow-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-yellow-600 transition"
                                        >
                                            Review Match & Accept
                                        </button>

                                    </div>

                                )}


                                {isApproved && customerAccepted && (

                                    <div className="mt-4">

                                        <button
                                            type="button"
                                            onClick={requestRecovery}
                                            disabled={submitting}
                                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-black hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            {submitting
                                                ? "Sending Recovery Request..."
                                                : "Request Item Recovery →"}
                                        </button>

                                    </div>

                                )}

                            </div>

                        </div>

                    )}


                    {/* ==================================================
                        ALREADY RECOVERED
                    ================================================== */}

                    {isRecovered && (

                        <div className="px-5 md:px-6 pb-6">

                            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-xl p-5">

                                <h2 className="text-xl font-black text-purple-700 dark:text-purple-400">
                                    Item Recovered
                                </h2>


                                <p className="text-sm mt-1.5 text-slate-600 dark:text-slate-300">
                                    This item has already been marked as recovered.
                                </p>


                                {match.recovered_by && (

                                    <p className="text-sm mt-3 text-slate-600 dark:text-slate-300">

                                        <strong>
                                            Recovered By:
                                        </strong>{" "}

                                        {match.recovered_by}

                                    </p>

                                )}


                                {match.recovered_at && (

                                    <p className="text-sm mt-1 text-slate-600 dark:text-slate-300">

                                        <strong>
                                            Recovered At:
                                        </strong>{" "}

                                        {match.recovered_at}

                                    </p>

                                )}

                            </div>

                        </div>

                    )}

                </div>

            </div>

        </div>

    );

}


// ============================================================
// INFO COMPONENT
// ============================================================

function Info({
    title,
    value,
}) {

    return (

        <div className="bg-white dark:bg-slate-900 rounded-lg p-3">

            <p className="text-[11px] font-bold text-slate-500">
                {title}
            </p>

            <p className="text-sm font-black mt-1 dark:text-white">
                {value}
            </p>

        </div>

    );

}


export default RecoverItem;