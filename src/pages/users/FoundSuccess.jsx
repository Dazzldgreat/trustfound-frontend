import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import QRCode from "react-qr-code";
import {
    CheckCircle,
    Clock,
    ShieldCheck,
    ScanLine,
} from "lucide-react";

import { API } from "../../config";
const DEFAULT_WEBSITE_SETTINGS = {
    primary_color: "#2563eb",
    secondary_color: "#1d4ed8",
    background_color: "#f3f4f6",
    text_color: "#374151",
    heading_color: "#111827",
    card_color: "#ffffff",
    button_text_color: "#ffffff",
    border_color: "#ffffff",
    border_line_color: "#e5e7eb",
    border_style: "solid",
    border_width: 1,
    border_radius: 16,
    content_width: 1024,
    font_family: "Inter",
};

const ALLOWED_BORDER_STYLES = [
    "solid",
    "dashed",
    "dotted",
    "double",
    "none",
];

const ALLOWED_FONTS = [
    "Inter",
    "Arial",
    "Roboto",
    "Poppins",
    "Montserrat",
    "Open Sans",
    "Lato",
    "system-ui",
    "Georgia",
    "Verdana",
];

function isValidColor(value) {
    if (typeof value !== "string") return false;

    return (
        /^#[0-9a-fA-F]{3,8}$/.test(value) ||
        /^rgba?\(\s*[\d.%\s,]+\)$/.test(value) ||
        /^hsla?\(\s*[\d.%\s,deg]+\)$/.test(value)
    );
}

function getValidColor(value, fallback) {
    return isValidColor(value) ? value : fallback;
}

function getValidNumber(value, fallback, min, max) {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) return fallback;

    return Math.min(max, Math.max(min, number));
}

function applyWebsiteTheme(settings = {}) {
    const source =
        settings?.settings ||
        settings?.website_settings ||
        settings?.websiteSettings ||
        settings;

    return {
        primary_color: getValidColor(
            source.primary_color,
            DEFAULT_WEBSITE_SETTINGS.primary_color
        ),
        secondary_color: getValidColor(
            source.secondary_color,
            DEFAULT_WEBSITE_SETTINGS.secondary_color
        ),
        background_color: getValidColor(
            source.background_color,
            DEFAULT_WEBSITE_SETTINGS.background_color
        ),
        text_color: getValidColor(
            source.text_color,
            DEFAULT_WEBSITE_SETTINGS.text_color
        ),
        heading_color: getValidColor(
            source.heading_color,
            DEFAULT_WEBSITE_SETTINGS.heading_color
        ),
        card_color: getValidColor(
            source.card_color,
            DEFAULT_WEBSITE_SETTINGS.card_color
        ),
        button_text_color: getValidColor(
            source.button_text_color,
            DEFAULT_WEBSITE_SETTINGS.button_text_color
        ),
        border_color: getValidColor(
            source.border_color,
            DEFAULT_WEBSITE_SETTINGS.border_color
        ),
        border_line_color: getValidColor(
            source.border_line_color,
            DEFAULT_WEBSITE_SETTINGS.border_line_color
        ),
        border_style: ALLOWED_BORDER_STYLES.includes(
            source.border_style
        )
            ? source.border_style
            : DEFAULT_WEBSITE_SETTINGS.border_style,
        border_width: getValidNumber(
            source.border_width,
            DEFAULT_WEBSITE_SETTINGS.border_width,
            0,
            10
        ),
        border_radius: getValidNumber(
            source.border_radius,
            DEFAULT_WEBSITE_SETTINGS.border_radius,
            0,
            100
        ),
        content_width: getValidNumber(
            source.content_width,
            DEFAULT_WEBSITE_SETTINGS.content_width,
            320,
            2000
        ),
        font_family: ALLOWED_FONTS.includes(source.font_family)
            ? source.font_family
            : DEFAULT_WEBSITE_SETTINGS.font_family,
    };
}

function getStoredObject(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

function FoundSuccess() {
    const { id, companySlug } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const storedCompany = getStoredObject("company");
    const storedUser = getStoredObject("user");

    const access =
        localStorage.getItem("access_token") ||
        localStorage.getItem("access");

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
    // WEBSITE SETTINGS
    // =========================================================

    const [websiteSettings, setWebsiteSettings] = useState(
        DEFAULT_WEBSITE_SETTINGS
    );

    useEffect(() => {
        let cancelled = false;

        const fetchWebsiteSettings = async () => {
            if (!activeCompanySlug) return;

            try {
                const response = await fetch(
                    `${API}/company/public/${encodeURIComponent(
                        activeCompanySlug
                    )}/website/`
                );

                if (!response.ok) return;

                const result = await response.json();

                if (!cancelled) {
                    setWebsiteSettings(applyWebsiteTheme(result));
                }
            } catch (error) {
                console.error(
                    "WEBSITE SETTINGS ERROR:",
                    error
                );
            }
        };

        fetchWebsiteSettings();

        return () => {
            cancelled = true;
        };
    }, [activeCompanySlug]);

    const themeStyle = {
        "--site-primary": websiteSettings.primary_color,
        "--site-secondary": websiteSettings.secondary_color,
        "--site-background": websiteSettings.background_color,
        "--site-text": websiteSettings.text_color,
        "--site-heading": websiteSettings.heading_color,
        "--site-card": websiteSettings.card_color,
        "--site-button-text": websiteSettings.button_text_color,
        "--site-border-fill": websiteSettings.border_color,
        "--site-border-line": websiteSettings.border_line_color,
        "--site-border-style": websiteSettings.border_style,
        "--site-border-width": `${websiteSettings.border_width}px`,
        "--site-radius": `${websiteSettings.border_radius}px`,
        "--site-content-width": `${websiteSettings.content_width}px`,
        "--site-font": `"${websiteSettings.font_family}", sans-serif`,
    };

    // =========================================================
    // STATE
    // =========================================================

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    const [scannedSuccessfully, setScannedSuccessfully] =
        useState(searchParams.get("scanned") === "success");

    const [checkingScan, setCheckingScan] = useState(false);

    // =========================================================
    // IMAGE
    // =========================================================

    const getImageUrl = (imagePath) => {
        if (!imagePath) return "";

        if (
            imagePath.startsWith("http://") ||
            imagePath.startsWith("https://")
        ) {
            return imagePath;
        }

        return `https://trustfound-backend.onrender.com${
            imagePath.startsWith("/")
                ? imagePath
                : `/${imagePath}`
        }`;
    };

    // =========================================================
    // FETCH ITEM
    // =========================================================

    const fetchItem = useCallback(async () => {
        if (!id) {
            console.error("Found item ID is missing.");
            navigate(companyRoute("/dashboard"));
            return;
        }

        if (!access) {
            alert("Your session has expired. Please login again.");
            navigate(companyRoute("/login-page"));
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API}/found-items/${id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${access}`,
                    },
                }
            );

            const data = await response.json();

            console.log("FOUND SUCCESS DATA:", data);

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.error ||
                    "Failed to load found item."
                );
            }

            setItem(data);

            if (
                data.scanned === true ||
                data.is_scanned === true ||
                data.qr_scanned === true ||
                data.verified === true ||
                data.verification_status === "scanned" ||
                data.verification_status === "verified"
            ) {
                setScannedSuccessfully(true);
            }
        } catch (error) {
            console.error("Error loading found item:", error);

            alert(error.message || "Unable to load found item.");

            navigate(companyRoute("/dashboard"));
        } finally {
            setLoading(false);
        }
    }, [id, access, navigate, companyRoute]);

    // =========================================================
    // LOAD ITEM
    // =========================================================

    useEffect(() => {
        fetchItem();
    }, [fetchItem]);

    // =========================================================
    // CHECK SCAN STATUS
    // =========================================================

    const checkScanStatus = useCallback(async () => {
        if (!id || !access) return;

        try {
            setCheckingScan(true);

            const response = await fetch(
                `${API}/found-items/${id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${access}`,
                    },
                }
            );

            if (!response.ok) return;

            const data = await response.json();

            console.log("SCAN STATUS:", data);

            setItem(data);

            if (
                data.scanned === true ||
                data.is_scanned === true ||
                data.qr_scanned === true ||
                data.verified === true ||
                data.verification_status === "scanned" ||
                data.verification_status === "verified"
            ) {
                setScannedSuccessfully(true);
            }
        } catch (error) {
            console.error("SCAN STATUS ERROR:", error);
        } finally {
            setCheckingScan(false);
        }
    }, [id, access]);

    // =========================================================
    // AUTOMATIC STATUS CHECK
    // =========================================================

    useEffect(() => {
        if (!id || !access || scannedSuccessfully) return;

        const interval = setInterval(() => {
            checkScanStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, [id, access, scannedSuccessfully, checkScanStatus]);

    // =========================================================
    // SCANNED STATUS
    // =========================================================

    const statusIsScanned = scannedSuccessfully;

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div
                className="found-success-theme min-h-screen flex items-center justify-center px-4"
                style={{
                    ...themeStyle,
                    backgroundColor: "var(--site-background)",
                    color: "var(--site-text)",
                    fontFamily: "var(--site-font)",
                }}
            >
                <style>{`
                    .found-success-theme {
                        background: var(--site-background);
                        color: var(--site-text);
                        font-family: var(--site-font);
                    }
                    .found-success-theme .site-heading {
                        color: var(--site-heading);
                    }
                `}</style>

                <div className="text-center">
                    <div
                        className="w-14 h-14 mx-auto rounded-full border-4 animate-spin"
                        style={{
                            borderColor: "var(--site-primary)",
                            borderTopColor: "transparent",
                        }}
                    />

                    <h2 className="text-xl font-bold mt-5 site-heading">
                        Loading submission...
                    </h2>

                    <p className="mt-2 opacity-70">
                        Please wait while we retrieve your submission.
                    </p>
                </div>
            </div>
        );
    }

    // =========================================================
    // ITEM NOT FOUND
    // =========================================================

    if (!item) {
        return (
            <div
                className="found-success-theme min-h-screen flex items-center justify-center px-4"
                style={{
                    ...themeStyle,
                    backgroundColor: "var(--site-background)",
                    color: "var(--site-text)",
                    fontFamily: "var(--site-font)",
                }}
            >
                <style>{`
                    .found-success-theme {
                        background: var(--site-background);
                        color: var(--site-text);
                        font-family: var(--site-font);
                    }
                    .found-success-theme .site-heading {
                        color: var(--site-heading);
                    }
                    .found-success-theme .site-button {
                        background: var(--site-primary);
                        color: var(--site-button-text);
                        border-radius: var(--site-radius);
                    }
                `}</style>

                <div className="text-center">
                    <h2 className="text-xl font-bold site-heading">
                        Found item could not be loaded.
                    </h2>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(companyRoute("/dashboard"))
                        }
                        className="site-button mt-5 px-6 py-3 font-semibold"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // =========================================================
    // QR VALUE
    // =========================================================

    const qrValue = item.verification_token
        ? `${API}/staff/verify-found-item/${item.verification_token}/`
        : "";

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div
            className="found-success-theme min-h-screen py-10 px-4 sm:px-6"
            style={{
                ...themeStyle,
                backgroundColor: "var(--site-background)",
                color: "var(--site-text)",
                fontFamily: "var(--site-font)",
            }}
        >
            <style>{`
                .found-success-theme {
                    background: var(--site-background);
                    color: var(--site-text);
                    font-family: var(--site-font);
                }

                .found-success-theme .site-card {
                    background: var(--site-card);
                    border-color: var(--site-border-line);
                    border-style: var(--site-border-style);
                    border-width: var(--site-border-width);
                    border-radius: var(--site-radius);
                }

                .found-success-theme .site-heading {
                    color: var(--site-heading);
                }

                .found-success-theme .site-text {
                    color: var(--site-text);
                }

                .found-success-theme .site-muted {
                    color: var(--site-text);
                    opacity: 0.72;
                }

                .found-success-theme .site-surface {
                    background: var(--site-border-fill);
                    border-color: var(--site-border-line);
                    border-style: var(--site-border-style);
                    border-width: var(--site-border-width);
                    border-radius: var(--site-radius);
                }

                .found-success-theme .site-primary-surface {
                    background: var(--site-primary);
                    color: var(--site-button-text);
                }

                .found-success-theme .site-button {
                    background: var(--site-primary);
                    color: var(--site-button-text);
                    border-radius: var(--site-radius);
                    transition: background-color 0.2s ease;
                }

                .found-success-theme .site-button:hover {
                    background: var(--site-secondary);
                }

                .found-success-theme .site-success {
                    background: var(--site-border-fill);
                    border-color: var(--site-border-line);
                    border-style: var(--site-border-style);
                    border-width: var(--site-border-width);
                    border-radius: var(--site-radius);
                }

                .found-success-theme .site-field-line {
                    border-color: var(--site-border-line);
                    border-style: var(--site-border-style);
                    border-width: var(--site-border-width);
                }
            `}</style>

            <div
                className="mx-auto w-full"
                style={{
                    maxWidth: "var(--site-content-width)",
                }}
            >
                {/* SCANNED SUCCESS MESSAGE */}

                {scannedSuccessfully && (
                    <div className="site-success mb-8 p-7 shadow-lg">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center shrink-0 shadow-md"
                                style={{
                                    backgroundColor: "var(--site-primary)",
                                }}
                            >
                                <CheckCircle
                                    size={48}
                                    className="text-white"
                                />
                            </div>

                            <div className="flex-1">
                                <h2 className="text-2xl md:text-3xl font-black site-heading">
                                    Scanned Successfully
                                </h2>

                                <p className="site-muted mt-2 text-lg">
                                    Your found item QR code has been successfully scanned by staff.
                                </p>

                                <div className="flex items-center justify-center sm:justify-start gap-2 mt-4 text-sm font-semibold">
                                    <ShieldCheck size={18} />
                                    <span>
                                        Staff verification completed
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SUCCESS CARD */}

                <div className="site-card shadow-xl overflow-hidden">
                    {/* HEADER */}

                    <div
                        className="p-8 site-primary-surface"
                        style={{
                            backgroundColor: statusIsScanned
                                ? "var(--site-primary)"
                                : "var(--site-primary)",
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shrink-0">
                                <CheckCircle
                                    size={48}
                                    style={{
                                        color: "var(--site-primary)",
                                    }}
                                />
                            </div>

                            <div>
                                <h1 className="text-3xl font-bold">
                                    Found Item Submitted Successfully
                                </h1>

                                <p className="opacity-90 mt-2">
                                    Thank you for helping return a lost item.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* BODY */}

                    <div className="grid lg:grid-cols-2 gap-10 p-6 md:p-10">
                        {/* ITEM INFORMATION */}

                        <div>
                            <h2 className="text-2xl font-bold mb-6 site-heading">
                                Item Information
                            </h2>

                            {item.image ? (
                                <img
                                    src={getImageUrl(item.image)}
                                    alt={item.item_name || "Found item"}
                                    className="w-full h-80 object-cover"
                                    style={{
                                        borderRadius: "var(--site-radius)",
                                        border: "var(--site-border-width) var(--site-border-style) var(--site-border-line)",
                                    }}
                                />
                            ) : (
                                <div
                                    className="w-full h-80 flex items-center justify-center site-surface site-muted"
                                >
                                    No Image Uploaded
                                </div>
                            )}

                            <div className="mt-8 space-y-4">
                                <div className="flex justify-between gap-5">
                                    <span className="font-semibold">
                                        Item Name
                                    </span>
                                    <span className="text-right">
                                        {item.item_name || "—"}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-5">
                                    <span className="font-semibold">
                                        Category
                                    </span>
                                    <span className="text-right">
                                        {item.category || "—"}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-5">
                                    <span className="font-semibold">
                                        Location Found
                                    </span>
                                    <span className="text-right">
                                        {item.location_found ||
                                            item.location ||
                                            "—"}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-5">
                                    <span className="font-semibold">
                                        Date Found
                                    </span>
                                    <span className="text-right">
                                        {item.date_found || "—"}
                                    </span>
                                </div>

                                {item.time_found && (
                                    <div className="flex justify-between gap-5">
                                        <span className="font-semibold">
                                            Time Found
                                        </span>
                                        <span className="text-right">
                                            {item.time_found}
                                        </span>
                                    </div>
                                )}

                                <div>
                                    <p className="font-semibold mb-2">
                                        Description
                                    </p>
                                    <p className="site-muted">
                                        {item.description ||
                                            "No description provided."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* VERIFICATION */}

                        <div>
                            <h2 className="text-2xl font-bold mb-6 site-heading">
                                Staff Verification QR
                            </h2>

                            {scannedSuccessfully ? (
                                /* SCANNED SUCCESS STATE */

                                <div className="site-success p-8">
                                    <div className="flex flex-col items-center text-center">
                                        <div
                                            className="w-24 h-24 rounded-full flex items-center justify-center"
                                            style={{
                                                backgroundColor: "var(--site-primary)",
                                            }}
                                        >
                                            <CheckCircle
                                                size={60}
                                                className="text-white"
                                            />
                                        </div>

                                        <h3 className="text-2xl font-black site-heading mt-6">
                                            QR Code Scanned Successfully
                                        </h3>

                                        <p className="site-muted mt-3">
                                            Staff has successfully scanned your submission.
                                        </p>

                                        <div
                                            className="mt-6 w-full p-5 site-surface"
                                        >
                                            <div className="flex items-center justify-center gap-2 font-bold">
                                                <ShieldCheck size={20} />
                                                Verification Confirmed
                                            </div>

                                            <p className="site-muted text-sm mt-2">
                                                Your found item has been presented to staff for verification and custody processing.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* QR WAITING STATE */

                                <div className="site-surface p-8 flex flex-col items-center">
                                    {qrValue ? (
                                        <div
                                            className="bg-white p-4"
                                            style={{
                                                borderRadius: "var(--site-radius)",
                                            }}
                                        >
                                            <QRCode
                                                value={qrValue}
                                                size={240}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-[240px] h-[240px] flex items-center justify-center text-center p-5 site-surface site-muted">
                                            Verification QR is not available.
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 mt-6">
                                        <ScanLine
                                            size={22}
                                            style={{
                                                color: "var(--site-primary)",
                                            }}
                                        />

                                        <p className="font-semibold">
                                            Waiting for Staff to Scan
                                        </p>
                                    </div>

                                    <p className="site-muted text-sm text-center mt-2">
                                        Scan this QR Code at the Lost & Found Office.
                                    </p>

                                    {checkingScan && (
                                        <div
                                            className="flex items-center gap-2 mt-4 text-sm"
                                            style={{
                                                color: "var(--site-primary)",
                                            }}
                                        >
                                            <Clock size={16} />
                                            Checking scan status...
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* RECEIPT */}

                            <div className="mt-8 p-6 site-surface">
                                <h3 className="font-bold text-lg mb-4 site-heading">
                                    Submission Receipt
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between gap-4">
                                        <span>Submission ID</span>
                                        <span className="font-bold">
                                            FD-
                                            {String(item.id).padStart(5, "0")}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-4">
                                        <span>Status</span>
                                        <span
                                            className="font-bold text-right"
                                            style={{
                                                color: statusIsScanned
                                                    ? "var(--site-primary)"
                                                    : "var(--site-secondary)",
                                            }}
                                        >
                                            {statusIsScanned
                                                ? "Scanned Successfully"
                                                : "Pending Staff Verification"}
                                        </span>
                                    </div>

                                    {activeCompanySlug && (
                                        <div className="flex justify-between gap-4">
                                            <span>Company</span>
                                            <span className="font-semibold text-right">
                                                {activeCompanySlug}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* NEXT STEPS */}

                            <div className="mt-8 p-6 site-surface">
                                <h3 className="font-bold mb-4 site-heading">
                                    What Happens Next?
                                </h3>

                                <ol className="space-y-3 list-decimal list-inside">
                                    <li>
                                        Bring the found item to the Lost & Found Office.
                                    </li>
                                    <li>
                                        Present this QR Code to a staff member.
                                    </li>
                                    <li>
                                        Staff scans the QR Code.
                                    </li>
                                    <li>
                                        Staff verifies the item is now in official custody.
                                    </li>
                                    <li>
                                        The system automatically compares your item against reported lost items.
                                    </li>
                                    <li>
                                        If a match is found, the owner will be notified.
                                    </li>
                                </ol>
                            </div>

                            {/* BUTTONS */}

                            <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="site-surface site-text flex-1 py-4 font-semibold"
                                >
                                    Print Receipt
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(companyRoute("/dashboard"))
                                    }
                                    className="site-button flex-1 py-4 font-semibold"
                                >
                                    Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FoundSuccess;
